# Design Decisions for TypeScript Models

This document explains the design decisions behind the strongly typed models in `models.ts`.

## 1. Immutable IDs

### Implementation
- **Branded Types**: Each ID type (StoryId, ChapterId, etc.) is a branded string type
- **Readonly Properties**: All ID fields are marked as `readonly`
- **Helper Functions**: Factory functions (`createStoryId()`, etc.) ensure type safety

### Rationale
- **Type Safety**: Branded types prevent accidentally mixing different ID types
- **Immutability**: Readonly ensures IDs cannot be reassigned after object creation
- **Refactoring Safety**: TypeScript will catch errors if you try to use the wrong ID type

### Example
```typescript
const storyId: StoryId = createStoryId("story-123");
const chapterId: ChapterId = createChapterId("chapter-456");

// TypeScript error: cannot assign ChapterId to StoryId
// storyId = chapterId; // ❌ Compile error
```

---

## 2. Explicit Ordering Fields

### Implementation
- **`order` field**: 1-based integer for explicit ordering within parent container
- **`position` field**: Percentage-based positioning (0-100) for flexible placement
- **Separate from IDs**: Ordering is independent of ID generation

### Rationale
- **Predictable Sorting**: Explicit order field makes sorting deterministic
- **Flexible Positioning**: Position field allows for non-linear arrangements
- **Reordering Support**: Easy to swap order values without changing IDs
- **Database Friendly**: Integer ordering is efficient for database queries

### Hierarchy
```
Story (order: N/A - top level)
  └── Chapter (order: 1, 2, 3...)
      └── Scene (order: 1, 2, 3...)
          └── Beat (order: 1, 2, 3...)
```

---

## 3. Dual Word Count (Stored + Computed)

### Implementation
- **`WordCount` interface**: Contains both `stored` and `computed` values
- **`stored`**: Cached value for performance (updated on save)
- **`computed`**: Real-time calculation from actual content
- **`computedAt`**: Timestamp of last computation

### Rationale
- **Performance**: Stored value avoids recalculating on every read
- **Accuracy**: Computed value ensures correctness when content changes
- **Validation**: Compare stored vs computed to detect inconsistencies
- **Lazy Updates**: Can update stored value asynchronously

### Usage Pattern
```typescript
// On content update
const newWordCount = createWordCount(content, storedCount);
if (newWordCount.stored !== newWordCount.computed) {
  // Update stored value in background
  updateStoredWordCount(id, newWordCount.computed);
}
```

---

## 4. UTF-8 Safe Text Handling

### Implementation
- **`TextContent` interface**: Wraps text with metadata
- **`text`**: Standard TypeScript string (UTF-16 internally, handles all Unicode)
- **`characterCount`**: Character length (handles multi-byte characters)
- **`byteLength`**: UTF-8 byte length for storage/transmission

### Rationale
- **Unicode Support**: TypeScript strings handle all Unicode characters correctly
- **Multi-byte Awareness**: Character count vs byte length distinction
- **Storage Planning**: Byte length helps estimate storage requirements
- **Encoding Flexibility**: Can convert to UTF-8 for APIs/storage

### Technical Notes
- TypeScript strings are UTF-16 encoded internally
- `string.length` gives code units (may be >1 for some characters)
- `TextEncoder` provides UTF-8 byte length
- All Unicode characters (emojis, CJK, etc.) are handled correctly

---

## 5. Versioning Support

### Implementation
- **`Version` interface**: Semantic versioning (major.minor.patch)
- **Timestamps**: `createdAt` and `updatedAt` for change tracking
- **Helper Functions**: `createVersion()` and `updateVersion()`
- **Readonly**: Version fields are immutable

### Rationale
- **Change Tracking**: Know when and how content changed
- **Semantic Versioning**: Standard versioning scheme
- **Future Features**: Enables version history, rollback, diff viewing
- **Audit Trail**: Timestamps provide audit information

### Future Extensions
- Version history storage
- Diff computation between versions
- Rollback capabilities
- Branching/merging support

