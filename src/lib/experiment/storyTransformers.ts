/**
 * Story Transformers
 * 
 * Special features for story experimentation:
 * - Character Swap Generator
 * - Genre Shift Transformer
 * - Plot Twist Suggester
 */

import type { Story, Scene, Character } from '@/types/story';

export interface CharacterSwap {
  originalCharacter: string;
  newCharacter: string;
  scenes: string[]; // Scene IDs where swap occurs
}

export interface GenreShift {
  originalGenre: string;
  newGenre: string;
  transformations: Array<{
    sceneId: string;
    originalText: string;
    transformedText: string;
    changes: string[];
  }>;
}

export interface PlotTwist {
  type: 'revelation' | 'betrayal' | 'reversal' | 'redemption' | 'tragedy';
  description: string;
  suggestedScene: string;
  impact: string[];
  confidence: number; // 0-1
}

/**
 * Character Swap Generator
 * Swaps one character for another throughout the story
 */
export class CharacterSwapGenerator {
  /**
   * Generate character swap suggestions
   */
  static generateSwaps(story: Story): CharacterSwap[] {
    const swaps: CharacterSwap[] = [];

    // Find all character pairs that could be swapped
    for (let i = 0; i < story.characters.length; i++) {
      for (let j = i + 1; j < story.characters.length; j++) {
        const char1 = story.characters[i];
        const char2 = story.characters[j];

        // Find scenes where both characters appear
        const scenesWithBoth = story.scenes.filter((scene) => {
          const content = scene.content.toLowerCase();
          return (
            content.includes(char1.name.toLowerCase()) &&
            content.includes(char2.name.toLowerCase())
          );
        });

        if (scenesWithBoth.length > 0) {
          swaps.push({
            originalCharacter: char1.name,
            newCharacter: char2.name,
            scenes: scenesWithBoth.map((s) => s.id),
          });
        }
      }
    }

    return swaps;
  }

  /**
   * Apply character swap to a story
   */
  static applySwap(
    story: Story,
    originalCharacter: string,
    newCharacter: string
  ): Story {
    const updatedScenes = story.scenes.map((scene) => {
      // Replace character name (case-insensitive, whole word)
      const regex = new RegExp(`\\b${originalCharacter}\\b`, 'gi');
      const newContent = scene.content.replace(regex, newCharacter);

      return {
        ...scene,
        content: newContent,
        updatedAt: new Date(),
      };
    });

    // Update character references
    const updatedCharacters = story.characters.map((char) => {
      if (char.name === originalCharacter) {
        return {
          ...char,
          name: newCharacter,
        };
      }
      return char;
    });

    return {
      ...story,
      scenes: updatedScenes,
      characters: updatedCharacters,
      updatedAt: new Date(),
    };
  }
}

/**
 * Genre Shift Transformer
 * Transforms story elements to match a new genre
 */
export class GenreShiftTransformer {
  private static readonly GENRE_RULES: Record<string, {
    vocabulary: string[];
    tone: string;
    pacing: string;
    themes: string[];
  }> = {
    fantasy: {
      vocabulary: ['magic', 'spell', 'dragon', 'kingdom', 'quest', 'ancient', 'mystical'],
      tone: 'epic, mysterious',
      pacing: 'slow, detailed',
      themes: ['good vs evil', 'destiny', 'power'],
    },
    sciFi: {
      vocabulary: ['technology', 'quantum', 'cyber', 'neural', 'synthetic', 'digital', 'virtual'],
      tone: 'futuristic, analytical',
      pacing: 'fast, technical',
      themes: ['technology', 'humanity', 'progress'],
    },
    mystery: {
      vocabulary: ['clue', 'evidence', 'suspect', 'investigation', 'mystery', 'secret', 'hidden'],
      tone: 'suspenseful, questioning',
      pacing: 'deliberate, revealing',
      themes: ['truth', 'justice', 'secrets'],
    },
    romance: {
      vocabulary: ['heart', 'passion', 'desire', 'intimate', 'tender', 'yearning', 'connection'],
      tone: 'emotional, intimate',
      pacing: 'slow, focused',
      themes: ['love', 'relationships', 'connection'],
    },
    horror: {
      vocabulary: ['dark', 'fear', 'dread', 'shadow', 'terrifying', 'ominous', 'sinister'],
      tone: 'dark, foreboding',
      pacing: 'tense, building',
      themes: ['fear', 'survival', 'unknown'],
    },
  };

  /**
   * Transform story to a new genre
   */
  static transform(
    story: Story,
    targetGenre: string
  ): GenreShift {
    const rules = this.GENRE_RULES[targetGenre.toLowerCase()];
    
    if (!rules) {
      throw new Error(`Unknown genre: ${targetGenre}`);
    }

    const transformations: GenreShift['transformations'] = [];

    const updatedScenes = story.scenes.map((scene) => {
      let transformedText = scene.content;
      const changes: string[] = [];

      // Add genre-appropriate vocabulary
      rules.vocabulary.forEach((word) => {
        // Find opportunities to add genre words
        const sentences = transformedText.split(/[.!?]+/);
        const updatedSentences = sentences.map((sentence, index) => {
          if (index % 3 === 0 && sentence.length > 20) {
            // Occasionally add genre word
            const words = sentence.split(/\s+/);
            if (words.length > 5) {
              const insertPos = Math.floor(words.length / 2);
              words.splice(insertPos, 0, word);
              changes.push(`Added "${word}" to scene ${scene.id}`);
              return words.join(' ');
            }
          }
          return sentence;
        });
        transformedText = updatedSentences.join('.');
      });

      // Adjust tone indicators
      if (rules.tone.includes('dark')) {
        transformedText = this.addDarkTone(transformedText, changes);
      } else if (rules.tone.includes('emotional')) {
        transformedText = this.addEmotionalTone(transformedText, changes);
      }

      if (transformedText !== scene.content) {
        transformations.push({
          sceneId: scene.id,
          originalText: scene.content,
          transformedText,
          changes,
        });
      }

      return {
        ...scene,
        content: transformedText,
        updatedAt: new Date(),
      };
    });

    return {
      originalGenre: 'unknown',
      newGenre: targetGenre,
      transformations,
    };
  }

