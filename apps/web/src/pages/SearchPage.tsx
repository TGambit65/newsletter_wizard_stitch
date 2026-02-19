import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
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
  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState<ResultType | 'all'>('all');
  const [searched, setSearched] = useState(false);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const qLower = q.toLowerCase();

      const [newsletterRes, sourceRes] = await Promise.all([
        tenant
          ? supabase
              .from('newsletters')
              .select('id, title, status, subject_line, created_at')
              .eq('tenant_id', tenant.id)
              .ilike('title', `%${q}%`)
              .order('created_at', { ascending: false })
              .limit(20)
          : Promise.resolve({ data: null }),
        tenant
          ? supabase
              .from('knowledge_sources')
              .select('id, title, source_type, created_at')
              .eq('tenant_id', tenant.id)
              .ilike('title', `%${q}%`)
              .limit(20)
          : Promise.resolve({ data: null }),
      ]);

      const pages = STATIC_PAGES.filter(p => p.title.toLowerCase().includes(qLower));

      const combined: SearchResult[] = [
        ...(newsletterRes.data || []).map(n => ({
          id: `newsletter-${n.id}`,
          type: 'newsletter' as const,
          title: n.title,
          snippet: n.subject_line || undefined,
          date: n.created_at,
          href: `/newsletters/${n.id}/edit`,
          meta: n.status,
        })),
        ...(sourceRes.data || []).map(s => ({
          id: `source-${s.id}`,
          type: 'source' as const,
          title: s.title,
          snippet: s.source_type,
          date: s.created_at,
          href: '/knowledge-base',
          meta: s.source_type,
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
            className="w-full pl-12 pr-24 py-4 text-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none shadow-sm"
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
                    : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700'
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
                  className="w-full flex items-center gap-4 p-4 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-sm transition-all text-left group"
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
