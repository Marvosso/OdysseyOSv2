/**
 * Data Validator
 * 
 * Validates data integrity before save/load operations
 */

import type { Story, Chapter, Scene } from '@/types/models';

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Data validator for stories, chapters, and scenes
 */
export class DataValidator {
  /**
   * Validate story structure
   */
  static validateStory(story: unknown): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!story || typeof story !== 'object') {
      return {
        isValid: false,
        errors: ['Story must be an object'],
        warnings: [],
      };
    }

    const s = story as any;

    // Required fields
    if (!s.id || typeof s.id !== 'string') {
      errors.push('Story must have a valid id');
    }

    if (!s.title || typeof s.title !== 'string') {
      errors.push('Story must have a title');
    }

    if (!s.version || typeof s.version !== 'object') {
      errors.push('Story must have version information');
    }

    // Validate arrays
    if (s.chapters && !Array.isArray(s.chapters)) {
      errors.push('Story chapters must be an array');
    }

    if (s.characters && !Array.isArray(s.characters)) {
      errors.push('Story characters must be an array');
    }

    // Validate word count
    if (s.wordCount) {
      if (typeof s.wordCount.computed !== 'number' || s.wordCount.computed < 0) {
        warnings.push('Invalid word count in story');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate story consistency with chapters and scenes
   */
  static validateStoryConsistency(
    story: Story,
    chapters: Chapter[],
    scenes: Scene[]
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const chapterIds = new Set(chapters.map(c => c.id));
    const sceneIds = new Set(scenes.map(s => s.id));

    // Check story references to chapters
    for (const chapterId of story.chapters) {
      if (!chapterIds.has(chapterId)) {
        errors.push(`Story references non-existent chapter: ${chapterId}`);
      }
    }

    // Check story references to characters
    // (Assuming character validation is separate)

    // Check scene references to chapters
    for (const scene of scenes) {
      if (scene.chapterId && !chapterIds.has(scene.chapterId)) {
        errors.push(`Scene ${scene.id} references non-existent chapter: ${scene.chapterId}`);
      }
    }

    // Check chapter references to scenes
    for (const chapter of chapters) {
      for (const sceneId of chapter.scenes) {
        if (!sceneIds.has(sceneId)) {
          warnings.push(`Chapter ${chapter.id} references non-existent scene: ${sceneId}`);
        }
      }
    }

    // Check for orphaned scenes (scenes not in any chapter)
    const scenesInChapters = new Set(
      chapters.flatMap(c => c.scenes)
    );
    for (const scene of scenes) {
      if (!scenesInChapters.has(scene.id)) {
        warnings.push(`Scene ${scene.id} is not referenced by any chapter (orphaned)`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate JSON before parsing
   */
  static isValidJSON(str: string): boolean {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate and sanitize JSON
   */
  static validateAndParseJSON<T>(str: string, validator?: (data: unknown) => data is T): {
    isValid: boolean;
    data: T | null;
    error?: string;
  } {
    if (!this.isValidJSON(str)) {
      return {
        isValid: false,
        data: null,
        error: 'Invalid JSON format',
      };
    }

    try {
      const data = JSON.parse(str);
      
      if (validator && !validator(data)) {
        return {
          isValid: false,
          data: null,
          error: 'Data does not match expected structure',
        };
      }

      return {
        isValid: true,
        data,
      };
    } catch (error) {
      return {
        isValid: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
