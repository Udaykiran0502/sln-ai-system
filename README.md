# 🧠 SLN AI System

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/Udaykiran0502/sln-ai-system?style=social)](https://github.com/Udaykiran0502/sln-ai-system)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

> A production-grade, multi-agent AI system with orchestrated workflows, vector memory, and automated deployment — powered by MCP integrations.

---

## 📐 Architecture

```
sln-ai-system/
│
├── frontend/           → UI components, dashboards, web apps
├── backend/            → API server, business logic, services
├── agents/             → AI agent definitions & configurations
├── orchestration/      → Multi-agent orchestration engine
├── workflows/          → Automation & pipeline workflows
├── memory/             → Knowledge base, conversation context
├── prompts/            → Prompt templates & management
├── docs/               → Project documentation
├── docker/             → Docker Compose & container configs
├── infrastructure/     → IaC (Terraform, Pulumi, cloud configs)
├── api/                → API schemas, OpenAPI specs, contracts
├── auth/               → Authentication & authorization modules
├── vector-memory/      → Vector DB integration (embeddings, RAG)
├── multi-agent/        → Multi-agent coordination & communication
├── deployment/         → Deployment configs (K8s, Vercel, etc.)
├── .github/            → CI/CD workflows, issue & PR templates
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **Python** >= 3.11
- **Docker** & Docker Compose
- **Git** >= 2.40

### Installation

```bash
# Clone the repository
git clone https://github.com/Udaykiran0502/sln-ai-system.git
cd sln-ai-system

# Install dependencies (per component)
cd backend && pip install -r requirements.txt
cd ../frontend && npm install
```

### Running Locally

```bash
# Start all services with Docker Compose
docker compose -f docker/docker-compose.yml up -d

# Or run individual components
cd backend && python main.py
cd frontend && npm run dev
```

---

## 🔧 MCP Integrations

This project is designed to work with [Antigravity](https://antigravity.google/) via MCP (Model Context Protocol):

| MCP Server | Purpose | Status |
|------------|---------|--------|
| GitHub MCP | Repository management, PRs, Issues | ✅ Configured |
| Filesystem MCP | Direct file access | 🔜 Planned |
| Docker MCP | Container management | 🔜 Planned |
| PostgreSQL MCP | Database operations | 🔜 Planned |

---

## 🌿 Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready code |
| `develop` | Integration branch |
| `feature/*` | New features |
| `bugfix/*` | Bug fixes |
| `hotfix/*` | Critical production fixes |
| `release/*` | Release preparation |

---

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on:
- Branch naming conventions
- Commit message format
- Pull request workflow
- Code review process

---

## 📄 License

This project is licensed under the MIT License — see [LICENSE](LICENSE) for details.

---

## 👤 Author

**Udaykiran** — [@Udaykiran0502](https://github.com/Udaykiran0502)

---

<p align="center">
  Built with ❤️ and AI-powered automation
</p>
