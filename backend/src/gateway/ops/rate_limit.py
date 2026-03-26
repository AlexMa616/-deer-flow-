import json
import os
import threading
import time
from datetime import datetime
from pathlib import Path

from src.config import get_ops_config


class RateLimiter:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._window_start = 0.0
        self._counts: dict[str, int] = {}

    def allow(self, identity: str) -> bool:
        config = get_ops_config().rate_limit
        if not config.enabled:
            return True
        now = time.time()
        with self._lock:
            if now - self._window_start >= config.window_seconds:
                self._window_start = now
                self._counts = {}

            current = self._counts.get(identity, 0)
            if current >= config.max_requests:
                return False
            self._counts[identity] = current + 1
            return True


class QuotaStore:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._path = Path(os.getcwd()) / ".deer-flow" / "quotas.json"
        self._path.parent.mkdir(parents=True, exist_ok=True)

    def _load(self) -> dict:
        if not self._path.exists():
            return {"date": "", "usage": {}}
        try:
            with open(self._path, encoding="utf-8") as f:
                return json.load(f)
        except (OSError, json.JSONDecodeError):
            return {"date": "", "usage": {}}

    def _save(self, data: dict) -> None:
        temp = self._path.with_suffix(".tmp")
        with open(temp, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        temp.replace(self._path)

    def allow(self, identity: str) -> bool:
        config = get_ops_config().quota
        if not config.enabled:
            return True

        today = datetime.utcnow().date().isoformat()
        with self._lock:
            data = self._load()
            if data.get("date") != today:
                data = {"date": today, "usage": {}}

            usage = data.setdefault("usage", {})
            current = usage.get(identity, 0)
            if current >= config.daily_requests:
                return False

            usage[identity] = current + 1
            self._save(data)
            return True


_rate_limiter = RateLimiter()
_quota_store = QuotaStore()


def get_rate_limiter() -> RateLimiter:
    return _rate_limiter


def get_quota_store() -> QuotaStore:
    return _quota_store
