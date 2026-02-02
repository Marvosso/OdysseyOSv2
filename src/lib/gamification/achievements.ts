/**
 * Achievement System
 * 
 * Tracks and awards achievements for writing milestones
 */

export type AchievementId =
  | 'first_words'
  | 'hundred_words'
  | 'thousand_words'
  | 'five_thousand_words'
  | 'ten_thousand_words'
  | 'midnight_writer'
  | 'early_bird'
  | 'sprint_master'
  | 'consistency_king'
  | 'week_warrior'
  | 'month_legend'
  | 'streak_7'
  | 'streak_30'
  | 'streak_100'
  | 'speed_demon'
  | 'marathon_writer';

export interface Achievement {
  id: AchievementId;
  name: string;
  description: string;
  icon: string; // Emoji or icon name
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category: 'words' | 'time' | 'streak' | 'speed' | 'special';
}

export const ACHIEVEMENTS: Record<AchievementId, Achievement> = {
  first_words: {
    id: 'first_words',
    name: 'First Words',
    description: 'Write your first 10 words',
    icon: '✍️',
    rarity: 'common',
    category: 'words',
  },
  hundred_words: {
    id: 'hundred_words',
    name: 'Century Club',
    description: 'Write 100 words in a session',
    icon: '💯',
    rarity: 'common',
    category: 'words',
  },
  thousand_words: {
    id: 'thousand_words',
    name: 'Thousand Words',
    description: 'Write 1,000 words in a session',
    icon: '📝',
    rarity: 'rare',
    category: 'words',
  },
  five_thousand_words: {
    id: 'five_thousand_words',
    name: 'Novelist',
    description: 'Write 5,000 words in a session',
    icon: '📚',
    rarity: 'epic',
    category: 'words',
  },
  ten_thousand_words: {
    id: 'ten_thousand_words',
    name: 'Word Master',
    description: 'Write 10,000 words in a session',
    icon: '👑',
    rarity: 'legendary',
    category: 'words',
  },
  midnight_writer: {
    id: 'midnight_writer',
    name: 'Midnight Writer',
    description: 'Write after midnight',
    icon: '🌙',
    rarity: 'rare',
    category: 'time',
  },
  early_bird: {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Write before 6 AM',
    icon: '🌅',
    rarity: 'rare',
    category: 'time',
  },
  sprint_master: {
    id: 'sprint_master',
    name: 'Sprint Master',
    description: 'Complete 10 writing sprints',
    icon: '⚡',
    rarity: 'epic',
    category: 'speed',
  },
  consistency_king: {
    id: 'consistency_king',
    name: 'Consistency King',
    description: 'Write every day for 7 days',
    icon: '👑',
    rarity: 'epic',
    category: 'streak',
  },
  week_warrior: {
    id: 'week_warrior',
    name: 'Week Warrior',
    description: 'Write 7 days in a row',
    icon: '🗡️',
    rarity: 'rare',
    category: 'streak',
  },
  month_legend: {
    id: 'month_legend',
    name: 'Month Legend',
    description: 'Write 30 days in a row',
    icon: '🏆',
    rarity: 'legendary',
    category: 'streak',
  },
  streak_7: {
    id: 'streak_7',
    name: 'Week Streak',
    description: 'Maintain a 7-day writing streak',
    icon: '🔥',
    rarity: 'rare',
    category: 'streak',
  },
  streak_30: {
    id: 'streak_30',
    name: 'Month Streak',
    description: 'Maintain a 30-day writing streak',
    icon: '🔥🔥',
    rarity: 'epic',
    category: 'streak',
  },
  streak_100: {
    id: 'streak_100',
    name: 'Century Streak',
    description: 'Maintain a 100-day writing streak',
    icon: '🔥🔥🔥',
    rarity: 'legendary',
    category: 'streak',
  },
  speed_demon: {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Write 500 words in 15 minutes',
    icon: '💨',
    rarity: 'epic',
    category: 'speed',
  },
  marathon_writer: {
    id: 'marathon_writer',
    name: 'Marathon Writer',
    description: 'Write for 2 hours straight',
    icon: '🏃',
    rarity: 'legendary',
    category: 'time',
  },
};

export interface EarnedAchievement {
  achievementId: AchievementId;
  earnedAt: Date;
}

const STORAGE_KEY = 'odysseyos_achievements';
const STORAGE_KEY_EARNED = 'odysseyos_earned_achievements';

/**
 * Get all earned achievements
 */
export function getEarnedAchievements(): EarnedAchievement[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY_EARNED);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    return parsed.map((a: any) => ({
      achievementId: a.achievementId,
      earnedAt: new Date(a.earnedAt),
    }));
  } catch {
    return [];
  }
}

/**
 * Check if achievement is earned
 */
export function hasAchievement(achievementId: AchievementId): boolean {
  const earned = getEarnedAchievements();
  return earned.some((a) => a.achievementId === achievementId);
}

