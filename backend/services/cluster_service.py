# Copyright (c) 2025-2026 Ahmad Al-Nazer. All rights reserved.
# https://www.linkedin.com/in/ahmadghazinazer

import uuid
import time
import random
import logging
from dataclasses import dataclass, field
from typing import Optional

logger = logging.getLogger(__name__)


@dataclass
class NodeInfo:
    node_id: str
    gpu_count: int
    gpu_type: str = "A100"
    status: str = "healthy"
    gpu_utilization: float = 0.0
    memory_utilization: float = 0.0
    last_heartbeat: float = 0.0
    assigned_run_id: Optional[str] = None
    failure_count: int = 0


@dataclass
class ClusterState:
    nodes: dict[str, NodeInfo] = field(default_factory=dict)
    total_gpus: int = 0
    available_gpus: int = 0
    cost_per_gpu_hour: float = 2.50


_cluster = ClusterState()


def _init_simulated_cluster():
    node_configs = [
        ("node-01", 8, "A100-80GB"),
        ("node-02", 8, "A100-80GB"),
        ("node-03", 4, "A100-40GB"),
        ("node-04", 4, "H100"),
    ]
    for node_id, gpus, gpu_type in node_configs:
        _cluster.nodes[node_id] = NodeInfo(
            node_id=node_id,
            gpu_count=gpus,
            gpu_type=gpu_type,
            last_heartbeat=time.time(),
            gpu_utilization=random.uniform(0, 0.3),
            memory_utilization=random.uniform(0.1, 0.4),
        )
    _cluster.total_gpus = sum(n.gpu_count for n in _cluster.nodes.values())
    _cluster.available_gpus = _cluster.total_gpus


_init_simulated_cluster()


def get_cluster_status() -> dict:
    healthy = sum(1 for n in _cluster.nodes.values() if n.status == "healthy")
    degraded = sum(1 for n in _cluster.nodes.values() if n.status == "degraded")
    offline = sum(1 for n in _cluster.nodes.values() if n.status == "offline")

    avg_util = 0.0
    if _cluster.nodes:
        avg_util = sum(
            n.gpu_utilization for n in _cluster.nodes.values()
        ) / len(_cluster.nodes)

    return {
        "total_nodes": len(_cluster.nodes),
        "healthy": healthy,
        "degraded": degraded,
        "offline": offline,
        "total_gpus": _cluster.total_gpus,
        "available_gpus": _cluster.available_gpus,
        "avg_gpu_utilization": round(avg_util, 2),
        "cost_per_gpu_hour": _cluster.cost_per_gpu_hour,
        "nodes": [
            {
                "node_id": n.node_id,
                "gpu_count": n.gpu_count,
                "gpu_type": n.gpu_type,
                "status": n.status,
                "gpu_utilization": round(n.gpu_utilization, 2),
                "memory_utilization": round(n.memory_utilization, 2),
                "assigned_run_id": n.assigned_run_id,
                "failure_count": n.failure_count,
            }
            for n in _cluster.nodes.values()
        ],
    }


def allocate_gpus(run_id: str, num_gpus: int) -> list[str]:
    allocated = []
    for node in _cluster.nodes.values():
        if node.status != "healthy" or node.assigned_run_id is not None:
            continue
        if node.gpu_count >= num_gpus - len(allocated):
            allocated.append(node.node_id)
            node.assigned_run_id = run_id
            node.gpu_utilization = random.uniform(0.7, 0.95)
            node.memory_utilization = random.uniform(0.6, 0.9)
            if len(allocated) * node.gpu_count >= num_gpus:
                break

    _cluster.available_gpus = sum(
        n.gpu_count for n in _cluster.nodes.values()
        if n.assigned_run_id is None and n.status == "healthy"
    )
    return allocated


def release_gpus(run_id: str):
    for node in _cluster.nodes.values():
        if node.assigned_run_id == run_id:
            node.assigned_run_id = None
            node.gpu_utilization = random.uniform(0, 0.1)
            node.memory_utilization = random.uniform(0.1, 0.2)

    _cluster.available_gpus = sum(
        n.gpu_count for n in _cluster.nodes.values()
        if n.assigned_run_id is None and n.status == "healthy"
    )


def check_node_health(node_id: str) -> dict:
    node = _cluster.nodes.get(node_id)
    if not node:
        return {"error": f"Node '{node_id}' not found"}

    healthy = random.random() > 0.05
    if not healthy:
        node.failure_count += 1
        if node.failure_count >= 3:
            node.status = "offline"
            logger.warning("Node %s marked offline after %d failures", node_id, node.failure_count)
        else:
            node.status = "degraded"
    else:
        if node.failure_count > 0 and node.status == "degraded":
            node.failure_count = max(0, node.failure_count - 1)
            if node.failure_count == 0:
                node.status = "healthy"
        node.last_heartbeat = time.time()

    return {
        "node_id": node.node_id,
        "status": node.status,
        "failure_count": node.failure_count,
        "healthy": node.status == "healthy",
    }


def estimate_cost(num_gpus: int, estimated_hours: float) -> dict:
    gpu_cost = num_gpus * estimated_hours * _cluster.cost_per_gpu_hour
    overhead = gpu_cost * 0.15
    return {
        "gpu_cost": round(gpu_cost, 2),
        "platform_overhead": round(overhead, 2),
        "total_estimated": round(gpu_cost + overhead, 2),
        "breakdown": {
            "num_gpus": num_gpus,
            "hours": estimated_hours,
            "rate_per_gpu_hour": _cluster.cost_per_gpu_hour,
        },
    }
