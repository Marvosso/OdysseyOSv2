# Test Suite Specification - Data Integrity Focus

## Overview

Minimal but sufficient test suite focused on data integrity for OdysseyOS.
Prioritizes critical data loss scenarios and edge cases.

## Test Categories

### 1. Autosave Race Conditions
### 2. Backup & Restore
### 3. Import Edge Cases
### 4. Encoding Safety
### 5. Scene/Chapter Consistency

---

## 1. Autosave Race Conditions

### Unit Tests

#### Test 1.1: Debounce Cancellation
```typescript
describe('useAutosaveQueue - Debounce Cancellation', () => {
  it('should cancel previous save when new edit occurs', async () => {
    const saveFn = jest.fn();
    const { result } = renderHook(() => 
      useAutosaveQueue('data', saveFn, { key: 'test', delay: 1000 })
    );
    
    // Rapid updates
    act(() => {
      result.current.queueSave('A');
      result.current.queueSave('AB');
      result.current.queueSave('ABC');
    });
    
    await waitFor(() => {
      expect(saveFn).toHaveBeenCalledTimes(1);
      expect(saveFn).toHaveBeenCalledWith('ABC'); // Only newest
    });
  });
});
```

**Mock:** `setTimeout`, `clearTimeout`  
**Real:** Autosave queue logic

#### Test 1.2: Timestamp-Based Ordering
```typescript
describe('AutosaveQueue - Timestamp Ordering', () => {
  it('should only execute newest save', async () => {
    const saves: string[] = [];
    const saveFn = (data: string) => saves.push(data);
    
    // Simulate concurrent saves
    autosaveQueue.queueSave('key', 'A', saveFn);
    await new Promise(r => setTimeout(r, 50));
    autosaveQueue.queueSave('key', 'B', saveFn);
    await new Promise(r => setTimeout(r, 50));
    autosaveQueue.queueSave('key', 'C', saveFn);
    
    await waitFor(() => {
      expect(saves).toEqual(['C']); // Only newest
    });
  });
});
```

**Mock:** None (use real queue)  
**Real:** Autosave queue implementation

#### Test 1.3: Concurrent Component Saves
```typescript
describe('AutosaveQueue - Concurrent Components', () => {
  it('should prevent last write wins', async () => {
    const saves: string[] = [];
    
    // Component A saves
    const saveA = createDebouncedAutosave('data', async (d) => {
      saves.push(`A:${d}`);
    }, 100);
    
    // Component B saves
    const saveB = createDebouncedAutosave('data', async (d) => {
      saves.push(`B:${d}`);
    }, 100);
    
    // Both save simultaneously
    saveA('data1');
    saveB('data2');
    
    await waitFor(() => {
      expect(saves).toHaveLength(1);
      expect(saves[0]).toBe('B:data2'); // Newest wins
    });
  });
});
```

**Mock:** None  
**Real:** Queue implementation

### Integration Tests

#### Test 1.4: Rapid Typing Scenario
```typescript
describe('Autosave - Rapid Typing Integration', () => {
  it('should handle rapid typing without data loss', async () => {
    const storage = new InMemoryAdapter();
    const adapter = new TransactionStorageAdapter(storage);
    
    const story = createMockStory();
    await adapter.createStory(story);
    
    // Simulate rapid typing
    const updates = ['H', 'He', 'Hel', 'Hell', 'Hello'];
    for (const update of updates) {
      await adapter.updateStory(story.id, { title: update });
      await new Promise(r => setTimeout(r, 50)); // Rapid updates
    }
    
    const final = await adapter.getStory(story.id);
    expect(final.data?.title).toBe('Hello'); // Latest update
  });
});
```

**Mock:** `InMemoryAdapter` (no real localStorage)  
**Real:** Transaction system, autosave queue

---

## 2. Backup & Restore

### Unit Tests

#### Test 2.1: Backup Creation
```typescript
describe('BackupManager - Backup Creation', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  
  it('should create backup before save', () => {
    const data = [{ id: 'story-1', title: 'Test' }];
    BackupManager.createBackup(data, 'test_key');
    
    const backup = BackupManager.getLatestBackup('test_key');
    expect(backup).toEqual(data);
  });
  
  it('should preserve Date objects in backup', () => {
    const data = [{
      id: 'story-1',
      version: {
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      },
    }];
    
    BackupManager.createBackup(data, 'test_key');
    const backup = BackupManager.getLatestBackup('test_key');
    
    expect(backup[0].version.createdAt).toBeInstanceOf(Date);
    expect(backup[0].version.updatedAt).toBeInstanceOf(Date);
  });
});
```

