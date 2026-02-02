/**
 * Keyboard Shortcuts Manager
 * 
 * Manages keyboard shortcuts, command palette, and vim keybindings
 */

export type ShortcutAction =
  | 'new-scene'
  | 'delete-scene'
  | 'next-scene'
  | 'prev-scene'
  | 'save'
  | 'export'
  | 'bold'
  | 'italic'
  | 'underline'
  | 'command-palette'
  | 'search'
  | 'focus-editor'
  | 'toggle-sidebar'
  | 'undo'
  | 'redo'
  | 'copy'
  | 'paste'
  | 'cut'
  | 'select-all'
  | 'find-replace'
  | 'go-to-line'
  | 'toggle-comment'
  | 'format-document'
  | 'increase-font'
  | 'decrease-font'
  | 'toggle-vim-mode';

export interface KeyboardShortcut {
  id: string;
  action: ShortcutAction;
  keys: string[]; // e.g., ['Ctrl', 'S'] or ['Cmd', 'K']
  description: string;
  category: 'navigation' | 'editing' | 'formatting' | 'view' | 'vim';
  defaultKeys: string[];
  customKeys?: string[];
}

export interface VimKeybinding {
  mode: 'normal' | 'insert' | 'visual';
  key: string;
  action: string;
  description: string;
}

const DEFAULT_SHORTCUTS: KeyboardShortcut[] = [
  // Navigation
  {
    id: 'next-scene',
    action: 'next-scene',
    keys: ['Ctrl', 'ArrowDown'],
    description: 'Next scene',
    category: 'navigation',
    defaultKeys: ['Ctrl', 'ArrowDown'],
  },
  {
    id: 'prev-scene',
    action: 'prev-scene',
    keys: ['Ctrl', 'ArrowUp'],
    description: 'Previous scene',
    category: 'navigation',
    defaultKeys: ['Ctrl', 'ArrowUp'],
  },
  {
    id: 'new-scene',
    action: 'new-scene',
    keys: ['Ctrl', 'N'],
    description: 'New scene',
    category: 'navigation',
    defaultKeys: ['Ctrl', 'N'],
  },
  {
    id: 'delete-scene',
    action: 'delete-scene',
    keys: ['Ctrl', 'Delete'],
    description: 'Delete scene',
    category: 'navigation',
    defaultKeys: ['Ctrl', 'Delete'],
  },
  {
    id: 'go-to-line',
    action: 'go-to-line',
    keys: ['Ctrl', 'G'],
    description: 'Go to line',
    category: 'navigation',
    defaultKeys: ['Ctrl', 'G'],
  },

  // Editing
  {
    id: 'save',
    action: 'save',
    keys: ['Ctrl', 'S'],
    description: 'Save',
    category: 'editing',
    defaultKeys: ['Ctrl', 'S'],
  },
  {
    id: 'undo',
    action: 'undo',
    keys: ['Ctrl', 'Z'],
    description: 'Undo',
    category: 'editing',
    defaultKeys: ['Ctrl', 'Z'],
  },
  {
    id: 'redo',
    action: 'redo',
    keys: ['Ctrl', 'Y'],
    description: 'Redo',
    category: 'editing',
    defaultKeys: ['Ctrl', 'Y'],
  },
  {
    id: 'copy',
    action: 'copy',
    keys: ['Ctrl', 'C'],
    description: 'Copy',
    category: 'editing',
    defaultKeys: ['Ctrl', 'C'],
  },
  {
    id: 'paste',
    action: 'paste',
    keys: ['Ctrl', 'V'],
    description: 'Paste',
    category: 'editing',
    defaultKeys: ['Ctrl', 'V'],
  },
  {
    id: 'cut',
    action: 'cut',
    keys: ['Ctrl', 'X'],
    description: 'Cut',
    category: 'editing',
    defaultKeys: ['Ctrl', 'X'],
  },
  {
    id: 'select-all',
    action: 'select-all',
    keys: ['Ctrl', 'A'],
    description: 'Select all',
    category: 'editing',
    defaultKeys: ['Ctrl', 'A'],
  },
  {
    id: 'find-replace',
    action: 'find-replace',
    keys: ['Ctrl', 'H'],
    description: 'Find and replace',
    category: 'editing',
    defaultKeys: ['Ctrl', 'H'],
  },

  // Formatting
  {
    id: 'bold',
    action: 'bold',
    keys: ['Ctrl', 'B'],
    description: 'Bold',
    category: 'formatting',
    defaultKeys: ['Ctrl', 'B'],
  },
  {
    id: 'italic',
    action: 'italic',
    keys: ['Ctrl', 'I'],
    description: 'Italic',
    category: 'formatting',
    defaultKeys: ['Ctrl', 'I'],
  },
  {
    id: 'underline',
    action: 'underline',
    keys: ['Ctrl', 'U'],
    description: 'Underline',
    category: 'formatting',
    defaultKeys: ['Ctrl', 'U'],
  },
  {
    id: 'format-document',
    action: 'format-document',
    keys: ['Shift', 'Alt', 'F'],
    description: 'Format document',
    category: 'formatting',
    defaultKeys: ['Shift', 'Alt', 'F'],
  },

  // View
  {
    id: 'command-palette',
    action: 'command-palette',
    keys: ['Ctrl', 'K'],
    description: 'Command palette',
    category: 'view',
    defaultKeys: ['Ctrl', 'K'],
  },
  {
    id: 'search',
    action: 'search',
    keys: ['Ctrl', 'F'],
    description: 'Search',
    category: 'view',
    defaultKeys: ['Ctrl', 'F'],
  },
  {
    id: 'focus-editor',
    action: 'focus-editor',
    keys: ['Ctrl', 'E'],
    description: 'Focus editor',
    category: 'view',
    defaultKeys: ['Ctrl', 'E'],
  },
  {
    id: 'toggle-sidebar',
    action: 'toggle-sidebar',
    keys: ['Ctrl', 'B'],
    description: 'Toggle sidebar',
    category: 'view',
    defaultKeys: ['Ctrl', 'B'],
  },
  {
    id: 'increase-font',
    action: 'increase-font',
    keys: ['Ctrl', '='],
    description: 'Increase font size',
    category: 'view',
    defaultKeys: ['Ctrl', '='],
  },
  {
    id: 'decrease-font',
    action: 'decrease-font',
    keys: ['Ctrl', '-'],
    description: 'Decrease font size',
    category: 'view',
    defaultKeys: ['Ctrl', '-'],
  },
  {
    id: 'toggle-vim-mode',
    action: 'toggle-vim-mode',
    keys: ['Ctrl', 'Shift', 'V'],
    description: 'Toggle Vim mode',
    category: 'view',
    defaultKeys: ['Ctrl', 'Shift', 'V'],
  },
];

