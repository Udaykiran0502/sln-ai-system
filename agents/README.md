# Agents

AI agent definitions, configurations, and runtime management.

## Overview

This module contains the definition and lifecycle management for all AI agents in the SLN system.

## Agent Types

| Agent | Role | Description |
|-------|------|-------------|
| Planner | Task Decomposition | Breaks complex tasks into steps |
| Executor | Task Execution | Executes individual steps |
| Reviewer | Quality Assurance | Reviews outputs for quality |
| Memory | Context Management | Manages long-term memory |
| Router | Request Routing | Routes requests to appropriate agents |

## Structure

```
agents/
├── definitions/       # Agent YAML/JSON configs
├── runtime/           # Agent runtime engine
├── tools/             # Agent tool definitions
├── prompts/           # Agent-specific prompts
└── tests/             # Agent test suite
```
