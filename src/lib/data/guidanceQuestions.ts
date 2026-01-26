import type { GuidanceQuestion } from '@/types/guidance';

export const guidanceQuestions: Record<string, GuidanceQuestion[]> = {
  character: [
    {
      id: 'char-1',
      question: "What does your character want more than anything right now?",
      category: 'character',
      difficulty: 'easy',
      tips: "Think about both surface desires and deeper needs",
      relevantEmotions: []
    },
    {
      id: 'char-2',
      question: "What's one secret your character is keeping?",
      category: 'character',
      difficulty: 'medium',
      tips: "Secrets create tension and depth",
      relevantEmotions: ['fear', 'guilt']
    },
    {
      id: 'char-3',
      question: "What would break your character?",
      category: 'character',
      difficulty: 'medium',
      tips: "Understanding limits reveals character depth",
      relevantEmotions: ['fear', 'sadness']
    },
    {
      id: 'char-4',
      question: "How would this character act if no one was watching?",
      category: 'character',
      difficulty: 'medium',
      tips: "Private moments reveal true nature",
      relevantEmotions: []
    },
    {
      id: 'char-5',
      question: "What's the one thing your character would never do?",
      category: 'character',
      difficulty: 'easy',
      tips: "Setting boundaries defines character",
      relevantEmotions: ['anger', 'fear']
    }
  ],
  plot: [
    {
      id: 'plot-1',
      question: "What's the worst possible thing that could happen to your protagonist right now?",
      category: 'plot',
      difficulty: 'easy',
      tips: "Don't be afraid to make things difficult for your characters",
      relevantEmotions: ['fear', 'anger']
    },
    {
      id: 'plot-2',
      question: "What's at stake if the protagonist fails?",
      category: 'plot',
      difficulty: 'medium',
      tips: "Higher stakes create more tension",
      relevantEmotions: ['fear', 'anger']
    },
    {
      id: 'plot-3',
      question: "What's the turning point of this scene?",
      category: 'plot',
      difficulty: 'medium',
      tips: "Every scene should move the story forward",
      relevantEmotions: []
    },
    {
      id: 'plot-4',
      question: "What unexpected complication could arise?",
      category: 'plot',
      difficulty: 'easy',
      tips: "Complicating situations reveals character",
      relevantEmotions: ['surprise', 'fear']
    },
    {
      id: 'plot-5',
      question: "How does this scene set up the next one?",
      category: 'plot',
      difficulty: 'medium',
      tips: "Create forward momentum",
      relevantEmotions: []
    }
  ],
  dialogue: [
    {
      id: 'dial-1',
      question: "What's NOT being said in this conversation?",
      category: 'dialogue',
      difficulty: 'medium',
      tips: "Subtext is often more powerful than actual words",
      relevantEmotions: ['sadness', 'fear']
    },
    {
      id: 'dial-2',
      question: "What does each character want from this exchange?",
      category: 'dialogue',
      difficulty: 'medium',
      tips: "Everyone in a conversation has an agenda",
      relevantEmotions: []
    },
    {
      id: 'dial-3',
      question: "How would this character speak differently if they were honest?",
      category: 'dialogue',
      difficulty: 'medium',
      tips: "Honesty changes everything",
      relevantEmotions: ['joy', 'anger']
    },
    {
      id: 'dial-4',
      question: "What's the power dynamic between these characters?",
      category: 'dialogue',
      difficulty: 'easy',
      tips: "Power shapes how people speak to each other",
      relevantEmotions: ['anger', 'fear']
    },
    {
      id: 'dial-5',
      question: "What silence would be most meaningful here?",
      category: 'dialogue',
      difficulty: 'hard',
      tips: "Silence can speak volumes",
      relevantEmotions: ['sadness', 'fear']
    }
  ],
  setting: [
    {
      id: 'set-1',
      question: "How does this location affect the mood of the scene?",
      category: 'setting',
      difficulty: 'easy',
      tips: "Settings can be characters too",
      relevantEmotions: []
    },
    {
      id: 'set-2',
      question: "What sensory details would make this place feel real?",
      category: 'setting',
      difficulty: 'medium',
      tips: "Engage all five senses",
      relevantEmotions: []
    },
    {
      id: 'set-3',
      question: "How does the setting reveal character?",
      category: 'setting',
      difficulty: 'medium',
      tips: "Places people choose tell us about them",
      relevantEmotions: []
    },
    {
      id: 'set-4',
      question: "What's the history of this place?",
      category: 'setting',
      difficulty: 'medium',
      tips: "Every space has a story",
      relevantEmotions: []
    },
    {
      id: 'set-5',
      question: "How would changing this setting change the scene?",
      category: 'setting',
      difficulty: 'easy',
      tips: "Setting is a choice - consider alternatives",
      relevantEmotions: []
    }
  ],
  theme: [
    {
      id: 'theme-1',
      question: "What's the central question your story is exploring?",
      category: 'theme',
      difficulty: 'hard',
      tips: "Great stories ask questions they don't fully answer",
      relevantEmotions: []
    },
    {
      id: 'theme-2',
      question: "What's the moral conflict at the heart of this scene?",
      category: 'theme',
      difficulty: 'medium',
      tips: "Every choice reveals values",
      relevantEmotions: ['anger', 'guilt']
    },
    {
      id: 'theme-3',
      question: "What does your protagonist believe about the world?",
      category: 'theme',
      difficulty: 'medium',
      tips: "Worldview drives action",
      relevantEmotions: []
    },
    {
      id: 'theme-4',
      question: "What assumption does your story challenge?",
      category: 'theme',
      difficulty: 'hard',
      tips: "Themes emerge from broken assumptions",
      relevantEmotions: ['surprise']
    },
    {
      id: 'theme-5',
      question: "What would change if the protagonist made the opposite choice?",
      category: 'theme',
      difficulty: 'medium',
      tips: "Themes are tested through decisions",
      relevantEmotions: []
    }
  ]
};

export const getRandomQuestion = (category?: string): GuidanceQuestion | null => {
  const questions = category 
    ? guidanceQuestions[category] 
    : Object.values(guidanceQuestions).flat();
  
  if (questions.length === 0) return null;
  
  const randomIndex = Math.floor(Math.random() * questions.length);
  return questions[randomIndex];
};
