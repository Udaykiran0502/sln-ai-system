# Multi-Device Windows Setup Guide for SLN AI System

This guide outlines how to configure both your Windows Desktop and Laptop to build, run, and synchronize the `sln-ai-system` repository seamlessly.

---

## 🛠️ Step 1: Initial Device (Device 1) Configuration

If you are initializing the project from Device 1:
1. Make sure Git is configured correctly with your identity:
   ```powershell
   git config --global user.name "Udaykiran"
   git config --global user.email "udaykiran0502@gmail.com"
   ```
2. Set your line-endings to standard Windows format:
   ```powershell
   git config --global core.autocrlf true
   ```
3. Initialize the repository, add the files, commit, and push to GitHub (we will run these initialization steps in the terminal shortly).

---

## 💻 Step 2: Second Device (Device 2) Setup

On your second Windows device:
1. **Prerequisites**: Install [Git for Windows](https://gitforwindows.org/) and [Docker Desktop](https://www.docker.com/products/docker-desktop/). Make sure Docker Desktop is active.
2. **Git Authentication**: Open a terminal and authenticate with GitHub (HTTPS PAT or SSH recommended).
3. **Configure Git Identity**:
   ```powershell
   git config --global user.name "Udaykiran"
   git config --global user.email "udaykiran0502@gmail.com"
   git config --global core.autocrlf true
   ```
4. **Clone the Repository**:
   ```powershell
   git clone https://github.com/Udaykiran0502/sln-ai-system.git
   cd sln-ai-system
   ```
5. **Environment Configuration**: Copy the env template file and fill in your keys:
   ```powershell
   Copy-Item .env.example .env
   ```

---

## 🤖 Step 3: Antigravity GitHub MCP Integration

To enable Antigravity to manage issues, commits, PRs, and branch operations from both systems:

1. **Obtain GitHub Token**: Generate a Classic Personal Access Token (PAT) via your GitHub Account Settings -> Developer Settings -> Personal Access Tokens -> Tokens (Classic) with the following scopes:
   - `repo` (Full control)
   - `workflow` (Required if managing Action workflows)
   - `admin:org` (Optional)
   - `delete_repo` (Optional)

2. **Add MCP Configuration to Antigravity**:
   Open Antigravity's settings on both your Laptop and Desktop and append the following configuration:

```json
{
  "mcpServers": {
    "github": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "GITHUB_TOKEN",
        "ghcr.io/github/github-mcp-server"
      ],
      "env": {
        "GITHUB_TOKEN": "YOUR_ACTUAL_PERSONAL_ACCESS_TOKEN"
      }
    }
  }
}
```

3. **Verify Connection**:
   Once saved, verify that GitHub tool icons/commands are visible in your Antigravity context.

---

## 🔄 Step 4: The Developer Sync Loop (Daily Routine)

To ensure zero merge conflicts and immediate environmental consistency:

### 🌅 Starting a Session (Desktop or Laptop)
Before you write any code:
1. Open PowerShell in the root directory.
2. Run:
   ```powershell
   .\sync.ps1
   ```
   *This automatically pulls latest changes from GitHub (using rebase to keep history clean) and boots up your local database/caches inside Docker.*

### 🌇 Ending a Session (Desktop or Laptop)
When you've reached a stable working state or need to switch devices:
1. Open PowerShell in the root directory.
2. Run:
   ```powershell
   .\save.ps1
   ```
   *This stops your local Docker compose containers to free up system resources, stages all changed files, prompts you for a commit message (with an AI-generated fallback if blank), pulls any mid-session remote updates safely via rebase, and pushes to GitHub.*

---

## ⚠️ Avoid Conflicts & Drift

- **Never force push** (`git push --force`) unless absolutely necessary on personal branches. Always let the scripts handle rebasing.
- **Run services inside Docker**: Do not install PostgreSQL or Redis directly on the Windows host. This ensures that database ports, versions, and configurations are identical on both Desktop and Laptop.
- **Add secrets to `.env` only**: Never commit keys. `.env` is ignored by Git, ensuring local configuration stays completely private on each machine.
