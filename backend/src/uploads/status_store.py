import json
import os
import threading
from datetime import datetime
from pathlib import Path
from queue import Full, Queue
from typing import Any

from src.agents.middlewares.thread_data_middleware import THREAD_DATA_BASE_DIR

_lock = threading.Lock()
_subscribers_lock = threading.Lock()
_subscribers: dict[str, list[Queue[dict[str, Any]]]] = {}


def _subscriber_key(thread_id: str, filename: str | None) -> str:
    return f"{thread_id}:{filename or '*'}"


def subscribe_status(thread_id: str, filename: str | None = None) -> Queue[dict[str, Any]]:
    queue: Queue[dict[str, Any]] = Queue(maxsize=200)
    key = _subscriber_key(thread_id, filename)
    with _subscribers_lock:
        _subscribers.setdefault(key, []).append(queue)
    return queue


def unsubscribe_status(thread_id: str, queue: Queue[dict[str, Any]], filename: str | None = None) -> None:
    key = _subscriber_key(thread_id, filename)
    with _subscribers_lock:
        subscribers = _subscribers.get(key)
        if not subscribers:
            return
        if queue in subscribers:
            subscribers.remove(queue)
        if not subscribers:
            _subscribers.pop(key, None)


def _publish_update(thread_id: str, filename: str, payload: dict[str, Any]) -> None:
    keys = (_subscriber_key(thread_id, None), _subscriber_key(thread_id, filename))
    with _subscribers_lock:
        queues = [queue for key in keys for queue in _subscribers.get(key, [])]
    for queue in queues:
        try:
            queue.put_nowait(payload)
        except Full:
            continue


def _get_status_path(thread_id: str) -> Path:
    uploads_dir = Path(os.getcwd()) / THREAD_DATA_BASE_DIR / thread_id / "user-data" / "uploads"
    uploads_dir.mkdir(parents=True, exist_ok=True)
    return uploads_dir / ".status.json"


def _load_status(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {"jobs": {}}
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, json.JSONDecodeError):
        return {"jobs": {}}


def _save_status(path: Path, data: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temp_path = path.with_suffix(".tmp")
    with open(temp_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    temp_path.replace(path)


def get_job_status(thread_id: str, filename: str) -> dict[str, Any] | None:
    path = _get_status_path(thread_id)
    with _lock:
        data = _load_status(path)
        return data.get("jobs", {}).get(filename)


def list_job_statuses(thread_id: str) -> dict[str, dict[str, Any]]:
    path = _get_status_path(thread_id)
    with _lock:
        data = _load_status(path)
        return data.get("jobs", {})


def upsert_job_status(thread_id: str, filename: str, payload: dict[str, Any]) -> dict[str, Any]:
    path = _get_status_path(thread_id)
    with _lock:
        data = _load_status(path)
        jobs = data.setdefault("jobs", {})
        current = jobs.get(filename, {})
        merged = {**current, **payload}
        if isinstance(payload.get("steps"), dict):
            merged_steps = {**current.get("steps", {}), **payload["steps"]}
            merged["steps"] = merged_steps
        merged["updated_at"] = datetime.utcnow().isoformat() + "Z"
        merged["filename"] = filename
        jobs[filename] = merged
        _save_status(path, data)
        _publish_update(
            thread_id,
            filename,
            {
                "type": "status",
                "thread_id": thread_id,
                "filename": filename,
                "data": merged,
            },
        )
        return merged


def append_job_event(thread_id: str, filename: str, message: str, level: str = "info") -> None:
    path = _get_status_path(thread_id)
    with _lock:
        data = _load_status(path)
        jobs = data.setdefault("jobs", {})
        current = jobs.get(filename, {})
        events = list(current.get("events", []))
        event = {
            "time": datetime.utcnow().isoformat() + "Z",
            "level": level,
            "message": message,
        }
        events.append(event)
        current["events"] = events[-50:]
        current["updated_at"] = datetime.utcnow().isoformat() + "Z"
        current["filename"] = filename
        jobs[filename] = current
        _save_status(path, data)
        _publish_update(
            thread_id,
            filename,
            {
                "type": "event",
                "thread_id": thread_id,
                "filename": filename,
                "event": event,
                "data": current,
            },
        )


def remove_job_status(thread_id: str, filename: str) -> None:
    path = _get_status_path(thread_id)
    with _lock:
        data = _load_status(path)
        if filename in data.get("jobs", {}):
            data["jobs"].pop(filename, None)
            _save_status(path, data)
