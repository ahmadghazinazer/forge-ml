# Copyright (c) 2025-2026 Ahmad Al-Nazer. All rights reserved.
# https://www.linkedin.com/in/ahmadghazinazer

import os
import logging
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class RLHFRecipeConfig:
    base_model: str = "gpt2"
    reward_model: str = None
    ppo_epochs: int = 4
    learning_rate: float = 1.5e-5
    batch_size: int = 4
    kl_penalty: float = 0.2
    clip_range: float = 0.2
    max_length: int = 512
    output_dir: str = "./out"
    logging_steps: int = 10
    lora_r: int = 16
    lora_alpha: int = 32


def prepare_rlhf_models(recipe: RLHFRecipeConfig):
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
        target_modules=["c_attn", "c_proj"],
        bias="none",
        task_type="CAUSAL_LM",
    )
    model = get_peft_model(model, lora_config)

    reward_model = None
    if recipe.reward_model:
        from transformers import AutoModelForSequenceClassification
        reward_model = AutoModelForSequenceClassification.from_pretrained(
            recipe.reward_model, torch_dtype="auto",
        )

    return model, reward_model, tokenizer


def build_ppo_config(recipe: RLHFRecipeConfig):
    from trl import PPOConfig

    return PPOConfig(
        learning_rate=recipe.learning_rate,
        batch_size=recipe.batch_size,
        ppo_epochs=recipe.ppo_epochs,
        kl_penalty=recipe.kl_penalty if recipe.kl_penalty else "kl",
        cliprange=recipe.clip_range,
        log_with="none",
    )


def run_rlhf(recipe: RLHFRecipeConfig, prompt_dataset):
    from trl import PPOTrainer

    model, reward_model, tokenizer = prepare_rlhf_models(recipe)
    ppo_config = build_ppo_config(recipe)

    os.makedirs(recipe.output_dir, exist_ok=True)

    trainer = PPOTrainer(
        config=ppo_config,
        model=model,
        ref_model=None,
        tokenizer=tokenizer,
        dataset=prompt_dataset,
    )

    for epoch in range(recipe.ppo_epochs):
        for batch in trainer.dataloader:
            query_tensors = batch["input_ids"]

            response_tensors = trainer.generate(
                query_tensors, max_new_tokens=recipe.max_length,
            )

            if reward_model is not None:
                rewards = _compute_rewards(
                    reward_model, tokenizer,
                    query_tensors, response_tensors,
                )
            else:
                import torch
                rewards = [torch.tensor(0.0) for _ in response_tensors]

            stats = trainer.step(query_tensors, response_tensors, rewards)
            logger.info("PPO epoch %d stats: %s", epoch, stats)

    adapter_path = os.path.join(recipe.output_dir, "rlhf_adapter")
    model.save_pretrained(adapter_path)
    tokenizer.save_pretrained(adapter_path)
    logger.info("RLHF adapter saved to %s", adapter_path)

    return adapter_path


def _compute_rewards(reward_model, tokenizer, queries, responses):
    import torch

    rewards = []
    for q, r in zip(queries, responses):
        combined = torch.cat([q, r])
        text = tokenizer.decode(combined, skip_special_tokens=True)
        inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=512)
        with torch.no_grad():
            output = reward_model(**inputs)
        score = output.logits[0, 0].item()
        rewards.append(torch.tensor(score))
    return rewards
