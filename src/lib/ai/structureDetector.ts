import type { DetectedChapter, DetectedScene, StructureDetection } from '@/types/ai';

/**
 * AI-powered structure detection
 * Analyzes text and suggests chapters, acts, and scenes
 */
export class AIStructureDetector {
  /**
   * Analyze text and detect story structure
   */
  static detectStructure(text: string): StructureDetection {
    const lines = text.split('\n');
    const chapters = this.detectChapters(lines);
    const scenes = this.detectScenes(lines, chapters);
    const summary = this.generateSummary(chapters, scenes);
    const suggestions = this.generateSuggestions(chapters, scenes);

    return {
      chapters,
      scenes,
      summary,
      suggestions,
    };
  }

  /**
   * Detect chapter boundaries
   */
  private static detectChapters(lines: string[]): DetectedChapter[] {
    const chapters: DetectedChapter[] = [];
    let currentChapter: DetectedChapter | null = null;
    let lineIndex = 0;

    // Chapter patterns
    const chapterPatterns = [
      /^(chapter\s+\d+)/i,
      /^(chapter\s+[ivxlcdm]+)/i,
      /^(part\s+\d+)/i,
      /^(part\s+[ivxlcdm]+)/i,
      /^#+\s*chapter/i,
      /^#+\s*part/i,
    ];

    for (const line of lines) {
      const isChapterStart = chapterPatterns.some(pattern => pattern.test(line.trim()));

      if (isChapterStart && currentChapter) {
        currentChapter.endLine = lineIndex;
        currentChapter.content = lines.slice(currentChapter.startLine, lineIndex).join('\n');
        chapters.push(currentChapter);
        currentChapter = null;
      }

      if (isChapterStart) {
        // Extract and sanitize title: remove markdown, then filter to ASCII-only
        let title = line.trim().replace(/^#+\s*/, '');
        
        // Remove markdown formatting
        title = title
          .replace(/\*\*/g, '')        // Remove bold markers
          .replace(/\*/g, '')          // Remove italic markers
          .replace(/__/g, '')          // Remove underline markers
          .replace(/^\d+[\.\):]\s*/, '') // Remove leading numbers with punctuation
          .trim();
        
        // Aggressive cleaning: remove ALL non-ASCII characters (keep only printable ASCII)
        title = title.split('').filter((char: string) => {
          const code = char.charCodeAt(0);
          // Keep only printable ASCII (32-126) - no Unicode, no extended characters
          return code >= 32 && code <= 126;
        }).join('');
        
        // Remove any remaining non-ASCII characters using regex as fallback
        title = title.replace(/[^\x20-\x7E]/g, '').trim();
        
        // Validate title is readable and meaningful
        const asciiCount = title.split('').filter((char: string) => {
          const code = char.charCodeAt(0);
          return code >= 32 && code <= 126;
        }).length;
        
        const letterNumberCount = title.split('').filter((char: string) => {
          const code = char.charCodeAt(0);
          return (code >= 48 && code <= 57) || // 0-9
                 (code >= 65 && code <= 90) || // A-Z
                 (code >= 97 && code <= 122) || // a-z
                 code === 32; // space
        }).length;
        
        // If title is empty, too short, mostly non-ASCII, or doesn't contain enough letters/numbers, use default
        if (!title || 
            title.length === 0 || 
            title.length < 2 ||
            (title.length > 0 && asciiCount / title.length < 0.9) ||
            (title.length > 0 && letterNumberCount / title.length < 0.3)) {
          // Title is corrupted or meaningless, use default
          title = `Chapter ${chapters.length + 1}`;
        } else if (title.length > 200) {
          // Title is suspiciously long (likely includes content), truncate
          title = title.substring(0, 100).trim();
        }
        
        currentChapter = {
          id: `chapter-${chapters.length + 1}`,
          title,
          act: 'None',
          startLine: lineIndex,
          endLine: lines.length,
          content: '',
          confidence: 0.9,
        };
      }

      lineIndex++;
    }

    // Don't forget last chapter
    if (currentChapter) {
      currentChapter.endLine = lines.length;
      currentChapter.content = lines.slice(currentChapter.startLine).join('\n');
      chapters.push(currentChapter);
    }

    // Assign acts based on chapter count
    this.assignActs(chapters);

    return chapters;
  }

  /**
   * Assign chapters to acts (3-act structure)
   */
  private static assignActs(chapters: DetectedChapter[]): void {
    if (chapters.length === 0) return;

    const actBreakPoints = {
      act2Start: Math.floor(chapters.length * 0.25),
      act3Start: Math.floor(chapters.length * 0.75),
    };

    chapters.forEach((chapter, index) => {
      if (index < actBreakPoints.act2Start) {
        chapter.act = 'Act I';
      } else if (index < actBreakPoints.act3Start) {
        chapter.act = 'Act II';
      } else {
        chapter.act = 'Act III';
      }
    });
  }

