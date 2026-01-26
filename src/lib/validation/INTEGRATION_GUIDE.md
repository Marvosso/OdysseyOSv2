# Validation Layer - Integration Guide

## Integration Points

### 1. Import Pipeline Integration

**File:** `src/components/import/StoryImport.tsx`

**Current Code:**
```typescript
const parsed = StoryParser.parseTextFile(decoded.text, title);
```

**Updated Code:**
```typescript
import { ValidationMiddleware } from '@/lib/validation';

const parsed = StoryParser.parseTextFile(decoded.text, title);

// Validate and repair after import
const validation = ValidationMiddleware.validateAfterImport(
  parsed.story,
  parsed.chapters,
  parsed.scenes,
  {
    autoRepair: true,
    onValidation: (result) => {
      if (!result.isValid) {
        console.warn('Validation issues after import:', result.issues);
      }
    },
    onRepair: (repair) => {
      if (repair.messages.length > 0) {
        console.log('Auto-repaired issues:', repair.messages);
      }
    },
  }
);

// Use repaired data if available
if (validation.repaired) {
  parsed.story = validation.repaired.story;
  parsed.chapters = validation.repaired.chapters;
  parsed.scenes = validation.repaired.scenes;
}
```

---

### 2. Backup Restore Integration

**File:** `src/lib/storage/backupManager.ts`

**Current Code:**
```typescript
static getLatestBackup(baseKey: string): unknown | null {
  // ... get backup data
  return JSON.parse(backupData);
}
```

**Updated Code:**
```typescript
import { ValidationMiddleware } from '@/lib/validation';
import type { Story, Chapter, Scene } from '@/types/models';

static getLatestBackup(baseKey: string): unknown | null {
  // ... get backup data
  const backup = deserializeWithDates(backupData);
  
  // Validate and repair after restore
  if (backup && typeof backup === 'object' && 'story' in backup) {
    const data = backup as { story: Story; chapters: Chapter[]; scenes: Scene[] };
    
    const validation = ValidationMiddleware.validateAfterRestore(
      data.story,
      data.chapters || [],
      data.scenes || [],
      {
        autoRepair: true, // Always repair on restore
      }
    );
    
    if (validation.repaired) {
      return {
        story: validation.repaired.story,
        chapters: validation.repaired.chapters,
        scenes: validation.repaired.scenes,
      };
    }
  }
  
  return backup;
}
```

---

### 3. Storage Adapter Integration

**File:** `src/lib/storage/adapters/LocalStorageAdapter.ts`

**Current Code:**
```typescript
private saveAllStories(stories: Map<StoryId, Story>): void {
  const storiesArray = Array.from(stories.values());
  const jsonString = serializeWithDates(storiesArray);
  localStorage.setItem(this.storiesKey, jsonString);
}
```

**Updated Code:**
```typescript
import { ValidationMiddleware } from '@/lib/validation';
import type { Chapter, Scene } from '@/types/models';

private saveAllStories(stories: Map<StoryId, Story>): void {
  const storiesArray = Array.from(stories.values());
  
  // Validate before save (for each story)
  for (const story of storiesArray) {
    // Note: This requires chapters and scenes to be available
    // You may need to store them separately or pass them in
    // For now, this is a placeholder showing the pattern
    
    // const validation = ValidationMiddleware.validateBeforeSave(
    //   story,
    //   chapters,
    //   scenes,
    //   {
    //     autoRepair: true,
    //     throwOnError: false, // Don't fail save, just log
    //   }
    // );
  }
  
  const jsonString = serializeWithDates(storiesArray);
  localStorage.setItem(this.storiesKey, jsonString);
}
```

**Better Approach - Validate in updateStory/createStory:**
```typescript
async updateStory(
  storyId: StoryId,
  updates: Partial<Omit<Story, 'id' | 'version'>>
): Promise<StorageResult<Story>> {
  // ... existing update logic ...
  
  // Validate before saving
  const stories = this.getAllStories();
  const story = stories.get(storyId);
  
  if (story) {
    // Get chapters and scenes for this story
    // (You'll need to store these separately or pass them in)
    const chapters = this.getChaptersForStory(storyId);
    const scenes = this.getScenesForStory(storyId);
    
    const validation = ValidationMiddleware.validateBeforeSave(
      updatedStory,
      chapters,
      scenes,
      {
        autoRepair: true,
        throwOnError: false,
      }
    );
    
    if (validation.repaired) {
      // Use repaired data
      stories.set(storyId, validation.repaired.story);
    } else {
      stories.set(storyId, updatedStory);
    }
    
    this.saveAllStories(stories);
  }
  
  // ... return result ...
}
```

