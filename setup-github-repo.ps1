# PowerShell script to set up and push to new GitHub repository
# Usage: .\setup-github-repo.ps1 <github-repo-url>

param(
    [Parameter(Mandatory=$true)]
    [string]$RepoUrl
)

Write-Host "Setting up Git repository and pushing to GitHub..." -ForegroundColor Green

# Check if git is installed
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Git is not installed. Please install Git first." -ForegroundColor Red
    exit 1
}

# Initialize git repository if not already initialized
if (-not (Test-Path .git)) {
    Write-Host "Initializing Git repository..." -ForegroundColor Yellow
    git init
} else {
    Write-Host "Git repository already initialized." -ForegroundColor Yellow
}

# Add all files
Write-Host "Adding files to Git..." -ForegroundColor Yellow
git add .

# Create initial commit
Write-Host "Creating initial commit..." -ForegroundColor Yellow
git commit -m "Initial commit: OdysseyOS v2 with data integrity features

- Autosave race condition prevention
- Backup and restore system
- Transaction support
- Date serialization fixes
- Import pipeline edge case handling
- Validation layer
- Comprehensive test suite"

# Add remote (remove if exists, then add)
Write-Host "Setting up remote repository..." -ForegroundColor Yellow
git remote remove origin 2>$null
git remote add origin $RepoUrl

# Push to GitHub
Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
Write-Host "Note: You may be prompted for GitHub credentials." -ForegroundColor Cyan

# Try to push (user will need to authenticate)
git branch -M main
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "Successfully pushed to GitHub!" -ForegroundColor Green
} else {
    Write-Host "Push failed. You may need to:" -ForegroundColor Red
    Write-Host "1. Authenticate with GitHub (use Personal Access Token)" -ForegroundColor Yellow
    Write-Host "2. Or use SSH: git remote set-url origin git@github.com:USERNAME/REPO.git" -ForegroundColor Yellow
    Write-Host "3. Then run: git push -u origin main" -ForegroundColor Yellow
}
