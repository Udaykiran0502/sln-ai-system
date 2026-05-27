"""
SLN Design Engine v3 — Telugu Text Shaper
HarfBuzz-based Telugu text shaping with proper ligature handling.
Uses uharfbuzz for OpenType shaping + PIL for rendering.
"""

from __future__ import annotations

import re
import logging
from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional, Tuple

logger = logging.getLogger(__name__)


@dataclass
class ShapedGlyph:
    """A positioned glyph from HarfBuzz shaping."""
    glyph_id: int
    x_offset: int
    y_offset: int
    x_advance: int
    y_advance: int
    cluster: int


# Telugu Unicode ranges
TELUGU_BASE = range(0x0C00, 0x0C80)
TELUGU_VOWELS = range(0x0C05, 0x0C15)
TELUGU_CONSONANTS = range(0x0C15, 0x0C3A)
TELUGU_VOWEL_SIGNS = range(0x0C3E, 0x0C4E)
TELUGU_VIRAMA = 0x0C4D
TELUGU_DIGITS = range(0x0C66, 0x0C70)


def is_telugu(text: str) -> bool:
    """Check if text contains Telugu characters."""
    return any(ord(c) in TELUGU_BASE for c in text)


def validate_telugu(text: str) -> dict:
    """Validate Telugu text for common issues.

    Returns dict with 'valid' bool and 'issues' list.
    """
    issues = []

    for i, char in enumerate(text):
        cp = ord(char)

        # Check for lone vowel signs (should follow a consonant)
        if cp in range(0x0C3E, 0x0C4E):
            if i == 0 or ord(text[i - 1]) not in TELUGU_CONSONANTS:
                # Could be after a conjunct — allow if preceded by virama+consonant
                if i < 2 or ord(text[i - 1]) != TELUGU_VIRAMA:
                    pass  # Not always an error in complex conjuncts

        # Check for double virama
        if cp == TELUGU_VIRAMA and i > 0 and ord(text[i - 1]) == TELUGU_VIRAMA:
            issues.append(f"Double virama at position {i}")

    return {"valid": len(issues) == 0, "issues": issues}


def shape_text(
    text: str,
    font_path: str,
    size: int,
    direction: str = "ltr",
    language: str = "tel",
) -> List[ShapedGlyph]:
    """Shape text using HarfBuzz for proper ligature handling.

    Args:
        text: Text to shape
        font_path: Path to TTF/OTF font file
        size: Font size in points
        direction: Text direction ('ltr' or 'rtl')
        language: Language tag

    Returns:
        List of ShapedGlyph with positioning info
    """
    try:
        import uharfbuzz as hb

        font_path = str(font_path)

        # Read font data
        with open(font_path, "rb") as f:
            font_data = f.read()

        # Create HarfBuzz face and font
        face = hb.Face(font_data)
        font = hb.Font(face)
        font.scale = (size * 64, size * 64)  # 26.6 fixed point

        # Create buffer
        buf = hb.Buffer()
        buf.add_str(text)
        buf.guess_segment_properties()

        # Override if specified
        if direction == "rtl":
            buf.direction = "rtl"

        # Shape
        hb.shape(font, buf)

        # Extract glyph info
        infos = buf.glyph_infos
        positions = buf.glyph_positions

        glyphs = []
        for info, pos in zip(infos, positions):
            glyphs.append(ShapedGlyph(
                glyph_id=info.codepoint,
                x_offset=pos.x_offset // 64,
                y_offset=pos.y_offset // 64,
                x_advance=pos.x_advance // 64,
                y_advance=pos.y_advance // 64,
                cluster=info.cluster,
            ))

        return glyphs

    except ImportError:
        logger.warning("uharfbuzz not available — falling back to basic rendering")
        return []
    except Exception as e:
        logger.error(f"HarfBuzz shaping failed: {e}")
        return []


def measure_text(
    text: str,
    font_path: str,
    size: int,
) -> Tuple[int, int]:
    """Measure text dimensions using either HarfBuzz or Pillow fallback.

    Returns (width, height) in pixels.
    """
    # Try HarfBuzz first
    glyphs = shape_text(text, font_path, size)
    if glyphs:
        total_width = sum(g.x_advance for g in glyphs)
        height = size  # Approximate
        return (total_width, height)

    # Pillow fallback
    try:
        from PIL import ImageFont
        font = ImageFont.truetype(font_path, size)
        bbox = font.getbbox(text)
        return (bbox[2] - bbox[0], bbox[3] - bbox[1])
    except Exception:
        # Rough estimate
        return (int(size * len(text) * 0.6), size)


