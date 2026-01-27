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
  private static CHAPTER_PATTERNS = [
    // Plain text formats
    /^chapter\s+\d+/i,
    /^chapter\s+[ivxlcdm]+/i,
    /^part\s+\d+/i,
    /^part\s+[ivxlcdm]+/i,
    /^act\s+\d+/i,
    /^act\s+[ivxlcdm]+/i,
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
    // Word/PDF export formats (may have extra whitespace or hidden chars)
    /^chapter\s+\d+[\.\):]\s*/i,
    /^part\s+\d+[\.\):]\s*/i,
    /^act\s+\d+[\.\):]\s*/i,
  ];

  // Scene detection patterns
  private static SCENE_PATTERNS = [
    /^scene\s+\d+/i,
    /^scene\s+[ivxlcdm]+/i,
    /^#{4,6}\s*scene\s+\d+/i,
  ];

  /**
   * Normalize text before parsing:
   * - Strip non-printable/binary characters
   * - Normalize line endings (\r\n → \n)
   * - Remove hidden characters from Word/PDF exports
   */
  private static normalizeTextForParsing(text: string): string {
    // Normalize line endings first
    let normalized = text
      .replace(/\r\n/g, '\n')  // Windows line endings
      .replace(/\r/g, '\n');    // Old Mac line endings
    
    // Remove null bytes and other problematic control characters
    // Keep: printable chars (32-126), tab (9), newline (10), carriage return (13)
    normalized = normalized.split('').filter(char => {
      const code = char.charCodeAt(0);
      return code === 0 || (code >= 32 && code <= 126) || code === 9 || code === 10 || code === 13;
    }).join('');
    
    // Remove null bytes explicitly (defensive)
    normalized = normalized.replace(/\0/g, '').replace(/\u0000/g, '').replace(/\x00/g, '');
    
    // Remove other non-printable characters except whitespace
    normalized = normalized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');
    
    // Normalize multiple consecutive newlines (max 2)
    normalized = normalized.replace(/\n{3,}/g, '\n\n');
    
    return normalized;
  }

  // Parse uploaded text into scenes and chapters
  static parseTextFile(content: string, title: string = 'Imported Story'): ParsedStory {
    // Normalize text before parsing
    const normalizedContent = this.normalizeTextForParsing(content);
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
      // Remove zero-width characters and other hidden Unicode
      line = line.replace(/[\u200B-\u200D\uFEFF\u00AD]/g, '');
      line = line.trim();
      
      // Check if this line is a chapter marker (test against cleaned line)
      const isChapterStart = this.CHAPTER_PATTERNS.some(pattern => pattern.test(line));
      
      // Check if this line is a scene marker
      const isSceneStart = this.SCENE_PATTERNS.some(pattern => pattern.test(line));
      
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
        const cleanTitle = line
          .replace(/^#{1,6}\s*/, '')  // Remove markdown headers
          .replace(/\*\*/g, '')        // Remove bold markers
          .replace(/\*/g, '')          // Remove italic markers
          .replace(/__/g, '')          // Remove underline markers
          .replace(/^\d+[\.\):]\s*/, '') // Remove leading numbers with punctuation
          .trim();
        
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
    
    // Detect emotion from content (simple keyword-based)
    const emotion = this.detectEmotion(cleanContent);
    
    const wordCount = computeWordCount(cleanContent);
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
