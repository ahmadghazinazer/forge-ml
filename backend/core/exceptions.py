# Copyright (c) 2025-2026 Ahmad Al-Nazer. All rights reserved.
# https://www.linkedin.com/in/ahmadghazinazer

from fastapi import HTTPException, status


class ForgeError(Exception):
    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class NotFoundError(ForgeError):
    def __init__(self, resource: str, resource_id: str):
        super().__init__(
            message=f"{resource} '{resource_id}' not found",
            status_code=404,
        )


class ConflictError(ForgeError):
    def __init__(self, message: str):
        super().__init__(message=message, status_code=409)


class ValidationError(ForgeError):
    def __init__(self, message: str):
        super().__init__(message=message, status_code=422)


class RunFailedError(ForgeError):
    def __init__(self, run_id: str, reason: str):
        super().__init__(
            message=f"Run '{run_id}' failed: {reason}",
            status_code=500,
        )


class EvalGateError(ForgeError):
    def __init__(self, model_id: str, score: float, threshold: float):
        super().__init__(
            message=(
                f"Model '{model_id}' did not pass eval gate: "
                f"score {score:.4f} < threshold {threshold:.4f}"
            ),
            status_code=422,
        )


def raise_not_found(resource: str, resource_id: str):
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"{resource} '{resource_id}' not found",
    )


def raise_conflict(message: str):
    raise HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail=message,
    )