**Mock:** `localStorage` (use `jest-localstorage-mock`)  
**Real:** Backup manager logic

#### Test 2.2: Backup Recovery
```typescript
describe('BackupManager - Recovery', () => {
  it('should recover from corrupted JSON', () => {
    // Create valid backup
    const original = [{ id: 'story-1', title: 'Original' }];
    BackupManager.createBackup(original, 'test_key');
    
    // Corrupt main data
    localStorage.setItem('test_key', 'invalid json');
    
    // Restore
    const restored = BackupManager.restoreFromBackup('test_key');
    expect(restored).toBe(true);
    expect(localStorage.getItem('test_key')).toBe(JSON.stringify(original));
  });
  
  it('should handle missing backup gracefully', () => {
    localStorage.setItem('test_key', 'invalid json');
    localStorage.clear(); // Clear backups
    
    const restored = BackupManager.restoreFromBackup('test_key');
    expect(restored).toBe(false);
  });
});
```

**Mock:** `localStorage`  
**Real:** Backup recovery logic

#### Test 2.3: Backup Cleanup
```typescript
describe('BackupManager - Cleanup', () => {
  it('should keep only last 10 backups', () => {
    // Create 15 backups
    for (let i = 0; i < 15; i++) {
      BackupManager.createBackup([{ id: `story-${i}` }], 'test_key');
      jest.advanceTimersByTime(100);
    }
    
    const backups = BackupManager.getAllBackups('test_key');
    expect(backups.length).toBeLessThanOrEqual(10);
  });
});
```

**Mock:** `localStorage`, timers  
**Real:** Cleanup logic

### Integration Tests

#### Test 2.4: Full Backup/Restore Cycle
```typescript
describe('Backup/Restore - Full Cycle', () => {
  it('should preserve all data through backup/restore', async () => {
    const adapter = new LocalStorageAdapter();
    const story = createMockStory();
    
    // Create story (triggers backup)
    await adapter.createStory(story);
    
    // Corrupt data
    localStorage.setItem('odysseyos_stories', 'corrupted{');
    
    // Restore should happen automatically on next read
    const stories = adapter['getAllStories']();
    expect(stories.size).toBe(1);
    expect(stories.get(story.id)).toEqual(story);
  });
});
```

**Mock:** `localStorage`  
**Real:** Storage adapter, backup manager

---

## 3. Import Edge Cases

### Unit Tests

#### Test 3.1: Empty File
```typescript
describe('ImportPipeline - Empty File', () => {
  it('should reject empty files', async () => {
    const emptyFile = new File([''], 'empty.txt', { type: 'text/plain' });
    
    await expect(ImportPipeline.execute(emptyFile)).rejects.toThrow('empty');
  });
});
```

**Mock:** `File` object  
**Real:** Import pipeline

#### Test 3.2: Large File
```typescript
describe('ImportPipeline - Large File', () => {
  it('should reject files over 50MB', async () => {
    const largeContent = 'x'.repeat(51 * 1024 * 1024);
    const largeFile = new File([largeContent], 'large.txt');
    
    await expect(ImportPipeline.execute(largeFile)).rejects.toThrow('too large');
  });
  
  it('should warn for files over 10MB', async () => {
    const largeContent = 'x'.repeat(11 * 1024 * 1024);
    const largeFile = new File([largeContent], 'large.txt');
    
    const result = await ImportPipeline.execute(largeFile);
    expect(result.validation.warnings).toContain('Large file detected');
  });
});
```

**Mock:** `File` object  
**Real:** Import pipeline, file validation

#### Test 3.3: No Chapter Markers
```typescript
describe('ImportPipeline - No Chapter Markers', () => {
  it('should warn when no chapters detected', async () => {
    const content = 'Just some text with no chapter markers.';
    const file = new File([content], 'test.txt');
    
    const result = await ImportPipeline.execute(file);
    expect(result.validation.warnings).toContain('No chapter markers detected');
    expect(result.detectedChapters.length).toBe(0);
  });
});
```

**Mock:** `File` object  
**Real:** Import pipeline, chapter detector

#### Test 3.4: Duplicate Chapter Titles
```typescript
describe('ImportPipeline - Duplicate Titles', () => {
  it('should auto-rename duplicate chapter titles', async () => {
    const content = 'Chapter 1\n\nContent\n\nChapter 1\n\nMore content';
    const file = new File([content], 'test.txt');
    
    const result = await ImportPipeline.execute(file);
    const titles = result.detectedChapters.map(c => c.title);
    
    expect(titles).toContain('Chapter 1');
    expect(titles).toContain('Chapter 1 (2)');
    expect(result.validation.warnings).toContain('duplicate chapter title');
  });
});
```

