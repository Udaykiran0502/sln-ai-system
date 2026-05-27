## ADDED Requirements

### Requirement: Dirty flag propagation on scene graph nodes
When a user edits a scene graph node (text, image, color, or transform), the system SHALL mark that node and all dependent nodes as dirty. Only agents whose output nodes are dirty SHALL rerun.

#### Scenario: Edit text content triggers partial rerun
- **WHEN** a user edits the heading text on a completed design
- **THEN** the system SHALL mark the heading TextNode as dirty and rerun only copywriter, font_intelligence, layout_engine (for that node), composition, and QA — NOT input_parser, research, or style_analyzer

#### Scenario: Edit background triggers minimal rerun
- **WHEN** a user changes the background image
- **THEN** the system SHALL mark only the background ImageNode as dirty and rerun only composition and QA

#### Scenario: Clean nodes are not reprocessed
- **WHEN** the pipeline runs in selective mode
- **THEN** agents whose output nodes are all clean SHALL be skipped and their previous results SHALL be reused from the saved state

### Requirement: Selective pipeline routing in LangGraph
The LangGraph pipeline SHALL support a selective execution mode where the entry point and node skip list are determined by which scene graph nodes are dirty.

#### Scenario: Selective mode skips clean agents
- **WHEN** only the phone number TextNode is dirty
- **THEN** the pipeline SHALL skip input_parser, research, style_analyzer, decision_engine, template_selector, and image_editor, running only copywriter through export
