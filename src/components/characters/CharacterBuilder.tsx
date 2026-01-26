'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Target, 
  Heart, 
  Link as LinkIcon,
  Trash2,
  Save
} from 'lucide-react';
import type { Character, CharacterRelationship } from '@/types/story';

const generateId = (): string => {
  return `char-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

interface CharacterBuilderProps {
  character?: Character;
  onSave: (character: Character) => void;
  onDelete?: (characterId: string) => void;
}

export default function CharacterBuilder({ 
  character: initialCharacter,
  onSave,
  onDelete
}: CharacterBuilderProps) {
  const [character, setCharacter] = useState<Character>(
    initialCharacter || {
      id: generateId(),
      name: '',
      description: '',
      goals: [''],
      flaws: [''],
      relationships: []
    }
  );

  const [activeTab, setActiveTab] = useState<'basics' | 'goals' | 'flaws' | 'relationships'>('basics');

  const handleAddGoal = () => {
    setCharacter({
      ...character,
      goals: [...character.goals, '']
    });
  };

  const handleGoalChange = (index: number, value: string) => {
    const newGoals = [...character.goals];
    newGoals[index] = value;
    setCharacter({ ...character, goals: newGoals });
  };

  const handleRemoveGoal = (index: number) => {
    const newGoals = character.goals.filter((_, i) => i !== index);
    setCharacter({ ...character, goals: newGoals });
  };

  const handleAddFlaw = () => {
    setCharacter({
      ...character,
      flaws: [...character.flaws, '']
    });
  };

  const handleFlawChange = (index: number, value: string) => {
    const newFlaws = [...character.flaws];
    newFlaws[index] = value;
    setCharacter({ ...character, flaws: newFlaws });
  };

  const handleRemoveFlaw = (index: number) => {
    const newFlaws = character.flaws.filter((_, i) => i !== index);
    setCharacter({ ...character, flaws: newFlaws });
  };

  const handleAddRelationship = () => {
    setCharacter({
      ...character,
      relationships: [
        ...character.relationships,
        { characterId: '', relationship: '', intensity: 5 }
      ]
    });
  };

  const handleRelationshipChange = (index: number, field: keyof CharacterRelationship, value: string | number) => {
    const newRelationships = [...character.relationships];
    newRelationships[index] = { ...newRelationships[index], [field]: value };
    setCharacter({ ...character, relationships: newRelationships });
  };

  const handleRemoveRelationship = (index: number) => {
    const newRelationships = character.relationships.filter((_, i) => i !== index);
    setCharacter({ ...character, relationships: newRelationships });
  };

  return (
    <div className="bg-gray-800/30 rounded-xl border border-gray-700 overflow-hidden">
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <User className="text-purple-400" size={24} />
            </div>
            <input
              type="text"
              value={character.name}
              onChange={(e) => setCharacter({ ...character, name: e.target.value })}
              placeholder="Character Name"
              className="text-2xl font-bold bg-transparent text-white 
                       border-none outline-none placeholder-gray-500"
            />
          </div>
          <div className="flex items-center gap-2">
            {onDelete && (
              <button
                onClick={() => onDelete(character.id)}
                className="p-2 text-gray-500 hover:text-red-400 transition-colors"
              >
                <Trash2 size={18} />
              </button>
            )}
            <button
              onClick={() => onSave(character)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 
                       hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <Save size={16} />
              Save Character
            </button>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-700">
        <div className="flex">
          {[
            { id: 'basics', label: 'Basics', icon: User },
            { id: 'goals', label: 'Goals', icon: Target },
            { id: 'flaws', label: 'Flaws', icon: Heart },
            { id: 'relationships', label: 'Relationships', icon: LinkIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'basics' | 'goals' | 'flaws' | 'relationships')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 
                       text-sm font-medium transition-colors
                       ${activeTab === tab.id
                         ? 'text-purple-400 border-b-2 border-purple-400'
                         : 'text-gray-500 hover:text-gray-300'
                       }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {activeTab === 'basics' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Description
              </label>
              <textarea
                value={character.description}
                onChange={(e) => setCharacter({ ...character, description: e.target.value })}
                placeholder="Describe their appearance, personality, background..."
                className="w-full h-32 p-3 bg-gray-900/50 rounded-lg 
                         border border-gray-700 text-white 
                         placeholder-gray-500 resize-none
                         focus:border-purple-500 outline-none"
              />
            </div>
          </motion.div>
        )}

        {activeTab === 'goals' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-white">Character Goals</h3>
              <button
                onClick={handleAddGoal}
                className="px-3 py-1 bg-gray-800 hover:bg-gray-700 
                         text-gray-300 rounded-lg text-sm transition-colors"
              >
                + Add Goal
              </button>
            </div>
            <div className="space-y-3">
              {character.goals.map((goal, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Target className="text-green-400" size={16} />
                  <input
                    type="text"
                    value={goal}
                    onChange={(e) => handleGoalChange(index, e.target.value)}
                    placeholder="What does this character want?"
                    className="flex-1 p-2 bg-gray-900/50 rounded border 
                             border-gray-700 text-white placeholder-gray-500
                             focus:border-green-500 outline-none"
                  />
                  {character.goals.length > 1 && (
                    <button
                      onClick={() => handleRemoveGoal(index)}
                      className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'flaws' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-white">Character Flaws</h3>
              <button
                onClick={handleAddFlaw}
                className="px-3 py-1 bg-gray-800 hover:bg-gray-700 
                         text-gray-300 rounded-lg text-sm transition-colors"
              >
                + Add Flaw
              </button>
            </div>
            <div className="space-y-3">
              {character.flaws.map((flaw, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Heart className="text-red-400" size={16} />
                  <input
                    type="text"
                    value={flaw}
                    onChange={(e) => handleFlawChange(index, e.target.value)}
                    placeholder="What holds this character back?"
                    className="flex-1 p-2 bg-gray-900/50 rounded border 
                             border-gray-700 text-white placeholder-gray-500
                             focus:border-red-500 outline-none"
                  />
                  {character.flaws.length > 1 && (
                    <button
                      onClick={() => handleRemoveFlaw(index)}
                      className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'relationships' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-white">Relationships</h3>
              <button
                onClick={handleAddRelationship}
                className="px-3 py-1 bg-gray-800 hover:bg-gray-700 
                         text-gray-300 rounded-lg text-sm transition-colors"
              >
                + Add Relationship
              </button>
            </div>
            <div className="space-y-3">
              {character.relationships.map((rel, index) => (
                <div key={index} className="p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <LinkIcon className="text-purple-400" size={16} />
                      <span className="text-sm font-medium text-gray-400">Relationship {index + 1}</span>
                    </div>
                    {character.relationships.length > 0 && (
                      <button
                        onClick={() => handleRemoveRelationship(index)}
                        className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={rel.relationship}
                    onChange={(e) => handleRelationshipChange(index, 'relationship', e.target.value)}
                    placeholder="Describe the relationship (e.g., 'best friend', 'rival')"
                    className="w-full mb-2 p-2 bg-gray-800 rounded border 
                             border-gray-700 text-white placeholder-gray-500
                             focus:border-purple-500 outline-none text-sm"
                  />
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-400">Intensity:</label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={rel.intensity}
                      onChange={(e) => handleRelationshipChange(index, 'intensity', parseInt(e.target.value))}
                      className="flex-1 accent-purple-500"
                    />
                    <span className="text-sm text-white">{rel.intensity}/10</span>
                  </div>
                </div>
              ))}
              {character.relationships.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">
                  No relationships added yet. Click "+ Add Relationship" to start.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
