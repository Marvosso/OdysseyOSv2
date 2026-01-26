/**
 * Story Storage Manager
 * 
 * Centralized storage management with adapter pattern
 * Allows switching between storage implementations without changing UI code
 */

import type { IStoryStorage, StorageResult, StoryMetadata } from './storage.interface';
import type { Story, StoryId } from '@/types/models';
import { LocalStorageAdapter } from './adapters/LocalStorageAdapter';
import { InMemoryAdapter } from './adapters/InMemoryAdapter';
import { CloudAdapter } from './adapters/CloudAdapter';

/**
 * Storage adapter type
 */
export type StorageAdapterType = 'localStorage' | 'inMemory' | 'cloud';

/**
 * Storage configuration
 */
export interface StorageManagerConfig {
  /** Adapter type to use */
  adapterType?: StorageAdapterType;
  /** Custom adapter instance (overrides adapterType) */
  adapter?: IStoryStorage;
  /** LocalStorage prefix (for localStorage adapter) */
  localStoragePrefix?: string;
  /** Cloud API URL (for cloud adapter) */
  cloudApiUrl?: string;
  /** Cloud API key (for cloud adapter) */
  cloudApiKey?: string;
}

/**
 * Story Storage Manager
 * 
 * Singleton pattern for centralized storage access
 * UI components use this manager, not direct adapters
 */
export class StoryStorageManager {
  private static instance: StoryStorageManager | null = null;
  private adapter: IStoryStorage;

  private constructor(config: StorageManagerConfig = {}) {
    this.adapter = this.createAdapter(config);
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: StorageManagerConfig): StoryStorageManager {
    if (!StoryStorageManager.instance) {
      StoryStorageManager.instance = new StoryStorageManager(config);
    }
    return StoryStorageManager.instance;
  }

  /**
   * Reset singleton (useful for testing)
   */
  static resetInstance(): void {
    StoryStorageManager.instance = null;
  }

  /**
   * Create adapter based on configuration
   */
  private createAdapter(config: StorageManagerConfig): IStoryStorage {
    // Use custom adapter if provided
    if (config.adapter) {
      return config.adapter;
    }

    // Create adapter based on type
    const adapterType = config.adapterType || 'localStorage';

    switch (adapterType) {
      case 'inMemory':
        return new InMemoryAdapter();

      case 'cloud':
        if (!config.cloudApiUrl) {
          console.warn(
            'Cloud adapter requires cloudApiUrl. Falling back to localStorage.'
          );
          return new LocalStorageAdapter(config.localStoragePrefix);
        }
        return new CloudAdapter(config.cloudApiUrl, config.cloudApiKey);

      case 'localStorage':
      default:
        return new LocalStorageAdapter(config.localStoragePrefix);
    }
  }

  /**
   * Switch to a different adapter
   */
  switchAdapter(adapter: IStoryStorage): void {
    this.adapter = adapter;
  }

  /**
   * Get current adapter
   */
  getAdapter(): IStoryStorage {
    return this.adapter;
  }

  /**
   * Create a new story
   */
  async createStory(story: Story): Promise<StorageResult<Story>> {
    return this.adapter.createStory(story);
  }

  /**
   * Update an existing story
   */
  async updateStory(
    storyId: StoryId,
    updates: Partial<Omit<Story, 'id' | 'version'>>
  ): Promise<StorageResult<Story>> {
    return this.adapter.updateStory(storyId, updates);
  }

  /**
   * Delete a story
   */
  async deleteStory(storyId: StoryId): Promise<StorageResult<void>> {
    return this.adapter.deleteStory(storyId);
  }

  /**
   * Get a single story by ID
   */
  async getStory(storyId: StoryId): Promise<StorageResult<Story | null>> {
    return this.adapter.getStory(storyId);
  }

  /**
   * List all stories (returns metadata only)
   */
  async listStories(): Promise<StorageResult<readonly StoryMetadata[]>> {
    return this.adapter.listStories();
  }

  /**
   * Check if storage is available
   */
  async isAvailable(): Promise<boolean> {
    return this.adapter.isAvailable();
  }

  /**
   * Clear all stories
   */
  async clearAll(): Promise<StorageResult<void>> {
    return this.adapter.clearAll();
  }
}

/**
 * Convenience function to get storage manager instance
 * 
 * Usage in components:
 * ```typescript
 * const storage = getStoryStorage();
 * const result = await storage.createStory(story);
 * ```
 */
export function getStoryStorage(
  config?: StorageManagerConfig
): StoryStorageManager {
  return StoryStorageManager.getInstance(config);
}

/**
 * Default export for convenience
 */
export default StoryStorageManager;
