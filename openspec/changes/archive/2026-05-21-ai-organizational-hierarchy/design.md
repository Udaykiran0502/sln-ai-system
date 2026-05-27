## Context

The SLN Design Engine v3 currently operates as a flat 13-agent linear pipeline built on LangGraph. Each agent receives the full `PipelineState` dict, mutates it directly, and passes it to the next node. The composition engine produces a single flat PIL Image — there is no concept of layers, object trees, or non-destructive editing. If a user wants to change a phone number on a finished banner, the entire pipeline reruns from scratch. There is no governance controlling agent behavior, no memory of past designs, and no way to do partial re-renders.

The system runs on a local Windows i7 workstation with 16GB RAM. This is a hard constraint — ChromaDB, CLIP models, and CairoSVG must fit within this budget alongside the existing rendering pipeline.

**Stakeholders:** SLN Digitals print shop operators who need fast iteration on banner designs with minimal re-processing.

## Goals / Non-Goals

**Goals:**
- Introduce a 6-layer organizational architecture (Governance → Orchestration → Agents → Rendering → QA → Export)
- Replace flat image composition with a scene graph that is the master source of truth for every design
- Enable selective re-rendering — editing one element re-runs only affected agents
- Add Paperclip AI governance for approval gates, retry budgets, and audit trails
- Add RAG-based design memory via ChromaDB for template/style retrieval
- Enforce lightweight 72 DPI previews during QA loops; 300 DPI only at final export
- Make agents patch-based — workers propose changes, orchestrator merges

**Non-Goals:**
- Real-time collaborative editing with multiple concurrent users
- Cloud-hosted ChromaDB — all local
- Full PSD import/export (scene graph uses JSON, not Adobe binary formats)
- Running IndicTrans2 on GPU (CPU inference only, 16GB constraint)
- Replacing LangGraph with a custom orchestration framework
- Multi-tenant architecture

## Decisions

### Decision 1: Scene Graph as Python dataclass tree (not a database)

**Choice:** Represent the scene graph as a tree of Python `@dataclass` nodes (SceneNode → GroupNode / TextNode / ImageNode / ShapeNode) serialized to JSON. The scene graph JSON file becomes the master source of truth for each design.

**Alternatives considered:**
- SQLite-backed node storage → too slow for real-time tree traversals, excessive I/O for 50-100 node trees
- SVG DOM → vendor-specific rendering differences, complex namespace handling
- Custom binary format → not debuggable, not human-readable

**Rationale:** A 50-node banner design is ~5KB as JSON. Tree operations (insert, remove, re-order, find-by-name) are fast in memory. JSON is inspectable in VS Code. Serialization/deserialization is trivial with `dataclasses_json` or manual dict conversion. The existing `LayoutPlan` dataclass in `bbox.py` already follows this pattern.

### Decision 2: Paperclip Governance as middleware in LangGraph (not a separate service)

**Choice:** Implement Paperclip as a set of LangGraph middleware functions that run before/after each agent node. Governance rules live in `config/settings.py` as configurable thresholds.

**Alternatives considered:**
- Separate FastAPI microservice → adds network latency, deployment complexity
- Database-driven rule engine → overkill for 5-10 governance rules
- Hardcoded in each agent → violates single-responsibility

**Rationale:** LangGraph already has the concept of node wrappers (the existing `_safe_call` function). Extending this to include governance checks (budget tracking, retry limits, permission validation) is natural. No new infrastructure required.

### Decision 3: ChromaDB with local persistence for design memory

**Choice:** Use ChromaDB's local persistent storage (SQLite+DuckDB backend) with `sentence-transformers/clip-ViT-B-32` for image embeddings and `BAAI/bge-small-en-v1.5` for text embeddings.

**Alternatives considered:**
- FAISS → no metadata filtering, manual index management
- Pinecone/Weaviate → cloud dependency, cost
- Plain JSON file search → no vector similarity, O(n) scan

**Rationale:** ChromaDB runs locally with zero infrastructure. The `clip-ViT-B-32` model is ~600MB and can generate embeddings on CPU in <1s per image. BGE-small is ~130MB. Total memory overhead is ~2GB which fits within the 16GB budget alongside the rendering pipeline.

