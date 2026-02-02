'use client';

/**
 * Shortcut Cheatsheet Modal
 * 
 * Displays all keyboard shortcuts in an organized modal
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard, Settings } from 'lucide-react';
import { getKeyboardManager, VIM_KEYBINDINGS } from '@/lib/shortcuts/keyboardManager';
import type { KeyboardShortcut } from '@/lib/shortcuts/keyboardManager';

interface ShortcutCheatsheetProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings?: () => void;
}

export default function ShortcutCheatsheet({
  isOpen,
  onClose,
  onOpenSettings,
}: ShortcutCheatsheetProps) {
  const [selectedCategory, setSelectedCategory] = useState<KeyboardShortcut['category'] | 'vim'>('navigation');
  const manager = getKeyboardManager();
  const shortcuts = manager.getShortcuts();
  const vimEnabled = manager.isVimModeEnabled();

  const categories: Array<{ id: KeyboardShortcut['category'] | 'vim'; label: string }> = [
    { id: 'navigation', label: 'Navigation' },
    { id: 'editing', label: 'Editing' },
    { id: 'formatting', label: 'Formatting' },
    { id: 'view', label: 'View' },
    ...(vimEnabled ? [{ id: 'vim' as const, label: 'Vim' }] : []),
  ];

  const getShortcutsForCategory = (category: KeyboardShortcut['category'] | 'vim'): Array<KeyboardShortcut | { id: string; keys: string[]; description: string; mode: string }> => {
    if (category === 'vim') {
      return VIM_KEYBINDINGS.map((binding) => ({
        id: `${binding.mode}-${binding.key}`,
        action: binding.action as any,
        keys: [binding.key],
        description: binding.description,
        category: 'vim' as const,
        defaultKeys: [binding.key],
        mode: binding.mode,
      }));
    }
    return shortcuts.filter((s) => s.category === category);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-4xl bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <Keyboard className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-bold text-white">Keyboard Shortcuts</h2>
            </div>
            <div className="flex items-center gap-2">
              {onOpenSettings && (
                <button
                  onClick={onOpenSettings}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                  title="Customize Shortcuts"
                >
                  <Settings className="w-5 h-5 text-gray-400" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 p-4 border-b border-gray-700 overflow-x-auto">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  selectedCategory === category.id
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>

          {/* Shortcuts List */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getShortcutsForCategory(selectedCategory).map((shortcut) => (
                <div
                  key={shortcut.id}
                  className="p-4 bg-gray-700/50 rounded-lg border border-gray-600"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {manager.formatKeys(
                        ('customKeys' in shortcut && shortcut.customKeys) || shortcut.keys
                      )
                        .split(' + ')
                        .map((key, index, array) => (
                          <span key={index}>
                            <kbd className="px-2 py-1 bg-gray-600 text-white text-xs rounded border border-gray-500">
                              {key}
                            </kbd>
                            {index < array.length - 1 && (
                              <span className="mx-1 text-gray-400">+</span>
                            )}
                          </span>
                        ))}
                    </div>
                  </div>
                  {selectedCategory === 'vim' && 'mode' in shortcut && (
                    <div className="text-xs text-gray-400 mt-1">
                      Mode: {(shortcut as any).mode || 'normal'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-700 text-sm text-gray-400">
            <div className="flex items-center justify-between">
              <span>
                {vimEnabled ? 'Vim mode enabled' : 'Vim mode disabled'} • Press{' '}
                <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">Ctrl+Shift+V</kbd> to toggle
              </span>
              <span>
                Customize shortcuts in settings
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
