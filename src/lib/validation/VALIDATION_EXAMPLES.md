# Validation Layer - Example Edge Cases

## Edge Cases Handled

### 1. Scene References Invalid Chapter

**Scenario:**
```typescript
const story = {
  id: 'story-1',
  chapters: ['chapter-1'],
  // ...
};

const chapters = [
  { id: 'chapter-1', title: 'Chapter 1', scenes: ['scene-1'], order: 1, storyId: 'story-1' }
];

const scenes = [
  { id: 'scene-1', title: 'Scene 1', chapterId: 'chapter-999', order: 1, ... } // ❌ Invalid chapter
];
```

**Validation Result:**
```typescript
{
  isValid: false,
  issues: [{
    severity: 'error',
    type: 'scene_invalid_chapter',
    message: 'Scene "Scene 1" (scene-1) references non-existent chapter: chapter-999',
    entityId: 'scene-1',
    context: { chapterId: 'chapter-999' }
  }]
}
```

**Repair:**
```typescript
// Scene assigned to first valid chapter
{
  scenes: [{
    id: 'scene-1',
    chapterId: 'chapter-1', // ✅ Fixed
    // ...
  }]
}
```

---

### 2. Missing Chapter Positions

**Scenario:**
```typescript
const chapters = [
  { id: 'chapter-1', order: 1, ... },
  { id: 'chapter-2', order: 3, ... }, // ❌ Missing position 2
  { id: 'chapter-3', order: 4, ... }
];
```

**Validation Result:**
```typescript
{
  isValid: false,
  issues: [{
    severity: 'error',
    type: 'chapter_missing_position',
    message: 'Missing chapter at position 2. Expected 3 chapters with positions 1-3',
    context: { expectedPosition: 2, totalChapters: 3 }
  }]
}
```

**Repair:**
```typescript
// Chapters renumbered to be continuous
{
  chapters: [
    { id: 'chapter-1', order: 1, ... },
    { id: 'chapter-2', order: 2, ... }, // ✅ Fixed
    { id: 'chapter-3', order: 3, ... }  // ✅ Fixed
  ]
}
```

---

### 3. Duplicate Chapter Positions

**Scenario:**
```typescript
const chapters = [
  { id: 'chapter-1', order: 1, ... },
  { id: 'chapter-2', order: 1, ... }, // ❌ Duplicate position
  { id: 'chapter-3', order: 2, ... }
];
```

**Validation Result:**
```typescript
{
  isValid: false,
  issues: [{
    severity: 'error',
    type: 'chapter_duplicate_position',
    message: 'Multiple chapters have position 1',
    context: { position: 1, count: 2 }
  }]
}
```

**Repair:**
```typescript
// Chapters renumbered sequentially
{
  chapters: [
    { id: 'chapter-1', order: 1, ... },
    { id: 'chapter-2', order: 2, ... }, // ✅ Fixed
    { id: 'chapter-3', order: 3, ... }  // ✅ Fixed
  ]
}
```

---

### 4. Scene Not in Chapter's Scenes Array

**Scenario:**
```typescript
const chapters = [
  { id: 'chapter-1', scenes: ['scene-1'], ... }
];

const scenes = [
  { id: 'scene-1', chapterId: 'chapter-1', ... }, // ✅ Correct chapter
  { id: 'scene-2', chapterId: 'chapter-1', ... }  // ❌ Not in chapter.scenes
];
```

**Validation Result:**
```typescript
{
  isValid: false,
  issues: [{
    severity: 'warning',
    type: 'scene_not_in_chapter',
    message: 'Scene "Scene 2" (scene-2) belongs to chapter chapter-1 but is not in chapter\'s scenes array',
    entityId: 'scene-2',
    context: { chapterId: 'chapter-1' }
  }]
}
```

**Repair:**
```typescript
// Scene added to chapter's scenes array
{
  chapters: [{
    id: 'chapter-1',
    scenes: ['scene-1', 'scene-2'], // ✅ Fixed
    // ...
  }]
}
```

---

### 5. Orphaned Scene

**Scenario:**
```typescript
const story = {
  chapters: ['chapter-1'],
  // ...
};

const chapters = [
  { id: 'chapter-1', scenes: ['scene-1'], ... }
];

const scenes = [
  { id: 'scene-1', chapterId: 'chapter-1', ... },
  { id: 'scene-2', chapterId: 'chapter-1', ... } // ❌ Not in any chapter
];
```

**Validation Result:**
```typescript
{
  isValid: false,
  issues: [{
    severity: 'warning',
    type: 'orphaned_scene',
    message: 'Scene "Scene 2" (scene-2) is not referenced in any chapter',
    entityId: 'scene-2',
    context: { chapterId: 'chapter-1' }
  }]
}
```

**Repair:**
```typescript
// Orphaned scene added to first chapter
{
  chapters: [{
    id: 'chapter-1',
    scenes: ['scene-1', 'scene-2'], // ✅ Fixed
    // ...
  }]
}
```

---

### 6. Orphaned Chapter

**Scenario:**
```typescript
const story = {
  chapters: ['chapter-1'], // ❌ chapter-2 not listed
  // ...
};

const chapters = [
  { id: 'chapter-1', storyId: 'story-1', ... },
  { id: 'chapter-2', storyId: 'story-1', ... } // ❌ Orphaned
];
```

**Validation Result:**
```typescript
{
  isValid: false,
  issues: [{
    severity: 'warning',
    type: 'orphaned_chapter',
    message: 'Chapter "Chapter 2" (chapter-2) is not referenced in story',
    entityId: 'chapter-2',
    context: { storyId: 'story-1' }
  }]
}
```

