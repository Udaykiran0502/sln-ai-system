# Authentication & Authorization

Auth module for the SLN AI System.

## Overview

Handles user authentication, API key management, RBAC, and session management.

## Features

- JWT-based authentication
- API key management
- Role-based access control (RBAC)
- OAuth2 / SSO integration
- Rate limiting & throttling

## Structure

```
auth/
├── providers/         # Auth providers (JWT, OAuth, API Key)
├── middleware/         # Auth middleware
├── rbac/              # Role & permission definitions
├── session/           # Session management
└── config/            # Auth configuration
```
