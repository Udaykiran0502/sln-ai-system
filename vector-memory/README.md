# Vector Memory

Vector database integration for embeddings, semantic search, and RAG pipelines.

## Overview

Provides embedding generation, vector storage, similarity search, and retrieval-augmented generation capabilities.

## Supported Backends

| Backend | Status | Use Case |
|---------|--------|----------|
| ChromaDB | Planned | Local development |
| Pinecone | Planned | Production scale |
| Weaviate | Planned | Hybrid search |
| pgvector | Planned | PostgreSQL native |

## Structure

```
vector-memory/
├── embeddings/        # Embedding generation
├── storage/           # Vector store adapters
├── retrieval/         # Similarity search & RAG
├── indexing/          # Index management
└── config/            # Vector DB configuration
```
