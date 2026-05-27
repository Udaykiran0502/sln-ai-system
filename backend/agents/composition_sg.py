import logging
from PIL import Image
from typing import List
from backend.utils.scene_graph import SceneGraph, RootNode, SceneNode, TextNode, ImageNode, ShapeNode, GroupNode
from backend.utils.cairo_renderer import render_text_node_to_image, render_shape_node_to_image
from backend.utils.patch_merger import Patch
from backend.utils.cache_manager import calculate_node_hash, get_cached_layer, set_cached_layer
from config.settings import settings

logger = logging.getLogger(__name__)

def agent_fn(state: dict) -> List[Patch]:
    """
    Scene Graph Composition Agent.
    Takes the scene_graph from state and renders it in z-order.
    DPI depends on state context: 72 DPI for preview, 300 DPI for export.
    Returns patches with the rendered image path.
    """
    sg_data = state.get("scene_graph")
    if not sg_data:
        logger.warning("No scene_graph found in state. Skipping composition.")
        return []
        
    sg = SceneGraph.from_json(sg_data)
    
    # Determine DPI based on export/print-ready intent
    # If is_print_ready is true and we are in export mode, use 300, else 72
    is_print_ready = state.get("qa_passed", False) and state.get("is_print_ready", False)
    
    # Determine DPI based on export/print-ready intent
    is_print_ready = state.get("qa_passed", False) and state.get("is_print_ready", False)
    
    dpi = settings.default_dpi if is_print_ready else settings.preview_dpi
    
    # Canvas size from parsed order dimensions
    parsed = state.get("parsed_order", {})
    dims = parsed.get("dimensions", {"width_inches": 48, "height_inches": 24})
    width_inches = float(dims.get("width_inches", 48.0))
    height_inches = float(dims.get("height_inches", 24.0))
    
    canvas_w = int(width_inches * dpi)
    canvas_h = int(height_inches * dpi)
    
    # But limit to max_image_px during preview to stay lightweight and fast
    if not is_print_ready and max(canvas_w, canvas_h) > settings.max_image_px:
        ratio = settings.max_image_px / max(canvas_w, canvas_h)
        canvas_w = int(canvas_w * ratio)
        canvas_h = int(canvas_h * ratio)
        
    canvas = Image.new("RGBA", (canvas_w, canvas_h), (255, 255, 255, 255))
    
    # Collect all nodes
    nodes = []
    def _collect(n: SceneNode):
        if n.visible:
            nodes.append(n)
            for c in n.children:
                _collect(c)
    
    _collect(sg.root)
    
    # Sort by z-index
    nodes.sort(key=lambda x: x.z_index)
    
    for node in nodes:
        if isinstance(node, RootNode) or isinstance(node, GroupNode):
            continue
            
        try:
            # Convert canonical coordinates to absolute pixel bounds
            w_px = int(node.bounds.width * canvas_w)
            h_px = int(node.bounds.height * canvas_h)
            
            if w_px <= 0 or h_px <= 0:
                continue
                
            node_img = None
            node_hash = ""
            
            # BYPASS cache for massive 300 DPI layers to prevent OOM
            if not is_print_ready:
                node_hash = calculate_node_hash(node, w_px, h_px)
                node_img = get_cached_layer(node_hash)
            
            if node_img is None:
                # Render node on cache miss or bypass
                if isinstance(node, ImageNode):
                    if node.image_path:
                        # Use LANCZOS for previews, NEAREST for giant print layers to prevent memory spikes
                        resample_filter = Image.Resampling.LANCZOS if not is_print_ready else Image.Resampling.BICUBIC
                        with Image.open(node.image_path) as src_img:
                            src_rgba = src_img.convert("RGBA")
                            node_img = src_rgba.resize((w_px, h_px), resample_filter)
                            del src_rgba
                elif isinstance(node, TextNode):
                    # Calculate scale factor for font size
                    font_scale = canvas_w / (width_inches * 72.0)
                    temp_font_size = max(4, int(node.font_size * font_scale))
                    
                    from backend.utils.scene_graph import TextNode as TempTextNode
                    from backend.utils.scene_graph import Bounds as TempBounds
                    
                    # Bounding box is physical pixels, render at 72 DPI scale factor 1.0
                    temp_node = TempTextNode(
                        name=node.name,
                        text_content=node.text_content,
                        font_path=node.font_path,
                        font_size=temp_font_size,
                        color=node.color,
                        bounds=TempBounds(x=0, y=0, width=w_px, height=h_px),
                        z_index=node.z_index
                    )
                    node_img = render_text_node_to_image(temp_node, 72)
                elif isinstance(node, ShapeNode):
                    font_scale = canvas_w / (width_inches * 72.0)
                    from backend.utils.scene_graph import ShapeNode as TempShapeNode
                    from backend.utils.scene_graph import Bounds as TempBounds
                    
                    temp_node = TempShapeNode(
                        name=node.name,
                        shape_type=node.shape_type,
                        fill_color=node.fill_color,
                        stroke_color=node.stroke_color,
                        stroke_width=node.stroke_width * font_scale,
                        bounds=TempBounds(x=0, y=0, width=w_px, height=h_px),
                        z_index=node.z_index
                    )
                    node_img = render_shape_node_to_image(temp_node, 72)
                
                # Save to cache ONLY if not massive print layer
                if node_img and not is_print_ready:
                    set_cached_layer(node_hash, node_img)
                
            if node_img:
                x_px = int(node.transform.x * canvas_w)
                y_px = int(node.transform.y * canvas_h)
                
                # Apply rotation if any
                if node.transform.rotation != 0:
                    rotated = node_img.rotate(-node.transform.rotation, expand=True)
                    canvas.alpha_composite(rotated, (x_px, y_px))
                    del rotated
                else:
                    canvas.alpha_composite(node_img, (x_px, y_px))
                    
                # Explicit chunked layer GC to prevent OOM
                del node_img
                import gc
                gc.collect()
                
        except Exception as e:
            logger.error(f"Failed to composite node {node.name}: {e}", exc_info=True)
            
    # Save the composite
    order_id = state.get("order_id", "unknown")
    
    if is_print_ready:
        path = str(settings.final_dir / f"{order_id}_composite.png")
    else:
        path = str(settings.preview_dir / f"{order_id}.jpg")
        canvas = canvas.convert("RGB")
        canvas.save(path, "JPEG", quality=settings.jpeg_quality)
        return [Patch(target_path="composite_path", operation="set", value=path)]
        
    canvas.save(path)
    return [Patch(target_path="composite_path", operation="set", value=path)]
