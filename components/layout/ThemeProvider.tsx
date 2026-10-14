'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';
type Resolved = 'light' | 'dark';

interface ThemeContextValue {
  theme: ThemePreference;
  resolved: Resolved;
  setTheme: (t: ThemePreference) => void;
  toggle: () => void;
}

const STORAGE_KEY = 'terap-theme';
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/**
 * Inline script run before hydration so the first paint already has the right `dark` class.
 * Keep in sync with {@link applyTheme}.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('${STORAGE_KEY}');var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);document.documentElement.style.colorScheme=d?'dark':'light';}catch(e){}})();`;

function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function applyTheme(pref: ThemePreference): Resolved {
  const dark = pref === 'dark' || (pref === 'system' && systemPrefersDark());
  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  return dark ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Brand default is the light (green & white) theme; 'system' is opt-in.
  const [theme, setThemeState] = useState<ThemePreference>('light');
  const [resolved, setResolved] = useState<Resolved>('light');

  useEffect(() => {
    let stored: ThemePreference = 'light';
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === 'light' || v === 'dark' || v === 'system') stored = v;
    } catch {
      /* storage unavailable */
    }
    setThemeState(stored);
    setResolved(applyTheme(stored));

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      setThemeState((current) => {
        if (current === 'system') setResolved(applyTheme('system'));
        return current;
      });
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const setTheme = useCallback((t: ThemePreference) => {
    setThemeState(t);
    setResolved(applyTheme(t));
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = useCallback(() => {
    setTheme(resolved === 'dark' ? 'light' : 'dark');
  }, [resolved, setTheme]);

  const value = useMemo(() => ({ theme, resolved, setTheme, toggle }), [theme, resolved, setTheme, toggle]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
