import time
import uuid

from fastapi import Request
from fastapi.responses import JSONResponse

from src.config import get_ops_config
from src.gateway.auth.security import decode_access_token
from src.gateway.ops.metrics import get_metrics_store
from src.gateway.ops.rate_limit import get_quota_store, get_rate_limiter


def _get_identity(request: Request, *, per_user: bool, per_ip: bool) -> str:
    auth_header = request.headers.get("authorization") or ""
    if per_user and auth_header.lower().startswith("bearer "):
        token = auth_header.split(" ", 1)[1]
        payload = decode_access_token(token)
        if payload and payload.get("user_id"):
            return f"user:{payload['user_id']}"
    if per_ip:
        client_host = request.client.host if request.client else "unknown"
        return f"ip:{client_host}"
    return "global"


def _is_exempt_path(path: str, prefixes: list[str]) -> bool:
    return any(path.startswith(prefix) for prefix in prefixes)


async def ops_middleware(request: Request, call_next):
    config = get_ops_config()
    request_id = request.headers.get("x-request-id") or uuid.uuid4().hex
    request.state.request_id = request_id

    path = request.url.path
    identity = _get_identity(
        request,
        per_user=config.rate_limit.per_user,
        per_ip=config.rate_limit.per_ip,
    )

    if request.method != "OPTIONS" and not _is_exempt_path(path, config.rate_limit.exempt_paths):
        rate_limiter = get_rate_limiter()
        quota_store = get_quota_store()

        if config.rate_limit.enabled and not rate_limiter.allow(identity):
            response = JSONResponse({"detail": "Rate limit exceeded"}, status_code=429)
            if config.metrics.enabled:
                get_metrics_store().record(path, response.status_code, 0.0)
            response.headers["Retry-After"] = str(config.rate_limit.window_seconds)
            response.headers["X-Request-Id"] = request_id
            return response

        if config.quota.enabled:
            quota_identity = _get_identity(
                request,
                per_user=True,
                per_ip=config.quota.include_anon,
            )
            if quota_identity.startswith("ip:") and not config.quota.include_anon:
                pass
            elif not quota_store.allow(quota_identity):
                response = JSONResponse({"detail": "Daily quota exceeded"}, status_code=429)
                if config.metrics.enabled:
                    get_metrics_store().record(path, response.status_code, 0.0)
                response.headers["X-Request-Id"] = request_id
                return response

    start = time.time()
    try:
        response = await call_next(request)
    except Exception:
        if config.metrics.enabled:
            get_metrics_store().record(path, 500, (time.time() - start) * 1000)
        raise
    latency_ms = (time.time() - start) * 1000
    if config.metrics.enabled:
        get_metrics_store().record(path, response.status_code, latency_ms)

    response.headers["X-Request-Id"] = request_id
    return response
