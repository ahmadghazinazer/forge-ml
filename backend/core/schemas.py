# Copyright (c) 2025-2026 Ahmad Al-Nazer. All rights reserved.
# https://www.linkedin.com/in/ahmadghazinazer

from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class RunStatus(str, Enum):
    PENDING = "pending"
    PROVISIONING = "provisioning"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class PromotionStatus(str, Enum):
    STAGING = "staging"
    CANDIDATE = "candidate"
    PRODUCTION = "production"
    ARCHIVED = "archived"


class EvalStatus(str, Enum):
    QUEUED = "queued"
    RUNNING = "running"
    PASSED = "passed"
    FAILED = "failed"
    ERROR = "error"


class RecipeType(str, Enum):
    LORA_SFT = "lora_sft"
    DPO = "dpo"
    RLHF = "rlhf"


# --- Dataset schemas ---

class DatasetRegister(BaseModel):
    name: str
    version: str = "1.0.0"
    source_path: str
    format: str = "jsonl"
    description: str = ""
    license: str = "unknown"
    pii_checked: bool = False
    tags: list[str] = Field(default_factory=list)
    row_count: Optional[int] = None
    parent_dataset_id: Optional[str] = None


class DatasetRecord(BaseModel):
    id: str
    name: str
    version: str
    source_path: str
    format: str
    description: str
    license: str
    pii_checked: bool
    tags: list[str]
    row_count: Optional[int]
    parent_dataset_id: Optional[str]
    created_at: str
    checksum: Optional[str] = None


# --- Training run schemas ---

class RunLaunch(BaseModel):
    name: str
    base_model: str
    dataset_id: str
    recipe: RecipeType = RecipeType.LORA_SFT
    config_overrides: dict = Field(default_factory=dict)
    num_gpus: int = 1
    priority: int = 0
    tags: list[str] = Field(default_factory=list)


class RunMetrics(BaseModel):
    step: int
    loss: float
    learning_rate: float
    epoch: float
    gpu_memory_mb: Optional[float] = None
    throughput_samples_sec: Optional[float] = None
    timestamp: str = ""


class RunRecord(BaseModel):
    id: str
    name: str
    base_model: str
    dataset_id: str
    recipe: str
    config: dict
    status: RunStatus
    num_gpus: int
    priority: int
    tags: list[str]
    metrics: list[RunMetrics] = Field(default_factory=list)
    error_message: Optional[str] = None
    retry_count: int = 0
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    created_at: str = ""


# --- Model registry schemas ---

class ModelPromote(BaseModel):
    run_id: str
    name: str
    version: str
    description: str = ""
    target_status: PromotionStatus = PromotionStatus.STAGING
    min_eval_score: Optional[float] = None


class ModelRecord(BaseModel):
    id: str
    run_id: str
    name: str
    version: str
    description: str
    status: PromotionStatus
    base_model: str
    recipe: str
    artifact_path: Optional[str] = None
    eval_scores: dict = Field(default_factory=dict)
    promoted_at: Optional[str] = None
    created_at: str = ""


# --- Eval schemas ---

class EvalRun(BaseModel):
    model_id: str
    suite: str = "default"
    benchmarks: list[str] = Field(default_factory=list)
    regression_baseline_id: Optional[str] = None


class EvalResult(BaseModel):
    benchmark: str
    score: float
    passed: bool
    threshold: Optional[float] = None
    details: dict = Field(default_factory=dict)


class EvalRecord(BaseModel):
    id: str
    model_id: str
    suite: str
    status: EvalStatus
    results: list[EvalResult] = Field(default_factory=list)
    regression_baseline_id: Optional[str] = None
    overall_score: Optional[float] = None
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    created_at: str = ""


# --- API response wrappers ---

class ApiResponse(BaseModel):
    success: bool = True
    data: Optional[dict | list] = None
    error: Optional[str] = None


class PaginatedResponse(BaseModel):
    items: list
    total: int
    page: int = 1
    page_size: int = 50
