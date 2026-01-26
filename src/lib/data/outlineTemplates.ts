import type { OutlineTemplate, StoryOutline } from '@/types/outline';

export const outlineTemplates: OutlineTemplate[] = [
  {
    id: 'three-act',
    name: 'Three-Act Structure',
    description: 'Classic storytelling setup: Setup, Confrontation, Resolution',
    chapters: [
      {
        title: 'Act I: Setup',
        description: 'Establish characters, setting, and inciting incident',
        position: 1,
        points: [
          {
            id: 'setup-1',
            title: 'Opening Scene',
            description: 'Introduce protagonist and their ordinary world',
            position: 1,
            estimatedScenes: 2,
            emotionalTone: 'neutral',
          },
          {
            id: 'setup-2',
            title: 'Inciting Incident',
            description: 'Event that disrupts the status quo',
            position: 2,
            estimatedScenes: 1,
            emotionalTone: 'surprise',
          },
          {
            id: 'setup-3',
            title: 'Call to Adventure',
            description: 'Protagonist faces the challenge they must undertake',
            position: 3,
            estimatedScenes: 2,
            emotionalTone: 'tension',
          },
        ],
      },
      {
        title: 'Act II: Confrontation',
        description: 'Rising action, obstacles, and character development',
        position: 2,
        points: [
          {
            id: 'confrontation-1',
            title: 'Rising Action',
            description: 'Protagonist attempts to solve the problem but faces obstacles',
            position: 4,
            estimatedScenes: 4,
            emotionalTone: 'determination',
          },
          {
            id: 'confrontation-2',
            title: 'Midpoint',
            description: 'Major turning point where stakes escalate',
            position: 5,
            estimatedScenes: 2,
            emotionalTone: 'dramatic',
          },
          {
            id: 'confrontation-3',
            title: 'All Is Lost',
            description: 'Low point where protagonist seems to fail',
            position: 6,
            estimatedScenes: 2,
            emotionalTone: 'sadness',
          },
        ],
      },
      {
        title: 'Act III: Resolution',
        description: 'Climax and story conclusion',
        position: 3,
        points: [
          {
            id: 'resolution-1',
            title: 'Climax',
            description: 'Final confrontation and resolution of the main conflict',
            position: 7,
            estimatedScenes: 3,
            emotionalTone: 'intense',
          },
          {
            id: 'resolution-2',
            title: 'Falling Action',
            description: 'Aftermath and consequences of the climax',
            position: 8,
            estimatedScenes: 2,
            emotionalTone: 'relief',
          },
          {
            id: 'resolution-3',
            title: 'Resolution',
            description: 'New status quo and character growth',
            position: 9,
            estimatedScenes: 2,
            emotionalTone: 'joy',
          },
        ],
      },
    ],
  },
  {
    id: 'save-the-cat',
    name: 'Save the Cat',
    description: 'Blake Snyder\'s 15-beat screenplay structure',
    chapters: [
      {
        title: 'Opening Image',
        description: 'Set the tone and establish the visual world',
        position: 1,
        points: [
          {
            id: 'beat-1',
            title: 'Opening Image',
            description: 'A snapshot of the hero\'s life before the adventure',
            position: 1,
            estimatedScenes: 1,
            emotionalTone: 'neutral',
          },
        ],
      },
      {
        title: 'Setup',
        description: 'Introduce characters and establish their status quo',
        position: 2,
        points: [
          {
            id: 'beat-2',
            title: 'Setup',
            description: 'Show hero\'s life, flaws, and world as is',
            position: 2,
            estimatedScenes: 3,
            emotionalTone: 'neutral',
          },
          {
            id: 'beat-3',
            title: 'Catalyst',
            description: 'Life-changing event that launches the story',
            position: 3,
            estimatedScenes: 1,
            emotionalTone: 'surprise',
          },
        ],
      },
    ],
  },
  {
    id: 'hero-journey',
    name: 'Hero\'s Journey',
    description: 'Joseph Campbell\'s mythological structure',
    chapters: [
      {
        title: 'Departure',
        description: 'Hero leaves the ordinary world',
        position: 1,
        points: [
          {
            id: 'journey-1',
            title: 'Ordinary World',
            description: 'Hero\'s normal life before the adventure',
            position: 1,
            estimatedScenes: 2,
            emotionalTone: 'neutral',
          },
          {
            id: 'journey-2',
            title: 'Call to Adventure',
            description: 'Hero is presented with a challenge',
            position: 2,
            estimatedScenes: 1,
            emotionalTone: 'tension',
          },
        ],
      },
    ],
  },
];

export const generateOutlineFromTemplate = (
  template: OutlineTemplate,
  storyId: string,
): StoryOutline => ({
  id: `outline-${Date.now()}`,
  storyId,
  chapters: template.chapters.map(chapter => ({
    ...chapter,
    id: `chapter-${Date.now()}-${Math.random()}`,
  })),
  storyPremise: '',
  theme: '',
  targetAudience: '',
  genre: '',
  estimatedWordCount: 50000,
  createdAt: new Date(),
  updatedAt: new Date(),
});

export const getGenreTemplates = (genre: string): OutlineTemplate[] => {
  if (genre.toLowerCase().includes('fantasy')) {
    return outlineTemplates.filter(t => t.id === 'hero-journey');
  }
  if (genre.toLowerCase().includes('thriller') || genre.toLowerCase().includes('mystery')) {
    return outlineTemplates.filter(t => t.id === 'three-act');
  }
  return outlineTemplates;
};

export const estimateWordCount = (outline: StoryOutline): number => {
  let totalScenes = 0;
  outline.chapters.forEach(chapter => {
    chapter.points.forEach(point => {
      totalScenes += point.estimatedScenes || 3;
    });
  });
  return totalScenes * 500; // Average 500 words per scene
};

export const getOutlineSuggestions = (outline: StoryOutline): string[] => {
  const suggestions: string[] = [];
  
  if (!outline.storyPremise) {
    suggestions.push('Add a compelling story premise');
  }
  
  if (outline.chapters.length < 3) {
    suggestions.push('Consider adding more chapters for better story structure');
  }
  
  const totalPoints = outline.chapters.reduce((sum, ch) => sum + ch.points.length, 0);
  if (totalPoints < 6) {
    suggestions.push('Add more outline points to flesh out your story');
  }
  
  return suggestions;
};
