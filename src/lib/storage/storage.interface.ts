/**
 * Storage Abstraction Layer
 * 
 * Interface-based design for story storage operations
 * Allows switching between different storage implementations
 * without changing UI code
 */

import type { Story, StoryId } from '@/types/models';

/**
 * Result of storage operations
 */
export interface StorageResult<T> {
  /** Whether the operation was successful */
  readonly success: boolean;
  /** Result data (if successful) */
  readonly data?: T;
  /** Error message (if failed) */
  readonly error?: string;
}

/**
 * Story metadata for listing (lightweight)
 */
export interface StoryMetadata {
  readonly id: StoryId;
  readonly title: string;
  readonly status: Story['status'];
  readonly wordCount: number;
  readonly updatedAt: Date;
  readonly createdAt: Date;
}

/**
 * Storage adapter interface
 * All storage implementations must implement this interface
 */
export interface IStoryStorage {
  /**
   * Create a new story
   * @param story Story to create
   * @returns Result with created story
   */
  createStory(story: Story): Promise<StorageResult<Story>>;

  /**
   * Update an existing story
   * @param storyId ID of story to update
   * @param updates Partial story updates
   * @returns Result with updated story
   */
  updateStory(
    storyId: StoryId,
    updates: Partial<Omit<Story, 'id' | 'version'>>
  ): Promise<StorageResult<Story>>;

  /**
   * Delete a story
   * @param storyId ID of story to delete
   * @returns Result indicating success
   */
  deleteStory(storyId: StoryId): Promise<StorageResult<void>>;

  /**
   * Get a single story by ID
   * @param storyId ID of story to retrieve
   * @returns Result with story or null if not found
   */
  getStory(storyId: StoryId): Promise<StorageResult<Story | null>>;

  /**
   * List all stories (returns metadata only for performance)
   * @returns Result with array of story metadata
   */
  listStories(): Promise<StorageResult<readonly StoryMetadata[]>>;

  /**
   * Check if storage is available/ready
   * @returns True if storage is ready
   */
  isAvailable(): Promise<boolean>;

  /**
   * Clear all stories (use with caution)
   * @returns Result indicating success
   */
  clearAll(): Promise<StorageResult<void>>;
}

/**
 * Storage configuration
 */
export interface StorageConfig {
  /** Storage adapter to use */
  adapter: IStoryStorage;
  /** Storage prefix for namespacing (optional) */
  prefix?: string;
}
