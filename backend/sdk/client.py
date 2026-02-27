# Copyright (c) 2025-2026 Ahmad Al-Nazer. All rights reserved.
# https://www.linkedin.com/in/ahmadghazinazer

import httpx
from typing import Optional


class ForgeClient:
    """Python SDK for programmatic access to forge-ml API."""

    def __init__(self, base_url: str = "http://localhost:8000", api_key: str = "dev-key-change-me"):
        self.base_url = base_url.rstrip("/")
        self.headers = {"X-API-Key": api_key, "Content-Type": "application/json"}
        self._client = httpx.Client(base_url=self.base_url, headers=self.headers, timeout=60.0)

    def close(self):
        self._client.close()

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self.close()

    def _handle(self, resp: httpx.Response) -> dict:
        resp.raise_for_status()
        return resp.json()

    # datasets

    def register_dataset(self, name: str, source_path: str, version: str = "1.0.0", **kwargs) -> dict:
        payload = {"name": name, "source_path": source_path, "version": version, **kwargs}
        return self._handle(self._client.post("/datasets/register", json=payload))

    def list_datasets(self, name: Optional[str] = None, page: int = 1) -> dict:
        params = {"page": page}
        if name:
            params["name"] = name
        return self._handle(self._client.get("/datasets", params=params))

    def get_dataset(self, dataset_id: str) -> dict:
        return self._handle(self._client.get(f"/datasets/{dataset_id}"))

    def get_lineage(self, dataset_id: str) -> list:
        return self._handle(self._client.get(f"/datasets/{dataset_id}/lineage"))

    # runs

    def launch_run(self, name: str, base_model: str, dataset_id: str, recipe: str = "lora_sft", **kwargs) -> dict:
        payload = {"name": name, "base_model": base_model, "dataset_id": dataset_id, "recipe": recipe, **kwargs}
        return self._handle(self._client.post("/runs/launch", json=payload))

    def list_runs(self, status: Optional[str] = None, page: int = 1) -> dict:
        params = {"page": page}
        if status:
            params["status"] = status
        return self._handle(self._client.get("/runs", params=params))

    def get_run(self, run_id: str) -> dict:
        return self._handle(self._client.get(f"/runs/{run_id}"))

    def get_metrics(self, run_id: str, last_n: Optional[int] = None) -> list:
        params = {}
        if last_n:
            params["last_n"] = last_n
        return self._handle(self._client.get(f"/runs/{run_id}/metrics", params=params))

    def cancel_run(self, run_id: str) -> dict:
        return self._handle(self._client.post(f"/runs/{run_id}/cancel"))

    # models

    def promote_model(self, run_id: str, name: str, version: str, **kwargs) -> dict:
        payload = {"run_id": run_id, "name": name, "version": version, **kwargs}
        return self._handle(self._client.post("/models/promote", json=payload))

    def list_models(self, status: Optional[str] = None, page: int = 1) -> dict:
        params = {"page": page}
        if status:
            params["status"] = status
        return self._handle(self._client.get("/models", params=params))

    def get_model(self, model_id: str) -> dict:
        return self._handle(self._client.get(f"/models/{model_id}"))

    # evals

    def run_eval(self, model_id: str, suite: str = "default", benchmarks: Optional[list] = None) -> dict:
        payload = {"model_id": model_id, "suite": suite}
        if benchmarks:
            payload["benchmarks"] = benchmarks
        return self._handle(self._client.post("/evals/run", json=payload))

    def list_evals(self, model_id: Optional[str] = None, page: int = 1) -> dict:
        params = {"page": page}
        if model_id:
            params["model_id"] = model_id
        return self._handle(self._client.get("/evals", params=params))

    def get_eval(self, eval_id: str) -> dict:
        return self._handle(self._client.get(f"/evals/{eval_id}"))

    # cluster

    def cluster_status(self) -> dict:
        return self._handle(self._client.get("/cluster/status"))

    def estimate_cost(self, num_gpus: int, hours: float) -> dict:
        return self._handle(self._client.get("/cluster/cost", params={"num_gpus": num_gpus, "hours": hours}))
