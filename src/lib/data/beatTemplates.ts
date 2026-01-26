import type { BeatTemplate } from '@/types/beat';

export const beatTemplates: Record<string, BeatTemplate> = {
  'three-act': {
    name: 'Three-Act Structure',
    description: 'Classic storytelling structure with setup, confrontation, and resolution',
    structure: {
      acts: [
        {
          name: 'Act I: Setup',
          beats: [
            { type: 'setup', description: 'Introduce world, characters, status quo', duration: 10 },
            { type: 'inciting-incident', description: 'Disruptive event that kicks off the journey', duration: 5 },
            { type: 'rising-action', description: 'Hero accepts the call and leaves comfort zone', duration: 15 },
          ],
        },
        {
          name: 'Act II: Confrontation',
          beats: [
            { type: 'midpoint', description: 'Major turning point, stakes raised', duration: 10 },
            { type: 'twist', description: 'Unexpected development or revelation', duration: 5 },
            { type: 'rising-action', description: 'Complications mount, hero faces challenges', duration: 25 },
            { type: 'climax', description: 'Peak tension, final confrontation', duration: 20 },
          ],
        },
        {
          name: 'Act III: Resolution',
          beats: [
            { type: 'resolution', description: 'New normal, hero transformed', duration: 10 },
          ],
        },
      ],
    },
  },
  'save-the-cat': {
    name: 'Save the Cat',
    description: 'Blake Snyder\'s 15-beat structure for screenwriting',
    structure: {
      acts: [
        {
          name: 'Opening',
          beats: [
            { type: 'setup', description: 'Opening image, establish world', duration: 5 },
            { type: 'theme', description: 'Theme stated, hero\'s flaw revealed', duration: 5 },
            { type: 'setup', description: 'Set-up, hero\'s life before', duration: 10 },
            { type: 'inciting-incident', description: 'Catalyst, something happens', duration: 5 },
            { type: 'rising-action', description: 'Debate, hero resists the call', duration: 5 },
            { type: 'rising-action', description: 'Break into two, hero accepts', duration: 5 },
          ],
        },
        {
          name: 'Middle',
          beats: [
            { type: 'setup', description: 'B Story, subplot begins', duration: 5 },
            { type: 'rising-action', description: 'Fun and games, hero explores new world', duration: 20 },
            { type: 'midpoint', description: 'Midpoint, stakes raised', duration: 5 },
            { type: 'twist', description: 'Bad guys close in', duration: 5 },
            { type: 'rising-action', description: 'All is lost, hero hits bottom', duration: 10 },
            { type: 'rising-action', description: 'Dark night of the soul, despair', duration: 5 },
          ],
        },
        {
          name: 'End',
          beats: [
            { type: 'twist', description: 'Break into three, hero finds solution', duration: 5 },
            { type: 'climax', description: 'Finale, final battle', duration: 15 },
            { type: 'resolution', description: 'Final image, hero transformed', duration: 5 },
          ],
        },
      ],
    },
  },
  'hero-journey': {
    name: 'Hero\'s Journey',
    description: 'Joseph Campbell\'s monomyth structure',
    structure: {
      acts: [
        {
          name: 'Departure',
          beats: [
            { type: 'setup', description: 'Ordinary world, hero at home', duration: 10 },
            { type: 'inciting-incident', description: 'Call to adventure', duration: 5 },
            { type: 'rising-action', description: 'Refusal of the call', duration: 5 },
            { type: 'character-moment', description: 'Meeting the mentor', duration: 5 },
            { type: 'rising-action', description: 'Crossing the threshold', duration: 5 },
          ],
        },
        {
          name: 'Initiation',
          beats: [
            { type: 'world-building', description: 'Tests, allies, enemies', duration: 15 },
            { type: 'midpoint', description: 'Approach to innermost cave', duration: 10 },
            { type: 'climax', description: 'The ordeal, supreme test', duration: 20 },
            { type: 'resolution', description: 'Reward, seizing the sword', duration: 10 },
          ],
        },
        {
          name: 'Return',
          beats: [
            { type: 'rising-action', description: 'The road back, return journey', duration: 10 },
            { type: 'twist', description: 'Resurrection, final test', duration: 10 },
            { type: 'resolution', description: 'Return with elixir', duration: 10 },
          ],
        },
      ],
    },
  },
};

export const beatColors: Record<string, string> = {
  'setup': 'bg-blue-500',
  'inciting-incident': 'bg-red-500',
  'rising-action': 'bg-yellow-500',
  'midpoint': 'bg-purple-500',
  'twist': 'bg-pink-500',
  'climax': 'bg-orange-500',
  'resolution': 'bg-green-500',
  'character-moment': 'bg-indigo-500',
  'theme': 'bg-cyan-500',
  'world-building': 'bg-teal-500',
};

export const beatDescriptions: Record<string, string> = {
  'setup': 'Establish the world, characters, and status quo',
  'inciting-incident': 'The event that disrupts the ordinary world',
  'rising-action': 'Build tension, develop conflicts, advance the story',
  'midpoint': 'Major turning point that raises the stakes',
  'twist': 'Unexpected development that changes direction',
  'climax': 'Peak of tension and conflict resolution',
  'resolution': 'The aftermath and new normal',
  'character-moment': 'Key character development or revelation',
  'theme': 'Reinforces or explores the story\'s themes',
  'world-building': 'Expands the setting or rules of the world',
};
