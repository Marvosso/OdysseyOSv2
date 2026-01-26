# Transaction System Design

## Overview

Lightweight transaction system for atomic story persistence with rollback and versioning.

## Architecture

```
┌─────────────────┐
│  UI Components  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│ TransactionStorageAdapter│  Wraps base adapter
└────────┬────────────────┘
         │
         ▼
┌─────────────────┐
│ TransactionManager│  Creates & manages transactions
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Transaction   │  Atomic operations
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Base Adapter   │  (LocalStorage, InMemory, Cloud)
└─────────────────┘
```

## Core Components

### 1. Transaction Interface (`transaction.interface.ts`)

Defines the contract for transactions:
- `ITransaction` - Transaction interface
- `TransactionOperation` - Operation types (create, update, delete)
- `TransactionSnapshot` - For rollback
- `TransactionMetadata` - Transaction info with version tag

### 2. Transaction Manager (`TransactionManager.ts`)

Factory and executor for transactions:
- `Transaction` - Transaction implementation
- `TransactionManager` - Factory and helper methods
- Atomic commit/rollback
- Version tagging

### 3. Version Tracker (`versionTracker.ts`)

Tracks story versions:
- Version history per story
- Get story at specific version
- Automatic version pruning (keeps last 10)

### 4. Transaction Storage Adapter (`TransactionStorageAdapter.ts`)

Wraps any storage adapter with transaction support:
- All operations are transactional
- Automatic version tracking
- Rollback on failure

## Usage

### Basic Usage (Automatic Transactions)

```typescript
import { TransactionStorageAdapter } from '@/lib/storage/TransactionStorageAdapter';
import { LocalStorageAdapter } from '@/lib/storage/adapters/LocalStorageAdapter';
import { getStoryStorage } from '@/lib/storage/StoryStorageManager';

// Wrap existing adapter
const baseAdapter = new LocalStorageAdapter();
const transactionalAdapter = new TransactionStorageAdapter(baseAdapter);

// Use normally - all operations are transactional
const result = await transactionalAdapter.updateStory(storyId, updates);
// ✅ Automatically wrapped in transaction
// ✅ Rollback on failure
// ✅ Version tagged
```

### Manual Transaction Control

```typescript
import { TransactionManager } from '@/lib/storage/TransactionManager';
import { getStoryStorage } from '@/lib/storage/StoryStorageManager';

const storage = getStoryStorage().getAdapter();

// Execute multiple operations atomically
const result = await TransactionManager.execute(storage, async (txn) => {
  // Update story
  txn.addOperation({
    type: 'update',
    storyId: storyId1,
    updates: { title: 'New Title' },
  });
  
  // Create new story
  txn.addOperation({
    type: 'create',
    story: newStory,
  });
  
  // Delete old story
  txn.addOperation({
    type: 'delete',
    storyId: storyId2,
  });
});

if (result.success) {
  console.log('All operations committed');
  console.log('Version:', result.transaction.version);
} else {
  console.error('Transaction failed, rolled back:', result.error);
}
```

### Create Transaction Manually

```typescript
import { TransactionManager } from '@/lib/storage/TransactionManager';

const storage = getStoryStorage().getAdapter();
const txn = TransactionManager.create(storage, {
  onCommit: (metadata) => {
    console.log('Transaction committed:', metadata.version);
  },
  onRollback: (metadata) => {
    console.log('Transaction rolled back:', metadata.id);
  },
});

// Add operations
txn.addOperation({ type: 'update', storyId, updates });
txn.addOperation({ type: 'create', story: newStory });

// Commit
const result = await txn.commit();

if (!result.success) {
  // Transaction automatically rolled back
  console.error('Failed:', result.error);
}
```

## Atomic Operations

### How Atomicity Works

1. **Snapshot Creation**
   - Before executing operations, create snapshots of all affected stories
   - Snapshots stored in transaction metadata

2. **Operation Execution**
   - Execute all operations in sequence
   - If any operation fails, stop execution

3. **Commit or Rollback**
   - If all succeed: Commit (mark as committed)
   - If any fails: Rollback (restore from snapshots)

### Example: Atomic Multi-Story Update

```typescript
// Update multiple stories atomically
const result = await TransactionManager.execute(storage, (txn) => {
  txn.addOperation({
    type: 'update',
    storyId: story1Id,
    updates: { status: 'published' },
  });
  
  txn.addOperation({
    type: 'update',
    storyId: story2Id,
    updates: { status: 'published' },
  });
});

// Either both stories are updated, or neither
// No partial updates possible
```

## Rollback Mechanism

### Automatic Rollback

```typescript
// If any operation fails, all operations are rolled back
const result = await TransactionManager.execute(storage, (txn) => {
  txn.addOperation({ type: 'update', storyId: 'story-1', updates: {...} });
  txn.addOperation({ type: 'update', storyId: 'story-999', updates: {...} }); // Doesn't exist
});

// Result: Both operations rolled back
// story-1 is unchanged (even though first operation might have succeeded)
```

### Manual Rollback

