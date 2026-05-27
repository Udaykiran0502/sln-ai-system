## ADDED Requirements

### Requirement: Layer-ordered image composition
The composition engine SHALL merge all design elements in a fixed layer order: background color/image → textures → photographic images → text elements → logos → overlays.

#### Scenario: Compose a political banner
- **WHEN** the composition engine receives a layout plan with background, hero image, heading, subheading, and footer
- **THEN** it SHALL produce a single PIL Image with all elements composited in correct z-order at the positions specified by the layout plan

#### Scenario: Handle missing images gracefully
- **WHEN** a layout plan references an image_path that does not exist on disk
- **THEN** the composition engine SHALL skip that image slot and log a warning, not crash

### Requirement: Telugu text rendered via PIL with HarfBuzz
The composition engine SHALL render Telugu text elements using PIL.ImageDraw.text() with libraqm-enabled font rendering to ensure correct shaping.

#### Scenario: Telugu heading composited correctly
- **WHEN** a text element has Telugu content and a Telugu font path
- **THEN** the rendered text on the canvas SHALL display correct ligatures and conjuncts

### Requirement: Composition at processing resolution
The composition engine SHALL work at a capped resolution (max_image_px) during processing and SHALL NOT attempt to allocate the full print-resolution canvas until export.

#### Scenario: Large banner processing
- **WHEN** composing a 48x24 inch banner at 300 DPI (14400x7200 actual pixels)
- **THEN** the system SHALL compose at reduced resolution and upscale at export time to stay within memory budget
