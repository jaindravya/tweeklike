import { useState, useEffect, useCallback } from 'react';
import { THEMES, type Theme } from '../themes';

const STORAGE_KEY = 'tweeklike-theme';

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  for (const [key, value] of Object.entries(theme.vars)) {
    root.style.setProperty(key, value);
  }
}

export function useTheme() {
  const [themeId, setThemeId] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved && THEMES.some((t) => t.id === saved) ? saved : 'neutral';
  });

  const theme = THEMES.find((t) => t.id === themeId) ?? THEMES[0];

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(STORAGE_KEY, theme.id);
  }, [theme]);

  const setTheme = useCallback((id: string) => {
    setThemeId(id);
  }, []);

  return { theme, setTheme, themes: THEMES };
}
