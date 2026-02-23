'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { Moon, Sun, Monitor } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ThemeToggle() {
  const { theme, setTheme, resolved } = useTheme();
  const isDark = resolved === 'dark';

  const options: { value: 'light' | 'dark' | 'system'; icon: typeof Sun; label: string }[] = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'system', icon: Monitor, label: 'System' },
  ];

  return (
    <div className="flex items-center gap-1 p-1 rounded-lg bg-gray-200/80 dark:bg-white/5 border border-gray-300 dark:border-gray-700/50">
      {options.map(({ value, icon: Icon, label }) => (
        <motion.button
          key={value}
          type="button"
          onClick={() => setTheme(value)}
          className={`relative flex items-center justify-center w-9 h-9 rounded-md transition-colors ${
            theme === value
              ? 'text-white'
              : 'text-gray-600 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          title={label}
          aria-label={`Theme: ${label}`}
        >
          {theme === value && (
            <motion.span
              layoutId="theme-toggle-bg"
              className="absolute inset-0 bg-purple-600 rounded-md"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10">
            <Icon className="w-4 h-4" />
          </span>
        </motion.button>
      ))}
    </div>
  );
}
