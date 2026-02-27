# Copyright (c) 2025-2026 Ahmad Al-Nazer. All rights reserved.
# https://www.linkedin.com/in/ahmadghazinazer

import uuid
import random
import threading
import time
import logging
from typing import Optional

from core.db import get_connection, now_iso, serialize_json, row_to_dict
from core.schemas import (
    EvalRun, EvalRecord, EvalResult, EvalStatus,
)
from core.exceptions import NotFoundError

logger = logging.getLogger(__name__)

BENCHMARK_REGISTRY = {
    "default": ["accuracy", "perplexity", "toxicity", "coherence"],
    "safety": ["toxicity", "bias", "refusal_rate", "jailbreak_resistance"],
    "quality": ["accuracy", "fluency", "coherence", "relevance"],
    "reasoning": ["math_accuracy", "logic_score", "code_correctness"],
}

THRESHOLDS = {
    "accuracy": 0.70,
    "perplexity": 50.0,
    "toxicity": 0.15,
    "coherence": 0.65,
    "bias": 0.20,
    "refusal_rate": 0.80,
    "jailbreak_resistance": 0.85,
    "fluency": 0.70,
    "relevance": 0.65,
    "math_accuracy": 0.60,
    "logic_score": 0.55,
    "code_correctness": 0.50,
}


def _simulate_eval(eval_id: str, benchmarks: list[str]):
    conn = get_connection()
    try:
        conn.execute(
            "UPDATE evals SET status = ?, started_at = ? WHERE id = ?",
            (EvalStatus.RUNNING.value, now_iso(), eval_id),
        )
        conn.commit()

        results = []
        for bench in benchmarks:
            time.sleep(0.05)
            threshold = THRESHOLDS.get(bench, 0.5)

            if bench == "perplexity":
                score = random.uniform(15.0, 80.0)
                passed = score <= threshold
            else:
                score = random.uniform(0.4, 0.95)
                passed = score >= threshold

            results.append({
                "benchmark": bench,
                "score": round(score, 4),
                "passed": passed,
                "threshold": threshold,
                "details": {"samples_evaluated": random.randint(100, 1000)},
            })

        all_passed = all(r["passed"] for r in results)
        scores = [r["score"] for r in results if r["benchmark"] != "perplexity"]
        overall = sum(scores) / len(scores) if scores else 0.0

        status = EvalStatus.PASSED.value if all_passed else EvalStatus.FAILED.value
        conn.execute(
            """UPDATE evals SET status = ?, results = ?, overall_score = ?,
               completed_at = ? WHERE id = ?""",
            (status, serialize_json(results), round(overall, 4), now_iso(), eval_id),
        )
        conn.commit()
    except Exception as exc:
        logger.error("Eval %s failed: %s", eval_id, exc)
        conn.execute(
            "UPDATE evals SET status = ? WHERE id = ?",
            (EvalStatus.ERROR.value, eval_id),
        )
        conn.commit()
    finally:
        conn.close()


def run_eval(payload: EvalRun) -> EvalRecord:
    conn = get_connection()
    try:
        model = conn.execute(
            "SELECT id FROM models WHERE id = ?", (payload.model_id,)
        ).fetchone()
        if not model:
            raise NotFoundError("Model", payload.model_id)

        benchmarks = payload.benchmarks
        if not benchmarks:
            benchmarks = BENCHMARK_REGISTRY.get(payload.suite, BENCHMARK_REGISTRY["default"])

        eval_id = str(uuid.uuid4())[:12]

        conn.execute(
            """INSERT INTO evals
               (id, model_id, suite, status, results,
                regression_baseline_id, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (
                eval_id, payload.model_id, payload.suite,
                EvalStatus.QUEUED.value, serialize_json([]),
                payload.regression_baseline_id, now_iso(),
            ),
        )
        conn.commit()

        t = threading.Thread(
            target=_simulate_eval, args=(eval_id, benchmarks), daemon=True
        )
        t.start()

        row = conn.execute(
            "SELECT * FROM evals WHERE id = ?", (eval_id,)
        ).fetchone()
        data = row_to_dict(row)
        data["results"] = [EvalResult(**r) for r in data.get("results", [])]
        return EvalRecord(**data)
    finally:
        conn.close()


def get_eval(eval_id: str) -> EvalRecord:
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT * FROM evals WHERE id = ?", (eval_id,)
        ).fetchone()
        if not row:
            raise NotFoundError("Eval", eval_id)
        data = row_to_dict(row)
        data["results"] = [EvalResult(**r) for r in data.get("results", [])]
        return EvalRecord(**data)
    finally:
        conn.close()


def list_evals(
    model_id: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[EvalRecord], int]:
    conn = get_connection()
    try:
        query = "SELECT * FROM evals WHERE 1=1"
        count_query = "SELECT COUNT(*) FROM evals WHERE 1=1"
        params = []

        if model_id:
            query += " AND model_id = ?"
            count_query += " AND model_id = ?"
            params.append(model_id)
        if status:
            query += " AND status = ?"
            count_query += " AND status = ?"
            params.append(status)

        total = conn.execute(count_query, params).fetchone()[0]
        query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])

        rows = conn.execute(query, params).fetchall()
        evals = []
        for r in rows:
            data = row_to_dict(r)
            data["results"] = [EvalResult(**res) for res in data.get("results", [])]
            evals.append(EvalRecord(**data))
        return evals, total
    finally:
        conn.close()


def compare_evals(eval_id: str, baseline_id: str) -> dict:
    current = get_eval(eval_id)
    baseline = get_eval(baseline_id)

    comparison = {"eval_id": eval_id, "baseline_id": baseline_id, "regressions": []}
    baseline_scores = {r.benchmark: r.score for r in baseline.results}

    for result in current.results:
        baseline_score = baseline_scores.get(result.benchmark)
        if baseline_score is None:
            continue

        delta = result.score - baseline_score
        regressed = delta < -0.05 if result.benchmark != "perplexity" else delta > 5.0

        comparison["regressions"].append({
            "benchmark": result.benchmark,
            "current": result.score,
            "baseline": baseline_score,
            "delta": round(delta, 4),
            "regressed": regressed,
        })

    return comparison
