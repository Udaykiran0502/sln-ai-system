## ADDED Requirements

### Requirement: CairoSVG for text and vector rendering
The scene graph renderer SHALL use CairoSVG to render TextNode and ShapeNode elements to PNG at the target DPI for high-quality vector output. ImageNode elements SHALL continue to use Pillow for raster compositing.

#### Scenario: Render Telugu text via Cairo
- **WHEN** a TextNode containing Telugu text is rendered
- **THEN** the system SHALL generate an SVG fragment with the text, render it to PNG via CairoSVG at target DPI, and composite the result into the final image

#### Scenario: Render shape via Cairo
- **WHEN** a ShapeNode (rectangle, circle, line) is rendered
- **THEN** the system SHALL generate an SVG fragment for the shape and render it to PNG via CairoSVG

### Requirement: Cairo fallback to Pillow
If CairoSVG is not available (import fails), the renderer SHALL fall back to Pillow-based text and shape rendering with a degraded quality warning in QA.

#### Scenario: CairoSVG not installed
- **WHEN** CairoSVG cannot be imported
- **THEN** the system SHALL use PIL.ImageDraw for text rendering and log a warning that text quality may be degraded

### Requirement: DPI-aware rendering
Cairo-rendered elements SHALL be produced at the exact DPI specified by the current rendering context (72 DPI for preview, 300 DPI for export).

#### Scenario: Cairo renders at preview DPI
- **WHEN** the renderer is in preview mode (72 DPI)
- **THEN** CairoSVG SHALL render text at 72 DPI resolution

#### Scenario: Cairo renders at export DPI
- **WHEN** the renderer is in export mode (300 DPI)
- **THEN** CairoSVG SHALL render text at 300 DPI resolution
