# ==============================================================================
# SLN AI System - Start & Sync Dev Environment
# ==============================================================================
# This script performs the following tasks:
# 1. Configures recommended local Git settings (autocrlf and rebase)
# 2. Checks local workspace status
# 3. Safely stashes uncommitted changes (if any)
# 4. Pulls latest changes from the current tracking branch using rebase
# 5. Restores stashed changes (if any)
# 6. Starts the Docker Compose development environment
# ==============================================================================

Write-Host "🔄 [SLN Dev Sync] Starting synchronization process..." -ForegroundColor Cyan

# 1. Configure local Windows Git settings for consistency across devices
Write-Host "⚙️ [SLN Dev Sync] Setting local Git configs..." -ForegroundColor Gray
git config core.autocrlf true
git config pull.rebase true

# 2. Check for local changes
$status = git status --porcelain
$hasChanges = $null -ne $status -and $status.Trim() -ne ""

if ($hasChanges) {
    Write-Host "📦 [SLN Dev Sync] Uncommitted changes detected. Creating temporary stash..." -ForegroundColor Yellow
    git stash save "temp-sync-stash-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
}

# 3. Fetch and pull latest changes
Write-Host "📥 [SLN Dev Sync] Fetching and pulling latest changes (rebase)..." -ForegroundColor Cyan
git fetch origin
$branch = git branch --show-current
$pullResult = git pull --rebase origin $branch

if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ [SLN Dev Sync] Failed to pull changes. Please resolve conflicts manually before running again."
    if ($hasChanges) {
        Write-Host "💡 [SLN Dev Sync] You can restore your temporary stash with: git stash pop" -ForegroundColor Yellow
    }
    Exit 1
}

# 4. Restore stashed changes if any
if ($hasChanges) {
    Write-Host "📦 [SLN Dev Sync] Restoring local uncommitted changes..." -ForegroundColor Yellow
    git stash pop
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "⚠️ [SLN Dev Sync] Conflicts detected while applying stashed changes. Please resolve them."
    }
}

# 5. Start Docker Environment
Write-Host "🐳 [SLN Dev Sync] Spinning up Docker containers..." -ForegroundColor Green
if (Test-Path "docker/docker-compose.yml") {
    docker compose -f docker/docker-compose.yml up -d
} else {
    Write-Warning "⚠️ [SLN Dev Sync] docker/docker-compose.yml not found. Skipping container startup."
}

Write-Host "✅ [SLN Dev Sync] Local environment is synchronized and ready!" -ForegroundColor Green
Write-Host "💡 Happy coding! Run .\save.ps1 to commit and push changes when done." -ForegroundColor Cyan
