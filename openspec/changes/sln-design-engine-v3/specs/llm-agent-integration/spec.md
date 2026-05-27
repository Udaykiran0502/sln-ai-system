## ADDED Requirements

### Requirement: Structured LLM calls with JSON output
The system SHALL call Google Gemini API with structured prompts and parse responses as JSON. Each LLM-dependent agent (input_parser, research, style_analyzer, copywriter) SHALL send a system prompt + user prompt and receive a typed JSON response matching a Pydantic schema.

#### Scenario: Successful Gemini call with valid JSON
- **WHEN** an agent sends a prompt to Gemini Flash
- **THEN** the system SHALL parse the response as JSON and validate it against the agent's expected schema

#### Scenario: Gemini returns malformed JSON
- **WHEN** Gemini returns a response that is not valid JSON
- **THEN** the system SHALL attempt to extract JSON from markdown code blocks, and if that fails, return a sensible default for that agent

#### Scenario: Gemini API call fails
- **WHEN** a Gemini API call fails due to rate limiting, network error, or invalid key
- **THEN** the system SHALL log the error, set the pipeline error state, and continue with fallback defaults rather than crashing

### Requirement: Input parser extracts order metadata
The input_parser agent SHALL extract structured order metadata from raw text or JSON input including: banner_type, dimensions, phone_numbers, colors, language, event_type, and client_name.

#### Scenario: Parse structured JSON order
- **WHEN** the input_parser receives a valid JSON order dict
- **THEN** it SHALL return a parsed_order dict with all required fields populated from the input

#### Scenario: Parse unstructured text order
- **WHEN** the input_parser receives free-text order description
- **THEN** it SHALL use Gemini to extract structured fields and return a parsed_order dict

### Requirement: Copywriter generates Telugu and English text
The copywriter agent SHALL generate print-friendly heading, subheading, tagline, and footer text in Telugu and/or English based on the order's language and event type.

#### Scenario: Generate Telugu political banner copy
- **WHEN** the copywriter receives a political banner order with language=telugu
- **THEN** it SHALL return heading_te, subheading, tagline, footer_text, and phone_display in valid Telugu Unicode

#### Scenario: Fallback when LLM unavailable
- **WHEN** the LLM call fails during copywriting
- **THEN** the system SHALL use the raw text_content from the order input as-is
