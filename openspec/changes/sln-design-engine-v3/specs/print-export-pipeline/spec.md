## ADDED Requirements

### Requirement: Export TIFF at 300 DPI in CMYK
The export agent SHALL convert the final composed RGB image to CMYK color mode and save it as a TIFF file at 300 DPI with LZW compression.

#### Scenario: Standard banner export
- **WHEN** the export agent processes a completed 48x24 inch banner
- **THEN** it SHALL produce a TIFF file at 14400x7200 pixels with CMYK color mode and 300 DPI metadata

#### Scenario: DPI metadata is correctly embedded
- **WHEN** a TIFF export is opened in Photoshop or GIMP
- **THEN** the image SHALL report 300 DPI resolution in the image properties

### Requirement: Export PDF for digital sharing
The export agent SHALL generate a PDF file from the final composition suitable for digital preview and print submission.

#### Scenario: PDF generation
- **WHEN** the export agent runs after QA pass
- **THEN** it SHALL produce a PDF file with the banner at correct dimensions

### Requirement: Generate low-resolution preview
The export agent SHALL generate a 72 DPI JPEG preview image for the dashboard and quick review.

#### Scenario: Preview generation
- **WHEN** a composition is complete
- **THEN** the system SHALL save a JPEG preview at 72 DPI in outputs/previews/ with quality 85
