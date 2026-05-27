## ADDED Requirements

### Requirement: Telugu text renders with correct ligatures
The system SHALL render Telugu text using HarfBuzz-aware text shaping so that conjunct characters (ottulu), vowel signs (gunintalu), and ligatures are displayed correctly without splitting or dropping glyphs.

#### Scenario: Render a Telugu heading with conjuncts
- **WHEN** the composition engine renders the text "నమస్కారం" using a Telugu font
- **THEN** the rendered output SHALL display correct conjunct forms without broken or isolated combining marks

#### Scenario: Validate shaping before rendering
- **WHEN** the telugu_shaper module processes a Telugu string
- **THEN** it SHALL verify that the number of output glyphs is less than or equal to the number of input characters (indicating successful ligature formation)

### Requirement: Font fallback for missing Telugu glyphs
The system SHALL fall back to Windows system Telugu fonts (Gautami) if the configured Telugu font file is not found in the assets/fonts directory.

#### Scenario: Custom font missing
- **WHEN** Ramabhadra-Regular.ttf is not found in assets/fonts/
- **THEN** the font_intelligence agent SHALL resolve to the Windows system Gautami font and log a warning

### Requirement: Mixed Telugu-English text rendering
The system SHALL correctly render text containing both Telugu and English characters in the same string.

#### Scenario: Render mixed script heading
- **WHEN** the text contains "SLN డిజిటల్స్" (mixed English and Telugu)
- **THEN** the system SHALL render both scripts correctly with appropriate font selection per script segment
