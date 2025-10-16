import React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
  variant?: 'button' | 'dropdown';
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  showLabel = false,
  variant = 'button',
}) => {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const getIcon = () => {
    if (theme === 'system') {
      return <Monitor className="w-4 h-4" />;
    }
    return resolvedTheme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />;
  };

  const getLabel = () => {
    if (theme === 'system') {
      return 'System';
    }
    return resolvedTheme === 'dark' ? 'Dark' : 'Light';
  };

  if (variant === 'dropdown') {
    return (
      <div className={`relative group ${className}`}>
        <button
          className="flex items-center space-x-2 p-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Theme options"
          aria-expanded="false"
        >
          {getIcon()}
          {showLabel && <span className="text-sm">{getLabel()}</span>}
        </button>

        <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
          <button
            onClick={() => setTheme('light')}
            className={`w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
              theme === 'light' ? 'bg-gray-100 dark:bg-gray-700 text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'
            }`}
          >
            <Sun className="w-4 h-4" />
            <span>Light</span>
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
              theme === 'dark' ? 'bg-gray-100 dark:bg-gray-700 text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'
            }`}
          >
            <Moon className="w-4 h-4" />
            <span>Dark</span>
          </button>
          <button
            onClick={() => setTheme('system')}
            className={`w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
              theme === 'system' ? 'bg-gray-100 dark:bg-gray-700 text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>System</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      className={`flex items-center space-x-2 p-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 ${className}`}
      aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Current theme: ${getLabel()}. Click to toggle.`}
    >
      {getIcon()}
      {showLabel && <span className="text-sm">{getLabel()}</span>}
    </button>
  );
};

export default ThemeToggle;