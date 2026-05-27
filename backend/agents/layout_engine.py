"""
SLN Design Engine v3 — Layout Engine Agent
Deterministic layout using bounding box math. Zero randomness.
Same input ALWAYS produces same output.
"""

from __future__ import annotations

import logging
from typing import List

from backend.utils.bbox import (
    Rect, Size, Point, LayoutElement, LayoutPlan,
    calculate_safe_zone, hierarchy_layout, auto_scale_font,
    aspect_fit, center_in_rect, inches_to_pixels,
)
from backend.utils.patch_merger import Patch
from backend.utils.scene_graph import SceneGraph, RootNode, GroupNode, TextNode, ImageNode, ShapeNode, Transform, Bounds

logger = logging.getLogger(__name__)


# ── Layout Patterns ──────────────────────────────────────────────

LAYOUT_PATTERNS = {
    "hero_left_text_right": {
        "description": "Hero image on left, text stack on right",
        "regions": [
            {"name": "hero_image", "x_pct": 0, "y_pct": 0, "w_pct": 40, "h_pct": 100, "type": "image"},
            {"name": "heading", "x_pct": 42, "y_pct": 8, "w_pct": 55, "h_pct": 22, "type": "text"},
            {"name": "subheading", "x_pct": 42, "y_pct": 32, "w_pct": 55, "h_pct": 15, "type": "text"},
            {"name": "body", "x_pct": 42, "y_pct": 49, "w_pct": 55, "h_pct": 20, "type": "text"},
            {"name": "phone", "x_pct": 42, "y_pct": 71, "w_pct": 55, "h_pct": 10, "type": "text"},
            {"name": "footer", "x_pct": 0, "y_pct": 85, "w_pct": 100, "h_pct": 15, "type": "text"},
        ],
    },
    "centered_stack": {
        "description": "Centered vertical stack — title, image, text, footer",
        "regions": [
            {"name": "heading", "x_pct": 10, "y_pct": 5, "w_pct": 80, "h_pct": 18, "type": "text"},
            {"name": "hero_image", "x_pct": 25, "y_pct": 25, "w_pct": 50, "h_pct": 35, "type": "image"},
            {"name": "subheading", "x_pct": 10, "y_pct": 62, "w_pct": 80, "h_pct": 12, "type": "text"},
            {"name": "body", "x_pct": 15, "y_pct": 76, "w_pct": 70, "h_pct": 10, "type": "text"},
            {"name": "footer", "x_pct": 5, "y_pct": 88, "w_pct": 90, "h_pct": 10, "type": "text"},
        ],
    },
    "split": {
        "description": "50/50 left-right split",
        "regions": [
            {"name": "hero_image", "x_pct": 0, "y_pct": 0, "w_pct": 50, "h_pct": 100, "type": "image"},
            {"name": "heading", "x_pct": 52, "y_pct": 10, "w_pct": 45, "h_pct": 25, "type": "text"},
            {"name": "subheading", "x_pct": 52, "y_pct": 38, "w_pct": 45, "h_pct": 15, "type": "text"},
            {"name": "body", "x_pct": 52, "y_pct": 56, "w_pct": 45, "h_pct": 18, "type": "text"},
            {"name": "footer", "x_pct": 52, "y_pct": 78, "w_pct": 45, "h_pct": 18, "type": "text"},
        ],
    },
    "grid": {
        "description": "Multi-image grid layout",
        "regions": [
            {"name": "heading", "x_pct": 5, "y_pct": 3, "w_pct": 90, "h_pct": 15, "type": "text"},
            {"name": "image_1", "x_pct": 5, "y_pct": 20, "w_pct": 28, "h_pct": 55, "type": "image"},
            {"name": "image_2", "x_pct": 36, "y_pct": 20, "w_pct": 28, "h_pct": 55, "type": "image"},
            {"name": "image_3", "x_pct": 67, "y_pct": 20, "w_pct": 28, "h_pct": 55, "type": "image"},
            {"name": "footer", "x_pct": 5, "y_pct": 78, "w_pct": 90, "h_pct": 18, "type": "text"},
        ],
    },
}


