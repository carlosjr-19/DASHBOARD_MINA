import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`w-8 h-8 rounded-lg bg-gray-800/80 hover:bg-gray-700 border border-gray-700/60 flex items-center justify-center text-gray-300 hover:text-orange-400 transition-colors active:scale-95 ${className}`}
      title={isLight ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro'}
      aria-label={isLight ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro'}
    >
      {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
    </button>
  );
}