---

### 4. Story Parser Integration

**File:** `src/lib/storage/storyParser.ts`

**Current Code:**
```typescript
static parseTextFile(content: string, title: string = 'Imported Story'): ParsedStory {
  // ... parsing logic ...
  return { story, chapters, scenes };
}
```

**Updated Code:**
```typescript
import { ValidationMiddleware } from '@/lib/validation';

static parseTextFile(content: string, title: string = 'Imported Story'): ParsedStory {
  // ... parsing logic ...
  
  let { story, chapters, scenes } = parseResult;
  
  // Validate and repair after parsing
  const validation = ValidationMiddleware.validateAfterImport(
    story,
    chapters,
    scenes,
    {
      autoRepair: true,
    }
  );
  
  if (validation.repaired) {
    story = validation.repaired.story;
    chapters = validation.repaired.chapters;
    scenes = validation.repaired.scenes;
  }
  
  return { story, chapters, scenes };
}
```

---

## Storage Structure Considerations

### Option 1: Separate Storage for Chapters/Scenes

Store chapters and scenes separately to enable validation:

```typescript
// In LocalStorageAdapter
private readonly chaptersKey = `${this.prefix}_chapters`;
private readonly scenesKey = `${this.prefix}_scenes`;

private getChaptersForStory(storyId: StoryId): Chapter[] {
  const stored = localStorage.getItem(this.chaptersKey);
  if (!stored) return [];
  const allChapters = deserializeWithDates<Chapter[]>(stored);
  return allChapters.filter(c => c.storyId === storyId);
}

private getScenesForStory(storyId: StoryId): Scene[] {
  const stored = localStorage.getItem(this.scenesKey);
  if (!stored) return [];
  const allScenes = deserializeWithDates<Scene[]>(stored);
  const storyChapters = this.getChaptersForStory(storyId);
  const chapterIds = new Set(storyChapters.map(c => c.id));
  return allScenes.filter(s => chapterIds.has(s.chapterId));
}
```

### Option 2: Store in Story Object

Store chapters and scenes as nested data in story:

```typescript
interface StoryWithData extends Story {
  _chapters?: Chapter[];
  _scenes?: Scene[];
}
```

### Option 3: Pass Context

Pass chapters and scenes as context when validating:

```typescript
async updateStory(
  storyId: StoryId,
  updates: Partial<Omit<Story, 'id' | 'version'>>,
  context?: { chapters: Chapter[]; scenes: Scene[] }
): Promise<StorageResult<Story>> {
  // ... update logic ...
  
  if (context) {
    const validation = ValidationMiddleware.validateBeforeSave(
      updatedStory,
      context.chapters,
      context.scenes,
      { autoRepair: true }
    );
    // ... use repaired data ...
  }
}
```

---

## Recommended Integration Order

1. **Import Pipeline** - Highest priority (data comes from external source)
2. **Backup Restore** - High priority (data may be corrupted)
3. **Before Save** - Medium priority (prevent saving invalid data)
4. **Storage Adapters** - Lower priority (requires storage structure changes)

---

## Testing Integration

```typescript
// Test validation after import
const parsed = StoryParser.parseTextFile('Chapter 1\n\nContent');
const validation = ValidationMiddleware.validateAfterImport(
  parsed.story,
  parsed.chapters,
  parsed.scenes
);

expect(validation.isValid).toBe(true);

// Test validation with invalid data
const invalidData = {
  story: { ...story, chapters: ['invalid-chapter'] },
  chapters: [],
  scenes: [],
};

const validation2 = ValidationMiddleware.validateAfterImport(
  invalidData.story,
  invalidData.chapters,
  invalidData.scenes,
  { autoRepair: true }
);

expect(validation2.repaired).toBeDefined();
expect(validation2.repaired?.story.chapters).not.toContain('invalid-chapter');
```

---

**Integration guide complete. Follow recommended order for implementation.** ✅
