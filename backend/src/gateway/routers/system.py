import os
import time
from datetime import UTC, datetime
from pathlib import Path
from typing import Literal

import duckdb
from fastapi import APIRouter
from pydantic import BaseModel, Field

from src.agents.memory.updater import get_memory_data
from src.config import get_app_config, get_extensions_config, get_vector_config
from src.config.memory_config import get_memory_config
from src.gateway.ops.metrics import get_metrics_store
from src.sandbox.consts import THREAD_DATA_BASE_DIR

router = APIRouter(prefix="/api", tags=["system"])
_START_TS = time.time()


class StorageStats(BaseModel):
    """Aggregate storage stats."""

    files: int = Field(default=0, description="File count")
    bytes: int = Field(default=0, description="Total bytes")


class ThreadStats(BaseModel):
    """Aggregate per-thread stats."""

    count: int = Field(default=0, description="Thread count")
    uploads: StorageStats
    outputs: StorageStats
    workspace: StorageStats


class MemorySummary(BaseModel):
    """Memory configuration and status."""

    enabled: bool
    injection_enabled: bool
    facts: int
    last_updated: str | None
    storage_path: str


class ModelSummary(BaseModel):
    """Model capability summary."""

    configured: int
    supports_thinking: int
    supports_vision: int


class ExtensionsSummary(BaseModel):
    """Extensions configuration summary."""

    mcp_enabled: int
    skills_enabled: int


class VectorSummary(BaseModel):
    """Vector index summary."""

    enabled: bool
    documents: int


class SystemRecommendation(BaseModel):
    """System optimization recommendation."""

    id: str
    level: Literal["info", "warn", "action"]
    title: str
    detail: str


class SystemOverview(BaseModel):
    """System overview response."""

    service: str
    timestamp: str
    uptime_seconds: int
    sandbox_mode: str
    threads: ThreadStats
    memory: MemorySummary
    models: ModelSummary
    extensions: ExtensionsSummary
    vector: VectorSummary
    recommendations: list[SystemRecommendation]


_CACHE_TTL_SECONDS = 8
_THREAD_STATS_CACHE: tuple[float, ThreadStats] | None = None
_VECTOR_SUMMARY_CACHE: tuple[float, VectorSummary] | None = None
_MEMORY_SUMMARY_CACHE: tuple[float, MemorySummary] | None = None


def _collect_storage_stats(path: Path) -> StorageStats:
    if not path.exists():
        return StorageStats()

    file_count = 0
    byte_count = 0

    stack = [path]
    while stack:
        current = stack.pop()
        try:
            with os.scandir(current) as entries:
                for entry in entries:
                    try:
                        if entry.is_dir(follow_symlinks=False):
                            stack.append(Path(entry.path))
                        elif entry.is_file(follow_symlinks=False):
                            file_count += 1
                            try:
                                byte_count += entry.stat(follow_symlinks=False).st_size
                            except OSError:
                                continue
                    except OSError:
                        continue
        except OSError:
            continue
    return StorageStats(files=file_count, bytes=byte_count)


def _merge_storage_stats(left: StorageStats, right: StorageStats) -> StorageStats:
    return StorageStats(files=left.files + right.files, bytes=left.bytes + right.bytes)


def _get_sandbox_mode() -> str:
    config = get_app_config()
    sandbox_use = (config.sandbox.use or "").lower()
    if "aio_sandbox" in sandbox_use:
        return "aio"
    if "local" in sandbox_use:
        return "local"
    return "custom"


def _get_thread_stats() -> ThreadStats:
    base_dir = Path.cwd() / THREAD_DATA_BASE_DIR
    if not base_dir.exists():
        return ThreadStats(count=0, uploads=StorageStats(), outputs=StorageStats(), workspace=StorageStats())

    thread_dirs = [path for path in base_dir.iterdir() if path.is_dir()]

    uploads_total = StorageStats()
    outputs_total = StorageStats()
    workspace_total = StorageStats()

    for thread_dir in thread_dirs:
        user_data = thread_dir / "user-data"
        uploads_total = _merge_storage_stats(uploads_total, _collect_storage_stats(user_data / "uploads"))
        outputs_total = _merge_storage_stats(outputs_total, _collect_storage_stats(user_data / "outputs"))
        workspace_total = _merge_storage_stats(workspace_total, _collect_storage_stats(user_data / "workspace"))

    return ThreadStats(
        count=len(thread_dirs),
        uploads=uploads_total,
        outputs=outputs_total,
        workspace=workspace_total,
    )


def _get_thread_stats_cached() -> ThreadStats:
    global _THREAD_STATS_CACHE
    now = time.monotonic()
    if _THREAD_STATS_CACHE and now - _THREAD_STATS_CACHE[0] < _CACHE_TTL_SECONDS:
        return _THREAD_STATS_CACHE[1]
    stats = _get_thread_stats()
    _THREAD_STATS_CACHE = (now, stats)
    return stats


def _get_memory_summary(memory_config) -> MemorySummary:
    memory_data = get_memory_data()
    return MemorySummary(
        enabled=memory_config.enabled,
        injection_enabled=memory_config.injection_enabled,
        facts=len(memory_data.get("facts", [])),
        last_updated=memory_data.get("lastUpdated"),
        storage_path=memory_config.storage_path,
    )


def _get_memory_summary_cached(memory_config) -> MemorySummary:
    global _MEMORY_SUMMARY_CACHE
    now = time.monotonic()
    if _MEMORY_SUMMARY_CACHE and now - _MEMORY_SUMMARY_CACHE[0] < _CACHE_TTL_SECONDS:
        return _MEMORY_SUMMARY_CACHE[1]
    summary = _get_memory_summary(memory_config)
    _MEMORY_SUMMARY_CACHE = (now, summary)
    return summary


