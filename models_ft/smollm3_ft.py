# Import required libraries for fine-tuning
from transformers import AutoModelForCausalLM, AutoTokenizer
from trl import SFTTrainer, SFTConfig
from datasets import load_dataset
import torch
from peft import LoraConfig
import json 
import math

# ======================
# DEVICE SETUP 
# ======================
GPU_ID = 1 
device = torch.device(f"cuda:{GPU_ID}")
torch.cuda.set_device(device)

# 1. Set base config
print("=== BASE CONFIG ===\n")
base_model_name = "HuggingFaceTB/SmolLM3-3B"
new_model_name = "SmolLM3-Custom-SFT-v2-n"
lora_output_dir = f"./{new_model_name}-v2-lora-adapters-n"
data_file = "data.jsonl"

# 2. Load model and tokenizer
print("=== LOAD MODEL AND TOKENIZER ===\n")
print(f"Loading base model: {base_model_name}")
model = AutoModelForCausalLM.from_pretrained(
    base_model_name,
    torch_dtype=torch.bfloat16,
    device_map={"": GPU_ID},   
)

tokenizer = AutoTokenizer.from_pretrained(base_model_name)
tokenizer.pad_token = tokenizer.eos_token
tokenizer.padding_side = "right"

print(f"Model loaded! Parameters: {model.num_parameters():,}")

print("=== FINDING LINEAR MODULES ===\n")

def find_target_modules(model, exclude_names=None):
    exclude_names = exclude_names or {'lm_head', 'embed_tokens', 'wte', 'wpe', 'ln_f'}
    target_modules = set()
    for name, module in model.named_modules():
        if isinstance(module, torch.nn.Linear):
            target_modules.add(name.split('.')[-1])
    return list(target_modules - exclude_names)

target_modules = find_target_modules(model)
print(f"Target modules for LoRA: {target_modules}")

print("=== DEFINING PEFT CONFIG ===\n")
peft_config = LoraConfig(
    r=8,
    lora_alpha=16,
    target_modules=target_modules,
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM",
)

print("=== PREPARING DATASET ===\n")
raw_dataset = load_dataset("json", data_files=data_file)["train"]
print(f"Total examples in dataset: {len(raw_dataset)}")
print("Example raw item:")
print(raw_dataset[0])
print("\n")

split1 = raw_dataset.train_test_split(test_size=0.10, seed=42)
train_val_raw = split1["train"]
test_raw = split1["test"]

split2 = train_val_raw.train_test_split(test_size=0.1666667, seed=42)
train_raw = split2["train"]
val_raw = split2["test"]

print(f"Train size: {len(train_raw)} (~75%)")
print(f"Validation size: {len(val_raw)} (~15%)")
print(f"Test size: {len(test_raw)} (~10%)")

# 7. Save test set for future comparisons
print("=== SAVING TEST SET ===\n")
with open("test_holdout.jsonl", "w", encoding="utf-8") as f:
    for example in test_raw:
        json.dump(example, f, ensure_ascii=False)
        f.write("\n")

print("=== SETTING CHAT TEMPLATE ===\n")

def format_chat_template(example):
    """
    Convert example["messages"] to a text string using chat_template defined above    """
    if "messages" in example:
        messages = example["messages"]
    else:
        # fallback per dataset tipo instruction / response
        messages = [
            {"role": "user", "content": example["instruction"]},
            {"role": "assistant", "content": example["response"]},
        ]

    text = tokenizer.apply_chat_template(
        messages,
        tokenize=False,
        add_generation_prompt=False,  # During trainig don't use generation prompt
    )
    return {"text": text}

print("=== FORMATTING CHAT TEMPLATE ===\n")
train_dataset = train_raw.map(format_chat_template)
val_dataset = val_raw.map(format_chat_template)

def keep_text_only(ds):
    return ds.remove_columns([c for c in ds.column_names if c != "text"])

train_dataset = keep_text_only(train_dataset)
val_dataset = keep_text_only(val_dataset)

print("Formatted train example:\n")
print(train_dataset[0]["text"][:5000])
print("\n")

print("=== CONFIGURING SFT TRAINER ===\n")
# Configure training parameters
training_config = SFTConfig(
    output_dir=f"./{new_model_name}",
    dataset_text_field="text",
    max_length=2048,
    
    per_device_train_batch_size=2, 
    gradient_accumulation_steps=4,
    learning_rate=5e-5,
    num_train_epochs=10,  
    save_strategy="epoch",             

    warmup_steps=50,
    weight_decay=0.01,
    optim="adamw_torch",
    
    logging_steps=100,
    eval_steps=100,
    save_total_limit=None,
    
    dataloader_num_workers=0,
    group_by_length=True,  
    
    push_to_hub=False,  
    hub_model_id=f"your-username/{new_model_name}",
    
    report_to=["trackio"],  
    run_name=f"{new_model_name}-training-v2",
)

print("Training configuration set!")
print(f"Effective batch size: {training_config.per_device_train_batch_size * training_config.gradient_accumulation_steps}")

lora_trainer = SFTTrainer(
    model=model,
    train_dataset=train_dataset,  
    eval_dataset=val_dataset, 
    args=training_config,
    peft_config=peft_config,  
)

print("=== STARTING LORA TRAINING ===\n")
lora_trainer.train()

print("=== SAVING MODEL ===\n")

lora_output_dir = f"./{new_model_name}-lora-adapters"
lora_trainer.model.save_pretrained(lora_output_dir)
tokenizer.save_pretrained(lora_output_dir)
print(f"✅ LoRA adapters saved to: {lora_output_dir}")