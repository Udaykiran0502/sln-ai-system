# lightweight-preview Specification

## Purpose
TBD - created by archiving change ai-organizational-hierarchy. Update Purpose after archive.
## Requirements
### Requirement: 72 DPI previews during QA loops
During orchestration and QA iteration loops, the system SHALL render ONLY lightweight 72 DPI previews in JPEG or WebP format. The system SHALL NOT generate 300 DPI production assets during QA loops.

#### Scenario: QA loop renders at preview resolution
- **WHEN** the QA engine evaluates a composition during a fix iteration
- **THEN** the rendered image SHALL be at 72 DPI, not 300 DPI

#### Scenario: Preview uses JPEG compression
- **WHEN** a preview is generated for dashboard display
- **THEN** it SHALL be saved as JPEG at quality 85 or WebP at quality 80

### Requirement: 300 DPI export only after print-ready
The system SHALL generate 300 DPI production assets ONLY after the design has passed QA with is_print_ready=True. The export agent SHALL verify this flag before producing high-resolution output.

#### Scenario: Block premature high-res export
- **WHEN** the export agent is called but is_print_ready is False
- **THEN** the system SHALL refuse to generate 300 DPI output and return an error

#### Scenario: Successful print-ready export
- **WHEN** is_print_ready=True and the export agent runs
- **THEN** the system SHALL render the scene graph at full 300 DPI resolution and produce CMYK TIFF output

