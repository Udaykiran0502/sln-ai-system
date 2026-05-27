"""
SLN Design Engine v3 - Copywriter Agent
Generates Telugu + English copy using Gemini. Validates Telugu Unicode output.
"""

from __future__ import annotations

import json
import logging
import re

logger = logging.getLogger(__name__)


def copywriter(state: dict) -> dict:
    """Generate or enhance banner copy text."""
    parsed = state.get("parsed_order", {})
    style = state.get("style_metadata", {})

    logger.info("[Copywriter] Generating copy")

    existing_text = parsed.get("text_content", {})
    if existing_text.get("heading"):
        return {"copy": _enhance_existing(existing_text, parsed)}

    copy = _llm_generate(parsed, style)
    if copy:
        return {"copy": copy}

    return {"copy": _fallback_copy(parsed)}


def _enhance_existing(text_content: dict, parsed: dict) -> dict:
    phone = text_content.get("phone", "")
    if not phone:
        phones = parsed.get("phone_numbers", [])
        phone = phones[0] if phones else ""

    return {
        "heading_te": text_content.get("heading", ""),
        "heading_en": text_content.get("heading_en", ""),
        "subheading": text_content.get("subheading", ""),
        "tagline": text_content.get("tagline", ""),
        "footer_text": text_content.get("footer_text") or text_content.get("tagline", ""),
        "phone_display": _format_phone(phone),
        "extra_lines": text_content.get("extra_lines", []),
    }


def _llm_generate(parsed: dict, style: dict) -> dict | None:
    try:
        from config.settings import settings
        if not settings.google_api_key:
            return None

        import google.generativeai as genai
        genai.configure(api_key=settings.google_api_key)
        model = genai.GenerativeModel(settings.gemini_model)

        language = parsed.get("language", "telugu")
        banner_type = parsed.get("banner_type", "general")
        event_type = parsed.get("event_type", "")
        client_name = parsed.get("client_name", "")
        mood = style.get("mood", "formal")

        prompt = f"""Create banner/poster copy for:
- Type: {banner_type}
- Event: {event_type}
- Client: {client_name}
- Language: {language}
- Mood: {mood}

Return JSON with short, impactful text:
{{
    "heading_te": "Telugu heading (max 5 words)",
    "heading_en": "English heading (max 5 words)",
    "subheading": "Subheading in {language} (max 10 words)",
    "tagline": "Short tagline (max 6 words)",
    "footer_text": "Footer info",
    "extra_lines": []
}}

Important: Telugu text must use proper Unicode, for example జై శ్రీరాం. Do not return transliteration."""

        response = model.generate_content(prompt)
        json_match = re.search(r"\{[\s\S]*\}", response.text)
        if json_match:
            data = json.loads(json_match.group())
            phones = parsed.get("phone_numbers", [])
            data["phone_display"] = _format_phone(phones[0] if phones else "")

            for key in ["heading_te", "subheading", "tagline"]:
                if key in data and data[key]:
                    from backend.utils.telugu_shaper import validate_telugu
                    result = validate_telugu(data[key])
                    if not result["valid"]:
                        logger.warning("[Copywriter] Telugu validation issues in %s: %s", key, result["issues"])
            return data
    except Exception as e:
        logger.warning("[Copywriter] LLM generation failed: %s", e)
    return None


def _fallback_copy(parsed: dict) -> dict:
    banner_type = parsed.get("banner_type", "general")
    client = parsed.get("client_name", "")
    phones = parsed.get("phone_numbers", [])

    templates = {
        "political": {
            "heading_te": "విజయం మనది",
            "heading_en": "Victory is Ours",
            "subheading": client or "మీ నాయకుడు",
            "tagline": "మీ సేవలో మేము",
        },
        "wedding": {
            "heading_te": "శుభ వివాహం",
            "heading_en": "Wedding Invitation",
            "subheading": client or "శుభాకాంక్షలు",
            "tagline": "ఆశీర్వదించగలరు",
        },
        "business": {
            "heading_te": "గ్రాండ్ ఓపెనింగ్",
            "heading_en": "Grand Opening",
            "subheading": client or "మీ విశ్వసనీయ సేవ",
            "tagline": "నాణ్యత మా నినాదం",
        },
        "religious": {
            "heading_te": "శుభ ఆహ్వానం",
            "heading_en": "Divine Invitation",
            "subheading": client or "భక్తి ప్రధానం",
            "tagline": "సర్వం శ్రీ",
        },
    }

    base = templates.get(banner_type, {
        "heading_te": "శుభాకాంక్షలు",
        "heading_en": "Greetings",
        "subheading": client or "",
        "tagline": "",
    }).copy()

    base["footer_text"] = client
    base["phone_display"] = _format_phone(phones[0] if phones else "")
    base["extra_lines"] = []
    return base


def _format_phone(phone: str) -> str:
    if not phone:
        return ""
    digits = re.sub(r"\D", "", phone)
    if len(digits) == 10:
        return f"+91 {digits[:5]} {digits[5:]}"
    return phone
