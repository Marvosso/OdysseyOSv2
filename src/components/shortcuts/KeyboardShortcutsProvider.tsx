'use client';

/**
 * Keyboard Shortcuts Provider
 * 
 * Sets up global keyboard shortcuts and command palette
 */

import { useEffect, useState } from 'react';
import { getKeyboardManager } from '@/lib/shortcuts/keyboardManager';
import CommandPalette from './CommandPalette';
import ShortcutCheatsheet from './ShortcutCheatsheet';
import ShortcutSettings from './ShortcutSettings';

interface KeyboardShortcutsProviderProps {
  children: React.ReactNode;
  onAction?: (action: string, event: KeyboardEvent) => void;
}

// Export cheatsheet state for external access
export let openCheatsheet: (() => void) | null = null;
export let openSettings: (() => void) | null = null;

export default function KeyboardShortcutsProvider({
  children,
  onAction,
}: KeyboardShortcutsProviderProps) {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [cheatsheetOpen, setCheatsheetOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Expose functions globally
  useEffect(() => {
    openCheatsheet = () => setCheatsheetOpen(true);
    openSettings = () => setSettingsOpen(true);
    return () => {
      openCheatsheet = null;
      openSettings = null;
    };
  }, []);

  useEffect(() => {
    const manager = getKeyboardManager();

    // Register command palette shortcut
    manager.on('command-palette', () => {
      setCommandPaletteOpen(true);
    });

    // Register other shortcuts
    const actions: Array<{ action: string; handler: () => void }> = [
      { action: 'new-scene', handler: () => onAction?.('new-scene', {} as KeyboardEvent) },
      { action: 'delete-scene', handler: () => onAction?.('delete-scene', {} as KeyboardEvent) },
      { action: 'next-scene', handler: () => onAction?.('next-scene', {} as KeyboardEvent) },
      { action: 'prev-scene', handler: () => onAction?.('prev-scene', {} as KeyboardEvent) },
      { action: 'save', handler: () => onAction?.('save', {} as KeyboardEvent) },
      { action: 'export', handler: () => onAction?.('export', {} as KeyboardEvent) },
      { action: 'search', handler: () => onAction?.('search', {} as KeyboardEvent) },
      { action: 'focus-editor', handler: () => onAction?.('focus-editor', {} as KeyboardEvent) },
      { action: 'toggle-sidebar', handler: () => onAction?.('toggle-sidebar', {} as KeyboardEvent) },
      { action: 'bold', handler: () => onAction?.('bold', {} as KeyboardEvent) },
      { action: 'italic', handler: () => onAction?.('italic', {} as KeyboardEvent) },
      { action: 'underline', handler: () => onAction?.('underline', {} as KeyboardEvent) },
    ];

    actions.forEach(({ action, handler }) => {
      manager.on(action as any, handler);
    });

    // Global shortcut to open cheatsheet (Ctrl+Shift+?)
    const handleCheatsheetShortcut = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === '?') {
        e.preventDefault();
        setCheatsheetOpen(true);
      }
    };

    window.addEventListener('keydown', handleCheatsheetShortcut);

    return () => {
      actions.forEach(({ action }) => {
        manager.off(action as any);
      });
      window.removeEventListener('keydown', handleCheatsheetShortcut);
    };
  }, [onAction]);

  return (
    <>
      {children}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
      <ShortcutCheatsheet
        isOpen={cheatsheetOpen}
        onClose={() => setCheatsheetOpen(false)}
        onOpenSettings={() => {
          setCheatsheetOpen(false);
          setSettingsOpen(true);
        }}
      />
      <ShortcutSettings
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  );
}