def _build_recommendations(
    models: ModelSummary,
    extensions: ExtensionsSummary,
    memory: MemorySummary,
    threads: ThreadStats,
    sandbox_mode: str,
    vector: VectorSummary,
) -> list[SystemRecommendation]:
    recommendations: list[SystemRecommendation] = []

    if models.configured == 0:
        recommendations.append(
            SystemRecommendation(
                id="models_missing",
                level="action",
                title="请先配置至少一个模型",
                detail="请在 config.yaml 中添加模型配置，否则智能体无法执行任务。",
            )
        )

    if not memory.enabled:
        recommendations.append(
            SystemRecommendation(
                id="memory_disabled",
                level="action",
                title="建议开启记忆能力",
                detail="在 config.yaml 中启用 memory，可跨会话保留上下文连续性。",
            )
        )
    elif not memory.injection_enabled:
        recommendations.append(
            SystemRecommendation(
                id="memory_injection_off",
                level="info",
                title="记忆注入当前已关闭",
                detail="开启 memory injection 后，智能体可更好地个性化响应。",
            )
        )

    if extensions.mcp_enabled == 0:
        recommendations.append(
            SystemRecommendation(
                id="mcp_none",
                level="info",
                title="暂无 MCP 工具启用",
                detail="建议启用 MCP 服务，以扩展可用工具能力。",
            )
        )

    if not vector.enabled:
        recommendations.append(
            SystemRecommendation(
                id="vector_disabled",
                level="info",
                title="向量索引未启用",
                detail="启用向量索引后可使用语义检索与引用定位能力。",
            )
        )

    if sandbox_mode == "local":
        recommendations.append(
            SystemRecommendation(
                id="sandbox_local",
                level="info",
                title="当前为本地沙盒模式",
                detail="生产环境建议使用容器化沙盒，以获得更强隔离性。",
            )
        )

    total_bytes = threads.uploads.bytes + threads.outputs.bytes + threads.workspace.bytes
    if total_bytes > 500 * 1024 * 1024:
        recommendations.append(
            SystemRecommendation(
                id="storage_cleanup",
                level="warn",
                title="存储占用持续增长",
                detail="建议归档或清理历史上传与产出文件，保持空间健康。",
            )
        )

    if threads.count == 0:
        recommendations.append(
            SystemRecommendation(
                id="start_first_thread",
                level="info",
                title="当前暂无活跃会话",
                detail="可先创建一个新对话，初始化会话与工作区数据。",
            )
        )

    return recommendations


def _get_vector_summary() -> VectorSummary:
    config = get_vector_config()
    if not config.enabled:
        return VectorSummary(enabled=False, documents=0)
    storage_path = Path.cwd() / config.storage_path
    if not storage_path.exists():
        return VectorSummary(enabled=True, documents=0)
    try:
        conn = duckdb.connect(str(storage_path), read_only=True)
        count = conn.execute("SELECT COUNT(*) FROM documents").fetchone()[0]
        conn.close()
        return VectorSummary(enabled=True, documents=int(count))
    except Exception:
        return VectorSummary(enabled=True, documents=0)


def _get_vector_summary_cached() -> VectorSummary:
    global _VECTOR_SUMMARY_CACHE
    now = time.monotonic()
    if _VECTOR_SUMMARY_CACHE and now - _VECTOR_SUMMARY_CACHE[0] < _CACHE_TTL_SECONDS:
        return _VECTOR_SUMMARY_CACHE[1]
    summary = _get_vector_summary()
    _VECTOR_SUMMARY_CACHE = (now, summary)
    return summary


@router.get(
    "/system/overview",
    response_model=SystemOverview,
    summary="System Overview",
    description="Aggregated status, storage, and optimization hints for the DeerFlow backend.",
)
async def get_system_overview() -> SystemOverview:
    app_config = get_app_config()
    extensions_config = get_extensions_config()
    memory_config = get_memory_config()

    memory_summary = _get_memory_summary_cached(memory_config)

    model_summary = ModelSummary(
        configured=len(app_config.models),
        supports_thinking=sum(1 for model in app_config.models if model.supports_thinking),
        supports_vision=sum(1 for model in app_config.models if model.supports_vision),
    )

    extensions_summary = ExtensionsSummary(
        mcp_enabled=len(extensions_config.get_enabled_mcp_servers()),
        skills_enabled=sum(1 for skill in extensions_config.skills.values() if skill.enabled),
    )

    thread_stats = _get_thread_stats_cached()
    sandbox_mode = _get_sandbox_mode()
    vector_summary = _get_vector_summary_cached()

    recommendations = _build_recommendations(
        models=model_summary,
        extensions=extensions_summary,
        memory=memory_summary,
        threads=thread_stats,
        sandbox_mode=sandbox_mode,
        vector=vector_summary,
    )

    return SystemOverview(
        service="deer-flow-gateway",
        timestamp=datetime.now(UTC).isoformat(),
        uptime_seconds=max(int(time.time() - _START_TS), 0),
        sandbox_mode=sandbox_mode,
        threads=thread_stats,
        memory=memory_summary,
        models=model_summary,
        extensions=extensions_summary,
        vector=vector_summary,
        recommendations=recommendations,
    )


@router.get(
    "/system/metrics",
    summary="System Metrics",
    description="Lightweight metrics snapshot for operational monitoring.",
)
async def get_system_metrics() -> dict:
    return get_metrics_store().snapshot()
