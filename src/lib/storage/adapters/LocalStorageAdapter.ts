/**
 * LocalStorage Storage Adapter
 * 
 * Temporary storage implementation using browser localStorage
 * Suitable for development and single-user scenarios
 */

import type {
  IStoryStorage,
  StorageResult,
  StoryMetadata,
} from '../storage.interface';
import type { Story, StoryId } from '@/types/models';
import { createStoryId } from '@/types/models';
import { DataValidator } from '../dataValidator';
import { BackupManager } from '../backupManager';
import {
  serializeWithDates,
  deserializeWithDates,
  normalizeDatesInObject,
  getCurrentDate,
} from '@/utils/dateSerialization';

/**
 * LocalStorage adapter implementation
 */
export class LocalStorageAdapter implements IStoryStorage {
  private readonly prefix: string;
  private readonly storiesKey: string;

  constructor(prefix: string = 'odysseyos') {
    this.prefix = prefix;
    this.storiesKey = `${prefix}_stories`;
  }

  /**
   * Check if localStorage is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }
      // Test write/read
      const testKey = `${this.prefix}_test`;
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get all stories from localStorage
   * FIXED: Added backup recovery and validation
   */
  private getAllStories(): Map<StoryId, Story> {
    try {
      const stored = localStorage.getItem(this.storiesKey);
      if (!stored) {
        return new Map();
      }

      // Validate JSON before parsing
      if (!DataValidator.isValidJSON(stored)) {
        console.warn('Corrupted JSON detected, attempting backup recovery');
        const backup = BackupManager.getLatestBackup(this.storiesKey);
        if (backup) {
          console.warn('Restored from backup');
          return this.parseStoriesArray(backup as Story[]);
        }
        throw new Error('Corrupted data and no backup available');
      }

      // FIXED: Deserialize with date handling
      const stories = deserializeWithDates<Story[]>(stored);
      // Normalize dates in case some weren't properly serialized
      const normalizedStories = stories.map(story =>
        normalizeDatesInObject(story, ['createdAt', 'updatedAt', 'computedAt', 'timestamp'])
      );
      return this.parseStoriesArray(normalizedStories);
    } catch (error) {
      console.error('Error reading stories from localStorage:', error);
      
      // Try backup recovery
      try {
        const backup = BackupManager.getLatestBackup(this.storiesKey);
        if (backup) {
          console.warn('Recovered from backup after error');
          return this.parseStoriesArray(backup as Story[]);
        }
      } catch (backupError) {
        console.error('Backup recovery also failed:', backupError);
      }
      
      return new Map();
    }
  }

  /**
   * Parse and validate stories array
   * FIXED: Normalize dates after parsing
   */
  private parseStoriesArray(stories: unknown[]): Map<StoryId, Story> {
    const validStories: Story[] = [];

    for (const story of stories) {
      const validation = DataValidator.validateStory(story);
      if (validation.isValid) {
        // Normalize dates to ensure they're Date objects
        const normalizedStory = normalizeDatesInObject(story as Story, [
          'createdAt',
          'updatedAt',
          'computedAt',
          'timestamp',
        ]);
        validStories.push(normalizedStory as Story);
      } else {
        console.warn('Invalid story filtered:', validation.errors);
      }
    }

    return new Map(validStories.map(story => [story.id, story]));
  }

