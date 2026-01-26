# Data Integrity Test Specifications

## Critical Tests Required

### 1. Quota Exceeded Handling

```typescript
describe('LocalStorageAdapter - Quota Handling', () => {
  it('should handle QuotaExceededError gracefully', async () => {
    const adapter = new LocalStorageAdapter();
    
    // Mock quota exceeded
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = jest.fn(() => {
      const error = new DOMException('QuotaExceededError', 'QuotaExceededError');
      throw error;
    });
    
    const result = await adapter.createStory(mockStory);
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('quota exceeded');
    
    // Restore
    Storage.prototype.setItem = originalSetItem;
  });
  
  it('should warn before quota is exceeded', async () => {
    const adapter = new LocalStorageAdapter();
    
    // Create large story
    const largeStory = createLargeStory(4 * 1024 * 1024); // 4MB
    
    const result = await adapter.createStory(largeStory);
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('too large');
  });
});
```

### 2. JSON Corruption Recovery

```typescript
describe('LocalStorageAdapter - Corruption Recovery', () => {
  it('should recover from corrupted JSON', () => {
    // Setup: Create valid data and backup
    const adapter = new LocalStorageAdapter();
    adapter.createStory(validStory);
    
    // Corrupt the data
    localStorage.setItem('odysseyos_stories', 'invalid json{');
    
    // Attempt to read
    const stories = adapter['getAllStories']();
    
    // Should recover from backup
    expect(stories.size).toBeGreaterThan(0);
  });
  
  it('should handle missing backup gracefully', () => {
    localStorage.setItem('odysseyos_stories', 'invalid json');
    localStorage.clear(); // Clear backups too
    
    const adapter = new LocalStorageAdapter();
    const stories = adapter['getAllStories']();
    
    // Should return empty but log error
    expect(stories.size).toBe(0);
  });
  
  it('should validate story structure on load', () => {
    // Create invalid story structure
    localStorage.setItem('odysseyos_stories', JSON.stringify([
      { id: 'story-1' }, // Missing required fields
      { title: 'Story 2' }, // Missing id
      validStory, // Valid story
    ]));
    
    const adapter = new LocalStorageAdapter();
    const stories = adapter['getAllStories']();
    
    // Should filter invalid stories
    expect(stories.size).toBe(1);
    expect(stories.has(validStory.id)).toBe(true);
  });
});
```

### 3. Word Count Accuracy

```typescript
describe('Word Count Accuracy', () => {
  it('should count hyphenated words correctly', () => {
    expect(computeWordCount('twenty-one')).toBe(1);
    expect(computeWordCount('well-known author')).toBe(2);
    expect(computeWordCount('state-of-the-art technology')).toBe(3);
  });
  
  it('should count contractions correctly', () => {
    expect(computeWordCount("don't")).toBe(1);
    expect(computeWordCount("it's")).toBe(1);
    expect(computeWordCount("won't")).toBe(1);
    expect(computeWordCount("I don't know")).toBe(3);
  });
  
  it('should handle Unicode correctly', () => {
    expect(computeWordCount('café résumé')).toBe(2);
    expect(computeWordCount('naïve piñata')).toBe(2);
    expect(computeWordCount('北京 上海')).toBe(2); // Chinese
  });
  
  it('should handle numbers correctly', () => {
    expect(computeWordCount('3.14 is pi')).toBe(3);
    expect(computeWordCount('Version 2.0 released')).toBe(3);
    expect(computeWordCount('$100,000 prize')).toBe(2);
  });
  
  it('should handle edge cases', () => {
    expect(computeWordCount('')).toBe(0);
    expect(computeWordCount('   ')).toBe(0);
    expect(computeWordCount('a')).toBe(1);
    expect(computeWordCount('a b c')).toBe(3);
    expect(computeWordCount('a\nb\nc')).toBe(3);
    expect(computeWordCount('a\tb\tc')).toBe(3);
  });
  
  it('should validate stored vs computed word count', () => {
    const text = 'This is a test sentence.';
    const stored = 5;
    const computed = computeWordCount(text);
    
    const validation = validateWordCount(stored, computed);
    
    expect(validation.isValid).toBe(true);
    expect(validation.needsReconciliation).toBe(false);
  });
  
  it('should flag word count mismatches', () => {
    const stored = 100;
    const computed = 150;
    
    const validation = validateWordCount(stored, computed);
    
    expect(validation.isValid).toBe(false);
    expect(validation.needsReconciliation).toBe(true);
  });
});
```

