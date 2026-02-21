import type { OutlineTemplate, StoryOutline } from '@/types/outline';

const baseChapter = (
  title: string,
  description: string,
  position: number,
  points: { id: string; title: string; description: string; position: number; estimatedScenes: number; emotionalTone: string }[],
) => ({ title, description, position, points });

export const outlineTemplates: OutlineTemplate[] = [
  {
    id: 'three-act',
    name: 'Three-Act Structure',
    description: 'Classic storytelling setup: Setup, Confrontation, Resolution',
    shortDescription: 'Setup, Confrontation, and Resolution in three clear acts.',
    bestFor: ['Drama', 'Thriller', 'Adventure', 'General'],
    internalPromptModifier:
      'Structure the outline strictly in three acts: Act I Setup (establish world, inciting incident, call to adventure), Act II Confrontation (rising action, midpoint, all is lost), Act III Resolution (climax, falling action, resolution). Emphasize clear turning points between acts.',
    chapters: [
      baseChapter('Act I: Setup', 'Establish characters, setting, and inciting incident', 1, [
        { id: 's1', title: 'Opening Scene', description: 'Introduce protagonist and their ordinary world', position: 1, estimatedScenes: 2, emotionalTone: 'neutral' },
        { id: 's2', title: 'Inciting Incident', description: 'Event that disrupts the status quo', position: 2, estimatedScenes: 1, emotionalTone: 'surprise' },
        { id: 's3', title: 'Call to Adventure', description: 'Protagonist faces the challenge they must undertake', position: 3, estimatedScenes: 2, emotionalTone: 'tension' },
      ]),
      baseChapter('Act II: Confrontation', 'Rising action, obstacles, and character development', 2, [
        { id: 'c1', title: 'Rising Action', description: 'Protagonist attempts to solve the problem but faces obstacles', position: 4, estimatedScenes: 4, emotionalTone: 'determination' },
        { id: 'c2', title: 'Midpoint', description: 'Major turning point where stakes escalate', position: 5, estimatedScenes: 2, emotionalTone: 'dramatic' },
        { id: 'c3', title: 'All Is Lost', description: 'Low point where protagonist seems to fail', position: 6, estimatedScenes: 2, emotionalTone: 'sadness' },
      ]),
      baseChapter('Act III: Resolution', 'Climax and story conclusion', 3, [
        { id: 'r1', title: 'Climax', description: 'Final confrontation and resolution of the main conflict', position: 7, estimatedScenes: 3, emotionalTone: 'intense' },
        { id: 'r2', title: 'Falling Action', description: 'Aftermath and consequences of the climax', position: 8, estimatedScenes: 2, emotionalTone: 'relief' },
        { id: 'r3', title: 'Resolution', description: 'New status quo and character growth', position: 9, estimatedScenes: 2, emotionalTone: 'joy' },
      ]),
    ],
  },
  {
    id: 'hero-journey',
    name: "Hero's Journey",
    description: "Joseph Campbell's mythological structure",
    shortDescription: "The hero leaves the ordinary world, faces trials, and returns transformed.",
    bestFor: ['Fantasy', 'Adventure', 'Epic', 'Sci-Fi'],
    internalPromptModifier:
      'Follow the Hero\'s Journey: Ordinary World, Call to Adventure, Refusal of the Call, Meeting the Mentor, Crossing the Threshold, Tests/Allies/Enemies, Approach the Inmost Cave, Ordeal, Reward, The Road Back, Resurrection, Return with the Elixir. Organize these into chapters with clear beats.',
    chapters: [
      baseChapter('Departure', 'Hero leaves the ordinary world', 1, [
        { id: 'h1', title: 'Ordinary World', description: "Hero's normal life before the adventure", position: 1, estimatedScenes: 2, emotionalTone: 'neutral' },
        { id: 'h2', title: 'Call to Adventure', description: 'Hero is presented with a challenge', position: 2, estimatedScenes: 1, emotionalTone: 'tension' },
        { id: 'h3', title: 'Crossing the Threshold', description: 'Hero commits to the journey', position: 3, estimatedScenes: 2, emotionalTone: 'determination' },
      ]),
      baseChapter('Initiation', 'Trials, allies, and the ordeal', 2, [
        { id: 'h4', title: 'Tests, Allies, Enemies', description: 'Hero faces obstacles and gains companions', position: 4, estimatedScenes: 4, emotionalTone: 'challenge' },
        { id: 'h5', title: 'Approach the Inmost Cave', description: 'Preparation for the central ordeal', position: 5, estimatedScenes: 2, emotionalTone: 'dread' },
        { id: 'h6', title: 'Ordeal & Reward', description: 'Central crisis and the prize', position: 6, estimatedScenes: 3, emotionalTone: 'intense' },
      ]),
      baseChapter('Return', 'The road back and resurrection', 3, [
        { id: 'h7', title: 'The Road Back', description: 'Hero returns toward the ordinary world', position: 7, estimatedScenes: 2, emotionalTone: 'urgency' },
        { id: 'h8', title: 'Resurrection', description: 'Final test and transformation', position: 8, estimatedScenes: 2, emotionalTone: 'triumph' },
        { id: 'h9', title: 'Return with the Elixir', description: 'Hero brings wisdom or gift back', position: 9, estimatedScenes: 2, emotionalTone: 'joy' },
      ]),
    ],
  },
  {
    id: 'save-the-cat',
    name: 'Save the Cat',
    description: "Blake Snyder's 15-beat screenplay structure",
    shortDescription: "Blake Snyder's 15 beats for tight, commercial storytelling.",
    bestFor: ['Screenplay', 'Commercial Fiction', 'Comedy', 'Action'],
    internalPromptModifier:
      'Use Save the Cat beats: Opening Image, Theme Stated, Setup, Catalyst, Debate, Break into Two, B Story, Fun and Games, Midpoint, Bad Guys Close In, All Is Lost, Dark Night of the Soul, Break into Three, Finale, Final Image. Map these to chapters and plot points.',
    chapters: [
      baseChapter('Opening Image & Setup', 'Set the tone and establish the world', 1, [
        { id: 'stc1', title: 'Opening Image', description: "A snapshot of the hero's life before the adventure", position: 1, estimatedScenes: 1, emotionalTone: 'neutral' },
        { id: 'stc2', title: 'Setup', description: "Show hero's life, flaws, and world as is", position: 2, estimatedScenes: 3, emotionalTone: 'neutral' },
        { id: 'stc3', title: 'Catalyst', description: 'Life-changing event that launches the story', position: 3, estimatedScenes: 1, emotionalTone: 'surprise' },
      ]),
      baseChapter('Break into Two & Midpoint', 'Commitment and escalation', 2, [
        { id: 'stc4', title: 'Debate / Break into Two', description: 'Hero commits to the new world', position: 4, estimatedScenes: 2, emotionalTone: 'tension' },
        { id: 'stc5', title: 'Fun and Games', description: 'Promise of the premise—core concept in action', position: 5, estimatedScenes: 4, emotionalTone: 'varied' },
        { id: 'stc6', title: 'Midpoint', description: 'False victory or false defeat; stakes escalate', position: 6, estimatedScenes: 2, emotionalTone: 'dramatic' },
      ]),
      baseChapter('Bad Guys Close In & Finale', 'Collapse and triumph', 3, [
        { id: 'stc7', title: 'Bad Guys Close In', description: 'Pressure mounts; setbacks', position: 7, estimatedScenes: 2, emotionalTone: 'pressure' },
        { id: 'stc8', title: 'All Is Lost / Dark Night', description: 'Low point and soul-searching', position: 8, estimatedScenes: 2, emotionalTone: 'sadness' },
        { id: 'stc9', title: 'Break into Three & Finale', description: 'Final plan and climax', position: 9, estimatedScenes: 3, emotionalTone: 'triumph' },
      ]),
    ],
  },
  {
    id: 'snowflake',
    name: 'Snowflake Method',
    description: 'Randy Ingermanson’s expand-from-core method',
    shortDescription: 'Start with a one-sentence core and expand outward in steps.',
    bestFor: ['Plot-heavy', 'Complex plots', 'Genre fiction', 'Planning'],
    internalPromptModifier:
      'Apply the Snowflake Method: start from a one-sentence story summary, expand to a paragraph, then to character arcs and a multi-page synopsis. Structure the outline as expanding layers: core premise, major plot turns, then chapter-level beats that support the big picture.',
    chapters: [
      baseChapter('Step 1–2: Core & Paragraph', 'One-sentence premise expanded to a paragraph', 1, [
        { id: 'sf1', title: 'One-Sentence Summary', description: 'The single core idea of the story', position: 1, estimatedScenes: 0, emotionalTone: 'neutral' },
        { id: 'sf2', title: 'One-Paragraph Summary', description: 'Three disasters plus the ending', position: 2, estimatedScenes: 0, emotionalTone: 'neutral' },
      ]),
      baseChapter('Step 3–4: Characters & Synopses', 'Character goals and expanded story', 2, [
        { id: 'sf3', title: 'Character Arc Summaries', description: 'Main characters’ goals and growth', position: 3, estimatedScenes: 0, emotionalTone: 'neutral' },
        { id: 'sf4', title: 'Expanded Synopsis', description: 'Multi-page narrative of the full plot', position: 4, estimatedScenes: 0, emotionalTone: 'neutral' },
      ]),
      baseChapter('Step 5+: Scene-Level Beats', 'Chapter and scene breakdown', 3, [
        { id: 'sf5', title: 'Chapter List', description: 'One sentence per chapter', position: 5, estimatedScenes: 2, emotionalTone: 'neutral' },
        { id: 'sf6', title: 'Scene List', description: 'Key scenes that deliver the chapter goals', position: 6, estimatedScenes: 3, emotionalTone: 'varied' },
      ]),
    ],
  },
  {
    id: 'horror-tension',
    name: 'Horror Tension Arc',
    description: 'Build dread, scares, and payoff',
    shortDescription: 'Build dread, deliver scares, and resolve the threat.',
    bestFor: ['Horror', 'Thriller', 'Psychological'],
    internalPromptModifier:
      'Structure the outline for horror: establish normalcy and unease, introduce the threat or mystery, escalate through set pieces and reveals, avoid explaining too early, build to a climactic confrontation or revelation, then resolve (or leave a haunting ambiguity). Mark beats for tension and release.',
    chapters: [
      baseChapter('Establish Normalcy & Unease', 'The world before the horror', 1, [
        { id: 'hr1', title: 'Ordinary World', description: 'Establish baseline and likable characters', position: 1, estimatedScenes: 2, emotionalTone: 'neutral' },
        { id: 'hr2', title: 'Hint of Wrongness', description: 'Subtle signs that something is off', position: 2, estimatedScenes: 1, emotionalTone: 'unease' },
        { id: 'hr3', title: 'First Brush with Threat', description: 'Early encounter or discovery', position: 3, estimatedScenes: 2, emotionalTone: 'fear' },
      ]),
      baseChapter('Escalation & Revelation', 'Rising dread and reveals', 2, [
        { id: 'hr4', title: 'Rules of the Threat', description: 'Audience and characters learn the stakes', position: 4, estimatedScenes: 2, emotionalTone: 'dread' },
        { id: 'hr5', title: 'Set Pieces & Losses', description: 'Major scares or losses', position: 5, estimatedScenes: 4, emotionalTone: 'terror' },
        { id: 'hr6', title: 'All Hope Seems Lost', description: 'Low point; threat feels insurmountable', position: 6, estimatedScenes: 2, emotionalTone: 'despair' },
      ]),
      baseChapter('Climax & Aftermath', 'Confrontation and resolution', 3, [
        { id: 'hr7', title: 'Confrontation / Revelation', description: 'Final encounter or truth revealed', position: 7, estimatedScenes: 3, emotionalTone: 'intense' },
        { id: 'hr8', title: 'Resolution or Haunting', description: 'New normal or lingering threat', position: 8, estimatedScenes: 2, emotionalTone: 'relief' },
      ]),
    ],
  },
  {
    id: 'mystery-investigation',
    name: 'Mystery Investigation',
    description: 'Clues, red herrings, and the reveal',
    shortDescription: 'Clues, suspects, red herrings, and a satisfying solution.',
    bestFor: ['Mystery', 'Crime', 'Detective', 'Cozy Mystery'],
    internalPromptModifier:
      'Structure the outline as a mystery: present the central question or crime, introduce suspects and clues, include red herrings and reversals, escalate stakes or complications, then build to the reveal and resolution. Each chapter should advance the investigation and deepen character or theme.',
    chapters: [
      baseChapter('The Puzzle & Setup', 'Crime or question and key players', 1, [
        { id: 'my1', title: 'The Hook', description: 'Discovery of the crime or central mystery', position: 1, estimatedScenes: 2, emotionalTone: 'intrigue' },
        { id: 'my2', title: 'Introduce Suspects', description: 'Key players and possible motives', position: 2, estimatedScenes: 3, emotionalTone: 'suspense' },
        { id: 'my3', title: 'Initial Clues', description: 'First evidence and wrong conclusions', position: 3, estimatedScenes: 2, emotionalTone: 'curiosity' },
      ]),
      baseChapter('Investigation & Reversals', 'Deepening mystery', 2, [
        { id: 'my4', title: 'Complications', description: 'New clues, red herrings, or danger', position: 4, estimatedScenes: 3, emotionalTone: 'tension' },
        { id: 'my5', title: 'Midpoint Reversal', description: 'Major twist or new direction', position: 5, estimatedScenes: 2, emotionalTone: 'surprise' },
        { id: 'my6', title: 'Rising Stakes', description: 'Personal cost or deadline', position: 6, estimatedScenes: 2, emotionalTone: 'urgency' },
      ]),
      baseChapter('Reveal & Resolution', 'Solution and aftermath', 3, [
        { id: 'my7', title: 'Gathering for the Reveal', description: 'All threads and suspects in place', position: 7, estimatedScenes: 2, emotionalTone: 'anticipation' },
        { id: 'my8', title: 'The Solution', description: 'Reveal of whodunit and why', position: 8, estimatedScenes: 2, emotionalTone: 'satisfaction' },
        { id: 'my9', title: 'Aftermath', description: 'Consequences and new normal', position: 9, estimatedScenes: 1, emotionalTone: 'closure' },
      ]),
    ],
  },
  {
    id: 'romance-arc',
    name: 'Romance Emotional Arc',
    description: 'Meet, conflict, and emotional payoff',
    shortDescription: 'Meet, conflict, and earn the emotional payoff.',
    bestFor: ['Romance', 'Rom-Com', 'Love Story', 'Women\'s Fiction'],
    internalPromptModifier:
      'Structure the outline for romance: meet-cute or inciting connection, build attraction and chemistry, introduce internal and external conflicts that keep them apart, midpoint shift (commitment or crisis), dark moment or breakup, then grovel or growth leading to a earned reunion and HEA or HFN. Emphasize emotional beats and character growth.',
    chapters: [
      baseChapter('Meet & Attraction', 'The setup and spark', 1, [
        { id: 'ro1', title: 'Ordinary World', description: 'Establish both leads and their needs', position: 1, estimatedScenes: 2, emotionalTone: 'neutral' },
        { id: 'ro2', title: 'Meet & Spark', description: 'First meeting and chemistry', position: 2, estimatedScenes: 2, emotionalTone: 'attraction' },
        { id: 'ro3', title: 'Why Not Yet', description: 'Internal or external reason they can\'t be together', position: 3, estimatedScenes: 2, emotionalTone: 'tension' },
      ]),
      baseChapter('Conflict & Midpoint', 'Rising feelings and complications', 2, [
        { id: 'ro4', title: 'Building Intimacy', description: 'Scenes that deepen connection', position: 4, estimatedScenes: 3, emotionalTone: 'hope' },
        { id: 'ro5', title: 'Midpoint Commitment or Crisis', description: 'They get together or a major obstacle', position: 5, estimatedScenes: 2, emotionalTone: 'intense' },
        { id: 'ro6', title: 'Complications', description: 'External or internal conflict escalates', position: 6, estimatedScenes: 3, emotionalTone: 'doubt' },
      ]),
      baseChapter('Dark Moment & HEA', 'Breakup and reunion', 3, [
        { id: 'ro7', title: 'Dark Moment / Breakup', description: 'Low point; they separate or seem lost', position: 7, estimatedScenes: 2, emotionalTone: 'heartbreak' },
        { id: 'ro8', title: 'Growth & Choice', description: 'What each must change or choose', position: 8, estimatedScenes: 2, emotionalTone: 'growth' },
        { id: 'ro9', title: 'Reunion & HEA', description: 'Earned reunion and happy ending', position: 9, estimatedScenes: 2, emotionalTone: 'joy' },
      ]),
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
    id: `chapter-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  })),
  storyPremise: '',
  theme: '',
  targetAudience: '',
  genre: '',
  estimatedWordCount: 50000,
  createdAt: new Date(),
  updatedAt: new Date(),
});

/** Get modifier text for AI system prompt when generating outline from this template */
export function getTemplatePromptModifier(templateId: string): string {
  const template = outlineTemplates.find(t => t.id === templateId);
  return template?.internalPromptModifier ?? '';
}

export const getGenreTemplates = (genre: string): OutlineTemplate[] => {
  const g = genre.toLowerCase();
  if (g.includes('fantasy') || g.includes('epic')) return outlineTemplates.filter(t => t.id === 'hero-journey');
  if (g.includes('horror')) return outlineTemplates.filter(t => t.id === 'horror-tension');
  if (g.includes('mystery') || g.includes('crime')) return outlineTemplates.filter(t => t.id === 'mystery-investigation');
  if (g.includes('romance')) return outlineTemplates.filter(t => t.id === 'romance-arc');
  if (g.includes('thriller')) return outlineTemplates.filter(t => t.id === 'three-act' || t.id === 'horror-tension');
  return outlineTemplates;
};

export const estimateWordCount = (outline: StoryOutline): number => {
  let totalScenes = 0;
  outline.chapters.forEach(chapter => {
    chapter.points.forEach(point => {
      totalScenes += point.estimatedScenes || 3;
    });
  });
  return totalScenes * 500;
};

export const getOutlineSuggestions = (outline: StoryOutline): string[] => {
  const suggestions: string[] = [];
  if (!outline.storyPremise) suggestions.push('Add a compelling story premise');
  if (outline.chapters.length < 3) suggestions.push('Consider adding more chapters for better story structure');
  const totalPoints = outline.chapters.reduce((sum, ch) => sum + ch.points.length, 0);
  if (totalPoints < 6) suggestions.push('Add more outline points to flesh out your story');
  return suggestions;
};
