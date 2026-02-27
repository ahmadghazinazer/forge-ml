# Copyright (c) 2025-2026 Ahmad Al-Nazer. All rights reserved.
# https://www.linkedin.com/in/ahmadghazinazer

from typing import Optional
from fastapi import APIRouter, Query

from core.schemas import RunLaunch, RunRecord, RunMetrics, PaginatedResponse
from services import training_service

router = APIRouter(prefix="/runs", tags=["runs"])


@router.post("/launch", response_model=RunRecord, status_code=201)
def launch_run(payload: RunLaunch):
    return training_service.launch_run(payload)


@router.get("", response_model=PaginatedResponse)
def list_runs(
    status: Optional[str] = Query(None),
    recipe: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
):
    offset = (page - 1) * page_size
    runs, total = training_service.list_runs(
        status=status, recipe=recipe,
        limit=page_size, offset=offset,
    )
    return PaginatedResponse(
        items=[r.model_dump() for r in runs],
        total=total, page=page, page_size=page_size,
    )


@router.get("/{run_id}", response_model=RunRecord)
def get_run(run_id: str):
    return training_service.get_run(run_id)


@router.get("/{run_id}/metrics", response_model=list[RunMetrics])
def get_run_metrics(
    run_id: str,
    last_n: Optional[int] = Query(None, ge=1, le=1000),
):
    return training_service.get_run_metrics(run_id, last_n=last_n)


@router.post("/{run_id}/cancel", response_model=RunRecord)
def cancel_run(run_id: str):
    return training_service.cancel_run(run_id)
