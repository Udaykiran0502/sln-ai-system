"""
SLN Design Engine v3 — FastAPI Backend
REST API for order management, pipeline execution, and asset serving.
"""

from __future__ import annotations

import asyncio
import json
import logging
import re
import sys
from pathlib import Path
from typing import Optional

if __package__ in (None, ""):
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi import FastAPI, HTTPException, BackgroundTasks, UploadFile, File, Request, WebSocket, WebSocketDisconnect
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field, field_validator, model_validator

# ── Logging Setup ───────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
    ]
)
logger = logging.getLogger("backend.app")
PHONE_RE = re.compile(r"^[6-9]\d{9}$")
ALLOWED_BANNER_TYPES = {"political", "wedding", "business", "religious", "general"}
MAX_UPLOAD_BYTES = 10 * 1024 * 1024
ALLOWED_UPLOAD_TYPES = {"image/png", "image/jpeg"}

# ── Startup Validation ───────────────────────────────────────────

def validate_system_startup():
    """Verify that all core directories and assets exist before launching."""
    logger.info("Initializing system startup validation...")
    
    from config.settings import settings
    
    # 1. Verify paths
    required_dirs = [
        settings.font_dir,
        settings.template_dir,
        settings.output_dir,
        settings.preview_dir,
        settings.final_dir,
        settings.db_path.parent
    ]
    
    for d in required_dirs:
        d.mkdir(parents=True, exist_ok=True)
        logger.info(f"Directory verified: {d}")
        
    # 2. Check fonts
    fonts = list(settings.font_dir.glob("*.ttf"))
    if not fonts:
        logger.warning(f"No TTF fonts found in {settings.font_dir}! Telugu rendering may fail.")
    else:
        logger.info(f"Fonts loaded: {[f.name for f in fonts]}")
        
    # 3. Check template index
    index_path = settings.template_dir / "template_index.json"
    if not index_path.exists():
        logger.warning(f"Template index not found at {index_path}! Using rule-based fallback defaults.")
    else:
        logger.info("Template database verified.")
        
    logger.info("Startup validation complete. System is stable.")

validate_system_startup()

# ── FastAPI App Configuration ───────────────────────────────────

app = FastAPI(
    title="SLN Design Engine v3",
    description="AI-powered banner/flex/poster generation system for SLN Digitals",
    version="3.0.0",
)

# CORS for dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    detail = []
    for error in exc.errors():
        cleaned = dict(error)
        if "ctx" in cleaned:
            cleaned["ctx"] = {k: str(v) for k, v in cleaned["ctx"].items()}
        detail.append(cleaned)
    return JSONResponse(
        status_code=422,
        content={
            "ok": False,
            "message": "Please check the order details and try again.",
            "detail": detail,
        },
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "ok": False,
            "message": exc.detail if isinstance(exc.detail, str) else "Request could not be completed.",
            "detail": exc.detail,
        },
    )

# ── Request/Response Models ──────────────────────────────────────

class OrderRequest(BaseModel):
    order_id: Optional[str] = None
    client_name: str
    banner_type: str
    event_type: str = ""
    dimensions: dict
    dpi: int = 300
    language: str = "telugu"
    colors: dict = Field(default_factory=lambda: {"primary": "#FF9933", "accent": "#008000"})
    text_content: dict
    images: list = Field(default_factory=list)
    reference_url: Optional[str] = None
    phone_numbers: list[str]

    @field_validator("order_id")
    @classmethod
    def validate_order_id(cls, value):
        if not value:
            return value
        from backend.memory.state_store import sanitize_order_id
        return sanitize_order_id(value)

    @field_validator("client_name")
    @classmethod
    def validate_client_name(cls, value):
        value = str(value or "").strip()
        if len(value) < 2:
            raise ValueError("Customer name is required")
        return value

    @field_validator("banner_type")
    @classmethod
    def validate_banner_type(cls, value):
        value = str(value or "").strip().lower()
        if value not in ALLOWED_BANNER_TYPES:
            raise ValueError(f"Banner type must be one of: {', '.join(sorted(ALLOWED_BANNER_TYPES))}")
        return value

    @field_validator("dpi")
    @classmethod
    def validate_dpi(cls, value):
        if value not in (72, 150, 300):
            raise ValueError("DPI must be 72, 150, or 300")
        return value

    @model_validator(mode="after")
    def validate_business_payload(self):
        width = self.dimensions.get("width_inches")
        height = self.dimensions.get("height_inches")
        if not isinstance(width, (int, float)) or not isinstance(height, (int, float)):
            raise ValueError("Dimensions must include numeric width_inches and height_inches")
        if width < 6 or height < 6 or width > 240 or height > 120:
            raise ValueError("Dimensions must be between 6x6 and 240x120 inches")

        pixels = width * height * self.dpi * self.dpi
        if pixels > 120_000_000:
            raise ValueError("Design size is too large for this workstation. Reduce dimensions or DPI.")

        heading = str(self.text_content.get("heading", "")).strip()
        if len(heading) < 2:
            raise ValueError("Main heading is required")

        numbers = [re.sub(r"\D", "", str(p)) for p in self.phone_numbers if str(p).strip()]
        text_phone = re.sub(r"\D", "", str(self.text_content.get("phone", "")))
        if text_phone and text_phone not in numbers:
            numbers.append(text_phone)
        if not numbers:
            raise ValueError("A contact phone number is required")
        bad = [p for p in numbers if not PHONE_RE.fullmatch(p)]
        if bad:
            raise ValueError("Phone number must be a valid 10-digit Indian mobile number")
        self.phone_numbers = numbers
        self.text_content["phone"] = numbers[0]
        return self


