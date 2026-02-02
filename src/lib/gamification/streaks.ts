/**
 * Streak Tracking
 * 
 * Tracks daily writing streaks and statistics
 */

export interface WritingSession {
  date: string; // YYYY-MM-DD
  wordCount: number;
  timeMinutes: number;
  sessions: number;
}

export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  totalDays: number;
  totalWords: number;
  totalTime: number; // minutes
  weeklyStats: {
    week: string; // YYYY-WW
    wordCount: number;
    days: number;
  }[];
  monthlyStats: {
    month: string; // YYYY-MM
    wordCount: number;
    days: number;
  }[];
}

const STORAGE_KEY = 'odysseyos_writing_sessions';
const STORAGE_KEY_STATS = 'odysseyos_streak_stats';

/**
 * Get today's date string (YYYY-MM-DD)
 */
function getTodayString(): string {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

/**
 * Get all writing sessions
 */
export function getWritingSessions(): WritingSession[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

/**
 * Record a writing session
 */
export function recordSession(wordCount: number, timeMinutes: number): void {
  if (typeof window === 'undefined') return;

  const today = getTodayString();
  const sessions = getWritingSessions();
  
  const existingIndex = sessions.findIndex((s) => s.date === today);
  
  if (existingIndex >= 0) {
    // Update existing session
    sessions[existingIndex].wordCount += wordCount;
    sessions[existingIndex].timeMinutes += timeMinutes;
    sessions[existingIndex].sessions += 1;
  } else {
    // Create new session
    sessions.push({
      date: today,
      wordCount,
      timeMinutes,
      sessions: 1,
    });
  }

  // Sort by date (newest first)
  sessions.sort((a, b) => b.date.localeCompare(a.date));

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.error('Failed to save writing session:', error);
  }
}

/**
 * Calculate current streak
 */
export function calculateCurrentStreak(): number {
  const sessions = getWritingSessions();
  if (sessions.length === 0) return 0;

  // Sort by date (oldest first)
  const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date));
  
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check backwards from today
  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    const dateString = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
    
    const hasSession = sorted.some((s) => s.date === dateString);
    if (hasSession) {
      streak++;
    } else if (i > 0) {
      // If we've started counting and hit a gap, break
      break;
    }
  }

  return streak;
}

/**
 * Calculate longest streak
 */
export function calculateLongestStreak(): number {
  const sessions = getWritingSessions();
  if (sessions.length === 0) return 0;

  const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date));
  
  let longestStreak = 0;
  let currentStreak = 0;
  let lastDate: Date | null = null;

  for (const session of sorted) {
    const sessionDate = new Date(session.date + 'T00:00:00');
    
    if (lastDate === null) {
      currentStreak = 1;
    } else {
      const daysDiff = Math.floor((sessionDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 1) {
        // Consecutive day
        currentStreak++;
      } else if (daysDiff > 1) {
        // Gap in streak
        longestStreak = Math.max(longestStreak, currentStreak);
        currentStreak = 1;
      }
      // daysDiff === 0 means same day, don't reset
    }
    
    lastDate = sessionDate;
    longestStreak = Math.max(longestStreak, currentStreak);
  }

  return longestStreak;
}

/**
 * Get comprehensive streak statistics
 */
export function getStreakStats(): StreakStats {
  const sessions = getWritingSessions();
  const currentStreak = calculateCurrentStreak();
  const longestStreak = calculateLongestStreak();

  const totalWords = sessions.reduce((sum, s) => sum + s.wordCount, 0);
  const totalTime = sessions.reduce((sum, s) => sum + s.timeMinutes, 0);
  const totalDays = new Set(sessions.map((s) => s.date)).size;

  // Calculate weekly stats
  const weeklyMap = new Map<string, { wordCount: number; days: Set<string> }>();
  sessions.forEach((session) => {
    const date = new Date(session.date + 'T00:00:00');
    const year = date.getFullYear();
    const week = getWeekNumber(date);
    const weekKey = `${year}-W${String(week).padStart(2, '0')}`;

    if (!weeklyMap.has(weekKey)) {
      weeklyMap.set(weekKey, { wordCount: 0, days: new Set() });
    }
    const weekData = weeklyMap.get(weekKey)!;
    weekData.wordCount += session.wordCount;
    weekData.days.add(session.date);
  });

  const weeklyStats = Array.from(weeklyMap.entries())
    .map(([week, data]) => ({
      week,
      wordCount: data.wordCount,
      days: data.days.size,
    }))
    .sort((a, b) => b.week.localeCompare(a.week));

  // Calculate monthly stats
  const monthlyMap = new Map<string, { wordCount: number; days: Set<string> }>();
  sessions.forEach((session) => {
    const monthKey = session.date.substring(0, 7); // YYYY-MM

    if (!monthlyMap.has(monthKey)) {
      monthlyMap.set(monthKey, { wordCount: 0, days: new Set() });
    }
    const monthData = monthlyMap.get(monthKey)!;
    monthData.wordCount += session.wordCount;
    monthData.days.add(session.date);
  });

  const monthlyStats = Array.from(monthlyMap.entries())
    .map(([month, data]) => ({
      month,
      wordCount: data.wordCount,
      days: data.days.size,
    }))
    .sort((a, b) => b.month.localeCompare(a.month));

  return {
    currentStreak,
    longestStreak,
    totalDays,
    totalWords,
    totalTime,
    weeklyStats,
    monthlyStats,
  };
}

/**
 * Get week number for a date
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Check if user wrote today
 */
export function hasWrittenToday(): boolean {
  const today = getTodayString();
  const sessions = getWritingSessions();
  return sessions.some((s) => s.date === today);
}

/**
 * Get today's word count
 */
export function getTodayWordCount(): number {
  const today = getTodayString();
  const sessions = getWritingSessions();
  const todaySession = sessions.find((s) => s.date === today);
  return todaySession?.wordCount || 0;
}
