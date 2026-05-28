# Contributing to SLN AI System

Thank you for contributing! This document outlines the process and conventions for contributing to this project.

---

## 🌿 Branch Naming Convention

```
<type>/<short-description>
```

| Type | Use Case | Example |
|------|----------|---------|
| `feature/` | New feature development | `feature/add-vector-search` |
| `bugfix/` | Bug fixes | `bugfix/fix-auth-token-expiry` |
| `hotfix/` | Critical production fixes | `hotfix/patch-memory-leak` |
| `release/` | Release preparation | `release/v1.0.0` |
| `docs/` | Documentation updates | `docs/update-api-reference` |
| `chore/` | Maintenance tasks | `chore/update-dependencies` |

---

## 📝 Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

[optional body]
[optional footer]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation changes |
| `style` | Code formatting (no logic change) |
| `refactor` | Code restructuring (no feature/fix) |
| `perf` | Performance improvements |
| `test` | Adding or updating tests |
| `chore` | Build process, tooling, dependencies |
| `ci` | CI/CD configuration changes |

### Examples

```
feat(agents): add multi-agent orchestration engine
fix(auth): resolve JWT token refresh race condition
docs(api): update OpenAPI specification for v2 endpoints
chore(docker): upgrade base image to node:20-alpine
```

---

## 🔄 Pull Request Workflow

1. **Fork & Clone** the repository
2. **Create a branch** from `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes** with clear, atomic commits
4. **Push** your branch:
   ```bash
   git push origin feature/your-feature-name
   ```
5. **Open a Pull Request** targeting `develop`
6. **Fill out the PR template** completely
7. **Request review** from at least one maintainer
8. **Address feedback** and update your PR
9. **Merge** once approved (squash merge preferred)

---

## ✅ Code Review Checklist

- [ ] Code follows project conventions
- [ ] Tests are included for new functionality
- [ ] Documentation is updated
- [ ] No sensitive data (tokens, keys) in code
- [ ] Docker builds succeed
- [ ] CI pipeline passes

---

## 🔒 Security

- **Never** commit secrets, tokens, or credentials
- Use environment variables for all sensitive configuration
- Report security vulnerabilities privately to the maintainers

---

## 📞 Questions?

Open a [Discussion](https://github.com/Udaykiran0502/sln-ai-system/discussions) or reach out to the maintainers.
