"""
SLN Design Engine v3 — Input Parser Agent
Extracts structured order data from raw text/JSON using Gemini Flash.
Falls back to regex-based extraction if LLM is unavailable.
"""

from __future__ import annotations

import json
import logging
import re
from typing import Optional, List

from pydantic import BaseModel, Field
from backend.utils.patch_merger import Patch

logger = logging.getLogger(__name__)


# ── Output Schema ────────────────────────────────────────────────


class ParsedOrder(BaseModel):
    """Structured order data extracted from raw input."""
    order_id: str = ""
    client_name: str = ""
    banner_type: str = "general"  # political, wedding, business, religious, general
    event_type: str = ""
    dimensions: dict = Field(default_factory=lambda: {"width_inches": 48, "height_inches": 24})
    dpi: int = 300
    language: str = "telugu"  # telugu, english, mixed
    colors: dict = Field(default_factory=lambda: {"primary": "#FF9933", "accent": "#008000"})
    text_content: dict = Field(default_factory=dict)
    images: list = Field(default_factory=list)
    reference_url: Optional[str] = None
    phone_numbers: list = Field(default_factory=list)
    extra: dict = Field(default_factory=dict)


# ── Agent Function ───────────────────────────────────────────────


def input_parser(state: dict) -> List[Patch]:
    """Parse raw order input into structured ParsedOrder.

    State keys read:
        - raw_input: str (JSON string or free-text description)
        - order_id: str

    State keys written:
        - parsed_order: dict (via patch)
    """
    raw = state.get("raw_input", "")
    order_id = state.get("order_id", "UNKNOWN")

    logger.info(f"[InputParser] Parsing order {order_id}")

    # Try direct JSON parse first
    parsed = _try_json_parse(raw)
    if parsed:
        logger.info("[InputParser] Parsed from JSON directly")
        return [Patch(target_path="parsed_order", operation="set", value=parsed.model_dump())]

    # Try LLM extraction
    parsed = _try_llm_parse(raw, order_id)
    if parsed:
        logger.info("[InputParser] Parsed via Gemini LLM")
        return [Patch(target_path="parsed_order", operation="set", value=parsed.model_dump())]

    # Fallback: regex extraction
    parsed = _regex_parse(raw, order_id)
    logger.info("[InputParser] Parsed via regex fallback")
    return [Patch(target_path="parsed_order", operation="set", value=parsed.model_dump())]


# ── Parsing Strategies ───────────────────────────────────────────


def _try_json_parse(raw: str) -> Optional[ParsedOrder]:
    """Try to parse raw input as JSON."""
    try:
        if isinstance(raw, dict):
            data = raw
        else:
            data = json.loads(raw)
        return ParsedOrder(**data)
    except (json.JSONDecodeError, TypeError, Exception):
        return None


def _try_llm_parse(raw: str, order_id: str) -> Optional[ParsedOrder]:
    """Use Gemini Flash to extract structured data from free text."""
    try:
        from config.settings import settings

        if not settings.google_api_key:
            logger.debug("[InputParser] No API key — skipping LLM parse")
            return None

        import google.generativeai as genai

        genai.configure(api_key=settings.google_api_key)
        model = genai.GenerativeModel(settings.gemini_model)

        prompt = f"""Extract structured order information from this banner/poster order request.
Return ONLY valid JSON matching this schema:
{{
    "order_id": "{order_id}",
    "client_name": "string",
    "banner_type": "political|wedding|business|religious|general",
    "event_type": "string",
    "dimensions": {{"width_inches": number, "height_inches": number}},
    "dpi": 300,
    "language": "telugu|english|mixed",
    "colors": {{"primary": "#hex", "accent": "#hex"}},
    "text_content": {{"heading": "string", "subheading": "string", "phone": "string"}},
    "images": ["filename.jpg"],
    "phone_numbers": ["9876543210"]
}}

Order request:
{raw}
"""
        response = model.generate_content(prompt)
        text = response.text.strip()

        # Extract JSON from response
        json_match = re.search(r"\{[\s\S]*\}", text)
        if json_match:
            data = json.loads(json_match.group())
            data["order_id"] = order_id
            return ParsedOrder(**data)

    except Exception as e:
        logger.warning(f"[InputParser] LLM parse failed: {e}")

    return None


def _regex_parse(raw: str, order_id: str) -> ParsedOrder:
    """Fallback regex-based extraction from raw text."""
    data = {"order_id": order_id}

    # Extract phone numbers
    phones = re.findall(r"\b[6-9]\d{9}\b", raw)
    if phones:
        data["phone_numbers"] = phones

    # Detect language
    telugu_chars = sum(1 for c in raw if "\u0C00" <= c <= "\u0C7F")
    english_chars = sum(1 for c in raw if c.isascii() and c.isalpha())
    if telugu_chars > 0 and english_chars > 0:
        data["language"] = "mixed"
    elif telugu_chars > 0:
        data["language"] = "telugu"
    else:
        data["language"] = "english"

    # Detect banner type from keywords
    raw_lower = raw.lower()
    if any(w in raw_lower for w in ["election", "political", "vote", "campaign", "party"]):
        data["banner_type"] = "political"
    elif any(w in raw_lower for w in ["wedding", "marriage", "పెళ్ళి", "వివాహ"]):
        data["banner_type"] = "wedding"
    elif any(w in raw_lower for w in ["business", "shop", "store", "opening", "offer"]):
        data["banner_type"] = "business"
    elif any(w in raw_lower for w in ["temple", "god", "pooja", "festival", "దేవ", "పూజ"]):
        data["banner_type"] = "religious"

    # Extract hex colors
    colors = re.findall(r"#[0-9A-Fa-f]{6}", raw)
    if colors:
        data["colors"] = {"primary": colors[0]}
        if len(colors) > 1:
            data["colors"]["accent"] = colors[1]

    # Extract dimensions (e.g., "48x24", "48 x 24 inches")
    dim_match = re.search(r"(\d+)\s*[xX×]\s*(\d+)", raw)
    if dim_match:
        data["dimensions"] = {
            "width_inches": int(dim_match.group(1)),
            "height_inches": int(dim_match.group(2)),
        }

    return ParsedOrder(**data)
