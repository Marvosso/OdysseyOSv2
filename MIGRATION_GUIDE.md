# OdysseyOS v2 Migration Guide

## Overview
This guide provides step-by-step instructions to clone the repository and create a clean `odysseyos-v2` project with only the specified directories.

---

## Step 1: Clone the Repository

### Windows (PowerShell)
```powershell
# Navigate to your desired parent directory
cd C:\Users\butus\OneDrive\Documents

# Clone the repository
git clone https://github.com/Marvoss/odysseyos.git odysseyos-original
```

### macOS/Linux (bash)
```bash
# Navigate to your desired parent directory
cd ~/Documents  # or your preferred location

# Clone the repository
git clone https://github.com/Marvoss/odysseyos.git odysseyos-original
```

**Note:** If the repository is private, ensure you have:
- SSH keys configured, OR
- Personal Access Token for HTTPS authentication

---

## Step 2: Create New Project Directory

### Windows (PowerShell)
```powershell
# Create the new project directory
New-Item -ItemType Directory -Path "odysseyos-v2" -Force
New-Item -ItemType Directory -Path "odysseyos-v2\src" -Force
```

### macOS/Linux (bash)
```bash
# Create the new project directory
mkdir -p odysseyos-v2/src
```

---

## Step 3: Copy Selected Directories

### Windows (PowerShell)
```powershell
# Navigate to the cloned repository
cd odysseyos-original

# Copy components directory (if it exists in src/)
if (Test-Path "src\components") {
    Copy-Item -Path "src\components" -Destination "..\odysseyos-v2\src\components" -Recurse -Force
    Write-Host "✓ Copied components" -ForegroundColor Green
}

# Copy lib directory
if (Test-Path "src\lib") {
    Copy-Item -Path "src\lib" -Destination "..\odysseyos-v2\src\lib" -Recurse -Force
    Write-Host "✓ Copied lib" -ForegroundColor Green
}

# Copy utils directory
if (Test-Path "src\utils") {
    Copy-Item -Path "src\utils" -Destination "..\odysseyos-v2\src\utils" -Recurse -Force
    Write-Host "✓ Copied utils" -ForegroundColor Green
}

# Copy types directory
if (Test-Path "src\types") {
    Copy-Item -Path "src\types" -Destination "..\odysseyos-v2\src\types" -Recurse -Force
    Write-Host "✓ Copied types" -ForegroundColor Green
}

# Copy styles directory (if it exists at root or in src/)
if (Test-Path "styles") {
    Copy-Item -Path "styles" -Destination "..\odysseyos-v2\styles" -Recurse -Force
    Write-Host "✓ Copied styles (root)" -ForegroundColor Green
} elseif (Test-Path "src\styles") {
    Copy-Item -Path "src\styles" -Destination "..\odysseyos-v2\src\styles" -Recurse -Force
    Write-Host "✓ Copied styles (src)" -ForegroundColor Green
}

cd ..
```

### macOS/Linux (bash)
```bash
# Navigate to the cloned repository
cd odysseyos-original

# Copy components directory (if it exists in src/)
if [ -d "src/components" ]; then
    cp -r src/components ../odysseyos-v2/src/
    echo "✓ Copied components"
fi

# Copy lib directory
if [ -d "src/lib" ]; then
    cp -r src/lib ../odysseyos-v2/src/
    echo "✓ Copied lib"
fi

# Copy utils directory
if [ -d "src/utils" ]; then
    cp -r src/utils ../odysseyos-v2/src/
    echo "✓ Copied utils"
fi

# Copy types directory
if [ -d "src/types" ]; then
    cp -r src/types ../odysseyos-v2/src/
    echo "✓ Copied types"
fi

# Copy styles directory (if it exists at root or in src/)
if [ -d "styles" ]; then
    cp -r styles ../odysseyos-v2/
    echo "✓ Copied styles (root)"
elif [ -d "src/styles" ]; then
    cp -r src/styles ../odysseyos-v2/src/
    echo "✓ Copied styles (src)"
fi

cd ..
```

---

## Step 4: All-in-One Scripts

