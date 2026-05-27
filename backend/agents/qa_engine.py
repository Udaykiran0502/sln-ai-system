"""
SLN Design Engine v3 - QA Engine Agent
Runs automated quality checks plus commercial hard gates for print safety.
"""

from __future__ import annotations

import logging
import re
import re
from pathlib import Path
from typing import List
from backend.utils.patch_merger import Patch

logger = logging.getLogger(__name__)

PHONE_RE = re.compile(r"^[6-9]\d{9}$")
MOJIBAKE_MARKERS = ("à", "Â", "Ã", "ð", "�")

QA_WEIGHTS = {
    "telugu_validity": 1.0,
    "content_completeness": 2.0,
    "phone_validity": 2.0,
    "clipping": 1.0,
    "readability": 2.0,
    "alignment": 1.0,
    "contrast": 2.0,
    "image_quality": 1.0,
    "asset_integrity": 2.0,
    "safe_zone": 1.0,
    "dpi_check": 1.0,
}


def qa_engine(state: dict) -> List[Patch]:
    """Run quality assurance checks on the composite design.

    Hard failures force `qa_passed=False` even when the weighted score is high.
    This protects SLN from approving incomplete or commercially unusable print
    files.
    """
    composite_path = state.get("composite_path", "")
    layout = state.get("layout_plan", {})
    copy_data = state.get("copy", {})
    parsed = state.get("parsed_order", {})
    processed_images = state.get("processed_images", [])

    logger.info("[QA] Running quality checks")

    from config.settings import settings

    hard_failures = []
    scores = {
        "telugu_validity": _check_telugu(copy_data, hard_failures),
        "content_completeness": _check_content(copy_data, parsed, hard_failures),
        "phone_validity": _check_phone(copy_data, parsed, hard_failures),
        "clipping": _check_clipping(layout, hard_failures),
        "readability": _check_readability(layout, hard_failures),
        "alignment": _check_alignment(layout),
        "contrast": _check_contrast(layout, hard_failures),
        "image_quality": _check_image_quality(composite_path),
        "asset_integrity": _check_assets(processed_images, hard_failures),
        "safe_zone": _check_safe_zone(layout, hard_failures),
        "dpi_check": _check_dpi(layout, parsed, hard_failures),
    }

    total_weight = sum(QA_WEIGHTS.values())
    weighted_sum = sum(scores[k] * QA_WEIGHTS[k] for k in scores)
    composite_score = weighted_sum / total_weight
    scores["composite"] = round(composite_score, 1)

    soft_failures = [k for k, v in scores.items() if k != "composite" and v < 60]
    scores["failures"] = soft_failures
    scores["hard_failures"] = hard_failures
    scores["severity"] = _severity(hard_failures, composite_score)

    qa_passed = composite_score >= settings.qa_threshold and not hard_failures

    logger.info(
        "[QA] Composite score: %.1f, passed: %s, failures: %s, hard_failures: %s",
        composite_score,
        qa_passed,
        soft_failures,
        [f["code"] for f in hard_failures],
    )

    return [
        Patch(target_path="qa_scores", operation="set", value=scores),
        Patch(target_path="qa_passed", operation="set", value=qa_passed),
        Patch(target_path="needs_human_review", operation="set", value=bool(hard_failures))
    ]


def _add_hard_failure(failures: list, code: str, message: str, severity: str = "critical"):
    if not any(f["code"] == code for f in failures):
        failures.append({"code": code, "severity": severity, "message": message})


def _all_text(copy_data: dict) -> list[str]:
    values = []
    for key in ["heading_te", "heading_en", "subheading", "tagline", "footer_text", "phone_display"]:
        value = copy_data.get(key, "")
        if value:
            values.append(str(value))
    for value in copy_data.get("extra_lines", []) or []:
        if value:
            values.append(str(value))
    return values


def _check_telugu(copy_data: dict, hard_failures: list) -> int:
    from backend.utils.telugu_shaper import validate_telugu, is_telugu

    score = 100
    for text in _all_text(copy_data):
        if any(marker in text for marker in MOJIBAKE_MARKERS):
            _add_hard_failure(
                hard_failures,
                "telugu_corruption",
                "Some Telugu text appears corrupted. Please re-enter the text using proper Unicode Telugu.",
            )
            score -= 50
        if is_telugu(text):
            result = validate_telugu(text)
            if not result["valid"]:
                score -= 20 * len(result["issues"])
                _add_hard_failure(
                    hard_failures,
                    "telugu_invalid",
                    "Telugu text could not be validated. Please review the spelling and font rendering.",
                )
    return max(0, score)


def _check_content(copy_data: dict, parsed: dict, hard_failures: list) -> int:
    heading = (copy_data.get("heading_te") or copy_data.get("heading_en") or "").strip()
    source_heading = str(parsed.get("text_content", {}).get("heading", "")).strip()
    cta = (copy_data.get("phone_display") or copy_data.get("tagline") or copy_data.get("footer_text") or "").strip()

    score = 100
    if len(heading or source_heading) < 2:
        _add_hard_failure(hard_failures, "missing_heading", "Main heading is missing. Add the primary banner text.")
        score -= 60
    if len(cta) < 2:
        _add_hard_failure(hard_failures, "missing_cta", "Contact or footer information is missing.")
        score -= 40
    return max(0, score)


def _check_phone(copy_data: dict, parsed: dict, hard_failures: list) -> int:
    values = list(parsed.get("phone_numbers", []) or [])
    if copy_data.get("phone_display"):
        values.append(copy_data["phone_display"])
    values.extend([parsed.get("text_content", {}).get("phone", "")])

    digits = [re.sub(r"\D", "", str(v)) for v in values if str(v).strip()]
    if not digits:
        _add_hard_failure(hard_failures, "missing_phone", "A valid phone number is required for customer contact.")
        return 0
    if not any(PHONE_RE.fullmatch(d) for d in digits):
        _add_hard_failure(
            hard_failures,
            "invalid_phone",
            "Phone number must be a valid 10-digit Indian mobile number.",
        )
        return 20
    return 100


