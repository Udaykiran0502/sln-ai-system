# Prompts

Prompt templates and management for the SLN AI System.

## Overview

Centralized prompt template library with versioning, composition, and testing support.

## Structure

```
prompts/
├── system/            # System prompts for agents
├── task/              # Task-specific prompts
├── templates/         # Reusable prompt templates
├── examples/          # Few-shot examples
└── tests/             # Prompt evaluation tests
```

## Template Format

Prompts use Jinja2-style templating:

```
You are a {{ role }} agent.
Your task is to {{ task_description }}.
Context: {{ context }}
```
