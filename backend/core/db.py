# Copyright (c) 2025-2026 Ahmad Al-Nazer. All rights reserved.
# https://www.linkedin.com/in/ahmadghazinazer

import json
import sqlite3
import os
from datetime import datetime, timezone
from typing import Optional

DB_PATH = os.getenv("FORGE_DB_PATH", "forge.db")

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS datasets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    version TEXT NOT NULL,
    source_path TEXT NOT NULL,
    format TEXT DEFAULT 'jsonl',
    description TEXT DEFAULT '',
    license TEXT DEFAULT 'unknown',
    pii_checked INTEGER DEFAULT 0,
    tags TEXT DEFAULT '[]',
    row_count INTEGER,
    parent_dataset_id TEXT,
    checksum TEXT,
    created_at TEXT NOT NULL,
    UNIQUE(name, version)
);

CREATE TABLE IF NOT EXISTS runs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    base_model TEXT NOT NULL,
    dataset_id TEXT NOT NULL,
    recipe TEXT NOT NULL,
    config TEXT DEFAULT '{}',
    status TEXT DEFAULT 'pending',
    num_gpus INTEGER DEFAULT 1,
    priority INTEGER DEFAULT 0,
    tags TEXT DEFAULT '[]',
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    started_at TEXT,
    completed_at TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (dataset_id) REFERENCES datasets(id)
);

CREATE TABLE IF NOT EXISTS run_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id TEXT NOT NULL,
    step INTEGER NOT NULL,
    loss REAL NOT NULL,
    learning_rate REAL NOT NULL,
    epoch REAL NOT NULL,
    gpu_memory_mb REAL,
    throughput_samples_sec REAL,
    timestamp TEXT NOT NULL,
    FOREIGN KEY (run_id) REFERENCES runs(id)
);

CREATE TABLE IF NOT EXISTS models (
    id TEXT PRIMARY KEY,
    run_id TEXT NOT NULL,
    name TEXT NOT NULL,
    version TEXT NOT NULL,
    description TEXT DEFAULT '',
    status TEXT DEFAULT 'staging',
    base_model TEXT NOT NULL,
    recipe TEXT NOT NULL,
    artifact_path TEXT,
    eval_scores TEXT DEFAULT '{}',
    promoted_at TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (run_id) REFERENCES runs(id),
    UNIQUE(name, version)
);

CREATE TABLE IF NOT EXISTS evals (
    id TEXT PRIMARY KEY,
    model_id TEXT NOT NULL,
    suite TEXT DEFAULT 'default',
    status TEXT DEFAULT 'queued',
    results TEXT DEFAULT '[]',
    regression_baseline_id TEXT,
    overall_score REAL,
    started_at TEXT,
    completed_at TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (model_id) REFERENCES models(id)
);
"""


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    conn = get_connection()
    conn.executescript(SCHEMA_SQL)
    conn.commit()
    conn.close()


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def serialize_json(obj) -> str:
    return json.dumps(obj, default=str)


def deserialize_json(raw: str):
    if not raw:
        return {}
    return json.loads(raw)


def row_to_dict(row: sqlite3.Row) -> dict:
    d = dict(row)
    for key in ("tags", "config", "eval_scores", "results"):
        if key in d and isinstance(d[key], str):
            d[key] = deserialize_json(d[key])
    if "pii_checked" in d:
        d["pii_checked"] = bool(d["pii_checked"])
    return d
