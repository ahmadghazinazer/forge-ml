# Copyright (c) 2025-2026 Ahmad Al-Nazer. All rights reserved.
# https://www.linkedin.com/in/ahmadghazinazer

from fastapi import Request, HTTPException, status
from config import settings


async def verify_api_key(request: Request):
    api_key = request.headers.get(settings.api_key_header)
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing API key",
        )
    if api_key != settings.default_api_key:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid API key",
        )
    return api_key


def get_tenant_id(request: Request) -> str:
    tenant = request.headers.get("X-Tenant-ID", "default")
    return tenant