def _check_clipping(layout: dict, hard_failures: list) -> int:
    canvas_w = layout.get("canvas_width", 4800)
    canvas_h = layout.get("canvas_height", 2400)

    score = 100
    for elem in layout.get("elements", []):
        rect = elem.get("rect", (0, 0, 0, 0))
        x, y, w, h = rect[0], rect[1], rect[2], rect[3]
        if x < 0 or y < 0 or x + w > canvas_w or y + h > canvas_h:
            score -= 25
            if elem.get("element_type") == "text":
                _add_hard_failure(hard_failures, "text_clipping", "Text is outside the printable canvas.")
    return max(0, score)


def _check_readability(layout: dict, hard_failures: list) -> int:
    dpi = layout.get("dpi", 300)
    min_body_pt = 10 if dpi >= 300 else 14

    score = 100
    for elem in layout.get("elements", []):
        if elem.get("element_type") == "text" and elem.get("text"):
            font_size = elem.get("font_size", 48)
            if font_size < min_body_pt:
                score -= 30
                _add_hard_failure(hard_failures, "text_too_small", "Some text is too small for readable print output.")
            elif font_size < min_body_pt * 1.5:
                score -= 10
    return max(0, score)


def _check_alignment(layout: dict) -> int:
    grid_size = 4
    score = 100
    for elem in layout.get("elements", []):
        rect = elem.get("rect", (0, 0, 0, 0))
        if rect[0] % grid_size > 2 or rect[1] % grid_size > 2:
            score -= 5
    return max(0, score)


def _check_contrast(layout: dict, hard_failures: list) -> int:
    from backend.utils.color_utils import contrast_ratio

    colors = layout.get("metadata", {}).get("colors", {})
    bg_color = colors.get("background", layout.get("background_color", "#FFFFFF"))
    score = 100

    for elem in layout.get("elements", []):
        if elem.get("element_type") == "text" and elem.get("text"):
            try:
                ratio = contrast_ratio(elem.get("color", "#000000"), bg_color)
                if ratio < 3.0:
                    score -= 35
                    _add_hard_failure(hard_failures, "low_contrast", "Text contrast is too low for print readability.")
                elif ratio < 4.5:
                    score -= 15
            except (ValueError, TypeError):
                score -= 10
    return max(0, score)


def _check_image_quality(composite_path: str) -> int:
    if not composite_path or not Path(composite_path).exists():
        return 30
    try:
        import cv2
        img = cv2.imread(composite_path, cv2.IMREAD_GRAYSCALE)
        if img is None:
            return 30
        h, w = img.shape
        if max(h, w) > 1000:
            scale = 1000 / max(h, w)
            img = cv2.resize(img, None, fx=scale, fy=scale)
        variance = cv2.Laplacian(img, cv2.CV_64F).var()
        if variance > 500:
            return 100
        if variance > 200:
            return 85
        if variance > 100:
            return 70
        if variance > 50:
            return 50
        return 30
    except ImportError:
        logger.warning("[QA] OpenCV not available for blur detection")
        return 75
    except Exception as e:
        logger.warning("[QA] Image quality check failed: %s", e)
        return 50


def _check_assets(processed_images: list, hard_failures: list) -> int:
    if not processed_images:
        return 100

    score = 100
    for image in processed_images:
        path = image.get("path", "")
        if image.get("is_placeholder"):
            score -= 60
            _add_hard_failure(
                hard_failures,
                "placeholder_image",
                "A required customer image is missing. Please upload a usable image before export.",
            )
            continue
        if not path or not Path(path).exists():
            score -= 60
            _add_hard_failure(hard_failures, "missing_image_file", "An image asset could not be found on disk.")
            continue
        try:
            from PIL import Image
            with Image.open(path) as img:
                w, h = img.size
                if w < 300 or h < 300:
                    score -= 40
                    _add_hard_failure(
                        hard_failures,
                        "low_resolution_image",
                        "One uploaded image is too small for print. Please upload a clearer image.",
                    )
        except Exception:
            score -= 40
            _add_hard_failure(hard_failures, "unreadable_image", "An uploaded image could not be read.")
    return max(0, score)


def _check_safe_zone(layout: dict, hard_failures: list) -> int:
    safe = layout.get("safe_zone", (0, 0, 4800, 2400))
    sx, sy, sw, sh = safe[0], safe[1], safe[2], safe[3]

    score = 100
    for elem in layout.get("elements", []):
        rect = elem.get("rect", (0, 0, 0, 0))
        x, y, w, h = rect[0], rect[1], rect[2], rect[3]
        if x < sx or y < sy or x + w > sx + sw or y + h > sy + sh:
            score -= 15
            if elem.get("element_type") == "text":
                _add_hard_failure(hard_failures, "text_outside_safe_zone", "Text is outside the print safe zone.")
    return max(0, score)


def _check_dpi(layout: dict, parsed: dict, hard_failures: list) -> int:
    actual_dpi = layout.get("dpi", 300)
    required_dpi = parsed.get("dpi", 300)
    if actual_dpi >= required_dpi:
        return 100
    if actual_dpi >= required_dpi * 0.8:
        return 70
    _add_hard_failure(hard_failures, "low_dpi", "Output DPI is too low for the requested print size.")
    return 30


def _severity(hard_failures: list, score: float) -> str:
    if any(f["severity"] == "critical" for f in hard_failures):
        return "critical"
    if hard_failures or score < 70:
        return "medium"
    return "low"
