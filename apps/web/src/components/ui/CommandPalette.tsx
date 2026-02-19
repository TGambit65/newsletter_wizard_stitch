import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Search, Mail, Database, BookOpen, X, Clock, ArrowRight } from 'lucide-react';
import clsx from 'clsx';

interface SearchResult {
  id: string;
  type: 'newsletter' | 'source' | 'template' | 'page';
  title: string;
  subtitle?: string;
  href: string;
}

const STATIC_PAGES: SearchResult[] = [
  { id: 'page-dashboard', type: 'page', title: 'Dashboard', href: '/dashboard' },
  { id: 'page-newsletters', type: 'page', title: 'Newsletters', href: '/newsletters' },
  { id: 'page-knowledge-base', type: 'page', title: 'Knowledge Base', href: '/knowledge-base' },
  { id: 'page-templates', type: 'page', title: 'Template Library', href: '/templates' },
  { id: 'page-analytics', type: 'page', title: 'Analytics', href: '/analytics' },
  { id: 'page-scheduling', type: 'page', title: 'Scheduling', href: '/scheduling' },
  { id: 'page-settings', type: 'page', title: 'Settings', href: '/settings' },
  { id: 'page-team', type: 'page', title: 'Team', href: '/team' },
  { id: 'page-brand-voice', type: 'page', title: 'Brand Voice', href: '/brand-voice' },
];

const TYPE_ICONS: Record<SearchResult['type'], React.ComponentType<{ className?: string }>> = {
  newsletter: Mail,
  source: Database,
  template: BookOpen,
  page: ArrowRight,
};

const TYPE_COLORS: Record<SearchResult['type'], string> = {
  newsletter: 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20',
  source: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20',
  template: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20',
  page: 'text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-700',
};

const RECENT_KEY = 'cmd-palette-recent';
const MAX_RECENT = 5;

function getRecent(): SearchResult[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveRecent(item: SearchResult) {
  const existing = getRecent().filter(r => r.id !== item.id);
  const updated = [item, ...existing].slice(0, MAX_RECENT);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  } catch {
    // ignore storage errors
  }
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const { tenant } = useAuth();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentItems, setRecentItems] = useState<SearchResult[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setFocusedIndex(0);
      setRecentItems(getRecent());
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const search = useCallback(async (q: string) => {
    if (!tenant || !q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const qLower = q.toLowerCase();

      // Search newsletters
      const { data: newsletters } = await supabase
        .from('newsletters')
        .select('id, title, status, subject_line')
        .eq('tenant_id', tenant.id)
        .ilike('title', `%${q}%`)
        .limit(5);

      // Search knowledge sources
      const { data: sources } = await supabase
        .from('knowledge_sources')
        .select('id, title, source_type')
        .eq('tenant_id', tenant.id)
        .ilike('title', `%${q}%`)
        .limit(5);

      // Filter static pages
      const pages = STATIC_PAGES.filter(p =>
        p.title.toLowerCase().includes(qLower)
      );

      const combined: SearchResult[] = [
        ...(newsletters || []).map(n => ({
          id: `newsletter-${n.id}`,
          type: 'newsletter' as const,
          title: n.title,
          subtitle: n.subject_line || n.status,
          href: `/newsletters/${n.id}/edit`,
        })),
        ...(sources || []).map(s => ({
          id: `source-${s.id}`,
          type: 'source' as const,
          title: s.title,
          subtitle: s.source_type,
          href: '/knowledge-base',
        })),
        ...pages,
      ];

      setResults(combined);
      setFocusedIndex(0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [tenant]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, search]);

  const displayedItems = query.trim() ? results : recentItems;
  const showRecent = !query.trim() && recentItems.length > 0;

  function handleSelect(item: SearchResult) {
    saveRecent(item);
    onClose();
    navigate(item.href);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    const total = displayedItems.length;
    if (total === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex(i => (i + 1) % total);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(i => (i - 1 + total) % total);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (displayedItems[focusedIndex]) handleSelect(displayedItems[focusedIndex]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  }

  // Scroll focused item into view
  useEffect(() => {
    const el = listRef.current?.children[focusedIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [focusedIndex]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[100] flex items-start justify-center pt-[15vh] px-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-xl bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl overflow-hidden border border-neutral-200 dark:border-neutral-700">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
          <Search className="w-5 h-5 text-neutral-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search newsletters, sources, pages..."
            className="flex-1 bg-transparent text-neutral-900 dark:text-white placeholder-neutral-400 outline-none text-base"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs text-neutral-400 border border-neutral-300 dark:border-neutral-600 rounded">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto" ref={listRef}>
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
            </div>
          )}

          {!loading && (
            <>
              {showRecent && (
                <div className="px-3 pt-2 pb-1">
                  <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Recent
                  </p>
                </div>
              )}

              {!loading && query.trim() && results.length === 0 && (
                <div className="py-10 text-center">
                  <p className="text-sm text-neutral-500">No results for &ldquo;{query}&rdquo;</p>
                  <p className="text-xs text-neutral-400 mt-1">Try searching for a newsletter title or page name</p>
                </div>
              )}

              {!query.trim() && recentItems.length === 0 && (
                <div className="py-10 text-center">
                  <p className="text-sm text-neutral-500">Start typing to search</p>
                  <p className="text-xs text-neutral-400 mt-1">Newsletters, knowledge sources, pages</p>
                </div>
              )}

              {displayedItems.map((item, idx) => {
                const Icon = TYPE_ICONS[item.type];
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className={clsx(
                      'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                      focusedIndex === idx
                        ? 'bg-primary-50 dark:bg-primary-900/20'
                        : 'hover:bg-neutral-50 dark:hover:bg-neutral-700/50'
                    )}
                  >
                    <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', TYPE_COLORS[item.type])}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">{item.title}</p>
                      {item.subtitle && (
                        <p className="text-xs text-neutral-500 capitalize truncate">{item.subtitle}</p>
                      )}
                    </div>
                    <span className="text-xs text-neutral-400 capitalize hidden sm:block">{item.type}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-neutral-300 flex-shrink-0" />
                  </button>
                );
              })}
            </>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-neutral-100 dark:border-neutral-700 flex items-center gap-4 text-xs text-neutral-400">
          <span className="flex items-center gap-1"><kbd className="px-1 border border-neutral-300 dark:border-neutral-600 rounded">↑↓</kbd> navigate</span>
          <span className="flex items-center gap-1"><kbd className="px-1 border border-neutral-300 dark:border-neutral-600 rounded">↵</kbd> open</span>
          <span className="flex items-center gap-1"><kbd className="px-1 border border-neutral-300 dark:border-neutral-600 rounded">Esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
