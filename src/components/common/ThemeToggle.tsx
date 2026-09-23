import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const ThemeToggle: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { theme, toggleTheme, setTheme } = useTheme();

  if (compact) {
    return (
      <button
        onClick={toggleTheme}
        aria-label="تبديل المظهر"
        title={theme === 'dark' ? 'الوضع النهاري (فاتح)' : 'الوضع الليلي (داكن)'}
        className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 text-gray-700 dark:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors shadow-xs"
      >
        {theme === 'dark' ? (
          <Sun className="h-4 w-4 text-amber-400" />
        ) : (
          <Moon className="h-4 w-4 text-indigo-600" />
        )}
      </button>
    );
  }

  return (
    <div className="inline-flex items-center rounded-xl bg-gray-100 dark:bg-zinc-800 p-1 border border-gray-200/80 dark:border-zinc-700/80">
      <button
        type="button"
        onClick={() => setTheme('light')}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
          theme === 'light'
            ? 'bg-white text-gray-900 shadow-xs'
            : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
        }`}
      >
        <Sun className="h-3.5 w-3.5 text-amber-500" />
        <span>فاتح (نهاري)</span>
      </button>
      <button
        type="button"
        onClick={() => setTheme('dark')}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
          theme === 'dark'
            ? 'bg-zinc-900 text-white shadow-xs'
            : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
        }`}
      >
        <Moon className="h-3.5 w-3.5 text-indigo-400" />
        <span>داكن (ليلي)</span>
      </button>
    </div>
  );
};
