# ─────────────────────────────────────────────────────────────
# SLN AI Creative Operating System — Safe Commit & Push Utility
# ─────────────────────────────────────────────────────────────

Param(
    [string]$Message = "Auto-save: multi-device synchronization update"
)

Write-Host "🚀 Starting SLN AI save sequence..." -ForegroundColor Cyan

# 1. Integrity Check: Ensure we don't accidentally stage .env files
$dotenv = Test-Path -Path ".env"
if ($dotenv) {
    # Check if .env is ignored in git
    $checkIgnore = git check-ignore ".env"
    if (-not $checkIgnore) {
        Write-Warning "⚠️ Warning: '.env' is NOT ignored in Git! Please remove it or add it to .gitignore before committing."
        exit 1
    }
}

# 2. Check Git workspace changes
$status = git status --porcelain
if (-not $status) {
    Write-Host "✅ Workspace is already completely clean. No changes to save." -ForegroundColor Green
    exit 0
}

# 3. Pre-flight check: Run linters or backend tests to prevent committing broken code
Write-Host "🧪 Running pre-flight backend test suite..." -ForegroundColor Yellow
$testResult = .venv\Scripts\python -m pytest
if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ Pytest tests failed! Fix outstanding pipeline errors before pushing code to the remote repository."
    exit 1
}
Write-Host "✅ Pre-flight checks passed." -ForegroundColor Green

# 4. Stage and commit
Write-Host "📝 Staging changes and committing..." -ForegroundColor Yellow
git add -A
git commit -m $Message

# 5. Push securely
Write-Host "📤 Pushing changes to remote repository..." -ForegroundColor Yellow
git push origin HEAD
if ($LASTEXITCODE -eq 0) {
    Write-Host "🎉 Successfully saved and pushed workspace changes!" -ForegroundColor Green
} else {
    Write-Error "❌ Push failed! Run .\sync.ps1 to pull remote changes and resolve conflicts before attempting to push."
}