### Decision 4: Patch-based agent communication via JSON dicts

**Choice:** Each agent returns a `Patch` dict containing `{target_path: str, operation: "set"|"append"|"remove", value: any}` instead of directly mutating `PipelineState`. The orchestrator validates and merges patches.

**Alternatives considered:**
- JSON Patch (RFC 6902) → too rigid for our use case, path syntax overhead
- Event sourcing → adds complexity without benefit for single-user system
- Direct state mutation (current approach) → no audit trail, no governance veto

**Rationale:** Simple dict patches are easy to validate ("does this agent have permission to modify this field?"), easy to audit log, and easy to reject in governance checks. The orchestrator's `_safe_call` already wraps every agent — adding patch validation is a single function.

### Decision 5: CairoSVG for text, Pillow for raster compositing

**Choice:** Use CairoSVG to render text elements and vector shapes to PNG at target DPI, then composite into the final raster using Pillow. The scene graph renderer walks the tree, renders each node to a raster layer, then composites.

**Alternatives considered:**
- Pure Pillow → already works, but font rendering quality is limited without Cairo
- Pure Cairo (pycairo) → excellent rendering but complex Python API, difficult Windows install
- Skia (skia-python) → best quality but heavy C++ dependency, unreliable on Windows

**Rationale:** CairoSVG is pip-installable on Windows, handles complex text layout well, and produces crisp vector-quality output. Using it for text rendering while keeping Pillow for image/raster operations gives us the best of both worlds without replacing the existing pipeline.

### Decision 6: Selective regeneration via scene graph dirty flags

**Choice:** Each SceneNode has a `dirty: bool` flag. When a user edits a node (e.g., changes text content), that node and its dependents are marked dirty. The pipeline only re-runs agents whose output nodes are dirty.

**Alternatives considered:**
- Full pipeline re-run (current approach) → wastes 30-60 seconds on unchanged elements
- Reactive graph (RxPY) → over-engineered for 13-node pipeline
- Manual agent selection by user → error-prone, bad UX

**Rationale:** Dirty-flag propagation is O(n) on the tree size (~50 nodes), takes microseconds, and precisely identifies which agents need to rerun. A text edit only reruns copywriter → font → layout → composition → QA. An image edit only reruns image_editor → composition → QA.

## Risks / Trade-offs

- **[Risk] ChromaDB + CLIP models consume 2-3GB RAM** → Mitigation: lazy-load models only when RAG queries are made; unload after idle timeout. Use `bge-small` (130MB) not `bge-m3` (2GB).
- **[Risk] CairoSVG Windows installation issues** → Mitigation: CairoSVG wheels include Cairo DLLs since v2.7. Fall back to pure Pillow rendering if import fails, with degraded text quality flagged in QA.
- **[Risk] Scene graph migration breaks existing flat composition** → Mitigation: keep the current `composition.py` as `composition_legacy.py`. New scene graph renderer is additive. Toggle via `config.settings.use_scene_graph = True`.
- **[Risk] IndicTrans2 model too large for 16GB RAM** → Mitigation: use the `ai4bharat/indictrans2-en-indic-dist-200M` distilled model (~800MB). Load on-demand, not at startup.
- **[Risk] Patch-based communication adds overhead** → Mitigation: patches are tiny dicts (~100 bytes). Validation is a simple dict key check. Overhead is <1ms per agent call.

## Migration Plan

1. **Phase A — Non-breaking additions:** Add scene_graph.py, governance.py, patch_merger.py as new modules. No existing code changes.
2. **Phase B — Parallel path:** Wire new scene-graph renderer alongside existing composition.py. Config flag toggles which path runs.
3. **Phase C — Agent migration:** One-by-one, convert agents from direct state mutation to patch-based returns. Each agent is independently testable.
4. **Phase D — Cut over:** After all agents produce patches and scene graph is validated, remove legacy composition path.

**Rollback:** Revert `config.settings.use_scene_graph` to `False` at any point to restore flat pipeline behavior.
