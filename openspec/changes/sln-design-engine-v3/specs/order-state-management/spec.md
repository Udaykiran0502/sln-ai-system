## ADDED Requirements

### Requirement: File-based order state persistence
The system SHALL save pipeline state as JSON files in data/orders/{order_id}/state.json after each pipeline run.

#### Scenario: Save state after pipeline completion
- **WHEN** the pipeline finishes processing an order
- **THEN** the system SHALL write the full PipelineState dict to data/orders/{order_id}/state.json

#### Scenario: Load state for status check
- **WHEN** GET /api/orders/{order_id} is called
- **THEN** the system SHALL read data/orders/{order_id}/state.json and return the order status

### Requirement: Pipeline run logging
The system SHALL append a log entry for each agent execution to data/orders/{order_id}/log.jsonl with timestamp, agent name, status, elapsed time, and any errors.

#### Scenario: Log successful agent execution
- **WHEN** the input_parser agent completes in 1.2 seconds
- **THEN** the system SHALL append a JSON line with status=success and elapsed=1.2 to the order's log file

### Requirement: Order input preservation
The system SHALL save the original order input as data/orders/{order_id}/input.json before pipeline execution begins.

#### Scenario: Preserve input for regeneration
- **WHEN** a regenerate request is received
- **THEN** the system SHALL load the original input from data/orders/{order_id}/input.json and re-run the pipeline

### Requirement: Order ID sanitization
The system SHALL sanitize order IDs to prevent path traversal by removing special characters and limiting length.

#### Scenario: Reject malicious order ID
- **WHEN** an order ID contains "../" or other path traversal characters
- **THEN** the system SHALL strip those characters and use the sanitized ID
