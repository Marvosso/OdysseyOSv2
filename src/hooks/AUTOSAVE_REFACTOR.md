# Autosave Refactor - Race Condition Prevention

## Problem: Race Conditions in Autosave

### Current Issues

1. **Multiple simultaneous saves** - No coordination between components
2. **Last write wins** - Older saves can overwrite newer content
3. **No cancellation** - In-flight saves can't be cancelled
4. **No debouncing** - Saves on every keystroke
5. **UI blocking** - Synchronous saves can freeze UI

### Race Condition Scenarios

#### Scenario 1: Rapid Typing
```
Time    Action                    Result
0ms     User types "A"           Save queued (data: "A")
100ms   User types "B"            Save queued (data: "AB")
200ms   User types "C"            Save queued (data: "ABC")
1000ms  Save "A" executes        ❌ Overwrites with old data
1100ms  Save "AB" executes        ❌ Overwrites with old data
1200ms  Save "ABC" executes       ✅ Correct, but two wrong saves happened
```

#### Scenario 2: Concurrent Components
```
Component A: Saves outline
Component B: Saves characters
Component C: Saves beats

All save to localStorage simultaneously
Last write wins - other data may be lost
```

## Solution: Centralized Autosave Queue

### Architecture

```
┌─────────────┐
│  Component  │  Triggers save
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  useAutosaveQueue│  Debounces + queues
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ AutosaveQueue   │  Centralized queue
│ - Prioritizes    │  - Cancels stale saves
│ - Ensures newest │  - Prevents overwrites
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  Storage Adapter │  Actual save
└─────────────────┘
```

### Key Features

1. **Debouncing** - Configurable delay (default 1s)
2. **Cancellation** - Stale saves cancelled automatically
3. **Newest Wins** - Always saves the most recent data
4. **Priority System** - Important saves can skip queue
5. **Non-blocking** - All saves are async
6. **Status Tracking** - Know when saves are in progress

## Implementation

### 1. Autosave Queue (`src/utils/autosaveQueue.ts`)

**Purpose:** Centralized queue that coordinates all autosave operations

**Key Methods:**
- `queueSave(key, data, saveFn, priority)` - Queue a save
- `cancelPending(key)` - Cancel pending saves
- `getStatus(key)` - Get save status

**Race Condition Prevention:**
```typescript
// When new save queued:
1. Cancel any pending debounced saves
2. Add to queue with timestamp
3. Sort queue: newest + highest priority first
4. Only execute newest save
5. Cancel any in-flight saves that are now stale
```

### 2. Autosave Hook (`src/hooks/useAutosaveQueue.ts`)

**Purpose:** React hook for components to use autosave

**Usage:**
```typescript
const { isSaving, saveNow } = useAutosaveQueue(data, saveFn, {
  key: 'outline',
  delay: 1000,
  priority: 1,
});
```

**Features:**
- Automatic debouncing
- Status updates
- Force save option
- Cancel pending option

### 3. Standalone Hook (`src/hooks/useAutosave.ts`)

**Purpose:** Simpler hook for single-component autosave (no queue)

**Use when:**
- Only one component saves this data
- Don't need cross-component coordination

## Race Condition Prevention Explained

### Problem: Last Write Wins

**Before:**
```typescript
// Component saves data
useEffect(() => {
  save(data); // ❌ No coordination
}, [data]);

// If user types quickly:
// Save 1: data = "A" (queued at 0ms, executes at 1000ms)
// Save 2: data = "AB" (queued at 100ms, executes at 1100ms)
// Save 3: data = "ABC" (queued at 200ms, executes at 1200ms)

// Result: All three saves execute, last one wins
// But if Save 1 executes after Save 3, old data overwrites new!
```

**After:**
```typescript
// Component uses autosave hook
useAutosaveQueue(data, saveFn, { key: 'outline', delay: 1000 });

// If user types quickly:
// Save 1: data = "A" (queued at 0ms)
// Save 2: data = "AB" (queued at 100ms) → Cancels Save 1
// Save 3: data = "ABC" (queued at 200ms) → Cancels Save 2

// Only Save 3 executes (newest data)
// Result: Always saves newest content ✅
```

### How It Works

1. **Timestamp Tracking**
   - Each save gets a timestamp
   - Only saves with latest timestamp execute
   - Older saves are automatically cancelled

2. **Queue Sorting**
   - Sorted by: priority (high first), then timestamp (new first)
   - Only top item executes
   - Others wait or get cancelled

3. **Cancellation**
   - When new save queued, old debounced saves cancelled
   - When save executes, checks if it's still the newest
   - If not, cancels itself

4. **Non-blocking**
   - All saves are async
   - UI never freezes
   - Status updates via polling

## Component Updates Required

### 1. OutlineBuilder.tsx

