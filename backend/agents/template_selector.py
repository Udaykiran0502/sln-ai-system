"""
SLN Design Engine v3 - Template Selector Agent
Scores and selects the best matching template. Pure Python, no LLM.
"""

from __future__ import annotations

import json
import logging

logger = logging.getLogger(__name__)


def template_selector(state: dict) -> dict:
    """Select the best matching template from the index.

    Category match is a hard gate unless the user explicitly selects a
    template override. This prevents a visually similar but commercially wrong
    template, such as a political flex, from winning for a general order.
    """
    parsed = state.get("parsed_order", {})
    style = state.get("style_metadata", {})
    workflow_type = state.get("workflow_type", "ai")
    explicit_template_id = parsed.get("template_id") or parsed.get("template_override")

    logger.info("[TemplateSelector] Scoring templates")

    templates = _load_templates()
    if not templates:
        logger.warning("[TemplateSelector] No templates found")
        return {"selected_template": {}}

    if explicit_template_id:
        for tmpl in templates:
            if tmpl.get("template_id") == explicit_template_id:
                logger.info("[TemplateSelector] Using explicit template override: %s", explicit_template_id)
                return {"selected_template": tmpl}
        logger.warning("[TemplateSelector] Requested template override not found: %s", explicit_template_id)

    banner_type = parsed.get("banner_type", "general")
    category_templates = [t for t in templates if t.get("category") == banner_type]
    if category_templates:
        templates = category_templates
    else:
        if banner_type == "general":
            logger.info("[TemplateSelector] No general template available; using generated layout")
            return {"selected_template": {}}
        logger.warning("[TemplateSelector] No templates found for category: %s", banner_type)
        return {"selected_template": {}}

    scored = [(_score_template(tmpl, parsed, style), tmpl) for tmpl in templates]
    scored.sort(key=lambda x: x[0], reverse=True)
    best_score, best_tmpl = scored[0]

    logger.info("[TemplateSelector] Best match: %s (score: %.3f)", best_tmpl.get("template_id"), best_score)

    min_score = 0.45 if workflow_type in ("template", "hybrid") else 0.35
    if best_score < min_score:
        logger.info("[TemplateSelector] Score %.3f below threshold %.2f; no template selected", best_score, min_score)
        return {"selected_template": {}}

    return {"selected_template": best_tmpl}


def _load_templates() -> list:
    try:
        from config.settings import settings
        path = settings.template_dir / "template_index.json"
        if not path.exists():
            return []
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.error("[TemplateSelector] Failed to load templates: %s", e)
        return []


def _score_template(tmpl: dict, parsed: dict, style: dict) -> float:
    """Score a template against the order. Returns 0.0 - 1.0."""
    score = 0.0
    banner_type = parsed.get("banner_type", "general")
    event_type = parsed.get("event_type", "")

    if tmpl.get("category") == banner_type:
        score += 0.4

    order_colors = parsed.get("colors", {})
    tmpl_colors = tmpl.get("colors", {})
    score += 0.3 * _color_similarity(order_colors, tmpl_colors)

    tmpl_tags = set(tmpl.get("tags", []))
    style_keywords = {
        style.get("mood", ""),
        style.get("density", ""),
        banner_type,
        event_type,
    }
    style_keywords.discard("")

    if tmpl_tags and style_keywords:
        overlap = len(tmpl_tags & style_keywords) / max(len(tmpl_tags | style_keywords), 1)
        score += 0.2 * overlap

    score += 0.1 * tmpl.get("success_score", 0.5)
    return min(1.0, score)


def _color_similarity(order_colors: dict, tmpl_colors: dict) -> float:
    """Calculate color similarity between order and template colors."""
    if not order_colors or not tmpl_colors:
        return 0.5

    from backend.utils.color_utils import color_distance

    total_dist = 0.0
    comparisons = 0

    for key in ["primary", "accent", "secondary"]:
        c1 = order_colors.get(key)
        c2 = tmpl_colors.get(key)
        if c1 and c2:
            try:
                total_dist += color_distance(c1, c2)
                comparisons += 1
            except (ValueError, TypeError):
                continue

    if comparisons == 0:
        return 0.5

    avg_dist = total_dist / comparisons
    return max(0, 1 - avg_dist / 441.67)
