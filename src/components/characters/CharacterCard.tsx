'use client';

import { motion } from 'framer-motion';
import { 
  User, 
  Crown, 
  Shield, 
  Heart, 
  BookOpen, 
  Sparkles, 
  AlertCircle,
  Edit,
  Trash2 
} from 'lucide-react';
import type { Character } from '@/types/characters';

interface CharacterCardProps {
  character: Character;
  onUpdate: (char: Character) => void;
  onDelete: () => void;
  onEdit: () => void;
}

export default function CharacterCard({ character, onUpdate, onDelete, onEdit }: CharacterCardProps) {
  const roleIcons = {
    protagonist: Crown,
    antagonist: AlertCircle,
    supporting: User,
    mentor: BookOpen,
    'love-interest': Heart,
    'comic-relief': Sparkles,
    other: User,
  };

  const RoleIcon = roleIcons[character.role] || User;

  const arcStatusColors = {
    unstarted: 'bg-gray-500/20 text-gray-400',
    beginning: 'bg-blue-500/20 text-blue-400',
    middle: 'bg-yellow-500/20 text-yellow-400',
    complete: 'bg-green-500/20 text-green-400',
  };

  const arcStatusLabels = {
    unstarted: 'Unstarted',
    beginning: 'Beginning',
    middle: 'Mid-Arc',
    complete: 'Complete',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg hover:border-purple-500/50 transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            character.role === 'protagonist' ? 'bg-purple-600' :
            character.role === 'antagonist' ? 'bg-red-600' :
            'bg-blue-600'
          }`}>
            <RoleIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-white font-medium">{character.name}</h3>
            <p className="text-xs text-gray-400 capitalize">{character.role}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            className="p-1 hover:bg-gray-700 rounded"
          >
            <Edit className="w-3 h-3 text-gray-400 hover:text-white" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 hover:bg-red-500/20 rounded"
          >
            <Trash2 className="w-3 h-3 text-gray-400 hover:text-red-400" />
          </button>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        {character.age > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-400">Age:</span>
            <span className="text-white">{character.age}</span>
          </div>
        )}

        {character.appearance && (
          <div className="text-gray-400 line-clamp-2" title={character.appearance}>
            {character.appearance}
          </div>
        )}

        {character.personality && (
          <div className="text-gray-400 line-clamp-2" title={character.personality}>
            {character.personality}
          </div>
        )}

        {character.background && (
          <div className="text-gray-400 line-clamp-2" title={character.background}>
            {character.background}
          </div>
        )}

        {character.motivation && (
          <div className="text-gray-400 line-clamp-2" title={character.motivation}>
            <span className="text-purple-400">Motivation:</span> {character.motivation}
          </div>
        )}

        {character.flaw && (
          <div className="text-gray-400 line-clamp-2" title={character.flaw}>
            <span className="text-red-400">Flaw:</span> {character.flaw}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 mt-2 border-t border-gray-700">
          <span className={`px-2 py-1 rounded-full text-xs ${arcStatusColors[character.arcStatus]}`}>
            {arcStatusLabels[character.arcStatus] || 'Unstarted'}
          </span>
          
          <div className="flex gap-1">
            <div className={`w-2 h-2 rounded-full ${
              character.arcStatus === 'complete' || character.arcStatus === 'middle' || character.arcStatus === 'beginning' ? 'bg-purple-500' : 'bg-gray-600'
            }`} />
            <div className={`w-2 h-2 rounded-full ${
              character.arcStatus === 'complete' || character.arcStatus === 'middle' ? 'bg-purple-500' : 'bg-gray-600'
            }`} />
            <div className={`w-2 h-2 rounded-full ${
              character.arcStatus === 'complete' ? 'bg-purple-500' : 'bg-gray-600'
            }`} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
