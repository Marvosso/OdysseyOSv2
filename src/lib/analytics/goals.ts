/**
 * Writing Goals and Projections
 * 
 * Manages writing goals, projections, and benchmarks
 */

import type { Story } from '@/types/story';
import { getCurrentStoryStats, getWritingSessions, calculateDailyStats } from './writingMetrics';

export interface WritingGoal {
  id: string;
  type: 'daily' | 'weekly' | 'monthly' | 'total';
  target: number; // word count target
  current: number;
  deadline?: string; // ISO date string
  createdAt: string;
}

export interface Projection {
  finishDate: string;
  daysRemaining: number;
  dailyWordsNeeded: number;
  confidence: 'high' | 'medium' | 'low';
}

export interface GenreBenchmark {
  genre: string;
  averageLength: number; // words
  averageChapters: number;
  averageWordsPerChapter: number;
}

const GENRE_BENCHMARKS: GenreBenchmark[] = [
  { genre: 'Novel', averageLength: 80000, averageChapters: 20, averageWordsPerChapter: 4000 },
  { genre: 'Novella', averageLength: 40000, averageChapters: 10, averageWordsPerChapter: 4000 },
  { genre: 'Short Story', averageLength: 7500, averageChapters: 1, averageWordsPerChapter: 7500 },
  { genre: 'Flash Fiction', averageLength: 1000, averageChapters: 1, averageWordsPerChapter: 1000 },
  { genre: 'Epic Fantasy', averageLength: 120000, averageChapters: 30, averageWordsPerChapter: 4000 },
  { genre: 'Romance', averageLength: 70000, averageChapters: 20, averageWordsPerChapter: 3500 },
  { genre: 'Mystery/Thriller', averageLength: 75000, averageChapters: 25, averageWordsPerChapter: 3000 },
  { genre: 'Science Fiction', averageLength: 90000, averageChapters: 22, averageWordsPerChapter: 4100 },
  { genre: 'Young Adult', averageLength: 60000, averageChapters: 20, averageWordsPerChapter: 3000 },
  { genre: 'Middle Grade', averageLength: 40000, averageChapters: 15, averageWordsPerChapter: 2700 },
];

/**
 * Save a writing goal
 */
export function saveGoal(goal: WritingGoal): void {
  if (typeof window === 'undefined') return;

  const goals = getGoals();
  const existingIndex = goals.findIndex((g) => g.id === goal.id);

  if (existingIndex >= 0) {
    goals[existingIndex] = goal;
  } else {
    goals.push(goal);
  }

  localStorage.setItem('odysseyos-writing-goals', JSON.stringify(goals));
}

/**
 * Get all writing goals
 */