class OrderStatus(BaseModel):
    order_id: str
    status: str
    qa_passed: Optional[bool] = None
    qa_scores: Optional[dict] = None
    export_paths: Optional[dict] = None
    error: Optional[str] = None
    client_name: Optional[str] = None
    banner_type: Optional[str] = None
    event_type: Optional[str] = None
    dimensions: Optional[dict] = None
    dpi: Optional[int] = None
    language: Optional[str] = None
    colors: Optional[dict] = None
    text_content: Optional[dict] = None
    phone_numbers: Optional[list[str]] = None
    images: Optional[list[str]] = None
    scene_graph: Optional[str] = None


class ApiMessage(BaseModel):
    ok: bool
    message: str
    detail: Optional[dict | list | str] = None


@app.middleware("http")
async def request_logging(request: Request, call_next):
    start = asyncio.get_running_loop().time()
    response = await call_next(request)
    elapsed_ms = (asyncio.get_running_loop().time() - start) * 1000
    logger.info("%s %s -> %s %.1fms", request.method, request.url.path, response.status_code, elapsed_ms)
    return response

# ── Background Pipeline Runner ───────────────────────────────────

def _run_pipeline_sync(order_data: dict, order_id: str):
    """Run pipeline synchronously (for background task)."""
    import sys
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

    from backend.workflows.design_pipeline import run_pipeline
    from backend.memory.state_store import save_state
    try:
        run_pipeline(order_data, order_id)
    except Exception as e:
        logger.error(f"Pipeline execution failed for {order_id}: {e}", exc_info=True)
        save_state(order_id, {"order_id": order_id, "status": "failed", "error": str(e)})

# ── Root & Utility Endpoints ─────────────────────────────────────

@app.get("/")
async def root():
    """Root endpoint to check service status and avoid 404 errors."""
    return {"message": "SLN Design Engine API Running"}


@app.get("/favicon.ico")
async def favicon():
    """Favicon endpoint to avoid standard web browser 404 errors."""
    return {}


@app.get("/api/health")
async def health_check():
    """System health check endpoint."""
    from config.settings import settings
    return {
        "status": "healthy",
        "service": "SLN Design Engine v3",
        "version": "3.0.0",
        "configuration": {
            "api_host": settings.api_host,
            "api_port": settings.api_port,
            "debug_mode": settings.debug
        }
    }

# ── Core API Endpoints ───────────────────────────────────────────

@app.post("/api/orders")
async def create_order(order: OrderRequest, background_tasks: BackgroundTasks):
    """Submit a new design order. Pipeline runs in background."""
    import time

    order_id = order.order_id or f"ORD-{int(time.time())}"
    order_data = order.model_dump()

    # Save order input
    from backend.memory.state_store import save_order_input, save_state, sanitize_order_id
    order_id = sanitize_order_id(order_id)
    order_data["order_id"] = order_id
    save_order_input(order_id, order_data)
    save_state(order_id, {"order_id": order_id, "status": "queued"})

    # Run pipeline in background
    background_tasks.add_task(_run_pipeline_sync, order_data, order_id)

    return {"order_id": order_id, "status": "queued", "message": "Pipeline started"}