**Mock:** `File` object  
**Real:** Import pipeline, edge case handlers

#### Test 3.5: Scene-less Chapters
```typescript
describe('ImportPipeline - Empty Chapters', () => {
  it('should detect chapters with no scenes', async () => {
    const content = 'Chapter 1\n\nChapter 2\n\nContent here';
    const file = new File([content], 'test.txt');
    
    const result = await ImportPipeline.execute(file);
    expect(result.validation.warnings).toContain('chapter(s) with no scenes');
  });
});
```

**Mock:** `File` object  
**Real:** Import pipeline, scene detector

#### Test 3.6: Mixed Markdown/Plain Text
```typescript
describe('ImportPipeline - Mixed Format', () => {
  it('should detect mixed markdown and plain text', async () => {
    const content = '# Chapter 1\n\nContent\n\nChapter 2\n\nMore content';
    const file = new File([content], 'test.txt');
    
    const result = await ImportPipeline.execute(file);
    expect(result.validation.warnings).toContain('mix markdown and plain text');
  });
});
```

**Mock:** `File` object  
**Real:** Import pipeline, format detector

### Integration Tests

#### Test 3.7: Full Import with Edge Cases
```typescript
describe('ImportPipeline - Full Import', () => {
  it('should handle file with all edge cases', async () => {
    const content = `
Chapter 1

Content here

Chapter 1

More content

Chapter 2

Final content
`;
    const file = new File([content], 'test.txt');
    
    const result = await ImportPipeline.execute(file);
    
    // Should have warnings for duplicates and empty chapters
    expect(result.validation.warnings.length).toBeGreaterThan(0);
    expect(result.detectedChapters.length).toBeGreaterThan(0);
  });
});
```

**Mock:** `File` object  
**Real:** Full import pipeline

---

## 4. Encoding Safety

### Unit Tests

#### Test 4.1: UTF-8 Detection
```typescript
describe('BrowserTextDecoder - UTF-8 Detection', () => {
  it('should detect UTF-8 with BOM', async () => {
    const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
    const text = new TextEncoder().encode('Hello');
    const bytes = new Uint8Array([...bom, ...text]);
    const blob = new Blob([bytes]);
    const file = new File([blob], 'test.txt');
    
    const decoded = await BrowserTextDecoder.decodeFile(file);
    expect(decoded.originalEncoding.encoding).toBe('UTF-8');
    expect(decoded.originalEncoding.hasBOM).toBe(true);
  });
  
  it('should detect UTF-8 without BOM', async () => {
    const text = 'Hello world';
    const file = new File([text], 'test.txt');
    
    const decoded = await BrowserTextDecoder.decodeFile(file);
    expect(decoded.originalEncoding.encoding).toBe('UTF-8');
    expect(decoded.originalEncoding.hasBOM).toBe(false);
  });
});
```

**Mock:** `File`, `Blob`  
**Real:** Encoding detection logic

#### Test 4.2: Windows-1252 Detection
```typescript
describe('BrowserTextDecoder - Windows-1252', () => {
  it('should detect Windows-1252 encoding', async () => {
    // Create Windows-1252 encoded text
    const bytes = new Uint8Array([0xc9, 0x74, 0xe9]); // "Été" in Windows-1252
    const blob = new Blob([bytes]);
    const file = new File([blob], 'test.txt');
    
    const decoded = await BrowserTextDecoder.decodeFile(file);
    // Should detect Windows-1252 or handle gracefully
    expect(decoded.text).not.toContain('\ufffd'); // No replacement chars
  });
});
```

**Mock:** `File`, `Blob`  
**Real:** Encoding detection

#### Test 4.3: Replacement Character Detection
```typescript
describe('BrowserTextDecoder - Replacement Characters', () => {
  it('should warn on excessive replacement characters', async () => {
    const text = '\ufffd'.repeat(1000) + 'a'.repeat(100);
    const file = new File([text], 'test.txt');
    
    const decoded = await BrowserTextDecoder.decodeFile(file);
    const validation = BrowserTextDecoder.validateDecodedText(decoded.text);
    
    expect(validation.isValid).toBe(false);
    expect(validation.errors).toContain('High replacement character count');
  });
});
```

**Mock:** `File`  
**Real:** Validation logic

