/**
 * Story Import Function
 * 
 * Unified function to import stories from .docx, .pdf, .txt, and .md files.
 * Handles file type detection, text extraction, normalization, parsing, and validation.
 */

import { extractTextFromFile, type ExtractedText } from './fileExtractor';
import { StoryParser, type ParsedStory } from '@/lib/storage/storyParser';
import { computeWordCount } from '@/utils/wordCount';
import type { Story, Scene, Chapter } from '@/types/story';

/**
 * Import result with metadata and warnings
 */
export interface ImportStoryResult {
  /** Parsed story data */
  story: ParsedStory;
  /** Total word count across all scenes */
  totalWordCount: number;
  /** Total character count (including spaces) */
  totalCharacterCount: number;
  /** Total character count (excluding spaces) */
  totalCharacterCountNoSpaces: number;
  /** Number of chapters detected */
  chapterCount: number;
  /** Number of scenes detected/created */
  sceneCount: number;
  /** File type that was imported */
  fileType: 'pdf' | 'docx' | 'txt' | 'md';
  /** Warnings about unreadable content or issues */
  warnings: string[];
  /** Whether the import was successful */
  success: boolean;
}

/**
 * Detect file type from extension or MIME type
 */
function detectFileTypeFromFile(file: File): 'pdf' | 'docx' | 'txt' | 'md' | null {
  // Try MIME type first (more reliable)
  const mimeType = file.type.toLowerCase();
  if (mimeType.includes('pdf')) return 'pdf';
  if (mimeType.includes('wordprocessingml') || mimeType.includes('officedocument.wordprocessingml')) return 'docx';
  if (mimeType.includes('text/plain') || mimeType.includes('text')) return 'txt';
  if (mimeType.includes('markdown')) return 'md';
  
  // Fallback to extension
  const extension = file.name.toLowerCase().split('.').pop();
  switch (extension) {
    case 'pdf':
      return 'pdf';
    case 'docx':
      return 'docx';
    case 'txt':
      return 'txt';
    case 'md':
    case 'markdown':
      return 'md';
    default:
      return null;
  }
}

/**
 * Normalize text: convert smart quotes and dashes to plain ASCII
 * This is applied after extraction to ensure consistent formatting
 */
function normalizeSmartCharacters(text: string): string {
  return text
    // Smart quotes to straight quotes
    .replace(/[""]/g, '"')      // Left/right double quotes → straight quote
    .replace(/['']/g, "'")      // Left/right single quotes → straight apostrophe
    .replace(/['']/g, "'")      // Alternative single quotes → apostrophe
    .replace(/[""]/g, '"')      // Alternative double quotes → straight quote
    // Smart dashes to plain ASCII
    .replace(/—/g, '--')        // Em dash (—) → double hyphen
    .replace(/–/g, '-')         // En dash (–) → single hyphen
    .replace(/―/g, '--');       // Horizontal bar (―) → double hyphen
}

/**
 * Check for unreadable content and generate warnings
 */
function checkContentReadability(text: string, fileType: 'pdf' | 'docx' | 'txt' | 'md'): string[] {
  const warnings: string[] = [];
  
  // Check for excessive replacement characters (encoding issues)
  const replacementCount = (text.match(/\ufffd/g) || []).length;
  if (replacementCount > 0) {
    const ratio = replacementCount / text.length;
    if (ratio > 0.01) {
      warnings.push(`High number of unreadable characters detected (${replacementCount} characters, ${(ratio * 100).toFixed(1)}%). The file may have encoding issues.`);
    } else if (ratio > 0.001) {
      warnings.push(`Some unreadable characters detected (${replacementCount} characters). Some content may not display correctly.`);
    }
  }
  
  // Check for excessive control characters (except common whitespace)
  const controlCharPattern = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;
  const controlChars = text.match(controlCharPattern);
  if (controlChars && controlChars.length > text.length * 0.05) {
    warnings.push(`Many control characters detected. The file may contain formatting that couldn't be extracted properly.`);
  }
  
  // Check for very short content (might indicate extraction failure)
  if (text.trim().length < 50 && fileType !== 'txt') {
    warnings.push(`Extracted content is very short (${text.trim().length} characters). The file may not have been extracted correctly.`);
  }
  
  // Check for PDF/DOCX specific issues
  if (fileType === 'pdf' || fileType === 'docx') {
    // Check if text is mostly whitespace (might indicate extraction failure)
    const nonWhitespaceRatio = text.replace(/\s/g, '').length / text.length;
    if (nonWhitespaceRatio < 0.3 && text.length > 100) {
      warnings.push(`Extracted text contains mostly whitespace. Some content may not have been extracted from the ${fileType.toUpperCase()} file.`);
    }
  }
  
  return warnings;
}

/**
 * Import story from file
 * 
 * @param file - File to import (.docx, .pdf, .txt, or .md)
 * @param title - Optional story title (defaults to filename without extension)
 * @returns Import result with parsed story, metadata, and warnings
 * @throws Error if file is unsupported, corrupted, or unreadable
 */
