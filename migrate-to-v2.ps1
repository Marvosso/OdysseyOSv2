# OdysseyOS v2 Migration Script for Windows PowerShell
# Run this script from your desired parent directory

# Set variables
$parentDir = Get-Location
$repoUrl = "https://github.com/Marvoss/odysseyos.git"
$oldRepo = "odysseyos-original"
$newRepo = "odysseyos-v2"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "OdysseyOS v2 Migration Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Clone repository
Write-Host "[1/3] Cloning repository..." -ForegroundColor Yellow
if (Test-Path $oldRepo) {
    Write-Host "  Directory $oldRepo already exists. Skipping clone." -ForegroundColor Yellow
    Write-Host "  Delete it first if you want a fresh clone." -ForegroundColor Yellow
} else {
    try {
        git clone $repoUrl $oldRepo
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✓ Repository cloned successfully" -ForegroundColor Green
        } else {
            Write-Host "  ✗ Failed to clone repository" -ForegroundColor Red
            exit 1
        }
    } catch {
        Write-Host "  ✗ Error cloning repository: $_" -ForegroundColor Red
        exit 1
    }
}

# Step 2: Create new project structure
Write-Host ""
Write-Host "[2/3] Creating new project structure..." -ForegroundColor Yellow
if (Test-Path $newRepo) {
    Write-Host "  Directory $newRepo already exists." -ForegroundColor Yellow
    $response = Read-Host "  Do you want to continue? Existing files may be overwritten. (y/N)"
    if ($response -ne "y" -and $response -ne "Y") {
        Write-Host "  Migration cancelled." -ForegroundColor Yellow
        exit 0
    }
} else {
    New-Item -ItemType Directory -Path "$newRepo\src" -Force | Out-Null
    Write-Host "  ✓ Created $newRepo directory structure" -ForegroundColor Green
}

# Step 3: Copy directories
Write-Host ""
Write-Host "[3/3] Copying directories..." -ForegroundColor Yellow

$directories = @("components", "lib", "utils", "types")
$copiedCount = 0

foreach ($dir in $directories) {
    $sourcePath = "$oldRepo\src\$dir"
    $destPath = "$newRepo\src\$dir"
    
    if (Test-Path $sourcePath) {
        try {
            Copy-Item -Path $sourcePath -Destination $destPath -Recurse -Force
            $fileCount = (Get-ChildItem -Path $destPath -Recurse -File | Measure-Object).Count
            Write-Host "  ✓ Copied $dir ($fileCount files)" -ForegroundColor Green
            $copiedCount++
        } catch {
            Write-Host "  ✗ Error copying $dir : $_" -ForegroundColor Red
        }
    } else {
        Write-Host "  ⚠ $dir not found in source" -ForegroundColor Yellow
    }
}

# Copy styles if exists
if (Test-Path "$oldRepo\styles") {
    Copy-Item -Path "$oldRepo\styles" -Destination "$newRepo\styles" -Recurse -Force
    Write-Host "  ✓ Copied styles (root)" -ForegroundColor Green
} elseif (Test-Path "$oldRepo\src\styles") {
    Copy-Item -Path "$oldRepo\src\styles" -Destination "$newRepo\src\styles" -Recurse -Force
    Write-Host "  ✓ Copied styles (src)" -ForegroundColor Green
}

# Step 4: Manual cleanup reminders
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Migration Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Directories copied: $copiedCount" -ForegroundColor White
Write-Host "  New project location: $parentDir\$newRepo" -ForegroundColor White
Write-Host ""

# Check for items that might need manual removal
Write-Host "⚠️  Manual Review Required:" -ForegroundColor Yellow
if (Test-Path "$newRepo\src\components\import") {
    Write-Host "  - Review src\components\import\ (may need to be removed if it's 'import logic')" -ForegroundColor Yellow
}
if (Test-Path "$newRepo\src\lib\storage") {
    Write-Host "  - Review src\lib\storage\ (may need to be removed if it's 'storage logic')" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✓ Migration complete!" -ForegroundColor Green
Write-Host "  Next: Review the checklist in MIGRATION_GUIDE.md" -ForegroundColor Cyan
