"""
SLN Design Engine v3 — Bounding Box & Layout Math
Deterministic layout calculations. Zero randomness — same input always produces same output.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import List, Optional, Tuple


# ── Data Classes ─────────────────────────────────────────────────


@dataclass
class Point:
    """2D point in pixel coordinates."""
    x: int
    y: int

    def offset(self, dx: int, dy: int) -> "Point":
        return Point(self.x + dx, self.y + dy)

    def as_tuple(self) -> Tuple[int, int]:
        return (self.x, self.y)


@dataclass
class Size:
    """2D size in pixels."""
    width: int
    height: int

    @property
    def area(self) -> int:
        return self.width * self.height

    @property
    def aspect_ratio(self) -> float:
        return self.width / max(self.height, 1)

    def as_tuple(self) -> Tuple[int, int]:
        return (self.width, self.height)

    def scale(self, factor: float) -> "Size":
        return Size(int(self.width * factor), int(self.height * factor))


@dataclass
class Rect:
    """Axis-aligned bounding box in pixel coordinates."""
    x: int
    y: int
    width: int
    height: int

    @property
    def right(self) -> int:
        return self.x + self.width

    @property
    def bottom(self) -> int:
        return self.y + self.height

    @property
    def center(self) -> Point:
        return Point(self.x + self.width // 2, self.y + self.height // 2)

    @property
    def top_left(self) -> Point:
        return Point(self.x, self.y)

    @property
    def size(self) -> Size:
        return Size(self.width, self.height)

    @property
    def area(self) -> int:
        return self.width * self.height

    def as_tuple(self) -> Tuple[int, int, int, int]:
        """Returns (x, y, width, height)."""
        return (self.x, self.y, self.width, self.height)

    def as_box(self) -> Tuple[int, int, int, int]:
        """Returns (left, top, right, bottom) for PIL crop/paste."""
        return (self.x, self.y, self.right, self.bottom)

    def contains(self, other: "Rect") -> bool:
        """Check if this rect fully contains another rect."""
        return (
            self.x <= other.x
            and self.y <= other.y
            and self.right >= other.right
            and self.bottom >= other.bottom
        )

    def intersects(self, other: "Rect") -> bool:
        """Check if two rects overlap."""
        return not (
            self.right <= other.x
            or other.right <= self.x
            or self.bottom <= other.y
            or other.bottom <= self.y
        )

    def inset(self, top: int = 0, right: int = 0, bottom: int = 0, left: int = 0) -> "Rect":
        """Create a new rect inset from this rect's edges."""
        return Rect(
            x=self.x + left,
            y=self.y + top,
            width=max(0, self.width - left - right),
            height=max(0, self.height - top - bottom),
        )

    def shrink(self, factor: float) -> "Rect":
        """Shrink rect by factor (0-1) while keeping center."""
        new_w = int(self.width * factor)
        new_h = int(self.height * factor)
        cx, cy = self.center.x, self.center.y
        return Rect(
            x=cx - new_w // 2,
            y=cy - new_h // 2,
            width=new_w,
            height=new_h,
        )

    def snap_to_grid(self, grid_size: int = 4) -> "Rect":
        """Snap position and size to nearest grid boundary."""
        return Rect(
            x=round(self.x / grid_size) * grid_size,
            y=round(self.y / grid_size) * grid_size,
            width=round(self.width / grid_size) * grid_size,
            height=round(self.height / grid_size) * grid_size,
        )


@dataclass
class LayoutElement:
    """An element positioned on the canvas."""
    name: str
    rect: Rect
    element_type: str  # "text", "image", "logo", "decoration"
    weight: float = 1.0  # Hierarchy weight (1.0 = normal)
    font_size: int = 0
    font_path: str = ""
    text: str = ""
    color: str = "#000000"
    image_path: str = ""
    z_index: int = 0
    metadata: dict = field(default_factory=dict)


@dataclass
class LayoutPlan:
    """Complete layout specification with absolute pixel coordinates."""
    canvas_width: int
    canvas_height: int
    dpi: int
    safe_zone: Rect
    elements: List[LayoutElement] = field(default_factory=list)
    background_color: str = "#FFFFFF"
    background_image: str = ""
    metadata: dict = field(default_factory=dict)


# ── Core Functions ───────────────────────────────────────────────


def calculate_safe_zone(
    width: int,
    height: int,
    margins_pct: dict | None = None,
) -> Rect:
    """
    Calculate the safe zone (inner rect) after applying percentage-based margins.

    Args:
        width: Canvas width in pixels
        height: Canvas height in pixels
        margins_pct: Dict with 'top', 'bottom', 'left', 'right' as percentages (0-100).
                     Defaults to 5% on all sides.

    Returns:
        Rect representing the safe zone
    """
    if margins_pct is None:
        margins_pct = {"top": 5, "bottom": 5, "left": 5, "right": 5}

    top = int(height * margins_pct.get("top", 5) / 100)
    bottom = int(height * margins_pct.get("bottom", 5) / 100)
    left = int(width * margins_pct.get("left", 5) / 100)
    right = int(width * margins_pct.get("right", 5) / 100)

    return Rect(
        x=left,
        y=top,
        width=max(0, width - left - right),
        height=max(0, height - top - bottom),
    )


