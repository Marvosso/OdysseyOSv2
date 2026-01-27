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
  // Detect chapter markers in text
  private static CHAPTER_PATTERNS = [
    /^chapter\s+\d+/i,
    /^chapter\s+[ivxlcdm]+/i,
    /^part\s+\d+/i,
    /^part\s+[ivxlcdm]+/i,
    /^\*\*chapter\s+\d+\*\*$/i,
    /^#{1,3}\s*chapter\s+\d+/i,
  ];

  // Parse uploaded text into scenes and chapters
  static parseTextFile(content: string, title: string = 'Imported Story'): ParsedStory {
    const lines = content.split('\n');
    const chapters: Chapter[] = [];
    const scenes: Scene[] = [];
    
    let currentChapter: Chapter | null = null;
    let currentSceneContent: string[] = [];
    let sceneCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check if this line is a chapter marker
      const isChapterStart = this.CHAPTER_PATTERNS.some(pattern => pattern.test(line));
      
      if (isChapterStart) {
        // Save previous scene if exists
        if (currentSceneContent.length > 0) {
          const scene = this.createSceneFromContent(
            currentSceneContent.join('\n'),
            sceneCount++,
            currentChapter?.id
          );
          scenes.push(scene);
        }
        
        // Save previous chapter if exists
        if (currentChapter) {
          chapters.push(currentChapter);
        }
        
        // Create new chapter
        currentChapter = {
          id: `chapter-${chapters.length + 1}`,
          title: line.replace(/[#*]/g, '').trim(),
          description: `Chapter ${chapters.length + 1}`,
          points: [],
          position: chapters.length + 1,
        };
        
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
        // Regular content
        currentSceneContent.push(line);
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
