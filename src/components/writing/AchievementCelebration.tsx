'use client';

/**
 * Achievement Celebration Animation
 * 
 * Displays celebration animation when an achievement is earned
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, X } from 'lucide-react';
import type { Achievement } from '@/lib/gamification/achievements';

interface AchievementCelebrationProps {
  achievement: Achievement;
  onComplete: () => void;
}

const RARITY_COLORS = {
  common: 'from-gray-400 to-gray-600',
  rare: 'from-blue-400 to-blue-600',
  epic: 'from-purple-400 to-purple-600',
  legendary: 'from-yellow-400 to-orange-600',
};

export default function AchievementCelebration({
  achievement,
  onComplete,
}: AchievementCelebrationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 500); // Wait for exit animation
    }, 5000); // Show for 5 seconds

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: -50 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed top-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        >
          <motion.div
            className={`bg-gradient-to-r ${RARITY_COLORS[achievement.rarity]} rounded-lg shadow-2xl p-6 min-w-[300px] pointer-events-auto`}
            initial={{ rotate: -5 }}
            animate={{ rotate: [0, -5, 5, -5, 0] }}
            transition={{ duration: 0.5, repeat: 2 }}
          >
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
                className="text-5xl"
              >
                {achievement.icon}
              </motion.div>
              <div className="flex-1">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-white font-bold text-lg mb-1"
                >
                  Achievement Unlocked!
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-white/90 font-semibold"
                >
                  {achievement.name}
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-white/70 text-sm mt-1"
                >
                  {achievement.description}
                </motion.div>
              </div>
              <button
                onClick={() => {
                  setIsVisible(false);
                  setTimeout(onComplete, 500);
                }}
                className="p-1 hover:bg-white/20 rounded transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Confetti effect */}
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                initial={{
                  x: '50%',
                  y: '50%',
                  opacity: 1,
                }}
                animate={{
                  x: `${50 + (Math.random() - 0.5) * 200}%`,
                  y: `${50 + (Math.random() - 0.5) * 200}%`,
                  opacity: 0,
                }}
                transition={{
                  duration: 1,
                  delay: Math.random() * 0.5,
                  ease: 'easeOut',
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
