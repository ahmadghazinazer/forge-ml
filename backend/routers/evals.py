# Copyright (c) 2025-2026 Ahmad Al-Nazer. All rights reserved.
# https://www.linkedin.com/in/ahmadghazinazer

from typing import Optional
from fastapi import APIRouter, Query

from core.schemas import EvalRun, EvalRecord, PaginatedResponse
from services import eval_service

router = APIRouter(prefix="/evals", tags=["evals"])


@router.post("/run", response_model=EvalRecord, status_code=201)
def run_eval(payload: EvalRun):
    return eval_service.run_eval(payload)


@router.get("", response_model=PaginatedResponse)
def list_evals(
    model_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
):
    offset = (page - 1) * page_size
    evals, total = eval_service.list_evals(
        model_id=model_id, status=status,
        limit=page_size, offset=offset,
    )
    return PaginatedResponse(
        items=[e.model_dump() for e in evals],
        total=total, page=page, page_size=page_size,
    )


@router.get("/{eval_id}", response_model=EvalRecord)
def get_eval(eval_id: str):
    return eval_service.get_eval(eval_id)


@router.get("/{eval_id}/compare/{baseline_id}")
def compare_evals(eval_id: str, baseline_id: str):
    return eval_service.compare_evals(eval_id, baseline_id)
