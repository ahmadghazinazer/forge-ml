# Copyright (c) 2025-2026 Ahmad Al-Nazer. All rights reserved.
# https://www.linkedin.com/in/ahmadghazinazer

import os
import logging
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class LoraRecipeConfig:
    base_model: str = "gpt2"
    r: int = 16
    lora_alpha: int = 32
    lora_dropout: float = 0.05
    target_modules: list[str] = None
    bias: str = "none"
    learning_rate: float = 2e-4
    batch_size: int = 4
    gradient_accumulation_steps: int = 8
    num_epochs: int = 1
    warmup_ratio: float = 0.03
    max_seq_length: int = 2048
    output_dir: str = "./out"
    logging_steps: int = 20
    save_steps: int = 200

    def __post_init__(self):
        if self.target_modules is None:
            self.target_modules = ["c_attn", "c_proj"]


def build_lora_config(recipe: LoraRecipeConfig):
    from peft import LoraConfig

    return LoraConfig(
        r=recipe.r,
        lora_alpha=recipe.lora_alpha,
        lora_dropout=recipe.lora_dropout,
        target_modules=recipe.target_modules,
        bias=recipe.bias,
        task_type="CAUSAL_LM",
    )


def prepare_model(recipe: LoraRecipeConfig):
    from transformers import AutoModelForCausalLM, AutoTokenizer
    from peft import get_peft_model

    tokenizer = AutoTokenizer.from_pretrained(recipe.base_model)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    model = AutoModelForCausalLM.from_pretrained(
        recipe.base_model, torch_dtype="auto",
    )

    lora_config = build_lora_config(recipe)
    model = get_peft_model(model, lora_config)

    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total = sum(p.numel() for p in model.parameters())
    logger.info(
        "LoRA params: %d trainable / %d total (%.2f%%)",
        trainable, total, 100.0 * trainable / total,
    )

    return model, tokenizer


def build_training_args(recipe: LoraRecipeConfig):
    from transformers import TrainingArguments

    os.makedirs(recipe.output_dir, exist_ok=True)
    return TrainingArguments(
        output_dir=recipe.output_dir,
        per_device_train_batch_size=recipe.batch_size,
        gradient_accumulation_steps=recipe.gradient_accumulation_steps,
        learning_rate=recipe.learning_rate,
        num_train_epochs=recipe.num_epochs,
        warmup_ratio=recipe.warmup_ratio,
        logging_steps=recipe.logging_steps,
        save_steps=recipe.save_steps,
        fp16=True,
        remove_unused_columns=False,
        report_to="none",
    )


def run_sft(recipe: LoraRecipeConfig, dataset):
    from transformers import Trainer

    model, tokenizer = prepare_model(recipe)
    args = build_training_args(recipe)

    trainer = Trainer(
        model=model,
        args=args,
        train_dataset=dataset,
        tokenizer=tokenizer,
    )
    trainer.train()

    adapter_path = os.path.join(recipe.output_dir, "lora_adapter")
    model.save_pretrained(adapter_path)
    tokenizer.save_pretrained(adapter_path)
    logger.info("Adapter saved to %s", adapter_path)

    return adapter_path