def layout_engine(state: dict) -> List[Patch]:
    """Generate deterministic layout plan with absolute pixel coordinates and SceneGraph.

    State keys read:
        - parsed_order: dict (dimensions, dpi)
        - style_metadata: dict (preferred_layout, text_hierarchy)
        - copy: dict (all text elements)
        - font_config: dict (font paths and sizes)
        - selected_template: dict (layout_regions if template workflow)

    State keys written (via patches):
        - layout_plan: dict
        - scene_graph: str (JSON serialized SceneGraph)
    """
    parsed = state.get("parsed_order", {})
    style = state.get("style_metadata", {})
    copy_data = state.get("copy", {})
    font_config = state.get("font_config", {})
    template = state.get("selected_template", {})

    logger.info("[LayoutEngine] Computing layout")

    # Canvas dimensions
    dims = parsed.get("dimensions", {"width_inches": 48, "height_inches": 24})
    dpi = parsed.get("dpi", 300)
    width_inches = dims.get("width_inches")
    height_inches = dims.get("height_inches")
    if not isinstance(width_inches, (int, float)) or not isinstance(height_inches, (int, float)):
        raise ValueError("Layout requires numeric width_inches and height_inches")
    if width_inches <= 0 or height_inches <= 0:
        raise ValueError("Layout dimensions must be greater than zero")
    if width_inches * height_inches * dpi * dpi > 120_000_000:
        raise ValueError("Requested canvas is too large for this workstation")
    canvas = inches_to_pixels(dims["width_inches"], dims["height_inches"], dpi)

    # Safe zone
    margins = parsed.get("safe_zones", {"top": 5, "bottom": 5, "left": 5, "right": 5})
    if template and template.get("safe_zones"):
        margins = template["safe_zones"]
    safe_zone = calculate_safe_zone(canvas.width, canvas.height, margins)

    # Choose layout pattern
    layout_type = _choose_layout(style, template)
    pattern = LAYOUT_PATTERNS.get(layout_type, LAYOUT_PATTERNS["centered_stack"])

    # Build elements
    elements = _build_elements(
        pattern, safe_zone, canvas, copy_data, font_config, parsed
    )

    # Colors from order or template
    colors = parsed.get("colors", {})
    if template and template.get("colors"):
        colors = {**template["colors"], **colors}

    bg_color = colors.get("background", "#FFFFFF")
    bg_image = template.get("background_path", "")

    plan = LayoutPlan(
        canvas_width=canvas.width,
        canvas_height=canvas.height,
        dpi=dpi,
        safe_zone=safe_zone,
        elements=elements,
        background_color=bg_color,
        background_image=bg_image,
        metadata={
            "layout_type": layout_type,
            "colors": colors,
        }
    )

    logger.info(f"[LayoutEngine] Layout computed: {canvas.width}x{canvas.height}px, {len(elements)} elements")

    # Generate Canonical Scene Graph (bounds & transform normalized in [0.0, 1.0])
    sg = SceneGraph()
    bg_group = GroupNode(name="BackgroundGroup", z_index=0)
    content_group = GroupNode(name="ContentGroup", z_index=10)
    sg.root.add_child(bg_group)
    sg.root.add_child(content_group)
    
    # Add background rect
    bg_rect = ShapeNode(
        name="CanvasBackground",
        shape_type="rectangle",
        fill_color=bg_color,
        bounds=Bounds(x=0.0, y=0.0, width=1.0, height=1.0),
        z_index=1
    )
    bg_group.add_child(bg_rect)
    
    if bg_image:
        bg_img_node = ImageNode(
            name="BackgroundImage",
            image_path=bg_image,
            bounds=Bounds(x=0.0, y=0.0, width=1.0, height=1.0),
            z_index=2
        )
        bg_group.add_child(bg_img_node)
        
    for elem in elements:
        # Normalize coordinates
        cx = elem.rect.x / canvas.width
        cy = elem.rect.y / canvas.height
        cw = elem.rect.width / canvas.width
        ch = elem.rect.height / canvas.height
        
        bounds = Bounds(x=cx, y=cy, width=cw, height=ch)
        transform = Transform(x=cx, y=cy)
        
        if elem.element_type == "text":
            text_node = TextNode(
                name=elem.name,
                text_content=elem.text,
                font_path=elem.font_path,
                font_size=elem.font_size,
                color=elem.color,
                bounds=bounds,
                transform=transform,
                z_index=elem.z_index + 10
            )
            content_group.add_child(text_node)
        elif elem.element_type == "image":
            if elem.image_path:
                img_node = ImageNode(
                    name=elem.name,
                    image_path=elem.image_path,
                    bounds=bounds,
                    transform=transform,
                    z_index=elem.z_index + 10
                )
                content_group.add_child(img_node)

    return [
        Patch(target_path="layout_plan", operation="set", value=_serialize_plan(plan)),
        Patch(target_path="scene_graph", operation="set", value=sg.to_json())
    ]


