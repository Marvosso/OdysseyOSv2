'use client';

/**
 * Shortcut Settings Panel
 * 
 * Allows users to customize keyboard shortcuts
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Keyboard, RotateCcw, Save, X } from 'lucide-react';
import { getKeyboardManager, type KeyboardShortcut } from '@/lib/shortcuts/keyboardManager';

interface ShortcutSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ShortcutSettings({ isOpen, onClose }: ShortcutSettingsProps) {
  const manager = getKeyboardManager();
  const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [capturingKeys, setCapturingKeys] = useState(false);
  const [capturedKeys, setCapturedKeys] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setShortcuts(manager.getShortcuts());
    }
  }, [isOpen, manager]);

  const handleStartEdit = (id: string) => {
    setEditingId(id);
    setCapturingKeys(true);
    setCapturedKeys([]);
  };

  const handleKeyCapture = (event: KeyboardEvent) => {
    if (!capturingKeys) return;

    event.preventDefault();
    event.stopPropagation();

    const keys: string[] = [];
    if (event.ctrlKey || event.metaKey) {
      keys.push(event.metaKey ? 'Cmd' : 'Ctrl');
    }
    if (event.shiftKey) {
      keys.push('Shift');
    }
    if (event.altKey) {
      keys.push('Alt');
    }

    const mainKey = event.key.length === 1 ? event.key.toUpperCase() : event.key;
    if (mainKey !== 'Control' && mainKey !== 'Meta' && mainKey !== 'Shift' && mainKey !== 'Alt') {
      keys.push(mainKey);
      setCapturedKeys(keys);
      setCapturingKeys(false);
    }
  };

  useEffect(() => {
    if (capturingKeys) {
      window.addEventListener('keydown', handleKeyCapture);
      return () => {
        window.removeEventListener('keydown', handleKeyCapture);
      };
    }
  }, [capturingKeys]);

  const handleSaveShortcut = (id: string) => {
    if (capturedKeys.length > 0) {
      manager.updateShortcut(id, capturedKeys);
      setShortcuts(manager.getShortcuts());
    }
    setEditingId(null);
    setCapturingKeys(false);
    setCapturedKeys([]);
  };

  const handleResetShortcut = (id: string) => {
    manager.resetShortcut(id);
    setShortcuts(manager.getShortcuts());
  };

  const handleResetAll = () => {
    if (confirm('Reset all shortcuts to defaults?')) {
      manager.resetAllShortcuts();
      setShortcuts(manager.getShortcuts());
    }
  };

  const getShortcutsByCategory = (category: KeyboardShortcut['category']) => {
    return shortcuts.filter((s) => s.category === category);
  };

  const categories: KeyboardShortcut['category'][] = ['navigation', 'editing', 'formatting', 'view'];

  if (!isOpen) return null;

  return (
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
            <h2 className="text-2xl font-bold text-white">Customize Shortcuts</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetAll}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg flex items-center gap-2 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset All
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {capturingKeys && (
            <div className="mb-4 p-4 bg-purple-600/20 border border-purple-500 rounded-lg">
              <p className="text-purple-300 font-medium">Press your desired key combination...</p>
            </div>
          )}

          {categories.map((category) => {
            const categoryShortcuts = getShortcutsByCategory(category);
            if (categoryShortcuts.length === 0) return null;

            return (
              <div key={category} className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-4 capitalize">{category}</h3>
                <div className="space-y-2">
                  {categoryShortcuts.map((shortcut) => {
                    const isEditing = editingId === shortcut.id;
                    const displayKeys = isEditing && capturedKeys.length > 0
                      ? capturedKeys
                      : shortcut.customKeys || shortcut.keys;

                    return (
                      <div
                        key={shortcut.id}
                        className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg border border-gray-600"
                      >
                        <div className="flex-1">
                          <div className="text-white font-medium">{shortcut.description}</div>
                          {shortcut.customKeys && (
                            <div className="text-xs text-gray-400 mt-1">
                              Default: {manager.formatKeys(shortcut.defaultKeys)}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            {manager.formatKeys(displayKeys)
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
                          {isEditing ? (
                            <button
                              onClick={() => handleSaveShortcut(shortcut.id)}
                              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
                            >
                              Save
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => handleStartEdit(shortcut.id)}
                                className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm transition-colors"
                              >
                                Edit
                              </button>
                              {shortcut.customKeys && (
                                <button
                                  onClick={() => handleResetShortcut(shortcut.id)}
                                  className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition-colors"
                                  title="Reset to default"
                                >
                                  Reset
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 text-sm text-gray-400">
          Click "Edit" on any shortcut to customize it. Press your desired key combination when editing.
        </div>
      </motion.div>
    </motion.div>
  );
}