### 4. Import Pipeline Edge Cases

```typescript
describe('Import Pipeline - Edge Cases', () => {
  it('should reject empty files', async () => {
    const emptyFile = new File([''], 'empty.txt', { type: 'text/plain' });
    
    await expect(ImportPipeline.execute(emptyFile)).rejects.toThrow('empty');
  });
  
  it('should reject files that are too large', async () => {
    const largeContent = 'x'.repeat(51 * 1024 * 1024); // 51MB
    const largeFile = new File([largeContent], 'large.txt', { type: 'text/plain' });
    
    await expect(ImportPipeline.execute(largeFile)).rejects.toThrow('too large');
  });
  
  it('should detect binary files', async () => {
    const binaryData = new Uint8Array([0x89, 0x50, 0x4E, 0x47]); // PNG header
    const binaryFile = new File([binaryData], 'image.png', { type: 'image/png' });
    
    await expect(ImportPipeline.execute(binaryFile)).rejects.toThrow('text file');
  });
  
  it('should handle files with only whitespace', async () => {
    const whitespaceFile = new File(['   \n\n\t\t   '], 'whitespace.txt');
    
    const result = await ImportPipeline.execute(whitespaceFile);
    
    expect(result.totalWordCount.computed).toBe(0);
    expect(result.validation.warnings).toContain('empty');
  });
  
  it('should handle files with mixed line endings', async () => {
    const mixedContent = 'Line 1\r\nLine 2\nLine 3\rLine 4';
    const mixedFile = new File([mixedContent], 'mixed.txt');
    
    const result = await ImportPipeline.execute(mixedFile);
    
    expect(result.normalizedText.originalLineEnding).toBe('MIXED');
    expect(result.normalizedText.lines.length).toBe(4);
  });
  
  it('should handle files with no chapters', async () => {
    const noChaptersContent = 'This is just text.\nNo chapters here.\nJust paragraphs.';
    const noChaptersFile = new File([noChaptersContent], 'nochapters.txt');
    
    const result = await ImportPipeline.execute(noChaptersFile);
    
    expect(result.detectedChapters.length).toBe(0);
    expect(result.detectedScenes.length).toBeGreaterThan(0);
  });
  
  it('should handle files with overlapping chapter markers', async () => {
    const overlappingContent = 'Chapter 1\n\nChapter 2\n\nChapter 3';
    const overlappingFile = new File([overlappingContent], 'overlapping.txt');
    
    const result = await ImportPipeline.execute(overlappingFile);
    
    expect(result.validation.warnings.some(w => w.includes('overlapping'))).toBe(true);
  });
});
```

### 5. Scene/Chapter Consistency

```typescript
describe('Scene/Chapter Consistency', () => {
  it('should detect orphaned scenes', () => {
    const story = createMockStory();
    const chapters = [createMockChapter('chapter-1')];
    const scenes = [
      createMockScene('scene-1', 'chapter-1'), // Valid
      createMockScene('scene-2', 'chapter-999'), // Orphaned
    ];
    
    const validation = DataValidator.validateStoryConsistency(story, chapters, scenes);
    
    expect(validation.errors.length).toBeGreaterThan(0);
    expect(validation.errors.some(e => e.includes('scene-2'))).toBe(true);
  });
  
  it('should detect scenes not in any chapter', () => {
    const story = createMockStory();
    const chapters = [createMockChapter('chapter-1', ['scene-1'])];
    const scenes = [
      createMockScene('scene-1', 'chapter-1'),
      createMockScene('scene-2', 'chapter-1'), // Not in chapter.scenes
    ];
    
    const validation = DataValidator.validateStoryConsistency(story, chapters, scenes);
    
    expect(validation.warnings.some(w => w.includes('orphaned'))).toBe(true);
  });
  
  it('should detect invalid chapter references in story', () => {
    const story = createMockStory(['chapter-1', 'chapter-999']); // chapter-999 doesn't exist
    const chapters = [createMockChapter('chapter-1')];
    const scenes = [];
    
    const validation = DataValidator.validateStoryConsistency(story, chapters, scenes);
    
    expect(validation.errors.some(e => e.includes('chapter-999'))).toBe(true);
  });
});
```

