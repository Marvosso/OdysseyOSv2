'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'odysseyos_theme';

interface ThemeContextValue {
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
  resolved: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';
  return 'dark'; // Light mode hidden for now — always use dark
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(getStoredTheme);
  const [resolved, setResolved] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    setResolved('dark');
    document.documentElement.setAttribute('data-theme', 'dark');
  }, [theme]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handle = () => {
      document.documentElement.setAttribute('data-theme', 'dark');
      setResolved('dark');
    };
    mq.addEventListener('change', handle);
    return () => mq.removeEventListener('change', handle);
  }, []);

  const setTheme = (mode: ThemeMode) => {
    setThemeState('dark'); // Ignore; light mode hidden
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolved }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
