import torch
import math
import json
from transformers import AutoTokenizer, AutoModelForCausalLM
from datasets import load_dataset
from peft import LoraConfig
from trl import SFTTrainer, SFTConfig
import transformers

GPU_ID = 1  
device = torch.device(f"cuda:{GPU_ID}")
torch.cuda.set_device(device)

print("\n" + "="*80)
print("🖥️  GPU CONFIGURATION")
print("="*80)
for i in range(torch.cuda.device_count()):
    print(f"Device {i}: {torch.cuda.get_device_name(i)}")
print(f"\n✅ Using GPU {GPU_ID}: {torch.cuda.get_device_name(GPU_ID)}")
print(f"Current CUDA device: {torch.cuda.current_device()}")
print("="*80 + "\n")


model_id = "google/gemma-3-270m-it"
new_model_name = "gemma3-270m-training-v1"
data_file = "data.jsonl" 

tokenizer = AutoTokenizer.from_pretrained(model_id)
tokenizer.pad_token = tokenizer.eos_token
tokenizer.padding_side = "right"

model = AutoModelForCausalLM.from_pretrained(
    model_id,
    torch_dtype=torch.bfloat16, 
    device_map={"": GPU_ID}, 
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

print("=== SAVING TEST SET ===\n")
with open("test_holdout.jsonl", "w", encoding="utf-8") as f:
    for example in test_raw:
        json.dump(example, f, ensure_ascii=False)
        f.write("\n")

def format_chat_template(example):
    text = tokenizer.apply_chat_template(
        example["messages"],
        tokenize=False,
        add_generation_prompt=False
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

target_modules = ["q_proj", "o_proj", "k_proj", "v_proj", "gate_proj", "up_proj", "down_proj"]
print(f"Target modules for LoRA: {target_modules}")

lora_config = LoraConfig(
    r=8,
    lora_alpha=16,
    target_modules=target_modules,
    lora_dropout=0.05,
    task_type="CAUSAL_LM"
)

training_args = SFTConfig(
    output_dir=f"./{new_model_name}",
    dataset_text_field="text",
    max_length=2048, 
    per_device_train_batch_size=2,
    gradient_accumulation_steps=4,
    learning_rate=2e-4,
    num_train_epochs=10, 
    logging_steps=100,
    save_strategy="epoch",
    report_to="none"
)

trainer = SFTTrainer(
    model=model,
    train_dataset=train_dataset,
    eval_dataset=val_dataset,
    peft_config=lora_config,
    args=training_args,
    processing_class=tokenizer 
)

print("=== STARTING LORA TRAINING ===\n")
trainer.train()

print("=== SAVING MODEL ===\n")
trainer.model.save_pretrained(f"{new_model_name}")
tokenizer.save_pretrained(f"{new_model_name}")

print("\nModel successfully saved!")