# Copyright (c) 2025-2026 Ahmad Al-Nazer. All rights reserved.
# https://www.linkedin.com/in/ahmadghazinazer

import uuid
import threading
import time
import logging
from typing import Optional

from core.db import get_connection, now_iso, serialize_json, row_to_dict
from core.schemas import (
    RunLaunch, RunRecord, RunMetrics, RunStatus, RecipeType,
)
from core.exceptions import NotFoundError, RunFailedError
from config import settings, RECIPE_DEFAULTS

logger = logging.getLogger(__name__)

_active_runs: dict[str, dict] = {}
_lock = threading.Lock()


def _build_config(recipe: RecipeType, overrides: dict) -> dict:
    base = RECIPE_DEFAULTS.get(recipe.value, {}).copy()
    base.update(overrides)
    return base


def _simulate_training(run_id: str, config: dict):
    import math
    import random

    total_steps = config.get("num_epochs", 1) * 100
    initial_loss = 3.5 + random.uniform(-0.5, 0.5)
    lr = config.get("learning_rate", 2e-4)

    conn = get_connection()
    try:
        conn.execute(
            "UPDATE runs SET status = ?, started_at = ? WHERE id = ?",
            (RunStatus.RUNNING.value, now_iso(), run_id),
        )
        conn.commit()

        for step in range(1, total_steps + 1):
            progress = step / total_steps
            decay = math.exp(-3.0 * progress)
            noise = random.gauss(0, 0.02)
            loss = initial_loss * decay + 0.3 + noise
            loss = max(0.1, loss)

            current_lr = lr * (1.0 - progress * 0.9)
            mem = 4000 + random.uniform(-200, 200)
            throughput = 12.0 + random.uniform(-2, 2)

            conn.execute(
                """INSERT INTO run_metrics
                   (run_id, step, loss, learning_rate, epoch,
                    gpu_memory_mb, throughput_samples_sec, timestamp)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    run_id, step, round(loss, 4), current_lr,
                    round(progress * config.get("num_epochs", 1), 2),
                    round(mem, 1), round(throughput, 1), now_iso(),
                ),
            )
            if step % 10 == 0:
                conn.commit()

            time.sleep(0.02)

        conn.execute(
            "UPDATE runs SET status = ?, completed_at = ? WHERE id = ?",
            (RunStatus.COMPLETED.value, now_iso(), run_id),
        )
        conn.commit()
    except Exception as exc:
        logger.error("Training run %s failed: %s", run_id, exc)
        conn.execute(
            "UPDATE runs SET status = ?, error_message = ? WHERE id = ?",
            (RunStatus.FAILED.value, str(exc), run_id),
        )
        conn.commit()
    finally:
        conn.close()
        with _lock:
            _active_runs.pop(run_id, None)


def launch_run(payload: RunLaunch) -> RunRecord:
    conn = get_connection()
    try:
        ds = conn.execute(
            "SELECT id FROM datasets WHERE id = ?", (payload.dataset_id,)
        ).fetchone()
        if not ds:
            raise NotFoundError("Dataset", payload.dataset_id)

        run_id = str(uuid.uuid4())[:12]
        config = _build_config(payload.recipe, payload.config_overrides)
        created = now_iso()

        conn.execute(
            """INSERT INTO runs
               (id, name, base_model, dataset_id, recipe, config,
                status, num_gpus, priority, tags, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                run_id, payload.name, payload.base_model, payload.dataset_id,
                payload.recipe.value, serialize_json(config),
                RunStatus.PENDING.value, payload.num_gpus, payload.priority,
                serialize_json(payload.tags), created,
            ),
        )
        conn.commit()

        t = threading.Thread(
            target=_simulate_training, args=(run_id, config), daemon=True
        )
        with _lock:
            _active_runs[run_id] = {"thread": t, "started": created}
        t.start()

        row = conn.execute(
            "SELECT * FROM runs WHERE id = ?", (run_id,)
        ).fetchone()
        return RunRecord(**row_to_dict(row))
    finally:
        conn.close()


def get_run(run_id: str) -> RunRecord:
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT * FROM runs WHERE id = ?", (run_id,)
        ).fetchone()
        if not row:
            raise NotFoundError("Run", run_id)

        record = RunRecord(**row_to_dict(row))
        metrics_rows = conn.execute(
            "SELECT * FROM run_metrics WHERE run_id = ? ORDER BY step",
            (run_id,),
        ).fetchall()
        record.metrics = [RunMetrics(**dict(m)) for m in metrics_rows]
        return record
    finally:
        conn.close()


def get_run_metrics(
    run_id: str, last_n: Optional[int] = None
) -> list[RunMetrics]:
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT id FROM runs WHERE id = ?", (run_id,)
        ).fetchone()
        if not row:
            raise NotFoundError("Run", run_id)

        query = "SELECT * FROM run_metrics WHERE run_id = ? ORDER BY step"
        if last_n:
            query += f" DESC LIMIT {last_n}"

        rows = conn.execute(query, (run_id,)).fetchall()
        metrics = [RunMetrics(**dict(r)) for r in rows]
        if last_n:
            metrics.reverse()
        return metrics
    finally:
        conn.close()


def list_runs(
    status: Optional[str] = None,
    recipe: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[RunRecord], int]:
    conn = get_connection()
    try:
        query = "SELECT * FROM runs WHERE 1=1"
        count_query = "SELECT COUNT(*) FROM runs WHERE 1=1"
        params = []

        if status:
            query += " AND status = ?"
            count_query += " AND status = ?"
            params.append(status)
        if recipe:
            query += " AND recipe = ?"
            count_query += " AND recipe = ?"
            params.append(recipe)

        total = conn.execute(count_query, params).fetchone()[0]
        query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])

        rows = conn.execute(query, params).fetchall()
        runs = [RunRecord(**row_to_dict(r)) for r in rows]
        return runs, total
    finally:
        conn.close()


def cancel_run(run_id: str) -> RunRecord:
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT * FROM runs WHERE id = ?", (run_id,)
        ).fetchone()
        if not row:
            raise NotFoundError("Run", run_id)

        conn.execute(
            "UPDATE runs SET status = ?, completed_at = ? WHERE id = ?",
            (RunStatus.CANCELLED.value, now_iso(), run_id),
        )
        conn.commit()

        row = conn.execute(
            "SELECT * FROM runs WHERE id = ?", (run_id,)
        ).fetchone()
        return RunRecord(**row_to_dict(row))
    finally:
        conn.close()
