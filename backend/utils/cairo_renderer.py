import io
import logging
from PIL import Image
from backend.utils.scene_graph import TextNode, ShapeNode, Transform, Bounds

logger = logging.getLogger(__name__)

def render_text_node_to_image(node: TextNode, dpi: int) -> Image.Image:
    """Render a TextNode to a PIL Image using CairoSVG."""
    try:
        import cairosvg
    except ImportError:
        logger.warning("CairoSVG not available, falling back to basic PIL text rendering")
        return _render_text_node_fallback(node, dpi)

    # Convert DPI (CairoSVG expects standard SVG sizing, we can scale via width/height or viewBox)
    # A standard pixel is 1/96 inch in SVG. For 300 DPI, we need to scale up.
    scale_factor = dpi / 72.0
    
    # Render SVG string
    # For text, we must specify font-family and embed font if possible, or assume it's installed.
    # To keep it simple, we just generate SVG text.
    width = node.bounds.width * scale_factor if node.bounds.width > 0 else 1000 * scale_factor
    height = node.bounds.height * scale_factor if node.bounds.height > 0 else 200 * scale_factor
    font_size = node.font_size * scale_factor
    
    font_family = "custom_font"
    font_face = ""
    if hasattr(node, "font_path") and node.font_path:
        from pathlib import Path
        font_path_abs = Path(node.font_path).resolve().as_posix()
        font_face = f"""
        <defs>
            <style>
                @font-face {{
                    font-family: "{font_family}";
                    src: url("file://{font_path_abs}");
                }}
            </style>
        </defs>"""
    else:
        font_family = "Arial, sans-serif"

    svg_content = f"""<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}">
        {font_face}
        <text x="0" y="{font_size}" font-family="{font_family}" font-size="{font_size}px" fill="{node.color}" text-anchor="start">
            {node.text_content}
        </text>
    </svg>"""

    try:
        png_data = cairosvg.svg2png(bytestring=svg_content.encode('utf-8'))
        img = Image.open(io.BytesIO(png_data)).convert("RGBA")
        return img
    except Exception as e:
        logger.error(f"CairoSVG failed to render text: {e}")
        return _render_text_node_fallback(node, dpi)


def render_shape_node_to_image(node: ShapeNode, dpi: int) -> Image.Image:
    """Render a ShapeNode to a PIL Image using CairoSVG."""
    try:
        import cairosvg
    except ImportError:
        logger.warning("CairoSVG not available, falling back to basic PIL shape rendering")
        return _render_shape_node_fallback(node, dpi)

    scale_factor = dpi / 72.0
    width = node.bounds.width * scale_factor
    height = node.bounds.height * scale_factor
    
    if node.shape_type == "rectangle":
        shape_svg = f'<rect x="0" y="0" width="{width}" height="{height}" fill="{node.fill_color}" stroke="{node.stroke_color}" stroke-width="{node.stroke_width * scale_factor}"/>'
    elif node.shape_type == "circle":
        cx, cy = width / 2, height / 2
        r = min(width, height) / 2
        shape_svg = f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{node.fill_color}" stroke="{node.stroke_color}" stroke-width="{node.stroke_width * scale_factor}"/>'
    else:
        # line or unsupported
        shape_svg = ""
        
    svg_content = f"""<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}">
        {shape_svg}
    </svg>"""

    try:
        png_data = cairosvg.svg2png(bytestring=svg_content.encode('utf-8'))
        img = Image.open(io.BytesIO(png_data)).convert("RGBA")
        return img
    except Exception as e:
        logger.error(f"CairoSVG failed to render shape: {e}")
        return _render_shape_node_fallback(node, dpi)


def _render_text_node_fallback(node: TextNode, dpi: int) -> Image.Image:
    """Fallback text rendering using pure Pillow."""
    from PIL import ImageDraw, ImageFont
    scale_factor = dpi / 72.0
    width = int(node.bounds.width * scale_factor) if node.bounds.width > 0 else int(1000 * scale_factor)
    height = int(node.bounds.height * scale_factor) if node.bounds.height > 0 else int(200 * scale_factor)
    
    img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    try:
        font = ImageFont.truetype(node.font_path, int(node.font_size * scale_factor))
    except Exception:
        font = ImageFont.load_default()
        
    draw.text((0, 0), node.text_content, font=font, fill=node.color)
    return img


def _render_shape_node_fallback(node: ShapeNode, dpi: int) -> Image.Image:
    """Fallback shape rendering using pure Pillow."""
    from PIL import ImageDraw
    scale_factor = dpi / 72.0
    width = int(node.bounds.width * scale_factor)
    height = int(node.bounds.height * scale_factor)
    
    img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    if node.shape_type == "rectangle":
        draw.rectangle([0, 0, width, height], fill=node.fill_color, outline=node.stroke_color, width=int(node.stroke_width * scale_factor))
    elif node.shape_type == "circle":
        draw.ellipse([0, 0, width, height], fill=node.fill_color, outline=node.stroke_color, width=int(node.stroke_width * scale_factor))
        
    return img
