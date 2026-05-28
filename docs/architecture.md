# SLN AI System — Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend Layer                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Dashboard  │  │Agent UI  │  │Workflow  │  │Memory    │   │
│  │          │  │          │  │Builder   │  │Explorer  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │ REST / WebSocket
┌──────────────────────────▼──────────────────────────────────┐
│                       API Gateway                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Auth      │  │Rate      │  │Logging   │  │Routing   │   │
│  │Middleware│  │Limiter   │  │          │  │          │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    Orchestration Layer                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Task      │  │Agent     │  │Event     │  │Health    │   │
│  │Scheduler │  │Router    │  │Bus       │  │Monitor   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                       Agent Layer                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Planner   │  │Executor  │  │Reviewer  │  │Memory    │   │
│  │Agent     │  │Agent     │  │Agent     │  │Agent     │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                      Storage Layer                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │PostgreSQL│  │Redis     │  │ChromaDB  │  │File      │   │
│  │(Data)    │  │(Cache)   │  │(Vectors) │  │(Blobs)   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

1. **User Request** → Frontend → API Gateway → Orchestration
2. **Task Routing** → Orchestration → Agent Selection → Execution
3. **Memory Access** → Agent → Vector Memory → Context Retrieval
4. **Response** → Agent → Orchestration → API → Frontend → User

## Key Design Principles

- **Modularity**: Each component is independently deployable
- **Scalability**: Horizontal scaling via container orchestration
- **Observability**: Structured logging, metrics, and tracing
- **Security**: Zero-trust with JWT auth and RBAC
- **Resilience**: Circuit breakers, retries, and graceful degradation
