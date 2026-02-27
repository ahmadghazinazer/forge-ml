# forge-ml

End-to-end platform for LLM post-training. Handles dataset versioning, training orchestration, model registry, and evaluation pipelines -- built for teams shipping specialized models at scale.

## What This Does

Fine-tuning and post-training large language models is operationally complex. Teams deal with distributed training failures, dataset version confusion, no clear model promotion path, and fragile evaluation setups. forge-ml packages all of this into a single platform:

- **Dataset versioning and lineage** -- track every dataset version, its provenance, licensing metadata, and PII scan status. View the full lineage chain from derived datasets back to the original source.
- **Training orchestration** -- launch LoRA SFT, DPO, or RLHF runs from reproducible recipe configs. Built-in failure detection and auto-retry with configurable retry limits.
- **Model registry with promotion gates** -- register trained models, enforce eval-score thresholds before promoting through staging, candidate, and production stages.
- **Evaluation engine** -- run offline benchmark suites (accuracy, toxicity, coherence, bias, jailbreak resistance, etc.) with regression detection against baselines. Switch between bar chart and radar chart views.
- **Cluster management** -- monitor GPU node health and utilization in real time, track failure counts, estimate training costs, and auto-redistribute workloads when nodes go offline.
- **Pipeline visualization** -- see the full 7-step post-training pipeline from data ingestion through deployment, with recipe details and eval suite breakdowns.
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

## How to Run

### Prerequisites

- Python 3.10+ (3.13 recommended; 3.14 may require building pydantic-core from source)
- Node.js 18+
- pip or uv

### Backend

```bash
cd backend

# create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# install dependencies
pip install -r requirements.txt

# start the server (runs on port 8000)
python main.py
```

The API will be available at `http://localhost:8000`.
Interactive docs (Swagger) at `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend

# install dependencies
npm install

# start dev server (runs on port 5173)
npm run dev
```

Dashboard at `http://localhost:5173`.

### Seed Demo Data

To populate the database with sample datasets and training runs:

```bash
cd backend
source .venv/bin/activate
python -c "
from core.db import init_db
from core.schemas import DatasetRegister, RunLaunch, RecipeType
from services.dataset_service import register_dataset
from services.training_service import launch_run

init_db()
ds = register_dataset(DatasetRegister(name='alpaca-cleaned', version='2.1.0', source_path='s3://datasets/alpaca', format='jsonl', license='Apache-2.0', pii_checked=True, tags=['sft', 'instruction'], row_count=51760))
launch_run(RunLaunch(name='alpaca-lora-7b', base_model='meta-llama/Llama-2-7b-hf', dataset_id=ds.id, recipe=RecipeType.LORA_SFT, num_gpus=4))
print('Seeded.')
"
```

### Production Build

```bash
cd frontend
npm run build
# output in frontend/dist/
```

## Dashboard Pages

| Page | What It Shows |
|------|---------------|
| **Dashboard** | Metric cards, activity feed, cluster health preview, recent runs table (auto-refreshes) |
| **Pipeline** | 7-step training pipeline visualization, recipe details, evaluation suite breakdown |
| **Datasets** | Dataset list with search, version tags, PII status, lineage viewer, row count stats |
| **Training Runs** | Run table with filters, clickable row inspection, tabbed charts (loss, LR, GPU memory, throughput) |
| **Model Registry** | Model cards with promotion status, filter by stage, version and recipe tags |
| **Evaluations** | Eval results with bar/radar chart toggle, benchmark scores, pass/fail details per metric |
| **Cluster** | Node health cards with GPU/memory utilization bars, cost estimator, auto-refresh |
| **Settings** | API config, training defaults, cluster reliability settings, env variable reference |

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

## Python SDK

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
status = client.cluster_status()
cost = client.estimate_cost(num_gpus=4, hours=8)
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
│   │   ├── pages/           # 8 pages: Dashboard, Pipeline, Datasets,
│   │   │                    #   Runs, Models, Evals, Cluster, Settings
│   │   ├── components/      # Reusable UI components
│   │   └── api/             # API client
│   └── public/
│       └── favicon.png
├── scripts/
│   └── seed_data.py
└── docs/
    └── architecture.md
```

## Tech Stack

- **Backend**: Python, FastAPI, Pydantic, SQLite
- **ML**: PyTorch, HuggingFace Transformers, PEFT, TRL
- **Frontend**: React 18, Vite, Recharts (line, area, bar, radar charts)
- **SDK**: httpx-based Python client
- **Design**: Custom CSS with glassmorphism, Inter + JetBrains Mono fonts

## License

Copyright (c) 2025-2026 Ahmad Al-Nazer. All rights reserved.

Licensed under the MIT License. See [LICENSE](LICENSE) for details.

[linkedin.com/in/ahmadghazinazer](https://www.linkedin.com/in/ahmadghazinazer)
