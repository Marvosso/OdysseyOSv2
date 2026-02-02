/**
 * Writing Metrics Calculator
 * 
 * Calculates various writing analytics and metrics
 */

import type { Story, Scene } from '@/types/story';
import { StoryStorage } from '@/lib/storage/storyStorage';

export interface WritingSession {
  date: string; // ISO date string
  wordCount: number;
  sceneCount: number;
  duration: number; // minutes
  timeOfDay: string; // "morning", "afternoon", "evening", "night"
  timestamp: number; // Unix timestamp
}

export interface DailyStats {
  date: string;
  words: number;
  scenes: number;
  sessions: number;
  averageSpeed: number; // words per minute
}

export interface WeeklyStats {
  week: string; // "YYYY-WW"
  words: number;
  scenes: number;
  daysActive: number;
  averageDailyWords: number;
}

export interface MonthlyStats {
  month: string; // "YYYY-MM"
  words: number;
  scenes: number;
  daysActive: number;
  averageDailyWords: number;
}

export interface TimeOfDayStats {
  period: string;
  totalWords: number;
  sessionCount: number;
  averageWords: number;
}

export interface WordFrequency {
  word: string;
  count: number;
  percentage: number;
}

export interface WritingSpeed {
  timestamp: number;
  wordsPerMinute: number;
  sessionDuration: number;
}

/**
 * Get time of day period from hour
 */
function getTimeOfDay(hour: number): string {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}

/**
 * Track a writing session
 */
export function trackWritingSession(
  wordCount: number,
  sceneCount: number = 0,
  duration: number = 0
): void {
  if (typeof window === 'undefined') return;

  const sessions = getWritingSessions();
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const hour = now.getHours();

  sessions.push({
    date,
    wordCount,
    sceneCount,
    duration,
    timeOfDay: getTimeOfDay(hour),
    timestamp: now.getTime(),
  });

  // Keep only last 365 days of sessions
  const oneYearAgo = now.getTime() - 365 * 24 * 60 * 60 * 1000;
  const filteredSessions = sessions.filter(s => s.timestamp > oneYearAgo);

  localStorage.setItem('odysseyos-writing-sessions', JSON.stringify(filteredSessions));
}

/**
 * Get all writing sessions
 */
