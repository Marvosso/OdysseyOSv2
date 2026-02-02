# Generate PWA Icons (PowerShell version)
# 
# This script generates all required PWA icon sizes using @vercel/og
# Run with: .\scripts\generate-icons.ps1
# 
# Make sure to start the dev server first: npm run dev

$iconSizes = @(72, 96, 128, 144, 152, 192, 384, 512)
$publicDir = Join-Path $PSScriptRoot ".." "public" "icons"

# Ensure icons directory exists
if (-not (Test-Path $publicDir)) {
    New-Item -ItemType Directory -Path $publicDir -Force | Out-Null
}

function Generate-Icon {
    param([int]$Size)
    
    $url = "http://localhost:3000/api/og/icon?size=$Size"
    $filePath = Join-Path $publicDir "icon-${Size}x${Size}.png"
    
    try {
        Write-Host "Generating icon ${Size}x${Size}..." -NoNewline
        Invoke-WebRequest -Uri $url -OutFile $filePath -UseBasicParsing
        Write-Host " ✓" -ForegroundColor Green
    } catch {
        Write-Host " ✗ Failed: $_" -ForegroundColor Red
        throw
    }
}

Write-Host "Starting icon generation...`n" -ForegroundColor Cyan
Write-Host "Make sure the Next.js dev server is running on port 3000`n" -ForegroundColor Yellow

foreach ($size in $iconSizes) {
    Generate-Icon -Size $size
    Start-Sleep -Milliseconds 100
}

Write-Host "`n✓ All icons generated successfully!" -ForegroundColor Green
Write-Host "Icons saved to: $publicDir" -ForegroundColor Cyan