### Windows (PowerShell) - Complete Script
```powershell
# Set variables
$parentDir = "C:\Users\butus\OneDrive\Documents"  # Adjust as needed
$repoUrl = "https://github.com/Marvoss/odysseyos.git"
$oldRepo = "odysseyos-original"
$newRepo = "odysseyos-v2"

# Navigate to parent directory
cd $parentDir

# Clone repository
Write-Host "Cloning repository..." -ForegroundColor Cyan
git clone $repoUrl $oldRepo

# Create new project structure
Write-Host "Creating new project structure..." -ForegroundColor Cyan
New-Item -ItemType Directory -Path "$newRepo\src" -Force | Out-Null

# Copy directories
Write-Host "Copying directories..." -ForegroundColor Cyan
$directories = @("components", "lib", "utils", "types")
foreach ($dir in $directories) {
    $sourcePath = "$oldRepo\src\$dir"
    if (Test-Path $sourcePath) {
        Copy-Item -Path $sourcePath -Destination "$newRepo\src\$dir" -Recurse -Force
        Write-Host "  ✓ Copied $dir" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $dir not found" -ForegroundColor Yellow
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

Write-Host "`nMigration complete! Check $newRepo directory." -ForegroundColor Green
```

### macOS/Linux (bash) - Complete Script
```bash
#!/bin/bash

# Set variables
PARENT_DIR="$HOME/Documents"  # Adjust as needed
REPO_URL="https://github.com/Marvoss/odysseyos.git"
OLD_REPO="odysseyos-original"
NEW_REPO="odysseyos-v2"

# Navigate to parent directory
cd "$PARENT_DIR" || exit

# Clone repository
echo "Cloning repository..."
git clone "$REPO_URL" "$OLD_REPO"

# Create new project structure
echo "Creating new project structure..."
mkdir -p "$NEW_REPO/src"

# Copy directories
echo "Copying directories..."
for dir in components lib utils types; do
    if [ -d "$OLD_REPO/src/$dir" ]; then
        cp -r "$OLD_REPO/src/$dir" "$NEW_REPO/src/"
        echo "  ✓ Copied $dir"
    else
        echo "  ✗ $dir not found"
    fi
done

# Copy styles if exists
if [ -d "$OLD_REPO/styles" ]; then
    cp -r "$OLD_REPO/styles" "$NEW_REPO/"
    echo "  ✓ Copied styles (root)"
elif [ -d "$OLD_REPO/src/styles" ]; then
    cp -r "$OLD_REPO/src/styles" "$NEW_REPO/src/"
    echo "  ✓ Copied styles (src)"
fi

echo ""
echo "Migration complete! Check $NEW_REPO directory."
```

---

## Verification Checklist

After running the migration, verify the following:

### Directory Structure Check
- [ ] `odysseyos-v2/src/components/` exists and contains subdirectories
- [ ] `odysseyos-v2/src/lib/` exists and contains subdirectories
- [ ] `odysseyos-v2/src/utils/` exists (may be empty)
- [ ] `odysseyos-v2/src/types/` exists and contains `.ts` files
- [ ] `odysseyos-v2/styles/` or `odysseyos-v2/src/styles/` exists (if present in original)

### Exclusion Verification
- [ ] No `node_modules/` directory in odysseyos-v2
- [ ] No `.next/` directory in odysseyos-v2
- [ ] No `.git/` directory in odysseyos-v2
- [ ] No `app/` directory in odysseyos-v2
- [ ] No `pages/` directory in odysseyos-v2
- [ ] No `api/` directory in odysseyos-v2
- [ ] No import logic files (check for `StoryImport.tsx` - should NOT be copied if it's import logic)
- [ ] No storage logic files (check for `storyStorage.ts`, `storyParser.ts` - should NOT be copied if they're storage logic)

### File Count Verification
Run these commands to verify file counts:

**Windows (PowerShell):**
```powershell
cd odysseyos-v2
Write-Host "Components:" (Get-ChildItem -Path "src\components" -Recurse -File | Measure-Object).Count
Write-Host "Lib:" (Get-ChildItem -Path "src\lib" -Recurse -File | Measure-Object).Count
Write-Host "Types:" (Get-ChildItem -Path "src\types" -Recurse -File | Measure-Object).Count
```

**macOS/Linux (bash):**
```bash
cd odysseyos-v2
echo "Components: $(find src/components -type f | wc -l)"
echo "Lib: $(find src/lib -type f | wc -l)"
echo "Types: $(find src/types -type f | wc -l)"
```

---

## Expected Directory Tree

```
odysseyos-v2/
└── src/
    ├── components/
    │   ├── ai/
    │   ├── beat-editor/
    │   ├── block-breaker/
    │   ├── branching/
    │   ├── characters/
    │   ├── collaboration/
    │   ├── dna-analyzer/
    │   ├── export/
    │   ├── guidance/
    │   ├── import/          # ⚠️ Check if this should be excluded
    │   ├── music/
    │   ├── outline/
    │   ├── player/
    │   ├── publishing/
    │   ├── stories/
    │   ├── story-dna/
    │   ├── streaks/
    │   ├── ui/
    │   ├── visualization/
    │   ├── voice-trainer/
    │   ├── world-builder/
    │   ├── world-building/
    │   └── writing-coach/
    ├── lib/
    │   ├── ai/
    │   ├── data/
    │   └── storage/         # ⚠️ Check if this should be excluded
    ├── types/
    │   ├── ai.ts
    │   ├── analysis.ts
    │   ├── beat.ts
    │   ├── branch.ts
    │   ├── characters.ts
    │   ├── collab.ts
    │   ├── guidance.ts
    │   ├── music.ts
    │   ├── outline.ts
    │   ├── publish.ts
    │   ├── story.ts
    │   ├── streak.ts
    │   ├── voice.ts
    │   └── world.ts
    ├── utils/               # May be empty
    └── styles/              # Only if present in original
