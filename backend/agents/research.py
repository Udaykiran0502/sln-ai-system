"""
SLN Design Engine v3 — Research Agent
Analyzes reference images/descriptions for style cues using Gemini.
Caches results to avoid repeat API calls.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)


def research(state: dict) -> dict:
    """Analyze references for composition and style insights.

    State keys read:
        - order_id: str
        - parsed_order: dict (reference_url, images, banner_type)

    State keys written:
        - research_data: dict
    """
    order_id = state.get("order_id", "")
    parsed = state.get("parsed_order", {})

    logger.info(f"[Research] Analyzing references for {order_id}")

    # Check cache
    cached = _load_cache(order_id)
    if cached:
        logger.info("[Research] Using cached results")
        return {"research_data": cached}

    reference_url = parsed.get("reference_url")
    banner_type = parsed.get("banner_type", "general")
    event_type = parsed.get("event_type", "")

    # If no reference, generate style hints from banner type
    if not reference_url:
        data = _generate_style_hints(banner_type, event_type)
        _save_cache(order_id, data)
        return {"research_data": data}

    # Try LLM analysis
    data = _llm_analyze(reference_url, banner_type, event_type)
    if data:
        _save_cache(order_id, data)
        return {"research_data": data}

    # Fallback
    data = _generate_style_hints(banner_type, event_type)
    _save_cache(order_id, data)
    return {"research_data": data}


def _llm_analyze(reference_url: str, banner_type: str, event_type: str) -> Optional[dict]:
    """Use Gemini to analyze a reference."""
    try:
        from config.settings import settings
        if not settings.google_api_key:
            return None

        import google.generativeai as genai
        genai.configure(api_key=settings.google_api_key)
        model = genai.GenerativeModel(settings.gemini_model)

        prompt = f"""Analyze this banner/poster design reference for a {banner_type} {event_type} design.
URL: {reference_url}

Return JSON with:
{{
    "composition_style": "centered|left_hero|right_hero|split|full_bleed",
    "color_patterns": ["dominant color", "secondary", "accent"],
    "typography_hints": {{
        "heading_style": "bold|elegant|traditional|modern",
        "hierarchy": "strong|moderate|flat"
    }},
    "layout_type": "hero_left_text_right|centered_stack|grid|diagonal",
    "density": "minimal|moderate|dense",
    "mood": "festive|formal|energetic|devotional|celebratory"
}}"""

        response = model.generate_content(prompt)
        import re
        json_match = re.search(r"\{[\s\S]*\}", response.text)
        if json_match:
            return json.loads(json_match.group())
    except Exception as e:
        logger.warning(f"[Research] LLM analysis failed: {e}")

    return None


def _generate_style_hints(banner_type: str, event_type: str) -> dict:
    """Generate default style hints based on banner type."""
    defaults = {
        "political": {
            "composition_style": "left_hero",
            "color_patterns": ["#FF9933", "#FFFFFF", "#008000"],
            "typography_hints": {"heading_style": "bold", "hierarchy": "strong"},
            "layout_type": "hero_left_text_right",
            "density": "moderate",
            "mood": "energetic",
        },
        "wedding": {
            "composition_style": "centered",
            "color_patterns": ["#8B0000", "#FFD700", "#FFF8DC"],
            "typography_hints": {"heading_style": "elegant", "hierarchy": "strong"},
            "layout_type": "centered_stack",
            "density": "moderate",
            "mood": "celebratory",
        },
        "business": {
            "composition_style": "split",
            "color_patterns": ["#1E3A5F", "#FFFFFF", "#00ACC1"],
            "typography_hints": {"heading_style": "modern", "hierarchy": "moderate"},
            "layout_type": "hero_left_text_right",
            "density": "minimal",
            "mood": "formal",
        },
        "religious": {
            "composition_style": "centered",
            "color_patterns": ["#B22222", "#FFD700", "#FFF5E6"],
            "typography_hints": {"heading_style": "traditional", "hierarchy": "strong"},
            "layout_type": "centered_stack",
            "density": "moderate",
            "mood": "devotional",
        },
    }

    return defaults.get(banner_type, {
        "composition_style": "centered",
        "color_patterns": ["#333333", "#FFFFFF", "#0066CC"],
        "typography_hints": {"heading_style": "modern", "hierarchy": "moderate"},
        "layout_type": "centered_stack",
        "density": "moderate",
        "mood": "formal",
    })


def _cache_path(order_id: str) -> Path:
    from config.settings import settings
    return settings.orders_dir / order_id / "research_cache.json"


def _load_cache(order_id: str) -> Optional[dict]:
    path = _cache_path(order_id)
    if path.exists():
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return None


def _save_cache(order_id: str, data: dict):
    path = _cache_path(order_id)
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
