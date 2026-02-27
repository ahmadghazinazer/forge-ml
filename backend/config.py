# Copyright (c) 2025-2026 Ahmad Al-Nazer. All rights reserved.
# https://www.linkedin.com/in/ahmadghazinazer

import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "forge-ml"
    version: str = "0.1.0"
    debug: bool = False
    database_url: str = "sqlite+aiosqlite:///./forge.db"
    api_key_header: str = "X-API-Key"
    default_api_key: str = "dev-key-change-me"
    max_concurrent_runs: int = 4
    checkpoint_dir: str = "./checkpoints"
    model_registry_dir: str = "./model_registry"
    cluster_heartbeat_interval: int = 30
    run_timeout_seconds: int = 86400

    class Config:
        env_file = ".env"
        env_prefix = "FORGE_"


settings = Settings()

RECIPE_DEFAULTS = {
    "lora_sft": {
        "r": 16,
        "lora_alpha": 32,
        "lora_dropout": 0.05,
        "learning_rate": 2e-4,
        "batch_size": 4,
        "gradient_accumulation_steps": 8,
        "num_epochs": 1,
        "warmup_ratio": 0.03,
        "max_seq_length": 2048,
    },
    "dpo": {
        "beta": 0.1,
        "learning_rate": 5e-5,
        "batch_size": 2,
        "gradient_accumulation_steps": 4,
        "num_epochs": 1,
        "max_prompt_length": 512,
        "max_length": 1024,
    },
    "rlhf": {
        "reward_model": None,
        "ppo_epochs": 4,
        "learning_rate": 1.5e-5,
        "batch_size": 4,
        "kl_penalty": 0.2,
        "clip_range": 0.2,
    },
}
