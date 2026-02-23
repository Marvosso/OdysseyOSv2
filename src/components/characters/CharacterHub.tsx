'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Crown, Shield, Heart, BookOpen, Sparkles, AlertCircle, Search, UserPlus, X, ChevronDown, ChevronUp } from 'lucide-react';
import CharacterForm from './CharacterForm';
import CharacterCard from './CharacterCard';
import { StoryStorage } from '@/lib/storage/storyStorage';
import { CharacterDetector } from '@/lib/import/importPipeline';
import type { Character, Story, Scene } from '@/types/story';

/** Fallback: find repeated capitalized name-like phrases in text (catches names the strict detector may miss) */
function detectNamesFromText(text: string): Array<{ name: string; occurrences: number }> {
  const skip = new Set([
    'the', 'and', 'but', 'for', 'nor', 'or', 'so', 'yet', 'when', 'where', 'what', 'who', 'why', 'how',
    'this', 'that', 'with', 'from', 'have', 'has', 'had', 'been', 'were', 'said', 'says', 'asked',
  ]);
  const nameLike = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g;
  const count = new Map<string, number>();
  let m;
  while ((m = nameLike.exec(text)) !== null) {
    const name = m[1].trim();
    if (name.length < 2 || name.length > 40) continue;
    const first = name.split(/\s+/)[0].toLowerCase();
    if (skip.has(first)) continue;
    count.set(name, (count.get(name) || 0) + 1);
  }
  return Array.from(count.entries())
    .filter(([, n]) => n >= 2)
    .map(([name, occurrences]) => ({ name, occurrences }))
    .sort((a, b) => b.occurrences - a.occurrences)
    .slice(0, 30);
}

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
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<LocalCharacter | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dismissedDetected, setDismissedDetected] = useState<Set<string>>(() => new Set());
  const [panelsCollapsed, setPanelsCollapsed] = useState(false);

  // Load scenes and characters from StoryStorage on mount, storage change, and when tab becomes visible
  // Use both loadScenes() and story.scenes so we get content regardless of which key was last written
  useEffect(() => {
    const load = () => {
      const fromScenesKey = StoryStorage.loadScenes();
      const story = StoryStorage.loadStory();
      const fromStory = story?.scenes ?? [];
      const combined = fromScenesKey?.length ? fromScenesKey : fromStory;
      setScenes(Array.isArray(combined) ? combined : []);
      const saved = StoryStorage.loadCharacters();
      const converted: LocalCharacter[] = saved.map(convertToLocalCharacter);
      setCharacters(converted);
    };

    const onVisible = () => { if (document.visibilityState === 'visible') load(); };

    load();
    window.addEventListener('storage', load);
    document.addEventListener('visibilitychange', onVisible);
    const interval = setInterval(load, 60000);
    return () => {
      window.removeEventListener('storage', load);
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(interval);
    };
  }, []);

  // Save characters to StoryStorage whenever they change (no storage event - avoids same-tab reload overwriting state)
  useEffect(() => {
    const storyChars = characters.map(convertToStoryCharacter);
    StoryStorage.saveCharacters(storyChars);
  }, [characters]);

  const handleSaveCharacter = (char: LocalCharacter) => {
    const nextId = char.id || `char-${Date.now()}`;
    const withId = { ...char, id: nextId };
    const exists = characters.some((c) => c.id === nextId);
    const next = exists
      ? characters.map((c) => (c.id === nextId ? withId : c))
      : [...characters, withId];
    setCharacters(next);
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

  // Detect character names from current story scenes (exclude already-added and dismissed)
  const detectedFromStory = useMemo(() => {
    if (!scenes?.length) return [];
    const lines = scenes.flatMap((s) => (s.content || '').split(/\r?\n/).filter(Boolean));
    const text = scenes.map((s) => s.content || '').join('\n');
    if (!text.trim()) return [];
    const existingNames = new Set(characters.map((c) => c.name.toLowerCase()));
    const isExcluded = (name: string) =>
      existingNames.has(name.toLowerCase()) || dismissedDetected.has(name.toLowerCase());

    const strict = CharacterDetector.detectCharacters(lines, text)
      .filter((d) => !isExcluded(d.name))
      .map((d) => ({ name: d.name, confidence: d.confidence, occurrences: d.occurrences }));

    const fallback = detectNamesFromText(text)
      .filter((d) => !isExcluded(d.name))
      .map((d) => ({ name: d.name, confidence: 0.5, occurrences: d.occurrences }));

    const byName = new Map<string, { name: string; confidence: number; occurrences: number }>();
    for (const d of fallback) {
      if (!byName.has(d.name.toLowerCase())) byName.set(d.name.toLowerCase(), d);
    }
    for (const d of strict) {
      const key = d.name.toLowerCase();
      const existing = byName.get(key);
      if (!existing || d.confidence >= existing.confidence) {
        byName.set(key, d);
      }
    }
    return Array.from(byName.values())
      .sort((a, b) => b.confidence - a.confidence || b.occurrences - a.occurrences)
      .slice(0, 30);
  }, [scenes, characters, dismissedDetected]);

  const handleConfirmDetected = (d: { name: string; occurrences: number }) => {
    const newChar: LocalCharacter = {
      id: `char-${Date.now()}`,
      name: d.name,
      role: 'supporting',
      age: 0,
      appearance: `Detected in story (${d.occurrences} occurrence${d.occurrences !== 1 ? 's' : ''}). Add description and details.`,
      personality: '',
      background: '',
      motivation: '',
      flaw: '',
      arcStatus: 'unstarted',
    };
    setCharacters((prev) => [...prev, newChar]);
    setSelectedCharacter(newChar);
    setIsFormVisible(true);
  };

  const handleDismissDetected = (name: string) => {
    setDismissedDetected((prev) => new Set(prev).add(name.toLowerCase()));
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Users className="w-6 h-6 text-purple-500 dark:text-purple-400" />
          Character Hub
        </h2>
        <button
          type="button"
          onClick={() => setPanelsCollapsed((c) => !c)}
          className="md:hidden flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm"
        >
          {panelsCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          {panelsCollapsed ? 'Show stats & prompts' : 'Hide panels'}
        </button>
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

      <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 transition-all duration-200 ${panelsCollapsed ? 'hidden md:grid' : ''}`}>
        <div className="p-4 bg-purple-100 dark:bg-purple-900/20 border border-purple-300 dark:border-purple-500/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Protagonists</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{roleCounts.protagonist}</div>
        </div>

        <div className="p-4 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-500/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Antagonists</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{roleCounts.antagonist}</div>
        </div>

        <div className="p-4 bg-blue-100 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-500/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Supporting</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{roleCounts.supporting}</div>
        </div>

        <div className="p-4 bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-500/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Mentors</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{roleCounts.mentor}</div>
        </div>
      </div>

      <div className={`relative ${panelsCollapsed ? 'hidden md:block' : ''}`}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search characters..."
          className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-transparent rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {/* Detected from story - collapsible on mobile */}
      {detectedFromStory.length > 0 && !panelsCollapsed && (
        <div className="p-4 bg-purple-50 dark:bg-gray-800/60 border border-purple-300 dark:border-purple-500/30 rounded-lg">
          <h3 className="text-sm font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4" />
            Detected from your story
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
            Names found in your scenes that aren’t in your character list. Confirm to add and edit details.
          </p>
          <div className="flex flex-wrap gap-2">
            {detectedFromStory.map((d) => (
              <div
                key={d.name}
                className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg group"
              >
                <span className="font-medium text-gray-900 dark:text-white">{d.name}</span>
                <span className="text-xs text-gray-500 dark:text-gray-500">
                  {d.occurrences}× {d.confidence != null ? `· ${Math.round(d.confidence * 100)}%` : ''}
                </span>
                <div className="flex items-center gap-1 ml-1">
                  <button
                    onClick={() => handleConfirmDetected(d)}
                    className="p-1.5 rounded bg-purple-600 hover:bg-purple-500 text-white transition-colors"
                    title="Add as character and edit details"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDismissDetected(d.name)}
                    className="p-1.5 rounded text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    title="Dismiss (not a character)"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence>
        {isFormVisible && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-6 bg-white dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg dark:shadow-none"
          >
            <CharacterForm
              key={selectedCharacter?.id ?? 'new'}
              character={selectedCharacter ?? {
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
        <div className="p-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-center border border-gray-200 dark:border-transparent">
          <Users className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-3" />
          <p className="text-gray-600 dark:text-gray-400">Create characters to track their arcs</p>
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
