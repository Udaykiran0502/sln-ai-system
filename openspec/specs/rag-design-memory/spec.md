# rag-design-memory Specification

## Purpose
TBD - created by archiving change ai-organizational-hierarchy. Update Purpose after archive.
## Requirements
### Requirement: ChromaDB design memory storage
The system SHALL use ChromaDB with local persistent storage to index approved designs, templates, slogans, and style DNA. Collections SHALL include: templates, approved_designs, slogans, and style_dna.

#### Scenario: Index an approved design
- **WHEN** a design passes QA and is exported
- **THEN** the system SHALL generate a CLIP embedding of the preview image and store it in the approved_designs collection with metadata (category, style, colors, order_id)

#### Scenario: Query similar templates
- **WHEN** the template selector needs to find matching templates
- **THEN** it SHALL query the templates collection with the order's style metadata and return the top-k most similar templates by embedding similarity

### Requirement: CLIP embeddings for visual similarity
The system SHALL use CLIP (clip-ViT-B-32) to generate image embeddings for visual similarity search and BGE-small for text embeddings.

#### Scenario: Generate image embedding
- **WHEN** a new design preview is created
- **THEN** the system SHALL generate a 512-dimensional CLIP embedding vector from the preview image

### Requirement: Telugu slogan memory
The system SHALL maintain a slogans collection storing approved Telugu slogans with category, event_type, and text embedding for retrieval during copywriting.

#### Scenario: Retrieve similar slogans
- **WHEN** the copywriter agent needs inspiration for a political banner
- **THEN** it SHALL query the slogans collection filtered by category=political and return the top 5 most relevant slogans

### Requirement: Lazy model loading
CLIP and BGE models SHALL be loaded on-demand when first queried, not at system startup. Models SHALL be unloaded after an idle timeout to free memory.

#### Scenario: First RAG query loads models
- **WHEN** the first design memory query is made after startup
- **THEN** the system SHALL load the CLIP model, log the load time, and proceed with the query

