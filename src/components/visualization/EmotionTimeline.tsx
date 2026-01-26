'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, TrendingUp, Heart, Zap, Smile, Frown, Angry, Zap as Surprise, Minus } from 'lucide-react';
import type { Scene, EmotionType } from '@/types/story';
import type { LucideIcon } from 'lucide-react';

interface EmotionTimelineProps {
  scenes: Scene[];
  onSceneHover: (sceneId: string) => void;
  onSceneClick: (sceneId: string) => void;
}

interface EmotionConfig {
  label: string;
  color: string;
  icon: LucideIcon;
  intensity: number;
}

const EMOTION_CONFIG: Record<EmotionType, EmotionConfig> = {
  joy: { label: 'Joy', color: 'bg-yellow-500', icon: Smile, intensity: 0.9 },
  sadness: { label: 'Sadness', color: 'bg-blue-500', icon: Frown, intensity: 0.7 },
  anger: { label: 'Anger', color: 'bg-red-500', icon: Angry, intensity: 0.8 },
  fear: { label: 'Fear', color: 'bg-purple-500', icon: Zap, intensity: 0.6 },
  surprise: { label: 'Surprise', color: 'bg-orange-500', icon: Surprise, intensity: 0.85 },
  neutral: { label: 'Neutral', color: 'bg-gray-500', icon: Minus, intensity: 0.5 },
};

const EMOTION_COLORS = {
  joy: '#eab308',
  sadness: '#3b82f6',
  anger: '#ef4444',
  fear: '#a855f7',
  surprise: '#f97316',
  neutral: '#6b7280',
};

export default function EmotionTimeline({ scenes, onSceneHover, onSceneClick }: EmotionTimelineProps) {
  const [hoveredScene, setHoveredScene] = useState<Scene | null>(null);
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionType | 'all'>('all');

  const filteredScenes = selectedEmotion === 'all' 
    ? scenes 
    : scenes.filter(s => s.emotion === selectedEmotion);

  const emotionCounts = scenes.reduce((acc, scene) => {
    acc[scene.emotion] = (acc[scene.emotion] || 0) + 1;
    return acc;
  }, {} as Record<EmotionType, number>);

  const totalEmotionalIntensity = scenes.reduce((acc, scene) => {
    return acc + EMOTION_CONFIG[scene.emotion].intensity;
  }, 0);

  const averageIntensity = scenes.length > 0 ? totalEmotionalIntensity / scenes.length : 0;

  const handleSceneMouseEnter = (scene: Scene) => {
    setHoveredScene(scene);
    onSceneHover(scene.id);
  };

  const handleSceneMouseLeave = () => {
    setHoveredScene(null);
  };

  const handleSceneClick = (scene: Scene) => {
    onSceneClick(scene.id);
  };

  if (scenes.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Brain size={32} className="mx-auto mb-3 opacity-50" />
        <p>No scenes to analyze</p>
        <p className="text-sm mt-2">Add scenes to see emotion analysis</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Metrics Dashboard */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={16} className="text-purple-400" />
            <span className="text-xs text-gray-500">Avg Intensity</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {(averageIntensity * 10).toFixed(0)}/10
          </div>
        </div>

        <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <Heart size={16} className="text-pink-400" />
            <span className="text-xs text-gray-500">Total Scenes</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {scenes.length}
          </div>
        </div>
      </div>

      {/* Emotion Filter */}
      <div>
        <h4 className="text-sm font-medium text-gray-400 mb-2">Filter by Emotion</h4>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedEmotion('all')}
            className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
              selectedEmotion === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            All ({scenes.length})
          </button>
          {Object.entries(emotionCounts).map(([emotion, count]) => {
            const config = EMOTION_CONFIG[emotion as EmotionType];
            return (
              <button
                key={emotion}
                onClick={() => setSelectedEmotion(emotion as EmotionType)}
                className={`px-3 py-1.5 text-xs rounded-full transition-colors flex items-center gap-1.5 ${
                  selectedEmotion === emotion
                    ? `${config.color} text-white`
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                <config.icon size={12} />
                {config.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Emotion Timeline */}
      <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
        <h4 className="text-sm font-medium text-gray-400 mb-3">Emotional Arc</h4>
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-700 rounded transform -translate-y-1/2" />
          
          {/* Emotion Nodes */}
          <div className="relative flex justify-between items-center py-4">
            {filteredScenes.map((scene, index) => {
              const config = EMOTION_CONFIG[scene.emotion];
              const position = (index / (filteredScenes.length - 1)) * 100;
              
              return (
                <motion.button
                  key={scene.id}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleSceneClick(scene)}
                  onMouseEnter={() => handleSceneMouseEnter(scene)}
                  onMouseLeave={handleSceneMouseLeave}
                  className="relative group"
                  style={{ left: `${position}%` }}
                >
                  {/* Emotion Node */}
                  <div
                    className={`w-4 h-4 rounded-full border-2 border-gray-900 transition-transform group-hover:scale-125 ${config.color}`}
                    style={{ backgroundColor: EMOTION_COLORS[scene.emotion] }}
                  />
                  
                  {/* Hover Tooltip */}
                  <AnimatePresence>
                    {hoveredScene?.id === scene.id && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-3 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-10"
                      >
                        <div className="text-xs font-medium text-white mb-1 truncate">
                          {scene.title || 'Untitled Scene'}
                        </div>
                        <div className="flex items-center gap-2">
                          <config.icon size={12} className={config.color.replace('bg-', 'text-')} />
                          <span className="text-xs text-gray-400">{config.label}</span>
                          <span className="text-xs text-gray-500 ml-auto">
                            I: {config.intensity}
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Emotion Distribution */}
      <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
        <h4 className="text-sm font-medium text-gray-400 mb-3">Emotion Distribution</h4>
        <div className="space-y-2">
          {Object.entries(emotionCounts).map(([emotion, count]) => {
            const config = EMOTION_CONFIG[emotion as EmotionType];
            const percentage = (count / scenes.length) * 100;
            
            return (
              <div key={emotion} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <config.icon size={12} className={config.color.replace('bg-', 'text-')} />
                    <span className="text-gray-400">{config.label}</span>
                  </div>
                  <span className="text-gray-500">{count} ({percentage.toFixed(0)}%)</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full ${config.color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scene List with Emotions */}
      <div>
        <h4 className="text-sm font-medium text-gray-400 mb-2">Scene Emotions</h4>
        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
          {filteredScenes.map((scene, index) => {
            const config = EMOTION_CONFIG[scene.emotion];
            return (
              <button
                key={scene.id}
                onClick={() => handleSceneClick(scene)}
                className="w-full p-3 text-left rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Scene {index + 1}</span>
                      <span className="font-medium text-white text-sm truncate">
                        {scene.title || 'Untitled Scene'}
                      </span>
                    </div>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${config.color} text-white text-xs`}
                  >
                    <config.icon size={12} />
                    {config.label}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