#### Test 4.4: Date Serialization Round-Trip
```typescript
describe('Date Serialization - Round-Trip', () => {
  it('should preserve Date objects through serialization', () => {
    const story: Story = {
      ...mockStory,
      version: {
        ...mockStory.version,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      },
    };
    
    const serialized = serializeWithDates(story);
    const deserialized = deserializeWithDates<Story>(serialized);
    
    expect(deserialized.version.createdAt).toBeInstanceOf(Date);
    expect(deserialized.version.updatedAt).toBeInstanceOf(Date);
    expect(deserialized.version.createdAt.toISOString()).toBe(
      story.version.createdAt.toISOString()
    );
  });
});
```

**Mock:** None  
**Real:** Date serialization utilities

### Integration Tests

#### Test 4.5: Encoding Through Full Pipeline
```typescript
describe('Encoding - Full Pipeline', () => {
  it('should handle Windows-1252 file through import', async () => {
    // Create Windows-1252 encoded file
    const content = 'Chapter 1\n\nContent with special chars: Été';
    const bytes = new TextEncoder().encode(content); // Simulate Windows-1252
    const file = new File([bytes], 'test.txt');
    
    const result = await ImportPipeline.execute(file);
    expect(result.validation.encodingIssues.length).toBe(0);
    expect(result.normalizedText.text).toContain('Chapter 1');
  });
});
```

**Mock:** `File`  
**Real:** Full import pipeline

---

## 5. Scene/Chapter Consistency

### Unit Tests

#### Test 5.1: Orphaned Scene Detection
```typescript
describe('StoryValidator - Orphaned Scenes', () => {
  it('should detect orphaned scenes', () => {
    const story = createMockStory();
    const chapters = [createMockChapter('chapter-1')];
    const scenes = [
      createMockScene('scene-1', 'chapter-1'), // Valid
      createMockScene('scene-2', 'chapter-999'), // Orphaned
    ];
    
    const validation = StoryValidator.validate({ story, chapters, scenes });
    
    expect(validation.issues.some(i => 
      i.type === 'scene_orphaned_invalid_chapter'
    )).toBe(true);
  });
});
```

**Mock:** Story, chapter, scene factories  
**Real:** Validator logic

#### Test 5.2: Chapter Position Continuity
```typescript
describe('StoryValidator - Chapter Positions', () => {
  it('should detect missing chapter positions', () => {
    const story = createMockStory();
    const chapters = [
      createMockChapter('chapter-1', 1),
      createMockChapter('chapter-2', 3), // Missing position 2
      createMockChapter('chapter-3', 4),
    ];
    const scenes = [];
    
    const validation = StoryValidator.validate({ story, chapters, scenes });
    
    expect(validation.issues.some(i => 
      i.type === 'chapter_missing_position'
    )).toBe(true);
  });
  
  it('should detect duplicate chapter positions', () => {
    const story = createMockStory();
    const chapters = [
      createMockChapter('chapter-1', 1),
      createMockChapter('chapter-2', 1), // Duplicate
      createMockChapter('chapter-3', 2),
    ];
    const scenes = [];
    
    const validation = StoryValidator.validate({ story, chapters, scenes });
    
    expect(validation.issues.some(i => 
      i.type === 'chapter_duplicate_position'
    )).toBe(true);
  });
});
```

**Mock:** Story, chapter factories  
**Real:** Validator logic

#### Test 5.3: Scene Position Continuity
```typescript
describe('StoryValidator - Scene Positions', () => {
  it('should detect missing scene positions', () => {
    const story = createMockStory();
    const chapters = [createMockChapter('chapter-1')];
    const scenes = [
      createMockScene('scene-1', 'chapter-1', 1),
      createMockScene('scene-2', 'chapter-1', 3), // Missing position 2
      createMockScene('scene-3', 'chapter-1', 4),
    ];
    
    const validation = StoryValidator.validate({ story, chapters, scenes });
    
    expect(validation.issues.some(i => 
      i.type === 'scene_missing_position'
    )).toBe(true);
  });
});
```

**Mock:** Story, chapter, scene factories  
**Real:** Validator logic

#### Test 5.4: Repair Orphaned Data
```typescript
describe('StoryValidator - Repair', () => {
  it('should repair orphaned scenes', () => {
    const story = createMockStory();
    const chapters = [createMockChapter('chapter-1')];
    const scenes = [
      createMockScene('scene-1', 'chapter-1'),
      createMockScene('scene-2', 'chapter-999'), // Orphaned
    ];
    
    const repair = StoryValidator.repair({ story, chapters, scenes });
    
    expect(repair.success).toBe(true);
    expect(repair.repaired.scenes).toBeDefined();
    // Orphaned scene should be assigned to first chapter
    const repairedScene = repair.repaired.scenes!.find(s => s.id === 'scene-2');
    expect(repairedScene?.chapterId).toBe('chapter-1');
  });
});
```

