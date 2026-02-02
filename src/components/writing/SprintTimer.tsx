'use client';

/**
 * Writing Sprint Timer
 * 
 * Pomodoro-style timer with word count goals, ambient sounds, and fullscreen mode
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  Square,
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  Target,
  TrendingUp,
  Award,
  X,
  Settings,
} from 'lucide-react';
import { computeWordCount } from '@/utils/wordCount';
import { recordSession, getStreakStats, calculateCurrentStreak } from '@/lib/gamification/streaks';
import {
  checkWordCountAchievements,
  checkTimeAchievements,
  checkSpeedAchievements,
  checkStreakAchievements,
  getAchievement,
  type AchievementId,
} from '@/lib/gamification/achievements';
import AchievementCelebration from './AchievementCelebration';

type TimerMode = 'work' | 'break';
type TimerState = 'idle' | 'running' | 'paused' | 'completed';

interface AmbientSound {
  id: string;
  name: string;
  url: string;
  icon: string;
}

const AMBIENT_SOUNDS: AmbientSound[] = [
  { id: 'rain', name: 'Rain', url: '/sounds/rain.mp3', icon: '🌧️' },
  { id: 'cafe', name: 'Cafe', url: '/sounds/cafe.mp3', icon: '☕' },
  { id: 'forest', name: 'Forest', url: '/sounds/forest.mp3', icon: '🌲' },
  { id: 'ocean', name: 'Ocean', url: '/sounds/ocean.mp3', icon: '🌊' },
  { id: 'fireplace', name: 'Fireplace', url: '/sounds/fireplace.mp3', icon: '🔥' },
  { id: 'none', name: 'None', url: '', icon: '🔇' },
];

const WORK_DURATION = 25 * 60; // 25 minutes in seconds
const BREAK_DURATION = 5 * 60; // 5 minutes in seconds

interface SprintTimerProps {
  initialContent?: string;
  onContentChange?: (content: string) => void;
  onClose?: () => void;
}

export default function SprintTimer({
  initialContent = '',
  onContentChange,
  onClose,
}: SprintTimerProps) {
  const [mode, setMode] = useState<TimerMode>('work');
  const [state, setState] = useState<TimerState>('idle');
  const [timeRemaining, setTimeRemaining] = useState(WORK_DURATION);
  const [wordCount, setWordCount] = useState(0);
  const [wordGoal, setWordGoal] = useState(250);
  const [content, setContent] = useState(initialContent);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedSound, setSelectedSound] = useState<string>('none');
  const [soundVolume, setSoundVolume] = useState(0.3);
  const [isSoundPlaying, setIsSoundPlaying] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [sessionWordCount, setSessionWordCount] = useState(0);
  const [newlyEarnedAchievements, setNewlyEarnedAchievements] = useState<AchievementId[]>([]);
  const [showSettings, setShowSettings] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  // Update word count when content changes
  useEffect(() => {
    const count = computeWordCount(content);
    setWordCount(count);
    setSessionWordCount(count);
    onContentChange?.(content);
  }, [content, onContentChange]);

  // Timer countdown
  useEffect(() => {
    if (state === 'running' && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state, timeRemaining]);

  // Ambient sound handling
  useEffect(() => {
    if (selectedSound !== 'none' && state === 'running' && !isSoundPlaying) {
      // In a real implementation, you would load and play the audio
      // For now, we'll just track the state
      setIsSoundPlaying(true);
    } else if (state !== 'running' || selectedSound === 'none') {
      setIsSoundPlaying(false);
    }
  }, [selectedSound, state, isSoundPlaying]);

  // Fullscreen handling
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Check achievements periodically
  useEffect(() => {
    if (state === 'running' && sessionStartTime) {
      const checkInterval = setInterval(() => {
        checkAndAwardAchievements();
      }, 30000); // Check every 30 seconds

      return () => clearInterval(checkInterval);
    }
  }, [state, sessionStartTime, wordCount]);

  const handleStart = () => {
    setState('running');
    setSessionStartTime(new Date());
    setSessionWordCount(0);
    
    // Check time-based achievements
    const timeAchievements = checkTimeAchievements();
    if (timeAchievements.length > 0) {
      setNewlyEarnedAchievements((prev) => [...prev, ...timeAchievements]);
    }
  };

  const handlePause = () => {
    setState('paused');
  };

  const handleResume = () => {
    setState('running');
  };

  const handleStop = () => {
    setState('idle');
    setTimeRemaining(mode === 'work' ? WORK_DURATION : BREAK_DURATION);
    setSessionStartTime(null);
    setSessionWordCount(0);
  };

  const handleTimerComplete = () => {
    setState('completed');
    
    // Record session
    if (sessionStartTime) {
      const timeElapsed = (new Date().getTime() - sessionStartTime.getTime()) / 1000 / 60; // minutes
      recordSession(sessionWordCount, timeElapsed);
    }

    // Check achievements
    checkAndAwardAchievements();

    // Switch to break mode if in work mode
    if (mode === 'work') {
      setTimeout(() => {
        setMode('break');
        setTimeRemaining(BREAK_DURATION);
        setState('idle');
      }, 2000);
    } else {
      // Break completed, return to work
      setTimeout(() => {
        setMode('work');
        setTimeRemaining(WORK_DURATION);
        setState('idle');
      }, 2000);
    }
  };

  const checkAndAwardAchievements = () => {
    const earned: AchievementId[] = [];

    // Check word count achievements
    const wordAchievements = checkWordCountAchievements(wordCount);
    earned.push(...wordAchievements);

    // Check speed achievements
    if (sessionStartTime) {
      const timeElapsed = (new Date().getTime() - sessionStartTime.getTime()) / 1000 / 60; // minutes
      const wordsPerMinute = timeElapsed > 0 ? wordCount / timeElapsed : 0;
      const speedAchievements = checkSpeedAchievements(wordsPerMinute, timeElapsed);
      earned.push(...speedAchievements);
    }

    // Check streak achievements
    const currentStreak = calculateCurrentStreak();
    const streakAchievements = checkStreakAchievements(currentStreak);
    earned.push(...streakAchievements);

    if (earned.length > 0) {
      setNewlyEarnedAchievements((prev) => [...prev, ...earned]);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const progress = mode === 'work' 
    ? ((WORK_DURATION - timeRemaining) / WORK_DURATION) * 100
    : ((BREAK_DURATION - timeRemaining) / BREAK_DURATION) * 100;

  const wordProgress = wordGoal > 0 ? Math.min(100, (wordCount / wordGoal) * 100) : 0;
  const streakStats = getStreakStats();

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50' : 'relative'} bg-gray-900 text-white`}>
      {/* Achievement Celebrations */}
      <AnimatePresence>
        {newlyEarnedAchievements.map((achievementId, index) => (
          <AchievementCelebration
            key={`${achievementId}-${index}`}
            achievement={getAchievement(achievementId)}
            onComplete={() => {
              setNewlyEarnedAchievements((prev) => prev.filter((id) => id !== achievementId));
            }}
          />
        ))}
      </AnimatePresence>

      {/* Header */}
      {!isFullscreen && (
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Target className="w-6 h-6 text-purple-400" />
            Writing Sprint
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      )}

      <div className="flex flex-col h-full">
        {/* Timer Section */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6">
          {/* Mode Indicator */}
          <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
            mode === 'work' ? 'bg-purple-600' : 'bg-green-600'
          }`}>
            {mode === 'work' ? 'Work Session' : 'Break Time'}
          </div>

          {/* Timer Display */}
          <div className="relative">
            <div className="text-7xl font-mono font-bold">
              {formatTime(timeRemaining)}
            </div>
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-64 h-2 bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className={`h-full ${mode === 'work' ? 'bg-purple-600' : 'bg-green-600'}`}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1 }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-purple-400">{wordCount}</div>
              <div className="text-sm text-gray-400">Words</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400">
                {wordGoal > 0 ? `${Math.round(wordProgress)}%` : '—'}
              </div>
              <div className="text-sm text-gray-400">Goal</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-400">{streakStats.currentStreak}</div>
              <div className="text-sm text-gray-400">Streak</div>
            </div>
          </div>

          {/* Word Goal Progress */}
          {wordGoal > 0 && (
            <div className="w-64">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Goal: {wordGoal} words</span>
                <span>{wordCount} / {wordGoal}</span>
              </div>
              <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-600 to-pink-600"
                  initial={{ width: 0 }}
                  animate={{ width: `${wordProgress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center gap-4">
            {state === 'idle' && (
              <button
                onClick={handleStart}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold flex items-center gap-2 transition-colors"
              >
                <Play className="w-5 h-5" />
                Start
              </button>
            )}
            {state === 'running' && (
              <>
                <button
                  onClick={handlePause}
                  className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg font-semibold flex items-center gap-2 transition-colors"
                >
                  <Pause className="w-5 h-5" />
                  Pause
                </button>
                <button
                  onClick={handleStop}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold flex items-center gap-2 transition-colors"
                >
                  <Square className="w-5 h-5" />
                  Stop
                </button>
              </>
            )}
            {state === 'paused' && (
              <>
                <button
                  onClick={handleResume}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold flex items-center gap-2 transition-colors"
                >
                  <Play className="w-5 h-5" />
                  Resume
                </button>
                <button
                  onClick={handleStop}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold flex items-center gap-2 transition-colors"
                >
                  <Square className="w-5 h-5" />
                  Stop
                </button>
              </>
            )}
            {state === 'completed' && (
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400 mb-2">Session Complete!</div>
                <button
                  onClick={() => {
                    setMode('work');
                    setTimeRemaining(WORK_DURATION);
                    setState('idle');
                  }}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold"
                >
                  Start Next Session
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Writing Area */}
        {(state === 'running' || state === 'paused' || isFullscreen) && (
          <div className="flex-1 p-6 border-t border-gray-700">
            <textarea
              ref={contentRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Start writing..."
              className="w-full h-full bg-gray-800 text-white rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              disabled={state === 'paused' || mode === 'break'}
            />
          </div>
        )}

        {/* Footer Controls */}
        <div className="flex items-center justify-between p-4 border-t border-gray-700 bg-gray-800/50">
          <div className="flex items-center gap-4">
            {/* Settings */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* Ambient Sound */}
            <div className="flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-gray-400" />
              <select
                value={selectedSound}
                onChange={(e) => setSelectedSound(e.target.value)}
                className="px-3 py-1 bg-gray-700 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={state === 'running'}
              >
                {AMBIENT_SOUNDS.map((sound) => (
                  <option key={sound.id} value={sound.id}>
                    {sound.icon} {sound.name}
                  </option>
                ))}
              </select>
              {selectedSound !== 'none' && (
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={soundVolume}
                  onChange={(e) => setSoundVolume(parseFloat(e.target.value))}
                  className="w-20"
                />
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Word Goal Input */}
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-gray-400" />
              <input
                type="number"
                value={wordGoal}
                onChange={(e) => setWordGoal(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-20 px-2 py-1 bg-gray-700 text-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Goal"
                disabled={state === 'running'}
              />
            </div>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-gray-700 bg-gray-800/50"
            >
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Word Goal</label>
                  <input
                    type="number"
                    value={wordGoal}
                    onChange={(e) => setWordGoal(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Ambient Sound Volume</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={soundVolume}
                    onChange={(e) => setSoundVolume(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
