"""
SLN Design Engine v3 — Font Intelligence Agent
Rule-based font selection. Maps category + language → font family + fallback chain.
No LLM calls.
"""

from __future__ import annotations

import logging
from pathlib import Path

logger = logging.getLogger(__name__)


# ── Font Mapping Tables ──────────────────────────────────────────

TELUGU_FONTS = {
    "heading": {
        "political": "Ramabhadra-Regular.ttf",
        "wedding": "Ramabhadra-Regular.ttf",
        "business": "NTR-Regular.ttf",
        "religious": "Ramabhadra-Regular.ttf",
        "general": "Ramabhadra-Regular.ttf",
    },
    "body": {
        "political": "NTR-Regular.ttf",
        "wedding": "NTR-Regular.ttf",
        "business": "NTR-Regular.ttf",
        "religious": "NTR-Regular.ttf",
        "general": "NTR-Regular.ttf",
    },
    "decorative": "Ramabhadra-Regular.ttf",
    "fallback": ["NTR-Regular.ttf", "Ramabhadra-Regular.ttf"],
}

ENGLISH_FONTS = {
    "heading": {
        "political": "Oswald-Bold.ttf",
        "wedding": "Montserrat-SemiBold.ttf",
        "business": "Oswald-Bold.ttf",
        "religious": "Montserrat-SemiBold.ttf",
        "general": "Oswald-Bold.ttf",
    },
    "body": {
        "political": "Roboto-Regular.ttf",
        "wedding": "Roboto-Regular.ttf",
        "business": "Roboto-Regular.ttf",
        "religious": "Roboto-Regular.ttf",
        "general": "Roboto-Regular.ttf",
    },
    "decorative": "Montserrat-SemiBold.ttf",
    "fallback": ["Roboto-Regular.ttf", "Oswald-Bold.ttf"],
}

# Size recommendations by element role
SIZE_MULTIPLIERS = {
    "heading": 1.0,       # Base: max allowed by bbox
    "subheading": 0.55,
    "tagline": 0.45,
    "body": 0.40,
    "footer": 0.30,
    "phone": 0.35,
}


def font_intelligence(state: dict) -> dict:
    """Select fonts for all text elements.

    State keys read:
        - parsed_order: dict
        - style_metadata: dict
        - copy: dict
        - selected_template: dict

    State keys written:
        - font_config: dict
    """
    parsed = state.get("parsed_order", {})
    style = state.get("style_metadata", {})
    copy_data = state.get("copy", {})
    template = state.get("selected_template", {})

    banner_type = parsed.get("banner_type", "general")
    language = parsed.get("language", "telugu")

    logger.info(f"[FontIntelligence] Selecting fonts for {banner_type}/{language}")

    # If template specifies fonts, prefer those
    if template and template.get("fonts"):
        font_config = _from_template(template, language, banner_type)
    else:
        font_config = _from_rules(banner_type, language)

    # Validate font files exist
    _validate_fonts(font_config)

    # Add size multipliers
    font_config["size_multipliers"] = SIZE_MULTIPLIERS

    return {"font_config": font_config}


def _from_template(template: dict, language: str, banner_type: str) -> dict:
    """Extract font config from template definition."""
    tmpl_fonts = template.get("fonts", {})

    config = {"elements": {}, "language": language}

    for role in ["heading", "body"]:
        tmpl_entry = tmpl_fonts.get(role, {})
        if isinstance(tmpl_entry, str):
            font_file = tmpl_entry + ".ttf" if not tmpl_entry.endswith(".ttf") else tmpl_entry
        elif isinstance(tmpl_entry, dict):
            family = tmpl_entry.get("family", "")
            weight = tmpl_entry.get("weight", "Regular")
            font_file = f"{family}-{weight}.ttf"
        else:
            font_file = _get_default_font(role, language, banner_type)

        config["elements"][role] = {
            "font_file": font_file,
            "font_path": str(_resolve_font_path(font_file)),
            "max_size_pt": tmpl_entry.get("max_size_pt", 120) if isinstance(tmpl_entry, dict) else 120,
        }

    # Fill other roles with defaults
    for role in ["subheading", "tagline", "footer", "phone"]:
        base_role = "heading" if role in ("tagline",) else "body"
        config["elements"][role] = config["elements"].get(base_role, config["elements"]["body"]).copy()

    return config


def _from_rules(banner_type: str, language: str) -> dict:
    """Build font config from rule tables."""
    config = {"elements": {}, "language": language}

    font_table = TELUGU_FONTS if language in ("telugu", "mixed") else ENGLISH_FONTS
    en_table = ENGLISH_FONTS

    # Telugu heading
    te_heading = font_table["heading"].get(banner_type, font_table["heading"]["general"])
    en_heading = en_table["heading"].get(banner_type, en_table["heading"]["general"])
    te_body = font_table["body"].get(banner_type, font_table["body"]["general"])
    en_body = en_table["body"].get(banner_type, en_table["body"]["general"])

    config["elements"]["heading"] = {
        "font_file": te_heading,
        "font_path": str(_resolve_font_path(te_heading)),
        "font_file_en": en_heading,
        "font_path_en": str(_resolve_font_path(en_heading)),
        "max_size_pt": 120,
    }

    config["elements"]["subheading"] = {
        "font_file": te_body,
        "font_path": str(_resolve_font_path(te_body)),
        "font_file_en": en_body,
        "font_path_en": str(_resolve_font_path(en_body)),
        "max_size_pt": 72,
    }

    for role in ["tagline", "body", "footer", "phone"]:
        font_file = te_body if language in ("telugu", "mixed") else en_body
        config["elements"][role] = {
            "font_file": font_file,
            "font_path": str(_resolve_font_path(font_file)),
            "font_file_en": en_body,
            "font_path_en": str(_resolve_font_path(en_body)),
            "max_size_pt": 48,
        }

    return config


def _get_default_font(role: str, language: str, banner_type: str) -> str:
    table = TELUGU_FONTS if language in ("telugu", "mixed") else ENGLISH_FONTS
    category = "heading" if role in ("heading", "tagline") else "body"
    return table[category].get(banner_type, table[category]["general"])


def _resolve_font_path(font_file: str) -> Path:
    """Resolve font file to full path, checking project fonts then system fonts."""
    from config.settings import settings
    return settings.get_font_path(font_file)


def _validate_fonts(config: dict):
    """Warn about missing font files."""
    for role, entry in config.get("elements", {}).items():
        if isinstance(entry, dict):
            path = entry.get("font_path", "")
            if path and not Path(path).exists():
                logger.warning(f"[FontIntelligence] Font not found for {role}: {path}")
