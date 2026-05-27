"""
SLN Design Engine v3 — Composition Engine Agent
Composites all layers into the final design image.
Layer order: background → textures → images → text → logos → overlays.
"""

from __future__ import annotations

import logging
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

logger = logging.getLogger(__name__)


def composition(state: dict) -> dict:
    """Composite all elements into the final design image.

    State keys read:
        - layout_plan: dict
        - processed_images: list
        - font_config: dict
        - copy: dict
        - order_id: str

    State keys written:
        - composite_path: str
    """
    layout = state.get("layout_plan", {})
    processed_images = state.get("processed_images", [])
    font_config = state.get("font_config", {})
    order_id = state.get("order_id", "")

    logger.info(f"[Composition] Compositing design for {order_id}")

    canvas_w = layout.get("canvas_width", 4800)
    canvas_h = layout.get("canvas_height", 2400)

    # Create canvas
    canvas = Image.new("RGBA", (canvas_w, canvas_h), (255, 255, 255, 255))

    # Layer 1: Background
    _draw_background(canvas, layout)

    # Layer 2: Images
    _draw_images(canvas, processed_images)

    # Layer 3: Text elements
    _draw_text(canvas, layout, font_config)

    # Layer 4: Decorative elements (borders, overlays)
    _draw_decorations(canvas, layout)

    # Save composite
    from config.settings import settings
    preview_dir = settings.preview_dir
    preview_dir.mkdir(parents=True, exist_ok=True)
    composite_path = str(preview_dir / f"{order_id}.png")
    canvas.convert("RGB").save(composite_path, "PNG")

    logger.info(f"[Composition] Saved composite: {composite_path}")

    return {"composite_path": composite_path}


def _draw_background(canvas: Image.Image, layout: dict):
    """Draw background color or gradient."""
    from backend.utils.color_utils import hex_to_rgb

    bg_color = layout.get("background_color", "#FFFFFF")
    bg_image = layout.get("background_image", "")

    # Try background image first
    if bg_image:
        try:
            bg_path = Path(bg_image)
            if bg_path.exists():
                bg = Image.open(str(bg_path)).resize(canvas.size, Image.LANCZOS)
                if bg.mode != "RGBA":
                    bg = bg.convert("RGBA")
                canvas.paste(bg, (0, 0))
                return
        except Exception as e:
            logger.warning(f"[Composition] Background image failed: {e}")

    # Gradient background
    colors = layout.get("metadata", {}).get("colors", {})
    primary = colors.get("primary", bg_color)
    secondary = colors.get("secondary", colors.get("background", bg_color))

    try:
        primary_rgb = hex_to_rgb(primary)
        secondary_rgb = hex_to_rgb(secondary)
    except ValueError:
        primary_rgb = (255, 255, 255)
        secondary_rgb = (240, 240, 240)

    _draw_gradient(canvas, primary_rgb, secondary_rgb)


def _draw_gradient(canvas: Image.Image, color1: tuple, color2: tuple, direction: str = "diagonal"):
    """Draw a gradient on the canvas using numpy for performance."""
    import numpy as np

    w, h = canvas.size

    # Create gradient array
    if direction == "vertical":
        t = np.linspace(0, 1, h).reshape(h, 1)
        t = np.broadcast_to(t, (h, w))
    elif direction == "horizontal":
        t = np.linspace(0, 1, w).reshape(1, w)
        t = np.broadcast_to(t, (h, w))
    else:  # diagonal
        ty = np.linspace(0, 0.5, h).reshape(h, 1)
        tx = np.linspace(0, 0.5, w).reshape(1, w)
        t = ty + tx

    t = np.clip(t, 0, 1)

    # Interpolate colors
    r = (color1[0] + (color2[0] - color1[0]) * t).astype(np.uint8)
    g = (color1[1] + (color2[1] - color1[1]) * t).astype(np.uint8)
    b = (color1[2] + (color2[2] - color1[2]) * t).astype(np.uint8)

    # Stack into RGB image
    gradient = np.stack([r, g, b], axis=2)
    grad_img = Image.fromarray(gradient, "RGB").convert("RGBA")
    canvas.paste(grad_img, (0, 0))


def _draw_images(canvas: Image.Image, processed_images: list):
    """Paste processed images onto the canvas."""
    for img_info in processed_images:
        path = img_info.get("path", "")
        rect = img_info.get("rect", (0, 0, 100, 100))

        if not path or not Path(path).exists():
            continue

        try:
            img = Image.open(path)
            if img.mode != "RGBA":
                img = img.convert("RGBA")

            # Resize to slot
            target_w, target_h = rect[2], rect[3]
            if target_w > 0 and target_h > 0:
                img = img.resize((target_w, target_h), Image.LANCZOS)

            # Paste with alpha
            canvas.paste(img, (rect[0], rect[1]), img)

        except Exception as e:
            logger.warning(f"[Composition] Failed to paste image {path}: {e}")


def _draw_text(canvas: Image.Image, layout: dict, font_config: dict):
    """Render all text elements onto the canvas."""
    from backend.utils.telugu_shaper import is_telugu, render_shaped_text, render_text_with_shadow

    elements = layout.get("elements", [])
    text_elements = [e for e in elements if e.get("element_type") == "text"]

    # Sort by z_index
    text_elements.sort(key=lambda e: e.get("z_index", 0))

    for elem in text_elements:
        text = elem.get("text", "")
        if not text.strip():
            continue

        rect = elem.get("rect", (0, 0, 100, 100))
        font_path = elem.get("font_path", "")
        font_size = elem.get("font_size", 48)
        color = elem.get("color", "#000000")
        name = elem.get("name", "")

        # Get font path from config if not in element
        if not font_path or not Path(font_path).exists():
            fe = font_config.get("elements", {}).get(name, {})
            if is_telugu(text):
                font_path = fe.get("font_path", "")
            else:
                font_path = fe.get("font_path_en", fe.get("font_path", ""))

        # Position text centered in its rect
        x = rect[0] + rect[2] // 2
        y = rect[1] + rect[3] // 2

        try:
            if name == "heading":
                render_text_with_shadow(
                    canvas, text, (rect[0], rect[1]),
                    font_path, font_size, color,
                    shadow_color="#333333", shadow_offset=(3, 3),
                )
            else:
                render_shaped_text(
                    canvas, text, (rect[0], rect[1]),
                    font_path, font_size, color,
                )
        except Exception as e:
            logger.warning(f"[Composition] Text render failed for '{name}': {e}")
            # Fallback: PIL basic text
            try:
                draw = ImageDraw.Draw(canvas)
                font = ImageFont.load_default()
                from backend.utils.color_utils import hex_to_rgb
                draw.text((rect[0], rect[1]), text, fill=hex_to_rgb(color), font=font)
            except Exception:
                pass


def _draw_decorations(canvas: Image.Image, layout: dict):
    """Draw decorative elements: borders, corner ornaments, etc."""
    draw = ImageDraw.Draw(canvas)
    colors = layout.get("metadata", {}).get("colors", {})
    accent = colors.get("accent", "#000000")

    try:
        from backend.utils.color_utils import hex_to_rgb
        accent_rgb = hex_to_rgb(accent)
    except (ValueError, ImportError):
        accent_rgb = (0, 0, 0)

    w, h = canvas.size

    # Simple border
    border_width = max(4, min(w, h) // 200)
    for i in range(border_width):
        draw.rectangle(
            [(i, i), (w - 1 - i, h - 1 - i)],
            outline=accent_rgb + (200,) if len(accent_rgb) == 3 else accent_rgb,
        )
