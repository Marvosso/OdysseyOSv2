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
 * Result of character detection
 */
export interface DetectedCharacter {
  /** Character name */
  readonly name: string;
  /** Confidence score (0-1) */
  readonly confidence: number;
  /** Number of occurrences in text */
  readonly occurrences: number;
  /** First occurrence line index */
  readonly firstSeen: number;
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
  /** Detected characters */
  readonly detectedCharacters: readonly DetectedCharacter[];
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
  /** Number of characters detected */
  readonly characterCount: number;
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
      
      // Validate decoded text with auto-sanitize enabled
      const validation = BrowserTextDecoder.validateDecodedText(decoded.text, { 
        autoSanitize: true 
      });
      
      // Use sanitized text if available, otherwise use original
      const textToUse = validation.sanitizedText || decoded.text;
      
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
        text: textToUse,
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
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'importPipeline.ts:351',message:'Testing line against chapter patterns',data:{lineIndex:i,line:line.substring(0,100),lineLength:line.length,hasNonAscii:line.split('').some(ch=>ch.charCodeAt(0)>126)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      // Test against all patterns
      for (const { pattern, weight, name } of this.PATTERNS) {
        if (pattern.test(line)) {
          // Calculate confidence based on context
          const confidence = this.calculateConfidence(line, i, lines, weight);
          
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'importPipeline.ts:355',message:'Pattern matched',data:{lineIndex:i,matchedPattern:name,confidence:confidence,line:line.substring(0,100),hasNonAscii:line.split('').some(ch=>ch.charCodeAt(0)>126)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
          // #endregion
          
          // Only add if confidence is above threshold
          if (confidence >= 0.3) {
            console.log('[detectChapters] Pattern matched, cleaning title. Line:', line.substring(0, 100));
            const cleanedTitle = this.cleanChapterTitle(line);
            
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'importPipeline.ts:361',message:'Creating detected chapter',data:{lineIndex:i,originalLine:line.substring(0,100),cleanedTitle:cleanedTitle,cleanedTitleLength:cleanedTitle.length,hasNonAscii:cleanedTitle.split('').some(ch=>ch.charCodeAt(0)>126),confidence:confidence},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
            // #endregion
            
            // Skip if cleaned title is empty or corrupted
            if (!cleanedTitle || cleanedTitle.length === 0) {
              console.log('[detectChapters] SKIPPING - cleaned title is empty. Original:', line.substring(0, 100));
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'importPipeline.ts:370',message:'Skipping chapter - cleaned title is empty',data:{lineIndex:i,originalLine:line.substring(0,100)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
              // #endregion
              break; // Skip this match
            }
            
            console.log('[detectChapters] ADDING chapter:', { lineIndex: i, title: cleanedTitle, confidence });
            
            detected.push({
              lineIndex: i,
              title: cleanedTitle,
              originalLine: line,
              confidence,
              matchedPattern: name,
            });
            break; // Only match first pattern
          }
        }
      }
    }
    
    // CRITICAL: Final sanitization pass - ensure all chapter titles are ASCII-only
    // This is a defensive measure in case corrupted text somehow gets through
    const sanitizedDetected = detected.map((chapter, index) => {
      let cleanTitle = chapter.title.split('').filter((char: string) => {
        const code = char.charCodeAt(0);
        return code >= 32 && code <= 126;
      }).join('').trim();
      cleanTitle = cleanTitle.replace(/[^\x20-\x7E]/g, '').trim();
      
      // If title is empty or corrupted, use default
      if (!cleanTitle || cleanTitle.length === 0 || cleanTitle.length < 2) {
        cleanTitle = `Chapter ${index + 1}`;
      }
      
      return {
        ...chapter,
        title: cleanTitle
      };
    });
    
    // Sort by line index
    return sanitizedDetected.sort((a, b) => a.lineIndex - b.lineIndex);
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
   * Clean chapter title (remove markdown, extra whitespace, and sanitize non-ASCII)
   */
  private static cleanChapterTitle(line: string): string {
    console.log('[cleanChapterTitle] INPUT:', line.substring(0, 100));
    
    let cleaned = line
      .replace(/^#+\s*/, '') // Remove markdown headers
      .replace(/\*\*/g, '') // Remove bold markers
      .replace(/^\s+|\s+$/g, '') // Trim whitespace
      .replace(/\s+/g, ' '); // Normalize internal whitespace
    
    console.log('[cleanChapterTitle] After markdown removal:', cleaned.substring(0, 100));
    
    // CRITICAL: Remove ALL non-ASCII characters to prevent corrupted titles
    cleaned = cleaned.split('').filter((char: string) => {
      const code = char.charCodeAt(0);
      // Keep only printable ASCII (32-126)
      return code >= 32 && code <= 126;
    }).join('');
    
    // Remove any remaining non-ASCII using regex as fallback
    cleaned = cleaned.replace(/[^\x20-\x7E]/g, '').trim();
    
    console.log('[cleanChapterTitle] After ASCII filtering:', cleaned);
    
    // Validate title is meaningful
    const asciiCount = cleaned.split('').filter((char: string) => {
      const code = char.charCodeAt(0);
      return code >= 32 && code <= 126;
    }).length;
    
    const letterNumberCount = cleaned.split('').filter((char: string) => {
      const code = char.charCodeAt(0);
      return (code >= 48 && code <= 57) || // 0-9
             (code >= 65 && code <= 90) || // A-Z
             (code >= 97 && code <= 122) || // a-z
             code === 32; // space
    }).length;
    
    const asciiRatio = cleaned.length > 0 ? asciiCount / cleaned.length : 0;
    const letterRatio = cleaned.length > 0 ? letterNumberCount / cleaned.length : 0;
    
    console.log('[cleanChapterTitle] Validation:', {
      cleaned,
      length: cleaned.length,
      asciiCount,
      asciiRatio,
      letterNumberCount,
      letterRatio
    });
    
    // If title is empty or corrupted after sanitization, return empty (will be handled by caller)
    if (!cleaned || 
        cleaned.length === 0 || 
        cleaned.length < 2 ||
        (cleaned.length > 0 && asciiRatio < 1.0) ||
        (cleaned.length > 0 && letterRatio < 0.3)) {
      console.log('[cleanChapterTitle] REJECTED - returning empty string');
      // Return empty string - the caller should handle this
      return '';
    }
    
    console.log('[cleanChapterTitle] ACCEPTED:', cleaned);
    return cleaned;
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
// Stage 5.5: Character Detection (Non-AI Heuristics)
// ============================================================================

export class CharacterDetector {
  /**
   * Common words to exclude from character detection
   */
  private static readonly EXCLUDED_WORDS = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that',
    'these', 'those', 'he', 'she', 'it', 'they', 'we', 'you', 'i', 'me',
    'him', 'her', 'us', 'them', 'his', 'hers', 'its', 'their', 'our',
    'your', 'my', 'mine', 'yours', 'theirs', 'ours', 'said', 'says',
    'say', 'asked', 'asks', 'ask', 'replied', 'replies', 'reply',
    'thought', 'think', 'thinks', 'felt', 'feels', 'feel', 'looked',
    'looks', 'look', 'saw', 'see', 'sees', 'went', 'go', 'goes', 'came',
    'come', 'comes', 'got', 'get', 'gets', 'took', 'take', 'takes',
    'made', 'make', 'makes', 'know', 'knows', 'knew', 'want', 'wants',
    'wanted', 'need', 'needs', 'needed', 'like', 'likes', 'liked',
  ]);

  /**
   * Detect character names using heuristics
   */
  static detectCharacters(
    lines: readonly string[],
    text: string
  ): readonly DetectedCharacter[] {
    const candidates = new Map<string, {
      occurrences: number;
      firstSeen: number;
      contexts: string[];
    }>();

    // Pattern 1: Capitalized words at start of sentences (likely names)
    const sentenceStartPattern = /(?:^|\.\s+|!\s+|\?\s+)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g;
    let match;
    let lineIndex = 0;
    let charIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineStart = charIndex;
      
      // Check for dialogue patterns: "Name said" or 'Name said'
      const dialoguePattern = /["']([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)["']\s+(?:said|says|asked|asks|replied|replies|whispered|shouted|exclaimed)/gi;
      let dialogueMatch;
      while ((dialogueMatch = dialoguePattern.exec(line)) !== null) {
        const name = dialogueMatch[1].trim();
        if (this.isValidCharacterName(name)) {
          this.addCandidate(candidates, name, i, line);
        }
      }

      // Check for "Name said" pattern (without quotes)
      const saidPattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:said|says|asked|asks|replied|replies|whispered|shouted|exclaimed|thought|thinks)/gi;
      let saidMatch;
      while ((saidMatch = saidPattern.exec(line)) !== null) {
        const name = saidMatch[1].trim();
        if (this.isValidCharacterName(name)) {
          this.addCandidate(candidates, name, i, line);
        }
      }

      // Check for capitalized words at sentence start
      while ((match = sentenceStartPattern.exec(line)) !== null) {
        const potentialName = match[1].trim();
        if (this.isValidCharacterName(potentialName)) {
          this.addCandidate(candidates, potentialName, i, line);
        }
      }

      charIndex += line.length + 1; // +1 for newline
    }

    // Convert to DetectedCharacter array with confidence scores
    const detected: DetectedCharacter[] = [];
    
    for (const [name, data] of candidates.entries()) {
      // Calculate confidence based on:
      // - Number of occurrences (more = higher confidence)
      // - Context (dialogue patterns = higher confidence)
      // - Length (2-3 words typical for names)
      const wordCount = name.split(/\s+/).length;
      const occurrenceScore = Math.min(data.occurrences / 10, 1.0); // Cap at 10 occurrences
      const lengthScore = wordCount >= 1 && wordCount <= 3 ? 1.0 : 0.7;
      const contextScore = data.contexts.some(ctx => 
        /said|asked|replied|whispered|shouted/.test(ctx.toLowerCase())
      ) ? 1.0 : 0.6;

      const confidence = (occurrenceScore * 0.4 + lengthScore * 0.3 + contextScore * 0.3);
      
      // Only include if confidence is above threshold and appears multiple times
      if (confidence >= 0.4 && data.occurrences >= 2) {
        detected.push({
          name,
          confidence,
          occurrences: data.occurrences,
          firstSeen: data.firstSeen,
        });
      }
    }

    // Sort by confidence (highest first), then by occurrences
    return detected.sort((a, b) => {
      if (b.confidence !== a.confidence) {
        return b.confidence - a.confidence;
      }
      return b.occurrences - a.occurrences;
    });
  }

  /**
   * Check if a word/phrase is a valid character name candidate
   */
  private static isValidCharacterName(name: string): boolean {
    // Must be 2-30 characters total
    if (name.length < 2 || name.length > 30) {
      return false;
    }

    // Must start with capital letter
    if (!/^[A-Z]/.test(name)) {
      return false;
    }

    // Must not be all caps (likely acronyms or emphasis)
    if (name === name.toUpperCase() && name.length > 1) {
      return false;
    }

    // Must not be excluded word
    const lowerName = name.toLowerCase();
    if (this.EXCLUDED_WORDS.has(lowerName)) {
      return false;
    }

    // Must not contain numbers or special chars (except spaces, hyphens, apostrophes)
    if (!/^[A-Za-z\s\-']+$/.test(name)) {
      return false;
    }

    // Must not be common titles
    const titles = ['mr', 'mrs', 'ms', 'dr', 'prof', 'sir', 'madam', 'lord', 'lady'];
    const firstWord = lowerName.split(/\s+/)[0];
    if (titles.includes(firstWord)) {
      return false;
    }

    return true;
  }

  /**
   * Add a candidate name to the map
   */
  private static addCandidate(
    candidates: Map<string, { occurrences: number; firstSeen: number; contexts: string[] }>,
    name: string,
    lineIndex: number,
    line: string
  ): void {
    const normalized = name.trim();
    if (!candidates.has(normalized)) {
      candidates.set(normalized, {
        occurrences: 0,
        firstSeen: lineIndex,
        contexts: [],
      });
    }
    
    const candidate = candidates.get(normalized)!;
    candidate.occurrences++;
    if (candidate.contexts.length < 3) {
      candidate.contexts.push(line.substring(0, 100));
    }
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
    result: Omit<ImportResult, 'validation' | 'preview'>
  ): PreviewData {
    const previewText = result.normalizedText.text
      .slice(0, 500)
      .replace(/\n/g, ' ')
      .trim();
    
    // CRITICAL: Sanitize chapter titles in preview to prevent corrupted text from appearing
    const chapterTitles = result.detectedChapters
      .slice(0, 10)
      .map(c => {
        // Final sanitization pass for preview
        let cleanTitle = c.title.split('').filter((char: string) => {
          const code = char.charCodeAt(0);
          return code >= 32 && code <= 126;
        }).join('').trim();
        cleanTitle = cleanTitle.replace(/[^\x20-\x7E]/g, '').trim();
        return cleanTitle || `Chapter ${result.detectedChapters.indexOf(c) + 1}`;
      });
    
    // Estimate reading time (200 words per minute)
    const estimatedReadingTime = Math.ceil(
      result.totalWordCount.computed / 200
    );
    
    return {
      totalWords: result.totalWordCount.computed,
      totalCharacters: result.normalizedText.characterCount,
      chapterCount: result.detectedChapters.length,
      sceneCount: result.detectedScenes.length,
      characterCount: result.detectedCharacters.length,
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
      // #region agent log
      console.log('[ImportPipeline.execute] File validation check. File:', file.name, 'Type:', file.type, 'Extension:', file.name.substring(file.name.lastIndexOf('.')));
      fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'importPipeline.ts:987',message:'File validation',data:{fileName:file.name,fileType:file.type,extension:file.name.substring(file.name.lastIndexOf('.'))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      // Pre-validation: Check file before processing
      const fileValidation = EdgeCaseHandlers.validateFile(file);
      
      console.log('[ImportPipeline.execute] Validation result:', fileValidation.isValid, 'Errors:', fileValidation.errors);
      
      if (!fileValidation.isValid) {
        throw new ImportError(
          fileValidation.errors.join('; '),
          'FILE_VALIDATION_ERROR'
        );
      }
      
      // #region agent log
      console.log('[ImportPipeline.execute] Starting import for file:', file.name, 'Type:', file.type, 'Size:', file.size);
      fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'importPipeline.ts:1000',message:'Starting import pipeline',data:{fileName:file.name,fileType:file.type,fileSize:file.size},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      // Stage 1: File read + UTF-8 normalization
      const { text: rawText, encoding } = await FileReaderStage.readFile(file);
      
      // #region agent log
      console.log('[ImportPipeline.execute] File read complete. Text length:', rawText.length, 'Sample:', rawText.substring(0, 200));
      fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'importPipeline.ts:1003',message:'File read complete',data:{textLength:rawText.length,textSample:rawText.substring(0,200),hasNonAscii:rawText.substring(0,200).split('').some(c=>c.charCodeAt(0)>126)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      // Stage 2: Line ending normalization
      const normalizedText = LineEndingNormalizer.normalize(rawText);
      
      // #region agent log
      console.log('[ImportPipeline.execute] Starting chapter detection. Lines:', normalizedText.lines.length);
      fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'importPipeline.ts:982',message:'Before chapter detection',data:{lineCount:normalizedText.lines.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      // Stage 3: Chapter detection
      const detectedChapters = ChapterDetector.detectChapters(normalizedText.lines);
      
      // #region agent log
      console.log('[ImportPipeline.execute] Chapter detection complete. Detected:', detectedChapters.length, 'chapters');
      detectedChapters.forEach((ch, idx) => {
        console.log(`[ImportPipeline.execute] Chapter ${idx}:`, ch.title, 'Confidence:', ch.confidence, 'Has non-ASCII:', ch.title.split('').some(c=>c.charCodeAt(0)>126));
      });
      fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'importPipeline.ts:985',message:'After chapter detection',data:{chapterCount:detectedChapters.length,chapters:detectedChapters.map(c=>({title:c.title,confidence:c.confidence,hasNonAscii:c.title.split('').some(ch=>ch.charCodeAt(0)>126)}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      // Stage 4: Scene detection
      const detectedScenes = SceneDetector.detectScenes(
        normalizedText.lines,
        detectedChapters
      );
      
      // Stage 4.5: Character detection
      const detectedCharacters = CharacterDetector.detectCharacters(
        normalizedText.lines,
        normalizedText.text
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
        detectedCharacters,
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