**Mock:** Story, chapter, scene factories  
**Real:** Repair logic

### Integration Tests

#### Test 5.5: Full Validation After Import
```typescript
describe('Validation - After Import', () => {
  it('should validate and repair imported data', async () => {
    const content = 'Chapter 1\n\nContent\n\nChapter 1\n\nMore content';
    const file = new File([content], 'test.txt');
    
    const importResult = await ImportPipeline.execute(file);
    const parsed = StoryParser.parseTextFile(content, 'Test');
    
    // Validate imported data
    const validation = StoryValidator.validate({
      story: parsed.story,
      chapters: parsed.chapters,
      scenes: parsed.scenes,
    });
    
    // Should detect issues
    expect(validation.issues.length).toBeGreaterThan(0);
    
    // Repair
    const repair = StoryValidator.repair({
      story: parsed.story,
      chapters: parsed.chapters,
      scenes: parsed.scenes,
    });
    
    expect(repair.success).toBe(true);
  });
});
```

**Mock:** `File`  
**Real:** Import pipeline, parser, validator

---

## Mock Strategy

### What to Mock

1. **localStorage** - Use `jest-localstorage-mock`
   - Prevents test pollution
   - Faster tests
   - Isolated test runs

2. **File/Blob** - Mock File objects
   - Control file content
   - Test edge cases easily
   - No file system dependency

3. **Timers** - Mock `setTimeout`, `setInterval`
   - Control timing in tests
   - Faster test execution
   - Predictable behavior

4. **External APIs** - Mock if any
   - No network calls in tests
   - Predictable responses
   - Faster tests

### What to Use Real

1. **Core Logic** - Use real implementations
   - Autosave queue logic
   - Validation logic
   - Encoding detection
   - Date serialization

2. **Storage Adapters** - Use `InMemoryAdapter` for tests
   - Real adapter logic
   - No localStorage dependency
   - Fast and isolated

3. **Data Structures** - Use real models
   - Story, Chapter, Scene types
   - Real type checking
   - Real validation

---

## Suggested Tooling

### Test Framework

**Jest** (Recommended)
- Built-in mocking
- Snapshot testing
- Code coverage
- Fast execution

**Alternative: Vitest**
- Faster than Jest
- Better ESM support
- Similar API

### Testing Utilities

**@testing-library/react** - For component tests
**@testing-library/react-hooks** - For hook tests
**jest-localstorage-mock** - Mock localStorage
**@testing-library/user-event** - User interaction simulation

### Test Structure

```
tests/
├── unit/
│   ├── autosave/
│   │   ├── useAutosaveQueue.test.ts
│   │   └── autosaveQueue.test.ts
│   ├── backup/
│   │   └── backupManager.test.ts
│   ├── import/
│   │   ├── importPipeline.test.ts
│   │   └── edgeCaseHandlers.test.ts
│   ├── encoding/
│   │   └── textDecoder.test.ts
│   └── validation/
│       └── storyValidator.test.ts
├── integration/
│   ├── autosave.integration.test.ts
│   ├── backup-restore.integration.test.ts
│   ├── import.integration.test.ts
│   └── validation.integration.test.ts
└── helpers/
    ├── testFactories.ts
    └── testUtils.ts
```

### Test Configuration

**jest.config.js:**
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.stories.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

---

## Test Execution Strategy

### Unit Tests
- Run on every commit
- Fast execution (< 5 seconds)
- High coverage (> 80%)

### Integration Tests
- Run on PR
- Slower execution (< 30 seconds)
- Critical paths only

### E2E Tests (Future)
- Run on merge
- Full browser testing
- Critical user flows

---

## Priority Test List

### Must Have (Critical)

1. ✅ Autosave race condition prevention
2. ✅ Backup recovery from corruption
3. ✅ Empty file rejection
4. ✅ Large file rejection
5. ✅ Date serialization round-trip
6. ✅ Orphaned scene detection
7. ✅ Chapter position validation

### Should Have (High Priority)

8. ✅ Duplicate title handling
9. ✅ Encoding detection
10. ✅ Scene position validation
11. ✅ Mixed format detection
12. ✅ Backup cleanup

### Nice to Have (Medium Priority)

13. ⏳ Mixed encoding support
14. ⏳ Large file streaming
15. ⏳ Performance tests

---

**Test suite specification complete. Ready for implementation.** ✅
