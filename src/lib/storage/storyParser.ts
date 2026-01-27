'use client';

import { Scene } from '@/types/story';
import { Chapter } from '@/types/outline';
import { computeWordCount } from '@/utils/wordCount';

export interface ParsedStory {
  title: string;
  chapters: Chapter[];
  scenes: Scene[];
}

export class StoryParser {
  // Detect chapter markers in text - expanded patterns for various formats
  // Includes Word/PDF export patterns with various formatting
  private static CHAPTER_PATTERNS = [
    // Plain text formats - numbers
    /^chapter\s+\d+/i,
    /^chapter\s+[ivxlcdm]+/i,
    /^part\s+\d+/i,
    /^part\s+[ivxlcdm]+/i,
    /^act\s+\d+/i,
    /^act\s+[ivxlcdm]+/i,
    // Plain text formats - written numbers (Word/PDF exports)
    /^chapter\s+one$/i,
    /^chapter\s+two$/i,
    /^chapter\s+three$/i,
    /^chapter\s+four$/i,
    /^chapter\s+five$/i,
    /^chapter\s+six$/i,
    /^chapter\s+seven$/i,
    /^chapter\s+eight$/i,
    /^chapter\s+nine$/i,
    /^chapter\s+ten$/i,
    /^chapter\s+eleven$/i,
    /^chapter\s+twelve$/i,
    /^chapter\s+thirteen$/i,
    /^chapter\s+fourteen$/i,
    /^chapter\s+fifteen$/i,
    /^chapter\s+sixteen$/i,
    /^chapter\s+seventeen$/i,
    /^chapter\s+eighteen$/i,
    /^chapter\s+nineteen$/i,
    /^chapter\s+twenty$/i,
    // Uppercase formats (Word/PDF exports)
    /^CHAPTER\s+\d+/i,
    /^CHAPTER\s+ONE$/i,
    /^CHAPTER\s+TWO$/i,
    /^CHAPTER\s+THREE$/i,
    /^CHAPTER\s+FOUR$/i,
    /^CHAPTER\s+FIVE$/i,
    /^PART\s+\d+/i,
    /^ACT\s+\d+/i,
    // Markdown formats
    /^#{1,3}\s*chapter\s+\d+/i,
    /^#{1,3}\s*chapter\s+[ivxlcdm]+/i,
    /^#{1,3}\s*part\s+\d+/i,
    /^#{1,3}\s*part\s+[ivxlcdm]+/i,
    /^#{1,3}\s*act\s+\d+/i,
    /^#{1,3}\s*act\s+[ivxlcdm]+/i,
    // Markdown with just numbers
    /^#{1,3}\s*\d+[\.\)]?\s*$/,
    // Bold/italic formats
    /^\*\*chapter\s+\d+\*\*$/i,
    /^\*chapter\s+\d+\*$/i,
    /^__chapter\s+\d+__$/i,
    // Word/PDF export formats (may have extra whitespace, punctuation, or hidden chars)
    /^chapter\s+\d+[\.\):]\s*/i,
    /^part\s+\d+[\.\):]\s*/i,
    /^act\s+\d+[\.\):]\s*/i,
    /^chapter\s+\d+\s*[\.\):]/i,
    /^part\s+\d+\s*[\.\):]/i,
    /^act\s+\d+\s*[\.\):]/i,
  ];

  // Scene detection patterns - includes headings and explicit scene markers
  private static SCENE_PATTERNS = [
    // Explicit scene markers
    /^scene\s+\d+/i,
    /^scene\s+[ivxlcdm]+/i,
    /^SCENE\s+\d+/i,
    /^Scene\s+\d+/,
    // Markdown scene headings
    /^#{4,6}\s*scene\s+\d+/i,
    /^#{4,6}\s*scene\s+[ivxlcdm]+/i,
    // Word/PDF export formats
    /^scene\s+\d+[\.\):]\s*/i,
    /^scene\s+\d+\s*[\.\):]/i,
    // Heading-based scene detection (h4-h6 in markdown)
    /^####\s+.+$/,
    /^#####\s+.+$/,
    /^######\s+.+$/,
  ];

  /**
   * Check if text is mostly binary/corrupted
   */
  private static isMostlyBinary(text: string): boolean {
    if (!text || text.length === 0) return false;
    
    const nonPrintableCount = text.split('').filter(char => {
      const code = char.charCodeAt(0);
      return !(code >= 32 && code <= 126) && code !== 9 && code !== 10 && code !== 13;
    }).length;
    
    const ratio = nonPrintableCount / text.length;
    return ratio > 0.3; // More than 30% non-printable
  }

  /**
   * Normalize text before parsing:
   * - Strip null bytes and non-printable/binary characters
   * - Normalize line endings (\r\n → \n)
   * - Convert smart quotes and dashes to plain ASCII
   * - Remove hidden characters from Word/PDF exports
   */
  private static normalizeTextForParsing(text: string): string {
    if (!text || typeof text !== 'string') {
      return '';
    }

    // Step 1: Normalize line endings first
    let normalized = text
      .replace(/\r\n/g, '\n')  // Windows line endings (\r\n → \n)
      .replace(/\r/g, '\n');    // Old Mac line endings (\r → \n)
    
    // Step 2: Remove null bytes and other problematic control characters
    // Keep: printable chars (32-126), tab (9), newline (10), carriage return (13)
    normalized = normalized.split('').filter(char => {
      const code = char.charCodeAt(0);
      return code !== 0 && ((code >= 32 && code <= 126) || code === 9 || code === 10 || code === 13);
    }).join('');
    
    // Step 3: Remove null bytes explicitly (defensive, multiple methods)
    normalized = normalized.replace(/\0/g, '').replace(/\u0000/g, '').replace(/\x00/g, '');
    
    // Step 4: Remove other non-printable characters except whitespace
    normalized = normalized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');
    
    // Step 5: Convert smart quotes to plain ASCII
    normalized = normalized
      .replace(/[""]/g, '"')      // Left/right double quotes → straight quote
      .replace(/['']/g, "'")      // Left/right single quotes → straight apostrophe
      .replace(/['']/g, "'")      // Alternative single quotes → apostrophe
      .replace(/[""]/g, '"');     // Alternative double quotes → straight quote
    
    // Step 6: Convert smart dashes to plain ASCII
    normalized = normalized
      .replace(/—/g, '--')        // Em dash (—) → double hyphen
      .replace(/–/g, '-')         // En dash (–) → single hyphen
      .replace(/―/g, '--');       // Horizontal bar (―) → double hyphen
    
    // Step 7: Remove zero-width characters and other hidden Unicode
    normalized = normalized.replace(/[\u200B-\u200D\uFEFF\u00AD\u2060]/g, '');
    
    // Step 8: Normalize multiple consecutive newlines (max 2)
    normalized = normalized.replace(/\n{3,}/g, '\n\n');
    
    // Step 9: Remove trailing whitespace from each line (but preserve structure)
    normalized = normalized.split('\n').map(line => line.trimEnd()).join('\n');
    
    return normalized;
  }

  /**
   * Parse uploaded text into scenes and chapters
   * Handles Word (.docx) and PDF files with proper normalization
   * 
   * @param content - Raw text content from file
   * @param title - Story title (defaults to filename)
   * @returns Parsed story with chapters and scenes
   * @throws Error if content is invalid or corrupted
   */
  static parseTextFile(content: string, title: string = 'Imported Story'): ParsedStory {
    // Validate input
    if (!content || typeof content !== 'string') {
      throw new Error('Invalid content: Content must be a non-empty string');
    }

    if (content.length === 0) {
      throw new Error('Invalid content: Content is empty');
    }

    // Check for obvious corruption (excessive null bytes or control chars)
    const nullByteCount = (content.match(/\0/g) || []).length;
    const controlCharCount = (content.match(/[\x00-\x1F\x7F]/g) || []).length;
    
    if (nullByteCount > content.length * 0.1) {
      throw new Error('File appears corrupted: Contains excessive null bytes. Please try re-exporting the file.');
    }

    if (controlCharCount > content.length * 0.2) {
      console.warn('Warning: File contains many control characters. Attempting to clean...');
    }

    try {
      // Normalize text before parsing
      const normalizedContent = this.normalizeTextForParsing(content);
      
      if (!normalizedContent || normalizedContent.trim().length === 0) {
        throw new Error('File appears to be empty or unreadable after normalization. Please check the file format.');
      }

      const lines = normalizedContent.split('\n');
    const chapters: Chapter[] = [];
    const scenes: Scene[] = [];
    
    let currentChapter: Chapter | null = null;
    let currentSceneContent: string[] = [];
    let sceneCount = 0;
    // Track chapter content for chapters without scenes
    const chapterContentMap: Map<string, string[]> = new Map();

    for (let i = 0; i < lines.length; i++) {
      // Clean line: remove hidden characters and normalize whitespace
      let line = lines[i];
      
      // Skip lines that are mostly binary/corrupted before processing
      const nonPrintableCount = line.split('').filter(char => {
        const code = char.charCodeAt(0);
        return !(code >= 32 && code <= 126) && code !== 9 && code !== 10 && code !== 13;
      }).length;
      if (line.length > 0 && nonPrintableCount / line.length > 0.3) {
        // Skip this line - it's mostly binary/corrupted
        continue;
      }
      
      // Remove zero-width characters and other hidden Unicode
      line = line.replace(/[\u200B-\u200D\uFEFF\u00AD\u2060]/g, '');
      
      // Remove any remaining non-printable characters except whitespace
      line = line.split('').filter(char => {
        const code = char.charCodeAt(0);
        return (code >= 32 && code <= 126) || code === 9 || code === 10 || code === 13;
      }).join('');
      
      line = line.trim();
      
      // Skip empty lines or lines that are too short to be chapter markers
      if (line.length === 0 || line.length < 3) {
        continue;
      }
      
      // Check if this line is a chapter marker (test against cleaned line)
      // Only check if line looks like valid text (not binary)
      const isChapterStart = line.length >= 3 && 
                             !this.isMostlyBinary(line) &&
                             this.CHAPTER_PATTERNS.some(pattern => pattern.test(line));
      
      // Check if this line is a scene marker
      const isSceneStart = line.length >= 3 &&
                           !this.isMostlyBinary(line) &&
                           this.SCENE_PATTERNS.some(pattern => pattern.test(line));
      
      if (isChapterStart) {
        // Save previous scene if exists
        if (currentSceneContent.length > 0) {
          const scene = this.createSceneFromContent(
            currentSceneContent.join('\n'),
            sceneCount++,
            currentChapter?.id
          );
          scenes.push(scene);
          
          if (currentChapter) {
            currentChapter.scenes = currentChapter.scenes || [];
            currentChapter.scenes.push(scene.id);
          }
        }
        
        // Save previous chapter if exists
        if (currentChapter) {
          chapters.push(currentChapter);
        }
        
        // Clean chapter title: remove markdown, bold, italic markers
        let cleanTitle = line
          .replace(/^#{1,6}\s*/, '')  // Remove markdown headers
          .replace(/\*\*/g, '')        // Remove bold markers
          .replace(/\*/g, '')          // Remove italic markers
          .replace(/__/g, '')          // Remove underline markers
          .replace(/^\d+[\.\):]\s*/, '') // Remove leading numbers with punctuation
          .trim();
        
        // Additional cleaning: remove any remaining non-printable characters
        cleanTitle = cleanTitle.split('').filter(char => {
          const code = char.charCodeAt(0);
          // Keep only printable ASCII (32-126) and common punctuation
          return (code >= 32 && code <= 126) || code === 160; // 160 is non-breaking space
        }).join('');
        
        // Validate title is readable (mostly ASCII printable characters)
        const asciiCount = cleanTitle.split('').filter(char => {
          const code = char.charCodeAt(0);
          return code >= 32 && code <= 126;
        }).length;
        
        // Check for common binary/corruption patterns
        const hasBinaryPattern = /[^\x20-\x7E\s]/.test(cleanTitle) && 
                                 (cleanTitle.match(/[^\x20-\x7E\s]/g) || []).length / cleanTitle.length > 0.3;
        
        if (cleanTitle.length > 0) {
          if (asciiCount / cleanTitle.length < 0.7 || hasBinaryPattern) {
            // Title is mostly non-ASCII or contains binary patterns (corrupted), use default
            console.warn(`Chapter title appears corrupted: "${cleanTitle.substring(0, 50)}...". Using default title.`);
            cleanTitle = `Chapter ${chapters.length + 1}`;
          } else if (cleanTitle.length > 200) {
            // Title is suspiciously long (likely includes content), truncate
            cleanTitle = cleanTitle.substring(0, 100).trim();
          }
        }
        
        cleanTitle = cleanTitle.trim();
        
        // Final safety check: if title is empty or still looks corrupted, use default
        if (!cleanTitle || cleanTitle.length === 0 || isMostlyBinary(cleanTitle)) {
          cleanTitle = `Chapter ${chapters.length + 1}`;
        }
        
        // Create new chapter
        const chapterId = `chapter-${chapters.length + 1}`;
        currentChapter = {
          id: chapterId,
          title: cleanTitle || `Chapter ${chapters.length + 1}`,
          description: `Chapter ${chapters.length + 1}`,
          points: [],
          position: chapters.length + 1,
        };
        
        // Initialize content tracking for this chapter
        chapterContentMap.set(chapterId, []);
        currentSceneContent = [];
      } else if (isSceneStart) {
        // Scene marker detected (e.g., "Scene 1")
        if (currentSceneContent.length > 0) {
          const scene = this.createSceneFromContent(
            currentSceneContent.join('\n'),
            sceneCount++,
            currentChapter?.id
          );
          scenes.push(scene);
          
          if (currentChapter) {
            currentChapter.scenes = currentChapter.scenes || [];
            currentChapter.scenes.push(scene.id);
          }
        }
        currentSceneContent = [];
      } else if (this.isSceneBreak(line)) {
        // Scene break detected
        if (currentSceneContent.length > 0) {
          const scene = this.createSceneFromContent(
            currentSceneContent.join('\n'),
            sceneCount++,
            currentChapter?.id
          );
          scenes.push(scene);
          
          if (currentChapter) {
            currentChapter.scenes = currentChapter.scenes || [];
            currentChapter.scenes.push(scene.id);
          }
        }
        currentSceneContent = [];
      } else {
        // Regular content - use original line (before trimming) to preserve formatting
        const originalLine = lines[i];
        currentSceneContent.push(originalLine);
        // Also track content for current chapter (for default scene creation)
        if (currentChapter) {
          const chapterContent = chapterContentMap.get(currentChapter.id) || [];
          chapterContent.push(originalLine);
          chapterContentMap.set(currentChapter.id, chapterContent);
        }
      }
    }

    // Save last scene and chapter
    if (currentSceneContent.length > 0) {
      const scene = this.createSceneFromContent(
        currentSceneContent.join('\n'),
        sceneCount++,
        currentChapter?.id
      );
      scenes.push(scene);
      
      if (currentChapter) {
        currentChapter.scenes = currentChapter.scenes || [];
        currentChapter.scenes.push(scene.id);
      }
    }
    
    if (currentChapter) {
      chapters.push(currentChapter);
    }

    // Post-processing: Create default scenes for chapters that have text but no scenes
    for (const chapter of chapters) {
      const chapterHasScenes = chapter.scenes && chapter.scenes.length > 0;
      
      if (!chapterHasScenes) {
        // Get tracked content for this chapter
        const chapterContentLines = chapterContentMap.get(chapter.id) || [];
        
        // Filter out empty lines and scene breaks
        const filteredContent = chapterContentLines
          .filter(line => {
            const trimmed = line.trim().replace(/[\u200B-\u200D\uFEFF\u00AD]/g, '');
            // Skip empty lines and scene breaks
            if (trimmed.length === 0) return false;
            if (this.isSceneBreak(trimmed)) return false;
            // Skip chapter markers (shouldn't be in content, but defensive)
            if (this.CHAPTER_PATTERNS.some(p => p.test(trimmed))) return false;
            return true;
          });
        
        const chapterContent = filteredContent.join('\n').trim();
        
        // Only create scene if chapter has actual content (not just whitespace)
        // A chapter is "truly empty" only if it has no non-whitespace content
        const hasContent = chapterContent.length > 0 && chapterContent.replace(/\s/g, '').length > 0;
        
        if (hasContent) {
          const defaultScene = this.createSceneFromContent(
            chapterContent,
            sceneCount++,
            chapter.id
          );
          scenes.push(defaultScene);
          
          chapter.scenes = chapter.scenes || [];
          chapter.scenes.push(defaultScene.id);
        }
        // Note: We don't warn about empty chapters here - warnings are handled elsewhere
        // Only warn if chapter is truly empty (no content at all)
      }
    }

      // If no chapters detected, create one default chapter
      if (chapters.length === 0 && scenes.length > 0) {
        const defaultChapter: Chapter = {
          id: 'chapter-1',
          title: 'Chapter 1',
          description: 'Imported content',
          points: [],
          scenes: scenes.map(s => s.id),
          position: 1,
        };
        chapters.push(defaultChapter);
      }

      return { title, chapters, scenes };
    } catch (error) {
      // Provide clear error messages for common issues
      if (error instanceof Error) {
        // Re-throw our custom errors
        if (error.message.includes('Invalid content') || 
            error.message.includes('corrupted') || 
            error.message.includes('empty')) {
          throw error;
        }
        // Wrap unexpected errors with context
        throw new Error(`Failed to parse story: ${error.message}. The file may be corrupted or in an unsupported format.`);
      }
      throw new Error('Failed to parse story: Unknown error. The file may be corrupted or in an unsupported format.');
    }
  }

  // Detect scene breaks
  private static isSceneBreak(line: string): boolean {
    return line === '' || line === '***' || line === '---' || line === '* * *';
  }

  // Create a scene from content
  private static createSceneFromContent(
    content: string,
    index: number,
    chapterId?: string
  ): Scene {
    const cleanContent = content.trim();
    
    // Validate scene content
    if (!cleanContent || cleanContent.length === 0) {
      throw new Error(`Scene ${index + 1} is empty. Cannot create scene without content.`);
    }
    
    // Detect emotion from content (simple keyword-based)
    const emotion = this.detectEmotion(cleanContent);
    
    // Calculate word count and character count
    const wordCount = computeWordCount(cleanContent);
    const characterCount = cleanContent.length;
    const characterCountNoSpaces = cleanContent.replace(/\s/g, '').length;
    
    return {
      id: `scene-${index}`,
      title: `Scene ${index + 1}`,
      content: cleanContent,
      position: index,
      emotion,
      status: 'draft',
      wordCount,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  // Detect emotion from content (keyword-based)
  private static detectEmotion(content: string): 'joy' | 'sadness' | 'anger' | 'fear' | 'surprise' | 'neutral' {
    const lower = content.toLowerCase();
    
    const emotionKeywords = {
      joy: ['happy', 'laugh', 'smile', 'joy', 'love', 'excited', 'wonderful', 'beautiful'],
      sadness: ['sad', 'cry', 'tear', 'grief', 'sorrow', 'mourn', 'tragic', 'loss'],
      anger: ['angry', 'furious', 'rage', 'hate', 'fight', 'attack', 'mad', 'shout'],
      fear: ['scared', 'afraid', 'terror', 'fear', 'panic', 'horror', 'dread', 'nightmare'],
      surprise: ['shock', 'surprise', 'amaz', 'wow', 'sudden', 'unexpected', 'reveal'],
    };
    
    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
      if (keywords.some(keyword => lower.includes(keyword))) {
        return emotion as any;
      }
    }
    
    return 'neutral';
  }

  // Parse Markdown files
  static parseMarkdown(content: string, title: string = 'Imported Story'): ParsedStory {
    // Markdown is similar to text, but we can handle headers specially
    return this.parseTextFile(content, title);
  }

  // Calculate word count
  static getWordCount(content: string): number {
    return content.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  // Calculate estimated reading time
  static getReadingTime(wordCount: number): number {
    // Average reading speed: 200 words per minute
    return Math.ceil(wordCount / 200);
  }
}
