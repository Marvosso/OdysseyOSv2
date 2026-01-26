# Storage Abstraction Layer

A clean, interface-based storage abstraction layer that allows switching between different storage implementations without changing UI code.

## Architecture

```
┌─────────────────┐
│  UI Components  │  (Zero dependency on storage implementation)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Storage Manager │  (Singleton, manages adapter)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  IStoryStorage  │  (Interface)
└────────┬────────┘
         │
    ┌────┴────┬──────────┬─────────┐
    ▼         ▼          ▼         ▼
┌────────┐ ┌──────┐ ┌──────┐ ┌──────┐
│Local   │ │InMem │ │Cloud │ │Custom│
│Storage │ │ory   │ │      │ │      │
└────────┘ └──────┘ └──────┘ └──────┘
```

## Core Interface

All storage adapters implement `IStoryStorage`:

```typescript
interface IStoryStorage {
  createStory(story: Story): Promise<StorageResult<Story>>;
  updateStory(storyId: StoryId, updates: Partial<Story>): Promise<StorageResult<Story>>;
  deleteStory(storyId: StoryId): Promise<StorageResult<void>>;
  getStory(storyId: StoryId): Promise<StorageResult<Story | null>>;
  listStories(): Promise<StorageResult<readonly StoryMetadata[]>>;
  isAvailable(): Promise<boolean>;
  clearAll(): Promise<StorageResult<void>>;
}
```

## Usage

### Basic Usage (UI Components)

```typescript
import { getStoryStorage } from '@/lib/storage/StoryStorageManager';

// Get storage manager (uses default adapter)
const storage = getStoryStorage();

// Create a story
const result = await storage.createStory(story);
if (result.success) {
  console.log('Story created:', result.data);
} else {
  console.error('Error:', result.error);
}

// Get a story
const storyResult = await storage.getStory(storyId);
if (storyResult.success && storyResult.data) {
  console.log('Story:', storyResult.data);
}

// List all stories
const listResult = await storage.listStories();
if (listResult.success) {
  console.log('Stories:', listResult.data);
}

// Update a story
const updateResult = await storage.updateStory(storyId, {
  title: 'New Title',
  status: 'published',
});

// Delete a story
const deleteResult = await storage.deleteStory(storyId);
```

### Configuration

```typescript
import { getStoryStorage } from '@/lib/storage/StoryStorageManager';

// Use localStorage (default)
const storage = getStoryStorage({ adapterType: 'localStorage' });

// Use in-memory (for testing)
const storage = getStoryStorage({ adapterType: 'inMemory' });

// Use cloud (when implemented)
const storage = getStoryStorage({
  adapterType: 'cloud',
  cloudApiUrl: 'https://api.example.com',
  cloudApiKey: 'your-api-key',
});

// Use custom adapter
const customAdapter = new MyCustomAdapter();
const storage = getStoryStorage({ adapter: customAdapter });
```

## Adapters

### 1. LocalStorageAdapter

**Purpose**: Temporary storage for development and single-user scenarios

**Features**:
- Browser localStorage
- Persists across page refreshes
- Limited to ~5-10MB
- Single-user only

**Usage**:
```typescript
const storage = getStoryStorage({
  adapterType: 'localStorage',
  localStoragePrefix: 'odysseyos', // Optional
});
```

### 2. InMemoryAdapter

**Purpose**: Testing and development

**Features**:
- In-memory storage (Map)
- Data lost on page refresh
- Fast and simple
- Perfect for unit tests

**Usage**:
```typescript
const storage = getStoryStorage({ adapterType: 'inMemory' });
```

### 3. CloudAdapter

**Purpose**: Production cloud storage (placeholder)

**Features**:
- Placeholder for future implementation
- Can be implemented with:
  - Firebase Firestore
  - AWS DynamoDB
  - Supabase
  - Custom API

**Usage**:
```typescript
const storage = getStoryStorage({
  adapterType: 'cloud',
  cloudApiUrl: 'https://api.example.com',
  cloudApiKey: 'your-api-key',
});
```

## StorageResult Pattern

All operations return `StorageResult<T>`:

```typescript
interface StorageResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

**Benefits**:
- Consistent error handling
- Type-safe results
- No exceptions to catch
- Easy to check success/failure

**Example**:
```typescript
const result = await storage.createStory(story);
if (result.success) {
  // Use result.data
} else {
  // Handle result.error
}
```

## Migration from Old Storage

### Old Code (Direct Storage)
```typescript
import { StoryStorage } from '@/lib/storage/storyStorage';

StoryStorage.saveStory(story);
const story = StoryStorage.loadStory();
```

### New Code (Abstraction Layer)
```typescript
import { getStoryStorage } from '@/lib/storage/StoryStorageManager';

const storage = getStoryStorage();
await storage.createStory(story);
const result = await storage.getStory(storyId);
```

## Testing

### Unit Tests with InMemoryAdapter

```typescript
import { getStoryStorage } from '@/lib/storage/StoryStorageManager';
import { InMemoryAdapter } from '@/lib/storage/adapters/InMemoryAdapter';

describe('Story Storage', () => {
  let storage: StoryStorageManager;

  beforeEach(() => {
    storage = getStoryStorage({ adapterType: 'inMemory' });
  });

  it('should create a story', async () => {
    const result = await storage.createStory(mockStory);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockStory);
  });
});
```

## Best Practices

1. **Always check `result.success`**: Don't assume operations succeed
2. **Use `isAvailable()`**: Check storage availability before operations
3. **Handle errors gracefully**: Display user-friendly error messages
4. **Use metadata for lists**: `listStories()` returns lightweight metadata
5. **Don't store adapter instances**: Use `getStoryStorage()` to get the manager

## Error Handling

```typescript
const result = await storage.createStory(story);

if (!result.success) {
  // Handle error
  switch (result.error) {
    case 'Story with ID already exists':
      // Show duplicate error
      break;
    case 'LocalStorage is not available':
      // Fallback to in-memory
      break;
    default:
      // Generic error
      break;
  }
}
```

## Future Enhancements

- [ ] Implement CloudAdapter with Firebase/Supabase
- [ ] Add caching layer
- [ ] Add offline support
- [ ] Add batch operations
- [ ] Add query/filter capabilities
- [ ] Add sync capabilities

## File Structure

```
src/lib/storage/
├── storage.interface.ts          # Core interface
├── StoryStorageManager.ts        # Manager singleton
├── adapters/
│   ├── LocalStorageAdapter.ts    # Browser localStorage
│   ├── InMemoryAdapter.ts        # In-memory (testing)
│   └── CloudAdapter.ts           # Cloud (placeholder)
└── README.md                     # This file
```

## Zero UI Dependency

The storage abstraction layer has **zero UI dependencies**:
- No React imports
- No DOM dependencies
- Pure TypeScript/JavaScript
- Can be used in Node.js, browser, or any environment
- Easy to test
- Easy to mock

UI components only depend on the `StoryStorageManager`, not on specific adapters.
