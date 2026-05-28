# Docker

Docker configurations and container definitions for the SLN AI System.

## Quick Start

```bash
# Build all services
docker compose up -d --build

# View logs
docker compose logs -f

# Stop all services
docker compose down
```

## Structure

```
docker/
├── docker-compose.yml     # Multi-service compose file
├── docker-compose.dev.yml # Development overrides
├── Dockerfile.backend     # Backend Dockerfile
├── Dockerfile.frontend    # Frontend Dockerfile
├── .dockerignore          # Docker ignore rules
└── configs/               # Container-specific configs
```