/**
 * Award achievement
 */
export function awardAchievement(achievementId: AchievementId): boolean {
  if (hasAchievement(achievementId)) {
    return false; // Already earned
  }

  const earned = getEarnedAchievements();
  earned.push({
    achievementId,
    earnedAt: new Date(),
  });

  try {
    localStorage.setItem(STORAGE_KEY_EARNED, JSON.stringify(earned));
    return true; // Newly earned
  } catch {
    return false;
  }
}

/**
 * Check and award word count achievements
 */
export function checkWordCountAchievements(wordCount: number): AchievementId[] {
  const newlyEarned: AchievementId[] = [];

  if (wordCount >= 10 && !hasAchievement('first_words')) {
    if (awardAchievement('first_words')) newlyEarned.push('first_words');
  }
  if (wordCount >= 100 && !hasAchievement('hundred_words')) {
    if (awardAchievement('hundred_words')) newlyEarned.push('hundred_words');
  }
  if (wordCount >= 1000 && !hasAchievement('thousand_words')) {
    if (awardAchievement('thousand_words')) newlyEarned.push('thousand_words');
  }
  if (wordCount >= 5000 && !hasAchievement('five_thousand_words')) {
    if (awardAchievement('five_thousand_words')) newlyEarned.push('five_thousand_words');
  }
  if (wordCount >= 10000 && !hasAchievement('ten_thousand_words')) {
    if (awardAchievement('ten_thousand_words')) newlyEarned.push('ten_thousand_words');
  }

  return newlyEarned;
}

/**
 * Check time-based achievements
 */
export function checkTimeAchievements(): AchievementId[] {
  const newlyEarned: AchievementId[] = [];
  const hour = new Date().getHours();

  if (hour >= 0 && hour < 6 && !hasAchievement('midnight_writer')) {
    if (awardAchievement('midnight_writer')) newlyEarned.push('midnight_writer');
  }
  if (hour >= 4 && hour < 6 && !hasAchievement('early_bird')) {
    if (awardAchievement('early_bird')) newlyEarned.push('early_bird');
  }

  return newlyEarned;
}

/**
 * Check speed achievements
 */
export function checkSpeedAchievements(wordsPerMinute: number, timeMinutes: number): AchievementId[] {
  const newlyEarned: AchievementId[] = [];

  // Speed demon: 500 words in 15 minutes = ~33 WPM
  if (wordsPerMinute >= 33 && timeMinutes <= 15 && !hasAchievement('speed_demon')) {
    if (awardAchievement('speed_demon')) newlyEarned.push('speed_demon');
  }

  return newlyEarned;
}

/**
 * Check streak achievements
 */
export function checkStreakAchievements(currentStreak: number): AchievementId[] {
  const newlyEarned: AchievementId[] = [];

  if (currentStreak >= 7 && !hasAchievement('streak_7')) {
    if (awardAchievement('streak_7')) newlyEarned.push('streak_7');
  }
  if (currentStreak >= 30 && !hasAchievement('streak_30')) {
    if (awardAchievement('streak_30')) newlyEarned.push('streak_30');
  }
  if (currentStreak >= 100 && !hasAchievement('streak_100')) {
    if (awardAchievement('streak_100')) newlyEarned.push('streak_100');
  }
  if (currentStreak >= 7 && !hasAchievement('week_warrior')) {
    if (awardAchievement('week_warrior')) newlyEarned.push('week_warrior');
  }
  if (currentStreak >= 30 && !hasAchievement('month_legend')) {
    if (awardAchievement('month_legend')) newlyEarned.push('month_legend');
  }
  if (currentStreak >= 7 && !hasAchievement('consistency_king')) {
    if (awardAchievement('consistency_king')) newlyEarned.push('consistency_king');
  }

  return newlyEarned;
}

/**
 * Get achievement by ID
 */
export function getAchievement(id: AchievementId): Achievement {
  return ACHIEVEMENTS[id];
}

/**
 * Get all achievements by category
 */
export function getAchievementsByCategory(category: Achievement['category']): Achievement[] {
  return Object.values(ACHIEVEMENTS).filter((a) => a.category === category);
}

/**
 * Get achievement progress (for display)
 */
export function getAchievementProgress(achievementId: AchievementId, currentValue: number): number {
  // This is a simplified version - you can expand based on achievement type
  switch (achievementId) {
    case 'first_words':
      return Math.min(100, (currentValue / 10) * 100);
    case 'hundred_words':
      return Math.min(100, (currentValue / 100) * 100);
    case 'thousand_words':
      return Math.min(100, (currentValue / 1000) * 100);
    case 'five_thousand_words':
      return Math.min(100, (currentValue / 5000) * 100);
    case 'ten_thousand_words':
      return Math.min(100, (currentValue / 10000) * 100);
    default:
      return hasAchievement(achievementId) ? 100 : 0;
  }
}
