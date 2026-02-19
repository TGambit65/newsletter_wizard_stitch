import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Search, Mail, Database, ArrowRight, Calendar, X } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';

type ResultType = 'newsletter' | 'source' | 'page';

interface SearchResult {
  id: string;
  type: ResultType;
  title: string;
  snippet?: string;
  date?: string;
  href: string;
  meta?: string;
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

const TYPE_CONFIG: Record<ResultType, { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string }> = {
  newsletter: { label: 'Newsletter', icon: Mail, color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-50 dark:bg-primary-900/20' },
  source: { label: 'Knowledge Source', icon: Database, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  page: { label: 'Page', icon: ArrowRight, color: 'text-neutral-500 dark:text-neutral-400', bg: 'bg-neutral-100 dark:bg-neutral-700' },
};

const TYPE_FILTERS: { value: ResultType | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'newsletter', label: 'Newsletters' },
  { value: 'source', label: 'Sources' },
  { value: 'page', label: 'Pages' },
];

export function SearchPage() {
  const { tenant } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState<ResultType | 'all'>('all');
  const [searched, setSearched] = useState(false);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setSuggestions([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const qLower = q.toLowerCase();
      const pages = STATIC_PAGES.filter(p => p.title.toLowerCase().includes(qLower));

      if (!tenant) {
        setResults(pages);
        return;
      }

      const apiResult = await api.globalSearch({
        query: q,
        filters: { types: ['newsletter', 'source'] },
        limit: 40,
      });

      setSuggestions(apiResult.suggestions || []);

      const combined: SearchResult[] = [
        ...apiResult.results.map(r => ({
          id: `${r.type}-${r.id}`,
          type: r.type as ResultType,
          title: r.title,
          snippet: r.snippet || undefined,
          date: r.date || undefined,
          href: r.type === 'newsletter' ? `/newsletters/${r.id}/edit` : '/knowledge-base',
          meta: r.status || undefined,
        })),
        ...pages,
      ];

      setResults(combined);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [tenant]);

  useEffect(() => {
    const q = searchParams.get('q') || '';
    setQuery(q);
    search(q);
  }, [searchParams, search]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSearchParams(query ? { q: query } : {});
    search(query);
  }

  function handleClear() {
    setQuery('');
    setSearchParams({});
    setResults([]);
    setSuggestions([]);
    setSearched(false);
  }

  const filtered = typeFilter === 'all' ? results : results.filter(r => r.type === typeFilter);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">Search</h1>
        <p className="text-neutral-500">Find newsletters, knowledge sources, and pages</p>
      </div>

      {/* Search form */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search everything..."
            autoFocus
            className="w-full pl-12 pr-24 py-4 text-lg bg-white dark:bg-surface-dark border border-neutral-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none shadow-sm"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm font-medium"
            >
              Search
            </button>
          </div>
        </div>
      </form>

      {/* AI search suggestions */}
      {suggestions.length > 0 && !loading && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-xs text-neutral-400">Try:</span>
          {suggestions.map(s => (
            <button
              key={s}
              onClick={() => { setQuery(s); setSearchParams({ q: s }); }}
              className="px-2.5 py-1 text-xs bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 rounded-full hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Type filter pills */}
      {searched && results.length > 0 && (
        <div className="flex gap-2 mb-6 flex-wrap">
          {TYPE_FILTERS.map(f => {
            const count = f.value === 'all'
              ? results.length
              : results.filter(r => r.type === f.value).length;
            if (f.value !== 'all' && count === 0) return null;
            return (
              <button
                key={f.value}
                onClick={() => setTypeFilter(f.value)}
                className={clsx(
                  'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                  typeFilter === f.value
                    ? 'bg-primary-500 text-white'
                    : 'bg-white dark:bg-surface-dark text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-white/10 hover:bg-neutral-50 dark:hover:bg-white/5'
                )}
              >
                {f.label}
                <span className={clsx(
                  'ml-1.5 px-1.5 py-0.5 text-xs rounded-full',
                  typeFilter === f.value ? 'bg-white/20' : 'bg-neutral-100 dark:bg-neutral-700'
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Results */}
      {loading && (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
        </div>
      )}

      {!loading && searched && filtered.length === 0 && (
        <div className="text-center py-16">
          <Search className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">No results found</h3>
          <p className="text-neutral-500 mb-1">No matches for &ldquo;{query}&rdquo;</p>
          <p className="text-sm text-neutral-400">Try searching with different keywords or check your spelling</p>
        </div>
      )}

      {!loading && !searched && (
        <div className="text-center py-16">
          <Search className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
          <p className="text-neutral-500">Enter a search term to find newsletters, sources, and pages</p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <>
          <p className="text-sm text-neutral-500 mb-4">
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            {typeFilter !== 'all' ? ` for ${typeFilter}s` : ''}
          </p>
          <div className="space-y-3">
            {filtered.map(result => {
              const config = TYPE_CONFIG[result.type];
              const Icon = config.icon;
              return (
                <button
                  key={result.id}
                  onClick={() => navigate(result.href)}
                  className="w-full flex items-center gap-4 p-4 bg-white dark:bg-surface-dark border border-neutral-200 dark:border-white/10 rounded-xl hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-sm transition-all text-left group"
                >
                  <div className={clsx('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', config.bg)}>
                    <Icon className={clsx('w-5 h-5', config.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-medium text-neutral-900 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {result.title}
                      </p>
                      <span className={clsx('text-xs px-2 py-0.5 rounded-full flex-shrink-0', config.bg, config.color)}>
                        {config.label}
                      </span>
                    </div>
                    {result.snippet && (
                      <p className="text-sm text-neutral-500 truncate">{result.snippet}</p>
                    )}
                    {result.date && (
                      <div className="flex items-center gap-1 mt-1">
                        <Calendar className="w-3 h-3 text-neutral-400" />
                        <span className="text-xs text-neutral-400">
                          {format(new Date(result.date), 'MMM d, yyyy')}
                        </span>
                      </div>
                    )}
                  </div>
                  <ArrowRight className="w-4 h-4 text-neutral-300 group-hover:text-primary-400 transition-colors flex-shrink-0" />
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
