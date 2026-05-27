## ADDED Requirements

### Requirement: Eight automated QA checks
The QA engine SHALL run 8 automated checks on every composed design, each returning a score from 0 to 100: Telugu character validation, clipping detection, readability check, alignment verification, contrast ratio, image quality (blur detection), safe zone compliance, and DPI verification.

#### Scenario: All checks pass
- **WHEN** the QA engine evaluates a well-formed composition
- **THEN** it SHALL return individual scores for all 8 checks and a composite score above the threshold (default 70)

#### Scenario: Clipping detected
- **WHEN** a text or image element extends beyond the safe zone boundaries
- **THEN** the clipping check SHALL return a score below 50 and include the element name in the failure details

#### Scenario: Low contrast detected
- **WHEN** the text color and background color have a contrast ratio below 3:1
- **THEN** the contrast check SHALL return a score below 50

### Requirement: Composite score determines pass/fail
The QA engine SHALL calculate a weighted composite score from all 8 checks. If the composite score is below the configured threshold (settings.qa_threshold), the design SHALL be routed to auto-fix.

#### Scenario: Score below threshold routes to auto-fix
- **WHEN** the composite QA score is 65 (below threshold of 70)
- **THEN** the pipeline SHALL route to the auto_fix agent instead of export

#### Scenario: Score above threshold routes to export
- **WHEN** the composite QA score is 85 (above threshold of 70)
- **THEN** the pipeline SHALL route directly to the export agent