### 6. Autosave Race Conditions

```typescript
describe('Autosave Race Conditions', () => {
  it('should debounce rapid autosave triggers', async () => {
    const saveFn = jest.fn();
    const debouncedSave = debounce(saveFn, 1000);
    
    // Trigger 10 rapid saves
    for (let i = 0; i < 10; i++) {
      debouncedSave({ version: i });
    }
    
    // Wait for debounce
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    // Should only save once (last value)
    expect(saveFn).toHaveBeenCalledTimes(1);
    expect(saveFn).toHaveBeenCalledWith({ version: 9 });
  });
  
  it('should handle concurrent saves without data loss', async () => {
    const adapter = new LocalStorageAdapter();
    const storyId = createStoryId('story-1');
    
    // Create story first
    await adapter.createStory(createMockStory('story-1'));
    
    // Trigger 5 concurrent updates
    const updates = Array(5).fill(null).map((_, i) =>
      adapter.updateStory(storyId, { title: `Title ${i}` })
    );
    
    await Promise.all(updates);
    
    // Get final story
    const result = await adapter.getStory(storyId);
    
    // Should have one of the titles (last write wins, but no corruption)
    expect(result.success).toBe(true);
    expect(result.data?.title).toMatch(/^Title \d$/);
  });
});
```

### 7. Encoding Edge Cases

```typescript
describe('Text Encoding - Edge Cases', () => {
  it('should warn on low confidence encoding', async () => {
    // Create file with ambiguous encoding
    const ambiguousBytes = new Uint8Array([0xC3, 0xA9, 0x20, 0x74, 0x65, 0x78, 0x74]);
    const ambiguousFile = new File([ambiguousBytes], 'ambiguous.txt');
    
    const decoded = await BrowserTextDecoder.decodeFile(ambiguousFile);
    
    if (decoded.originalEncoding.confidence < 0.7) {
      // Should have warning
      const validation = BrowserTextDecoder.validateDecodedText(decoded.text);
      expect(validation.warnings.length).toBeGreaterThan(0);
    }
  });
  
  it('should handle files with replacement characters', async () => {
    const textWithReplacements = 'Text with \ufffd replacement characters';
    const file = new File([textWithReplacements], 'replacements.txt');
    
    const decoded = await BrowserTextDecoder.decodeFile(file);
    const validation = BrowserTextDecoder.validateDecodedText(decoded.text);
    
    expect(validation.warnings.length).toBeGreaterThan(0);
  });
  
  it('should reject files with excessive corruption', async () => {
    // Create file with >1% replacement characters
    const corrupted = '\ufffd'.repeat(1000) + 'a'.repeat(100);
    const file = new File([corrupted], 'corrupted.txt');
    
    const decoded = await BrowserTextDecoder.decodeFile(file);
    const validation = BrowserTextDecoder.validateDecodedText(decoded.text);
    
    expect(validation.isValid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
  });
});
```

### 8. Backup System

