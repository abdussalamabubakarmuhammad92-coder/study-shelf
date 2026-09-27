import { useCallback, useEffect, useState } from 'react';

const DARK_KEY = 'dark_mode';

/** Persisted dark-mode toggle; toggles the `dark` class on <html>. */
export function useDarkMode(): [boolean, () => void] {
  const [dark, setDark] = useState<boolean>(() => {
    const stored = localStorage.getItem(DARK_KEY);
    if (stored !== null) return stored === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem(DARK_KEY, String(dark));
  }, [dark]);

  const toggle = useCallback(() => setDark((d) => !d), []);
  return [dark, toggle];
}
