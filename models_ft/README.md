# Fine-Tuning Scripts

This folder contains the LoRA fine-tuning scripts used to train the three Small Language Models (SLMs) at the core of **LIRA** - a personal finance chatbot for Italian language. These scripts adapt compact open-weight models to the financial domain using Supervised Fine-Tuning (SFT) with LoRA adapters, achieving BERTScore F1 improvements of **+7.0% to +11.7%** over few-shot baselines.

---

## 📄 Files

| Script | Base Model | Parameters |
|---|---|---|
| `train_smollm3.py` | [HuggingFaceTB/SmolLM3-3B](https://huggingface.co/HuggingFaceTB/SmolLM3-3B) | 3B |
| `train_gemma3_1b.py` | [google/gemma-3-1b-it](https://huggingface.co/google/gemma-3-1b-it) | 1B |
| `train_gemma3_270m.py` | [google/gemma-3-270m-it](https://huggingface.co/google/gemma-3-270m-it) | 270M |

---

## 📦 Dataset

All scripts expect a `data.jsonl` file in the same directory - the LIRA domain-specific dataset of **1,740 question–answer pairs** derived from CONSOB's "Investor Education" materials, covering financial planning, investments, risk management, and investor protection.

Each entry must follow the standard chat messages format:

```json
{
  "messages": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```

The dataset is split automatically at runtime:

| Split | Size |
|---|---|
| Train | ~75% (≈ 1,305 examples) |
| Validation | ~15% (≈ 261 examples) |
| Test (holdout) | ~10% (≈ 174 examples) |


---

## ⚙️ Training Configuration

All scripts share the same core setup:

| Parameter | Value |
|---|---|
| Method | LoRA (Low-Rank Adaptation) |
| LoRA rank `r` | 8 |
| `lora_alpha` | 16 |
| `lora_dropout` | 0.05 |
| Precision | `bfloat16` |
| Per-device batch size | 2 |
| Gradient accumulation steps | 4 (effective batch = 8) |
| Epochs | 10 |
| Max sequence length | 2048 tokens |
| Optimizer | AdamW |

**Learning rates:**

- `SmolLM3 3B` → `5e-5`
- `Gemma 3 1B` and `Gemma 3 270M` → `2e-4`

**LoRA target modules:**

- `SmolLM3`: auto-detected linear layers (excluding `lm_head`, `embed_tokens`, `wte`, `wpe`)
- `Gemma models`: `q_proj`, `k_proj`, `v_proj`, `o_proj`, `gate_proj`, `up_proj`, `down_proj`

---

## 🛠️ Requirements

```bash
pip install transformers trl peft datasets torch
```

A CUDA-capable GPU with at least **16 GB VRAM** is recommended. All scripts use `bfloat16` and require an Ampere GPU or newer (e.g. NVIDIA A6000).

Each script targets a specific GPU via the `GPU_ID` variable at the top of the file - edit as needed before running.

---

## 🚀 Usage

```bash
python train_smollm3.py
python train_gemma3_1b.py
python train_gemma3_270m.py
```

Each script will:

1. Load the base model and tokenizer
2. Prepare and split the dataset (75 / 15 / 10)
3. Save `test_holdout.jsonl`
4. Apply the chat template and run LoRA fine-tuning
5. Save LoRA adapters to a local output directory

---

## 💾 Output & Deployment

After training, LoRA adapters are saved locally and can be merged or quantized for deployment. The fine-tuned models used in LIRA are hosted on Hugging Face in **quantized GGUF format** for on-device inference via `llama.rn`:

| Model | Hugging Face |
|---|---|
| SmolLM3 3B | [Stee201/gguf-server-smollm3](https://huggingface.co/Stee201/gguf-server-smollm3) |
| Gemma 3 1B | [Stee201/gguf-server-q](https://huggingface.co/Stee201/gguf-server-q) |
| Gemma 3 270M | [Stee201/gguf-server-q270](https://huggingface.co/Stee201/gguf-server-q270) |

---

## 🔗 Related

See the [main project README](../README.md) for full architecture details, app installation instructions, and citation information.