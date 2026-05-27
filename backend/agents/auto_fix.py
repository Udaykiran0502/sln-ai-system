"""
SLN Design Engine v3 — Auto-Fix Agent
Rule-based fixes mapped to QA failure codes. Max 2 iterations.
"""

from __future__ import annotations

import logging

logger = logging.getLogger(__name__)


def auto_fix(state: dict) -> dict:
    """Apply automatic fixes based on QA failure codes.

    State keys read:
        - qa_scores: dict (with 'failures' list)
        - layout_plan: dict
        - fix_attempts: int

    State keys written:
        - layout_plan: dict (modified)
        - fix_attempts: int (incremented)
        - needs_human_review: bool
    """
    qa_scores = state.get("qa_scores", {})
    layout = state.get("layout_plan", {})
    fix_attempts = state.get("fix_attempts", 0)

    from config.settings import settings

    logger.info(f"[AutoFix] Attempt {fix_attempts + 1}/{settings.max_fix_attempts}")

    if fix_attempts >= settings.max_fix_attempts:
        logger.warning("[AutoFix] Max fix attempts reached — flagging for human review")
        return {
            "fix_attempts": fix_attempts,
            "needs_human_review": True,
        }

    failures = qa_scores.get("failures", [])
    if not failures:
        return {"fix_attempts": fix_attempts + 1}

    # Apply fixes
    modified = False

    for failure in failures:
        if failure == "contrast":
            layout = _fix_contrast(layout)
            modified = True
        elif failure == "clipping":
            layout = _fix_clipping(layout)
            modified = True
        elif failure == "readability":
            layout = _fix_readability(layout)
            modified = True
        elif failure == "alignment":
            layout = _fix_alignment(layout)
            modified = True
        elif failure == "safe_zone":
            layout = _fix_safe_zone(layout)
            modified = True
        elif failure == "image_quality":
            # Can't fix image quality programmatically — flag for review
            logger.info("[AutoFix] Image quality issue — cannot auto-fix")

    if modified:
        logger.info(f"[AutoFix] Applied fixes for: {failures}")

    return {
        "layout_plan": layout,
        "fix_attempts": fix_attempts + 1,
        "needs_human_review": False,
    }


def _fix_contrast(layout: dict) -> dict:
    """Fix low contrast by adjusting text colors."""
    from backend.utils.color_utils import best_text_color, contrast_ratio

    bg_color = layout.get("background_color", "#FFFFFF")
    colors = layout.get("metadata", {}).get("colors", {})
    bg = colors.get("background", bg_color)

    optimal_text = best_text_color(bg)

    for elem in layout.get("elements", []):
        if elem.get("element_type") == "text" and elem.get("text"):
            current = elem.get("color", "#000000")
            try:
                ratio = contrast_ratio(current, bg)
                if ratio < 4.5:
                    elem["color"] = optimal_text
                    logger.debug(f"[AutoFix] Changed text color for '{elem.get('name')}' to {optimal_text}")
            except (ValueError, TypeError):
                elem["color"] = optimal_text

    return layout


def _fix_clipping(layout: dict) -> dict:
    """Fix clipping by shrinking elements that extend beyond canvas."""
    canvas_w = layout.get("canvas_width", 4800)
    canvas_h = layout.get("canvas_height", 2400)

    for elem in layout.get("elements", []):
        rect = elem.get("rect", (0, 0, 0, 0))
        x, y, w, h = rect[0], rect[1], rect[2], rect[3]

        # Clamp to canvas
        if x < 0:
            w += x
            x = 0
        if y < 0:
            h += y
            y = 0
        if x + w > canvas_w:
            w = canvas_w - x
        if y + h > canvas_h:
            h = canvas_h - y

        # Shrink by 10% to add margin
        shrink = 0.9
        cx, cy = x + w // 2, y + h // 2
        new_w, new_h = int(w * shrink), int(h * shrink)
        elem["rect"] = (cx - new_w // 2, cy - new_h // 2, new_w, new_h)

    return layout


def _fix_readability(layout: dict) -> dict:
    """Fix readability by increasing small font sizes."""
    dpi = layout.get("dpi", 300)
    min_size = 14 if dpi >= 300 else 18

    for elem in layout.get("elements", []):
        if elem.get("element_type") == "text":
            if elem.get("font_size", 48) < min_size:
                elem["font_size"] = min_size
                logger.debug(f"[AutoFix] Increased font size for '{elem.get('name')}' to {min_size}")

    return layout


def _fix_alignment(layout: dict) -> dict:
    """Fix alignment by snapping to 4px grid."""
    grid = 4
    for elem in layout.get("elements", []):
        rect = elem.get("rect", (0, 0, 0, 0))
        elem["rect"] = (
            round(rect[0] / grid) * grid,
            round(rect[1] / grid) * grid,
            round(rect[2] / grid) * grid,
            round(rect[3] / grid) * grid,
        )
    return layout


def _fix_safe_zone(layout: dict) -> dict:
    """Fix elements outside safe zone by clamping to safe zone."""
    safe = layout.get("safe_zone", (0, 0, 4800, 2400))
    sx, sy, sw, sh = safe[0], safe[1], safe[2], safe[3]

    for elem in layout.get("elements", []):
        rect = elem.get("rect", (0, 0, 0, 0))
        x, y, w, h = rect[0], rect[1], rect[2], rect[3]

        x = max(sx, min(x, sx + sw - w))
        y = max(sy, min(y, sy + sh - h))
        w = min(w, sw)
        h = min(h, sh)

        elem["rect"] = (x, y, w, h)

    return layout
