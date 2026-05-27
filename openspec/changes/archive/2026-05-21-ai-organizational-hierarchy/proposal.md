## Why

The current SLN Design Engine v3 operates as a flat linear pipeline — 13 agents chained in sequence, flat PIL image composition, no layer editability, no governance, and no design memory. This makes it impossible to do partial re-renders (changing one text field re-runs the entire pipeline), there is no organizational control over agent behavior (any agent can crash the whole run), and the system cannot learn from past approved designs. To scale from a prototype to a production creative studio, the system needs structured organizational layers, a scene graph architecture that replaces flat image composition, a governance controller, RAG-based design memory, and non-destructive editing workflows.

## What Changes

- **BREAKING** — Replace flat PIL image composition with a scene-graph-based rendering model where each design is an editable object tree, not a flat raster
- Introduce Paperclip AI governance layer that controls workflow approvals, retry budgets, agent permissions, and audit logging
- Add scene graph architecture — every design element becomes a node in a structured tree (layers, groups, text nodes, image nodes) that is the master source of truth
- Add RAG + design memory system using ChromaDB for template retrieval, style memory, and approved design DNA extraction via CLIP embeddings
- Add IndicTrans2 language agent for Telugu↔English translation and Unicode-safe text processing
- Introduce lightweight preview system — 72 DPI previews during QA loops, 300 DPI only after `is_print_ready == True`
- Add editable design workflow — selective regeneration where only affected agents rerun when a user edits a single element
- Add CairoSVG to the rendering stack alongside Pillow for vector-quality text and shape rendering
- Restructure agent communication — workers propose patches, only the orchestrator merges them into the scene graph

## Capabilities

### New Capabilities
- `governance-layer`: Paperclip AI governance controller managing workflow approvals, retry budgets, agent permissions, task priorities, and audit logging
- `scene-graph-engine`: Scene-graph-based rendering architecture replacing flat image composition — editable layers, object trees, structured nodes, z-ordering, and the scene graph as master source of truth
- `rag-design-memory`: RAG retrieval system using ChromaDB + CLIP embeddings for template retrieval, visual DNA extraction, style memory, slogan memory, and approved design memory
- `selective-regeneration`: Editable design workflow supporting partial re-renders — when a user edits background/text/image/logo/color, only affected agents rerun instead of the full pipeline
- `indictrans-language-agent`: IndicTrans2-powered Telugu↔English translation agent with Unicode-safe text processing replacing the basic copywriter for multilingual content
- `lightweight-preview`: Preview system enforcing 72 DPI during QA loops and blocking 300 DPI export generation until `is_print_ready == True`
- `agent-patch-protocol`: Structured agent communication protocol where workers propose JSON patches instead of directly modifying state, and only the orchestrator merges approved patches
- `cairo-rendering`: CairoSVG integration for vector-quality text and shape rendering alongside Pillow raster pipeline

### Modified Capabilities
_(no existing openspec/specs/ to modify)_

## Impact

- **backend/workflows/design_pipeline.py** — Major rewrite: PipelineState gains scene_graph field, patch-based agent communication, governance checkpoints, selective re-render routing
- **backend/agents/** — All 13 agents refactored to return JSON patches instead of direct state mutations; new agents added (governance, indictrans, scene_graph_manager)
- **backend/utils/** — New modules: scene_graph.py, patch_merger.py, cairo_renderer.py
- **backend/memory/** — New ChromaDB integration, CLIP embedding pipeline, design DNA storage
- **backend/qa/** — Vision QA gains scene-graph-aware checks (layer validation, node integrity)
- **requirements.txt** — New deps: chromadb, sentence-transformers (CLIP/BGE-M3), cairosvg, indictrans2 (or HF model)
- **frontend/dashboard.py** — Layer editor view, selective regeneration controls, design memory browser
- **config/settings.py** — Governance config (retry budgets, approval thresholds), ChromaDB path, CLIP model settings
- **Memory footprint** — ChromaDB + CLIP embeddings will require ~2-3GB additional RAM on the 16GB workstation
