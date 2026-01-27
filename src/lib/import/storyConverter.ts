/**
 * Story Converter
 * 
 * Converts ImportResult to Story object for OdysseyOS
 */

import type { ImportResult, DetectedChapter, DetectedScene, DetectedCharacter } from './importPipeline';
import type { Story, Scene, Character } from '@/types/story';
import { createStoryId, createSceneId, createCharacterId } from '@/types/models';
import { computeWordCount } from '@/utils/wordCount';

/**
 * Convert ImportResult to Story object
 */
export function convertToStory(importResult: ImportResult): Story {
  const storyId = createStoryId(`story-${Date.now()}`);
  const now = new Date();

  // Convert detected chapters to scenes
  const scenes = convertScenes(importResult);
  
  // Convert detected characters
  const characters = convertCharacters(importResult.detectedCharacters);

  return {
    id: storyId,
    title: importResult.title,
    scenes,
    characters,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Convert detected scenes and chapters to Scene objects
 */
function convertScenes(importResult: ImportResult): Scene[] {
  const scenes: Scene[] = [];
  const lines = importResult.normalizedText.lines;
  
  // Get all scene break points (chapters + explicit scene breaks)
  const breakPoints = [
    ...importResult.detectedChapters.map(c => ({ lineIndex: c.lineIndex, type: 'chapter' as const })),
    ...importResult.detectedScenes
      .filter(s => s.breakType === 'explicit' || s.breakType === 'paragraph')
      .map(s => ({ lineIndex: s.lineIndex, type: 'scene' as const })),
  ].sort((a, b) => a.lineIndex - b.lineIndex);

  // Create scenes from content between break points
  for (let i = 0; i < breakPoints.length; i++) {
    const startIndex = breakPoints[i].lineIndex + (breakPoints[i].type === 'chapter' ? 1 : 1);
    const endIndex = i < breakPoints.length - 1
      ? breakPoints[i + 1].lineIndex
      : lines.length;

    // Extract scene content
    const sceneLines = lines.slice(startIndex, endIndex).filter(line => {
      // Skip explicit scene break markers
      return !/^[*\-=]{3,}$/.test(line.trim());
    });
    
    const content = sceneLines.join('\n').trim();
    
    if (content.length > 0) {
      // Determine scene title
      let title = 'Untitled Scene';
      if (breakPoints[i].type === 'chapter') {
        const chapter = importResult.detectedChapters.find(
          c => c.lineIndex === breakPoints[i].lineIndex
        );
        if (chapter) {
          title = chapter.title;
        }
      } else {
        // Use first sentence or first line as title
        const firstLine = sceneLines[0]?.trim();
        if (firstLine && firstLine.length > 0 && firstLine.length < 100) {
          title = firstLine.substring(0, 80);
        }
      }

      const wordCount = computeWordCount(content);
      scenes.push({
        id: createSceneId(`scene-${scenes.length + 1}`),
        title,
        content,
        position: scenes.length,
        emotion: 'neutral',
        status: 'draft',
        wordCount,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  // If no scenes were created, create one from all content
  if (scenes.length === 0 && importResult.normalizedText.text.trim().length > 0) {
    const wordCount = computeWordCount(importResult.normalizedText.text);
    scenes.push({
      id: createSceneId('scene-1'),
      title: importResult.title || 'Untitled Scene',
      content: importResult.normalizedText.text,
      position: 0,
      emotion: 'neutral',
      status: 'draft',
      wordCount,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  return scenes;
}

/**
 * Convert detected characters to Character objects
 */
function convertCharacters(detectedCharacters: readonly DetectedCharacter[]): Character[] {
  return detectedCharacters
    .filter(char => char.confidence >= 0.5) // Only high confidence characters
    .slice(0, 50) // Limit to top 50 characters
    .map((detected, index) => ({
      id: createCharacterId(`char-${index + 1}`),
      name: detected.name,
      description: `Character detected in story (appears ${detected.occurrences} times)`,
      goals: [],
      flaws: [],
      relationships: [],
    }));
}
