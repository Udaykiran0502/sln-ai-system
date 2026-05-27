# governance-layer Specification

## Purpose
TBD - created by archiving change ai-organizational-hierarchy. Update Purpose after archive.
## Requirements
### Requirement: Paperclip governance controller
The system SHALL include a Paperclip AI governance layer that acts as workflow approval gate, budget controller, and audit logger. Paperclip SHALL run as middleware before and after each agent node in the LangGraph pipeline.

#### Scenario: Approve agent execution
- **WHEN** an agent node is about to execute
- **THEN** Paperclip SHALL verify the agent has permission to run and the retry budget has not been exceeded before allowing execution

#### Scenario: Block agent exceeding retry budget
- **WHEN** an agent has failed 3 times and the retry budget is set to 3
- **THEN** Paperclip SHALL block execution, log the escalation, and set needs_human_review=true

### Requirement: Audit logging for all agent actions
The system SHALL log every agent execution, governance decision, and state mutation to an append-only audit log file per order.

#### Scenario: Log successful agent execution
- **WHEN** the input_parser agent completes successfully
- **THEN** Paperclip SHALL append a JSON log entry with agent_name, action=executed, status=success, timestamp, and elapsed_ms

#### Scenario: Log governance veto
- **WHEN** Paperclip blocks an agent from executing due to exceeded retry budget
- **THEN** Paperclip SHALL append a log entry with action=vetoed and the reason for the veto

### Requirement: Governance MUST NOT perform rendering
Paperclip SHALL NOT render graphics, position layouts, modify scene graphs, or bypass QA checks. Paperclip's scope is strictly limited to workflow control, permissions, and auditing.

#### Scenario: Governance does not modify design output
- **WHEN** Paperclip processes a governance check
- **THEN** it SHALL return only approval/denial decisions and audit entries, never scene graph mutations or image data

