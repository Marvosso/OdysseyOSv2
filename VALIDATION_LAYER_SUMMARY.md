# Validation Layer - Summary

## ✅ Completed

Comprehensive validation layer for story data with automatic repair capabilities.

## Files Created

1. **`src/lib/validation/storyValidator.ts`** - Core validation engine
   - `StoryValidator.validate()` - Validates story data
   - `StoryValidator.repair()` - Repairs validation issues
   - Validates scene-chapter relationships
   - Validates position continuity
   - Detects orphaned data

2. **`src/lib/validation/validationMiddleware.ts`** - Integration middleware
   - `validateAfterImport()` - Validates after import
   - `validateAfterRestore()` - Validates after restore
   - `validateBeforeSave()` - Validates before save

3. **`src/lib/validation/VALIDATION_EXAMPLES.md`** - Edge case examples

4. **`src/lib/validation/index.ts`** - Module exports

## Validation Rules

### ✅ Scene-Chapter Relationships

**Validates:**
- Scenes must reference valid chapters
- Scenes must be in chapter's scenes array
- Chapters must reference valid scenes

**Repairs:**
- Assigns orphaned scenes to first valid chapter
- Adds scenes to chapter's scenes array
- Removes invalid scene references

### ✅ Chapter Positions

**Validates:**
- Positions must be continuous (1, 2, 3, ...)
- No duplicate positions
- No missing positions
- Positions must be in valid range

**Repairs:**
- Renumbers chapters to be continuous
- Preserves relative order

### ✅ Scene Positions

**Validates:**
- Positions must be continuous within each chapter (1, 2, 3, ...)
- No duplicate positions
- No missing positions
- Positions must be in valid range

**Repairs:**
- Renumbers scenes within each chapter
- Preserves relative order

### ✅ Orphaned Data Detection

**Detects:**
- Orphaned chapters (not in story.chapters)
- Orphaned scenes (not in any chapter)
- Scenes with invalid chapter references

**Repairs:**
- Adds orphaned chapters to story
- Adds orphaned scenes to first chapter
- Assigns invalid scenes to valid chapters

## Integration Points

### 1. After Import

```typescript
import { ValidationMiddleware } from '@/lib/validation';

const result = await importPipeline.execute(file);
const validation = ValidationMiddleware.validateAfterImport(
  result.story,
  result.chapters,
  result.scenes,
  { autoRepair: true }
);

if (validation.repaired) {
  // Use repaired data
}
```

### 2. After Restore

```typescript
import { ValidationMiddleware } from '@/lib/validation';

const backup = BackupManager.getLatestBackup('stories');
const validation = ValidationMiddleware.validateAfterRestore(
  backup.story,
  backup.chapters,
  backup.scenes,
  { autoRepair: true } // Default
);
```

### 3. Before Save

```typescript
import { ValidationMiddleware } from '@/lib/validation';

const validation = ValidationMiddleware.validateBeforeSave(
  story,
  chapters,
  scenes,
  { autoRepair: true, throwOnError: true }
);

if (validation.repaired) {
  // Save repaired data
}
```

## Edge Cases Handled

1. ✅ Scene references invalid chapter
2. ✅ Missing chapter positions
3. ✅ Duplicate chapter positions
4. ✅ Scene not in chapter's scenes array
5. ✅ Orphaned scene
6. ✅ Orphaned chapter
7. ✅ Scene position gaps
8. ✅ Chapter references non-existent scene
9. ✅ Story references non-existent chapter
10. ✅ Chapter references wrong story

## Validation Result Structure

```typescript
{
  isValid: boolean,
  issues: [
    {
      severity: 'error' | 'warning' | 'info',
      type: string,
      message: string,
      entityId?: string,
      context?: Record<string, unknown>
    }
  ],
  summary: {
    errors: number,
    warnings: number,
    info: number
  }
}
```

## Repair Result Structure

```typescript
{
  success: boolean,
  repaired: {
    story?: Story,
    chapters?: Chapter[],
    scenes?: Scene[]
  },
  fixed: ValidationIssue[],
  unfixed: ValidationIssue[],
  messages: string[]
}
```

## Repair Strategies

### Scene-Chapter Relationships
- **Invalid chapter reference:** Assign to first valid chapter
- **Scene not in chapter:** Add to chapter's scenes array
- **Chapter missing scene:** Remove invalid reference

### Position Continuity
- **Missing positions:** Renumber to be continuous
- **Duplicate positions:** Renumber sequentially
- **Out-of-range positions:** Renumber to valid range

### Orphaned Data
- **Orphaned chapter:** Add to story.chapters
- **Orphaned scene:** Add to first chapter
- **Invalid chapter reference:** Assign to valid chapter

## Benefits

✅ **Data Integrity** - Ensures consistent story structure  
✅ **Automatic Repair** - Fixes issues automatically  
✅ **Comprehensive** - Validates all relationships  
✅ **Flexible** - Configurable validation options  
✅ **Integrated** - Works with import, restore, save  

## Next Steps

1. **Integration** - Integrate into storage adapters
2. **Import Pipeline** - Add validation after import
3. **Backup System** - Add validation after restore
4. **Storage Adapters** - Add validation before save
5. **UI Feedback** - Show validation issues to users

---

**Validation layer complete. Ready for integration.** ✅
