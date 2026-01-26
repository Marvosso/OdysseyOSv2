import type { Scene, Character } from '@/types/story';
import type { Archetype, StoryDNA } from '@/types/analysis';

export const storyArchetypes: Archetype[] = [
  {
    name: 'Epic Adventure',
    description: 'Heroic journey with high stakes and dramatic scope',
    dnaSignature: {
      emotionalPattern: {
        dominantEmotion: 'determination',
        emotionalRange: 8,
        arcShape: 'mountain',
      },
      structuralPattern: {
        pacing: 'fast',
        complexity: 7,
        actBalance: { act1: 25, act2: 50, act3: 25 },
      },
      characterDynamics: {
        protagonistFocus: 70,
        ensembleBalance: 60,
        relationshipComplexity: 6,
      },
      genreMatch: {
        genre: 'Fantasy',
        confidence: 85,
        similarWorks: ['Lord of the Rings', 'Star Wars', 'The Odyssey'],
      },
    },
    famousExamples: ['Lord of the Rings', 'Star Wars', 'The Odyssey', 'Beowulf'],
  },
  {
    name: 'Psychological Thriller',
    description: 'Intense focus on character psychology and suspense',
    dnaSignature: {
      emotionalPattern: {
        dominantEmotion: 'tension',
        emotionalRange: 9,
        arcShape: 'rising',
      },
      structuralPattern: {
        pacing: 'medium',
        complexity: 8,
        actBalance: { act1: 30, act2: 40, act3: 30 },
      },
      characterDynamics: {
        protagonistFocus: 85,
        ensembleBalance: 30,
        relationshipComplexity: 7,
      },
    },
    famousExamples: ['The Silence of the Lambs', 'Shutter Island', 'Gone Girl'],
  },
  {
    name: 'Romance Novel',
    description: 'Focus on relationship development and emotional journey',
    dnaSignature: {
      emotionalPattern: {
        dominantEmotion: 'love',
        emotionalRange: 7,
        arcShape: 'wave',
      },
      structuralPattern: {
        pacing: 'medium',
        complexity: 5,
        actBalance: { act1: 25, act2: 50, act3: 25 },
      },
      characterDynamics: {
        protagonistFocus: 50,
        ensembleBalance: 40,
        relationshipComplexity: 9,
      },
      genreMatch: {
        genre: 'Romance',
        confidence: 90,
        similarWorks: ['Pride and Prejudice', 'The Notebook', 'Outlander'],
      },
    },
    famousExamples: ['Pride and Prejudice', 'Jane Eyre', 'The Notebook'],
  },
  {
    name: 'Mystery/Whodunit',
    description: 'Puzzle-focused narrative with clues and revelation',
    dnaSignature: {
      emotionalPattern: {
        dominantEmotion: 'curiosity',
        emotionalRange: 6,
        arcShape: 'valley',
      },
      structuralPattern: {
        pacing: 'medium',
        complexity: 9,
        actBalance: { act1: 35, act2: 40, act3: 25 },
      },
      characterDynamics: {
        protagonistFocus: 75,
        ensembleBalance: 50,
        relationshipComplexity: 5,
      },
    },
    famousExamples: ['Sherlock Holmes', 'And Then There Were None', 'The Girl with the Dragon Tattoo'],
  },
  {
    name: 'Literary Drama',
    description: 'Character-driven story with focus on internal conflict',
    dnaSignature: {
      emotionalPattern: {
        dominantEmotion: 'melancholy',
        emotionalRange: 5,
        arcShape: 'valley',
      },
      structuralPattern: {
        pacing: 'slow',
        complexity: 6,
        actBalance: { act1: 30, act2: 40, act3: 30 },
      },
      characterDynamics: {
        protagonistFocus: 80,
        ensembleBalance: 35,
        relationshipComplexity: 8,
      },
    },
    famousExamples: ['The Great Gatsby', 'To Kill a Mockingbird', 'Beloved'],
  },
];

export const analyzeStoryDNA = (
  scenes: Scene[],
  characters: Character[],
): StoryDNA => {
  const emotions = scenes.map(s => s.emotion || 'neutral');
  const emotionCounts = emotions.reduce((acc, e) => {
    acc[e] = (acc[e] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const emotionEntries: [string, number][] = Object.entries(emotionCounts);
  const dominantEmotion = emotionEntries.length > 0
    ? emotionEntries.reduce((prev, curr) => (curr[1] > prev[1] ? curr : prev))[0]
    : 'neutral';

  const emotionalRange = new Set(emotions).size / 6 * 10;

  const arcShape = emotions.length > 2
    ? emotions[0] === emotions[emotions.length - 1] ? 'valley'
    : emotions[emotions.length - 1] === 'joy' ? 'rising'
    : 'falling'
    : 'rising';

  const wordCount = scenes.reduce((sum, s) => sum + (s.content?.split(' ')?.length || 0), 0);
  const avgWordsPerScene = wordCount / scenes.length || 0;

  const pacing = avgWordsPerScene < 300 ? 'fast' : avgWordsPerScene > 800 ? 'slow' : 'medium';

  return {
    id: `dna-${Date.now()}`,
    emotionalPattern: {
      dominantEmotion,
      emotionalRange: Math.round(emotionalRange),
      arcShape,
    },
    structuralPattern: {
      pacing,
      complexity: Math.round((scenes.length * 2) / 3),
      actBalance: {
        act1: Math.round(scenes.length * 0.3),
        act2: Math.round(scenes.length * 0.5),
        act3: Math.round(scenes.length * 0.2),
      },
    },
    characterDynamics: {
      protagonistFocus: Math.round((scenes.length * 7) / 10),
      ensembleBalance: Math.round(characters.length * 10),
      relationshipComplexity: Math.min(characters.length * 2, 9),
    },
    thematicElements: {
      primaryThemes: [],
      themeConsistency: 5,
      subtextDepth: 5,
    },
    genreMatch: {
      genre: 'General',
      confidence: 50,
      similarWorks: [],
    },
  };
};