def render_shaped_text(
    image,
    text: str,
    position: Tuple[int, int],
    font_path: str,
    size: int,
    color: str | Tuple = "#000000",
    anchor: str = "lt",
):
    """Render text onto a PIL Image with proper shaping.

    Uses Pillow's built-in text rendering which handles complex scripts
    when libraqm is available. Falls back to basic rendering otherwise.

    Args:
        image: PIL Image to draw on
        text: Text to render
        position: (x, y) top-left position
        font_path: Path to font file
        size: Font size in points
        color: Text color (hex string or RGB tuple)
        anchor: Text anchor point
    """
    from PIL import ImageDraw, ImageFont, features

    if isinstance(color, str):
        from backend.utils.color_utils import hex_to_rgb
        color = hex_to_rgb(color)

    draw = ImageDraw.Draw(image)

    try:
        font = ImageFont.truetype(font_path, size)
    except (OSError, IOError):
        logger.warning(f"Font not found: {font_path}, using default")
        font = ImageFont.load_default()

    has_raqm = features.check('raqm')
    if has_raqm:
        # Pillow's text rendering handles Telugu when libraqm is available
        draw.text(position, text, font=font, fill=color, anchor=anchor)
    else:
        # Freetype-py + HarfBuzz fallback for Windows systems missing libraqm
        try:
            import freetype
            import numpy as np
            from PIL import Image

            glyphs = shape_text(text, font_path, size)
            if not glyphs:
                draw.text(position, text, font=font, fill=color, anchor=anchor)
                return

            face = freetype.Face(font_path)
            # Freetype uses 1/64th of a pixel. 
            # Pillow truetype sizes usually correspond directly to pixel sizes at 72 dpi.
            face.set_pixel_sizes(0, size)

            pen_x, pen_y = position[0], position[1]

            # Adjust starting pen if anchor is not 'lt'
            if anchor != 'lt':
                # Quick approximate adjustment for other anchors
                total_w = sum(g.x_advance for g in glyphs)
                if 'm' in anchor or 'c' in anchor:
                    pen_x -= total_w / 2
                elif 'r' in anchor:
                    pen_x -= total_w
                if anchor.startswith('m'):
                    pen_y -= size / 2
                elif anchor.startswith('d') or anchor.startswith('b'):
                    pen_y -= size

            for g in glyphs:
                face.load_glyph(g.glyph_id, freetype.FT_LOAD_RENDER | freetype.FT_LOAD_NO_HINTING)
                bitmap = face.glyph.bitmap
                if bitmap.width > 0 and bitmap.rows > 0:
                    # Convert freetype bitmap to numpy array
                    arr = np.array(bitmap.buffer, dtype=np.uint8).reshape((bitmap.rows, bitmap.width))
                    # Create RGBA image from bitmap (use bitmap as alpha channel)
                    glyph_img = Image.new("RGBA", (bitmap.width, bitmap.rows), color)
                    mask = Image.fromarray(arr, mode="L")
                    glyph_img.putalpha(mask)

                    # Calculate precise draw coordinates
                    # Freetype bitmap_top is distance from baseline to top of bitmap.
                    # We must adjust based on font metrics.
                    x = int(pen_x + g.x_offset + face.glyph.bitmap_left)
                    y = int(pen_y + g.y_offset + size - face.glyph.bitmap_top) # Approx baseline
                    
                    # Safe alpha composite without bounds error
                    image.alpha_composite(glyph_img, (x, y))

                pen_x += g.x_advance
                pen_y += g.y_advance

        except Exception as e:
            logger.error(f"Freetype fallback rendering failed: {e}")
            draw.text(position, text, font=font, fill=color, anchor=anchor)


def render_text_with_shadow(
    image,
    text: str,
    position: Tuple[int, int],
    font_path: str,
    size: int,
    color: str = "#FFFFFF",
    shadow_color: str = "#000000",
    shadow_offset: Tuple[int, int] = (2, 2),
):
    """Render text with a drop shadow for better readability."""
    sx, sy = shadow_offset
    shadow_pos = (position[0] + sx, position[1] + sy)

    # Draw shadow
    render_shaped_text(image, text, shadow_pos, font_path, size, shadow_color)
    # Draw main text
    render_shaped_text(image, text, position, font_path, size, color)


def render_text_with_outline(
    image,
    text: str,
    position: Tuple[int, int],
    font_path: str,
    size: int,
    color: str = "#FFFFFF",
    outline_color: str = "#000000",
    outline_width: int = 2,
):
    """Render text with an outline for maximum readability on any background."""
    from PIL import ImageDraw, ImageFont

    if isinstance(color, str):
        from backend.utils.color_utils import hex_to_rgb
        color = hex_to_rgb(color)
    if isinstance(outline_color, str):
        from backend.utils.color_utils import hex_to_rgb
        outline_color = hex_to_rgb(outline_color)

    draw = ImageDraw.Draw(image)

    try:
        font = ImageFont.truetype(font_path, size)
    except (OSError, IOError):
        font = ImageFont.load_default()

    x, y = position
    # Draw outline
    for dx in range(-outline_width, outline_width + 1):
        for dy in range(-outline_width, outline_width + 1):
            if dx != 0 or dy != 0:
                draw.text((x + dx, y + dy), text, font=font, fill=outline_color)
    # Draw main text
    draw.text((x, y), text, font=font, fill=color)
