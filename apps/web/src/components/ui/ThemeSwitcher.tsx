import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme, ThemeMode } from '@/hooks/useTheme';
import clsx from 'clsx';

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'system', label: 'System', icon: Monitor },
  { value: 'dark', label: 'Dark', icon: Moon },
];

interface ThemeSwitcherProps {
  variant?: 'segmented' | 'dropdown' | 'icons';
  size?: 'sm' | 'md';
  className?: string;
}

export function ThemeSwitcher({ variant = 'segmented', size = 'md', className }: ThemeSwitcherProps) {
  const { mode, setMode } = useTheme();

  if (variant === 'icons') {
    return (
      <div className={clsx('flex items-center gap-1', className)}>
        {THEME_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isActive = mode === option.value;
          return (
            <button
              key={option.value}
              onClick={() => setMode(option.value)}
              className={clsx(
                'p-2 rounded-lg transition-colors',
                isActive
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                  : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700'
              )}
              title={option.label}
            >
              <Icon className={clsx(size === 'sm' ? 'w-4 h-4' : 'w-5 h-5')} />
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === 'dropdown') {
    const CurrentIcon = THEME_OPTIONS.find(o => o.value === mode)?.icon || Monitor;
    return (
      <div className={clsx('relative group', className)}>
        <button className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
          <CurrentIcon className={clsx(size === 'sm' ? 'w-4 h-4' : 'w-5 h-5')} />
        </button>
        <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 py-1 z-50 hidden group-hover:block">
          {THEME_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                onClick={() => setMode(option.value)}
                className={clsx(
                  'w-full px-3 py-2 text-left flex items-center gap-2 text-sm transition-colors',
                  mode === option.value
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                )}
              >
                <Icon className="w-4 h-4" />
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Default: segmented control
  return (
    <div className={clsx(
      'inline-flex items-center rounded-lg p-1 bg-neutral-100 dark:bg-neutral-700',
      className
    )}>
      {THEME_OPTIONS.map((option) => {
        const Icon = option.icon;
        const isActive = mode === option.value;
        return (
          <button
            key={option.value}
            onClick={() => setMode(option.value)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150',
              isActive
                ? 'bg-white dark:bg-neutral-600 text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            )}
          >
            <Icon className={clsx(size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4')} />
            <span className={size === 'sm' ? 'hidden sm:inline' : ''}>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// Simple toggle button for quick access (keeps backward compatibility)
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, mode, setMode } = useTheme();
  
  const toggleTheme = () => {
    // If in system mode, switch to opposite of current resolved theme
    // Otherwise toggle between light and dark
    if (mode === 'system') {
      setMode(resolvedTheme === 'dark' ? 'light' : 'dark');
    } else {
      setMode(mode === 'dark' ? 'light' : 'dark');
    }
  };
  
  return (
    <button
      onClick={toggleTheme}
      className={clsx(
        'p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors',
        className
      )}
      title={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {resolvedTheme === 'dark' ? (
        <Sun className="w-5 h-5" />
      ) : (
        <Moon className="w-5 h-5" />
      )}
    </button>
  );
}
