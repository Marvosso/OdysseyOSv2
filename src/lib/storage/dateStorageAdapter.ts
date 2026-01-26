/**
 * Date Storage Adapter
 * 
 * Wraps storage adapter with automatic date serialization/deserialization
 * Ensures dates are properly handled in all storage operations
 */

import type { IStoryStorage, StorageResult, StoryMetadata } from './storage.interface';
import type { Story, StoryId } from '@/types/models';
import {
  serializeWithDates,
  deserializeWithDates,
  normalizeDatesInObject,
} from '@/utils/dateSerialization';

/**
 * Storage adapter wrapper that handles date serialization
 */
export class DateStorageAdapter implements IStoryStorage {
  constructor(private baseAdapter: IStoryStorage) {}

  async isAvailable(): Promise<boolean> {
    return this.baseAdapter.isAvailable();
  }

  async createStory(story: Story): Promise<StorageResult<Story>> {
    // Normalize dates before saving
    const normalizedStory = normalizeDatesInObject(story, [
      'createdAt',
      'updatedAt',
      'computedAt',
      'timestamp',
    ]);

    const result = await this.baseAdapter.createStory(normalizedStory as Story);

    // Normalize dates in result
    if (result.success && result.data) {
      return {
        ...result,
        data: normalizeDatesInObject(result.data, [
          'createdAt',
          'updatedAt',
          'computedAt',
          'timestamp',
        ]) as Story,
      };
    }

    return result;
  }

  async updateStory(
    storyId: StoryId,
    updates: Partial<Omit<Story, 'id' | 'version'>>
  ): Promise<StorageResult<Story>> {
    // Normalize dates in updates
    const normalizedUpdates = normalizeDatesInObject(updates, [
      'createdAt',
      'updatedAt',
      'computedAt',
      'timestamp',
    ]);

    const result = await this.baseAdapter.updateStory(
      storyId,
      normalizedUpdates as Partial<Omit<Story, 'id' | 'version'>>
    );

    // Normalize dates in result
    if (result.success && result.data) {
      return {
        ...result,
        data: normalizeDatesInObject(result.data, [
          'createdAt',
          'updatedAt',
          'computedAt',
          'timestamp',
        ]) as Story,
      };
    }

    return result;
  }

  async deleteStory(storyId: StoryId): Promise<StorageResult<void>> {
    return this.baseAdapter.deleteStory(storyId);
  }

  async getStory(storyId: StoryId): Promise<StorageResult<Story | null>> {
    const result = await this.baseAdapter.getStory(storyId);

    // Normalize dates in result
    if (result.success && result.data) {
      return {
        ...result,
        data: normalizeDatesInObject(result.data, [
          'createdAt',
          'updatedAt',
          'computedAt',
          'timestamp',
        ]) as Story,
      };
    }

    return result;
  }

  async listStories(): Promise<StorageResult<readonly StoryMetadata[]>> {
    const result = await this.baseAdapter.listStories();

    // Normalize dates in metadata
    if (result.success && result.data) {
      return {
        ...result,
        data: result.data.map(metadata =>
          normalizeDatesInObject(metadata, ['createdAt', 'updatedAt'])
        ) as readonly StoryMetadata[],
      };
    }

    return result;
  }

  async clearAll(): Promise<StorageResult<void>> {
    return this.baseAdapter.clearAll();
  }
}
