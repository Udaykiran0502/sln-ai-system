# ─────────────────────────────────────────────────────────────
# SLN AI Creative Operating System — Secure GitHub CLI Login
# ─────────────────────────────────────────────────────────────

Write-Host "🔐 Secure GitHub CLI Login Utility" -ForegroundColor Cyan
Write-Host "This script will prompt you for your GitHub Personal Access Token (PAT)." -ForegroundColor White
Write-Host "It handles the token as a SecureString and pipes it directly to the GitHub CLI." -ForegroundColor White
Write-Host "The token will NEVER be written to disk, exposed in logs, or printed in the terminal." -ForegroundColor Green
Write-Host ""

$SecureToken = Read-Host -Prompt "Enter your GitHub Personal Access Token (PAT)" -AsSecureString
if (-not $SecureToken) {
    Write-Error "❌ Login cancelled: Personal Access Token cannot be empty."
    exit 1
}

# Convert SecureString to plain text safely in memory and pipe to gh auth login
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecureToken)
$PlainTextToken = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

# Clear BSTR from memory for absolute security
[System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)

# Pipe directly to the gh executable
$PlainTextToken | & "C:\Program Files\GitHub CLI\gh.exe" auth login --with-token

if ($LASTEXITCODE -eq 0) {
    Write-Host "🎉 Successfully authenticated GitHub CLI securely!" -ForegroundColor Green
    
    # Store token temporarily in git credential helper to allow secure pushing/pulling
    & "C:\Program Files\GitHub CLI\gh.exe" auth setup-git
    Write-Host "✅ Git credential helper successfully configured for GitHub." -ForegroundColor Green
} else {
    Write-Error "❌ Authentication failed! Please verify your token permissions (requires repo, read:org scopes)."
}
