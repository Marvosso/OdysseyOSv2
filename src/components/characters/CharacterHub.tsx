'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Crown, Shield, Heart, BookOpen, Sparkles, AlertCircle, Search } from 'lucide-react';
import CharacterForm from './CharacterForm';
import CharacterCard from './CharacterCard';
import { StoryStorage } from '@/lib/storage/storyStorage';
import type { Character } from '@/types/story';

// Map Character type from story to local interface
interface LocalCharacter {
  id: string;
  name: string;
  role: 'protagonist' | 'antagonist' | 'supporting' | 'mentor' | 'love-interest' | 'comic-relief' | 'other';
  age: number;
  appearance: string;
  personality: string;
  background: string;
  motivation: string;
  flaw: string;
  arcStatus: 'unstarted' | 'beginning' | 'middle' | 'complete';
}

// Extended Character type that includes additional properties stored in metadata
interface ExtendedCharacter extends Character {
  role?: 'protagonist' | 'antagonist' | 'supporting' | 'mentor' | 'love-interest' | 'comic-relief' | 'other';
  age?: number;
  personality?: string;
  background?: string;
  motivation?: string;
  flaw?: string;
  arcStatus?: 'unstarted' | 'beginning' | 'middle' | 'complete';
}

// Convert Character from story type to local type
function convertToLocalCharacter(char: Character | ExtendedCharacter): LocalCharacter {
  const extended = char as ExtendedCharacter;
  return {
    id: char.id,
    name: char.name,
    role: extended.role || 'supporting',
    age: extended.age || 0,
    appearance: char.description || '',
    personality: extended.personality || '',
    background: extended.background || '',
    motivation: extended.motivation || '',
    flaw: extended.flaw || '',
    arcStatus: extended.arcStatus || 'unstarted',
  };
}

// Convert local character back to story Character type
function convertToStoryCharacter(char: LocalCharacter): ExtendedCharacter {
  return {
    id: char.id,
    name: char.name,
    description: char.appearance || '',
    goals: [],
    flaws: [],
    relationships: [],
    // Store additional properties for persistence
    role: char.role,
    age: char.age,
    personality: char.personality,
    background: char.background,
    motivation: char.motivation,
    flaw: char.flaw,
    arcStatus: char.arcStatus,
  };
}

export default function CharacterHub() {
  const [characters, setCharacters] = useState<LocalCharacter[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<LocalCharacter | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Load characters from StoryStorage on mount and when storage changes
  useEffect(() => {
    const loadCharacters = () => {
      const saved = StoryStorage.loadCharacters();
      const converted: LocalCharacter[] = saved.map(convertToLocalCharacter);
      setCharacters(converted);
    };

    loadCharacters();

    // Listen for storage changes (when import saves)
    const handleStorageChange = () => {
      loadCharacters();
    };

    window.addEventListener('storage', handleStorageChange);
    // Also check periodically for changes (for same-tab updates)
    // Use longer interval to reduce interference with navigation
    const interval = setInterval(loadCharacters, 5000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Save characters to StoryStorage whenever they change
  useEffect(() => {
    const storyChars = characters.map(convertToStoryCharacter);
    StoryStorage.saveCharacters(storyChars);
    // Trigger storage event to notify other tabs/components
    window.dispatchEvent(new Event('storage'));
  }, [characters]);

  const handleSaveCharacter = (char: LocalCharacter) => {
    if (char.id) {
      setCharacters(characters.map(c => c.id === char.id ? char : c));
    } else {
      setCharacters([...characters, { ...char, id: `char-${Date.now()}` }]);
    }
    setIsFormVisible(false);
    setSelectedCharacter(null);
  };

  const handleDeleteCharacter = (id: string) => {
    setCharacters(characters.filter(c => c.id !== id));
  };

  const handleEditCharacter = (char: LocalCharacter) => {
    setSelectedCharacter(char);
    setIsFormVisible(true);
  };

  const filteredCharacters = characters.filter(char =>
    char.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    char.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const roleCounts = {
    protagonist: characters.filter(c => c.role === 'protagonist').length,
    antagonist: characters.filter(c => c.role === 'antagonist').length,
    supporting: characters.filter(c => c.role === 'supporting').length,
    mentor: characters.filter(c => c.role === 'mentor').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Users className="w-6 h-6 text-purple-400" />
          Character Hub
        </h2>
        <button
          onClick={() => {
            setSelectedCharacter({
              id: '',
              name: '',
              role: 'supporting',
              age: 0,
              appearance: '',
              personality: '',
              background: '',
              motivation: '',
              flaw: '',
              arcStatus: 'unstarted'
            });
            setIsFormVisible(true);
          }}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Character
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-gray-400">Protagonists</span>
          </div>
          <div className="text-2xl font-bold text-white">{roleCounts.protagonist}</div>
        </div>

        <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span className="text-sm text-gray-400">Antagonists</span>
          </div>
          <div className="text-2xl font-bold text-white">{roleCounts.antagonist}</div>
        </div>

        <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-gray-400">Supporting</span>
          </div>
          <div className="text-2xl font-bold text-white">{roleCounts.supporting}</div>
        </div>

        <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-green-400" />
            <span className="text-sm text-gray-400">Mentors</span>
          </div>
          <div className="text-2xl font-bold text-white">{roleCounts.mentor}</div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search characters..."
          className="w-full bg-gray-800 text-white rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <AnimatePresence>
        {isFormVisible && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-6 bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-lg"
          >
            <CharacterForm
              character={selectedCharacter || {
                id: '',
                name: '',
                role: 'supporting',
                age: 0,
                appearance: '',
                personality: '',
                background: '',
                motivation: '',
                flaw: '',
                arcStatus: 'unstarted'
              }}
              onSave={handleSaveCharacter}
              onCancel={() => {
                setIsFormVisible(false);
                setSelectedCharacter(null);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {filteredCharacters.length === 0 ? (
        <div className="p-12 bg-gray-800/50 rounded-lg text-center">
          <Users className="w-12 h-12 mx-auto text-gray-600 mb-3" />
          <p className="text-gray-400">Create characters to track their arcs</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredCharacters.map((character) => (
              <CharacterCard
                key={character.id}
                character={character}
                onUpdate={(char) => setCharacters(characters.map(c => c.id === char.id ? char : c))}
                onDelete={() => handleDeleteCharacter(character.id)}
                onEdit={() => handleEditCharacter(character)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
