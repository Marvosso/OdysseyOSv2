import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Dna, BarChart3, Heart, Zap, Users } from 'lucide-react';
import { analyzeStoryDNA, storyArchetypes } from '@/lib/data/storyArchetypes';

export default function StoryDNA({ story }: { story: any }) {
  const dna = useMemo(() => {
    if (!story?.scenes || !story?.characters) return null;
    return analyzeStoryDNA(story.scenes, story.characters);
  }, [story]);

  const matchedArchetype = useMemo(() => {
    if (!dna) return null;
    return storyArchetypes.find(a => 
      a.dnaSignature.emotionalPattern?.dominantEmotion === 
      dna.emotionalPattern.dominantEmotion
    ) || storyArchetypes[0];
  }, [dna]);

  if (!dna) {
    return (
      <div className="p-6 bg-gray-800/50 rounded-lg text-center">
        <Dna className="w-12 h-12 mx-auto text-gray-600 mb-2" />
        <p className="text-gray-400">Write more scenes to analyze your story DNA</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-white flex items-center gap-2">
          <Dna className="w-5 h-5 text-purple-400" />
          Story DNA
        </h3>
        {matchedArchetype && (
          <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">
            {matchedArchetype.name}
          </span>
        )}
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800/50 rounded-lg p-4 space-y-3"
      >
        <div className="flex items-center gap-2 text-gray-300 text-sm">
          <Heart className="w-4 h-4 text-red-400" />
          <span>Emotional Pattern</span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Dominant Emotion</span>
            <span className="text-white capitalize">{dna.emotionalPattern.dominantEmotion}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Emotional Range</span>
            <span className="text-white">{dna.emotionalPattern.emotionalRange}/10</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${dna.emotionalPattern.emotionalRange * 10}%` }}
              className="bg-red-500 h-2 rounded-full"
            />
          </div>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gray-800/50 rounded-lg p-4 space-y-3"
      >
        <div className="flex items-center gap-2 text-gray-300 text-sm">
          <BarChart3 className="w-4 h-4 text-blue-400" />
          <span>Structure</span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Pacing</span>
            <span className="text-white capitalize">{dna.structuralPattern.pacing}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Complexity</span>
            <span className="text-white">{dna.structuralPattern.complexity}/10</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${dna.structuralPattern.complexity * 10}%` }}
              className="bg-blue-500 h-2 rounded-full"
            />
          </div>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gray-800/50 rounded-lg p-4 space-y-3"
      >
        <div className="flex items-center gap-2 text-gray-300 text-sm">
          <Users className="w-4 h-4 text-green-400" />
          <span>Character Dynamics</span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Protagonist Focus</span>
            <span className="text-white">{dna.characterDynamics.protagonistFocus}%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Relationship Complexity</span>
            <span className="text-white">{dna.characterDynamics.relationshipComplexity}/10</span>
          </div>
        </div>
      </motion.div>

      {matchedArchetype && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-purple-900/20 border border-purple-500/20 rounded-lg p-4"
        >
          <div className="flex items-center gap-2 text-purple-300 text-sm mb-2">
            <Zap className="w-4 h-4" />
            <span>AI Insights</span>
          </div>
          <p className="text-gray-400 text-sm">{matchedArchetype.description}</p>
        </motion.div>
      )}
    </div>
  );
}
