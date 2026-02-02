/**
 * Analysis Export Generators
 * 
 * Generates visualizations and analysis reports
 */

import type { Story, Character, Scene } from '@/types/story';

export interface CharacterRelationshipChart {
  nodes: Array<{
    id: string;
    name: string;
    group: number;
  }>;
  links: Array<{
    source: string;
    target: string;
    value: number;
    relationship: string;
  }>;
}

export interface TimelineVisualization {
  events: Array<{
    sceneId: string;
    title: string;
    timestamp: number;
    characters: string[];
    location?: string;
    emotion: string;
  }>;
  totalDuration: string;
}

export interface StoryBeatBreakdown {
  beats: Array<{
    sceneId: string;
    sceneTitle: string;
    beatType: string;
    description: string;
    characters: string[];
    wordCount: number;
  }>;
  summary: {
    totalBeats: number;
    averageWordsPerBeat: number;
    pacing: 'fast' | 'medium' | 'slow';
  };
}

/**
 * Generate character relationship chart data
 */
export function generateCharacterRelationshipChart(story: Story): CharacterRelationshipChart {
  const nodes = story.characters.map((char, index) => ({
    id: char.id,
    name: char.name,
    group: index % 5, // Color groups
  }));

  const links: CharacterRelationshipChart['links'] = [];

  // Analyze relationships from character data
  story.characters.forEach((char) => {
    char.relationships.forEach((rel) => {
      const targetChar = story.characters.find((c) => c.id === rel.characterId);
      if (targetChar) {
        // Avoid duplicate links
        if (!links.find((l) => 
          (l.source === char.id && l.target === targetChar.id) ||
          (l.source === targetChar.id && l.target === char.id)
        )) {
          links.push({
            source: char.id,
            target: targetChar.id,
            value: rel.intensity,
            relationship: rel.relationship,
          });
        }
      }
    });
  });

  // Also analyze scene co-occurrence
  story.scenes.forEach((scene) => {
    const sceneChars = story.characters.filter((char) =>
      scene.content.toLowerCase().includes(char.name.toLowerCase())
    );

    sceneChars.forEach((char1, i) => {
      sceneChars.slice(i + 1).forEach((char2) => {
        const existingLink = links.find((l) =>
          (l.source === char1.id && l.target === char2.id) ||
          (l.source === char2.id && l.target === char1.id)
        );

        if (existingLink) {
          existingLink.value = Math.min(10, existingLink.value + 1);
        } else {
          links.push({
            source: char1.id,
            target: char2.id,
            value: 3,
            relationship: 'co-occurrence',
          });
        }
      });
    });
  });

  return { nodes, links };
}

/**
 * Generate timeline visualization
 */
export function generateTimelineVisualization(story: Story): TimelineVisualization {
  const events = story.scenes.map((scene, index) => {
    // Extract characters mentioned in scene
    const characters = story.characters
      .filter((char) => scene.content.toLowerCase().includes(char.name.toLowerCase()))
      .map((char) => char.name);

    return {
      sceneId: scene.id,
      title: scene.title,
      timestamp: index, // Scene position as timestamp
      characters,
      location: scene.location,
      emotion: scene.emotion,
    };
  });

  return {
    events,
    totalDuration: `${story.scenes.length} scenes`,
  };
}

/**
 * Generate story beat breakdown
 */
export function generateStoryBeatBreakdown(story: Story): StoryBeatBreakdown {
  const beats: StoryBeatBreakdown['beats'] = [];

  story.scenes.forEach((scene) => {
    const wordCount = scene.content.split(/\s+/).filter((w) => w.length > 0).length;
    const characters = story.characters
      .filter((char) => scene.content.toLowerCase().includes(char.name.toLowerCase()))
      .map((char) => char.name);

    // Determine beat type based on scene characteristics
    let beatType = 'development';
    if (scene.emotion === 'fear' || scene.emotion === 'anger') {
      beatType = 'conflict';
    } else if (scene.emotion === 'joy' || scene.emotion === 'surprise') {
      beatType = 'revelation';
    } else if (wordCount < 200) {
      beatType = 'transition';
    }

    beats.push({
      sceneId: scene.id,
      sceneTitle: scene.title,
      beatType,
      description: scene.content.substring(0, 200) + (scene.content.length > 200 ? '...' : ''),
      characters,
      wordCount,
    });
  });

  const totalWords = beats.reduce((sum, beat) => sum + beat.wordCount, 0);
  const averageWordsPerBeat = Math.round(totalWords / beats.length);
  
  // Determine pacing
  let pacing: 'fast' | 'medium' | 'slow' = 'medium';
  if (averageWordsPerBeat < 300) {
    pacing = 'fast';
  } else if (averageWordsPerBeat > 800) {
    pacing = 'slow';
  }

  return {
    beats,
    summary: {
      totalBeats: beats.length,
      averageWordsPerBeat,
      pacing,
    },
  };
}
