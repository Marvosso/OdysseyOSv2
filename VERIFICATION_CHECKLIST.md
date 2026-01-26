# OdysseyOS v2 Verification Checklist

Use this checklist after running the migration to ensure everything was copied correctly.

## Quick Verification Commands

### Windows (PowerShell)
```powershell
cd odysseyos-v2

# Count files in each directory
Write-Host "=== File Counts ===" -ForegroundColor Cyan
Write-Host "Components: $((Get-ChildItem -Path 'src\components' -Recurse -File | Measure-Object).Count)"
Write-Host "Lib: $((Get-ChildItem -Path 'src\lib' -Recurse -File | Measure-Object).Count)"
Write-Host "Types: $((Get-ChildItem -Path 'src\types' -Recurse -File | Measure-Object).Count)"
Write-Host "Utils: $((Get-ChildItem -Path 'src\utils' -Recurse -File | Measure-Object).Count)"

# Check for excluded directories
Write-Host "`n=== Exclusion Check ===" -ForegroundColor Cyan
$excluded = @("node_modules", ".next", ".git", "app", "pages", "api")
foreach ($dir in $excluded) {
    if (Test-Path $dir) {
        Write-Host "✗ $dir EXISTS (should not)" -ForegroundColor Red
    } else {
        Write-Host "✓ $dir not found (correct)" -ForegroundColor Green
    }
}

# List directory structure
Write-Host "`n=== Directory Structure ===" -ForegroundColor Cyan
Get-ChildItem -Path "src" -Recurse -Directory | Select-Object FullName
```

### macOS/Linux (bash)
```bash
cd odysseyos-v2

# Count files in each directory
echo "=== File Counts ==="
echo "Components: $(find src/components -type f 2>/dev/null | wc -l)"
echo "Lib: $(find src/lib -type f 2>/dev/null | wc -l)"
echo "Types: $(find src/types -type f 2>/dev/null | wc -l)"
echo "Utils: $(find src/utils -type f 2>/dev/null | wc -l)"

# Check for excluded directories
echo ""
echo "=== Exclusion Check ==="
for dir in node_modules .next .git app pages api; do
    if [ -d "$dir" ]; then
        echo "✗ $dir EXISTS (should not)"
    else
        echo "✓ $dir not found (correct)"
    fi
done

# List directory structure
echo ""
echo "=== Directory Structure ==="
find src -type d | sort
```

---

## Detailed Checklist

### ✅ Required Directories

- [ ] **src/components/** exists
  - [ ] Contains subdirectories (ai, beat-editor, characters, etc.)
  - [ ] Contains `.tsx` or `.ts` files
  - [ ] File count: _____ (should match original)

- [ ] **src/lib/** exists
  - [ ] Contains subdirectories (ai, data, etc.)
  - [ ] Contains `.ts` files
  - [ ] File count: _____ (should match original)

- [ ] **src/types/** exists
  - [ ] Contains `.ts` type definition files
  - [ ] File count: _____ (should match original)

- [ ] **src/utils/** exists
  - [ ] May be empty (this is OK)
  - [ ] If not empty, contains utility files

- [ ] **styles/** or **src/styles/** exists (if present in original)
  - [ ] Contains style files (`.css`, `.scss`, etc.)

### ❌ Excluded Directories (Should NOT Exist)

- [ ] **node_modules/** - NOT present
- [ ] **.next/** - NOT present
- [ ] **.git/** - NOT present
- [ ] **app/** - NOT present
- [ ] **pages/** - NOT present
- [ ] **api/** - NOT present

### ⚠️ Manual Review Required

- [ ] **src/components/import/** - Review if this should be excluded
  - [ ] Contains `StoryImport.tsx` or similar import logic?
  - [ ] Action: [ ] Keep / [ ] Remove

- [ ] **src/lib/storage/** - Review if this should be excluded
  - [ ] Contains `storyStorage.ts`, `storyParser.ts`?
  - [ ] Action: [ ] Keep / [ ] Remove

### 📊 Structure Verification

Expected structure:
```
odysseyos-v2/
└── src/
    ├── components/     [✓/✗]
    ├── lib/            [✓/✗]
    ├── types/          [✓/✗]
    ├── utils/          [✓/✗]
    └── styles/         [✓/✗] (if exists)
```

### 🔍 Sample File Check

Verify a few key files exist:
- [ ] `src/components/characters/CharacterBuilder.tsx`
- [ ] `src/lib/data/storyArchetypes.ts`
- [ ] `src/types/story.ts`
- [ ] `src/types/characters.ts`

---

## Post-Migration Actions

After verification:

1. [ ] Remove `odysseyos-original` directory (if no longer needed)
2. [ ] Initialize new git repository in `odysseyos-v2` (if needed)
3. [ ] Create new `package.json` for v2
4. [ ] Update import paths in copied files
5. [ ] Remove references to excluded directories
6. [ ] Set up new build configuration

---

## Common Issues & Solutions

### Issue: Missing files
- **Check:** Verify source repository was cloned correctly
- **Solution:** Re-run migration script

### Issue: Wrong file counts
- **Check:** Compare with original repository
- **Solution:** Manually verify specific directories

### Issue: Excluded directories present
- **Check:** Review copy commands
- **Solution:** Manually delete excluded directories

---

**Checklist completed by:** _______________  
**Date:** _______________  
**Notes:** _______________
