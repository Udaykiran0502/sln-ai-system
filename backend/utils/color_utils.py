"""
SLN Design Engine v3 — Color Utilities
Hex/RGB/CMYK conversions, WCAG contrast checks, and palette generation.
"""

from __future__ import annotations
import colorsys
import math
from typing import Tuple, List

RGB = Tuple[int, int, int]
CMYK = Tuple[float, float, float, float]
HSL = Tuple[float, float, float]


def hex_to_rgb(hex_str: str) -> RGB:
    """Convert hex color string to RGB tuple. Accepts '#FF9933', 'FF9933', '#F93'."""
    h = hex_str.lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    if len(h) != 6:
        raise ValueError(f"Invalid hex color: {hex_str}")
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))


def rgb_to_hex(r: int, g: int, b: int) -> str:
    return f"#{r:02X}{g:02X}{b:02X}"


def rgb_to_cmyk(r: int, g: int, b: int) -> CMYK:
    r_f, g_f, b_f = r / 255.0, g / 255.0, b / 255.0
    k = 1.0 - max(r_f, g_f, b_f)
    if k >= 1.0:
        return (0.0, 0.0, 0.0, 1.0)
    c = (1.0 - r_f - k) / (1.0 - k)
    m = (1.0 - g_f - k) / (1.0 - k)
    y = (1.0 - b_f - k) / (1.0 - k)
    return (round(c, 4), round(m, 4), round(y, 4), round(k, 4))


def cmyk_to_rgb(c: float, m: float, y: float, k: float) -> RGB:
    r = int(255 * (1.0 - c) * (1.0 - k))
    g = int(255 * (1.0 - m) * (1.0 - k))
    b = int(255 * (1.0 - y) * (1.0 - k))
    return (max(0, min(255, r)), max(0, min(255, g)), max(0, min(255, b)))


def rgb_to_hsl(r: int, g: int, b: int) -> HSL:
    h, l, s = colorsys.rgb_to_hls(r / 255.0, g / 255.0, b / 255.0)
    return (round(h * 360, 1), round(s * 100, 1), round(l * 100, 1))


def hsl_to_rgb(h: float, s: float, l: float) -> RGB:
    r, g, b = colorsys.hls_to_rgb(h / 360.0, l / 100.0, s / 100.0)
    return (int(r * 255), int(g * 255), int(b * 255))


def ensure_cmyk(image):
    """Convert a PIL Image to CMYK mode if not already."""
    if image.mode == "CMYK":
        return image
    if image.mode == "RGBA":
        from PIL import Image
        bg = Image.new("RGB", image.size, (255, 255, 255))
        bg.paste(image, mask=image.split()[3])
        return bg.convert("CMYK")
    return image.convert("CMYK")


def _relative_luminance(r: int, g: int, b: int) -> float:
    def linearize(c: int) -> float:
        c_s = c / 255.0
        return c_s / 12.92 if c_s <= 0.04045 else ((c_s + 0.055) / 1.055) ** 2.4
    return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b)


def contrast_ratio(color1: str | RGB, color2: str | RGB) -> float:
    """WCAG 2.1 contrast ratio between two colors (1.0 to 21.0)."""
    if isinstance(color1, str):
        color1 = hex_to_rgb(color1)
    if isinstance(color2, str):
        color2 = hex_to_rgb(color2)
    l1 = _relative_luminance(*color1)
    l2 = _relative_luminance(*color2)
    lighter, darker = max(l1, l2), min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)


def passes_wcag_aa(fg: str | RGB, bg: str | RGB, large_text: bool = False) -> bool:
    ratio = contrast_ratio(fg, bg)
    return ratio >= (3.0 if large_text else 4.5)


def darken(hex_color: str, factor: float = 0.2) -> str:
    r, g, b = hex_to_rgb(hex_color)
    h, s, l = rgb_to_hsl(r, g, b)
    l = max(0, l * (1 - factor))
    return rgb_to_hex(*hsl_to_rgb(h, s, l))


def lighten(hex_color: str, factor: float = 0.2) -> str:
    r, g, b = hex_to_rgb(hex_color)
    h, s, l = rgb_to_hsl(r, g, b)
    l = min(100, l + (100 - l) * factor)
    return rgb_to_hex(*hsl_to_rgb(h, s, l))


def best_text_color(background: str) -> str:
    """Choose black or white text for maximum contrast against a background."""
    r, g, b = hex_to_rgb(background)
    return "#000000" if _relative_luminance(r, g, b) > 0.179 else "#FFFFFF"


def generate_palette(base_hex: str, scheme: str = "complementary") -> List[str]:
    r, g, b = hex_to_rgb(base_hex)
    h, s, l = rgb_to_hsl(r, g, b)
    palette = [base_hex]
    if scheme == "complementary":
        palette.append(rgb_to_hex(*hsl_to_rgb((h + 180) % 360, s, l)))
    elif scheme == "analogous":
        for offset in [-30, 30]:
            palette.append(rgb_to_hex(*hsl_to_rgb((h + offset) % 360, s, l)))
    elif scheme == "triadic":
        for offset in [120, 240]:
            palette.append(rgb_to_hex(*hsl_to_rgb((h + offset) % 360, s, l)))
    elif scheme == "split_complementary":
        for offset in [150, 210]:
            palette.append(rgb_to_hex(*hsl_to_rgb((h + offset) % 360, s, l)))
    return palette


def color_distance(color1: str | RGB, color2: str | RGB) -> float:
    if isinstance(color1, str):
        color1 = hex_to_rgb(color1)
    if isinstance(color2, str):
        color2 = hex_to_rgb(color2)
    return math.sqrt(sum((a - b) ** 2 for a, b in zip(color1, color2)))


def set_opacity(hex_color: str, opacity: float) -> Tuple[int, int, int, int]:
    r, g, b = hex_to_rgb(hex_color)
    return (r, g, b, int(opacity * 255))
