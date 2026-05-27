## Context

SLN Digitals is a print/design shop in Andhra Pradesh that produces Telugu and English banners, flex signs, and posters for political campaigns, weddings, religious events, and local businesses. The current production is fully manual — a human designer receives an order via WhatsApp, creates the design in Photoshop, and exports for print. Turnaround is 2-4 hours per banner.

The existing codebase (v3 scaffold) has:
- 13 agent Python files in `backend/agents/` — all contain well-structured function signatures but return placeholder/minimal data
- A LangGraph `StateGraph` in `backend/workflows/design_pipeline.py` — correctly wired with 13 nodes and conditional QA→auto-fix loop
- A FastAPI backend in `backend/app.py` — 10 endpoints with Pydantic validation, background task execution
- A Streamlit dashboard shell in `frontend/dashboard.py` — page router with 6 views (home, create, workspace, templates, qa, exports)
- Utility modules: `bbox.py` (bounding box math with dataclasses), `color_utils.py` (hex/RGB/CMYK), `telugu_shaper.py` (uharfbuzz integration)
- Configuration via `pydantic-settings` in `config/settings.py` with `.env` support
- File-based state store in `backend/memory/state_store.py`

The system runs on a local Windows i7 workstation with 16GB RAM. Memory efficiency is critical — no cloud GPU, no Docker.

**Constraint:** Google Gemini (free tier via `gemini-2.0-flash`) is the primary LLM. Anthropic/OpenAI keys are optional secondary providers.

## Goals / Non-Goals

**Goals:**
- Make every agent produce real, functional output — not stubs
- Enable end-to-end order processing: JSON input → print-ready TIFF/PDF output
- Render Telugu text correctly with proper ligatures and conjuncts via HarfBuzz shaping
- Produce CMYK 300 DPI output suitable for commercial flex printing
- QA engine catches real defects (clipping, contrast, alignment)
- Auto-fix resolves common QA failures without human intervention
- Dashboard shows real order status, previews, QA scores, and export downloads
- System processes a standard 48×24 inch banner in under 60 seconds (excluding LLM latency)

**Non-Goals:**
- Cloud deployment — this runs locally only
- Real-time collaborative editing
- PSD file parsing/import (templates are PNG backgrounds + JSON metadata)
- Multi-language beyond Telugu and English
- Customer-facing web portal (admin-only dashboard)
- Training custom AI models — we use off-the-shelf LLM APIs

## Decisions

### Decision 1: Gemini Flash as sole LLM for MVP

**Choice:** Use `gemini-2.0-flash` for all LLM-dependent agents (parser, research, style analyzer, copywriter).

**Alternatives considered:**
- Claude for copywriting + Gemini for classification + GPT Vision for QA → too many API keys, higher cost, more failure modes
- Local LLM (Ollama) → insufficient quality for Telugu text generation on 16GB RAM

**Rationale:** Single API key simplifies operations. Gemini Flash is free-tier, fast, and handles Telugu. We can add Claude/GPT as optional overrides later via `config/settings.py` without architectural changes.

### Decision 2: Pillow with libraqm for Telugu rendering (not manual uharfbuzz glyph placement)

**Choice:** Use `PIL.ImageDraw.text()` with `libraqm` enabled for complex script rendering. Keep `uharfbuzz` as a validation/shaping-check tool, not the primary renderer.

**Alternatives considered:**
- Manual uharfbuzz → freetype-py glyph-by-glyph placement → fragile, complex, buggy for conjuncts
- Cairo/Pango → excellent rendering but heavy C dependency, difficult Windows install

**Rationale:** libraqm integrates HarfBuzz+FriBidi+FreeType and Pillow detects it automatically. On Windows, the `Pillow` wheel ships with raqm support since Pillow 9.x. This gives correct Telugu rendering with zero custom glyph code. The existing `telugu_shaper.py` validates shaping quality separately.

### Decision 3: PNG templates (not PSD parsing)

**Choice:** Templates are PNG/JPEG background images + JSON metadata defining layout regions, colors, and font pairings.

**Alternatives considered:**
- PSD parsing via `psd-tools` → complex layer handling, unreliable for production
- SVG templates → no print-quality raster output

**Rationale:** The print shop already exports background images from their PSDs. JSON metadata is easy to create, version, and score. No binary format parsing risk.

### Decision 4: File-based state with SQLite index

**Choice:** Each order gets a directory `data/orders/{order_id}/` containing `input.json`, `state.json`, and `log.jsonl`. SQLite stores the order index for list/search.

**Alternatives considered:**
- PostgreSQL → overkill for single-machine local system
- Pure SQLite for all state → large JSON blobs in SQLite are slow to query
- Redis → additional service dependency

**Rationale:** File-based state is debuggable (open JSON in VS Code), recoverable (copy folder = backup), and memory-efficient. SQLite index gives fast listing without loading full state.

### Decision 5: Deterministic layout patterns (not AI-generated coordinates)

**Choice:** 4 predefined layout patterns (`hero_left_text_right`, `centered_stack`, `split`, `grid`) with percentage-based regions → converted to absolute pixel coordinates via `bbox.py`. Template or style metadata selects the pattern.

**Alternatives considered:**
- AI-generated layouts via LLM → non-deterministic, inconsistent, slow
- CSS-like flexbox engine → over-engineered for 4-6 element banner layouts

**Rationale:** Print banners have well-understood visual hierarchies. 4 patterns cover 95% of real orders. Same input always produces same output. Pattern can be extended later.

## Risks / Trade-offs

- **[Risk] libraqm not available on Windows Pillow build** → Mitigation: verify at startup in `verify_env.py`; if missing, fall back to basic PIL text rendering with a QA warning flag. Add install instructions to README.
- **[Risk] Gemini free-tier rate limits** → Mitigation: agents that fail LLM calls return sensible defaults (e.g., copywriter returns the raw input text as-is). Pipeline continues with degraded but functional output.
- **[Risk] rembg model download on first run (~170MB)** → Mitigation: document in setup instructions. Cache model in `.u2net/` directory. Skip background removal if model unavailable.
- **[Risk] Large canvas memory (48×24" at 300 DPI = 14400×7200px = ~400MB)** → Mitigation: composition works at `max_image_px=4000` during processing, upscales only at final export. Preview generated at 72 DPI.
- **[Risk] Telugu font files missing** → Mitigation: font_intelligence agent validates font existence and falls back to Windows system Telugu fonts (`Gautami` ships with Windows). Startup validation warns if custom fonts missing.
