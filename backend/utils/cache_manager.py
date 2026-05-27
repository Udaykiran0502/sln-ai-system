"""
SLN Design Engine v3 — Layer Rendering Cache Manager
Provides caching for rendered scene-graph nodes to optimize CPU/RAM.
"""

from __future__ import annotations
import hashlib
import json
import logging
from pathlib import Path
from PIL import Image
from typing import Optional, Any
from config.settings import settings

logger = logging.getLogger(__name__)

# Ensure cache directory exists
CACHE_DIR = settings.output_dir / ".layer_cache"
CACHE_DIR.mkdir(parents=True, exist_ok=True)

def calculate_node_hash(node: Any, width_px: int, height_px: int) -> str:
    """Calculate MD5 hash of a node's visual properties."""
    props = {
        "type": node.type,
        "width_px": width_px,
        "height_px": height_px
    }
    
    # Extract type-specific styling properties
    if node.type == 'TextNode':
        props.update({
            "text_content": getattr(node, "text_content", ""),
            "font_path": getattr(node, "font_path", ""),
            "font_size": getattr(node, "font_size", 0),
            "color": getattr(node, "color", "")
        })
    elif node.type == 'ShapeNode':
        props.update({
            "shape_type": getattr(node, "shape_type", ""),
            "fill_color": getattr(node, "fill_color", ""),
            "stroke_color": getattr(node, "stroke_color", ""),
            "stroke_width": getattr(node, "stroke_width", 0.0)
        })
    elif node.type == 'ImageNode':
        props.update({
            "image_path": getattr(node, "image_path", ""),
            "crop_rect": getattr(node, "crop_rect", None),
            "opacity": getattr(node, "opacity", 1.0)
        })
        
    # Serialize to deterministic JSON and hash
    serialized = json.dumps(props, sort_keys=True)
    return hashlib.md5(serialized.encode("utf-8")).hexdigest()

def get_cached_layer(node_hash: str) -> Optional[Image.Image]:
    """Retrieve rendered image from disk cache if exists, updating access time."""
    cache_path = CACHE_DIR / f"{node_hash}.png"
    if cache_path.exists():
        try:
            # Update access time for LRU
            import time
            cache_path.touch(exist_ok=True)
            # Open and load fully to decouple from file handle
            with Image.open(cache_path) as img:
                loaded_img = img.copy()
                logger.debug(f"[Cache] Hit for layer hash {node_hash}")
                return loaded_img
        except Exception as e:
            logger.warning(f"[Cache] Failed reading cached file {cache_path}: {e}")
            cache_path.unlink(missing_ok=True)
    return None

def set_cached_layer(node_hash: str, img: Image.Image) -> None:
    """Write rendered layer image to disk cache, and trigger eviction if needed."""
    cache_path = CACHE_DIR / f"{node_hash}.png"
    try:
        img.save(cache_path, "PNG")
        logger.debug(f"[Cache] Saved layer hash {node_hash}")
        _enforce_lru_cache_size()
        prune_outputs_if_exceeded()
    except Exception as e:
        logger.error(f"[Cache] Failed writing cached file {cache_path}: {e}")

def _enforce_lru_cache_size(max_bytes: int = 2 * 1024 * 1024 * 1024) -> None:
    """Enforce max cache size (default 2GB) using LRU eviction based on access time."""
    try:
        files = list(CACHE_DIR.glob("*.png"))
        if not files:
            return
            
        # Get sizes and access times
        file_stats = [(f, f.stat().st_size, f.stat().st_mtime) for f in files if f.exists()]
        total_size = sum(stat[1] for stat in file_stats)
        
        if total_size <= max_bytes:
            return
            
        # Sort by access time ascending (oldest first)
        file_stats.sort(key=lambda x: x[2])
        
        logger.info(f"[Cache] Evicting layers. Current size: {total_size/(1024*1024):.1f}MB")
        
        for f, size, _ in file_stats:
            try:
                f.unlink(missing_ok=True)
                total_size -= size
                if total_size <= max_bytes * 0.8: # Evict until 80% to prevent thrashing
                    break
            except Exception as e:
                logger.warning(f"[Cache] Failed to evict {f}: {e}")
    except Exception as e:
        logger.error(f"[Cache] LRU eviction failed: {e}")

def prune_outputs_if_exceeded(max_bytes: int = 5 * 1024 * 1024 * 1024) -> None:
    """Enforce max storage limit on output previews and final exports (default 5GB) using LRU eviction."""
    try:
        preview_files = list(settings.preview_dir.glob("*.*"))
        final_files = list(settings.final_dir.glob("*.*"))
        all_files = [f for f in (preview_files + final_files) if f.exists() and f.is_file()]
        
        if not all_files:
            return
            
        file_stats = [(f, f.stat().st_size, f.stat().st_mtime) for f in all_files]
        total_size = sum(stat[1] for stat in file_stats)
        
        if total_size <= max_bytes:
            return
            
        # Sort by mtime ascending (oldest first)
        file_stats.sort(key=lambda x: x[2])
        
        logger.info(f"[Cache] Pruning output files. Current size: {total_size/(1024*1024):.1f}MB")
        
        for f, size, _ in file_stats:
            try:
                f.unlink(missing_ok=True)
                total_size -= size
                if total_size <= max_bytes * 0.8: # Evict until 80% (4GB)
                    break
            except Exception as e:
                logger.warning(f"[Cache] Failed to delete output file {f}: {e}")
    except Exception as e:
        logger.error(f"[Cache] Output pruning failed: {e}")

def clear_cache() -> None:
    """Clear all entries in the layer cache and prune outputs."""
    for f in CACHE_DIR.glob("*.png"):
        f.unlink(missing_ok=True)
    logger.info("[Cache] Layer rendering cache cleared.")
    try:
        # Also clean up preview and final directories on manual purge
        for f in settings.preview_dir.glob("*.*"):
            f.unlink(missing_ok=True)
        for f in settings.final_dir.glob("*.*"):
            f.unlink(missing_ok=True)
        logger.info("[Cache] Previews and export folders cleared on request.")
    except Exception as e:
        logger.warning(f"[Cache] Failed to purge output folders: {e}")
