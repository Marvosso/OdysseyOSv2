/**
 * Deterministic Import Pipeline for .txt and .md Files
 * 
 * Pipeline Stages:
 * 1. File read + UTF-8 normalization
 * 2. Line ending normalization
 * 3. Chapter detection (confidence scored)
 * 4. Scene detection
 * 5. Word counting (accurate)
 * 6. Validation & preview output
 * 
 * Design Principles:
 * - Deterministic: Same input always produces same output
 * - Never corrupts text: All transformations are reversible or safe
 * - Preserves formatting: Original structure maintained
 * - Clear separation: Each stage is independent and testable
 */

import {
  type StoryId,
  type ChapterId,
  type SceneId,
  createStoryId,
  createChapterId,
  createSceneId,
  createTextContent,
  createWordCount,
  computeWordCount,
  createVersion,
  type TextContent,
  type WordCount,
} from '@/types/models';
import { BrowserTextDecoder } from './textDecoder';
import { EdgeCaseHandlers } from './edgeCaseHandlers';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Result of chapter detection with confidence score
 */
export interface DetectedChapter {
  /** Line index where chapter starts (0-based) */
  readonly lineIndex: number;
  /** Chapter title (cleaned) */
  readonly title: string;
  /** Original line text */
  readonly originalLine: string;
  /** Confidence score (0-1, where 1 is highest confidence) */
  readonly confidence: number;
  /** Pattern that matched */
  readonly matchedPattern: string;
}

/**
 * Result of scene detection
 */
export interface DetectedScene {
  /** Line index where scene starts (0-based) */
  readonly lineIndex: number;
  /** Scene break type */
  readonly breakType: 'explicit' | 'paragraph' | 'chapter-boundary';
  /** Original line text (if explicit break) */
  readonly originalLine?: string;
}

/**
 * Normalized text with metadata
 */
export interface NormalizedText {
  /** Normalized text content */
  readonly text: string;
  /** Original encoding detected */
  readonly originalEncoding: string;
  /** Line ending type detected */
  readonly originalLineEnding: 'CRLF' | 'LF' | 'CR' | 'MIXED';
  /** Normalized line ending used */
  readonly normalizedLineEnding: 'LF';
  /** Lines array (for processing) */
  readonly lines: readonly string[];
  /** Character count */
  readonly characterCount: number;
  /** Byte length (UTF-8) */
  readonly byteLength: number;
}

/**
 * Import result with all detected structure
 */
export interface ImportResult {
  /** Story title (from filename or first line) */
  readonly title: string;
  /** Normalized text */
  readonly normalizedText: NormalizedText;
  /** Detected chapters with confidence scores */
  readonly detectedChapters: readonly DetectedChapter[];
  /** Detected scenes */
  readonly detectedScenes: readonly DetectedScene[];
  /** Word count for entire document */
  readonly totalWordCount: WordCount;
  /** Word count per chapter (if chapters detected) */
  readonly chapterWordCounts: ReadonlyMap<number, WordCount>;
  /** Word count per scene */
  readonly sceneWordCounts: ReadonlyMap<number, WordCount>;
  /** Validation results */
  readonly validation: ValidationResult;
  /** Preview data for UI */
  readonly preview: PreviewData;
}

/**
 * Validation result
 */
export interface ValidationResult {
  /** Whether import is valid */
  readonly isValid: boolean;
  /** Validation errors (if any) */
  readonly errors: readonly string[];
  /** Validation warnings (non-fatal) */
  readonly warnings: readonly string[];
  /** Text integrity check passed */
  readonly textIntegrity: boolean;
  /** Encoding issues detected */
  readonly encodingIssues: readonly string[];
}

/**
 * Preview data for UI display
 */
export interface PreviewData {
  /** Total word count */
  readonly totalWords: number;
  /** Total character count */
  readonly totalCharacters: number;
  /** Number of chapters detected */
  readonly chapterCount: number;
  /** Number of scenes detected */
  readonly sceneCount: number;
  /** Estimated reading time (minutes) */
  readonly estimatedReadingTime: number;
  /** Sample of first 500 characters */
  readonly previewText: string;
  /** Chapter titles (first 10) */
  readonly chapterTitles: readonly string[];
}