@app.post("/api/uploads")
async def upload_asset(file: UploadFile = File(...), order_id: Optional[str] = None):
    """Persist and validate a customer image before attaching it to an order."""
    from PIL import Image
    from config.settings import settings
    from backend.memory.state_store import sanitize_order_id

    if file.content_type not in ALLOWED_UPLOAD_TYPES:
        raise HTTPException(
            status_code=415,
            detail="Please upload a JPG or PNG image.",
        )

    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="The uploaded image is empty.")
    if len(raw) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Image is too large. Please upload a file under 10 MB.")

    upload_order = sanitize_order_id(order_id or "pending")
    upload_dir = settings.orders_dir / upload_order / "uploads"
    upload_dir.mkdir(parents=True, exist_ok=True)

    suffix = ".jpg" if file.content_type == "image/jpeg" else ".png"
    safe_name = re.sub(r"[^A-Za-z0-9_.-]", "_", Path(file.filename or "upload").stem)[:50] or "upload"
    target = upload_dir / f"{safe_name}{suffix}"
    target.write_bytes(raw)

    try:
        with Image.open(target) as img:
            width, height = img.size
            if width < 300 or height < 300:
                target.unlink(missing_ok=True)
                raise HTTPException(
                    status_code=422,
                    detail="Your image is too small for print. Please upload an image at least 300x300 pixels.",
                )
    except HTTPException:
        raise
    except Exception:
        target.unlink(missing_ok=True)
        raise HTTPException(status_code=422, detail="We could not read this image. Please upload a valid JPG or PNG.")

    return {
        "ok": True,
        "path": str(target),
        "filename": target.name,
        "width": width,
        "height": height,
        "message": "Image uploaded and validated.",
    }


@app.get("/api/orders")
async def list_orders():
    """List all orders with status."""
    from backend.memory.state_store import list_orders
    orders = list_orders()
    return {"orders": orders, "total": len(orders)}


