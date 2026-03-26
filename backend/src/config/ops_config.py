"""Operational configuration for rate limiting, quotas, and metrics."""

from pydantic import BaseModel, Field


class RateLimitConfig(BaseModel):
    """Rate limiting configuration."""

    enabled: bool = Field(default=True, description="Enable rate limiting")
    window_seconds: int = Field(default=60, ge=1, le=3600, description="Rate limit window in seconds")
    max_requests: int = Field(default=120, ge=1, le=10000, description="Max requests per window")
    per_user: bool = Field(default=True, description="Apply rate limits per authenticated user")
    per_ip: bool = Field(default=True, description="Apply rate limits per IP for unauthenticated requests")
    exempt_paths: list[str] = Field(
        default_factory=lambda: ["/api/health", "/api/system/metrics"],
        description="Path prefixes exempt from rate limiting",
    )


class QuotaConfig(BaseModel):
    """Daily quota configuration."""

    enabled: bool = Field(default=True, description="Enable daily request quota")
    daily_requests: int = Field(default=10000, ge=100, le=1000000, description="Max requests per day")
    include_anon: bool = Field(default=True, description="Apply quota to anonymous traffic")


class MetricsConfig(BaseModel):
    """Metrics configuration."""

    enabled: bool = Field(default=True, description="Enable metrics collection")


class OpsConfig(BaseModel):
    """Operational config."""

    rate_limit: RateLimitConfig = Field(default_factory=RateLimitConfig)
    quota: QuotaConfig = Field(default_factory=QuotaConfig)
    metrics: MetricsConfig = Field(default_factory=MetricsConfig)


_ops_config: OpsConfig = OpsConfig()


def get_ops_config() -> OpsConfig:
    """Get ops configuration."""
    return _ops_config


def set_ops_config(config: OpsConfig) -> None:
    """Set ops configuration."""
    global _ops_config
    _ops_config = config


def load_ops_config_from_dict(config_dict: dict) -> None:
    """Load ops configuration from dict."""
    global _ops_config
    _ops_config = OpsConfig(**config_dict)
