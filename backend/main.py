# Copyright (c) 2025-2026 Ahmad Al-Nazer. All rights reserved.
# https://www.linkedin.com/in/ahmadghazinazer

import sys
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import settings
from core.db import init_db
from core.exceptions import ForgeError
from routers import datasets, runs, models, evals
from services import cluster_service

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    logger.info("forge-ml v%s started", settings.version)
    yield
    logger.info("forge-ml shutting down")


app = FastAPI(
    title="forge-ml",
    description="LLM post-training platform API",
    version=settings.version,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(ForgeError)
async def forge_error_handler(request, exc: ForgeError):
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "error": exc.message},
    )


app.include_router(datasets.router)
app.include_router(runs.router)
app.include_router(models.router)
app.include_router(evals.router)


@app.get("/")
def root():
    return {
        "name": settings.app_name,
        "version": settings.version,
        "status": "operational",
    }


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.get("/cluster/status")
def cluster_status():
    return cluster_service.get_cluster_status()


@app.get("/cluster/cost")
def cluster_cost(num_gpus: int = 1, hours: float = 1.0):
    return cluster_service.estimate_cost(num_gpus, hours)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
