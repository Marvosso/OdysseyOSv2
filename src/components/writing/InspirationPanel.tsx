'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';

const PROMPTS = [
  'What does your protagonist want more than anything?',
  'Write the moment everything changes for your main character.',
  'Describe the setting using only one sense (sound, smell, touch).',
  'What is your antagonist afraid of?',
  'Add a line of dialogue that reveals character through subtext.',
  'Write a scene where two characters want opposite things.',
  'What small detail would make this scene feel real?',
  'How does the weather reflect the emotional tone?',
  'Give your character a flaw that gets in the way.',
  'What would your character never say out loud?',
  'Start a scene in the middle of action.',
  'Write a transition that skips time but keeps tension.',
  'What object in the scene could become a symbol?',
  'Add a moment of silence between two characters.',
  'What does your character notice that others miss?',
];

function pickRandom(arr: string[], exclude?: string): string {
  const filtered = exclude ? arr.filter((s) => s !== exclude) : arr;
  return filtered[Math.floor(Math.random() * filtered.length)];
}

interface InspirationPanelProps {
  defaultCollapsed?: boolean;
  className?: string;
}

export default function InspirationPanel({
  defaultCollapsed = false,
  className = '',
}: InspirationPanelProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [prompt, setPrompt] = useState(() => pickRandom(PROMPTS));

  const refresh = () => setPrompt((prev) => pickRandom(PROMPTS, prev));

  return (
    <motion.div
      layout
      className={`rounded-lg border border-gray-700/50 bg-gradient-to-br from-amber-500/5 to-orange-500/5 dark:from-amber-500/10 dark:to-orange-500/10 ${className}`}
    >
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center justify-between gap-2 p-3 text-left rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          Writing prompt
        </span>
        {collapsed ? (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        )}
      </button>
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-0">
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-2">
                {prompt}
              </p>
              <button
                type="button"
                onClick={refresh}
                className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                New prompt
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
