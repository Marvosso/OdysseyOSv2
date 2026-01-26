# Component Update Guide - Autosave Refactor

## Components That Need Updates

### 1. OutlineBuilder.tsx

**File:** `src/components/outline/OutlineBuilder.tsx`

**Current Code (Lines 46-51):**
```typescript
// Auto-save outline when it changes
useEffect(() => {
  if (outline) {
    StoryStorage.saveOutline(outline);
  }
}, [outline]);
```

**Updated Code:**
```typescript
import { useAutosaveQueue } from '@/hooks/useAutosaveQueue';
import { StoryStorage } from '@/lib/storage/storyStorage';

// Inside component:
const { isSaving, lastSaveSuccess } = useAutosaveQueue(
  outline,
  async (outlineData) => {
    if (outlineData) {
      // Wrap sync function in async
      return new Promise<void>((resolve, reject) => {
        try {
          StoryStorage.saveOutline(outlineData);
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    }
  },
  {
    key: 'outline',
    delay: 1000,
    enabled: !!outline,
    onSaveError: (error) => {
      console.error('Failed to save outline:', error);
      // Could show toast notification here
    },
  }
);

// Optional: Show saving indicator in UI
{isSaving && (
  <span className="text-xs text-gray-500">Saving...</span>
)}
```

---

### 2. CharacterHub.tsx

**File:** `src/components/characters/CharacterHub.tsx`

**Current Code (Lines 35-37):**
```typescript
useEffect(() => {
  localStorage.setItem('odysseyos-characters', JSON.stringify(characters));
}, [characters]);
```

**Updated Code:**
```typescript
import { useAutosaveQueue } from '@/hooks/useAutosaveQueue';
import { validateTextForStorage } from '@/utils/textSafety';

// Inside component:
const { isSaving, lastSaveSuccess } = useAutosaveQueue(
  characters,
  async (chars) => {
    // Validate before saving
    const validated = chars.map(char => ({
      ...char,
      // Validate text fields if needed
      appearance: validateTextForStorage(char.appearance || '').sanitized,
      personality: validateTextForStorage(char.personality || '').sanitized,
    }));
    
    localStorage.setItem('odysseyos-characters', JSON.stringify(validated));
  },
  {
    key: 'characters',
    delay: 1000,
    enabled: characters.length > 0,
  }
);
```

---

### 3. BeatEditor.tsx

**File:** `src/components/beat-editor/BeatEditor.tsx`

**Current Code (Lines 42-48):**
```typescript
// Save beats to localStorage
useEffect(() => {
  if (beats.length > 0) {
    localStorage.setItem(`beats-${sceneId}`, JSON.stringify(beats));
    onBeatChange?.(beats);
  }
}, [beats, sceneId, onBeatChange]);
```

**Updated Code:**
```typescript
import { useAutosaveQueue } from '@/hooks/useAutosaveQueue';

// Inside component:
const { isSaving } = useAutosaveQueue(
  beats,
  async (beatsData) => {
    if (beatsData.length > 0) {
      localStorage.setItem(`beats-${sceneId}`, JSON.stringify(beatsData));
      // Call callback after successful save
      onBeatChange?.(beatsData);
    }
  },
  {
    key: `beats-${sceneId}`,
    delay: 1000,
    enabled: beats.length > 0,
  }
);

// Remove the old useEffect
```

---

### 4. VoiceTrainer.tsx

**File:** `src/components/voice-trainer/VoiceTrainer.tsx`

**Current Code (Lines 42-47):**
```typescript
useEffect(() => {
  if (voice) {
    localStorage.setItem(`voice-${characterId}`, JSON.stringify(voice));
    onVoiceChange?.(voice);
  }
}, [voice, characterId, onVoiceChange]);
```

**Updated Code:**
```typescript
import { useAutosaveQueue } from '@/hooks/useAutosaveQueue';

// Inside component:
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

// Remove the old useEffect
```

---

## Migration Steps

### Step 1: Update Imports

Add to each component:
```typescript
import { useAutosaveQueue } from '@/hooks/useAutosaveQueue';
```

### Step 2: Replace useEffect with Hook

**Before:**
```typescript
useEffect(() => {
  if (data) {
    saveFunction(data);
  }
}, [data]);
```

**After:**
```typescript
const { isSaving } = useAutosaveQueue(
  data,
  async (dataToSave) => {
    if (dataToSave) {
      await saveFunction(dataToSave);
    }
  },
  {
    key: 'unique-key',
    delay: 1000,
    enabled: !!data,
  }
);
```

### Step 3: Remove Old useEffect

Delete the old autosave `useEffect` hook.

### Step 4: Add Saving Indicators (Optional)

```typescript
{isSaving && (
  <span className="text-xs text-gray-500 animate-pulse">
    Saving...
  </span>
)}
```

---

## Key Changes Summary

1. **Debouncing** - All saves now debounced (default 1s)
2. **Race Condition Prevention** - Centralized queue ensures newest wins
3. **Error Handling** - Optional error callbacks
4. **Status Tracking** - Know when saves are in progress
5. **Cancellation** - Stale saves automatically cancelled

---

## Testing After Update

1. **Rapid Typing Test**
   - Type quickly in outline
   - Verify only latest content saves
   - Check no data loss

2. **Concurrent Component Test**
   - Edit outline and characters simultaneously
   - Verify both save correctly
   - Check no overwrites

3. **Error Handling Test**
   - Fill localStorage to quota
   - Attempt save
   - Verify error callback fires

4. **Cancellation Test**
   - Make rapid changes
   - Verify old saves cancelled
   - Verify only newest saves

---

## Benefits After Update

✅ No race conditions  
✅ Newest content always persists  
✅ Debounced saves (better performance)  
✅ Error handling  
✅ Status tracking  
✅ Non-blocking (no UI freeze)  
