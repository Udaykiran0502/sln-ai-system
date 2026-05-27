"""
SLN Design Engine v3 — Decision Engine Agent
Pure rule-based routing — NO LLM calls. Determines workflow type.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path

logger = logging.getLogger(__name__)


def decision_engine(state: dict) -> dict:
    """Route to template, AI, or hybrid workflow based on rules.

    State keys read:
        - parsed_order: dict
        - style_metadata: dict

    State keys written:
        - workflow_type: str ("template" | "ai" | "hybrid")
    """
    parsed = state.get("parsed_order", {})
    style = state.get("style_metadata", {})

    logger.info("[DecisionEngine] Evaluating workflow route")

    reference_url = parsed.get("reference_url")
    banner_type = parsed.get("banner_type", "general")

    # Rule 1: If reference provided → hybrid (use reference + template)
    if reference_url:
        logger.info("[DecisionEngine] Reference URL found → hybrid workflow")
        return {"workflow_type": "hybrid"}

    # Rule 2: Check if matching template exists with good score
    best_score = _check_template_match(banner_type, parsed, style)
    if best_score >= 0.7:
        logger.info(f"[DecisionEngine] Template match score {best_score:.2f} → template workflow")
        return {"workflow_type": "template"}

    # Rule 3: Check if we have enough info for template (lower threshold)
    if best_score >= 0.4 and banner_type != "general":
        logger.info(f"[DecisionEngine] Partial template match {best_score:.2f} → hybrid workflow")
        return {"workflow_type": "hybrid"}

    # Rule 4: Default → AI workflow
    logger.info("[DecisionEngine] No strong template match → ai workflow")
    return {"workflow_type": "ai"}


def _check_template_match(banner_type: str, parsed: dict, style: dict) -> float:
    """Check template index for matching templates. Returns best match score."""
    try:
        from config.settings import settings
        index_path = settings.template_dir / "template_index.json"

        if not index_path.exists():
            return 0.0

        with open(index_path, "r", encoding="utf-8") as f:
            templates = json.load(f)

        best_score = 0.0
        for tmpl in templates:
            score = 0.0

            # Category match (40%)
            if tmpl.get("category") == banner_type:
                score += 0.4

            # Subcategory match (20%)
            event = parsed.get("event_type", "")
            if event and tmpl.get("subcategory") == event:
                score += 0.2
            elif tmpl.get("subcategory"):
                score += 0.05  # Partial credit

            # Color similarity (20%)
            order_colors = parsed.get("colors", {})
            tmpl_colors = tmpl.get("colors", {})
            if order_colors.get("primary") == tmpl_colors.get("primary"):
                score += 0.2
            elif order_colors.get("primary") and tmpl_colors.get("primary"):
                from backend.utils.color_utils import color_distance
                dist = color_distance(
                    order_colors["primary"],
                    tmpl_colors["primary"]
                )
                score += 0.2 * max(0, 1 - dist / 441.67)

            # Success score (10%)
            score += 0.1 * tmpl.get("success_score", 0.5)

            # Style match (10%)
            tmpl_style = tmpl.get("style", "")
            heading_style = style.get("mood", "")
            if tmpl_style and heading_style and heading_style in tmpl_style:
                score += 0.1

            best_score = max(best_score, score)

        return best_score

    except Exception as e:
        logger.warning(f"[DecisionEngine] Template check failed: {e}")
        return 0.0
