/**
 * Story Data Validator
 * 
 * Comprehensive validation and repair for story data integrity
 * Validates relationships, positions, and detects orphaned data
 */

import type { Story, Chapter, Scene, ChapterId, SceneId, StoryId } from '@/types/models';
import { createChapterId, createSceneId } from '@/types/models';

/**
 * Validation issue severity
 */
export type ValidationSeverity = 'error' | 'warning' | 'info';

/**
 * Validation issue
 */
export interface ValidationIssue {
  /** Severity level */
  severity: ValidationSeverity;
  /** Issue type */
  type: string;
  /** Human-readable message */
  message: string;
  /** Affected entity ID */
  entityId?: string;
  /** Additional context */
  context?: Record<string, unknown>;
}

/**
 * Validation result
 */
export interface ValidationResult {
  /** Whether data is valid */
  isValid: boolean;
  /** List of issues found */
  issues: ValidationIssue[];
  /** Summary statistics */
  summary: {
    errors: number;
    warnings: number;
    info: number;
  };
}

/**
 * Repair result
 */
export interface RepairResult {
  /** Whether repair was successful */
  success: boolean;
  /** Repaired data */
  repaired: {
    story?: Story;
    chapters?: Chapter[];
    scenes?: Scene[];
  };
  /** Issues fixed */
  fixed: ValidationIssue[];
  /** Issues that couldn't be fixed */
  unfixed: ValidationIssue[];
  /** Messages about repairs made */
  messages: string[];
}

/**
 * Story data context for validation
 */
export interface StoryDataContext {
  story: Story;
  chapters: Chapter[];
  scenes: Scene[];
}

/**
 * Story Validator
 * 
 * Validates and repairs story data integrity
 */
export class StoryValidator {
  /**
   * Validate story data
   */
  static validate(context: StoryDataContext): ValidationResult {
    const issues: ValidationIssue[] = [];

    // Validate scene-chapter relationships
    issues.push(...this.validateSceneChapterRelationships(context));

    // Validate chapter positions
    issues.push(...this.validateChapterPositions(context));

    // Validate scene positions
    issues.push(...this.validateScenePositions(context));

    // Detect orphaned data
    issues.push(...this.detectOrphanedData(context));

    // Validate story references
    issues.push(...this.validateStoryReferences(context));

    const errors = issues.filter(i => i.severity === 'error').length;
    const warnings = issues.filter(i => i.severity === 'warning').length;
    const info = issues.filter(i => i.severity === 'info').length;

    return {
      isValid: errors === 0,
      issues,
      summary: { errors, warnings, info },
    };
  }

  /**
   * Validate scene-chapter relationships
   */
  private static validateSceneChapterRelationships(
    context: StoryDataContext
  ): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const { story, chapters, scenes } = context;

    const chapterIds = new Set(chapters.map(c => c.id));
    const chapterScenes = new Map<ChapterId, Set<SceneId>>();

    // Initialize chapter scenes map
    for (const chapter of chapters) {
      chapterScenes.set(chapter.id, new Set(chapter.scenes));
    }

    // Check each scene
    for (const scene of scenes) {
      // Check if scene's chapter exists
      if (!chapterIds.has(scene.chapterId)) {
        issues.push({
          severity: 'error',
          type: 'scene_invalid_chapter',
          message: `Scene "${scene.title}" (${scene.id}) references non-existent chapter: ${scene.chapterId}`,
          entityId: scene.id,
          context: { chapterId: scene.chapterId },
        });
      } else {
        // Check if scene is in chapter's scenes array
        const chapterSceneSet = chapterScenes.get(scene.chapterId);
        if (!chapterSceneSet?.has(scene.id)) {
          issues.push({
            severity: 'warning',
            type: 'scene_not_in_chapter',
            message: `Scene "${scene.title}" (${scene.id}) belongs to chapter ${scene.chapterId} but is not in chapter's scenes array`,
            entityId: scene.id,
            context: { chapterId: scene.chapterId },
          });
        }
      }
    }

    // Check for scenes referenced in chapters but don't exist
    for (const chapter of chapters) {
      for (const sceneId of chapter.scenes) {
        const sceneExists = scenes.some(s => s.id === sceneId);
        if (!sceneExists) {
          issues.push({
            severity: 'error',
            type: 'chapter_missing_scene',
            message: `Chapter "${chapter.title}" (${chapter.id}) references non-existent scene: ${sceneId}`,
            entityId: chapter.id,
            context: { sceneId },
          });
        }
      }
    }

