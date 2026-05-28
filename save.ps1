# ==============================================================================
# SLN AI System - Save & Push Dev Environment
# ==============================================================================
# This script performs the following tasks:
# 1. Stops the Docker Compose development environment to release resources
# 2. Checks local workspace status
# 3. Prompts the user for a commit message
# 4. Adds all changes, commits them, and pushes them safely to GitHub
# ==============================================================================

Write-Host "💾 [SLN Dev Save] Shutting down environment and saving progress..." -ForegroundColor Cyan

# 1. Spin down Docker Compose to release system resources (highly recommended on laptops)
Write-Host "🐳 [SLN Dev Save] Stopping Docker containers..." -ForegroundColor Gray
if (Test-Path "docker/docker-compose.yml") {
    docker compose -f docker/docker-compose.yml down
}

# 2. Check for local changes
$status = git status --porcelain
$hasChanges = $null -ne $status -and $status.Trim() -ne ""

if (-not $hasChanges) {
    Write-Host "✅ [SLN Dev Save] No changes to save. Clean workspace." -ForegroundColor Green
    Exit 0
}

Write-Host "📝 [SLN Dev Save] Uncommitted changes detected:" -ForegroundColor Yellow
git status -s

# 3. Prompt for commit message
$commitMsg = Read-Host "💬 Enter commit message (or press enter for automatic AI commit)"

if ([string]::IsNullOrWhitespace($commitMsg)) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $hostname = [System.Net.Dns]::GetHostName()
    $commitMsg = "chore: auto-sync from $hostname on $timestamp"
    Write-Host "🤖 [SLN Dev Save] No message entered. Using auto-generated message: '$commitMsg'" -ForegroundColor Gray
}

# 4. Add, commit and push changes safely
Write-Host "📤 [SLN Dev Save] Staging and committing changes..." -ForegroundColor Gray
git add -A
git commit -m $commitMsg

Write-Host "📥 [SLN Dev Save] Fetching and re-verifying remote status before push..." -ForegroundColor Gray
git fetch origin
$branch = git branch --show-current

# Attempt rebase to avoid simple fast-forward rejection conflicts
Write-Host "📥 [SLN Dev Save] Re-aligning with remote branch (rebase)..." -ForegroundColor Gray
git pull --rebase origin $branch

if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ [SLN Dev Save] Failed to rebase remote changes. Please resolve merge conflicts manually."
    Exit 1
}

Write-Host "🚀 [SLN Dev Save] Pushing changes to GitHub..." -ForegroundColor Cyan
git push origin $branch

if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ [SLN Dev Save] Failed to push changes to GitHub."
    Exit 1
}

Write-Host "✅ [SLN Dev Save] All changes successfully committed and pushed to remote repository!" -ForegroundColor Green
