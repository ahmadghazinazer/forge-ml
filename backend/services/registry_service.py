# Copyright (c) 2025-2026 Ahmad Al-Nazer. All rights reserved.
# https://www.linkedin.com/in/ahmadghazinazer

import uuid
import logging
import random
from typing import Optional
from datetime import datetime, timezone

from core.db import get_connection, now_iso, serialize_json, row_to_dict
from core.schemas import (
    ModelPromote, ModelRecord, PromotionStatus,
)
from core.exceptions import NotFoundError, ConflictError, EvalGateError

logger = logging.getLogger(__name__)


def promote_model(payload: ModelPromote) -> ModelRecord:
    conn = get_connection()
    try:
        run = conn.execute(
            "SELECT * FROM runs WHERE id = ?", (payload.run_id,)
        ).fetchone()
        if not run:
            raise NotFoundError("Run", payload.run_id)

        run_data = row_to_dict(run)
        if run_data["status"] != "completed":
            raise ConflictError(
                f"Cannot promote from run '{payload.run_id}': "
                f"status is '{run_data['status']}', expected 'completed'"
            )

        existing = conn.execute(
            "SELECT id FROM models WHERE name = ? AND version = ?",
            (payload.name, payload.version),
        ).fetchone()
        if existing:
            raise ConflictError(
                f"Model '{payload.name}' version '{payload.version}' already exists"
            )

        if payload.min_eval_score is not None:
            evals = conn.execute(
                """SELECT overall_score FROM evals
                   WHERE model_id IN (
                       SELECT id FROM models WHERE run_id = ?
                   ) AND status = 'passed'
                   ORDER BY completed_at DESC LIMIT 1""",
                (payload.run_id,),
            ).fetchone()

            if evals and evals[0] is not None:
                if evals[0] < payload.min_eval_score:
                    raise EvalGateError(
                        payload.run_id, evals[0], payload.min_eval_score
                    )

        model_id = str(uuid.uuid4())[:12]
        created = now_iso()

        conn.execute(
            """INSERT INTO models
               (id, run_id, name, version, description, status,
                base_model, recipe, artifact_path, eval_scores,
                promoted_at, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                model_id, payload.run_id, payload.name, payload.version,
                payload.description, payload.target_status.value,
                run_data["base_model"], run_data["recipe"],
                f"./model_registry/{model_id}",
                serialize_json({}), created, created,
            ),
        )
        conn.commit()

        row = conn.execute(
            "SELECT * FROM models WHERE id = ?", (model_id,)
        ).fetchone()
        return ModelRecord(**row_to_dict(row))
    finally:
        conn.close()


def get_model(model_id: str) -> ModelRecord:
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT * FROM models WHERE id = ?", (model_id,)
        ).fetchone()
        if not row:
            raise NotFoundError("Model", model_id)
        return ModelRecord(**row_to_dict(row))
    finally:
        conn.close()


def list_models(
    status: Optional[str] = None,
    name: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[ModelRecord], int]:
    conn = get_connection()
    try:
        query = "SELECT * FROM models WHERE 1=1"
        count_query = "SELECT COUNT(*) FROM models WHERE 1=1"
        params = []

        if status:
            query += " AND status = ?"
            count_query += " AND status = ?"
            params.append(status)
        if name:
            query += " AND name LIKE ?"
            count_query += " AND name LIKE ?"
            params.append(f"%{name}%")

        total = conn.execute(count_query, params).fetchone()[0]
        query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])

        rows = conn.execute(query, params).fetchall()
        models = [ModelRecord(**row_to_dict(r)) for r in rows]
        return models, total
    finally:
        conn.close()


def update_model_status(
    model_id: str, new_status: PromotionStatus
) -> ModelRecord:
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT * FROM models WHERE id = ?", (model_id,)
        ).fetchone()
        if not row:
            raise NotFoundError("Model", model_id)

        promoted_at = now_iso() if new_status == PromotionStatus.PRODUCTION else None
        conn.execute(
            "UPDATE models SET status = ?, promoted_at = COALESCE(?, promoted_at) WHERE id = ?",
            (new_status.value, promoted_at, model_id),
        )
        conn.commit()

        row = conn.execute(
            "SELECT * FROM models WHERE id = ?", (model_id,)
        ).fetchone()
        return ModelRecord(**row_to_dict(row))
    finally:
        conn.close()