```typescript
const txn = TransactionManager.create(storage);

txn.addOperation({ type: 'update', storyId, updates });
await txn.commit();

// Later, if needed:
await txn.rollback(); // Restores from snapshots
```

## Version Tagging

### Automatic Version Tags

Each committed transaction gets a unique version tag:
- Format: `v{timestamp}_{random}`
- Example: `v1704067200000_a3f9k2`

### Version History

```typescript
import { versionTracker } from '@/lib/storage/versionTracker';

// Get version history for a story
const history = versionTracker.getVersionHistory(storyId);

if (history) {
  console.log('Current version:', history.currentVersion);
  console.log('Version count:', history.versions.length);
  
  // Get story at specific version
  const oldVersion = versionTracker.getStoryAtVersion(
    storyId,
    history.versions[0].version
  );
}
```

### Version Tracking Integration

Versions are automatically tracked when using `TransactionStorageAdapter`:

```typescript
const adapter = new TransactionStorageAdapter(baseAdapter);

// Update story
await adapter.updateStory(storyId, updates);
// ✅ Version automatically recorded

// Get version history
const history = versionTracker.getVersionHistory(storyId);
```

## Integration Points

### 1. Storage Manager Integration

```typescript
// In StoryStorageManager.ts
import { TransactionStorageAdapter } from './TransactionStorageAdapter';

export class StoryStorageManager {
  // Add method to get transactional adapter
  getTransactionalAdapter(): IStoryStorage {
    return new TransactionStorageAdapter(this.adapter);
  }
  
  // Or wrap automatically
  private createAdapter(config: StorageManagerConfig): IStoryStorage {
    const baseAdapter = /* ... create base adapter ... */;
    
    // Wrap with transaction support
    return new TransactionStorageAdapter(baseAdapter);
  }
}
```

### 2. Component Integration

```typescript
// In components that need transactions
import { getStoryStorage } from '@/lib/storage/StoryStorageManager';
import { TransactionManager } from '@/lib/storage/TransactionManager';

// Use transactional operations
const storage = getStoryStorage().getAdapter();

// Atomic update
const result = await TransactionManager.execute(storage, (txn) => {
  txn.addOperation({
    type: 'update',
    storyId,
    updates: { title: newTitle },
  });
});
```

### 3. API Route Integration

```typescript
// In API routes
import { TransactionManager } from '@/lib/storage/TransactionManager';
import { getStoryStorage } from '@/lib/storage/StoryStorageManager';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const storage = getStoryStorage().getAdapter();
  const updates = await parseJsonBody(request);
  
  // Atomic update with transaction
  const result = await TransactionManager.execute(storage, (txn) => {
    txn.addOperation({
      type: 'update',
      storyId: createStoryId(params.id),
      updates,
    });
  });
  
  if (result.success) {
    return createSuccessResponse(result.stories?.[0], {
      headers: {
        'X-Transaction-Version': result.transaction.version,
      },
    });
  }
  
  return createErrorResponse({ ... }, { statusCode: 500 });
}
```

## Pseudocode

### Transaction Commit Flow

```
FUNCTION commit():
  IF status != 'pending':
    RETURN error
  
  TRY:
    // 1. Create snapshots
    FOR EACH operation IN operations:
      IF operation affects story:
        snapshot = createSnapshot(storyId)
        snapshots.add(snapshot)
    
    // 2. Execute operations
    FOR EACH operation IN operations:
      result = executeOperation(operation)
      IF result.failed:
        THROW error
      executedOperations.add(operation)
    
    // 3. All succeeded - commit
    status = 'committed'
    committedAt = now()
    RETURN success
    
  CATCH error:
    // 4. Rollback on failure
    status = 'failed'
    rollback()
    RETURN error
END FUNCTION
```

### Rollback Flow

```
FUNCTION rollback():
  FOR EACH snapshot IN snapshots:
    IF snapshot.story == null:
      // Story didn't exist - delete if it exists now
      IF storyExists(snapshot.storyId):
        deleteStory(snapshot.storyId)
    ELSE:
      // Restore original story
      IF storyExists(snapshot.storyId):
        updateStory(snapshot.storyId, snapshot.story)
      ELSE:
        createStory(snapshot.story)
  
  status = 'rolled-back'
END FUNCTION
```

## Benefits

✅ **Atomic Operations** - All succeed or all fail  
✅ **Rollback on Failure** - Automatic restoration  
✅ **Version Tagging** - Every save gets unique version  
✅ **Compatible** - Works with existing storage abstraction  
✅ **Lightweight** - Minimal overhead  
✅ **History** - Version tracking for rollback  

## Limitations

- **In-Memory Only** - Versions not persisted (lost on reload)
- **Limited History** - Only last 10 versions per story
- **No Distributed Transactions** - Single storage adapter only
- **No Nested Transactions** - One level only

## Future Enhancements

- [ ] Persist version history to storage
- [ ] Configurable version history size
- [ ] Transaction logging
- [ ] Conflict resolution
- [ ] Distributed transaction support

---

**The transaction system is ready for integration!** 🎯
