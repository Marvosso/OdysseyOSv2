# TypeScript Models - Brief Overview

## Files
- **`models.ts`**: Complete type definitions for Story, Chapter, Scene, Character, and Beat
- **`DESIGN_DECISIONS.md`**: Detailed explanation of all design choices

## Key Design Decisions

### 1. Immutable IDs
- **Branded types** (`StoryId`, `ChapterId`, etc.) prevent ID type confusion
- **Readonly properties** ensure IDs cannot be reassigned
- **Factory functions** (`createStoryId()`, etc.) provide type-safe ID creation

### 2. Explicit Ordering
- **`order` field**: 1-based integer for deterministic sorting within parent
- **`position` field**: Percentage (0-100) for flexible placement
- Independent of IDs, making reordering simple

### 3. Dual Word Count
- **`stored`**: Cached value for performance (updated on save)
- **`computed`**: Real-time calculation from content (always accurate)
- Enables performance optimization while maintaining accuracy

### 4. UTF-8 Safe Text
- **`TextContent` interface**: Wraps text with character/byte metadata
- TypeScript strings handle all Unicode correctly (emojis, CJK, etc.)
- Separate `characterCount` and `byteLength` for different use cases

### 5. Versioning Support
- **Semantic versioning** (major.minor.patch)
- **Timestamps** (`createdAt`, `updatedAt`) for change tracking
- Ready for future features: history, rollback, diff viewing

## Model Hierarchy
```
Story
  ├── Chapters (ordered)
  │     └── Scenes (ordered)
  │           └── Beats (ordered)
  └── Characters (ordered)
```

## Usage Example
```typescript
import { 
  createStoryId, 
  createTextContent, 
  createWordCount, 
  createVersion,
  type Story 
} from './models';

const story: Story = {
  id: createStoryId("story-1"),
  title: "My Story",
  description: createTextContent("Story description..."),
  genre: "fiction",
  targetAudience: "adults",
  themes: ["adventure"],
  status: "draft",
  chapters: [],
  characters: [],
  wordCount: createWordCount(""),
  version: createVersion(),
  metadata: { tags: [], notes: "" },
};
```

## Helper Functions
- **ID Creation**: `createStoryId()`, `createChapterId()`, etc.
- **Text Processing**: `computeWordCount()`, `createTextContent()`
- **Versioning**: `createVersion()`, `updateVersion()`
- **Type Guards**: `isStoryId()`, `isChapterId()`, etc.

All models are **strongly typed**, **immutable**, and **production-ready**.
