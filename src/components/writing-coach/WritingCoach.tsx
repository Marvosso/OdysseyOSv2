import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, Target, TrendingUp, ArrowRight, X } from 'lucide-react';
import { coachingGoals } from '@/lib/data/writingCoach';

export default function WritingCoach(_story: any) {
  const [goals] = useState(coachingGoals);
  const [selectedGoal, setSelectedGoal] = useState<typeof goals[number] | null>(null);
  const [activeSession, setActiveSession] = useState(false);
  const [sessionProgress, setSessionProgress] = useState(0);

  const handleStartSession = (goal: typeof goals[number]) => {
    setSelectedGoal(goal);
    setActiveSession(true);
    setSessionProgress(0);
    
    const interval = setInterval(() => {
      setSessionProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setActiveSession(false);
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-white flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-400" />
          Writing Coach
        </h3>
        {activeSession && (
          <span className="text-xs text-yellow-400 animate-pulse">Session Active</span>
        )}
      </div>

      <AnimatePresence>
        {activeSession && selectedGoal && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-medium text-white">{selectedGoal.name}</h4>
                <p className="text-xs text-gray-400">{selectedGoal.description}</p>
              </div>
              <button
                onClick={() => setActiveSession(false)}
                className="p-1 hover:bg-black/20 rounded"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            
            <div className="mb-2">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Progress</span>
                <span>{sessionProgress}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${sessionProgress}%` }}
                  transition={{ duration: 0.5 }}
                  className="h-full bg-yellow-500"
                />
              </div>
            </div>
            
            {sessionProgress >= 100 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-yellow-400 text-center"
              >
                Session Complete! 🎉
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        {goals.map((goal) => (
          <motion.button
            key={goal.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => handleStartSession(goal)}
            disabled={activeSession}
            className={`w-full p-4 rounded-lg text-left transition-all ${
              activeSession
                ? 'opacity-50 cursor-not-allowed'
                : 'bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${
                goal.category === 'dialogue' ? 'bg-blue-500/20' :
                goal.category === 'character' ? 'bg-purple-500/20' :
                goal.category === 'structure' ? 'bg-green-500/20' :
                'bg-yellow-500/20'
              }`}>
                {goal.category === 'dialogue' && <Target className="w-4 h-4 text-blue-400" />}
                {goal.category === 'character' && <Lightbulb className="w-4 h-4 text-purple-400" />}
                {goal.category === 'structure' && <TrendingUp className="w-4 h-4 text-green-400" />}
                {goal.category === 'style' && <ArrowRight className="w-4 h-4 text-yellow-400" />}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-white text-sm">{goal.name}</h4>
                <p className="text-xs text-gray-500 mt-1">{goal.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-gray-600 capitalize">{goal.category}</span>
                  <span className="text-gray-600">•</span>
                  <span className="text-xs text-gray-600">{goal.duration} min</span>
                </div>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
