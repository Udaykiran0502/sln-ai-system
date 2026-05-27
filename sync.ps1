# ─────────────────────────────────────────────────────────────
# SLN AI Creative Operating System — Resilient Pull & Sync Utility
# ─────────────────────────────────────────────────────────────

Write-Host "🚀 Starting SLN AI sync sequence..." -ForegroundColor Cyan

# 1. Stash current uncommitted changes to protect workspace state
$status = git status --porcelain
$hasLocalChanges = $null -ne $status -and $status.Trim() -ne ""
$stashed = $false

if ($hasLocalChanges) {
    Write-Host "📦 Found uncommitted local changes. Stashing temporarily for state protection..." -ForegroundColor Yellow
    git stash save "SLN Auto-stash: Multi-device sync protection"
    $stashed = $true
}

# 2. Pull remote changes with safe rebase to avoid messy merge loops
Write-Host "📥 Pulling latest changes from remote (with auto-rebase)..." -ForegroundColor Yellow
git pull --rebase origin master
$pullExitCode = $LASTEXITCODE

# 3. Restore stashed changes if we stashed them
if ($stashed) {
    Write-Host "📦 Restoring your stashed local changes..." -ForegroundColor Yellow
    git stash pop
}

if ($pullExitCode -ne 0) {
    Write-Error "❌ Rebase/Pull encountered errors. Please resolve any merge conflicts manually."
    exit 1
}

# 4. Post-sync Dependency Sync
Write-Host "🔄 Synchronizing project dependencies..." -ForegroundColor Yellow

# Check if requirements.txt changed in the last fetch
$reqsChanged = git diff HEAD@{1} --name-only | Select-String "requirements.txt"
if ($reqsChanged) {
    Write-Host "🐍 Requirements updated! Upgrading Python dependencies..." -ForegroundColor Cyan
    .venv\Scripts\python -m pip install -r requirements.txt
}

# Check if package.json changed
$packageChanged = git diff HEAD@{1} --name-only | Select-String "package.json"
if ($packageChanged) {
    Write-Host "⚛️ Package.json updated! Upgrading Node modules..." -ForegroundColor Cyan
    Set-Location -Path "frontend_react"
    npm install
    Set-Location -Path ".."
}

Write-Host "✅ Workspace is completely up-to-date and ready for development!" -ForegroundColor Green
