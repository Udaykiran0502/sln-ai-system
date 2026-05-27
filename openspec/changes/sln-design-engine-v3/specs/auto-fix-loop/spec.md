## ADDED Requirements

### Requirement: Rule-based fixes for common QA failures
The auto-fix agent SHALL apply deterministic corrections based on QA failure codes: increase contrast by adjusting text color, reposition clipped elements inside safe zone, increase font size for readability, and snap misaligned elements to grid.

#### Scenario: Fix low contrast
- **WHEN** the QA engine reports a contrast failure for a text element
- **THEN** the auto-fix agent SHALL adjust the text color to maximize contrast against the background

#### Scenario: Fix clipping
- **WHEN** the QA engine reports an element extending beyond the safe zone
- **THEN** the auto-fix agent SHALL reposition the element inside the safe zone boundaries

### Requirement: Maximum fix iterations
The auto-fix agent SHALL attempt at most max_fix_attempts (default 2) fix iterations. After the maximum is reached, the order SHALL be flagged for human review.

#### Scenario: Max retries exceeded
- **WHEN** the auto-fix agent has already run 2 times and QA still fails
- **THEN** the pipeline SHALL stop and set needs_human_review=true

#### Scenario: Fix succeeds on first attempt
- **WHEN** the auto-fix agent corrects a contrast issue and re-composition passes QA
- **THEN** the pipeline SHALL proceed to export with fix_attempts=1
