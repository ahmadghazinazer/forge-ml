# Copyright (c) 2025-2026 Ahmad Al-Nazer. All rights reserved.
# https://www.linkedin.com/in/ahmadghazinazer

"""
Populate the database with sample data for demo purposes.
Run: python scripts/seed_data.py
"""

import sys
import os
import time

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from core.db import init_db
from core.schemas import DatasetRegister, RunLaunch, RecipeType
from services.dataset_service import register_dataset
from services.training_service import launch_run


def seed():
    init_db()
    print("Database initialized.")

    datasets = [
        DatasetRegister(
            name="instruct-alpaca-cleaned",
            version="2.1.0",
            source_path="s3://forge-datasets/alpaca-cleaned-v2",
            format="jsonl",
            description="Cleaned Stanford Alpaca instruction-following dataset",
            license="Apache-2.0",
            pii_checked=True,
            tags=["instruction", "sft", "english"],
            row_count=51760,
        ),
        DatasetRegister(
            name="orca-dpo-pairs",
            version="1.0.0",
            source_path="s3://forge-datasets/orca-dpo-pairs",
            format="parquet",
            description="Preference pairs for DPO alignment from Orca conversations",
            license="MIT",
            pii_checked=True,
            tags=["dpo", "preference", "alignment"],
            row_count=12500,
        ),
        DatasetRegister(
            name="code-feedback-v3",
            version="3.0.1",
            source_path="s3://forge-datasets/code-feedback-v3",
            format="jsonl",
            description="Code generation feedback dataset with correctness labels",
            license="Apache-2.0",
            pii_checked=False,
            tags=["code", "feedback", "sft"],
            row_count=89300,
        ),
    ]

    dataset_ids = []
    for ds in datasets:
        record = register_dataset(ds)
        dataset_ids.append(record.id)
        print(f"  Registered dataset: {record.name} v{record.version} [{record.id}]")

    runs_config = [
        RunLaunch(
            name="alpaca-lora-7b-run1",
            base_model="meta-llama/Llama-2-7b-hf",
            dataset_id=dataset_ids[0],
            recipe=RecipeType.LORA_SFT,
            num_gpus=4,
            tags=["llama2", "sft", "experiment"],
        ),
        RunLaunch(
            name="orca-dpo-alignment",
            base_model="mistralai/Mistral-7B-v0.1",
            dataset_id=dataset_ids[1],
            recipe=RecipeType.DPO,
            num_gpus=2,
            tags=["mistral", "dpo", "alignment"],
        ),
    ]

    for run_cfg in runs_config:
        record = launch_run(run_cfg)
        print(f"  Launched run: {record.name} [{record.id}]")

    print("\nSeed complete. Runs are executing in background threads.")
    print("Wait a few seconds and query /runs to see metrics.")


if __name__ == "__main__":
    seed()
