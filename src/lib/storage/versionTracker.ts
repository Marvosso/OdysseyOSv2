/**
 * Version Tracker
 * 
 * Tracks versions of stories for transaction history
 * Lightweight version tagging system
 */

import type { Story, StoryId } from '@/types/models';
import type { TransactionMetadata } from './transaction.interface';

/**
 * Story version entry
 */
export interface StoryVersion {
  /** Version tag */
  readonly version: string;
  /** Transaction ID that created this version */
  readonly transactionId: string;
  /** Story data at this version */
  readonly story: Story;
  /** Timestamp */
  readonly timestamp: Date;
}

/**
 * Version history for a story
 */
export interface StoryVersionHistory {
  /** Story ID */
  readonly storyId: StoryId;
  /** Current version */
  readonly currentVersion: string;
  /** Version history */
  readonly versions: readonly StoryVersion[];
}

/**
 * Version tracker
 * Tracks story versions for history and rollback
 */
export class VersionTracker {
  private versions: Map<StoryId, StoryVersion[]> = new Map();
  private maxVersionsPerStory = 10; // Keep last 10 versions

  /**
   * Record a new version
   */
  recordVersion(
    storyId: StoryId,
    story: Story,
    transaction: TransactionMetadata
  ): void {
    if (!this.versions.has(storyId)) {
      this.versions.set(storyId, []);
    }

    const storyVersions = this.versions.get(storyId)!;

    const version: StoryVersion = {
      version: transaction.version,
      transactionId: transaction.id,
      story: { ...story }, // Deep copy
      timestamp: transaction.committedAt || transaction.createdAt || new Date(),
    };

    storyVersions.push(version);

    // Keep only last N versions
    if (storyVersions.length > this.maxVersionsPerStory) {
      storyVersions.shift(); // Remove oldest
    }
  }

  /**
   * Get version history for a story
   */
  getVersionHistory(storyId: StoryId): StoryVersionHistory | null {
    const versions = this.versions.get(storyId);
    if (!versions || versions.length === 0) {
      return null;
    }

    return {
      storyId,
      currentVersion: versions[versions.length - 1].version,
      versions: versions as readonly StoryVersion[],
    };
  }

  /**
   * Get story at specific version
   */
  getStoryAtVersion(storyId: StoryId, version: string): Story | null {
    const versions = this.versions.get(storyId);
    if (!versions) {
      return null;
    }

    const versionEntry = versions.find(v => v.version === version);
    return versionEntry ? versionEntry.story : null;
  }

  /**
   * Get latest version for a story
   */
  getLatestVersion(storyId: StoryId): StoryVersion | null {
    const versions = this.versions.get(storyId);
    if (!versions || versions.length === 0) {
      return null;
    }

    return versions[versions.length - 1];
  }

  /**
   * Clear version history for a story
   */
  clearHistory(storyId: StoryId): void {
    this.versions.delete(storyId);
  }

  /**
   * Clear all version history
   */
  clearAll(): void {
    this.versions.clear();
  }

  /**
   * Set max versions per story
   */
  setMaxVersions(max: number): void {
    this.maxVersionsPerStory = max;
    
    // Trim existing histories
    for (const [storyId, versions] of this.versions.entries()) {
      if (versions.length > max) {
        this.versions.set(storyId, versions.slice(-max));
      }
    }
  }
}

// Global version tracker instance
export const versionTracker = new VersionTracker();
