## ADDED Requirements

### Requirement: IndicTrans2 Telugu-English translation
The system SHALL include an IndicTrans2-powered language agent capable of translating between Telugu and English for banner text content. The agent SHALL use the distilled 200M parameter model for CPU inference.

#### Scenario: Translate English heading to Telugu
- **WHEN** the language agent receives an English heading "Victory to the People"
- **THEN** it SHALL return a Telugu translation in valid Unicode

#### Scenario: Validate Telugu Unicode output
- **WHEN** the language agent produces Telugu text
- **THEN** it SHALL verify the output contains only valid Telugu Unicode characters (U+0C00–U+0C7F) plus standard punctuation and digits

### Requirement: On-demand model loading
The IndicTrans2 model SHALL be loaded on-demand when translation is first requested, not at system startup, to conserve memory.

#### Scenario: First translation request loads model
- **WHEN** the first translation request is made after startup
- **THEN** the system SHALL load the IndicTrans2 distilled model (~800MB) and log the load time

#### Scenario: Fallback when model unavailable
- **WHEN** the IndicTrans2 model cannot be loaded (not downloaded)
- **THEN** the system SHALL fall back to using the LLM-based copywriter for translation and log a warning
