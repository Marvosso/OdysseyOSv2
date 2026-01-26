/**
 * Validation Middleware
 * 
 * Integrates validation into storage operations
 * Runs validation at key points: after import, after restore, before save
 */

import type { Story, Chapter, Scene } from '@/types/models';
import { StoryValidator, type ValidationResult, type RepairResult } from './storyValidator';

/**
 * Validation options
 */
export interface ValidationOptions {
  /** Whether to auto-repair issues */
  autoRepair?: boolean;
  /** Whether to throw on errors */
  throwOnError?: boolean;
  /** Callback for validation results */
  onValidation?: (result: ValidationResult) => void;
  /** Callback for repair results */
  onRepair?: (result: RepairResult) => void;
}

/**
 * Validation middleware for storage operations
 */
export class ValidationMiddleware {
  /**
   * Validate after import
   */
  static validateAfterImport(
    story: Story,
    chapters: Chapter[],
    scenes: Scene[],
    options: ValidationOptions = {}
  ): { isValid: boolean; repaired?: { story: Story; chapters: Chapter[]; scenes: Scene[] } } {
    const context = { story, chapters, scenes };
    const validation = StoryValidator.validate(context);

    options.onValidation?.(validation);

    if (!validation.isValid) {
      if (options.autoRepair) {
        const repair = StoryValidator.repair(context);
        options.onRepair?.(repair);

        if (repair.success && repair.repaired) {
          return {
            isValid: true,
            repaired: {
              story: repair.repaired.story || story,
              chapters: repair.repaired.chapters || chapters,
              scenes: repair.repaired.scenes || scenes,
            },
          };
        }
      }

      if (options.throwOnError) {
        const errors = validation.issues.filter(i => i.severity === 'error');
        throw new Error(
          `Validation failed after import: ${errors.map(e => e.message).join('; ')}`
        );
      }
    }

    return { isValid: validation.isValid };
  }

  /**
   * Validate after restore
   */
  static validateAfterRestore(
    story: Story,
    chapters: Chapter[],
    scenes: Scene[],
    options: ValidationOptions = {}
  ): { isValid: boolean; repaired?: { story: Story; chapters: Chapter[]; scenes: Scene[] } } {
    // Same as after import
    return this.validateAfterImport(story, chapters, scenes, {
      ...options,
      autoRepair: options.autoRepair ?? true, // Default to auto-repair on restore
    });
  }

  /**
   * Validate before save
   */
  static validateBeforeSave(
    story: Story,
    chapters: Chapter[],
    scenes: Scene[],
    options: ValidationOptions = {}
  ): { isValid: boolean; repaired?: { story: Story; chapters: Chapter[]; scenes: Scene[] } } {
    const context = { story, chapters, scenes };
    const validation = StoryValidator.validate(context);

    options.onValidation?.(validation);

    if (!validation.isValid) {
      if (options.autoRepair) {
        const repair = StoryValidator.repair(context);
        options.onRepair?.(repair);

        if (repair.success && repair.repaired) {
          return {
            isValid: true,
            repaired: {
              story: repair.repaired.story || story,
              chapters: repair.repaired.chapters || chapters,
              scenes: repair.repaired.scenes || scenes,
            },
          };
        }
      }

      if (options.throwOnError) {
        const errors = validation.issues.filter(i => i.severity === 'error');
        throw new Error(
          `Validation failed before save: ${errors.map(e => e.message).join('; ')}`
        );
      }
    }

    return { isValid: validation.isValid };
  }
}
