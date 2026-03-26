import logging

from langchain_core.embeddings import Embeddings

from src.config import get_vector_config
from src.reflection import resolve_class

logger = logging.getLogger(__name__)


def create_embeddings() -> Embeddings | None:
    """Create embeddings instance from vector config."""
    config = get_vector_config()
    if not config.enabled:
        return None
    if config.embedding is None:
        logger.warning("Vector indexing enabled but no embedding config provided.")
        return None
    try:
        embedding_cls = resolve_class(config.embedding.use, Embeddings)
    except Exception as exc:
        logger.error("Failed to resolve embeddings class: %s", exc, exc_info=True)
        return None

    settings = config.embedding.model_dump(exclude_none=True, exclude={"use"})
    try:
        return embedding_cls(**settings)
    except Exception as exc:
        logger.error("Failed to initialize embeddings: %s", exc, exc_info=True)
        return None
