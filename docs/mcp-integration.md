# MCP Integration Guide

## GitHub MCP Server

The GitHub MCP server enables Antigravity to directly manage GitHub repositories, issues, PRs, and workflows.

### Configuration

Add the following to your Antigravity MCP settings:

```json
{
  "mcpServers": {
    "github": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-e", "GITHUB_TOKEN",
        "ghcr.io/github/github-mcp-server"
      ],
      "env": {
        "GITHUB_TOKEN": "<YOUR_GITHUB_PAT>"
      }
    }
  }
}
```

### Required Token Scopes

| Scope | Purpose |
|-------|---------|
| `repo` | Full control of private repositories |
| `workflow` | Update GitHub Action workflows |
| `admin:org` | Organization management (optional) |
| `delete_repo` | Repository deletion (optional) |

### Available Tools

Once configured, the following GitHub tools become available:

- **Repository Management**: Create, list, fork, search repositories
- **Branch Operations**: Create, list, delete branches
- **Commit Operations**: Create, list commits
- **Pull Requests**: Create, list, merge, review PRs
- **Issues**: Create, list, update, close issues
- **Workflows**: Trigger, list GitHub Action runs
- **File Operations**: Read, create, update file contents

---

## Optional MCP Servers

### Filesystem MCP

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-filesystem", "/path/to/project"]
    }
  }
}
```

### Docker MCP

```json
{
  "mcpServers": {
    "docker": {
      "command": "docker",
      "args": ["run", "-i", "--rm",
        "-v", "/var/run/docker.sock:/var/run/docker.sock",
        "mcp/docker"
      ]
    }
  }
}
```

### PostgreSQL MCP

```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-postgres",
        "postgresql://user:pass@localhost:5432/db"
      ]
    }
  }
}
```

---

## Security Best Practices

1. **Never commit tokens** — Use environment variables
2. **Rotate tokens regularly** — Every 90 days recommended
3. **Use least-privilege scopes** — Only grant required permissions
4. **Audit MCP access** — Review GitHub audit logs periodically
5. **Use fine-grained PATs** — Prefer repository-scoped tokens over classic tokens
