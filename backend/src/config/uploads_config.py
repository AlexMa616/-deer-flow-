"""Configuration for asynchronous upload processing."""

from pydantic import BaseModel, Field


class UploadsConfig(BaseModel):
    """Configuration for upload processing pipeline."""

    enabled: bool = Field(default=True, description="Enable async upload processing")
    async_processing: bool = Field(default=True, description="Process uploads asynchronously")
    max_workers: int = Field(default=2, ge=1, le=8, description="Max worker threads for upload processing")
    analysis_enabled: bool = Field(default=True, description="Enable content analysis for uploads")
    analysis_model_name: str | None = Field(default=None, description="Model name for upload analysis (null = default)")
    summary_max_chars: int = Field(default=800, ge=200, le=4000, description="Max characters for generated summary")
    keywords_max: int = Field(default=8, ge=3, le=20, description="Max keywords to return")
    chunk_chars: int = Field(default=1600, ge=300, le=4000, description="Chunk size for vector indexing (chars)")
    chunk_overlap: int = Field(default=200, ge=0, le=1200, description="Chunk overlap for vector indexing (chars)")
    max_chunks: int = Field(default=60, ge=5, le=200, description="Max chunks per document to index")


_uploads_config: UploadsConfig = UploadsConfig()


def get_uploads_config() -> UploadsConfig:
    """Get the upload processing configuration."""
    return _uploads_config


def set_uploads_config(config: UploadsConfig) -> None:
    """Set upload processing configuration."""
    global _uploads_config
    _uploads_config = config


def load_uploads_config_from_dict(config_dict: dict) -> None:
    """Load upload processing configuration from a dictionary."""
    global _uploads_config
    _uploads_config = UploadsConfig(**config_dict)
