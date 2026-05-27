"""
SLN Design Engine v3 — State Store
File-based JSON state persistence for pipeline runs.
"""

from __future__ import annotations

import json
import logging
import re
from datetime import datetime
from pathlib import Path
from typing import Optional, List

logger = logging.getLogger(__name__)
ORDER_ID_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_.-]{0,79}$")


def sanitize_order_id(order_id: str) -> str:
    """Validate an order id before it is used in filesystem paths."""
    order_id = str(order_id or "").strip()
    if not ORDER_ID_RE.fullmatch(order_id):
        raise ValueError("Order ID may contain only letters, numbers, dot, dash, and underscore")
    if ".." in order_id or "/" in order_id or "\\" in order_id:
        raise ValueError("Order ID contains an invalid path segment")
    return order_id


def _get_orders_dir() -> Path:
    from config.settings import settings
    return settings.orders_dir


def _get_logs_dir() -> Path:
    from config.settings import settings
    return settings.logs_dir


def get_order_dir(order_id: str) -> Path:
    """Return the order directory path without creating it."""
    return _get_orders_dir() / sanitize_order_id(order_id)


def ensure_order_dir(order_id: str) -> Path:
    """Return the order directory path, creating it for write operations."""
    d = get_order_dir(order_id)
    d.mkdir(parents=True, exist_ok=True)
    return d


def save_state(order_id: str, state_dict: dict, expected_version: Optional[int] = None) -> Path:
    """Save pipeline state to JSON file safely.

    Implements atomic writes, file locking, and optimistic concurrency version checks.

    Args:
        order_id: Order identifier
        state_dict: Full pipeline state dict
        expected_version: If provided, raises ValueError if the disk version does not match.

    Returns:
        Path to saved state file
    """
    import os
    import time
    import tempfile

    order_dir = ensure_order_dir(order_id)
    path = order_dir / "state.json"
    lock_path = order_dir / "state.lock"

    # 1. Mutex File Lock
    for _ in range(100):
        try:
            fd = os.open(str(lock_path), os.O_CREAT | os.O_EXCL | os.O_WRONLY)
            os.close(fd)
            break
        except FileExistsError:
            time.sleep(0.05)
    else:
        raise RuntimeError(f"Timeout waiting for state lock on {order_id}")

    try:
        # 2. Version Check (Optimistic Concurrency)
        current_version = 0
        if path.exists():
            try:
                with open(path, "r", encoding="utf-8") as f:
                    current_state = json.load(f)
                    current_version = current_state.get("_version", 0)
            except Exception:
                pass
                
        if expected_version is not None and expected_version != current_version:
            raise ValueError(f"State synchronization error: version conflict. Expected {expected_version}, found {current_version}.")

        # Prepare serializable state
        serializable = _make_serializable(state_dict)
        serializable["_updated_at"] = datetime.now().isoformat()
        serializable["_version"] = current_version + 1

        # 3. Atomic Write
        temp_fd, temp_path = tempfile.mkstemp(dir=order_dir, prefix="state_", suffix=".tmp")
        with os.fdopen(temp_fd, "w", encoding="utf-8") as f:
            json.dump(serializable, f, indent=2, ensure_ascii=False)
            f.flush()
            os.fsync(f.fileno())

        os.replace(temp_path, str(path))
        logger.info(f"State saved: {path} (v{serializable['_version']})")
        return path

    finally:
        try:
            lock_path.unlink()
        except OSError:
            pass


def load_state(order_id: str) -> Optional[dict]:
    """Load pipeline state from JSON file.

    Returns None if state file doesn't exist.
    """
    path = get_order_dir(order_id) / "state.json"
    if not path.exists():
        return None

    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def append_log(order_id: str, step: str, data: dict) -> None:
    """Append a timestamped log entry to the order's run log (JSONL format)."""
    log_path = ensure_order_dir(order_id) / "log.jsonl"

    entry = {
        "timestamp": datetime.now().isoformat(),
        "step": step,
        "data": _make_serializable(data),
    }

    with open(log_path, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")


def get_run_log(order_id: str) -> List[dict]:
    """Read full run log for an order."""
    log_path = get_order_dir(order_id) / "log.jsonl"
    if not log_path.exists():
        return []

    entries = []
    with open(log_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                entries.append(json.loads(line))
    return entries


def list_orders() -> List[dict]:
    """List all orders with basic status info."""
    orders_dir = _get_orders_dir()
    if not orders_dir.exists():
        return []

    orders = []
    for d in sorted(orders_dir.iterdir()):
        if d.is_dir() and not d.name.startswith("."):
            try:
                state = load_state(d.name)
            except ValueError:
                logger.warning("Skipping invalid order directory: %s", d.name)
                continue
            status = "unknown"
            if state:
                if state.get("error"):
                    status = "failed"
                elif state.get("export_paths"):
                    status = "completed"
                elif state.get("qa_passed") is False:
                    status = "qa_failed"
                elif state.get("composite_path"):
                    status = "composited"
                else:
                    status = "processing"
            orders.append({
                "order_id": d.name,
                "status": status,
                "updated_at": state.get("_updated_at", "") if state else "",
            })

    return orders


def save_order_input(order_id: str, order_json: dict) -> Path:
    """Save the raw order input JSON."""
    path = ensure_order_dir(order_id) / "order.json"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(order_json, f, indent=2, ensure_ascii=False)
    return path


def load_order_input(order_id: str) -> Optional[dict]:
    """Load the raw order input JSON."""
    path = get_order_dir(order_id) / "order.json"
    if not path.exists():
        return None
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _make_serializable(obj):
    """Convert non-serializable objects to JSON-safe types."""
    if isinstance(obj, dict):
        return {k: _make_serializable(v) for k, v in obj.items()}
    elif isinstance(obj, (list, tuple)):
        return [_make_serializable(v) for v in obj]
    elif isinstance(obj, Path):
        return str(obj)
    elif isinstance(obj, datetime):
        return obj.isoformat()
    elif hasattr(obj, "__dict__"):
        return _make_serializable(obj.__dict__)
    else:
        try:
            json.dumps(obj)
            return obj
        except (TypeError, ValueError):
            return str(obj)
