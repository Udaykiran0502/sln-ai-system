## 1. Setup & Dependencies

- [x] 1.1 Update `requirements.txt` with `chromadb`, `sentence-transformers`, `cairosvg`, and `indictrans2` (or HF equivalent).
- [x] 1.2 Add configuration fields to `config/settings.py` for Governance thresholds, ChromaDB path, and model paths.
- [x] 1.3 Verify CairoSVG installation and fallback mechanism on startup.

## 2. Core Architecture: Scene Graph

- [x] 2.1 Implement `backend/utils/scene_graph.py` with `SceneGraph`, `RootNode`, `GroupNode`, `TextNode`, `ImageNode`, `ShapeNode` dataclasses.
- [x] 2.2 Add JSON serialization and deserialization for the scene graph tree.
- [x] 2.3 Implement dirty flag tracking and propagation logic in scene graph nodes.
- [x] 2.4 Create unit tests for scene graph operations and serialization.

## 3. Core Architecture: Governance & Patching

- [x] 3.1 Implement `backend/utils/patch_merger.py` to handle applying JSON patches to the `PipelineState` and Scene Graph.
- [x] 3.2 Implement `backend/agents/governance.py` (Paperclip AI) middleware for LangGraph.
- [x] 3.3 Add permission checking and retry budget tracking to the governance middleware.
- [x] 3.4 Implement audit logging in `backend/memory/state_store.py` to record all patch operations and governance decisions.

## 4. RAG & Design Memory

- [x] 4.1 Implement `backend/memory/chroma_client.py` for initializing and managing the local ChromaDB instance.
- [x] 4.2 Add lazy loading mechanisms for `clip-ViT-B-32` and `bge-small-en-v1.5` models.
- [x] 4.3 Create the `templates`, `approved_designs`, `slogans`, and `style_dna` collections.
- [x] 4.4 Implement functions to index new designs and query similar designs/templates/slogans.

## 5. Rendering Pipeline Migration

- [x] 5.1 Implement `backend/utils/cairo_renderer.py` for rendering TextNodes and ShapeNodes to SVG/PNG using CairoSVG.
- [x] 5.2 Implement the new scene graph composite engine (`backend/agents/composition_sg.py`) that walks the tree and renders layers in z-order.
- [x] 5.3 Implement DPI-aware rendering (72 DPI preview vs 300 DPI export).
- [x] 5.4 Update `export_agent.py` to enforce the `is_print_ready` check before generating 300 DPI output.

## 6. Agent Refactoring (Patch Protocol)

- [x] 6.1 Refactor `input_parser.py` to return patches instead of direct mutations.
- [x] 6.2 Refactor `layout_engine.py` to generate the initial Scene Graph and return it as a patch.
- [x] 6.3 Implement `indictrans_agent.py` for Telugu-English translation, replacing the basic copywriter logic, and return patches.
- [x] 6.4 Refactor remaining agents (`research.py`, `style_analyzer.py`, `decision_engine.py`, `template_selector.py`, `font_intelligence.py`, `image_editor.py`, `qa_engine.py`, `auto_fix.py`) to the patch protocol.

## 7. Workflow Orchestration

- [x] 7.1 Update `backend/workflows/design_pipeline.py` to use the governance middleware wrappers.
- [x] 7.2 Implement selective routing logic in the StateGraph to skip agents whose input dependencies (dirty flags) are clean.
- [x] 7.3 Update `PipelineState` to include the `scene_graph` and patch history.

## 8. Frontend Integration

- [x] 8.1 Update `frontend/dashboard.py` to support viewing the scene graph layers.
- [x] 8.2 Add UI controls for editing specific scene graph nodes (triggering selective regeneration).
- [x] 8.3 Display the design memory browser for approved designs and templates.
