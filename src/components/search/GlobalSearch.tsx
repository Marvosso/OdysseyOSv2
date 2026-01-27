'use client';

/**
 * Global Search Component
 * 
 * Provides a command palette-style search interface with keyboard shortcut (Cmd/Ctrl + K)
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, FileText, Users, BookOpen, ArrowRight, Command } from 'lucide-react';
import { SearchIndex, type SearchResults } from '@/lib/search/searchIndex';
import { useRouter } from 'next/navigation';

export interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>({
    stories: [],
    scenes: [],
    characters: [],
    total: 0,
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Perform search
  useEffect(() => {
    if (!isOpen) return;

    const performSearch = () => {
      const searchResults = SearchIndex.search(query);
      setResults(searchResults);
      setSelectedIndex(0);
    };

    // Debounce search
    const timeoutId = setTimeout(performSearch, 150);
    return () => clearTimeout(timeoutId);
  }, [query, isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) return;

    const allResults = [
      ...results.stories,
      ...results.scenes,
      ...results.characters,
    ];

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, allResults.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (allResults[selectedIndex]) {
          handleResultClick(allResults[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [isOpen, results, selectedIndex, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current) {
      const selectedElement = resultsRef.current.querySelector(
        `[data-result-index="${selectedIndex}"]`
      );
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  // Handle result click
  const handleResultClick = useCallback((result: typeof results.stories[0]) => {
    // Navigate based on result type
    switch (result.type) {
      case 'story':
        router.push('/dashboard');
        break;
      case 'scene':
        router.push('/dashboard');
        // TODO: Scroll to scene or highlight it
        break;
      case 'character':
        router.push('/dashboard/characters');
        break;
    }
    onClose();
  }, [router, onClose]);

  // Get icon for result type
  const getResultIcon = (type: string) => {
    switch (type) {
      case 'story':
        return <BookOpen className="w-4 h-4" />;
      case 'scene':
        return <FileText className="w-4 h-4" />;
      case 'character':
        return <Users className="w-4 h-4" />;
      default:
        return null;
    }
  };

  // Get result type label
  const getResultTypeLabel = (type: string) => {
    switch (type) {
      case 'story':
        return 'Story';
      case 'scene':
        return 'Scene';
      case 'character':
        return 'Character';
      default:
        return '';
    }
  };

  if (!isOpen) return null;

  const allResults = [
    ...results.stories,
    ...results.scenes,
    ...results.characters,
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Search Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl mx-4 z-50"
          >
            <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-2xl overflow-hidden">
              {/* Search Input */}
              <div className="flex items-center gap-3 p-4 border-b border-gray-700">
                <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search stories, scenes, characters..."
                  className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-gray-500 text-lg"
                />
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <kbd className="px-2 py-1 bg-gray-700 rounded text-gray-300">
                    {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}
                  </kbd>
                  <span>+</span>
                  <kbd className="px-2 py-1 bg-gray-700 rounded text-gray-300">K</kbd>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 text-gray-400 hover:text-white transition-colors"
                  aria-label="Close search"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Results */}
              <div
                ref={resultsRef}
                className="max-h-[60vh] overflow-y-auto"
              >
                {query.trim().length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">Start typing to search...</p>
                  </div>
                ) : results.total === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    <p className="text-sm">No results found for "{query}"</p>
                  </div>
                ) : (
                  <div className="p-2">
                    {/* Stories */}
                    {results.stories.length > 0 && (
                      <div className="mb-4">
                        <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          Stories ({results.stories.length})
                        </div>
                        {results.stories.map((result, index) => {
                          const globalIndex = index;
                          return (
                            <button
                              key={result.id}
                              data-result-index={globalIndex}
                              onClick={() => handleResultClick(result)}
                              className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-3 ${
                                selectedIndex === globalIndex
                                  ? 'bg-purple-600/20 text-white'
                                  : 'text-gray-300 hover:bg-gray-700/50'
                              }`}
                            >
                              <div className="text-purple-400">{getResultIcon(result.type)}</div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{result.title}</div>
                                <div className="text-xs text-gray-500 mt-0.5">
                                  {getResultTypeLabel(result.type)}
                                </div>
                              </div>
                              <ArrowRight className="w-4 h-4 text-gray-500" />
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Scenes */}
                    {results.scenes.length > 0 && (
                      <div className="mb-4">
                        <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          Scenes ({results.scenes.length})
                        </div>
                        {results.scenes.map((result, index) => {
                          const globalIndex = results.stories.length + index;
                          return (
                            <button
                              key={result.id}
                              data-result-index={globalIndex}
                              onClick={() => handleResultClick(result)}
                              className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-3 ${
                                selectedIndex === globalIndex
                                  ? 'bg-purple-600/20 text-white'
                                  : 'text-gray-300 hover:bg-gray-700/50'
                              }`}
                            >
                              <div className="text-blue-400">{getResultIcon(result.type)}</div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{result.title}</div>
                                {result.content && (
                                  <div
                                    className="text-xs text-gray-500 mt-0.5 line-clamp-1"
                                    dangerouslySetInnerHTML={{
                                      __html: SearchIndex.highlightMatches(result.content, query),
                                    }}
                                  />
                                )}
                              </div>
                              <ArrowRight className="w-4 h-4 text-gray-500" />
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Characters */}
                    {results.characters.length > 0 && (
                      <div className="mb-4">
                        <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          Characters ({results.characters.length})
                        </div>
                        {results.characters.map((result, index) => {
                          const globalIndex = results.stories.length + results.scenes.length + index;
                          return (
                            <button
                              key={result.id}
                              data-result-index={globalIndex}
                              onClick={() => handleResultClick(result)}
                              className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-3 ${
                                selectedIndex === globalIndex
                                  ? 'bg-purple-600/20 text-white'
                                  : 'text-gray-300 hover:bg-gray-700/50'
                              }`}
                            >
                              <div className="text-green-400">{getResultIcon(result.type)}</div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{result.title}</div>
                                {result.content && (
                                  <div
                                    className="text-xs text-gray-500 mt-0.5 line-clamp-1"
                                    dangerouslySetInnerHTML={{
                                      __html: SearchIndex.highlightMatches(result.content, query),
                                    }}
                                  />
                                )}
                              </div>
                              <ArrowRight className="w-4 h-4 text-gray-500" />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              {query.trim().length > 0 && results.total > 0 && (
                <div className="px-4 py-2 border-t border-gray-700 text-xs text-gray-500 flex items-center justify-between">
                  <span>{results.total} result{results.total !== 1 ? 's' : ''} found</span>
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-gray-700 rounded">↑↓</kbd>
                      <span>Navigate</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-gray-700 rounded">Enter</kbd>
                      <span>Select</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-gray-700 rounded">Esc</kbd>
                      <span>Close</span>
                    </span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
