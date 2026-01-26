export interface CoachingGoal {
  id: string;
  name: string;
  description: string;
  category: 'dialogue' | 'character' | 'structure' | 'style';
  duration: number;
  exercises: string[];
}

export const coachingGoals: CoachingGoal[] = [
  {
    id: 'dialogue-natural',
    name: 'Natural Dialogue',
    description: 'Practice writing conversations that sound authentic and reveal character',
    category: 'dialogue',
    duration: 10,
    exercises: [
      'Write a 2-person conversation without dialogue tags',
      'Write a scene where characters talk around a sensitive topic',
      'Create dialogue where each character has a distinct voice',
    ],
  },
  {
    id: 'character-depth',
    name: 'Character Depth',
    description: 'Explore your protagonist\'s motivations, flaws, and hidden desires',
    category: 'character',
    duration: 15,
    exercises: [
      'Write a monologue revealing your character\'s biggest fear',
      'Describe a childhood memory that shaped your protagonist',
      'Write a scene where your character makes a difficult choice',
    ],
  },
  {
    id: 'scene-tension',
    name: 'Build Tension',
    description: 'Learn to create and release dramatic tension effectively',
    category: 'structure',
    duration: 12,
    exercises: [
      'Write a scene where tension builds through subtext',
      'Create a confrontation scene with escalating stakes',
      'Practice art of delayed reveals',
    ],
  },
  {
    id: 'sensory-writing',
    name: 'Sensory Details',
    description: 'Enhance your writing with vivid sensory descriptions',
    category: 'style',
    duration: 8,
    exercises: [
      'Describe a setting using all five senses',
      'Write a scene focused entirely on texture and touch',
      'Practice showing, not telling with character emotions',
    ],
  },
];
