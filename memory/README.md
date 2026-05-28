# Memory

Knowledge base and conversation context storage for the SLN AI System.

## Overview

Manages persistent memory, session context, and knowledge graph storage for agents.

## Memory Types

| Type | Description | Storage |
|------|-------------|---------|
| Short-term | Current session context | In-memory / Redis |
| Long-term | Persistent knowledge | PostgreSQL / File |
| Episodic | Past interaction summaries | Vector DB |
| Semantic | Structured knowledge graph | Neo4j / JSON |

## Structure

```
memory/
├── store/             # Memory storage backends
├── retrieval/         # Memory retrieval strategies
├── indexing/          # Knowledge indexing
├── schemas/           # Memory data schemas
└── config/            # Storage configuration
```