**Before:**
```typescript
useEffect(() => {
  if (outline) {
    StoryStorage.saveOutline(outline); // ❌ No debounce, no error handling
  }
}, [outline]);
```

**After:**
```typescript
import { useAutosaveQueue } from '@/hooks/useAutosaveQueue';

const { isSaving } = useAutosaveQueue(
  outline,
  async (outlineData) => {
    if (outlineData) {
      const storage = getStoryStorage();
      // Use new storage abstraction
      // Or keep StoryStorage but wrap in async
      await new Promise<void>((resolve) => {
        StoryStorage.saveOutline(outlineData);
        resolve();
      });
    }
  },
  {
    key: 'outline',
    delay: 1000,
    enabled: !!outline,
  }
);

// Show saving indicator
{isSaving && <span>Saving...</span>}
```

### 2. CharacterHub.tsx

**Before:**
```typescript
useEffect(() => {
  localStorage.setItem('odysseyos-characters', JSON.stringify(characters)); // ❌ Direct localStorage
}, [characters]);
```

**After:**
```typescript
import { useAutosaveQueue } from '@/hooks/useAutosaveQueue';

const { isSaving } = useAutosaveQueue(
  characters,
  async (chars) => {
    // Use storage abstraction or direct save
    localStorage.setItem('odysseyos-characters', JSON.stringify(chars));
  },
  {
    key: 'characters',
    delay: 1000,
  }
);
```

### 3. BeatEditor.tsx

**Before:**
```typescript
useEffect(() => {
  if (beats.length > 0) {
    localStorage.setItem(`beats-${sceneId}`, JSON.stringify(beats));
    onBeatChange?.(beats);
  }
}, [beats, sceneId, onBeatChange]);
```

**After:**
```typescript
import { useAutosaveQueue } from '@/hooks/useAutosaveQueue';

const { isSaving } = useAutosaveQueue(
  beats,
  async (beatsData) => {
    if (beatsData.length > 0) {
      localStorage.setItem(`beats-${sceneId}`, JSON.stringify(beatsData));
      onBeatChange?.(beatsData);
    }
  },
  {
    key: `beats-${sceneId}`,
    delay: 1000,
    enabled: beats.length > 0,
  }
);
```

### 4. VoiceTrainer.tsx

**Before:**
```typescript
useEffect(() => {
  if (voice) {
    localStorage.setItem(`voice-${characterId}`, JSON.stringify(voice));
    onVoiceChange?.(voice);
  }
}, [voice, characterId, onVoiceChange]);
```

**After:**
```typescript
import { useAutosaveQueue } from '@/hooks/useAutosaveQueue';

const { isSaving } = useAutosaveQueue(
  voice,
  async (voiceData) => {
    if (voiceData) {
      localStorage.setItem(`voice-${characterId}`, JSON.stringify(voiceData));
      onVoiceChange?.(voiceData);
    }
  },
  {
    key: `voice-${characterId}`,
    delay: 1000,
    enabled: !!voice,
  }
);
```

## Migration Checklist

- [ ] Update `OutlineBuilder.tsx` to use `useAutosaveQueue`
- [ ] Update `CharacterHub.tsx` to use `useAutosaveQueue`
- [ ] Update `BeatEditor.tsx` to use `useAutosaveQueue`
- [ ] Update `VoiceTrainer.tsx` to use `useAutosaveQueue`
- [ ] Add saving indicators to UI
- [ ] Test rapid typing scenarios
- [ ] Test concurrent component saves
- [ ] Test cancellation scenarios
- [ ] Verify newest content always wins

## Testing Race Condition Prevention

### Test 1: Rapid Typing
```typescript
it('should only save newest data on rapid typing', async () => {
  const saveFn = jest.fn();
  const { result } = renderHook(() => 
    useAutosaveQueue('test', saveFn, { delay: 1000 })
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
```

### Test 2: Concurrent Saves
```typescript
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
    // Should only save newest
    expect(saves).toHaveLength(1);
    expect(saves[0]).toBe('B:data2'); // Newest wins
  });
});
```

## Benefits

✅ **No Race Conditions** - Centralized queue prevents conflicts  
✅ **Newest Always Wins** - Timestamp-based cancellation  
✅ **Debounced** - Configurable delay reduces save frequency  
✅ **Non-blocking** - Async saves don't freeze UI  
✅ **Status Tracking** - Know when saves are in progress  
✅ **Cancellable** - Can cancel pending saves  
✅ **Priority Support** - Important saves can skip queue  

## Performance

- **Debounce delay:** 1000ms default (configurable)
- **Status polling:** 100ms interval (lightweight)
- **Memory:** Minimal (only stores pending saves)
- **CPU:** Low (debouncing prevents excessive saves)

## Future Enhancements

- [ ] Retry failed saves
- [ ] Batch multiple saves
- [ ] Persist queue across page reloads
- [ ] Visual save indicators
- [ ] Save conflict resolution UI
