'use client';

/**
 * Command Palette
 * 
 * Cmd+K command palette for quick actions
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  BookOpen,
  FileText,
  Users,
  Download,
  Upload,
  Settings,
  BarChart3,
  Sparkles,
  X,
} from 'lucide-react';
import { getKeyboardManager, type ShortcutAction } from '@/lib/shortcuts/keyboardManager';
import { useRouter } from 'next/navigation';

export interface Command {
  id: string;
  label: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  category: string;
  keywords: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const commands: Command[] = [
    {
      id: 'new-scene',
      label: 'New Scene',
      description: 'Create a new scene',
      icon: FileText,
      action: () => {
        // Trigger new scene action
        onClose();
      },
      category: 'Scenes',
      keywords: ['new', 'scene', 'create'],
    },
    {
      id: 'stories',
      label: 'Go to Stories',
      description: 'Navigate to stories page',
      icon: BookOpen,
      action: () => {
        router.push('/dashboard');
        onClose();
      },
      category: 'Navigation',
      keywords: ['stories', 'writing', 'edit'],
    },
    {
      id: 'characters',
      label: 'Go to Characters',
      description: 'Navigate to characters page',
      icon: Users,
      action: () => {
        router.push('/dashboard/characters');
        onClose();
      },
      category: 'Navigation',
      keywords: ['characters', 'people', 'cast'],
    },
    {
      id: 'outline',
      label: 'Go to Outline',
      description: 'Navigate to outline page',
      icon: FileText,
      action: () => {
        router.push('/dashboard/outline');
        onClose();
      },
      category: 'Navigation',
      keywords: ['outline', 'structure', 'plot'],
    },
    {
      id: 'export',
      label: 'Export Story',
      description: 'Export your story',
      icon: Download,
      action: () => {
        router.push('/dashboard/export');
        onClose();
      },
      category: 'Actions',
      keywords: ['export', 'download', 'save'],
    },
    {
      id: 'import',
      label: 'Import Story',
      description: 'Import a story file',
      icon: Upload,
      action: () => {
        router.push('/dashboard/import');
        onClose();
      },
      category: 'Actions',
      keywords: ['import', 'upload', 'load'],
    },
    {
      id: 'analytics',
      label: 'View Analytics',
      description: 'Open analytics dashboard',
      icon: BarChart3,
      action: () => {
        router.push('/dashboard/analytics');
        onClose();
      },
      category: 'Navigation',
      keywords: ['analytics', 'stats', 'progress'],
    },
    {
      id: 'ai-tools',
      label: 'AI Tools',
      description: 'Open AI tools',
      icon: Sparkles,
      action: () => {
        router.push('/dashboard/ai');
        onClose();
      },
      category: 'Navigation',
      keywords: ['ai', 'assistant', 'tools'],
    },
  ];

  const filteredCommands = query
    ? commands.filter((cmd) => {
        const searchTerm = query.toLowerCase();
        return (
          cmd.label.toLowerCase().includes(searchTerm) ||
          cmd.description?.toLowerCase().includes(searchTerm) ||
          cmd.keywords.some((kw) => kw.toLowerCase().includes(searchTerm))
        );
      })
    : commands;

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-start justify-center pt-32"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          className="w-full max-w-2xl mx-4 bg-gray-800 border border-gray-700 rounded-lg shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Input */}
          <div className="flex items-center gap-3 p-4 border-b border-gray-700">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              placeholder="Type a command or search..."
              className="flex-1 bg-transparent text-white placeholder-gray-500 focus:outline-none"
            />
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Commands List */}
          <div className="max-h-96 overflow-y-auto">
            {filteredCommands.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                No commands found
              </div>
            ) : (
              <div className="p-2">
                {filteredCommands.map((command, index) => {
                  const Icon = command.icon;
                  const isSelected = index === selectedIndex;

                  return (
                    <button
                      key={command.id}
                      onClick={command.action}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        isSelected
                          ? 'bg-purple-600 text-white'
                          : 'text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <div className="flex-1 text-left">
                        <div className="font-medium">{command.label}</div>
                        {command.description && (
                          <div className="text-sm opacity-75">{command.description}</div>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">{command.category}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-700 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <span>↑↓ Navigate</span>
              <span>↵ Select</span>
              <span>Esc Close</span>
            </div>
            <span>{filteredCommands.length} command{filteredCommands.length !== 1 ? 's' : ''}</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
