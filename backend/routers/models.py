# Copyright (c) 2025-2026 Ahmad Al-Nazer. All rights reserved.
# https://www.linkedin.com/in/ahmadghazinazer

from typing import Optional
from fastapi import APIRouter, Query

from core.schemas import (
    ModelPromote, ModelRecord, PromotionStatus, PaginatedResponse,
)
from services import registry_service

router = APIRouter(prefix="/models", tags=["models"])


@router.post("/promote", response_model=ModelRecord, status_code=201)
def promote_model(payload: ModelPromote):
    return registry_service.promote_model(payload)


@router.get("", response_model=PaginatedResponse)
def list_models(
    status: Optional[str] = Query(None),
    name: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
):
    offset = (page - 1) * page_size
    models, total = registry_service.list_models(
        status=status, name=name,
        limit=page_size, offset=offset,
    )
    return PaginatedResponse(
        items=[m.model_dump() for m in models],
        total=total, page=page, page_size=page_size,
    )


@router.get("/{model_id}", response_model=ModelRecord)
def get_model(model_id: str):
    return registry_service.get_model(model_id)


@router.patch("/{model_id}/status", response_model=ModelRecord)
def update_model_status(model_id: str, status: PromotionStatus):
    return registry_service.update_model_status(model_id, status)