```

---

## ⚠️ Important Warnings

### 1. Import Logic Exclusion
- **Check:** `src/components/import/StoryImport.tsx` - If this is "import logic" as specified, you may need to exclude the entire `import/` directory
- **Action:** Review the contents and manually remove if needed

### 2. Storage Logic Exclusion
- **Check:** `src/lib/storage/storyStorage.ts` and `src/lib/storage/storyParser.ts` - If these are "storage logic" as specified, exclude the `storage/` directory
- **Action:** After copying, manually delete `src/lib/storage/` if it should be excluded

### 3. Repository Access
- If the repository is private, you'll need authentication
- For HTTPS: Use a Personal Access Token
- For SSH: Ensure your SSH key is added to GitHub

### 4. Path Differences
- Windows uses backslashes (`\`) in paths
- macOS/Linux use forward slashes (`/`)
- The scripts above handle this automatically

### 5. Empty Directories
- Some directories (like `utils/`) may be empty
- This is normal - they're preserved for future use

### 6. File Permissions (macOS/Linux)
- The `cp -r` command preserves permissions
- If you encounter permission issues, use `sudo` (not recommended) or check file ownership

### 7. Hidden Files
- The copy commands will copy hidden files (files starting with `.`)
- If you want to exclude them, add `-Exclude ".*"` (PowerShell) or use `rsync` with `--exclude` (bash)

---

## Manual Cleanup (If Needed)

If you accidentally copied something you shouldn't have:

### Windows (PowerShell)
```powershell
cd odysseyos-v2

# Remove storage logic
Remove-Item -Path "src\lib\storage" -Recurse -Force -ErrorAction SilentlyContinue

# Remove import component (if needed)
Remove-Item -Path "src\components\import" -Recurse -Force -ErrorAction SilentlyContinue
```

### macOS/Linux (bash)
```bash
cd odysseyos-v2

# Remove storage logic
rm -rf src/lib/storage

# Remove import component (if needed)
rm -rf src/components/import
```

---

## Next Steps

After migration:
1. Initialize a new git repository in `odysseyos-v2` (if needed)
2. Create a new `package.json` for the v2 project
3. Set up new build configuration
4. Review and update imports in copied files
5. Remove any references to excluded directories

---

## Troubleshooting

### Issue: "Repository not found"
- **Solution:** Check if the repository is private and you have access
- **Alternative:** If you have the repo locally, adjust the paths in the scripts

### Issue: "Permission denied" (macOS/Linux)
- **Solution:** Check directory permissions: `ls -la`
- **Fix:** `chmod -R 755 odysseyos-v2`

### Issue: Files not copying
- **Solution:** Verify source paths exist: `Test-Path` (PowerShell) or `[ -d ]` (bash)
- **Check:** Ensure you're in the correct directory before running commands

---

**Last Updated:** Generated for OdysseyOS v2 migration
