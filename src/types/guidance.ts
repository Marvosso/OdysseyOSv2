export type QuestionCategory = 
  | 'character' 
  | 'plot' 
  | 'setting' 
  | 'dialogue' 
  | 'theme';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface GuidanceQuestion {
  id: string;
  question: string;
  category: QuestionCategory;
  difficulty: DifficultyLevel;
  tips?: string;
  relevantEmotions?: string[];
}

export interface WritingSuggestion {
  id: string;
  text: string;
  questionId: string;
  timestamp: Date;
}
