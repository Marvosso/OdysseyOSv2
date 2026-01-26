# Storage Abstraction Layer - Usage Examples

## Basic Operations

### Create a Story

```typescript
import { getStoryStorage } from '@/lib/storage';
import { createStoryId, createVersion, createTextContent, createWordCount } from '@/types/models';

const storage = getStoryStorage();

const newStory = {
  id: createStoryId('story-1'),
  title: 'My New Story',
  description: createTextContent('A great story about...'),
  genre: 'fiction',
  targetAudience: 'adults',
  themes: ['adventure', 'friendship'],
  status: 'draft',
  chapters: [],
  characters: [],
  wordCount: createWordCount(''),
  version: createVersion(),
  metadata: {
    tags: [],
    notes: '',
  },
};

const result = await storage.createStory(newStory);

if (result.success) {
  console.log('Story created:', result.data);
} else {
  console.error('Error:', result.error);
}
```

### Get a Story

```typescript
import { getStoryStorage } from '@/lib/storage';
import { createStoryId } from '@/types/models';

const storage = getStoryStorage();
const storyId = createStoryId('story-1');

const result = await storage.getStory(storyId);

if (result.success && result.data) {
  console.log('Story:', result.data);
} else if (result.success && !result.data) {
  console.log('Story not found');
} else {
  console.error('Error:', result.error);
}
```

### Update a Story

```typescript
import { getStoryStorage } from '@/lib/storage';
import { createStoryId } from '@/types/models';

const storage = getStoryStorage();
const storyId = createStoryId('story-1');

const result = await storage.updateStory(storyId, {
  title: 'Updated Title',
  status: 'published',
  themes: ['adventure', 'friendship', 'mystery'],
});

if (result.success) {
  console.log('Story updated:', result.data);
} else {
  console.error('Error:', result.error);
}
```

### Delete a Story

```typescript
import { getStoryStorage } from '@/lib/storage';
import { createStoryId } from '@/types/models';

const storage = getStoryStorage();
const storyId = createStoryId('story-1');

const result = await storage.deleteStory(storyId);

if (result.success) {
  console.log('Story deleted');
} else {
  console.error('Error:', result.error);
}
```

### List All Stories

```typescript
import { getStoryStorage } from '@/lib/storage';

const storage = getStoryStorage();

const result = await storage.listStories();

if (result.success) {
  console.log('Stories:', result.data);
  result.data?.forEach(story => {
    console.log(`- ${story.title} (${story.wordCount} words)`);
  });
} else {
  console.error('Error:', result.error);
}
```

## React Component Usage

### Hook for Story Storage

```typescript
import { useState, useEffect } from 'react';
import { getStoryStorage } from '@/lib/storage';
import type { Story, StoryId } from '@/types/models';

export function useStory(storyId: StoryId) {
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storage = getStoryStorage();
    
    storage.getStory(storyId).then(result => {
      if (result.success) {
        setStory(result.data || null);
        setError(null);
      } else {
        setError(result.error || 'Failed to load story');
      }
      setLoading(false);
    });
  }, [storyId]);

  const updateStory = async (updates: Partial<Story>) => {
    if (!story) return;
    
    const storage = getStoryStorage();
    const result = await storage.updateStory(storyId, updates);
    
    if (result.success && result.data) {
      setStory(result.data);
      return true;
    } else {
      setError(result.error || 'Failed to update story');
      return false;
    }
  };

  return { story, loading, error, updateStory };
}
```

### Component Using Storage

```typescript
import { useState, useEffect } from 'react';
import { getStoryStorage } from '@/lib/storage';
import type { StoryMetadata } from '@/lib/storage';

export function StoryList() {
  const [stories, setStories] = useState<StoryMetadata[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storage = getStoryStorage();
    
    storage.listStories().then(result => {
      if (result.success && result.data) {
        setStories(result.data);
      }
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>My Stories</h2>
      {stories.map(story => (
        <div key={story.id}>
          <h3>{story.title}</h3>
          <p>{story.wordCount} words</p>
          <p>Status: {story.status}</p>
        </div>
      ))}
    </div>
  );
}
```

## Error Handling Patterns

### Pattern 1: Simple Check

```typescript
const result = await storage.createStory(story);
if (!result.success) {
  alert(`Error: ${result.error}`);
  return;
}
// Use result.data
```

### Pattern 2: Try-Catch Style

```typescript
const result = await storage.getStory(storyId);
if (result.success) {
  if (result.data) {
    // Story exists
  } else {
    // Story not found
  }
} else {
  // Error occurred
  console.error(result.error);
}
```

### Pattern 3: With Fallback

```typescript
const result = await storage.getStory(storyId);
const story = result.success && result.data 
  ? result.data 
  : defaultStory;
```

## Testing Examples

### Unit Test

```typescript
import { getStoryStorage } from '@/lib/storage';
import { createStoryId, createVersion, createTextContent, createWordCount } from '@/types/models';

describe('Story Storage', () => {
  beforeEach(() => {
    // Reset to in-memory adapter for tests
    getStoryStorage({ adapterType: 'inMemory' });
  });

  it('should create and retrieve a story', async () => {
    const storage = getStoryStorage();
    
    const story = {
      id: createStoryId('test-1'),
      title: 'Test Story',
      description: createTextContent('Test description'),
      genre: 'fiction',
      targetAudience: 'adults',
      themes: [],
      status: 'draft',
      chapters: [],
      characters: [],
      wordCount: createWordCount(''),
      version: createVersion(),
      metadata: { tags: [], notes: '' },
    };

    // Create
    const createResult = await storage.createStory(story);
    expect(createResult.success).toBe(true);

    // Retrieve
    const getResult = await storage.getStory(story.id);
    expect(getResult.success).toBe(true);
    expect(getResult.data).toEqual(story);
  });
});
```

## Configuration Examples

### Development (LocalStorage)

```typescript
// In your app initialization
import { getStoryStorage } from '@/lib/storage';

const storage = getStoryStorage({
  adapterType: 'localStorage',
  localStoragePrefix: 'odysseyos_dev',
});
```

### Testing (InMemory)

```typescript
// In test setup
import { getStoryStorage } from '@/lib/storage';

const storage = getStoryStorage({
  adapterType: 'inMemory',
});
```

### Production (Cloud - when implemented)

```typescript
// In production config
import { getStoryStorage } from '@/lib/storage';

const storage = getStoryStorage({
  adapterType: 'cloud',
  cloudApiUrl: process.env.REACT_APP_API_URL,
  cloudApiKey: process.env.REACT_APP_API_KEY,
});
```

## Advanced: Custom Adapter

```typescript
import { IStoryStorage, StorageResult, StoryMetadata } from '@/lib/storage';
import type { Story, StoryId } from '@/types/models';
import { getStoryStorage } from '@/lib/storage';

class MyCustomAdapter implements IStoryStorage {
  async createStory(story: Story): Promise<StorageResult<Story>> {
    // Your custom implementation
    return { success: true, data: story };
  }

  async updateStory(storyId: StoryId, updates: Partial<Story>): Promise<StorageResult<Story>> {
    // Your custom implementation
  }

  // ... implement other methods
}

// Use custom adapter
const customAdapter = new MyCustomAdapter();
const storage = getStoryStorage({ adapter: customAdapter });
```
