## 1. Configuration & Dependencies

- [ ] 1.1 Update requirements.txt to pin exact versions for production stability
- [ ] 1.2 Add GOOGLE_API_KEY to config/.env.example with setup instructions
- [ ] 1.3 Verify libraqm availability in Pillow build via verify_env.py startup check
- [ ] 1.4 Download and place Telugu fonts (Ramabhadra, Gautami, NTR) into assets/fonts/
- [ ] 1.5 Download and place English fonts (Oswald, Roboto, Montserrat) into assets/fonts/

## 2. Core Utilities

- [ ] 2.1 Complete telugu_shaper.py — add libraqm detection check and render_shaped_text() function for PIL composition
- [ ] 2.2 Complete color_utils.py — implement rgb_to_cmyk() with proper conversion math and contrast_ratio() with WCAG formula
- [ ] 2.3 Verify bbox.py — ensure auto_scale_font() works with real Telugu TTF fonts and returns correct pixel sizes

## 3. LLM Agent Integration

- [ ] 3.1 Create shared LLM client module backend/agents/llm_client.py with Gemini call wrapper, JSON parsing, and fallback logic
- [ ] 3.2 Implement input_parser.py — Gemini-powered extraction for unstructured input, passthrough for structured JSON
- [ ] 3.3 Implement research.py — Gemini-based style research with caching in memory/
- [ ] 3.4 Implement style_analyzer.py — convert research output to structured StyleMetadata JSON via Gemini
- [ ] 3.5 Implement copywriter.py — generate Telugu/English banner copy with Unicode validation and LLM fallback

## 4. Deterministic Agents (No LLM)

- [ ] 4.1 Implement decision_engine.py — rule-based routing: template/ai/hybrid based on template availability and order content
- [ ] 4.2 Implement template_selector.py — category+color scoring against template_index.json, return best match
- [ ] 4.3 Implement font_intelligence.py — rule-based font selection with category→font mapping and fallback to system fonts

## 5. Template Library

- [ ] 5.1 Expand template_index.json from 1 to 10+ templates covering political, wedding, business, religious, general categories
- [ ] 5.2 Create placeholder background PNG images for each template in backend/templates/backgrounds/
- [ ] 5.3 Add layout_type, subcategory, success_score, usage_count, tags, and layout_regions to each template entry

## 6. Layout Engine

- [ ] 6.1 Verify layout_engine.py produces correct absolute pixel coordinates for all 4 layout patterns
- [ ] 6.2 Add unit test: same input always produces same LayoutPlan output (determinism verification)
- [ ] 6.3 Verify auto_scale_font integration — heading text fits bounding box without overflow

## 7. Image Editing Agent

- [ ] 7.1 Implement image_editor.py — rembg background removal with session reuse for batch performance
- [ ] 7.2 Add aspect-ratio-aware resize_to_slot() that fits images into layout bounding boxes
- [ ] 7.3 Add image enhancement (contrast/sharpness boost via PIL.ImageEnhance)
- [ ] 7.4 Add memory guard — process images at max 4000px, track memory usage

## 8. Composition Engine

- [ ] 8.1 Implement composition.py — layer-ordered compositing: background → images → text → logos
- [ ] 8.2 Wire Telugu text rendering through PIL.ImageDraw.text() with libraqm-enabled fonts
- [ ] 8.3 Handle missing image paths gracefully (skip + log warning, not crash)
- [ ] 8.4 Implement processing-resolution cap — compose at reduced resolution, save full-res at export

## 9. QA Scoring System

- [ ] 9.1 Implement 8 QA checks in qa_engine.py: Telugu validation, clipping, readability, alignment, contrast, image quality, safe zone, DPI
- [ ] 9.2 Implement Telugu character validation check — verify no broken aksharas or isolated combining marks
- [ ] 9.3 Implement clipping detection — check all elements are within safe zone boundaries
- [ ] 9.4 Implement contrast ratio check — WCAG-based contrast between text color and background
- [ ] 9.5 Implement blur detection — Laplacian variance for image quality scoring
- [ ] 9.6 Implement composite score calculation with weighted average and pass/fail threshold

## 10. Auto-Fix Loop

- [ ] 10.1 Implement auto_fix.py — map QA failure codes to deterministic corrections
- [ ] 10.2 Implement contrast fix — adjust text color to maximize contrast against background
- [ ] 10.3 Implement clipping fix — reposition elements inside safe zone
- [ ] 10.4 Implement fix_attempts counter with max 2 iterations before human review flag

## 11. Export Pipeline

- [ ] 11.1 Implement export_agent.py — RGB→CMYK conversion via Pillow
- [ ] 11.2 Implement TIFF export at 300 DPI with LZW compression and CMYK mode
- [ ] 11.3 Implement PDF generation via reportlab with correct dimensions
- [ ] 11.4 Implement 72 DPI JPEG preview generation for dashboard
- [ ] 11.5 Write export metadata to state store (file paths, sizes, timestamps)

## 12. Order State Management

- [ ] 12.1 Verify state_store.py — save_state, load_state, save_order_input, load_order_input all work with file-based JSON
- [ ] 12.2 Verify append_log writes JSONL entries with timestamp, agent name, status, elapsed
- [ ] 12.3 Verify sanitize_order_id strips path traversal characters
- [ ] 12.4 Implement list_orders() — scan data/orders/ and return summaries for dashboard

## 13. Streamlit Dashboard

- [ ] 13.1 Implement home view — order queue table with status badges, quick stats, recent activity
- [ ] 13.2 Implement create view — order submission form with all fields, validation, and image upload
- [ ] 13.3 Implement workspace view — preview image display with QA overlay for selected order
- [ ] 13.4 Implement templates view — grid display of all templates with metadata cards
- [ ] 13.5 Implement QA view — radar chart of 8 QA dimensions using plotly
- [ ] 13.6 Implement exports view — download history table with TIFF/PDF download buttons
- [ ] 13.7 Add regenerate button to workspace view — POST /api/orders/{id}/regenerate

## 14. Integration & End-to-End Testing

- [ ] 14.1 Create sample order JSON fixture in data/orders/test/input.json
- [ ] 14.2 Write end-to-end pytest: submit order → verify TIFF exists in outputs/final/
- [ ] 14.3 Write unit tests for bbox, color_utils, telugu_shaper
- [ ] 14.4 Verify FastAPI startup — all endpoints return correct responses
- [ ] 14.5 Verify Streamlit dashboard loads without errors and displays mock data
- [ ] 14.6 Run full pipeline with sample political banner order and verify output quality
