/**
 * Edge Case Handlers for Import Pipeline
 * 
 * Handles specific edge cases: mixed encodings, large files, duplicates, etc.
 */

import { ImportError } from './importPipeline';
import { BrowserTextDecoder } from './textDecoder';
import type { DetectedChapter, ValidationResult } from './importPipeline';

/**
 * File validation result
 */
export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Edge case handlers for import pipeline
 */
export class EdgeCaseHandlers {
  /**
   * Maximum file size (50MB)
   */
  private static readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

  /**
   * Large file threshold (10MB - use chunked processing)
   */
  private static readonly LARGE_FILE_THRESHOLD = 10 * 1024 * 1024; // 10MB

  /**
   * Validate file before processing
   */
  static validateFile(file: File): FileValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if file is empty
    if (file.size === 0) {
      errors.push('File is empty. Please import a file with content.');
      return { isValid: false, errors, warnings };
    }

    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      errors.push(
        `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. ` +
        `Maximum size is ${(this.MAX_FILE_SIZE / 1024 / 1024).toFixed(0)}MB.`
      );
      return { isValid: false, errors, warnings };
    }

    // Warn about large files
    if (file.size > this.LARGE_FILE_THRESHOLD) {
      warnings.push(
        `Large file detected (${(file.size / 1024 / 1024).toFixed(2)}MB). ` +
        `Processing may take longer. Consider splitting into smaller files.`
      );
    }

    // Check if file is a supported format
    if (!this.isTextFile(file)) {
      errors.push(
        'File format not supported. Please import .txt, .md, .pdf, or .docx files only.'
      );
      return { isValid: false, errors, warnings };
    }

    return { isValid: true, errors, warnings };
  }

  /**
   * Check if file is a supported file (text, DOCX, or PDF)
   */
  private static isTextFile(file: File): boolean {
    // Check extension first (more reliable than MIME type which can be empty)
    const supportedExtensions = ['.txt', '.md', '.markdown', '.text', '.mdwn', '.pdf', '.docx'];
    const extension = file.name
      .toLowerCase()
      .substring(file.name.lastIndexOf('.'));
    if (supportedExtensions.includes(extension)) {
      return true;
    }

    // Check MIME type as fallback
    const textMimeTypes = [
      'text/plain',
      'text/markdown',
      'application/json',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
    ];
    if (file.type && textMimeTypes.includes(file.type)) {
      return true;
    }

    // Default to false - only allow known supported file extensions
    return false;
  }

  /**
   * Handle duplicate chapter titles
   */
  static handleDuplicateChapterTitles(
    chapters: DetectedChapter[]
  ): { chapters: DetectedChapter[]; warnings: string[] } {
    const warnings: string[] = [];
    const titleOccurrences = new Map<string, number>();

    // Count occurrences of each title
    for (const chapter of chapters) {
      const count = titleOccurrences.get(chapter.title) || 0;
      titleOccurrences.set(chapter.title, count + 1);
    }

    // Find duplicates
    const duplicates = Array.from(titleOccurrences.entries()).filter(
      ([_, count]) => count > 1
    );

    if (duplicates.length === 0) {
      return { chapters, warnings };
    }

    // Rename duplicates by creating new objects
    const titleCounts = new Map<string, number>();
    const renamedChapters = chapters.map((chapter) => {
      const count = titleCounts.get(chapter.title) || 0;
      titleCounts.set(chapter.title, count + 1);

      if (count > 0) {
        // This is a duplicate - create new object with modified title
        return {
          ...chapter,
          title: `${chapter.title} (${count + 1})`,
        };
      }
      return chapter;
    });

    warnings.push(
      `Found ${duplicates.length} duplicate chapter title(s). ` +
      `They have been automatically renamed with numbers (e.g., "Chapter 1 (2)").`
    );

    return { chapters: renamedChapters, warnings };
  }

  /**
   * Detect chapters with no scenes
   */
  static findChaptersWithNoScenes(
    chapters: readonly DetectedChapter[],
    scenes: readonly { lineIndex: number }[]
  ): readonly DetectedChapter[] {
    if (chapters.length === 0) {
      return [];
    }

    const emptyChapters: DetectedChapter[] = [];

    for (let i = 0; i < chapters.length; i++) {
      const chapter = chapters[i];
      const nextChapter =
        i < chapters.length - 1 ? chapters[i + 1] : null;

      // Find scenes between this chapter and next
      const chapterStart = chapter.lineIndex;
      const chapterEnd = nextChapter ? nextChapter.lineIndex : Infinity;

      const scenesInChapter = scenes.filter(
        s => s.lineIndex > chapterStart && s.lineIndex < chapterEnd
      );

      if (scenesInChapter.length === 0) {
        emptyChapters.push(chapter);
      }
    }

    return emptyChapters;
  }

  /**
   * Detect mixed markdown/plain text format
   */
  static detectMixedFormat(text: string, chapters: readonly DetectedChapter[]): boolean {
    const hasMarkdown =
      text.includes('#') || text.includes('**') || text.includes('`');
    const hasPlainTextChapters = chapters.some(
      c => !c.matchedPattern.includes('Markdown')
    );

    return hasMarkdown && hasPlainTextChapters;
  }

  /**
   * Check for very long lines
   */
  static checkLongLines(lines: readonly string[]): {
    hasLongLines: boolean;
    longLineCount: number;
    maxLineLength: number;
  } {
    const LONG_LINE_THRESHOLD = 10000;
    const longLines = lines.filter(line => line.length > LONG_LINE_THRESHOLD);
    const maxLength = Math.max(...lines.map(line => line.length), 0);

    return {
      hasLongLines: longLines.length > 0,
      longLineCount: longLines.length,
      maxLineLength: maxLength,
    };
  }

  /**
   * Enhance validation result with edge case warnings
   */
  static enhanceValidationResult(
    result: ValidationResult,
    context: {
      file: File;
      chapters: readonly DetectedChapter[];
      scenes: readonly { lineIndex: number }[];
      text: string;
      lines: readonly string[];
    }
  ): ValidationResult {
    const warnings = [...result.warnings];

    // Check for no chapters
    if (context.chapters.length === 0) {
      warnings.push(
        'No chapter markers detected. All content will be placed in a single chapter. ' +
        'Consider adding chapter markers (e.g., "Chapter 1", "# Chapter 1") for better organization.'
      );
    }

    // Check for duplicate chapter titles
    const duplicateResult = this.handleDuplicateChapterTitles([
      ...context.chapters,
    ]);
    if (duplicateResult.warnings.length > 0) {
      warnings.push(...duplicateResult.warnings);
    }

    // Check for empty chapters
    const emptyChapters = this.findChaptersWithNoScenes(
      context.chapters,
      context.scenes
    );
    if (emptyChapters.length > 0) {
      warnings.push(
        `Found ${emptyChapters.length} chapter(s) with no scenes: ` +
        `${emptyChapters.map(c => c.title).join(', ')}. ` +
        `These chapters will be empty.`
      );
    }

    // Check for mixed format
    if (this.detectMixedFormat(context.text, context.chapters)) {
      warnings.push(
        'File appears to mix markdown and plain text formatting. ' +
        'Some chapter markers may have been missed. Consider using consistent formatting.'
      );
    }

    // Check for long lines
    const longLineCheck = this.checkLongLines(context.lines);
    if (longLineCheck.hasLongLines) {
      warnings.push(
        `Found ${longLineCheck.longLineCount} very long line(s) (>10,000 characters). ` +
        `This may affect performance.`
      );
    }

    return {
      ...result,
      warnings: warnings as readonly string[],
    };
  }
}
