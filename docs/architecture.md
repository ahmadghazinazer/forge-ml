# Architecture

This document describes the high-level architecture of forge-ml.

## Overview

forge-ml is a post-training platform for large language models. It provides the infrastructure between "we have a base model and a dataset" and "we have a validated, production-ready fine-tuned model."

The system is split into a FastAPI backend (Python), a React dashboard (Vite), and a Python SDK for programmatic access.

## Components

### API Layer

Four routers handle all HTTP traffic:

- **datasets** -- CRUD for versioned datasets. Tracks lineage (parent-child relationships between dataset versions), license metadata, and PII scan status.
- **runs** -- Launch, monitor, and cancel training runs. Supports LoRA SFT, DPO, and RLHF recipes out of the box.
- **models** -- Register trained model artifacts, enforce eval-gate thresholds before promotion to production.
- **evals** -- Trigger evaluation suites against registered models. Supports regression comparison against baseline runs.

### Service Layer

Each router delegates to a corresponding service that encapsulates business logic:

- **DatasetService** -- Version tracking with SHA-256 checksums, lineage graph traversal, PII pattern scanning.
- **TrainingService** -- Merges recipe defaults with user overrides, manages run lifecycle (pending, provisioning, running, completed, failed, cancelled), tracks per-step metrics (loss, learning rate, GPU memory, throughput).
- **RegistryService** -- Handles model promotion through gates (staging, candidate, production, archived). Enforces minimum eval score thresholds before allowing promotion.
- **EvalService** -- Pluggable benchmark registry (default, safety, quality, reasoning suites). Computes per-benchmark pass/fail against configurable thresholds. Regression detection compares two eval runs and flags score drops.
- **ClusterService** -- Monitors simulated GPU cluster nodes (health, utilization, failure counts). Handles GPU allocation/release and cost estimation.

### Training Recipes

Recipes are self-contained training configurations:

- **lora_sft.py** -- LoRA supervised fine-tuning using PEFT and HuggingFace Trainer.
- **dpo.py** -- Direct Preference Optimization using TRL DPOTrainer with LoRA adapters on both policy and reference models.
- **rlhf.py** -- RLHF pipeline using TRL PPOTrainer with optional reward model integration.

### Data Flow

```
Register dataset (version, lineage, PII metadata)
       |
       v
Launch training run (pick recipe + config overrides)
       |
       v
Training loop produces per-step metrics (loss, lr, memory)
       |
       v
Run completes -> promote to model registry
       |
       v
Run evaluation suite against model
       |
       v
If eval passes gates -> promote to production
```

### Storage

MVP uses SQLite with WAL mode and foreign keys enabled. Tables: datasets, runs, run_metrics, models, evals.

### Auth

API key-based authentication via `X-API-Key` header. Tenant isolation via `X-Tenant-ID` header (scoping support for multi-tenant deployments).

## Deployment Model

Designed for: SaaS control plane with agents running in customer cloud. The API server runs centrally; training workloads execute on customer GPU infrastructure. Cluster service handles node health monitoring and failure recovery.
