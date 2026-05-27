## ADDED Requirements

### Requirement: Scene graph as master source of truth
Every design SHALL be internally represented as a scene graph — a tree of typed nodes (RootNode, GroupNode, TextNode, ImageNode, ShapeNode). The scene graph JSON file SHALL be the master source of truth, NOT the exported PNG/JPEG.

#### Scenario: Create scene graph for new order
- **WHEN** the layout engine generates a layout plan
- **THEN** it SHALL produce a SceneGraph object with a RootNode containing child GroupNodes for background, content, and overlay layers

#### Scenario: Serialize scene graph to JSON
- **WHEN** a scene graph is saved
- **THEN** the system SHALL serialize the full node tree to a JSON file at data/orders/{order_id}/scene_graph.json

### Requirement: Typed scene graph nodes
Each node in the scene graph SHALL have: id, type, name, transform (position, rotation, scale), bounds (x, y, width, height), z_index, visible, locked, dirty, and type-specific properties (text_content for TextNode, image_path for ImageNode, etc.).

#### Scenario: TextNode contains Telugu text properties
- **WHEN** a TextNode is created for a Telugu heading
- **THEN** it SHALL include text_content, font_path, font_size, color, alignment, and language fields

#### Scenario: ImageNode references source asset
- **WHEN** an ImageNode is created for a hero photo
- **THEN** it SHALL include image_path, crop_rect, opacity, and fit_mode fields

### Requirement: Scene graph renderer produces layered output
The scene graph renderer SHALL walk the node tree in z-order and render each visible node to produce the final composite image.

#### Scenario: Render scene graph to preview
- **WHEN** the renderer processes a scene graph at 72 DPI
- **THEN** it SHALL produce a JPEG preview image with all visible nodes composited in correct z-order

#### Scenario: Skip invisible nodes
- **WHEN** a node has visible=false
- **THEN** the renderer SHALL skip that node during compositing