  /**
   * Detect scene boundaries
   */
  private static detectScenes(
    lines: string[],
    chapters: DetectedChapter[]
  ): DetectedScene[] {
    const scenes: DetectedScene[] = [];
    let sceneId = 0;

    // Scene change indicators
    const sceneChangePatterns = [
      /^\s*$/m, // Empty lines
      /^\s*\*\*\*/m, // *** separator
      /^\s*---/m, // --- separator
      /^\s*scene\s+\d+/i,
      /^\s*int\./i,
      /^\s*ext\./i,
      /^\s*cut\s*to:/i,
    ];

    chapters.forEach((chapter) => {
      const chapterLines = lines.slice(chapter.startLine, chapter.endLine);
      let currentScene: DetectedScene | null = null;
      let lineIndex = chapter.startLine;

      for (const line of chapterLines) {
        const isSceneChange = sceneChangePatterns.some(pattern => pattern.test(line));

        if (isSceneChange && currentScene) {
          currentScene.endLine = lineIndex;
          currentScene.content = lines.slice(currentScene.startLine, lineIndex).join('\n');
          scenes.push(currentScene);
          currentScene = null;
        }

        if (isSceneChange || !currentScene) {
          currentScene = {
            id: `scene-${sceneId++}`,
            chapterId: chapter.id,
            title: `Scene ${scenes.filter(s => s.chapterId === chapter.id).length + 1}`,
            startLine: lineIndex,
            endLine: chapter.endLine,
            content: '',
            emotion: this.detectEmotion(line),
            confidence: 0.7,
          };
        }

        lineIndex++;
      }

      // Don't forget last scene
      if (currentScene) {
        currentScene.endLine = lineIndex;
        currentScene.content = lines.slice(currentScene.startLine, lineIndex).join('\n');
        scenes.push(currentScene);
      }
    });

    return scenes;
  }

  /**
   * Detect emotion in text
   */
  private static detectEmotion(text: string): string {
    const emotionPatterns: Record<string, RegExp[]> = {
      joy: [
        /happy|joy|laugh|smile|delight|cheer|excited|thrilled|elated/i,
        /love|heart|warm|affection|tender/i,
      ],
      sadness: [
        /sad|cry|tears|grief|sorrow|depress|miserable|hopeless/i,
        /loss|miss|regret|mourn|weep/i,
      ],
      anger: [
        /angry|furious|rage|mad|irritate|annoy|fume|storm|outburst/i,
        /hate|despise|loathe|detest|resent/i,
      ],
      fear: [
        /fear|scare|terrif|horror|dread|panic|anxious|nervous/i,
        /tremble|shake|shudder|paranoi|apprehens/i,
      ],
      surprise: [
        /surprise|shock|amaz|astonish|stun|flabbergast|bewilder/i,
        /sudden|unexpected|unanticipat/i,
      ],
    };

    let maxMatches = 0;
    let dominantEmotion = 'neutral';

    for (const [emotion, patterns] of Object.entries(emotionPatterns)) {
      const matches = patterns.reduce((sum, pattern) => {
        const matches = text.match(pattern);
        return sum + (matches?.length || 0);
      }, 0);

      if (matches > maxMatches) {
        maxMatches = matches;
        dominantEmotion = emotion;
      }
    }

    return dominantEmotion;
  }

  /**
   * Generate summary of detected structure
   */
  private static generateSummary(
    chapters: DetectedChapter[],
    scenes: DetectedScene[]
  ): string {
    const actCounts = chapters.reduce((acc, ch) => {
      acc[ch.act] = (acc[ch.act] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return `Detected ${chapters.length} chapters and ${scenes.length} scenes. ` +
      `Structure: Act I (${actCounts['Act I'] || 0} chapters), ` +
      `Act II (${actCounts['Act II'] || 0} chapters), ` +
      `Act III (${actCounts['Act III'] || 0} chapters).`;
  }

  /**
   * Generate suggestions for improvement
   */
  private static generateSuggestions(
    chapters: DetectedChapter[],
    scenes: DetectedScene[]
  ): string[] {
    const suggestions: string[] = [];

    // Check if story has clear 3-act structure
    if (chapters.length < 3) {
      suggestions.push('Consider adding more chapters to establish a clear 3-act structure');
    }

    // Check scene distribution
    const avgScenesPerChapter = scenes.length / (chapters.length || 1);
    if (avgScenesPerChapter < 2) {
      suggestions.push('Some chapters may benefit from more scenes for better pacing');
    }

    // Check emotion variety
    const emotions = new Set(scenes.map(s => s.emotion));
    if (emotions.size < 3) {
      suggestions.push('Consider adding more emotional variety to your scenes');
    }

    // Check scene lengths
    const longScenes = scenes.filter(s => s.content.split('\n').length > 50);
    if (longScenes.length > 0) {
      suggestions.push('Some scenes are quite long - consider breaking them up for better pacing');
    }

    return suggestions;
  }
}
