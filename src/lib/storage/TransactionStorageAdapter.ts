/**
 * Transaction-Enabled Storage Adapter
 * 
 * Wraps existing storage adapter with transaction support
 * Provides atomic operations and rollback
 */

import type {
  IStoryStorage,
  StorageResult,
  StoryMetadata,
} from './storage.interface';
import type { Story, StoryId } from '@/types/models';
import { TransactionManager, Transaction } from './TransactionManager';
import { versionTracker } from './versionTracker';
import type { TransactionResult } from './transaction.interface';

/**
 * Transaction-enabled storage adapter
 * Wraps any storage adapter with transaction support
 */
export class TransactionStorageAdapter implements IStoryStorage {
  constructor(private baseAdapter: IStoryStorage) {}

  /**
   * Check if storage is available
   */
  async isAvailable(): Promise<boolean> {
    return this.baseAdapter.isAvailable();
  }

  /**
   * Create a new story (with transaction)
   */
  async createStory(story: Story): Promise<StorageResult<Story>> {
    let createdStory: Story | undefined;
    
    const result = await TransactionManager.execute(
      this.baseAdapter,
      (txn) => {
        txn.addOperation({
          type: 'create',
          story,
        });
      },
      {
        onCommit: (transaction) => {
          // Record version after commit
          if (createdStory) {
            versionTracker.recordVersion(story.id, createdStory, transaction);
          }
        },
      }
    );

    if (result.success && result.stories && result.stories.length > 0) {
      createdStory = result.stories[0];
      return {
        success: true,
        data: createdStory,
      };
    }

    return {
      success: false,
      error: result.error || 'Transaction failed',
    };
  }

  /**
   * Update a story (with transaction)
   */
  async updateStory(
    storyId: StoryId,
    updates: Partial<Omit<Story, 'id' | 'version'>>
  ): Promise<StorageResult<Story>> {
    let updatedStory: Story | undefined;
    
    const result = await TransactionManager.execute(
      this.baseAdapter,
      (txn) => {
        txn.addOperation({
          type: 'update',
          storyId,
          updates,
        });
      },
      {
        onCommit: async (transaction) => {
          // Record version after commit
          if (updatedStory) {
            versionTracker.recordVersion(storyId, updatedStory, transaction);
          } else {
            // Get updated story if not in result
            const getResult = await this.baseAdapter.getStory(storyId);
            if (getResult.success && getResult.data) {
              versionTracker.recordVersion(storyId, getResult.data, transaction);
            }
          }
        },
      }
    );

    if (result.success && result.stories && result.stories.length > 0) {
      return {
        success: true,
        data: result.stories[0],
      };
    }

    return {
      success: false,
      error: result.error || 'Transaction failed',
    };
  }

  /**
   * Delete a story (with transaction)
   */
  async deleteStory(storyId: StoryId): Promise<StorageResult<void>> {
    const result = await TransactionManager.execute(
      this.baseAdapter,
      (txn) => {
        txn.addOperation({
          type: 'delete',
          storyId,
        });
      }
    );

    if (result.success) {
      // Clear version history
      versionTracker.clearHistory(storyId);
    }

    return {
      success: result.success,
      error: result.error,
    };
  }

  /**
   * Get a story (no transaction needed)
   */
  async getStory(storyId: StoryId): Promise<StorageResult<Story | null>> {
    return this.baseAdapter.getStory(storyId);
  }

  /**
   * List stories (no transaction needed)
   */
  async listStories(): Promise<StorageResult<readonly StoryMetadata[]>> {
    return this.baseAdapter.listStories();
  }

  /**
   * Clear all stories (with transaction)
   */
  async clearAll(): Promise<StorageResult<void>> {
    // Get all stories first
    const listResult = await this.baseAdapter.listStories();
    if (!listResult.success || !listResult.data) {
      return {
        success: false,
        error: 'Failed to list stories',
      };
    }

    // Delete all in a single transaction
    const result = await TransactionManager.execute(
      this.baseAdapter,
      (txn) => {
        for (const metadata of listResult.data!) {
          txn.addOperation({
            type: 'delete',
            storyId: metadata.id,
          });
        }
      }
    );

    if (result.success) {
      versionTracker.clearAll();
    }

    return {
      success: result.success,
      error: result.error,
    };
  }

  /**
   * Execute multiple operations atomically
   * 
   * Example:
   * ```typescript
   * await adapter.executeTransaction(async (txn) => {
   *   txn.addOperation({ type: 'update', storyId: 'story-1', updates: {...} });
   *   txn.addOperation({ type: 'create', story: newStory });
   * });
   * ```
   */
  async executeTransaction(
    operations: (txn: Transaction) => void | Promise<void>
  ): Promise<TransactionResult> {
    return TransactionManager.execute(this.baseAdapter, operations, {
      onCommit: (transaction) => {
        // Record versions for all affected stories
        for (const op of transaction.operations) {
          if (op.type === 'create' && op.story) {
            versionTracker.recordVersion(op.story.id, op.story, transaction);
          } else if (op.type === 'update' && op.storyId) {
            // Get updated story to record version
            this.baseAdapter.getStory(op.storyId).then((result) => {
              if (result.success && result.data) {
                versionTracker.recordVersion(op.storyId, result.data, transaction);
              }
            });
          }
        }
      },
    });
  }
}