  /**
   * Save all stories to localStorage
   * FIXED: Added quota handling, backup, and date serialization
   */
  private saveAllStories(stories: Map<StoryId, Story>): void {
    try {
      const storiesArray = Array.from(stories.values());
      // FIXED: Serialize with date handling
      const jsonString = serializeWithDates(storiesArray);
      
      // Check size before saving
      const sizeInBytes = new Blob([jsonString]).size;
      const maxSize = 4 * 1024 * 1024; // 4MB (leave 1MB buffer)
      
      if (sizeInBytes > maxSize) {
        throw new Error(
          `Data too large: ${(sizeInBytes / 1024 / 1024).toFixed(2)}MB exceeds ${(maxSize / 1024 / 1024).toFixed(2)}MB limit. ` +
          `Please delete some stories or export data.`
        );
      }

      // Create backup before saving
      BackupManager.createBackup(storiesArray, this.storiesKey);

      // Attempt save
      localStorage.setItem(this.storiesKey, jsonString);
    } catch (error) {
      // Handle quota exceeded specifically
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.error('Storage quota exceeded');
        throw new Error(
          'Storage quota exceeded. Please delete some stories, clear browser data, or export your work.'
        );
      }
      
      // Handle other errors
      if (error instanceof Error && error.message.includes('too large')) {
        throw error; // Re-throw size limit errors
      }
      
      console.error('Error saving stories to localStorage:', error);
      throw new Error(
        `Failed to save: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Create a new story
   */
  async createStory(story: Story): Promise<StorageResult<Story>> {
    try {
      if (!(await this.isAvailable())) {
        return {
          success: false,
          error: 'LocalStorage is not available',
        };
      }

      const stories = this.getAllStories();

      // Check if story with same ID already exists
      if (stories.has(story.id)) {
        return {
          success: false,
          error: `Story with ID ${story.id} already exists`,
        };
      }

      // Add new story
      stories.set(story.id, story);
      this.saveAllStories(stories);

      return {
        success: true,
        data: story,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Update an existing story
   */
  async updateStory(
    storyId: StoryId,
    updates: Partial<Omit<Story, 'id' | 'version'>>
  ): Promise<StorageResult<Story>> {
    try {
      if (!(await this.isAvailable())) {
        return {
          success: false,
          error: 'LocalStorage is not available',
        };
      }

      const stories = this.getAllStories();
      const existingStory = stories.get(storyId);

      if (!existingStory) {
        return {
          success: false,
          error: `Story with ID ${storyId} not found`,
        };
      }

      // Merge updates with existing story
      const updatedStory: Story = {
        ...existingStory,
        ...updates,
        id: storyId, // Ensure ID doesn't change
        version: {
          ...existingStory.version,
          updatedAt: getCurrentDate(),
          patch: existingStory.version.patch + 1,
        },
      } as Story;

      stories.set(storyId, updatedStory);
      this.saveAllStories(stories);

      return {
        success: true,
        data: updatedStory,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Delete a story
   */
  async deleteStory(storyId: StoryId): Promise<StorageResult<void>> {
    try {
      if (!(await this.isAvailable())) {
        return {
          success: false,
          error: 'LocalStorage is not available',
        };
      }

      const stories = this.getAllStories();

      if (!stories.has(storyId)) {
        return {
          success: false,
          error: `Story with ID ${storyId} not found`,
        };
      }

      stories.delete(storyId);
      this.saveAllStories(stories);

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get a single story by ID
   */
  async getStory(storyId: StoryId): Promise<StorageResult<Story | null>> {
    try {
      if (!(await this.isAvailable())) {
        return {
          success: false,
          error: 'LocalStorage is not available',
        };
      }

      const stories = this.getAllStories();
      const story = stories.get(storyId) || null;

      return {
        success: true,
        data: story,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * List all stories (returns metadata only)
   */
  async listStories(): Promise<StorageResult<readonly StoryMetadata[]>> {
    try {
      if (!(await this.isAvailable())) {
        return {
          success: false,
          error: 'LocalStorage is not available',
        };
      }

      const stories = this.getAllStories();
      const metadata: StoryMetadata[] = Array.from(stories.values()).map(
        story => ({
          id: story.id,
          title: story.title,
          status: story.status,
          wordCount: story.wordCount.computed,
          updatedAt: story.version.updatedAt,
          createdAt: story.version.createdAt,
        })
      );

      // Sort by updatedAt (most recent first)
      metadata.sort(
        (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
      );

      return {
        success: true,
        data: metadata,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Clear all stories
   */
  async clearAll(): Promise<StorageResult<void>> {
    try {
      if (!(await this.isAvailable())) {
        return {
          success: false,
          error: 'LocalStorage is not available',
        };
      }

      localStorage.removeItem(this.storiesKey);

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
