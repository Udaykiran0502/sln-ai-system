## ADDED Requirements

### Requirement: Agents return patches not direct mutations
Every specialized agent SHALL return a list of Patch objects instead of directly modifying PipelineState. Each Patch SHALL contain: target_path (dot-notation field path), operation (set, append, remove), and value.

#### Scenario: Input parser returns patches
- **WHEN** the input_parser agent processes an order
- **THEN** it SHALL return patches like [{target_path: "parsed_order", operation: "set", value: {...}}] instead of directly setting state["parsed_order"]

#### Scenario: Orchestrator merges approved patches
- **WHEN** the orchestrator receives patches from an agent
- **THEN** it SHALL validate each patch against governance rules and merge approved patches into PipelineState

### Requirement: Patch validation by governance
Before merging a patch, the orchestrator SHALL verify with Paperclip governance that the agent has permission to modify the target field. Unauthorized patches SHALL be rejected and logged.

#### Scenario: Reject unauthorized patch
- **WHEN** the copywriter agent attempts to patch the qa_scores field
- **THEN** governance SHALL reject the patch because copywriter does not have permission to modify qa_scores

#### Scenario: Approve authorized patch
- **WHEN** the copywriter agent patches the copy field
- **THEN** governance SHALL approve the patch and the orchestrator SHALL merge it into state

### Requirement: Patch audit trail
Every patch (approved or rejected) SHALL be logged in the order's audit trail with timestamp, agent_name, target_path, operation, and approval_status.

#### Scenario: Audit log contains all patches
- **WHEN** a pipeline run completes
- **THEN** the audit log SHALL contain an entry for every patch proposed by every agent during the run
