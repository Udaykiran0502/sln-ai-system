# Infrastructure

Infrastructure-as-Code and cloud configurations for the SLN AI System.

## Overview

Manages cloud infrastructure provisioning, networking, and resource management.

## Structure

```
infrastructure/
├── terraform/         # Terraform configurations
├── kubernetes/        # K8s manifests & Helm charts
├── scripts/           # Infrastructure scripts
├── monitoring/        # Observability configs
└── environments/      # Per-environment configs
    ├── dev/
    ├── staging/
    └── production/
```