---

## 6. Strong Typing Decisions

### Branded Types for IDs
- Prevents ID type confusion at compile time
- No runtime overhead (pure TypeScript feature)
- Better IDE autocomplete and error messages

### Readonly Modifiers
- All top-level properties are readonly
- Prevents accidental mutations
- Encourages immutable data patterns

### Union Types for Enums
- More flexible than TypeScript enums
- Better tree-shaking in bundlers
- Easier to extend with new values

### Const Assertions
- Helper functions return `as const` for immutability
- Ensures objects cannot be modified
- Better type inference

---

## 7. Model Relationships

### Hierarchy
```
Story (1)
  ├── Chapters (N)
  │     └── Scenes (N)
  │           └── Beats (N)
  └── Characters (N)
```

### Reference Pattern
- Parent contains array of child IDs (not full objects)
- Enables lazy loading and reduces memory
- Maintains referential integrity

### Example
```typescript
interface Story {
  chapters: readonly ChapterId[];  // References, not full objects
  characters: readonly CharacterId[];
}
```

---

## 8. Metadata Pattern

### Implementation
- Each model has a `metadata` object
- Contains extensible fields (tags, notes, etc.)
- Allows future expansion without breaking changes

### Rationale
- **Extensibility**: Easy to add new metadata fields
- **Optional Fields**: Some metadata is optional (imageUrl, etc.)
- **Type Safety**: Still strongly typed, not `any`
- **Backward Compatible**: New fields don't break existing code

---

## 9. Helper Functions

### Factory Functions
- `createStoryId()`, `createChapterId()`, etc.
- Ensure type safety when creating IDs
- Can add validation in the future

### Computation Functions
- `computeWordCount()`: UTF-8 safe word counting
- `computeCharacterCount()`: Character length
- `computeByteLength()`: UTF-8 byte length
- `createTextContent()`: Creates TextContent with all metadata

### Version Functions
- `createVersion()`: Creates initial version
- `updateVersion()`: Increments version (major/minor/patch)

### Type Guards
- `isStoryId()`, `isChapterId()`, etc.
- Runtime type checking
- Useful for validation and error handling

---

## 10. Performance Considerations

### Stored vs Computed
- Word count stored for fast reads
- Computed on-demand for accuracy
- Background updates for stored values

### Reference Arrays
- IDs instead of full objects reduce memory
- Enables lazy loading patterns
- Faster serialization/deserialization

### Readonly Arrays
- `readonly string[]` prevents mutations
- TypeScript ensures immutability
- Better for functional programming patterns

---

## 11. Future Extensibility

### Versioning
- Ready for version history
- Can add diff/merge capabilities
- Supports branching workflows

### Metadata
- Extensible metadata objects
- Easy to add new fields
- Backward compatible

### Type System
- Branded types can be extended
- Union types can add new values
- Interfaces can add optional fields

---

## 12. Common Patterns

### Creating a New Story
```typescript
const story: Story = {
  id: createStoryId("story-1"),
  title: "My Story",
  description: createTextContent("A great story..."),
  genre: "fiction",
  targetAudience: "adults",
  themes: ["adventure", "friendship"],
  status: "draft",
  chapters: [],
  characters: [],
  wordCount: createWordCount(""),
  version: createVersion(),
  metadata: {
    tags: [],
    notes: "",
  },
};
```

### Updating Word Count
```typescript
const newContent = "Updated story content...";
const updatedWordCount = createWordCount(newContent, story.wordCount.stored);
```

### Versioning Updates
```typescript
const newVersion = updateVersion(story.version, "minor");
```

---

## Summary

These design decisions prioritize:
1. **Type Safety**: Catch errors at compile time
2. **Immutability**: Prevent accidental mutations
3. **Performance**: Stored values for speed, computed for accuracy
4. **Extensibility**: Easy to add features without breaking changes
5. **Standards**: Following TypeScript and semantic versioning best practices

The models are production-ready and provide a solid foundation for a story writing application.