// ============================================================================
// Stage 1: File Read + UTF-8 Normalization
// ============================================================================

export class FileReaderStage {
  /**
   * Read file and normalize to UTF-8
   * Handles various encodings and ensures UTF-8 output
   * 
   * FIXED: Now uses proper encoding detection and decoding
   * instead of assuming UTF-8, preventing garbled text
   */
  static async readFile(file: File): Promise<{ text: string; encoding: string }> {
    try {
      // Use safe text decoder that handles encoding detection
      const decoded = await BrowserTextDecoder.decodeFile(file);
      
      // Validate decoded text
      const validation = BrowserTextDecoder.validateDecodedText(decoded.text);
      
      if (!validation.isValid) {
        throw new ImportError(
          `Text decoding validation failed: ${validation.errors.join(', ')}`,
          'ENCODING_ERROR'
        );
      }
      
      // Log warnings if any
      if (validation.warnings.length > 0) {
        console.warn('Text decoding warnings:', validation.warnings);
      }
      
      return {
        text: decoded.text,
        encoding: `${decoded.originalEncoding.encoding} (confidence: ${decoded.originalEncoding.confidence})`,
      };
    } catch (error) {
      if (error instanceof ImportError) {
        throw error;
      }
      throw new ImportError(
        `Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FILE_READ_ERROR'
      );
    }
  }
}

// ============================================================================
// Stage 2: Line Ending Normalization
// ============================================================================

export class LineEndingNormalizer {
  /**
   * Normalize line endings to LF (Unix standard)
   * Detects and preserves original format information
   */
  static normalize(text: string): NormalizedText {
    // Detect original line endings
    const lineEndingInfo = this.detectLineEndings(text);
    
    // Normalize to LF
    const normalized = text
      .replace(/\r\n/g, '\n')  // CRLF -> LF
      .replace(/\r/g, '\n');    // CR -> LF
    
    // Split into lines (preserving empty lines)
    const lines = normalized.split('\n');
    
    // Calculate metadata
    const characterCount = normalized.length;
    const byteLength = new TextEncoder().encode(normalized).length;
    
    return {
      text: normalized,
      originalEncoding: 'UTF-8',
      originalLineEnding: lineEndingInfo.dominant,
      normalizedLineEnding: 'LF',
      lines: lines,
      characterCount,
      byteLength,
    } as const;
  }

  /**
   * Detect line ending type in text
   */
  private static detectLineEndings(text: string): {
    dominant: 'CRLF' | 'LF' | 'CR' | 'MIXED';
    crlfCount: number;
    lfCount: number;
    crCount: number;
  } {
    // Count CRLF first (must be done before counting individual \r and \n)
    const crlfMatches = text.match(/\r\n/g);
    const crlfCount = crlfMatches ? crlfMatches.length : 0;
    
    // Count standalone \r (not followed by \n)
    const crMatches = text.match(/\r(?!\n)/g);
    const crCount = crMatches ? crMatches.length : 0;
    
    // Count standalone \n (not preceded by \r)
    // Use a more compatible approach: count all \n, subtract CRLF count
    const allLfMatches = text.match(/\n/g);
    const totalLfCount = allLfMatches ? allLfMatches.length : 0;
    const lfCount = totalLfCount - crlfCount; // Subtract CRLF to get standalone LF
    
    const total = crlfCount + lfCount + crCount;
    
    if (total === 0) {
      return { dominant: 'LF', crlfCount: 0, lfCount: 0, crCount: 0 };
    }
    
    // Determine dominant type
    const maxCount = Math.max(crlfCount, lfCount, crCount);
    let dominant: 'CRLF' | 'LF' | 'CR' | 'MIXED';
    
    if (crlfCount === maxCount && crlfCount > 0) {
      dominant = crlfCount === total ? 'CRLF' : 'MIXED';
    } else if (lfCount === maxCount && lfCount > 0) {
      dominant = lfCount === total ? 'LF' : 'MIXED';
    } else if (crCount === maxCount && crCount > 0) {
      dominant = crCount === total ? 'CR' : 'MIXED';
    } else {
      dominant = 'MIXED';
    }
    
    return { dominant, crlfCount, lfCount, crCount };
  }
}

// ============================================================================
// Stage 3: Chapter Detection (Confidence Scored)
// ============================================================================

export class ChapterDetector {
  /**
   * Chapter detection patterns with confidence weights
   * Higher weight = higher confidence when matched
   */
  private static readonly PATTERNS: ReadonlyArray<{
    pattern: RegExp;
    weight: number;
    name: string;
  }> = [
    // High confidence patterns
    { pattern: /^#{1,3}\s+chapter\s+\d+\s*$/i, weight: 1.0, name: 'Markdown header with number' },
    { pattern: /^chapter\s+\d+\s*$/i, weight: 0.95, name: 'Plain "Chapter N"' },
    { pattern: /^chapter\s+[ivxlcdm]+\s*$/i, weight: 0.95, name: 'Chapter with Roman numeral' },
    { pattern: /^part\s+\d+\s*$/i, weight: 0.9, name: 'Part N' },
    { pattern: /^part\s+[ivxlcdm]+\s*$/i, weight: 0.9, name: 'Part with Roman numeral' },
    
    // Medium confidence patterns
    { pattern: /^\*\*chapter\s+\d+\*\*\s*$/i, weight: 0.85, name: 'Bold markdown chapter' },
    { pattern: /^chapter\s+\d+[:.]\s*.+$/i, weight: 0.8, name: 'Chapter N: Title' },
    { pattern: /^#{1,3}\s+chapter\s+[ivxlcdm]+\s*$/i, weight: 0.8, name: 'Markdown header Roman' },
    { pattern: /^act\s+\d+\s*$/i, weight: 0.75, name: 'Act N' },
    { pattern: /^book\s+\d+\s*$/i, weight: 0.75, name: 'Book N' },
    
    // Lower confidence patterns
    { pattern: /^chapter\s*$/i, weight: 0.6, name: 'Just "Chapter"' },
    { pattern: /^#{1,6}\s+.+$/i, weight: 0.5, name: 'Any markdown header' },
    { pattern: /^[A-Z][A-Z\s]{10,}$/, weight: 0.4, name: 'All caps line (potential title)' },
  ];

  /**
   * Detect chapters with confidence scoring
   */
  static detectChapters(lines: readonly string[]): readonly DetectedChapter[] {
    const detected: DetectedChapter[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines
      if (line.length === 0) {
        continue;
      }
      
      // Test against all patterns
      for (const { pattern, weight, name } of this.PATTERNS) {
        if (pattern.test(line)) {
          // Calculate confidence based on context
          const confidence = this.calculateConfidence(line, i, lines, weight);
          
          // Only add if confidence is above threshold
          if (confidence >= 0.3) {
            detected.push({
              lineIndex: i,
              title: this.cleanChapterTitle(line),
              originalLine: line,
              confidence,
              matchedPattern: name,
            });
            break; // Only match first pattern
          }
        }
      }
    }
    
    // Sort by line index
    return detected.sort((a, b) => a.lineIndex - b.lineIndex);
  }

  /**
   * Calculate confidence score with context
   */
  private static calculateConfidence(
    line: string,
    lineIndex: number,
    allLines: readonly string[],
    baseWeight: number
  ): number {
    let confidence = baseWeight;
    
    // Boost confidence if line is isolated (surrounded by empty lines)
    const prevLine = lineIndex > 0 ? allLines[lineIndex - 1].trim() : '';
    const nextLine = lineIndex < allLines.length - 1 ? allLines[lineIndex + 1].trim() : '';
    
    if (prevLine.length === 0 && nextLine.length > 0) {
      confidence += 0.1; // Isolated line, likely a header
    }
    
    // Reduce confidence if line is very long (probably not a chapter title)
    if (line.length > 100) {
      confidence *= 0.7;
    }
    
    // Boost if line is short and contains numbers
    if (line.length < 50 && /\d/.test(line)) {
      confidence += 0.05;
    }
    
    // Reduce if line contains dialogue markers (probably not a chapter)
    if (/["'"]/.test(line) && line.length > 20) {
      confidence *= 0.8;
    }
    
    // Clamp to [0, 1]
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Clean chapter title (remove markdown, extra whitespace)
   */
  private static cleanChapterTitle(line: string): string {
    return line
      .replace(/^#+\s*/, '') // Remove markdown headers
      .replace(/\*\*/g, '') // Remove bold markers
      .replace(/^\s+|\s+$/g, '') // Trim whitespace
      .replace(/\s+/g, ' '); // Normalize internal whitespace
  }
}

// ============================================================================
// Stage 4: Scene Detection
// ============================================================================

export class SceneDetector {
  /**
   * Scene break patterns
   */
  private static readonly SCENE_BREAK_PATTERNS = [
    /^[*]{3,}$/,           // ***
    /^[-]{3,}$/,           // ---
    /^[=]{3,}$/,           // ===
    /^\* \* \*$/,          // * * *
    /^~{3,}$/,             // ~~~
    /^_{3,}$/,             // ___
    /^[*\-=]{5,}$/,        // Mixed separators
  ];

  /**
   * Minimum paragraph gap to consider a scene break (empty lines)
   */
  private static readonly MIN_PARAGRAPH_GAP = 2;

  /**
   * Detect scene breaks
   */
  static detectScenes(
    lines: readonly string[],
    chapters: readonly DetectedChapter[]
  ): readonly DetectedScene[] {
    const scenes: DetectedScene[] = [];
    const chapterIndices = new Set(chapters.map(c => c.lineIndex));
    
    // Add chapter boundaries as scene breaks
    for (const chapter of chapters) {
      scenes.push({
        lineIndex: chapter.lineIndex,
        breakType: 'chapter-boundary',
      });
    }
    
    // Detect explicit scene breaks
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check for explicit scene break patterns
      if (this.SCENE_BREAK_PATTERNS.some(pattern => pattern.test(line))) {
        scenes.push({
          lineIndex: i,
          breakType: 'explicit',
          originalLine: line,
        });
      }
    }
    
    // Detect paragraph breaks (multiple consecutive empty lines)
    let consecutiveEmpty = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().length === 0) {
        consecutiveEmpty++;
      } else {
        if (consecutiveEmpty >= this.MIN_PARAGRAPH_GAP) {
          // Check if this isn't already a scene break
          const isExistingBreak = scenes.some(s => s.lineIndex === i);
          if (!isExistingBreak) {
            scenes.push({
              lineIndex: i,
              breakType: 'paragraph',
            });
          }
        }
        consecutiveEmpty = 0;
      }
    }
    
    // Sort by line index
    return scenes.sort((a, b) => a.lineIndex - b.lineIndex);
  }
}

// ============================================================================
// Stage 5: Word Counting (Accurate)
// ============================================================================

export class WordCounter {
  /**
   * Count words in text (UTF-8 safe, accurate)
   */
  static countWords(text: string): WordCount {
    const computed = computeWordCount(text);
    return createWordCount(text, computed);
  }

  /**
   * Count words for a range of lines
   */
  static countWordsInRange(
    lines: readonly string[],
    startIndex: number,
    endIndex: number
  ): WordCount {
    const text = lines.slice(startIndex, endIndex).join('\n');
    return this.countWords(text);
  }

  /**
   * Count words for each chapter
   */
  static countChapterWords(
    lines: readonly string[],
    chapters: readonly DetectedChapter[]
  ): ReadonlyMap<number, WordCount> {
    const counts = new Map<number, WordCount>();
    
    for (let i = 0; i < chapters.length; i++) {
      const chapter = chapters[i];
      const startIndex = chapter.lineIndex + 1; // Skip chapter title line
      const endIndex = i < chapters.length - 1
        ? chapters[i + 1].lineIndex
        : lines.length;
      
      const wordCount = this.countWordsInRange(lines, startIndex, endIndex);
      counts.set(i, wordCount);
    }
    
    return counts;
  }

  /**
   * Count words for each scene
   */
  static countSceneWords(
    lines: readonly string[],
    scenes: readonly DetectedScene[]
  ): ReadonlyMap<number, WordCount> {
    const counts = new Map<number, WordCount>();
    
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      const startIndex = scene.lineIndex + (scene.breakType === 'explicit' ? 1 : 0);
      const endIndex = i < scenes.length - 1
        ? scenes[i + 1].lineIndex
        : lines.length;
      
      const wordCount = this.countWordsInRange(lines, startIndex, endIndex);
      counts.set(i, wordCount);
    }
    
    return counts;
  }
}

// ============================================================================
// Stage 6: Validation & Preview
// ============================================================================

export class ImportValidator {
  /**
   * Validate import result
   */
  static validate(result: Omit<ImportResult, 'validation' | 'preview'>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const encodingIssues: string[] = [];
    
    // Check text integrity
    const textIntegrity = this.checkTextIntegrity(result.normalizedText.text);
    if (!textIntegrity) {
      errors.push('Text integrity check failed - possible corruption detected');
    }
    
    // Check for encoding issues
    if (result.normalizedText.text.includes('\ufffd')) {
      encodingIssues.push('Text contains replacement characters () indicating encoding problems');
      warnings.push('Some characters may not have been decoded correctly');
    }
    
    // Validate word counts
    if (result.totalWordCount.computed < 0) {
      errors.push('Invalid word count computed');
    }
    
    // Check chapter consistency
    if (result.detectedChapters.length > 0) {
      const overlappingChapters = this.checkChapterOverlaps(result.detectedChapters);
      if (overlappingChapters.length > 0) {
        warnings.push(`Found ${overlappingChapters.length} potentially overlapping chapter markers`);
      }
      
      // Check for chapters with very low confidence
      const lowConfidenceChapters = result.detectedChapters.filter(c => c.confidence < 0.5);
      if (lowConfidenceChapters.length > 0) {
        warnings.push(`${lowConfidenceChapters.length} chapters detected with low confidence (< 0.5)`);
      }
    }
    
    // Check for empty content
    if (result.normalizedText.text.trim().length === 0) {
      errors.push('File appears to be empty');
    }
    
    // Check for very large files (warn, not error)
    if (result.normalizedText.byteLength > 10 * 1024 * 1024) { // 10MB
      warnings.push('File is very large (>10MB) - processing may be slow');
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors as readonly string[],
      warnings: warnings as readonly string[],
      textIntegrity,
      encodingIssues: encodingIssues as readonly string[],
    };
  }

  /**
   * Check text integrity (no unexpected corruption)
   */
  private static checkTextIntegrity(text: string): boolean {
    // Check for null bytes (shouldn't be in text)
    if (text.includes('\0')) {
      return false;
    }
    
    // Check for excessive replacement characters
    const replacementCount = (text.match(/\ufffd/g) || []).length;
    const replacementRatio = replacementCount / text.length;
    if (replacementRatio > 0.01) { // More than 1% replacement chars
      return false;
    }
    
    return true;
  }

  /**
   * Check for overlapping chapter markers
   */
  private static checkChapterOverlaps(
    chapters: readonly DetectedChapter[]
  ): readonly DetectedChapter[] {
    const overlaps: DetectedChapter[] = [];
    
    for (let i = 0; i < chapters.length - 1; i++) {
      const current = chapters[i];
      const next = chapters[i + 1];
      
      // If chapters are very close (within 5 lines), might be overlap
      if (next.lineIndex - current.lineIndex < 5) {
        overlaps.push(current, next);
      }
    }
    
    return overlaps;
  }
}

export class PreviewGenerator {
  /**
   * Generate preview data for UI
   */
  static generatePreview(
    result: Omit<ImportResult, 'preview'>
  ): PreviewData {
    const previewText = result.normalizedText.text
      .slice(0, 500)
      .replace(/\n/g, ' ')
      .trim();
    
    const chapterTitles = result.detectedChapters
      .slice(0, 10)
      .map(c => c.title);
    
    // Estimate reading time (200 words per minute)
    const estimatedReadingTime = Math.ceil(
      result.totalWordCount.computed / 200
    );
    
    return {
      totalWords: result.totalWordCount.computed,
      totalCharacters: result.normalizedText.characterCount,
      chapterCount: result.detectedChapters.length,
      sceneCount: result.detectedScenes.length,
      estimatedReadingTime,
      previewText,
      chapterTitles,
    };
  }
}

// ============================================================================
// Main Pipeline
// ============================================================================

export class ImportPipeline {
  /**
   * Execute the complete import pipeline
   * FIXED: Added edge case handling
   */
  static async execute(file: File, title?: string): Promise<ImportResult> {
    try {
      // Pre-validation: Check file before processing
      const fileValidation = EdgeCaseHandlers.validateFile(file);
      
      if (!fileValidation.isValid) {
        throw new ImportError(
          fileValidation.errors.join('; '),
          'FILE_VALIDATION_ERROR'
        );
      }
      
      // Stage 1: File read + UTF-8 normalization
      const { text: rawText, encoding } = await FileReaderStage.readFile(file);
      
      // Stage 2: Line ending normalization
      const normalizedText = LineEndingNormalizer.normalize(rawText);
      
      // Stage 3: Chapter detection
      const detectedChapters = ChapterDetector.detectChapters(normalizedText.lines);
      
      // Stage 4: Scene detection
      const detectedScenes = SceneDetector.detectScenes(
        normalizedText.lines,
        detectedChapters
      );
      
      // Stage 5: Word counting
      const totalWordCount = WordCounter.countWords(normalizedText.text);
      const chapterWordCounts = WordCounter.countChapterWords(
        normalizedText.lines,
        detectedChapters
      );
      const sceneWordCounts = WordCounter.countSceneWords(
        normalizedText.lines,
        detectedScenes
      );
      
      // Stage 6: Validation & Preview
      const partialResult: Omit<ImportResult, 'validation' | 'preview'> = {
        title: title || this.extractTitle(file.name, normalizedText.lines),
        normalizedText,
        detectedChapters,
        detectedScenes,
        totalWordCount,
        chapterWordCounts,
        sceneWordCounts,
      };
      
      const validation = ImportValidator.validate(partialResult);
      
      // Enhance validation with edge case warnings
      const enhancedValidation = EdgeCaseHandlers.enhanceValidationResult(
        validation,
        {
          file,
          chapters: detectedChapters,
          scenes: detectedScenes,
          text: normalizedText.text,
          lines: normalizedText.lines,
        }
      );
      
      const preview = PreviewGenerator.generatePreview(partialResult);
      
      return {
        ...partialResult,
        validation: enhancedValidation,
        preview,
      };
    } catch (error) {
      if (error instanceof ImportError) {
        throw error;
      }
      throw new ImportError(
        `Import pipeline failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'PIPELINE_ERROR'
      );
    }
  }

  /**
   * Extract title from filename or first line
   */
  private static extractTitle(filename: string, lines: readonly string[]): string {
    // Try filename first (remove extension)
    const fromFilename = filename.replace(/\.[^/.]+$/, '').trim();
    if (fromFilename.length > 0) {
      return fromFilename;
    }
    
    // Try first non-empty line
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length > 0 && trimmed.length < 100) {
        return trimmed;
      }
    }
    
    return 'Imported Story';
  }
}

// ============================================================================
// Error Handling
// ============================================================================

export class ImportError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = 'ImportError';
  }
}