const VIM_KEYBINDINGS: VimKeybinding[] = [
  // Normal mode
  { mode: 'normal', key: 'h', action: 'move-left', description: 'Move left' },
  { mode: 'normal', key: 'j', action: 'move-down', description: 'Move down' },
  { mode: 'normal', key: 'k', action: 'move-up', description: 'Move up' },
  { mode: 'normal', key: 'l', action: 'move-right', description: 'Move right' },
  { mode: 'normal', key: 'w', action: 'word-forward', description: 'Next word' },
  { mode: 'normal', key: 'b', action: 'word-backward', description: 'Previous word' },
  { mode: 'normal', key: '0', action: 'line-start', description: 'Start of line' },
  { mode: 'normal', key: '$', action: 'line-end', description: 'End of line' },
  { mode: 'normal', key: 'gg', action: 'document-start', description: 'Start of document' },
  { mode: 'normal', key: 'G', action: 'document-end', description: 'End of document' },
  { mode: 'normal', key: 'i', action: 'insert-mode', description: 'Enter insert mode' },
  { mode: 'normal', key: 'a', action: 'append-mode', description: 'Append after cursor' },
  { mode: 'normal', key: 'A', action: 'append-line-end', description: 'Append at line end' },
  { mode: 'normal', key: 'o', action: 'new-line-below', description: 'New line below' },
  { mode: 'normal', key: 'O', action: 'new-line-above', description: 'New line above' },
  { mode: 'normal', key: 'x', action: 'delete-char', description: 'Delete character' },
  { mode: 'normal', key: 'dd', action: 'delete-line', description: 'Delete line' },
  { mode: 'normal', key: 'yy', action: 'yank-line', description: 'Yank (copy) line' },
  { mode: 'normal', key: 'p', action: 'paste-after', description: 'Paste after' },
  { mode: 'normal', key: 'P', action: 'paste-before', description: 'Paste before' },
  { mode: 'normal', key: 'u', action: 'undo', description: 'Undo' },
  { mode: 'normal', key: 'Ctrl+R', action: 'redo', description: 'Redo' },
  { mode: 'normal', key: 'v', action: 'visual-mode', description: 'Enter visual mode' },
  { mode: 'normal', key: 'V', action: 'visual-line-mode', description: 'Visual line mode' },
  { mode: 'normal', key: '/', action: 'search-forward', description: 'Search forward' },
  { mode: 'normal', key: '?', action: 'search-backward', description: 'Search backward' },
  { mode: 'normal', key: 'n', action: 'next-match', description: 'Next match' },
  { mode: 'normal', key: 'N', action: 'prev-match', description: 'Previous match' },
  { mode: 'normal', key: 'Esc', action: 'normal-mode', description: 'Return to normal mode' },

  // Insert mode
  { mode: 'insert', key: 'Esc', action: 'normal-mode', description: 'Exit insert mode' },
  { mode: 'insert', key: 'Ctrl+[', action: 'normal-mode', description: 'Exit insert mode' },

  // Visual mode
  { mode: 'visual', key: 'Esc', action: 'normal-mode', description: 'Exit visual mode' },
  { mode: 'visual', key: 'd', action: 'delete-selection', description: 'Delete selection' },
  { mode: 'visual', key: 'y', action: 'yank-selection', description: 'Yank selection' },
];

