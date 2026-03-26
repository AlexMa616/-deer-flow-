"""Configuration for vector indexing and semantic search."""

from pydantic import BaseModel, ConfigDict, Field


class EmbeddingConfig(BaseModel):
    """Configuration for embedding provider."""

    use: str = Field(..., description="Class path for embeddings provider")
    model: str | None = Field(default=None, description="Embedding model name")
    model_config = ConfigDict(extra="allow")


class VectorConfig(BaseModel):
    """Configuration for vector index."""

    enabled: bool = Field(default=True, description="Enable vector indexing")
    storage_path: str = Field(default=".deer-flow/vector-index.duckdb", description="Vector index storage path (relative to backend)")
    embedding: EmbeddingConfig | None = Field(default=None, description="Embedding provider configuration")
    incremental: bool = Field(default=True, description="Enable incremental indexing (only new/changed chunks)")
    dedupe: bool = Field(default=True, description="Deduplicate identical chunks per document")
    batch_size: int = Field(default=32, ge=1, le=512, description="Embedding batch size for documents")
    parallel_workers: int = Field(default=2, ge=1, le=8, description="Parallel workers for embedding batches")
    parallel_min_chunks: int = Field(default=24, ge=1, le=2048, description="Minimum chunks before parallel embedding kicks in")


_vector_config: VectorConfig = VectorConfig()


def get_vector_config() -> VectorConfig:
    """Get vector configuration."""
    return _vector_config


def set_vector_config(config: VectorConfig) -> None:
    """Set vector configuration."""
    global _vector_config
    _vector_config = config


def load_vector_config_from_dict(config_dict: dict) -> None:
    """Load vector configuration from dict."""
    global _vector_config
    _vector_config = VectorConfig(**config_dict)
