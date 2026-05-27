## ADDED Requirements

### Requirement: Order queue display
The dashboard SHALL display a table of all orders with columns for order_id, client_name, banner_type, status, and creation timestamp. Status SHALL be shown with colored badges.

#### Scenario: View order list
- **WHEN** the user navigates to the home page
- **THEN** the dashboard SHALL display all orders fetched from GET /api/orders with status badges

### Requirement: Create order form
The dashboard SHALL provide a form to submit new design orders with fields for client name, banner type, dimensions, language, colors, heading text, phone number, and optional image upload.

#### Scenario: Submit valid order
- **WHEN** the user fills in all required fields and clicks Submit
- **THEN** the dashboard SHALL POST to /api/orders and display the returned order_id with queued status

#### Scenario: Validation error display
- **WHEN** the user submits a form with missing required fields
- **THEN** the dashboard SHALL display the validation error message from the API

### Requirement: Preview viewer
The dashboard SHALL display the preview JPEG for a completed order fetched from GET /api/orders/{id}/preview.

#### Scenario: View preview
- **WHEN** the user selects a completed order
- **THEN** the dashboard SHALL display the preview image with QA score overlay

### Requirement: QA score panel
The dashboard SHALL display QA scores for an order as a radar chart showing all 8 QA dimensions.

#### Scenario: View QA details
- **WHEN** the user views QA for an order that has been scored
- **THEN** the dashboard SHALL display a radar chart with scores for Telugu, clipping, readability, alignment, contrast, image quality, safe zone, and DPI

### Requirement: Export download
The dashboard SHALL provide download buttons for TIFF and PDF exports.

#### Scenario: Download TIFF
- **WHEN** the user clicks Download TIFF for a completed order
- **THEN** the browser SHALL download the TIFF file from GET /api/orders/{id}/export?format=tiff

### Requirement: Regenerate order
The dashboard SHALL allow re-running the pipeline for an existing order.

#### Scenario: Regenerate design
- **WHEN** the user clicks Regenerate for an order
- **THEN** the dashboard SHALL POST to /api/orders/{id}/regenerate and update the status to regenerating