  private static addDarkTone(text: string, changes: string[]): string {
    // Replace positive words with darker alternatives
    const darkReplacements: Record<string, string> = {
      'bright': 'dim',
      'happy': 'grim',
      'light': 'shadow',
      'warm': 'cold',
      'safe': 'dangerous',
    };

    let transformed = text;
    Object.entries(darkReplacements).forEach(([original, replacement]) => {
      const regex = new RegExp(`\\b${original}\\b`, 'gi');
      if (regex.test(transformed)) {
        transformed = transformed.replace(regex, replacement);
        changes.push(`Replaced "${original}" with "${replacement}"`);
      }
    });

    return transformed;
  }

  private static addEmotionalTone(text: string, changes: string[]): string {
    // Add emotional descriptors
    const emotionalWords = ['deeply', 'intensely', 'passionately', 'yearningly'];
    
    const sentences = text.split(/[.!?]+/);
    const updated = sentences.map((sentence, index) => {
      if (index % 2 === 0 && sentence.length > 15) {
        const words = sentence.split(/\s+/);
        if (words.length > 3) {
          const emotionalWord = emotionalWords[Math.floor(Math.random() * emotionalWords.length)];
          words.splice(1, 0, emotionalWord);
          changes.push(`Added emotional word "${emotionalWord}"`);
          return words.join(' ');
        }
      }
      return sentence;
    });

    return updated.join('.');
  }
}

/**
 * Plot Twist Suggester
 * Suggests plot twists based on story content
 */
export class PlotTwistSuggester {
  /**
   * Generate plot twist suggestions
   */
  static suggestTwists(story: Story): PlotTwist[] {
    const twists: PlotTwist[] = [];

    // Analyze story structure
    const midPoint = Math.floor(story.scenes.length / 2);
    const characters = story.characters;
    const scenes = story.scenes;

    // Revelation twist: Character has hidden identity
    if (characters.length >= 2) {
      const mainCharacter = characters[0];
      twists.push({
        type: 'revelation',
        description: `${mainCharacter.name} has been hiding their true identity all along`,
        suggestedScene: scenes[midPoint]?.id || scenes[0]?.id || '',
        impact: [
          'Changes character motivations',
          'Recontextualizes earlier scenes',
          'Adds depth to character relationships',
        ],
        confidence: 0.7,
      });
    }

    // Betrayal twist: Trusted ally betrays
    if (characters.length >= 3) {
      const ally = characters[1];
      twists.push({
        type: 'betrayal',
        description: `${ally.name} has been working against the protagonist all along`,
        suggestedScene: scenes[Math.floor(scenes.length * 0.75)]?.id || scenes[scenes.length - 1]?.id || '',
        impact: [
          'Creates emotional conflict',
          'Forces protagonist to question trust',
          'Raises stakes significantly',
        ],
        confidence: 0.8,
      });
    }

    // Reversal twist: Situation is opposite of what it seems
    if (scenes.length >= 5) {
      twists.push({
        type: 'reversal',
        description: 'The situation is completely opposite of what the protagonist believes',
        suggestedScene: scenes[midPoint]?.id || '',
        impact: [
          'Inverts story expectations',
          'Requires re-reading earlier scenes',
          'Creates dramatic irony',
        ],
        confidence: 0.6,
      });
    }

    // Redemption twist: Villain has redeeming qualities
    if (characters.length >= 2) {
      const antagonist = characters[characters.length - 1];
      twists.push({
        type: 'redemption',
        description: `${antagonist.name} is revealed to have noble intentions`,
        suggestedScene: scenes[Math.floor(scenes.length * 0.8)]?.id || scenes[scenes.length - 1]?.id || '',
        impact: [
          'Adds moral complexity',
          'Challenges protagonist\'s worldview',
          'Creates internal conflict',
        ],
        confidence: 0.75,
      });
    }

    // Tragedy twist: Protagonist's actions cause unintended consequences
    if (scenes.length >= 3) {
      twists.push({
        type: 'tragedy',
        description: 'The protagonist\'s actions have caused the very problem they were trying to solve',
        suggestedScene: scenes[scenes.length - 1]?.id || '',
        impact: [
          'Adds tragic irony',
          'Increases emotional weight',
          'Forces character growth',
        ],
        confidence: 0.65,
      });
    }

    // Sort by confidence
    return twists.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Apply a plot twist to a story
   */
  static applyTwist(
    story: Story,
    twist: PlotTwist
  ): Story {
    const targetScene = story.scenes.find((s) => s.id === twist.suggestedScene);
    
    if (!targetScene) {
      return story;
    }

    // Add twist revelation to scene
    const twistText = `\n\n[PLOT TWIST: ${twist.description}]\n\n`;
    const updatedContent = targetScene.content + twistText;

    const updatedScenes = story.scenes.map((scene) => {
      if (scene.id === targetScene.id) {
        return {
          ...scene,
          content: updatedContent,
          updatedAt: new Date(),
        };
      }
      return scene;
    });

    return {
      ...story,
      scenes: updatedScenes,
      updatedAt: new Date(),
    };
  }
}
