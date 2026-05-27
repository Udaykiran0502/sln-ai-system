## Why

SLN Digitals needs a fully operational AI-powered design automation platform that can take a customer order and produce a print-ready 300 DPI Telugu/English banner with minimal human intervention. The current codebase has a solid foundation (13 agent stubs, LangGraph pipeline, FastAPI backend, Streamlit dashboard shell) but every agent contains placeholder/stub logic — no agent actually performs real work end-to-end. The system cannot process a single order from input to export today. We need to take this from scaffolding to a working commercial production system.

## What Changes

- **Wire real LLM calls** into agents that need AI reasoning (input_parser, research, style_analyzer, copywriter) using Google Gemini as the primary provider
- **Complete deterministic rendering pipeline** — make layout_engine, composition, and export_agent produce actual pixel-perfect output files
- **Implement working QA engine** with all 8 automated checks returning real scores, not stubs
- **Build functional auto-fix loop** that receives QA failures and applies rule-based corrections
- **Enable Telugu text rendering** end-to-end via uharfbuzz/libraqm through the composition pipeline
- **Implement CMYK export** with 300 DPI TIFF and PDF output via Pillow and reportlab
- **Complete the Streamlit dashboard** — all 6 views (home, create, workspace, templates, QA, exports) with real data from the API
- **Add template intelligence** — expand template_index.json with 10+ production templates and category-aware scoring
- **Implement state persistence** — SQLite-backed order tracking with JSON file state for pipeline recovery
- **Add end-to-end test** — a single pytest that submits a sample order and verifies a TIFF is produced

## Capabilities

### New Capabilities
- `llm-agent-integration`: Wiring real Gemini/Claude LLM calls into parser, research, style, and copywriter agents with structured JSON output parsing and fallback logic
- `telugu-rendering-pipeline`: End-to-end Telugu text shaping via uharfbuzz → glyph positioning → PIL composition with ligature-safe rendering and font fallback
- `print-export-pipeline`: RGB→CMYK conversion, 300 DPI TIFF with LZW compression, PDF generation via reportlab, preview JPEG at 72 DPI
- `qa-scoring-system`: 8 automated QA checks (Telugu validation, clipping, readability, alignment, contrast, image quality, safe zone, DPI) with composite scoring and pass/fail routing
- `auto-fix-loop`: Rule-based corrections mapped to QA failure codes (contrast fix, reposition, font resize, grid snap) with max 2 iterations before human review
- `composition-engine`: Layer-ordered image compositing (background → textures → images → text → logos) using PIL alpha compositing with Telugu text rendered via the shaping pipeline
- `dashboard-ui`: Complete Streamlit admin dashboard with order queue, create form, workspace preview, template browser, QA scores radar chart, and export history
- `template-library`: Expanded template index with 10+ production templates, category/style/color scoring, and layout pattern selection
- `order-state-management`: File-based JSON state persistence per order with SQLite index, pipeline recovery, and run logging

### Modified Capabilities
_(none — no existing specs to modify)_

## Impact

- **All 13 agent files** in `backend/agents/` will be rewritten with real implementation logic
- **`backend/workflows/design_pipeline.py`** — no structural changes, but agents it calls will now do real work
- **`backend/app.py`** — minor additions (upload validation, error handling refinements)
- **`frontend/`** — all view files rewritten with functional UI components
- **`config/settings.py`** — add any missing config keys for LLM providers
- **`requirements.txt`** — may add `langchain-anthropic`, `langchain-openai` if Claude/GPT integration is needed
- **`backend/templates/template_index.json`** — expanded from 1 to 10+ templates
- **`assets/fonts/`** — requires Ramabhadra, Gautami, NTR, Oswald, Roboto TTF files to be present
- **`data/db/sln.db`** — SQLite database will be created on first run
- **Dependencies:** PIL, uharfbuzz, freetype-py, rembg, reportlab, LangGraph, Gemini SDK must all be installed