def auto_scale_font(
    text: str,
    bbox: Rect,
    font_path: str,
    max_size: int = 200,
    min_size: int = 12,
    line_spacing: float = 1.2,
) -> int:
    """
    Find the largest font size that fits text within a bounding box.
    Uses binary search for efficiency.

    Args:
        text: Text to measure
        bbox: Bounding box to fit within
        font_path: Path to TTF/OTF font file
        max_size: Maximum font size to try
        min_size: Minimum acceptable font size
        line_spacing: Line height multiplier

    Returns:
        Optimal font size in points
    """
    from PIL import ImageFont

    if not text.strip():
        return min_size

    low, high = min_size, max_size
    best = min_size

    while low <= high:
        mid = (low + high) // 2
        try:
            font = ImageFont.truetype(font_path, mid)
        except (OSError, IOError):
            # Font file not found — return minimum
            return min_size

        # Measure text bounding box
        lines = text.split("\n")
        max_line_w = 0
        total_h = 0

        for line in lines:
            try:
                left_b, top_b, right_b, bottom_b = font.getbbox(line)
                line_w = right_b - left_b
                line_h = bottom_b - top_b
            except Exception:
                line_w = mid * len(line) * 0.6  # rough estimate
                line_h = mid

            max_line_w = max(max_line_w, line_w)
            total_h += int(line_h * line_spacing)

        if max_line_w <= bbox.width and total_h <= bbox.height:
            best = mid
            low = mid + 1
        else:
            high = mid - 1

    return best


def grid_layout(
    count: int,
    container: Rect,
    columns: int = 2,
    gap: int = 10,
) -> List[Rect]:
    """
    Divide a container into a uniform grid of cells.

    Args:
        count: Number of items to place
        container: Container rect
        columns: Number of columns
        gap: Gap between cells in pixels

    Returns:
        List of Rects for each cell
    """
    if count == 0 or columns == 0:
        return []

    rows = math.ceil(count / columns)

    cell_w = (container.width - gap * (columns - 1)) // columns
    cell_h = (container.height - gap * (rows - 1)) // rows

    cells = []
    for i in range(count):
        row = i // columns
        col = i % columns
        cells.append(Rect(
            x=container.x + col * (cell_w + gap),
            y=container.y + row * (cell_h + gap),
            width=cell_w,
            height=cell_h,
        ))

    return cells


def hierarchy_layout(
    container: Rect,
    weights: List[float],
    direction: str = "vertical",
    gap: int = 0,
) -> List[Rect]:
    """
    Divide a container into weighted regions (top-down or left-right).

    Args:
        container: Container rect to divide
        weights: List of weights (e.g., [0.25, 0.50, 0.25] for header/body/footer)
        direction: 'vertical' (top-down) or 'horizontal' (left-right)
        gap: Gap between regions in pixels

    Returns:
        List of Rects, one per weight
    """
    if not weights:
        return []

    total_weight = sum(weights)
    if total_weight == 0:
        total_weight = 1.0

    total_gap = gap * (len(weights) - 1)
    regions = []

    if direction == "vertical":
        available = container.height - total_gap
        current_y = container.y

        for w in weights:
            h = int(available * w / total_weight)
            regions.append(Rect(
                x=container.x,
                y=current_y,
                width=container.width,
                height=h,
            ))
            current_y += h + gap
    else:
        available = container.width - total_gap
        current_x = container.x

        for w in weights:
            w_px = int(available * w / total_weight)
            regions.append(Rect(
                x=current_x,
                y=container.y,
                width=w_px,
                height=container.height,
            ))
            current_x += w_px + gap

    return regions


def center_in_rect(inner_size: Size, outer: Rect) -> Point:
    """
    Calculate the position to center an object within a rect.

    Returns:
        Top-left Point for centered placement
    """
    return Point(
        x=outer.x + (outer.width - inner_size.width) // 2,
        y=outer.y + (outer.height - inner_size.height) // 2,
    )


def aspect_fit(src_size: Size, target: Rect) -> Rect:
    """
    Fit a source size into a target rect while maintaining aspect ratio.
    The result will be centered within the target.

    Args:
        src_size: Original size (width, height)
        target: Target rect to fit within

    Returns:
        Rect with fitted dimensions, centered in target
    """
    if src_size.width == 0 or src_size.height == 0:
        return Rect(target.x, target.y, 0, 0)

    src_aspect = src_size.width / src_size.height
    target_aspect = target.width / max(target.height, 1)

    if src_aspect > target_aspect:
        # Source is wider — fit to width
        new_w = target.width
        new_h = int(target.width / src_aspect)
    else:
        # Source is taller — fit to height
        new_h = target.height
        new_w = int(target.height * src_aspect)

    pos = center_in_rect(Size(new_w, new_h), target)
    return Rect(pos.x, pos.y, new_w, new_h)


def aspect_fill(src_size: Size, target: Rect) -> Rect:
    """
    Fill a target rect with source while maintaining aspect ratio (may crop).
    The result will be centered and may extend beyond the target.
    """
    if src_size.width == 0 or src_size.height == 0:
        return Rect(target.x, target.y, 0, 0)

    src_aspect = src_size.width / src_size.height
    target_aspect = target.width / max(target.height, 1)

    if src_aspect < target_aspect:
        new_w = target.width
        new_h = int(target.width / src_aspect)
    else:
        new_h = target.height
        new_w = int(target.height * src_aspect)

    pos = center_in_rect(Size(new_w, new_h), target)
    return Rect(pos.x, pos.y, new_w, new_h)


def inches_to_pixels(width_inches: float, height_inches: float, dpi: int = 300) -> Size:
    """Convert inch dimensions to pixels at given DPI."""
    return Size(int(width_inches * dpi), int(height_inches * dpi))


def pixels_to_inches(width_px: int, height_px: int, dpi: int = 300) -> Tuple[float, float]:
    """Convert pixel dimensions to inches at given DPI."""
    return (width_px / dpi, height_px / dpi)
