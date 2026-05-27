## ADDED Requirements

### Requirement: Template index with scored entries
The system SHALL maintain a template_index.json file containing at least 10 template entries, each with: template_id, category, subcategory, style, layout_type, colors, fonts, safe_zones, layout_regions, background_path, success_score, usage_count, and tags.

#### Scenario: Load template index
- **WHEN** the template_selector agent initializes
- **THEN** it SHALL load and parse all entries from backend/templates/template_index.json

### Requirement: Category-aware template scoring
The template_selector agent SHALL score templates against the current order based on category match, color similarity, and style compatibility, returning the highest-scoring template.

#### Scenario: Select best template for political banner
- **WHEN** the order has banner_type=political and colors primary=#FF9933
- **THEN** the selector SHALL return the template with the highest combined score for category=political and saffron color match

#### Scenario: No matching template
- **WHEN** no template scores above the minimum threshold
- **THEN** the selector SHALL return a default template and log a warning

### Requirement: Template browser in dashboard
The dashboard SHALL display all templates in a grid view showing thumbnail, category, style, and success score.

#### Scenario: Browse templates
- **WHEN** the user navigates to the templates page
- **THEN** the dashboard SHALL display all templates from GET /api/templates in a card grid