export function getWritingSessions(): WritingSession[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem('odysseyos-writing-sessions');
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

/**
 * Calculate daily statistics
 */
export function calculateDailyStats(sessions: WritingSession[]): DailyStats[] {
  const dailyMap = new Map<string, DailyStats>();

  sessions.forEach((session) => {
    const existing = dailyMap.get(session.date) || {
      date: session.date,
      words: 0,
      scenes: 0,
      sessions: 0,
      averageSpeed: 0,
    };

    existing.words += session.wordCount;
    existing.scenes += session.sceneCount;
    existing.sessions += 1;
    if (session.duration > 0) {
      const speed = session.wordCount / session.duration;
      existing.averageSpeed = (existing.averageSpeed * (existing.sessions - 1) + speed) / existing.sessions;
    }

    dailyMap.set(session.date, existing);
  });

  return Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Calculate weekly statistics
 */
export function calculateWeeklyStats(sessions: WritingSession[]): WeeklyStats[] {
  const weeklyMap = new Map<string, WeeklyStats>();

  sessions.forEach((session) => {
    const date = new Date(session.date);
    const year = date.getFullYear();
    const week = getWeekNumber(date);
    const weekKey = `${year}-W${week.toString().padStart(2, '0')}`;

    const existing = weeklyMap.get(weekKey) || {
      week: weekKey,
      words: 0,
      scenes: 0,
      daysActive: 0,
      averageDailyWords: 0,
    };

    existing.words += session.wordCount;
    existing.scenes += session.sceneCount;
    if (!existing.daysActive || !existing.daysActive.toString().includes(session.date)) {
      existing.daysActive += 1;
    }

    weeklyMap.set(weekKey, existing);
  });

  const weeklyStats = Array.from(weeklyMap.values());
  weeklyStats.forEach((stat) => {
    stat.averageDailyWords = stat.daysActive > 0 ? Math.round(stat.words / stat.daysActive) : 0;
  });

  return weeklyStats.sort((a, b) => a.week.localeCompare(b.week));
}

/**
 * Calculate monthly statistics
 */
export function calculateMonthlyStats(sessions: WritingSession[]): MonthlyStats[] {
  const monthlyMap = new Map<string, MonthlyStats>();

  sessions.forEach((session) => {
    const month = session.date.substring(0, 7); // "YYYY-MM"

    const existing = monthlyMap.get(month) || {
      month,
      words: 0,
      scenes: 0,
      daysActive: 0,
      averageDailyWords: 0,
    };

    existing.words += session.wordCount;
    existing.scenes += session.sceneCount;
    if (!existing.daysActive || !existing.daysActive.toString().includes(session.date)) {
      existing.daysActive += 1;
    }

    monthlyMap.set(month, existing);
  });

  const monthlyStats = Array.from(monthlyMap.values());
  monthlyStats.forEach((stat) => {
    stat.averageDailyWords = stat.daysActive > 0 ? Math.round(stat.words / stat.daysActive) : 0;
  });

  return monthlyStats.sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * Get week number from date
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Calculate time of day statistics
 */
export function calculateTimeOfDayStats(sessions: WritingSession[]): TimeOfDayStats[] {
  const periodMap = new Map<string, { totalWords: number; sessionCount: number }>();

  sessions.forEach((session) => {
    const existing = periodMap.get(session.timeOfDay) || {
      totalWords: 0,
      sessionCount: 0,
    };

    existing.totalWords += session.wordCount;
    existing.sessionCount += 1;
    periodMap.set(session.timeOfDay, existing);
  });

  const periods = ['morning', 'afternoon', 'evening', 'night'];
  return periods.map((period) => {
    const data = periodMap.get(period) || { totalWords: 0, sessionCount: 0 };
    return {
      period,
      totalWords: data.totalWords,
      sessionCount: data.sessionCount,
      averageWords: data.sessionCount > 0 ? Math.round(data.totalWords / data.sessionCount) : 0,
    };
  });
}

/**
 * Analyze common words in story
 */
export function analyzeCommonWords(story: Story, topN: number = 20): WordFrequency[] {
  const wordMap = new Map<string, number>();
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does',
    'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that',
    'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us',
    'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'what', 'which', 'who', 'whom',
    'whose', 'where', 'when', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more',
    'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than',
    'too', 'very', 'just', 'now',
  ]);

  story.scenes.forEach((scene) => {
    const words = scene.content
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopWords.has(w));

    words.forEach((word) => {
      wordMap.set(word, (wordMap.get(word) || 0) + 1);
    });
  });

  const totalWords = Array.from(wordMap.values()).reduce((sum, count) => sum + count, 0);
  const frequencies: WordFrequency[] = Array.from(wordMap.entries())
    .map(([word, count]) => ({
      word,
      count,
      percentage: totalWords > 0 ? (count / totalWords) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);

  return frequencies;
}

/**
 * Calculate writing speed over time
 */
export function calculateWritingSpeed(sessions: WritingSession[]): WritingSpeed[] {
  return sessions
    .filter((s) => s.duration > 0)
    .map((session) => ({
      timestamp: session.timestamp,
      wordsPerMinute: Math.round((session.wordCount / session.duration) * 10) / 10,
      sessionDuration: session.duration,
    }))
    .sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Get current story statistics
 */
export function getCurrentStoryStats(): {
  totalWords: number;
  totalScenes: number;
  averageWordsPerScene: number;
  longestScene: number;
  shortestScene: number;
} {
  const story = StoryStorage.loadStory();
  const scenes = StoryStorage.loadScenes();

  if (!story || scenes.length === 0) {
    return {
      totalWords: 0,
      totalScenes: 0,
      averageWordsPerScene: 0,
      longestScene: 0,
      shortestScene: 0,
    };
  }

  const wordCounts = scenes.map((scene) =>
    scene.content.split(/\s+/).filter((w) => w.length > 0).length
  );

  const totalWords = wordCounts.reduce((sum, count) => sum + count, 0);

  return {
    totalWords,
    totalScenes: scenes.length,
    averageWordsPerScene: scenes.length > 0 ? Math.round(totalWords / scenes.length) : 0,
    longestScene: wordCounts.length > 0 ? Math.max(...wordCounts) : 0,
    shortestScene: wordCounts.length > 0 ? Math.min(...wordCounts) : 0,
  };
}