@app.get("/api/orders/{order_id}")
async def get_order(order_id: str):
    """Get full order status and state."""
    from backend.memory.state_store import load_state

    try:
        state = load_state(order_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if not state:
        raise HTTPException(status_code=404, detail=f"Order {order_id} not found")

    return OrderStatus(
        order_id=order_id,
        status=_determine_status(state),
        qa_passed=state.get("qa_passed"),
        qa_scores=state.get("qa_scores"),
        export_paths=state.get("export_paths"),
        error=state.get("error"),
        client_name=state.get("client_name"),
        banner_type=state.get("banner_type"),
        event_type=state.get("event_type", ""),
        dimensions=state.get("dimensions"),
        dpi=state.get("dpi"),
        language=state.get("language"),
        colors=state.get("colors"),
        text_content=state.get("text_content"),
        phone_numbers=state.get("phone_numbers"),
        images=state.get("images"),
        scene_graph=state.get("scene_graph"),
    )


@app.get("/api/orders/{order_id}/preview")
async def get_preview(order_id: str):
    """Serve preview JPEG/PNG for an order."""
    from config.settings import settings
    from backend.memory.state_store import sanitize_order_id

    try:
        order_id = sanitize_order_id(order_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    jpeg_path = settings.preview_dir / f"{order_id}.jpg"
    png_path = settings.preview_dir / f"{order_id}.png"

    if jpeg_path.exists():
        return FileResponse(str(jpeg_path), media_type="image/jpeg")
    elif png_path.exists():
        return FileResponse(str(png_path), media_type="image/png")

    raise HTTPException(status_code=404, detail="Preview not found")


@app.get("/api/orders/{order_id}/export")
async def get_export(order_id: str, format: str = "pdf"):
    """Download final export file."""
    from config.settings import settings
    from backend.memory.state_store import sanitize_order_id

    try:
        order_id = sanitize_order_id(order_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if format == "tiff":
        path = settings.final_dir / f"{order_id}.tiff"
        media_type = "image/tiff"
    elif format == "pdf":
        path = settings.final_dir / f"{order_id}.pdf"
        media_type = "application/pdf"
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported format: {format}")

    if not path.exists():
        raise HTTPException(status_code=404, detail=f"Export not found: {format}")

    return FileResponse(str(path), media_type=media_type, filename=path.name)


@app.post("/api/orders/{order_id}/regenerate")
async def regenerate_order(order_id: str, background_tasks: BackgroundTasks):
    """Re-run the pipeline for an existing order."""
    from backend.memory.state_store import load_order_input, save_state

    try:
        order_data = load_order_input(order_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if not order_data:
        raise HTTPException(status_code=404, detail=f"Order {order_id} not found")

    save_state(order_id, {"order_id": order_id, "status": "regenerating"})
    background_tasks.add_task(_run_pipeline_sync, order_data, order_id)

    return {"order_id": order_id, "status": "regenerating"}


@app.post("/api/orders/{order_id}/patch")
async def patch_order(order_id: str, request: Request):
    """Apply a scene graph or metadata patch to an order and run selective pipeline."""
    from backend.memory.state_store import sanitize_order_id
    try:
        order_id = sanitize_order_id(order_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    payload = await request.json()
    from backend.utils.selective_orchestrator import run_selective_pipeline
    try:
        state = await run_selective_pipeline(order_id, payload)
        return {"order_id": order_id, "status": state.get("status", "completed"), "qa_passed": state.get("qa_passed", False)}
    except Exception as e:
        logger.error(f"Failed to patch order {order_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


class TypographyMeasureRequest(BaseModel):
    text: str
    font_file: str
    font_size: int
    max_width: Optional[float] = None


@app.post("/api/typography/measure")
async def measure_typography(req: TypographyMeasureRequest):
    """Shape and measure text dimensions, with optional word wrapping, returning baseline metrics."""
    from config.settings import settings
    from backend.utils.telugu_shaper import measure_text
    from PIL import ImageFont

    font_path = settings.get_font_path(req.font_file)
    if not font_path.exists():
        # Fallback to default configured fonts if not found
        default_font = settings.telugu_heading_font if "Ramabhadra" in req.font_file or "NTR" in req.font_file else settings.english_heading_font
        font_path = settings.get_font_path(default_font)

    try:
        # Measure text with wrapping if max_width is provided
        if req.max_width and req.max_width > 0:
            words = req.text.split(" ")
            lines = []
            current_line = []
            
            for word in words:
                test_line = " ".join(current_line + [word]) if current_line else word
                w, h = measure_text(test_line, str(font_path), req.font_size)
                if w > req.max_width and current_line:
                    line_text = " ".join(current_line)
                    lw, lh = measure_text(line_text, str(font_path), req.font_size)
                    lines.append({"text": line_text, "width": lw, "height": lh})
                    current_line = [word]
                else:
                    current_line.append(word)
                    
            if current_line:
                line_text = " ".join(current_line)
                lw, lh = measure_text(line_text, str(font_path), req.font_size)
                lines.append({"text": line_text, "width": lw, "height": lh})
                
            total_width = max(line["width"] for line in lines) if lines else 0
            total_height = sum(line["height"] for line in lines)
            if len(lines) > 1:
                total_height += int(req.font_size * 0.2 * (len(lines) - 1))
        else:
            w, h = measure_text(req.text, str(font_path), req.font_size)
            total_width = w
            total_height = h
            lines = [{"text": req.text, "width": w, "height": h}]

        # Ascent and descent for shared baseline alignment
        ascent, descent = (req.font_size, 0)
        try:
            font = ImageFont.truetype(str(font_path), req.font_size)
            ascent, descent = font.getmetrics()
        except Exception:
            pass

        return {
            "width": total_width,
            "height": total_height,
            "ascent": ascent,
            "descent": descent,
            "lines": lines,
            "font_file": req.font_file,
            "font_size": req.font_size
        }
    except Exception as e:
        logger.error(f"Failed to measure typography: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/templates")
async def list_templates():
    """List all available templates."""
    from config.settings import settings

    index_path = settings.template_dir / "template_index.json"
    if not index_path.exists():
        return {"templates": [], "total": 0}

    with open(index_path, "r", encoding="utf-8") as f:
        templates = json.load(f)

    return {"templates": templates, "total": len(templates)}


@app.get("/api/exports")
async def list_exports():
    """List recorded print exports from SQLite database."""
    from config.settings import settings
    import sqlite3
    
    db_path = settings.db_path
    if not db_path.exists():
        return {"exports": [], "total": 0}
        
    try:
        # Connect to sqlite securely
        conn = sqlite3.connect(str(db_path), timeout=5)
        cursor = conn.cursor()
        
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='exports'")
        if not cursor.fetchone():
            conn.close()
            return {"exports": [], "total": 0}
            
        cursor.execute("SELECT * FROM exports ORDER BY created_at DESC LIMIT 50")
        columns = [desc[0] for desc in cursor.description]
        rows = cursor.fetchall()
        conn.close()
        
        exports_data = []
        for row in rows:
            record = dict(zip(columns, row))
            # Enrich records with real-time file availability & sizes
            for fmt in ("pdf", "tiff"):
                path_key = f"{fmt}_path"
                size_key = f"{fmt}_size"
                filepath = record.get(path_key)
                if filepath and Path(filepath).exists():
                    s = Path(filepath).stat().st_size / (1024 * 1024)
                    record[size_key] = f"{s:.1f} MB"
                else:
                    record[size_key] = None
            exports_data.append(record)
            
        return {"exports": exports_data, "total": len(exports_data)}
    except Exception as e:
        logger.error(f"Failed to query exports table: {e}", exc_info=True)
        return {"exports": [], "total": 0, "error": str(e)}


@app.post("/api/admin/purge")
async def admin_purge():
    """Purge rendering layer cache."""
    from backend.utils.cache_manager import clear_cache
    try:
        clear_cache()
        return {"ok": True, "message": "Render layer cache purged successfully."}
    except Exception as e:
        logger.error(f"Failed to clear cache: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/qa/{order_id}")
async def get_qa_scores(order_id: str):
    """Get QA scores for an order."""
    from backend.memory.state_store import load_state

    try:
        state = load_state(order_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if not state:
        raise HTTPException(status_code=404, detail=f"Order {order_id} not found")

    qa_scores = state.get("qa_scores")
    if not qa_scores:
        raise HTTPException(status_code=404, detail="QA scores not available yet")

    return {
        "order_id": order_id,
        "qa_scores": qa_scores,
        "qa_passed": state.get("qa_passed", False),
    }

# ── Helpers ──────────────────────────────────────────────────────

def _determine_status(state: dict) -> str:
    if state.get("error"):
        return "failed"
    if state.get("export_paths"):
        return "completed"
    if state.get("needs_human_review"):
        return "needs_review"
    if state.get("qa_passed") is False:
        return "qa_failed"
    if state.get("composite_path"):
        return "composited"
    if state.get("parsed_order"):
        return "processing"
    return state.get("status", "queued")

# ── WebSocket Support ───────────────────────────────────────────

class _ConnectionManager:
    """Manages per-order WebSocket connections for live pipeline streaming."""

    def __init__(self):
        self._connections: dict[str, list[WebSocket]] = {}

    async def connect(self, order_id: str, websocket: WebSocket):
        await websocket.accept()
        self._connections.setdefault(order_id, []).append(websocket)
        logger.info(f"[WS] Client connected for order {order_id}")

    def disconnect(self, order_id: str, websocket: WebSocket):
        conns = self._connections.get(order_id, [])
        if websocket in conns:
            conns.remove(websocket)
        logger.info(f"[WS] Client disconnected for order {order_id}")

    async def broadcast(self, order_id: str, data: dict):
        """Broadcast a JSON event to all clients watching this order."""
        import asyncio
        dead = []
        for ws in self._connections.get(order_id, []):
            try:
                await ws.send_json(data)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(order_id, ws)


ws_manager = _ConnectionManager()


@app.websocket("/api/ws/orders/{order_id}")
async def websocket_order(websocket: WebSocket, order_id: str):
    """WebSocket endpoint for live pipeline progress streaming.

    The frontend connects here and receives JSON events:
      - {"type": "agent_start",  "node": "layout_engine", "progress": 45}
      - {"type": "agent_end",    "node": "composition",   "progress": 60}
      - {"type": "qa_update",    "scores": {...}, "passed": false}
      - {"type": "pipeline_complete"}
      - {"type": "pipeline_failed", "error": "..."}
    """
    try:
        order_id = __import__('backend.memory.state_store', fromlist=['sanitize_order_id']).sanitize_order_id(order_id)
    except Exception:
        await websocket.close(code=1008)
        return

    await ws_manager.connect(order_id, websocket)

    # Start concurrent system telemetry streaming
    async def telemetry_loop():
        from backend.utils.telemetry import get_system_telemetry
        try:
            while True:
                cpu, mem = get_system_telemetry()
                await websocket.send_json({
                    "cpu_pct": cpu,
                    "memory_mb": mem,
                    "duration_ms": random.randint(12, 38)  # simulated WebSocket RTT latency
                })
                await asyncio.sleep(3.0)
        except Exception:
            pass

    import random
    telemetry_task = asyncio.create_task(telemetry_loop())

    try:
        while True:
            # Keep alive — receive any message with 30s timeout to detect dead clients
            text = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
            if text == "ping":
                await websocket.send_json({"type": "pong"})
            # Future: parse JSON patch payloads from the editor and re-trigger composition
    except asyncio.TimeoutError:
        logger.warning(f"[WS] Connection for {order_id} timed out. Closing.")
    except WebSocketDisconnect:
        logger.info(f"[WS] Connection for {order_id} disconnected normally.")
    except Exception as e:
        logger.error(f"[WS] Connection error for {order_id}: {e}")
    finally:
        telemetry_task.cancel()
        ws_manager.disconnect(order_id, websocket)
        try:
            # Ensure websocket is closed
            await websocket.close()
        except Exception:
            pass


# ── Run Entry Point ──────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    from config.settings import settings

    uvicorn.run(
        "backend.app:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.debug,
    )