class KeyboardManager {
  private shortcuts: Map<string, KeyboardShortcut> = new Map();
  private handlers: Map<ShortcutAction, (event: KeyboardEvent) => void> = new Map();
  private vimMode: boolean = false;
  private vimCurrentMode: 'normal' | 'insert' | 'visual' = 'normal';
  private isMac: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      this.loadShortcuts();
      this.attachListeners();
    }
  }

  /**
   * Load shortcuts from localStorage or use defaults
   */
  private loadShortcuts(): void {
    try {
      const stored = localStorage.getItem('odysseyos-keyboard-shortcuts');
      if (stored) {
        const customShortcuts = JSON.parse(stored) as KeyboardShortcut[];
        customShortcuts.forEach((shortcut) => {
          this.shortcuts.set(shortcut.id, shortcut);
        });
      } else {
        DEFAULT_SHORTCUTS.forEach((shortcut) => {
          this.shortcuts.set(shortcut.id, shortcut);
        });
      }
    } catch {
      DEFAULT_SHORTCUTS.forEach((shortcut) => {
        this.shortcuts.set(shortcut.id, shortcut);
      });
    }

    // Load vim mode preference
    const vimEnabled = localStorage.getItem('odysseyos-vim-mode') === 'true';
    this.vimMode = vimEnabled;
  }

  /**
   * Save shortcuts to localStorage
   */
  private saveShortcuts(): void {
    const shortcutsArray = Array.from(this.shortcuts.values());
    localStorage.setItem('odysseyos-keyboard-shortcuts', JSON.stringify(shortcutsArray));
  }

  /**
   * Attach keyboard event listeners
   */
  private attachListeners(): void {
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  /**
   * Normalize key names (Cmd vs Ctrl)
   */
  private normalizeKey(key: string): string {
    if (this.isMac && key === 'Ctrl') {
      return 'Cmd';
    }
    if (!this.isMac && key === 'Cmd') {
      return 'Ctrl';
    }
    return key;
  }

  /**
   * Check if keys match shortcut
   */
  private keysMatch(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
    const keys = shortcut.customKeys || shortcut.keys;
    const normalizedKeys = keys.map((k) => this.normalizeKey(k));

    const pressedKeys: string[] = [];
    if (event.ctrlKey || event.metaKey) {
      pressedKeys.push(this.isMac ? 'Cmd' : 'Ctrl');
    }
    if (event.shiftKey) {
      pressedKeys.push('Shift');
    }
    if (event.altKey) {
      pressedKeys.push('Alt');
    }

    const mainKey = event.key.length === 1 ? event.key.toUpperCase() : event.key;
    pressedKeys.push(mainKey);

    if (pressedKeys.length !== normalizedKeys.length) {
      return false;
    }

    return normalizedKeys.every((key, index) => {
      const pressed = pressedKeys[index];
      return key === pressed || (key === 'Ctrl' && pressed === 'Cmd') || (key === 'Cmd' && pressed === 'Ctrl');
    });
  }

  /**
   * Handle keydown events
   */
  private handleKeyDown(event: KeyboardEvent): void {
    // Ignore if typing in input/textarea
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      // Handle vim mode in editor
      if (this.vimMode && target.isContentEditable) {
        this.handleVimKey(event);
        return;
      }
      // Don't handle shortcuts in inputs unless it's a special case
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }
    }

    // Check all shortcuts
    for (const shortcut of this.shortcuts.values()) {
      if (this.keysMatch(event, shortcut)) {
        event.preventDefault();
        const handler = this.handlers.get(shortcut.action);
        if (handler) {
          handler(event);
        }
        return;
      }
    }
  }

  /**
   * Handle Vim keybindings
   */
  private handleVimKey(event: KeyboardEvent): void {
    const key = event.key;
    const binding = VIM_KEYBINDINGS.find(
      (b) => b.mode === this.vimCurrentMode && b.key === key
    );

    if (binding) {
      event.preventDefault();
      const handler = this.handlers.get(binding.action as ShortcutAction);
      if (handler) {
        handler(event);
      }
    }
  }

  /**
   * Register a handler for a shortcut action
   */
  on(action: ShortcutAction, handler: (event: KeyboardEvent) => void): void {
    this.handlers.set(action, handler);
  }

  /**
   * Unregister a handler
   */
  off(action: ShortcutAction): void {
    this.handlers.delete(action);
  }

  /**
   * Get all shortcuts
   */
  getShortcuts(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values());
  }

  /**
   * Get shortcuts by category
   */
  getShortcutsByCategory(category: KeyboardShortcut['category']): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values()).filter((s) => s.category === category);
  }

  /**
   * Update a shortcut
   */
  updateShortcut(id: string, keys: string[]): void {
    const shortcut = this.shortcuts.get(id);
    if (shortcut) {
      shortcut.customKeys = keys;
      this.shortcuts.set(id, shortcut);
      this.saveShortcuts();
    }
  }

  /**
   * Reset shortcut to default
   */
  resetShortcut(id: string): void {
    const shortcut = this.shortcuts.get(id);
    if (shortcut) {
      shortcut.customKeys = undefined;
      this.shortcuts.set(id, shortcut);
      this.saveShortcuts();
    }
  }

  /**
   * Reset all shortcuts
   */
  resetAllShortcuts(): void {
    DEFAULT_SHORTCUTS.forEach((shortcut) => {
      const existing = this.shortcuts.get(shortcut.id);
      if (existing) {
        existing.customKeys = undefined;
        existing.keys = shortcut.defaultKeys;
        this.shortcuts.set(existing.id, existing);
      }
    });
    this.saveShortcuts();
  }

  /**
   * Toggle Vim mode
   */
  toggleVimMode(): boolean {
    this.vimMode = !this.vimMode;
    localStorage.setItem('odysseyos-vim-mode', this.vimMode.toString());
    return this.vimMode;
  }

  /**
   * Get Vim mode status
   */
  isVimModeEnabled(): boolean {
    return this.vimMode;
  }

  /**
   * Set Vim mode
   */
  setVimMode(mode: 'normal' | 'insert' | 'visual'): void {
    this.vimCurrentMode = mode;
  }

  /**
   * Get current Vim mode
   */
  getVimMode(): 'normal' | 'insert' | 'visual' {
    return this.vimCurrentMode;
  }

  /**
   * Get Vim keybindings
   */
  getVimKeybindings(): VimKeybinding[] {
    return VIM_KEYBINDINGS;
  }

  /**
   * Format keys for display
   */
  formatKeys(keys: string[]): string {
    return keys
      .map((k) => {
        if (k === 'Cmd') return '⌘';
        if (k === 'Ctrl') return 'Ctrl';
        if (k === 'Shift') return '⇧';
        if (k === 'Alt') return '⌥';
        if (k === 'ArrowUp') return '↑';
        if (k === 'ArrowDown') return '↓';
        if (k === 'ArrowLeft') return '←';
        if (k === 'ArrowRight') return '→';
        return k;
      })
      .join(' + ');
  }
}

// Singleton instance
let keyboardManagerInstance: KeyboardManager | null = null;

export function getKeyboardManager(): KeyboardManager {
  if (typeof window === 'undefined') {
    // Return a mock for SSR
    return {} as KeyboardManager;
  }

  if (!keyboardManagerInstance) {
    keyboardManagerInstance = new KeyboardManager();
  }
  return keyboardManagerInstance;
}

export { VIM_KEYBINDINGS };
