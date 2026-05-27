"""
SLN Design Engine v3 — Style Analyzer Agent
Converts research output into structured StyleMetadata using Gemini.
"""

from __future__ import annotations

import json
import logging
import re

logger = logging.getLogger(__name__)


def style_analyzer(state: dict) -> dict:
    """Convert research data into structured style metadata.

    State keys read:
        - research_data: dict
        - parsed_order: dict

    State keys written:
        - style_metadata: dict
    """
    research_data = state.get("research_data", {})
    parsed = state.get("parsed_order", {})

    logger.info("[StyleAnalyzer] Generating style metadata")

    # Try LLM synthesis
    metadata = _llm_synthesize(research_data, parsed)
    if metadata:
        return {"style_metadata": metadata}

    # Fallback: derive from research data directly
    metadata = _derive_metadata(research_data, parsed)
    return {"style_metadata": metadata}


def _llm_synthesize(research_data: dict, parsed: dict) -> dict | None:
    try:
        from config.settings import settings
        if not settings.google_api_key:
            return None

        import google.generativeai as genai
        genai.configure(api_key=settings.google_api_key)
        model = genai.GenerativeModel(settings.gemini_model)

        prompt = f"""Based on this design research, create a precise style specification.

Research data: {json.dumps(research_data)}
Order info: banner_type={parsed.get('banner_type')}, event={parsed.get('event_type')}, language={parsed.get('language')}

Return JSON:
{{
    "mood": "festive|formal|energetic|devotional|celebratory",
    "density": "minimal|moderate|dense",
    "color_temperature": "warm|cool|neutral",
    "text_hierarchy": {{
        "heading_weight": 0.35,
        "subheading_weight": 0.25,
        "body_weight": 0.20,
        "footer_weight": 0.20
    }},
    "image_weight": 0.3 to 0.6,
    "preferred_layout": "hero_left_text_right|centered_stack|grid|split",
    "decoration_level": "minimal|moderate|ornate",
    "background_style": "solid|gradient|textured|image"
}}"""

        response = model.generate_content(prompt)
        json_match = re.search(r"\{[\s\S]*\}", response.text)
        if json_match:
            return json.loads(json_match.group())
    except Exception as e:
        logger.warning(f"[StyleAnalyzer] LLM synthesis failed: {e}")
    return None


def _derive_metadata(research_data: dict, parsed: dict) -> dict:
    """Derive style metadata from research data without LLM."""
    mood = research_data.get("mood", "formal")
    density = research_data.get("density", "moderate")
    banner_type = parsed.get("banner_type", "general")

    # Color temperature from color patterns
    colors = research_data.get("color_patterns", [])
    color_temp = _detect_temperature(colors)

    # Layout preference
    layout = research_data.get("layout_type", "centered_stack")

    # Text hierarchy weights based on banner type
    hierarchy_map = {
        "political": {"heading_weight": 0.35, "subheading_weight": 0.25, "body_weight": 0.20, "footer_weight": 0.20},
        "wedding": {"heading_weight": 0.30, "subheading_weight": 0.30, "body_weight": 0.20, "footer_weight": 0.20},
        "business": {"heading_weight": 0.30, "subheading_weight": 0.25, "body_weight": 0.25, "footer_weight": 0.20},
        "religious": {"heading_weight": 0.35, "subheading_weight": 0.25, "body_weight": 0.20, "footer_weight": 0.20},
    }

    text_hierarchy = hierarchy_map.get(banner_type, {
        "heading_weight": 0.30, "subheading_weight": 0.25, "body_weight": 0.25, "footer_weight": 0.20
    })

    # Image weight
    image_weight_map = {
        "political": 0.4,
        "wedding": 0.35,
        "business": 0.3,
        "religious": 0.35,
    }

    return {
        "mood": mood,
        "density": density,
        "color_temperature": color_temp,
        "text_hierarchy": text_hierarchy,
        "image_weight": image_weight_map.get(banner_type, 0.35),
        "preferred_layout": layout,
        "decoration_level": "ornate" if banner_type in ("wedding", "religious") else "moderate",
        "background_style": "gradient",
    }


def _detect_temperature(colors: list) -> str:
    """Detect whether a color palette is warm, cool, or neutral."""
    if not colors:
        return "neutral"

    from backend.utils.color_utils import hex_to_rgb, rgb_to_hsl

    warm_count = 0
    cool_count = 0

    for color in colors:
        try:
            if not color.startswith("#"):
                continue
            r, g, b = hex_to_rgb(color)
            h, s, l = rgb_to_hsl(r, g, b)
            if h < 60 or h > 300:
                warm_count += 1
            elif 120 < h < 280:
                cool_count += 1
        except (ValueError, TypeError):
            continue

    if warm_count > cool_count:
        return "warm"
    elif cool_count > warm_count:
        return "cool"
    return "neutral"
