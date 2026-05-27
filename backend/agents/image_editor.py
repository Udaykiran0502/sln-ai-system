"""
SLN Design Engine v3 — Image Editor Agent
Background removal, resizing, enhancement. Memory-guarded processing.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import List, Tuple

logger = logging.getLogger(__name__)


def image_editor(state: dict) -> dict:
    """Process images: remove backgrounds, resize to slots, enhance.

    State keys read:
        - layout_plan: dict
        - parsed_order: dict (images list)

    State keys written:
        - processed_images: list of dicts with paths and rects
    """
    layout = state.get("layout_plan", {})
    parsed = state.get("parsed_order", {})
    order_id = state.get("order_id", "")

    logger.info("[ImageEditor] Processing images")

    processed = []
    image_elements = [e for e in layout.get("elements", []) if e.get("element_type") == "image"]

    for elem in image_elements:
        img_path = elem.get("image_path", "")
        rect = elem.get("rect", (0, 0, 100, 100))

        if not img_path:
            # Create placeholder
            placeholder = _create_placeholder(rect, elem.get("name", "image"), order_id)
            processed.append({
                "name": elem.get("name"),
                "path": placeholder,
                "rect": rect,
                "is_placeholder": True,
            })
            continue

        # Process the image
        result_path = _process_image(img_path, rect, order_id, elem.get("name", ""))
        processed.append({
            "name": elem.get("name"),
            "path": result_path,
            "rect": rect,
            "is_placeholder": False,
        })

    return {"processed_images": processed}


def _process_image(src_path: str, rect: tuple, order_id: str, name: str) -> str:
    """Process a single image: resize, enhance, optionally remove background."""
    from PIL import Image, ImageEnhance
    from config.settings import settings

    src = Path(src_path)
    if not src.exists():
        # Check in assets
        src = settings.project_root / src_path
    if not src.exists():
        logger.warning(f"[ImageEditor] Image not found: {src_path}")
        return _create_placeholder(rect, name, order_id)

    try:
        img = Image.open(src)

        # Memory guard: limit processing size
        max_px = settings.max_image_px
        if max(img.size) > max_px:
            ratio = max_px / max(img.size)
            new_size = (int(img.size[0] * ratio), int(img.size[1] * ratio))
            img = img.resize(new_size, Image.LANCZOS)

        # Convert to RGBA for compositing
        if img.mode != "RGBA":
            img = img.convert("RGBA")

        # Resize to fit slot
        target_w, target_h = rect[2], rect[3]
        if target_w > 0 and target_h > 0:
            img = _resize_to_slot(img, target_w, target_h)

        # Enhance
        img = _enhance(img)

        # Save processed image
        out_dir = settings.orders_dir / order_id
        out_dir.mkdir(parents=True, exist_ok=True)
        out_path = out_dir / f"processed_{name}.png"
        img.save(str(out_path), "PNG")

        return str(out_path)

    except Exception as e:
        logger.error(f"[ImageEditor] Failed to process {src_path}: {e}")
        return _create_placeholder(rect, name, order_id)


def remove_background(image_path: str) -> str:
    """Remove background from an image using rembg.

    Returns path to the processed image.
    """
    try:
        from rembg import remove
        from PIL import Image
        import io

        img = Image.open(image_path)
        output = remove(img)

        out_path = Path(image_path).with_suffix(".nobg.png")
        output.save(str(out_path), "PNG")

        logger.info(f"[ImageEditor] Background removed: {out_path}")
        return str(out_path)

    except ImportError:
        logger.warning("[ImageEditor] rembg not available — skipping bg removal")
        return image_path
    except Exception as e:
        logger.error(f"[ImageEditor] Background removal failed: {e}")
        return image_path


def _resize_to_slot(img, target_w: int, target_h: int):
    """Resize image to fit target dimensions while preserving aspect ratio."""
    from PIL import Image

    src_w, src_h = img.size
    src_aspect = src_w / max(src_h, 1)
    target_aspect = target_w / max(target_h, 1)

    if src_aspect > target_aspect:
        # Source is wider — fit to height
        new_h = target_h
        new_w = int(target_h * src_aspect)
    else:
        # Source is taller — fit to width
        new_w = target_w
        new_h = int(target_w / src_aspect)

    img = img.resize((new_w, new_h), Image.LANCZOS)

    # Center crop to exact target
    left = (new_w - target_w) // 2
    top = (new_h - target_h) // 2
    img = img.crop((left, top, left + target_w, top + target_h))

    return img


def _enhance(img, contrast: float = 1.1, sharpness: float = 1.2, brightness: float = 1.05):
    """Apply subtle image enhancement."""
    from PIL import ImageEnhance

    img = ImageEnhance.Contrast(img).enhance(contrast)
    img = ImageEnhance.Sharpness(img).enhance(sharpness)
    img = ImageEnhance.Brightness(img).enhance(brightness)
    return img


def _create_placeholder(rect: tuple, label: str, order_id: str) -> str:
    """Create a placeholder image for missing assets."""
    from PIL import Image, ImageDraw, ImageFont
    from config.settings import settings

    w, h = max(rect[2], 100), max(rect[3], 100)

    # Create a subtle gradient placeholder
    img = Image.new("RGBA", (w, h), (200, 200, 200, 128))
    draw = ImageDraw.Draw(img)

    # Draw X pattern
    draw.line([(0, 0), (w, h)], fill=(150, 150, 150, 200), width=2)
    draw.line([(w, 0), (0, h)], fill=(150, 150, 150, 200), width=2)

    # Label
    try:
        font = ImageFont.load_default()
        draw.text((10, 10), f"[{label}]", fill=(100, 100, 100, 255), font=font)
    except Exception:
        pass

    # Save
    out_dir = settings.orders_dir / order_id
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"placeholder_{label}.png"
    img.save(str(out_path), "PNG")

    return str(out_path)
