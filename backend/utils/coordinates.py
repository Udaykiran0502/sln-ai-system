"""
SLN Design Engine v3 — Canonical Coordinate Bridge
Provides functions to convert between normalized canonical units [0.0, 1.0] and pixel space.
"""

from __future__ import annotations
from dataclasses import dataclass
from typing import Tuple, Dict, Any

@dataclass
class CanonicalRect:
    x: float
    y: float
    width: float
    height: float

    def to_dict(self) -> Dict[str, float]:
        return {
            "x": self.x,
            "y": self.y,
            "width": self.width,
            "height": self.height
        }

    @classmethod
    def from_dict(cls, d: Dict[str, float]) -> CanonicalRect:
        return cls(
            x=float(d.get("x", 0.0)),
            y=float(d.get("y", 0.0)),
            width=float(d.get("width", 0.0)),
            height=float(d.get("height", 0.0))
        )

def to_canonical(px_val: float, total_px: float) -> float:
    """Convert absolute pixels to normalized float."""
    if total_px <= 0:
        return 0.0
    return round(px_val / total_px, 6)

def to_physical(canon_val: float, total_px: float) -> int:
    """Convert normalized float to absolute pixels."""
    return int(round(canon_val * total_px))

def get_canvas_size_px(width_inches: float, height_inches: float, dpi: int) -> Tuple[int, int]:
    """Calculate canvas size in physical pixels."""
    return int(width_inches * dpi), int(height_inches * dpi)

def rect_to_canonical(x: float, y: float, w: float, h: float, canvas_w_px: float, canvas_h_px: float) -> CanonicalRect:
    """Convert pixel bounds to canonical rect."""
    return CanonicalRect(
        x=to_canonical(x, canvas_w_px),
        y=to_canonical(y, canvas_h_px),
        width=to_canonical(w, canvas_w_px),
        height=to_canonical(h, canvas_h_px)
    )

def canonical_to_rect(canon: CanonicalRect, canvas_w_px: float, canvas_h_px: float) -> Tuple[int, int, int, int]:
    """Convert canonical rect to physical pixel coordinates: (x, y, width, height)."""
    return (
        to_physical(canon.x, canvas_w_px),
        to_physical(canon.y, canvas_h_px),
        to_physical(canon.width, canvas_w_px),
        to_physical(canon.height, canvas_h_px)
    )

def snap_canonical(val: float, snap_interval: float = 0.005) -> float:
    """Snap normalized coordinate to standard grid interval."""
    if snap_interval <= 0:
        return val
    return round(round(val / snap_interval) * snap_interval, 6)