export async function importStory(
  file: File,
  title?: string
): Promise<ImportStoryResult> {
  const warnings: string[] = [];
  
  try {
    // Step 1: Detect file type
    const detectedType = detectFileTypeFromFile(file);
    if (!detectedType) {
      const extension = file.name.toLowerCase().split('.').pop();
      if (extension === 'doc') {
        throw new Error(
          `Unsupported format: .doc files are not supported. ` +
          `Please convert your .doc file to .docx format (File > Save As > Word Document in Microsoft Word) ` +
          `or use one of the supported formats: .txt, .md, .pdf, .docx`
        );
      }
      throw new Error(
        `Unsupported file format: ${file.name}. ` +
        `Supported formats: .txt, .md, .pdf, .docx`
      );
    }
    
    // Step 2: Extract text from file
    let extracted: ExtractedText;
    try {
      extracted = await extractTextFromFile(file);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('corrupted') || error.message.includes('unreadable')) {
          throw new Error(
            `File appears to be corrupted or unreadable: ${error.message}. ` +
            `Please try re-exporting the file or use a different format.`
          );
        }
        throw new Error(`Failed to extract text from ${detectedType.toUpperCase()} file: ${error.message}`);
      }
      throw new Error(`Failed to extract text from ${detectedType.toUpperCase()} file: Unknown error`);
    }
    
    // Step 3: Apply additional normalization (smart quotes, dashes)
    // Note: Line endings are already normalized in extractTextFromFile
    // StoryParser also normalizes these, but we do it here as well for safety
    let normalizedText = normalizeSmartCharacters(extracted.text);
    
    // Additional normalization: ensure line endings are correct
    normalizedText = normalizedText
      .replace(/\r\n/g, '\n')  // Windows line endings
      .replace(/\r/g, '\n');    // Old Mac line endings
    
    // Step 4: Check for unreadable content and generate warnings
    const readabilityWarnings = checkContentReadability(normalizedText, detectedType);
    warnings.push(...readabilityWarnings);
    
    // Step 5: Validate extracted text
    if (!normalizedText || normalizedText.trim().length === 0) {
      throw new Error(
        `File appears to be empty or unreadable after extraction. ` +
        `Please check that the ${detectedType.toUpperCase()} file contains text content.`
      );
    }
    
    // Step 6: Parse text into chapters and scenes
    const storyTitle = title || file.name.replace(/\.[^/.]+$/, '');
    let parsed: ParsedStory;
    try {
      parsed = StoryParser.parseTextFile(normalizedText, storyTitle);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('corrupted') || error.message.includes('empty')) {
          throw new Error(
            `Failed to parse story structure: ${error.message}. ` +
            `The file may be corrupted or in an unexpected format.`
          );
        }
        throw new Error(`Failed to parse story: ${error.message}`);
      }
      throw new Error(`Failed to parse story: Unknown error`);
    }
    
    // Step 7: Calculate statistics
    const totalWordCount = parsed.scenes.reduce((sum, scene) => {
      return sum + (scene.wordCount || computeWordCount(scene.content));
    }, 0);
    
    const totalCharacterCount = parsed.scenes.reduce((sum, scene) => {
      return sum + scene.content.length;
    }, 0);
    
    const totalCharacterCountNoSpaces = parsed.scenes.reduce((sum, scene) => {
      return sum + scene.content.replace(/\s/g, '').length;
    }, 0);
    
    // Step 8: Validate parsed structure
    if (parsed.chapters.length === 0 && parsed.scenes.length === 0) {
      warnings.push('No chapters or scenes were detected. The file may not contain structured content.');
    } else if (parsed.chapters.length === 0) {
      warnings.push('No chapters were detected. All content was placed in a default chapter.');
    } else if (parsed.scenes.length === 0) {
      warnings.push('No scenes were detected. Please check that the file contains scene markers or breaks.');
    }
    
    // Check for chapters without scenes (shouldn't happen after auto-creation, but defensive)
    const chaptersWithoutScenes = parsed.chapters.filter(
      chapter => !chapter.scenes || chapter.scenes.length === 0
    );
    if (chaptersWithoutScenes.length > 0) {
      warnings.push(
        `${chaptersWithoutScenes.length} chapter(s) have no scenes: ${chaptersWithoutScenes.map(c => c.title).join(', ')}. ` +
        `These chapters may be empty.`
      );
    }
    
    // Step 9: Return structured result
    return {
      story: parsed,
      totalWordCount,
      totalCharacterCount,
      totalCharacterCountNoSpaces,
      chapterCount: parsed.chapters.length,
      sceneCount: parsed.scenes.length,
      fileType: detectedType,
      warnings,
      success: true,
    };
    
  } catch (error) {
    // Provide clear error messages
    if (error instanceof Error) {
      throw error; // Re-throw our custom errors
    }
    throw new Error(
      `Failed to import story: Unknown error. ` +
      `The file may be corrupted, in an unsupported format, or unreadable.`
    );
  }
}

/**
 * Convert ImportStoryResult to Story object for storage
 */
export function convertImportResultToStory(result: ImportStoryResult): Story {
  return {
    id: `story-${Date.now()}`,
    title: result.story.title,
    scenes: result.story.scenes,
    characters: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
