import { Moon, Sun } from 'lucide-react';

export function DarkModeToggle({ dark, toggle }: { dark: boolean; toggle: () => void }) {
  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="rounded-xl border border-gray-200 bg-white p-2 text-slate-600 shadow-sm transition hover:bg-gray-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
