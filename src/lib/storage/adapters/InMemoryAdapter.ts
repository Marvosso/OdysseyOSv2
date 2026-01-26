/**
 * In-Memory Storage Adapter
 * 
 * Testing and development storage implementation
 * Data is lost on page refresh
 */

import type {
  IStoryStorage,
  StorageResult,
  StoryMetadata,
} from '../storage.interface';
import type { Story, StoryId } from '@/types/models';

/**
 * In-memory adapter implementation
 * Stores stories in a Map in memory
 */
export class InMemoryAdapter implements IStoryStorage {
  private readonly stories: Map<StoryId, Story>;

  constructor() {
    this.stories = new Map();
  }

  /**
   * Always available (in-memory)
   */
  async isAvailable(): Promise<boolean> {
    return true;
  }

  /**
   * Create a new story
   */
  async createStory(story: Story): Promise<StorageResult<Story>> {
    try {
      // Check if story with same ID already exists
      if (this.stories.has(story.id)) {
        return {
          success: false,
          error: `Story with ID ${story.id} already exists`,
        };
      }

      // Add new story
      this.stories.set(story.id, story);

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
      const existingStory = this.stories.get(storyId);

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
          updatedAt: new Date(),
          patch: existingStory.version.patch + 1,
        },
      } as Story;

      this.stories.set(storyId, updatedStory);

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
      if (!this.stories.has(storyId)) {
        return {
          success: false,
          error: `Story with ID ${storyId} not found`,
        };
      }

      this.stories.delete(storyId);

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
      const story = this.stories.get(storyId) || null;

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
      const metadata: StoryMetadata[] = Array.from(this.stories.values()).map(
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
      this.stories.clear();

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
   * Get internal storage (for testing)
   */
  getInternalStorage(): Map<StoryId, Story> {
    return this.stories;
  }
}
