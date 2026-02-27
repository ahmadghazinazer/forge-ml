# Copyright (c) 2025-2026 Ahmad Al-Nazer. All rights reserved.
# https://www.linkedin.com/in/ahmadghazinazer

from typing import Optional
from fastapi import APIRouter, Query, HTTPException

from core.schemas import DatasetRegister, DatasetRecord, PaginatedResponse
from services import dataset_service

router = APIRouter(prefix="/datasets", tags=["datasets"])


@router.post("/register", response_model=DatasetRecord, status_code=201)
def register_dataset(payload: DatasetRegister):
    return dataset_service.register_dataset(payload)


@router.get("", response_model=PaginatedResponse)
def list_datasets(
    name: Optional[str] = Query(None),
    version: Optional[str] = Query(None),
    tag: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
):
    offset = (page - 1) * page_size
    datasets, total = dataset_service.list_datasets(
        name=name, version=version, tag=tag,
        limit=page_size, offset=offset,
    )
    return PaginatedResponse(
        items=[d.model_dump() for d in datasets],
        total=total, page=page, page_size=page_size,
    )


@router.get("/{dataset_id}", response_model=DatasetRecord)
def get_dataset(dataset_id: str):
    return dataset_service.get_dataset(dataset_id)


@router.get("/{dataset_id}/lineage", response_model=list[DatasetRecord])
def get_dataset_lineage(dataset_id: str):
    return dataset_service.get_dataset_lineage(dataset_id)


@router.post("/{dataset_id}/scan-pii")
def scan_pii(dataset_id: str, field_names: list[str]):
    ds = dataset_service.get_dataset(dataset_id)
    flagged = dataset_service.scan_pii_fields(field_names)
    return {
        "dataset_id": dataset_id,
        "fields_checked": len(field_names),
        "flagged_fields": flagged,
        "pii_risk": len(flagged) > 0,
    }


@router.delete("/{dataset_id}", status_code=204)
def delete_dataset(dataset_id: str):
    dataset_service.delete_dataset(dataset_id)