def _choose_layout(style: dict, template: dict) -> str:
    """Select layout pattern name."""
    if template and template.get("layout_type"):
        lt = template["layout_type"]
        if lt in LAYOUT_PATTERNS:
            return lt

    preferred = style.get("preferred_layout", "centered_stack")
    if preferred in LAYOUT_PATTERNS:
        return preferred

    return "centered_stack"


def _build_elements(
    pattern: dict,
    safe_zone: Rect,
    canvas: Size,
    copy_data: dict,
    font_config: dict,
    parsed: dict,
) -> List[LayoutElement]:
    """Build positioned layout elements from pattern definition."""
    elements = []
    colors = parsed.get("colors", {})
    text_color = colors.get("text", "#000000")

    z_index = 0
    for region in pattern.get("regions", []):
        name = region["name"]
        elem_type = region["type"]

        # Convert percentage-based regions to absolute pixel coords
        rect = Rect(
            x=int(safe_zone.x + safe_zone.width * region["x_pct"] / 100),
            y=int(safe_zone.y + safe_zone.height * region["y_pct"] / 100),
            width=int(safe_zone.width * region["w_pct"] / 100),
            height=int(safe_zone.height * region["h_pct"] / 100),
        )

        z_index += 1

        if elem_type == "text":
            text = _get_text_for_region(name, copy_data)
            font_entry = font_config.get("elements", {}).get(name, {})
            font_path = font_entry.get("font_path", "")

            # Auto-scale font to fit bbox
            font_size = 48  # default
            if font_path and text:
                try:
                    font_size = auto_scale_font(
                        text, rect, font_path,
                        max_size=font_entry.get("max_size_pt", 120),
                        min_size=12,
                    )
                except Exception:
                    pass

            elements.append(LayoutElement(
                name=name,
                rect=rect,
                element_type="text",
                font_size=font_size,
                font_path=font_path,
                text=text,
                color=text_color,
                z_index=z_index,
            ))
        elif elem_type == "image":
            images = parsed.get("images", [])
            img_path = ""
            if "hero" in name and images:
                img_path = images[0]
            elif name.startswith("image_"):
                idx = int(name.split("_")[1]) - 1
                if idx < len(images):
                    img_path = images[idx]

            elements.append(LayoutElement(
                name=name,
                rect=rect,
                element_type="image",
                image_path=img_path,
                z_index=z_index,
            ))

    return elements


def _get_text_for_region(region_name: str, copy_data: dict) -> str:
    """Map region name to copy text."""
    mapping = {
        "heading": copy_data.get("heading_te") or copy_data.get("heading_en", ""),
        "subheading": copy_data.get("subheading", ""),
        "body": copy_data.get("tagline", ""),
        "tagline": copy_data.get("tagline", ""),
        "footer": copy_data.get("footer_text", ""),
        "phone": copy_data.get("phone_display", ""),
    }
    return mapping.get(region_name, "")


def _serialize_plan(plan: LayoutPlan) -> dict:
    """Convert LayoutPlan to JSON-serializable dict."""
    return {
        "canvas_width": plan.canvas_width,
        "canvas_height": plan.canvas_height,
        "dpi": plan.dpi,
        "safe_zone": plan.safe_zone.as_tuple(),
        "background_color": plan.background_color,
        "background_image": plan.background_image,
        "metadata": plan.metadata,
        "elements": [
            {
                "name": e.name,
                "rect": e.rect.as_tuple(),
                "element_type": e.element_type,
                "weight": e.weight,
                "font_size": e.font_size,
                "font_path": e.font_path,
                "text": e.text,
                "color": e.color,
                "image_path": e.image_path,
                "z_index": e.z_index,
                "metadata": e.metadata,
            }
            for e in plan.elements
        ],
    }
