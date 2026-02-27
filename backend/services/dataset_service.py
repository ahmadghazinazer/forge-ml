# Copyright (c) 2025-2026 Ahmad Al-Nazer. All rights reserved.
# https://www.linkedin.com/in/ahmadghazinazer

import hashlib
import uuid
from typing import Optional

from core.db import get_connection, now_iso, serialize_json, row_to_dict
from core.schemas import DatasetRegister, DatasetRecord
from core.exceptions import NotFoundError, ConflictError


PII_PATTERNS = [
    "social_security", "ssn", "credit_card", "passport",
    "phone_number", "email_address", "date_of_birth",
]


def _compute_checksum(source_path: str) -> str:
    h = hashlib.sha256()
    h.update(source_path.encode())
    h.update(now_iso().encode())
    return h.hexdigest()[:16]


def register_dataset(payload: DatasetRegister) -> DatasetRecord:
    conn = get_connection()
    try:
        existing = conn.execute(
            "SELECT id FROM datasets WHERE name = ? AND version = ?",
            (payload.name, payload.version),
        ).fetchone()
        if existing:
            raise ConflictError(
                f"Dataset '{payload.name}' version '{payload.version}' already exists"
            )

        dataset_id = str(uuid.uuid4())[:12]
        checksum = _compute_checksum(payload.source_path)
        created = now_iso()

        conn.execute(
            """INSERT INTO datasets
               (id, name, version, source_path, format, description,
                license, pii_checked, tags, row_count, parent_dataset_id,
                checksum, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                dataset_id, payload.name, payload.version, payload.source_path,
                payload.format, payload.description, payload.license,
                int(payload.pii_checked), serialize_json(payload.tags),
                payload.row_count, payload.parent_dataset_id,
                checksum, created,
            ),
        )
        conn.commit()

        row = conn.execute(
            "SELECT * FROM datasets WHERE id = ?", (dataset_id,)
        ).fetchone()
        return DatasetRecord(**row_to_dict(row))
    finally:
        conn.close()


def get_dataset(dataset_id: str) -> DatasetRecord:
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT * FROM datasets WHERE id = ?", (dataset_id,)
        ).fetchone()
        if not row:
            raise NotFoundError("Dataset", dataset_id)
        return DatasetRecord(**row_to_dict(row))
    finally:
        conn.close()


def list_datasets(
    name: Optional[str] = None,
    version: Optional[str] = None,
    tag: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[DatasetRecord], int]:
    conn = get_connection()
    try:
        query = "SELECT * FROM datasets WHERE 1=1"
        count_query = "SELECT COUNT(*) FROM datasets WHERE 1=1"
        params = []

        if name:
            query += " AND name LIKE ?"
            count_query += " AND name LIKE ?"
            params.append(f"%{name}%")
        if version:
            query += " AND version = ?"
            count_query += " AND version = ?"
            params.append(version)

        total = conn.execute(count_query, params).fetchone()[0]

        query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])

        rows = conn.execute(query, params).fetchall()
        datasets = [DatasetRecord(**row_to_dict(r)) for r in rows]

        if tag:
            datasets = [d for d in datasets if tag in d.tags]

        return datasets, total
    finally:
        conn.close()


def get_dataset_lineage(dataset_id: str) -> list[DatasetRecord]:
    lineage = []
    current_id = dataset_id
    visited = set()

    while current_id and current_id not in visited:
        visited.add(current_id)
        ds = get_dataset(current_id)
        lineage.append(ds)
        current_id = ds.parent_dataset_id

    return lineage


def scan_pii_fields(field_names: list[str]) -> list[str]:
    flagged = []
    for field in field_names:
        normalized = field.lower().replace("-", "_").replace(" ", "_")
        for pattern in PII_PATTERNS:
            if pattern in normalized:
                flagged.append(field)
                break
    return flagged


def delete_dataset(dataset_id: str) -> bool:
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT id FROM datasets WHERE id = ?", (dataset_id,)
        ).fetchone()
        if not row:
            raise NotFoundError("Dataset", dataset_id)

        refs = conn.execute(
            "SELECT COUNT(*) FROM runs WHERE dataset_id = ?", (dataset_id,)
        ).fetchone()[0]
        if refs > 0:
            raise ConflictError(
                f"Cannot delete dataset '{dataset_id}': referenced by {refs} run(s)"
            )

        conn.execute("DELETE FROM datasets WHERE id = ?", (dataset_id,))
        conn.commit()
        return True
    finally:
        conn.close()
