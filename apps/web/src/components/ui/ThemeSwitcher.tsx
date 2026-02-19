import { useRef, useState, useEffect } from 'react';
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

function ThemeDropdown({ mode, setMode, CurrentIcon, size, className }: {
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  CurrentIcon: typeof Sun;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (open) {
      const idx = THEME_OPTIONS.findIndex(o => o.value === mode);
      setFocusedIndex(idx >= 0 ? idx : 0);
    }
  }, [open, mode]);

  useEffect(() => {
    if (open) {
      optionRefs.current[focusedIndex]?.focus();
    }
  }, [open, focusedIndex]);

  function handleTriggerKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
    }
  }

  function handleOptionKeyDown(e: React.KeyboardEvent, idx: number) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((idx + 1) % THEME_OPTIONS.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((idx - 1 + THEME_OPTIONS.length) % THEME_OPTIONS.length);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setMode(THEME_OPTIONS[idx].value);
      setOpen(false);
    } else if (e.key === 'Escape' || e.key === 'Tab') {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className={clsx('relative', className)}>
      <button
        onClick={() => setOpen(o => !o)}
        onKeyDown={handleTriggerKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Select theme"
        className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors"
      >
        <CurrentIcon className={clsx(size === 'sm' ? 'w-4 h-4' : 'w-5 h-5')} />
      </button>
      {open && (
        <div
          role="listbox"
          aria-label="Theme options"
          className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-surface-dark rounded-lg shadow-lg border border-neutral-200 dark:border-white/10 py-1 z-50"
        >
          {THEME_OPTIONS.map((option, idx) => {
            const Icon = option.icon;
            const isSelected = mode === option.value;
            return (
              <button
                key={option.value}
                ref={el => { optionRefs.current[idx] = el; }}
                role="option"
                aria-selected={isSelected}
                onClick={() => { setMode(option.value); setOpen(false); }}
                onKeyDown={e => handleOptionKeyDown(e, idx)}
                tabIndex={-1}
                className={clsx(
                  'w-full px-3 py-2 text-left flex items-center gap-2 text-sm transition-colors focus:outline-none focus:bg-neutral-100 dark:focus:bg-neutral-700',
                  isSelected
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-white/5'
                )}
              >
                <Icon className="w-4 h-4" />
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
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
                  : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-white/5'
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
    return <ThemeDropdown mode={mode} setMode={setMode} CurrentIcon={CurrentIcon} size={size} className={className} />;
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
        'p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors',
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