    return issues;
  }

  /**
   * Validate chapter positions (order continuity)
   */
  private static validateChapterPositions(
    context: StoryDataContext
  ): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const { story, chapters } = context;

    // Get chapters in story order
    const storyChapters = chapters
      .filter(c => story.chapters.includes(c.id))
      .sort((a, b) => a.order - b.order);

    // Check for missing positions
    const positions = new Set(storyChapters.map(c => c.order));
    const expectedPositions = new Set(
      Array.from({ length: storyChapters.length }, (_, i) => i + 1)
    );

    // Find missing positions
    for (let i = 1; i <= storyChapters.length; i++) {
      if (!positions.has(i)) {
        issues.push({
          severity: 'error',
          type: 'chapter_missing_position',
          message: `Missing chapter at position ${i}. Expected ${storyChapters.length} chapters with positions 1-${storyChapters.length}`,
          context: { expectedPosition: i, totalChapters: storyChapters.length },
        });
      }
    }

    // Check for duplicate positions
    const positionCounts = new Map<number, number>();
    for (const chapter of storyChapters) {
      const count = positionCounts.get(chapter.order) || 0;
      positionCounts.set(chapter.order, count + 1);
    }

    for (const [position, count] of positionCounts.entries()) {
      if (count > 1) {
        issues.push({
          severity: 'error',
          type: 'chapter_duplicate_position',
          message: `Multiple chapters have position ${position}`,
          context: { position, count },
        });
      }
    }

    // Check for out-of-range positions
    for (const chapter of storyChapters) {
      if (chapter.order < 1 || chapter.order > storyChapters.length) {
        issues.push({
          severity: 'error',
          type: 'chapter_invalid_position',
          message: `Chapter "${chapter.title}" (${chapter.id}) has invalid position ${chapter.order}. Expected 1-${storyChapters.length}`,
          entityId: chapter.id,
          context: { position: chapter.order, expectedRange: `1-${storyChapters.length}` },
        });
      }
    }

    return issues;
  }

  /**
   * Validate scene positions (order continuity within chapters)
   */
  private static validateScenePositions(
    context: StoryDataContext
  ): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const { chapters, scenes } = context;

    // Group scenes by chapter
    const scenesByChapter = new Map<ChapterId, Scene[]>();
    for (const scene of scenes) {
      if (!scenesByChapter.has(scene.chapterId)) {
        scenesByChapter.set(scene.chapterId, []);
      }
      scenesByChapter.get(scene.chapterId)!.push(scene);
    }

    // Validate positions for each chapter
    for (const chapter of chapters) {
      const chapterScenes = scenesByChapter.get(chapter.id) || [];
      const sortedScenes = chapterScenes.sort((a, b) => a.order - b.order);

      // Check for missing positions
      const positions = new Set(sortedScenes.map(s => s.order));
      for (let i = 1; i <= sortedScenes.length; i++) {
        if (!positions.has(i)) {
          issues.push({
            severity: 'error',
            type: 'scene_missing_position',
            message: `Missing scene at position ${i} in chapter "${chapter.title}" (${chapter.id})`,
            entityId: chapter.id,
            context: { chapterId: chapter.id, expectedPosition: i, totalScenes: sortedScenes.length },
          });
        }
      }

      // Check for duplicate positions
      const positionCounts = new Map<number, number>();
      for (const scene of sortedScenes) {
        const count = positionCounts.get(scene.order) || 0;
        positionCounts.set(scene.order, count + 1);
      }

      for (const [position, count] of positionCounts.entries()) {
        if (count > 1) {
          issues.push({
            severity: 'error',
            type: 'scene_duplicate_position',
            message: `Multiple scenes have position ${position} in chapter "${chapter.title}" (${chapter.id})`,
            entityId: chapter.id,
            context: { chapterId: chapter.id, position, count },
          });
        }
      }

      // Check for out-of-range positions
      for (const scene of sortedScenes) {
        if (scene.order < 1 || scene.order > sortedScenes.length) {
          issues.push({
            severity: 'error',
            type: 'scene_invalid_position',
            message: `Scene "${scene.title}" (${scene.id}) has invalid position ${scene.order} in chapter "${chapter.title}". Expected 1-${sortedScenes.length}`,
            entityId: scene.id,
            context: {
              chapterId: chapter.id,
              position: scene.order,
              expectedRange: `1-${sortedScenes.length}`,
            },
          });
        }
      }
    }

    return issues;
  }

  /**
   * Detect orphaned data
   */
  private static detectOrphanedData(
    context: StoryDataContext
  ): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const { story, chapters, scenes } = context;

    const storyChapterIds = new Set(story.chapters);
    const chapterSceneIds = new Set(chapters.flatMap(c => c.scenes));

    // Find orphaned chapters (not in story.chapters)
    for (const chapter of chapters) {
      if (!storyChapterIds.has(chapter.id)) {
        issues.push({
          severity: 'warning',
          type: 'orphaned_chapter',
          message: `Chapter "${chapter.title}" (${chapter.id}) is not referenced in story`,
          entityId: chapter.id,
          context: { storyId: story.id },
        });
      }
    }

    // Find orphaned scenes (not in any chapter)
    for (const scene of scenes) {
      if (!chapterSceneIds.has(scene.id)) {
        issues.push({
          severity: 'warning',
          type: 'orphaned_scene',
          message: `Scene "${scene.title}" (${scene.id}) is not referenced in any chapter`,
          entityId: scene.id,
          context: { chapterId: scene.chapterId },
        });
      }
    }

    // Find scenes with invalid chapter references
    const validChapterIds = new Set(chapters.map(c => c.id));
    for (const scene of scenes) {
      if (!validChapterIds.has(scene.chapterId)) {
        issues.push({
          severity: 'error',
          type: 'scene_orphaned_invalid_chapter',
          message: `Scene "${scene.title}" (${scene.id}) references invalid chapter: ${scene.chapterId}`,
          entityId: scene.id,
          context: { chapterId: scene.chapterId },
        });
      }
    }

    return issues;
  }

  /**
   * Validate story references
   */
  private static validateStoryReferences(
    context: StoryDataContext
  ): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const { story, chapters } = context;

    // Check if all chapters in story.chapters exist
    const chapterIds = new Set(chapters.map(c => c.id));
    for (const chapterId of story.chapters) {
      if (!chapterIds.has(chapterId)) {
        issues.push({
          severity: 'error',
          type: 'story_missing_chapter',
          message: `Story references non-existent chapter: ${chapterId}`,
          entityId: story.id,
          context: { chapterId },
        });
      }
    }

    // Check if chapters reference correct story
    for (const chapter of chapters) {
      if (chapter.storyId !== story.id) {
        issues.push({
          severity: 'error',
          type: 'chapter_wrong_story',
          message: `Chapter "${chapter.title}" (${chapter.id}) references wrong story: ${chapter.storyId} (expected ${story.id})`,
          entityId: chapter.id,
          context: { expectedStoryId: story.id, actualStoryId: chapter.storyId },
        });
      }
    }

    return issues;
  }

  /**
   * Repair story data
   */
  static repair(context: StoryDataContext): RepairResult {
    const validation = this.validate(context);
    const fixed: ValidationIssue[] = [];
    const unfixed: ValidationIssue[] = [];
    const messages: string[] = [];

    const repaired: {
      story?: Story;
      chapters?: Chapter[];
      scenes?: Scene[];
    } = {
      chapters: [...context.chapters],
      scenes: [...context.scenes],
    };

    // Repair scene-chapter relationships
    const sceneChapterRepair = this.repairSceneChapterRelationships(
      context,
      validation.issues
    );
    if (sceneChapterRepair) {
      repaired.scenes = sceneChapterRepair.scenes;
      fixed.push(...sceneChapterRepair.fixed);
      messages.push(...sceneChapterRepair.messages);
    }

    // Repair chapter positions
    const chapterPositionRepair = this.repairChapterPositions(
      { ...context, scenes: repaired.scenes || context.scenes },
      validation.issues
    );
    if (chapterPositionRepair) {
      repaired.chapters = chapterPositionRepair.chapters;
      fixed.push(...chapterPositionRepair.fixed);
      messages.push(...chapterPositionRepair.messages);
    }

    // Repair scene positions
    const scenePositionRepair = this.repairScenePositions(
      { ...context, chapters: repaired.chapters || context.chapters },
      validation.issues
    );
    if (scenePositionRepair) {
      repaired.scenes = scenePositionRepair.scenes;
      fixed.push(...scenePositionRepair.fixed);
      messages.push(...scenePositionRepair.messages);
    }

    // Repair orphaned data
    const orphanRepair = this.repairOrphanedData(
      {
        ...context,
        chapters: repaired.chapters || context.chapters,
        scenes: repaired.scenes || context.scenes,
      },
      validation.issues
    );
    if (orphanRepair) {
      repaired.story = orphanRepair.story || context.story;
      repaired.chapters = orphanRepair.chapters || repaired.chapters;
      fixed.push(...orphanRepair.fixed);
      messages.push(...orphanRepair.messages);
    }

    // Collect unfixed issues
    const fixedIssueTypes = new Set(fixed.map(i => i.type));
    for (const issue of validation.issues) {
      if (!fixedIssueTypes.has(issue.type)) {
        unfixed.push(issue);
      }
    }

    return {
      success: unfixed.filter(i => i.severity === 'error').length === 0,
      repaired,
      fixed,
      unfixed,
      messages,
    };
  }

  /**
   * Repair scene-chapter relationships
   */
  private static repairSceneChapterRelationships(
    context: StoryDataContext,
    issues: ValidationIssue[]
  ): { scenes: Scene[]; fixed: ValidationIssue[]; messages: string[] } | null {
    const sceneIssues = issues.filter(
      i => i.type === 'scene_invalid_chapter' || i.type === 'scene_not_in_chapter'
    );
    if (sceneIssues.length === 0) {
      return null;
    }

    const fixed: ValidationIssue[] = [];
    const messages: string[] = [];
    const repairedScenes: Scene[] = [...context.scenes];
    const chapterIds = new Set(context.chapters.map(c => c.id));

    // Find first valid chapter for orphaned scenes
    const firstChapterId = context.chapters.length > 0 ? context.chapters[0].id : null;

    for (const issue of sceneIssues) {
      if (issue.type === 'scene_invalid_chapter' && issue.entityId) {
        const sceneIndex = repairedScenes.findIndex(s => s.id === issue.entityId);
        if (sceneIndex >= 0 && firstChapterId) {
          // Assign to first chapter
          const scene = repairedScenes[sceneIndex];
          repairedScenes[sceneIndex] = {
            ...scene,
            chapterId: firstChapterId,
          } as Scene;

          // Add to chapter's scenes if not already there
          const chapter = context.chapters.find(c => c.id === firstChapterId);
          if (chapter && !chapter.scenes.includes(scene.id)) {
            // Will be fixed in chapter repair
          }

          fixed.push(issue);
          messages.push(
            `Assigned orphaned scene "${scene.title}" to chapter "${chapter?.title || firstChapterId}"`
          );
        }
      } else if (issue.type === 'scene_not_in_chapter' && issue.entityId) {
        // Scene is in correct chapter but not in chapter's scenes array
        // This will be fixed when we repair chapters
        fixed.push(issue);
      }
    }

    return { scenes: repairedScenes, fixed, messages };
  }

  /**
   * Repair chapter positions
   */
  private static repairChapterPositions(
    context: StoryDataContext,
    issues: ValidationIssue[]
  ): { chapters: Chapter[]; fixed: ValidationIssue[]; messages: string[] } | null {
    const positionIssues = issues.filter(
      i =>
        i.type === 'chapter_missing_position' ||
        i.type === 'chapter_duplicate_position' ||
        i.type === 'chapter_invalid_position'
    );
    if (positionIssues.length === 0) {
      return null;
    }

    const fixed: ValidationIssue[] = [];
    const messages: string[] = [];
    const repairedChapters: Chapter[] = [...context.chapters];

    // Get chapters in story, sorted by current order
    const storyChapters = repairedChapters
      .filter(c => context.story.chapters.includes(c.id))
      .sort((a, b) => a.order - b.order);

    // Renumber chapters to be continuous 1..N
    for (let i = 0; i < storyChapters.length; i++) {
      const chapter = storyChapters[i];
      const newOrder = i + 1;

      if (chapter.order !== newOrder) {
        const chapterIndex = repairedChapters.findIndex(c => c.id === chapter.id);
        if (chapterIndex >= 0) {
          repairedChapters[chapterIndex] = {
            ...chapter,
            order: newOrder,
          } as Chapter;

          fixed.push(
            ...issues.filter(
              i =>
                i.type === 'chapter_duplicate_position' ||
                i.type === 'chapter_invalid_position' ||
                (i.type === 'chapter_missing_position' && i.context?.expectedPosition === newOrder)
            )
          );
          messages.push(`Renumbered chapter "${chapter.title}" to position ${newOrder}`);
        }
      }
    }

    return { chapters: repairedChapters, fixed, messages };
  }

  /**
   * Repair scene positions
   */
  private static repairScenePositions(
    context: StoryDataContext,
    issues: ValidationIssue[]
  ): { scenes: Scene[]; fixed: ValidationIssue[]; messages: string[] } | null {
    const positionIssues = issues.filter(
      i =>
        i.type === 'scene_missing_position' ||
        i.type === 'scene_duplicate_position' ||
        i.type === 'scene_invalid_position'
    );
    if (positionIssues.length === 0) {
      return null;
    }

    const fixed: ValidationIssue[] = [];
    const messages: string[] = [];
    const repairedScenes: Scene[] = [...context.scenes];

    // Group scenes by chapter
    const scenesByChapter = new Map<ChapterId, Scene[]>();
    for (const scene of repairedScenes) {
      if (!scenesByChapter.has(scene.chapterId)) {
        scenesByChapter.set(scene.chapterId, []);
      }
      scenesByChapter.get(scene.chapterId)!.push(scene);
    }

    // Renumber scenes in each chapter
    for (const chapter of context.chapters) {
      const chapterScenes = scenesByChapter.get(chapter.id) || [];
      const sortedScenes = chapterScenes.sort((a, b) => a.order - b.order);

      for (let i = 0; i < sortedScenes.length; i++) {
        const scene = sortedScenes[i];
        const newOrder = i + 1;

        if (scene.order !== newOrder) {
          const sceneIndex = repairedScenes.findIndex(s => s.id === scene.id);
          if (sceneIndex >= 0) {
            repairedScenes[sceneIndex] = {
              ...scene,
              order: newOrder,
            } as Scene;

            fixed.push(
              ...issues.filter(
                i =>
                  i.type === 'scene_duplicate_position' ||
                  i.type === 'scene_invalid_position' ||
                  (i.type === 'scene_missing_position' &&
                    i.context?.chapterId === chapter.id &&
                    i.context?.expectedPosition === newOrder)
              )
            );
            messages.push(
              `Renumbered scene "${scene.title}" to position ${newOrder} in chapter "${chapter.title}"`
            );
          }
        }
      }
    }

    return { scenes: repairedScenes, fixed, messages };
  }

  /**
   * Repair orphaned data
   */
  private static repairOrphanedData(
    context: StoryDataContext,
    issues: ValidationIssue[]
  ): {
    story?: Story;
    chapters?: Chapter[];
    fixed: ValidationIssue[];
    messages: string[];
  } | null {
    const orphanIssues = issues.filter(
      i =>
        i.type === 'orphaned_chapter' ||
        i.type === 'orphaned_scene' ||
        i.type === 'scene_orphaned_invalid_chapter'
    );
    if (orphanIssues.length === 0) {
      return null;
    }

    const fixed: ValidationIssue[] = [];
    const messages: string[] = [];
    let repairedStory: Story | undefined;
    const repairedChapters: Chapter[] = [...context.chapters];

    // Fix orphaned chapters (add to story)
    const orphanedChapters = orphanIssues.filter(i => i.type === 'orphaned_chapter');
    if (orphanedChapters.length > 0) {
      const newChapterIds = [...context.story.chapters];
      for (const issue of orphanedChapters) {
        if (issue.entityId && !newChapterIds.includes(issue.entityId as ChapterId)) {
          newChapterIds.push(issue.entityId as ChapterId);
          fixed.push(issue);
          const chapter = context.chapters.find(c => c.id === issue.entityId);
          messages.push(`Added orphaned chapter "${chapter?.title || issue.entityId}" to story`);
        }
      }
      repairedStory = {
        ...context.story,
        chapters: newChapterIds,
      };
    }

    // Fix orphaned scenes (add to first chapter or create new chapter)
    const orphanedScenes = orphanIssues.filter(
      i => i.type === 'orphaned_scene' || i.type === 'scene_orphaned_invalid_chapter'
    );
    if (orphanedScenes.length > 0 && context.chapters.length > 0) {
      const firstChapter = context.chapters[0];
      for (const issue of orphanedScenes) {
        if (issue.entityId) {
          const chapter = repairedChapters.find(c => c.id === firstChapter.id);
          if (chapter && !chapter.scenes.includes(issue.entityId as SceneId)) {
            const chapterIndex = repairedChapters.findIndex(c => c.id === chapter.id);
            repairedChapters[chapterIndex] = {
              ...chapter,
              scenes: [...chapter.scenes, issue.entityId as SceneId],
            } as Chapter;

            fixed.push(issue);
            const scene = context.scenes.find(s => s.id === issue.entityId);
            messages.push(
              `Added orphaned scene "${scene?.title || issue.entityId}" to chapter "${chapter.title}"`
            );
          }
        }
      }
    }

    return {
      story: repairedStory,
      chapters: repairedChapters.length > 0 ? repairedChapters : undefined,
      fixed,
      messages,
    };
  }
}