**Repair:**
```typescript
// Orphaned chapter added to story
{
  story: {
    chapters: ['chapter-1', 'chapter-2'], // ✅ Fixed
    // ...
  }
}
```

---

### 7. Scene Position Gaps

**Scenario:**
```typescript
const chapters = [
  { id: 'chapter-1', scenes: ['scene-1', 'scene-2', 'scene-3'], ... }
];

const scenes = [
  { id: 'scene-1', chapterId: 'chapter-1', order: 1, ... },
  { id: 'scene-2', chapterId: 'chapter-1', order: 3, ... }, // ❌ Missing position 2
  { id: 'scene-3', chapterId: 'chapter-1', order: 4, ... }
];
```

**Validation Result:**
```typescript
{
  isValid: false,
  issues: [{
    severity: 'error',
    type: 'scene_missing_position',
    message: 'Missing scene at position 2 in chapter "Chapter 1" (chapter-1)',
    entityId: 'chapter-1',
    context: { chapterId: 'chapter-1', expectedPosition: 2, totalScenes: 3 }
  }]
}
```

**Repair:**
```typescript
// Scenes renumbered to be continuous
{
  scenes: [
    { id: 'scene-1', order: 1, ... },
    { id: 'scene-2', order: 2, ... }, // ✅ Fixed
    { id: 'scene-3', order: 3, ... }  // ✅ Fixed
  ]
}
```

---

### 8. Chapter References Non-Existent Scene

**Scenario:**
```typescript
const chapters = [
  { id: 'chapter-1', scenes: ['scene-1', 'scene-999'], ... } // ❌ scene-999 doesn't exist
];

const scenes = [
  { id: 'scene-1', chapterId: 'chapter-1', ... }
];
```

**Validation Result:**
```typescript
{
  isValid: false,
  issues: [{
    severity: 'error',
    type: 'chapter_missing_scene',
    message: 'Chapter "Chapter 1" (chapter-1) references non-existent scene: scene-999',
    entityId: 'chapter-1',
    context: { sceneId: 'scene-999' }
  }]
}
```

**Repair:**
```typescript
// Invalid scene reference removed from chapter
{
  chapters: [{
    id: 'chapter-1',
    scenes: ['scene-1'], // ✅ Fixed (scene-999 removed)
    // ...
  }]
}
```

---

### 9. Story References Non-Existent Chapter

**Scenario:**
```typescript
const story = {
  chapters: ['chapter-1', 'chapter-999'], // ❌ chapter-999 doesn't exist
  // ...
};

const chapters = [
  { id: 'chapter-1', storyId: 'story-1', ... }
];
```

**Validation Result:**
```typescript
{
  isValid: false,
  issues: [{
    severity: 'error',
    type: 'story_missing_chapter',
    message: 'Story references non-existent chapter: chapter-999',
    entityId: 'story-1',
    context: { chapterId: 'chapter-999' }
  }]
}
```

**Repair:**
```typescript
// Invalid chapter reference removed from story
{
  story: {
    chapters: ['chapter-1'], // ✅ Fixed (chapter-999 removed)
    // ...
  }
}
```

---

### 10. Chapter References Wrong Story

**Scenario:**
```typescript
const story = {
  id: 'story-1',
  chapters: ['chapter-1'],
  // ...
};

const chapters = [
  { id: 'chapter-1', storyId: 'story-999', ... } // ❌ Wrong story
];
```

**Validation Result:**
```typescript
{
  isValid: false,
  issues: [{
    severity: 'error',
    type: 'chapter_wrong_story',
    message: 'Chapter "Chapter 1" (chapter-1) references wrong story: story-999 (expected story-1)',
    entityId: 'chapter-1',
    context: { expectedStoryId: 'story-1', actualStoryId: 'story-999' }
  }]
}
```

**Repair:**
```typescript
// Chapter storyId corrected
{
  chapters: [{
    id: 'chapter-1',
    storyId: 'story-1', // ✅ Fixed
    // ...
  }]
}
```

---

## Integration Examples

### After Import

```typescript
import { ValidationMiddleware } from '@/lib/validation/validationMiddleware';

const importResult = await importPipeline.execute(file);
const { story, chapters, scenes } = importResult;

// Validate and auto-repair
const validation = ValidationMiddleware.validateAfterImport(
  story,
  chapters,
  scenes,
  {
    autoRepair: true,
    onValidation: (result) => {
      console.log('Validation issues:', result.issues);
    },
    onRepair: (repair) => {
      console.log('Repairs made:', repair.messages);
    },
  }
);

if (validation.repaired) {
  // Use repaired data
  story = validation.repaired.story;
  chapters = validation.repaired.chapters;
  scenes = validation.repaired.scenes;
}
```

### After Restore

```typescript
import { ValidationMiddleware } from '@/lib/validation/validationMiddleware';

const backup = BackupManager.getLatestBackup('stories');
const { story, chapters, scenes } = backup;

// Validate and auto-repair (default)
const validation = ValidationMiddleware.validateAfterRestore(
  story,
  chapters,
  scenes,
  {
    autoRepair: true, // Default for restore
  }
);

if (validation.repaired) {
  // Use repaired data
  return validation.repaired;
}
```

### Before Save

```typescript
import { ValidationMiddleware } from '@/lib/validation/validationMiddleware';

// Before saving
const validation = ValidationMiddleware.validateBeforeSave(
  story,
  chapters,
  scenes,
  {
    autoRepair: true,
    throwOnError: true, // Fail save if can't repair
  }
);

if (validation.repaired) {
  // Save repaired data
  await storage.saveStory(validation.repaired.story);
  await storage.saveChapters(validation.repaired.chapters);
  await storage.saveScenes(validation.repaired.scenes);
}
```

---

**All edge cases handled with automatic repair strategies.** ✅