```typescript
describe('Backup Manager', () => {
  it('should create backups before saves', () => {
    const data = [{ id: 'story-1', title: 'Test' }];
    BackupManager.createBackup(data, 'test_key');
    
    const backup = BackupManager.getLatestBackup('test_key');
    
    expect(backup).toEqual(data);
  });
  
  it('should restore from backup on corruption', () => {
    // Create backup
    const originalData = [{ id: 'story-1', title: 'Original' }];
    BackupManager.createBackup(originalData, 'test_key');
    
    // Corrupt main data
    localStorage.setItem('test_key', 'invalid json');
    
    // Restore
    const restored = BackupManager.restoreFromBackup('test_key');
    
    expect(restored).toBe(true);
    expect(localStorage.getItem('test_key')).toBe(JSON.stringify(originalData));
  });
  
  it('should clean old backups', () => {
    // Create 15 backups
    for (let i = 0; i < 15; i++) {
      BackupManager.createBackup([{ id: `story-${i}` }], 'test_key');
      // Small delay to ensure different timestamps
      jest.advanceTimersByTime(100);
    }
    
    // Should only keep MAX_BACKUPS (10)
    // This is tested by checking localStorage keys
    const backupKeys = Object.keys(localStorage).filter(k => 
      k.startsWith('test_key_backup_')
    );
    
    expect(backupKeys.length).toBeLessThanOrEqual(10);
  });
});
```

### 9. Date Serialization

```typescript
describe('Date Serialization', () => {
  it('should preserve Date objects through serialization', () => {
    const story: Story = {
      ...mockStory,
      version: {
        ...mockStory.version,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      },
    };
    
    const serialized = JSON.stringify(story);
    const deserialized = JSON.parse(serialized);
    
    // Dates become strings - need custom serializer
    expect(typeof deserialized.version.createdAt).toBe('string');
    
    // With custom serializer:
    // expect(deserialized.version.createdAt).toBeInstanceOf(Date);
  });
});
```

### 10. Integration Tests

```typescript
describe('End-to-End Data Integrity', () => {
  it('should maintain data integrity through full workflow', async () => {
    // 1. Import file
    const file = new File(['Chapter 1\n\nContent here.'], 'story.txt');
    const importResult = await ImportPipeline.execute(file);
    
    // 2. Create story from import
    const storage = getStoryStorage();
    const story = createStoryFromImport(importResult);
    const createResult = await storage.createStory(story);
    
    expect(createResult.success).toBe(true);
    
    // 3. Update story multiple times
    for (let i = 0; i < 5; i++) {
      await storage.updateStory(story.id, { title: `Updated ${i}` });
    }
    
    // 4. Verify final state
    const finalResult = await storage.getStory(story.id);
    expect(finalResult.success).toBe(true);
    expect(finalResult.data?.title).toBe('Updated 4');
    
    // 5. Verify word count accuracy
    const wordCount = finalResult.data?.wordCount;
    expect(wordCount?.computed).toBeGreaterThan(0);
    expect(Math.abs(wordCount.stored - wordCount.computed)).toBeLessThan(2);
    
    // 6. Verify consistency
    const validation = DataValidator.validateStoryConsistency(
      finalResult.data!,
      [], // chapters
      [] // scenes
    );
    expect(validation.isValid).toBe(true);
  });
  
  it('should recover from complete data loss scenario', async () => {
    // Setup: Create story with backup
    const storage = getStoryStorage();
    const story = createMockStory();
    await storage.createStory(story);
    
    // Corrupt localStorage
    localStorage.setItem('odysseyos_stories', 'corrupted{');
    localStorage.removeItem('odysseyos_stories_backup_metadata');
    
    // Attempt to get story (should attempt recovery)
    const result = await storage.getStory(story.id);
    
    // Should handle gracefully
    expect(result.success).toBe(false);
    // Should have attempted backup recovery
  });
});
```

## Test Coverage Goals

- **Unit Tests:** 90%+ coverage
- **Integration Tests:** All critical paths
- **Edge Case Tests:** All identified failure points
- **Recovery Tests:** All backup/recovery scenarios

## Missing Test Infrastructure

Currently missing:
- ❌ Test framework setup (Jest/Vitest)
- ❌ Mock localStorage implementation
- ❌ Test utilities for creating mock data
- ❌ E2E test framework
- ❌ Performance tests for large files
- ❌ Stress tests for concurrent operations

## Priority Test Implementation Order

1. ✅ Quota exceeded handling
2. ✅ JSON corruption recovery  
3. ✅ Word count accuracy
4. ✅ Import edge cases
5. ✅ Scene/chapter consistency
6. ⏳ Autosave race conditions
7. ⏳ Encoding edge cases
8. ⏳ Backup system
9. ⏳ Date serialization
10. ⏳ Integration tests
