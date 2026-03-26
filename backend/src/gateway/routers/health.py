import time
from datetime import UTC, datetime
from pathlib import Path
from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel, Field

from src.config import get_app_config, get_extensions_config

router = APIRouter(prefix="/api", tags=["health"])
_START_TS = time.time()


class HealthCheck(BaseModel):
    status: Literal["healthy", "degraded"] = Field(description="Check status")
    detail: str = Field(description="Human readable detail")


class HealthResponse(BaseModel):
    status: Literal["healthy", "degraded"] = Field(description="Overall status")
    service: str = Field(description="Service name")
    timestamp: str = Field(description="UTC timestamp")
    uptime_seconds: int = Field(description="Service uptime in seconds")
    checks: dict[str, HealthCheck] = Field(description="Component checks")


def _build_health_snapshot() -> HealthResponse:
    checks: dict[str, HealthCheck] = {}

    try:
        app_config = get_app_config()
        model_count = len(app_config.models)
        if model_count > 0:
            checks["config"] = HealthCheck(
                status="healthy",
                detail=f"loaded config with {model_count} model(s)",
            )
        else:
            checks["config"] = HealthCheck(
                status="degraded",
                detail="config loaded but no model configured",
            )
    except Exception as exc:
        checks["config"] = HealthCheck(
            status="degraded",
            detail=f"failed to load config: {exc}",
        )

    try:
        extensions = get_extensions_config()
        checks["extensions"] = HealthCheck(
            status="healthy",
            detail=f"{len(extensions.get_enabled_mcp_servers())} enabled MCP server(s)",
        )
    except Exception as exc:
        checks["extensions"] = HealthCheck(
            status="degraded",
            detail=f"failed to load extensions: {exc}",
        )

    auth_db = Path(__file__).resolve().parents[3] / ".deer-flow" / "users.db"
    checks["auth_db"] = HealthCheck(
        status="healthy" if auth_db.exists() else "degraded",
        detail=f"path={auth_db}",
    )

    overall_status: Literal["healthy", "degraded"] = (
        "healthy" if all(check.status == "healthy" for check in checks.values()) else "degraded"
    )

    return HealthResponse(
        status=overall_status,
        service="deer-flow-gateway",
        timestamp=datetime.now(UTC).isoformat(),
        uptime_seconds=max(int(time.time() - _START_TS), 0),
        checks=checks,
    )


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Gateway Health",
    description="Health details for API gateway and key local dependencies.",
)
async def api_health_check() -> HealthResponse:
    return _build_health_snapshot()


def get_health_snapshot() -> HealthResponse:
    return _build_health_snapshot()
