# Copyright (c) 2025-2026 Ahmad Al-Nazer. All rights reserved.
# https://www.linkedin.com/in/ahmadghazinazer

import os
import logging
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class DPORecipeConfig:
    base_model: str = "gpt2"
    beta: float = 0.1
    learning_rate: float = 5e-5
    batch_size: int = 2
    gradient_accumulation_steps: int = 4
    num_epochs: int = 1
    max_prompt_length: int = 512
    max_length: int = 1024
    output_dir: str = "./out"
    logging_steps: int = 10
    lora_r: int = 16
    lora_alpha: int = 32
    lora_dropout: float = 0.05


def build_dpo_config(recipe: DPORecipeConfig) -> dict:
    return {
        "beta": recipe.beta,
        "max_prompt_length": recipe.max_prompt_length,
        "max_length": recipe.max_length,
    }


def prepare_dpo_model(recipe: DPORecipeConfig):
    from transformers import AutoModelForCausalLM, AutoTokenizer
    from peft import LoraConfig, get_peft_model

    tokenizer = AutoTokenizer.from_pretrained(recipe.base_model)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    model = AutoModelForCausalLM.from_pretrained(
        recipe.base_model, torch_dtype="auto",
    )

    lora_config = LoraConfig(
        r=recipe.lora_r,
        lora_alpha=recipe.lora_alpha,
        lora_dropout=recipe.lora_dropout,
        target_modules=["c_attn", "c_proj"],
        bias="none",
        task_type="CAUSAL_LM",
    )
    model = get_peft_model(model, lora_config)

    ref_model = AutoModelForCausalLM.from_pretrained(
        recipe.base_model, torch_dtype="auto",
    )

    return model, ref_model, tokenizer


def run_dpo(recipe: DPORecipeConfig, train_dataset):
    from trl import DPOTrainer, DPOConfig

    model, ref_model, tokenizer = prepare_dpo_model(recipe)

    os.makedirs(recipe.output_dir, exist_ok=True)

    training_args = DPOConfig(
        output_dir=recipe.output_dir,
        per_device_train_batch_size=recipe.batch_size,
        gradient_accumulation_steps=recipe.gradient_accumulation_steps,
        learning_rate=recipe.learning_rate,
        num_train_epochs=recipe.num_epochs,
        beta=recipe.beta,
        max_prompt_length=recipe.max_prompt_length,
        max_length=recipe.max_length,
        logging_steps=recipe.logging_steps,
        fp16=True,
        remove_unused_columns=False,
        report_to="none",
    )

    trainer = DPOTrainer(
        model=model,
        ref_model=ref_model,
        args=training_args,
        train_dataset=train_dataset,
        tokenizer=tokenizer,
    )
    trainer.train()

    adapter_path = os.path.join(recipe.output_dir, "dpo_adapter")
    model.save_pretrained(adapter_path)
    tokenizer.save_pretrained(adapter_path)
    logger.info("DPO adapter saved to %s", adapter_path)

    return adapter_path
