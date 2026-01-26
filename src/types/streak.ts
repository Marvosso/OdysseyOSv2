export interface WritingStreak {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastWriteDate: Date;
  totalDays: number;
  dailyGoals: DailyGoal[];
  milestones: Milestone[];
  achievements: Achievement[];
}

export interface DailyGoal {
  date: string;
  wordTarget: number;
  wordsWritten: number;
  timeSpent: number;
  completed: boolean;
  notes?: string;
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  target: number;
  achieved: boolean;
  achievedAt?: Date;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface StreakStatistics {
  averageWordsPerDay: number;
  bestDay: { date: string; words: number };
  averageSessionLength: number;
  mostProductiveHour: number;
  consistencyScore: number;
}
