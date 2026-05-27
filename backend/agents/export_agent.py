"""
SLN Design Engine v3 — Export Agent
Converts RGB → CMYK, generates TIFF/PDF/JPEG outputs.
"""

from __future__ import annotations

import json
import logging
import sqlite3
import time
from datetime import datetime
from pathlib import Path

logger = logging.getLogger(__name__)


def export_agent(state: dict) -> dict:
    """Export the final design in multiple formats.

    State keys read:
        - composite_path: str
        - layout_plan: dict
        - parsed_order: dict
        - order_id: str

    State keys written:
        - export_paths: dict (via patch)
    """
    from backend.utils.patch_merger import Patch
    composite_path = state.get("composite_path", "")
    layout = state.get("layout_plan", {})
    parsed = state.get("parsed_order", {})
    order_id = state.get("order_id", "")

    logger.info(f"[Export] Exporting design for {order_id}")

    from config.settings import settings
    from PIL import Image

    if not composite_path or not Path(composite_path).exists():
        logger.error("[Export] No composite image to export")
        return [Patch(target_path="error", operation="set", value="No composite image found")]

    if not state.get("is_print_ready", False):
        logger.error("[Export] Design is not marked print-ready (is_print_ready=False)")
        return [Patch(target_path="error", operation="set", value="Design must pass QA and be print-ready before export")]

    img = Image.open(composite_path)
    dpi = layout.get("dpi", settings.default_dpi)

    export_paths = {}
    export_errors = []

    # 1. High-res TIFF (CMYK, 300 DPI)
    try:
        tiff_path = _export_tiff(img, order_id, dpi, settings)
        export_paths["tiff"] = tiff_path
        logger.info(f"[Export] TIFF saved: {tiff_path}")
    except Exception as e:
        logger.error(f"[Export] TIFF export failed: {e}")
        export_errors.append(f"TIFF export failed: {e}")

    # 2. PDF
    try:
        pdf_path = _export_pdf(img, order_id, dpi, settings)
        export_paths["pdf"] = pdf_path
        logger.info(f"[Export] PDF saved: {pdf_path}")
    except Exception as e:
        logger.error(f"[Export] PDF export failed: {e}")
        export_errors.append(f"PDF export failed: {e}")

    # 3. JPEG preview (72 DPI)
    try:
        jpeg_path = _export_preview(img, order_id, settings)
        export_paths["preview"] = jpeg_path
        logger.info(f"[Export] Preview saved: {jpeg_path}")
    except Exception as e:
        logger.error(f"[Export] Preview export failed: {e}")
        export_errors.append(f"Preview export failed: {e}")

    # 4. Record in database
    try:
        _record_export(order_id, export_paths, parsed, settings)
    except Exception as e:
        logger.warning(f"[Export] DB recording failed: {e}")
        export_errors.append(f"Export files were created, but export history could not be saved: {e}")

    patches = [
        Patch(target_path="export_paths", operation="set", value=export_paths)
    ]
    if export_errors:
        patches.append(Patch(target_path="export_warnings", operation="set", value=export_errors))
        if not export_paths:
            patches.append(Patch(target_path="error", operation="set", value="; ".join(export_errors)))
        else:
            patches.append(Patch(target_path="partial_success", operation="set", value=True))
            
    return patches


def _export_tiff(img, order_id: str, dpi: int, settings) -> str:
    """Export as CMYK TIFF at production DPI."""
    from backend.utils.color_utils import ensure_cmyk

    final_dir = settings.final_dir
    final_dir.mkdir(parents=True, exist_ok=True)

    # Convert to CMYK
    cmyk_img = ensure_cmyk(img)

    tiff_path = str(final_dir / f"{order_id}.tiff")
    cmyk_img.save(
        tiff_path,
        format="TIFF",
        dpi=(dpi, dpi),
        compression="tiff_lzw",
    )
    return tiff_path


def _export_pdf(img, order_id: str, dpi: int, settings) -> str:
    """Export as PDF using Pillow."""
    final_dir = settings.final_dir
    final_dir.mkdir(parents=True, exist_ok=True)

    pdf_path = str(final_dir / f"{order_id}.pdf")

    # Convert to RGB for PDF
    rgb_img = img.convert("RGB") if img.mode != "RGB" else img

    rgb_img.save(
        pdf_path,
        format="PDF",
        resolution=dpi,
    )
    return pdf_path


def _export_preview(img, order_id: str, settings) -> str:
    """Generate low-res JPEG preview."""
    preview_dir = settings.preview_dir
    preview_dir.mkdir(parents=True, exist_ok=True)

    # Scale down to preview DPI
    scale = settings.preview_dpi / settings.default_dpi
    new_size = (int(img.size[0] * scale), int(img.size[1] * scale))

    from PIL import Image as PILImage
    preview = img.resize(new_size, PILImage.LANCZOS)

    # Convert to RGB (no alpha in JPEG)
    if preview.mode != "RGB":
        preview = preview.convert("RGB")

    jpeg_path = str(preview_dir / f"{order_id}.jpg")
    preview.save(jpeg_path, "JPEG", quality=settings.jpeg_quality)
    return jpeg_path


def _record_export(order_id: str, paths: dict, parsed: dict, settings):
    """Record export metadata in SQLite database."""
    db_path = settings.db_path
    db_path.parent.mkdir(parents=True, exist_ok=True)

    conn = None
    for attempt in range(3):
        try:
            conn = sqlite3.connect(str(db_path), timeout=10)
            cursor = conn.cursor()
            break
        except sqlite3.Error:
            if attempt == 2:
                raise
            time.sleep(0.2 * (attempt + 1))

    # Create table if not exists
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS exports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id TEXT NOT NULL,
            client_name TEXT,
            banner_type TEXT,
            tiff_path TEXT,
            pdf_path TEXT,
            preview_path TEXT,
            created_at TEXT NOT NULL,
            metadata TEXT
        )
    """)

    cursor.execute("""
        INSERT INTO exports (order_id, client_name, banner_type, tiff_path, pdf_path, preview_path, created_at, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        order_id,
        parsed.get("client_name", ""),
        parsed.get("banner_type", ""),
        paths.get("tiff", ""),
        paths.get("pdf", ""),
        paths.get("preview", ""),
        datetime.now().isoformat(),
        json.dumps({"dpi": parsed.get("dpi", 300)}),
    ))

    conn.commit()
    conn.close()
