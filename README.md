# forge-ml

End-to-end platform for LLM post-training. Handles dataset versioning, training orchestration, model registry, and evaluation pipelines -- built for teams shipping specialized models at scale.

## What This Does

Fine-tuning and post-training large language models is operationally complex. Teams deal with distributed training failures, dataset version confusion, no clear model promotion path, and fragile evaluation setups. forge-ml packages all of this into a single platform:

- **Dataset versioning and lineage** -- track every dataset version, its provenance, licensing metadata, and PII scan status.
- **Training orchestration** -- launch LoRA SFT, DPO, or RLHF runs from reproducible recipe configs. Built-in failure detection and auto-retry.
- **Model registry with promotion gates** -- register trained models, enforce eval-score thresholds before promoting to production.
- **Evaluation engine** -- run offline benchmark suites (accuracy, toxicity, coherence, etc.) with regression detection against baselines.
- **Cluster management** -- monitor GPU node health, utilization, and estimate training costs.
- **Python SDK** -- programmatic access to the full API for scripting and CI/CD integration.

## Architecture

```
                          +--------------------+
                          |   React Dashboard  |
                          |  (Vite + Recharts) |
                          +--------+-----------+
                                   |
                              REST API
                                   |
                          +--------+-----------+
                          |   FastAPI Backend   |
                          +--------+-----------+
                                   |
              +--------------------+-------------------+
              |                    |                    |
    +---------+------+   +--------+-------+   +--------+-------+
    |  Dataset Svc   |   | Training Svc   |   | Registry Svc   |
    |  (versioning,  |   | (recipes,      |   | (promotion,    |
    |   lineage,     |   |  orchestration,|   |  eval gates,   |
    |   PII scan)    |   |  auto-retry)   |   |  rollback)     |
    +----------------+   +----------------+   +----------------+
              |                    |                    |
    +---------+------+   +--------+-------+
    | Cluster Svc    |   |  Eval Svc      |
    | (GPU mgmt,     |   | (benchmarks,   |
    |  health check, |   |  regression    |
    |  cost est.)    |   |  comparison)   |
    +----------------+   +----------------+
              |
       +------+-------+
       |   SQLite DB   |
       +---------------+
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/datasets/register` | Register a new dataset version |
| GET | `/datasets` | List all datasets |
| GET | `/datasets/{id}` | Get dataset by ID |
| GET | `/datasets/{id}/lineage` | Get dataset lineage chain |
| POST | `/datasets/{id}/scan-pii` | Scan fields for PII patterns |
| POST | `/runs/launch` | Launch a training run |
| GET | `/runs` | List all runs |
| GET | `/runs/{id}` | Get run details |
| GET | `/runs/{id}/metrics` | Get training metrics |
| POST | `/runs/{id}/cancel` | Cancel a running job |
| POST | `/models/promote` | Promote a run to the registry |
| GET | `/models` | List registered models |
| PATCH | `/models/{id}/status` | Update model promotion status |
| POST | `/evals/run` | Run an evaluation suite |
| GET | `/evals` | List evaluations |
| GET | `/evals/{id}/compare/{baseline}` | Compare eval against baseline |
| GET | `/cluster/status` | Get cluster node status |
| GET | `/cluster/cost` | Estimate training cost |

## Training Recipes

### LoRA SFT (Supervised Fine-Tuning)
Uses PEFT LoRA adapters with HuggingFace Transformers. Default config:
- Rank: 16, Alpha: 32, Dropout: 0.05
- Target modules: `c_attn`, `c_proj`
- Learning rate: 2e-4 with warmup

### DPO (Direct Preference Optimization)
Alignment training via TRL's DPOTrainer. Requires paired preference data (chosen/rejected).

### RLHF (Reinforcement Learning from Human Feedback)
PPO-based training loop with optional reward model. Uses TRL's PPOTrainer.

## Quickstart

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python main.py
```

The API will be available at `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Dashboard at `http://localhost:5173`.

### Seed Demo Data

```bash
python scripts/seed_data.py
```

### Python SDK

```python
from sdk.client import ForgeClient

client = ForgeClient(base_url="http://localhost:8000")

ds = client.register_dataset(
    name="my-dataset",
    source_path="s3://bucket/data.jsonl",
    version="1.0.0",
    license="Apache-2.0",
)

run = client.launch_run(
    name="fine-tune-v1",
    base_model="meta-llama/Llama-2-7b-hf",
    dataset_id=ds["id"],
    recipe="lora_sft",
)

metrics = client.get_metrics(run["id"], last_n=10)

model = client.promote_model(
    run_id=run["id"],
    name="my-model",
    version="1.0.0",
)

result = client.run_eval(model_id=model["id"], suite="default")
```

## Project Structure

```
forge-ml/
├── backend/
│   ├── main.py              # FastAPI entrypoint
│   ├── config.py            # Settings and recipe defaults
│   ├── core/
│   │   ├── schemas.py       # Pydantic models
│   │   ├── db.py            # SQLite persistence
│   │   ├── auth.py          # API key auth
│   │   └── exceptions.py    # Error handling
│   ├── routers/             # API route handlers
│   ├── services/            # Business logic
│   ├── recipes/             # Training recipes (LoRA, DPO, RLHF)
│   └── sdk/                 # Python client SDK
├── frontend/
│   ├── src/
│   │   ├── pages/           # Dashboard, Datasets, Runs, Models, Evals
│   │   ├── components/      # Reusable UI components
│   │   └── api/             # API client
│   └── index.html
├── scripts/
│   └── seed_data.py         # Demo data seeder
└── docs/
    └── architecture.md
```

## Tech Stack

- **Backend**: Python, FastAPI, Pydantic, SQLite
- **ML**: PyTorch, HuggingFace Transformers, PEFT, TRL
- **Frontend**: React, Vite, Recharts
- **SDK**: httpx-based Python client

## License

Copyright (c) 2025-2026 Ahmad Al-Nazer. All rights reserved.

Licensed under the MIT License. See [LICENSE](LICENSE) for details.

[linkedin.com/in/ahmadghazinazer](https://www.linkedin.com/in/ahmadghazinazer)