export function getGoals(): WritingGoal[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem('odysseyos-writing-goals');
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

/**
 * Delete a goal
 */
export function deleteGoal(goalId: string): void {
  if (typeof window === 'undefined') return;

  const goals = getGoals().filter((g) => g.id !== goalId);
  localStorage.setItem('odysseyos-writing-goals', JSON.stringify(goals));
}

/**
 * Update goal progress
 */
export function updateGoalProgress(goalId: string, current: number): void {
  const goals = getGoals();
  const goal = goals.find((g) => g.id === goalId);
  if (goal) {
    goal.current = current;
    saveGoal(goal);
  }
}

/**
 * Calculate finish date projection
 */
export function calculateFinishDateProjection(
  targetWords: number,
  currentWords: number,
  averageDailyWords?: number
): Projection {
  const wordsRemaining = Math.max(0, targetWords - currentWords);

  // Calculate average daily words from recent sessions if not provided
  if (!averageDailyWords) {
    const sessions = getWritingSessions();
    const dailyStats = calculateDailyStats(sessions);
    const recentDays = dailyStats.slice(-30); // Last 30 days

    if (recentDays.length > 0) {
      const totalRecentWords = recentDays.reduce((sum, day) => sum + day.words, 0);
      const activeDays = recentDays.filter((day) => day.words > 0).length;
      averageDailyWords = activeDays > 0 ? totalRecentWords / activeDays : 0;
    } else {
      averageDailyWords = 0;
    }
  }

  if (averageDailyWords <= 0) {
    // No writing history, use default estimate
    averageDailyWords = 500; // Conservative estimate
  }

  const daysRemaining = Math.ceil(wordsRemaining / averageDailyWords);
  const finishDate = new Date();
  finishDate.setDate(finishDate.getDate() + daysRemaining);

  // Calculate confidence based on consistency
  const sessions = getWritingSessions();
  const dailyStats = calculateDailyStats(sessions);
  const recentDays = dailyStats.slice(-14); // Last 2 weeks
  const activeDays = recentDays.filter((day) => day.words > 0).length;
  const consistency = recentDays.length > 0 ? activeDays / recentDays.length : 0;

  let confidence: 'high' | 'medium' | 'low' = 'low';
  if (consistency >= 0.7 && averageDailyWords >= 500) {
    confidence = 'high';
  } else if (consistency >= 0.4 && averageDailyWords >= 300) {
    confidence = 'medium';
  }

  return {
    finishDate: finishDate.toISOString().split('T')[0],
    daysRemaining,
    dailyWordsNeeded: Math.ceil(wordsRemaining / Math.max(1, daysRemaining)),
    confidence,
  };
}

/**
 * Get genre benchmarks
 */
export function getGenreBenchmarks(): GenreBenchmark[] {
  return GENRE_BENCHMARKS;
}

/**
 * Compare current story to genre benchmark
 */
export function compareToGenreBenchmark(genre: string): {
  genre: string;
  benchmark: GenreBenchmark | null;
  current: { words: number; scenes: number };
  progress: {
    words: number; // percentage
    scenes: number; // percentage
  };
  status: 'ahead' | 'on-track' | 'behind';
} {
  const benchmark = GENRE_BENCHMARKS.find((b) => b.genre.toLowerCase() === genre.toLowerCase());
  const stats = getCurrentStoryStats();

  if (!benchmark) {
    return {
      genre,
      benchmark: null,
      current: { words: stats.totalWords, scenes: stats.totalScenes },
      progress: { words: 0, scenes: 0 },
      status: 'on-track',
    };
  }

  const wordProgress = (stats.totalWords / benchmark.averageLength) * 100;
  const sceneProgress = (stats.totalScenes / benchmark.averageChapters) * 100;

  let status: 'ahead' | 'on-track' | 'behind' = 'on-track';
  if (wordProgress >= 110) {
    status = 'ahead';
  } else if (wordProgress < 80) {
    status = 'behind';
  }

  return {
    genre,
    benchmark,
    current: { words: stats.totalWords, scenes: stats.totalScenes },
    progress: {
      words: Math.min(100, Math.round(wordProgress)),
      scenes: Math.min(100, Math.round(sceneProgress)),
    },
    status,
  };
}

/**
 * Get daily word goal progress
 */
export function getDailyGoalProgress(goalId?: string): {
  goal: WritingGoal | null;
  today: number;
  progress: number; // percentage
  remaining: number;
} {
  const goals = getGoals();
  const dailyGoal = goalId
    ? goals.find((g) => g.id === goalId)
    : goals.find((g) => g.type === 'daily');

  if (!dailyGoal) {
    return {
      goal: null,
      today: 0,
      progress: 0,
      remaining: 0,
    };
  }

  const today = new Date().toISOString().split('T')[0];
  const sessions = getWritingSessions();
  const todaySessions = sessions.filter((s) => s.date === today);
  const todayWords = todaySessions.reduce((sum, s) => sum + s.wordCount, 0);

  return {
    goal: dailyGoal,
    today: todayWords,
    progress: dailyGoal.target > 0 ? Math.min(100, (todayWords / dailyGoal.target) * 100) : 0,
    remaining: Math.max(0, dailyGoal.target - todayWords),
  };
}
