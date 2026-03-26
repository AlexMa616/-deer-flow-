"""Upload router for handling file uploads."""

import hashlib
import json
import logging
import mimetypes
import os
from pathlib import Path
from queue import Empty
from typing import Literal

import anyio
from fastapi import APIRouter, File, HTTPException, Request, UploadFile
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from src.agents.middlewares.thread_data_middleware import THREAD_DATA_BASE_DIR
from src.config import get_uploads_config
from src.sandbox.sandbox_provider import get_sandbox_provider
from src.uploads import get_upload_processor
from src.uploads.status_store import (
    get_job_status,
    list_job_statuses,
    subscribe_status,
    unsubscribe_status,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/threads/{thread_id}/uploads", tags=["uploads"])

MAX_PREVIEW_BYTES = 4096


class UploadedFileInfo(BaseModel):
    """Response model for uploaded file metadata."""

    filename: str
    size: int
    path: str
    virtual_path: str
    artifact_url: str
    extension: str | None = None
    modified: float | None = None
    content_type: str | None = None
    checksum_sha256: str | None = None
    preview: str | None = None
    processing_job_id: str | None = None
    processing_status: str | None = None
    processing_progress: int | None = None
    markdown_file: str | None = None
    markdown_path: str | None = None
    markdown_virtual_path: str | None = None
    markdown_artifact_url: str | None = None


class UploadResponse(BaseModel):
    """Response model for file upload."""

    success: bool
    files: list[UploadedFileInfo]
    message: str


class UploadListResponse(BaseModel):
    """Response model for listing uploaded files."""

    files: list[UploadedFileInfo]
    count: int


class UploadProcessingStatus(BaseModel):
    """Status of upload processing job."""

    filename: str
    job_id: str | None
    status: Literal["queued", "processing", "completed", "failed", "cancelled"]
    progress: int
    steps: dict[str, str] = Field(default_factory=dict)
    summary: str | None = None
    keywords: list[str] = Field(default_factory=list)
    language: str | None = None
    highlights: list[str] = Field(default_factory=list)
    markdown_file: str | None = None
    error: str | None = None
    updated_at: str | None = None
    events: list[dict[str, str]] = Field(default_factory=list)


class UploadControlRequest(BaseModel):
    """Request payload for controlling upload processing jobs."""

    filename: str


class UploadControlResponse(BaseModel):
    """Response payload for controlling upload processing jobs."""

    success: bool
    status: str
    message: str


def get_uploads_dir(thread_id: str) -> Path:
    """Get the uploads directory for a thread.

    Args:
        thread_id: The thread ID.

    Returns:
        Path to the uploads directory.
    """
    base_dir = Path(os.getcwd()) / THREAD_DATA_BASE_DIR / thread_id / "user-data" / "uploads"
    base_dir.mkdir(parents=True, exist_ok=True)
    return base_dir


def sanitize_filename(filename: str) -> str:
    """Sanitize user-provided filename to avoid path traversal."""
    safe_name = Path(filename).name
    if not safe_name or safe_name in {".", ".."}:
        raise HTTPException(status_code=400, detail="Invalid filename")
    if "\x00" in safe_name:
        raise HTTPException(status_code=400, detail="Invalid filename")
    if safe_name != filename:
        logger.warning("Sanitized upload filename from '%s' to '%s'", filename, safe_name)
    return safe_name


def is_text_bytes(content: bytes) -> bool:
    """Check if content likely represents text data."""
    return b"\x00" not in content


def build_preview(content: bytes) -> str | None:
    """Build a short text preview for compatible files."""
    if not content:
        return None
    if not is_text_bytes(content):
        return None
    preview_bytes = content[:MAX_PREVIEW_BYTES]
    return preview_bytes.decode("utf-8", errors="replace")


@router.post("", response_model=UploadResponse)
async def upload_files(
    thread_id: str,
    files: list[UploadFile] = File(...),
) -> UploadResponse:
    """Upload multiple files to a thread's uploads directory.

    For PDF, PPT, Excel, and Word files, they will be converted to markdown using markitdown.
    All files (original and converted) are saved to /mnt/user-data/uploads.

    Args:
        thread_id: The thread ID to upload files to.
        files: List of files to upload.

    Returns:
        Upload response with success status and file information.
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")

    uploads_dir = get_uploads_dir(thread_id)
    uploaded_files = []
    uploads_config = get_uploads_config()

    sandbox_provider = get_sandbox_provider()
    sandbox_id = sandbox_provider.acquire(thread_id)
    sandbox = sandbox_provider.get(sandbox_id)
    if sandbox is None:
        raise HTTPException(status_code=500, detail="Sandbox not available")

    for file in files:
        if not file.filename:
            continue

        safe_filename = sanitize_filename(file.filename)

        try:
            # Save the original file
            file_path = uploads_dir / safe_filename
            content = await file.read()
            file_path.write_bytes(content)
            file_stat = file_path.stat()
            content_type = mimetypes.guess_type(safe_filename)[0]
            checksum = hashlib.sha256(content).hexdigest()

            # Build relative path from backend root
            relative_path = f".deer-flow/threads/{thread_id}/user-data/uploads/{safe_filename}"
            virtual_path = f"/mnt/user-data/uploads/{safe_filename}"
            if sandbox.id != "local":
                sandbox.update_file(virtual_path, content)

            file_info: dict[str, object] = {
                "filename": safe_filename,
                "size": len(content),
                "path": relative_path,  # Actual filesystem path (relative to backend/)
                "virtual_path": virtual_path,  # Path for Agent in sandbox
                "artifact_url": f"/api/threads/{thread_id}/artifacts/mnt/user-data/uploads/{safe_filename}",  # HTTP URL
                "extension": file_path.suffix,
                "modified": file_stat.st_mtime,
                "content_type": content_type,
                "checksum_sha256": checksum,
                "preview": build_preview(content),
            }

            if uploads_config.enabled and uploads_config.async_processing:
                job_id = get_upload_processor().enqueue(thread_id, safe_filename)
                status = get_job_status(thread_id, safe_filename)
                file_info["processing_job_id"] = job_id
                file_info["processing_status"] = status.get("status") if status else "queued"
                file_info["processing_progress"] = status.get("progress") if status else 0

            logger.info(f"Saved file: {safe_filename} ({len(content)} bytes) to {relative_path}")

            uploaded_files.append(UploadedFileInfo(**file_info))

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to upload {file.filename}: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to upload {file.filename}: {str(e)}")

    return UploadResponse(
        success=True,
        files=uploaded_files,
        message=f"Successfully uploaded {len(uploaded_files)} file(s)",
    )


@router.get("/list", response_model=UploadListResponse)
async def list_uploaded_files(thread_id: str) -> UploadListResponse:
    """List all files in a thread's uploads directory.

    Args:
        thread_id: The thread ID to list files for.

    Returns:
        Dictionary containing list of files with their metadata.
    """
    uploads_dir = get_uploads_dir(thread_id)

    if not uploads_dir.exists():
        return UploadListResponse(files=[], count=0)

    files: list[UploadedFileInfo] = []
    for file_path in sorted(uploads_dir.iterdir()):
        if file_path.is_file():
            if file_path.name.startswith("."):
                continue
            stat = file_path.stat()
            relative_path = f".deer-flow/threads/{thread_id}/user-data/uploads/{file_path.name}"
            files.append(
                UploadedFileInfo(
                    filename=file_path.name,
                    size=stat.st_size,
                    path=relative_path,  # Actual filesystem path (relative to backend/)
                    virtual_path=f"/mnt/user-data/uploads/{file_path.name}",  # Path for Agent in sandbox
                    artifact_url=f"/api/threads/{thread_id}/artifacts/mnt/user-data/uploads/{file_path.name}",  # HTTP URL
                    extension=file_path.suffix,
                    modified=stat.st_mtime,
                    content_type=mimetypes.guess_type(file_path.name)[0],
                )
            )

    return UploadListResponse(files=files, count=len(files))


@router.get("/status", response_model=list[UploadProcessingStatus])
async def list_upload_status(thread_id: str, filename: str | None = None) -> list[UploadProcessingStatus]:
    """Get upload processing status for a thread (optionally for a single file)."""
    statuses = list_job_statuses(thread_id)
    items: list[UploadProcessingStatus] = []
    for name, payload in statuses.items():
        if filename and name != filename:
            continue
        items.append(
            UploadProcessingStatus(
                filename=name,
                job_id=payload.get("job_id"),
                status=payload.get("status", "queued"),
                progress=int(payload.get("progress", 0)),
                steps=payload.get("steps", {}),
                summary=payload.get("summary"),
                keywords=payload.get("keywords", []),
                language=payload.get("language"),
                highlights=payload.get("highlights", []),
                markdown_file=payload.get("markdown_file"),
                error=payload.get("error"),
                updated_at=payload.get("updated_at"),
                events=payload.get("events", []),
            )
        )
    return items


@router.get("/stream")
async def stream_upload_status(
    request: Request,
    thread_id: str,
    filename: str | None = None,
) -> StreamingResponse:
    """Stream upload processing status updates via SSE."""

    def _format_sse(payload: dict) -> str:
        return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"

    async def event_generator():
        queue = subscribe_status(thread_id, filename)
        try:
            statuses = list_job_statuses(thread_id)
            for name, payload in statuses.items():
                if filename and name != filename:
                    continue
                payload_with_name = {**payload, "filename": name}
                yield _format_sse(
                    {
                        "type": "status",
                        "thread_id": thread_id,
                        "filename": name,
                        "data": payload_with_name,
                    }
                )

            while True:
                if await request.is_disconnected():
                    break
                try:
                    item = await anyio.to_thread.run_sync(queue.get, True, 10)
                    yield _format_sse(item)
                except Empty:
                    yield ": ping\n\n"
        finally:
            unsubscribe_status(thread_id, queue, filename)

    headers = {
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
    }
    return StreamingResponse(event_generator(), media_type="text/event-stream", headers=headers)


@router.post("/cancel", response_model=UploadControlResponse)
async def cancel_upload_job(thread_id: str, request: UploadControlRequest) -> UploadControlResponse:
    """Cancel an upload processing job."""
    safe_filename = sanitize_filename(request.filename)
    status = get_job_status(thread_id, safe_filename)
    if not status:
        raise HTTPException(status_code=404, detail=f"Job not found: {safe_filename}")
    if status.get("status") in {"completed", "failed", "cancelled"}:
        return UploadControlResponse(
            success=False,
            status=status.get("status", "unknown"),
            message="任务已结束，无法取消",
        )

    updated = get_upload_processor().cancel_job(thread_id, safe_filename)
    return UploadControlResponse(
        success=True,
        status=updated.get("status", "cancelled") if updated else "cancelled",
        message="已取消任务",
    )


@router.post("/retry", response_model=UploadControlResponse)
async def retry_upload_job(thread_id: str, request: UploadControlRequest) -> UploadControlResponse:
    """Retry an upload processing job."""
    safe_filename = sanitize_filename(request.filename)
    uploads_dir = get_uploads_dir(thread_id)
    file_path = uploads_dir / safe_filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"File not found: {safe_filename}")

    status = get_job_status(thread_id, safe_filename)
    if not status:
        raise HTTPException(status_code=404, detail=f"Job not found: {safe_filename}")
    if status.get("status") in {"queued", "processing"}:
        return UploadControlResponse(
            success=False,
            status=status.get("status", "processing"),
            message="任务正在处理中，无法重试",
        )

    updated = get_upload_processor().retry_job(thread_id, safe_filename)
    return UploadControlResponse(
        success=True,
        status=updated.get("status", "queued") if updated else "queued",
        message="已重新加入队列",
    )


@router.delete("/{filename}")
async def delete_uploaded_file(thread_id: str, filename: str) -> dict:
    """Delete a file from a thread's uploads directory.

    Args:
        thread_id: The thread ID.
        filename: The filename to delete.

    Returns:
        Success message.
    """
    uploads_dir = get_uploads_dir(thread_id)
    safe_filename = sanitize_filename(filename)
    file_path = uploads_dir / safe_filename

    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"File not found: {safe_filename}")

    # Security check: ensure the path is within the uploads directory
    try:
        file_path.resolve().relative_to(uploads_dir.resolve())
    except ValueError:
        raise HTTPException(status_code=403, detail="Access denied")

    try:
        file_path.unlink()
        logger.info(f"Deleted file: {safe_filename}")
        return {"success": True, "message": f"Deleted {safe_filename}"}
    except Exception as e:
        logger.error(f"Failed to delete {safe_filename}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete {safe_filename}: {str(e)}")
