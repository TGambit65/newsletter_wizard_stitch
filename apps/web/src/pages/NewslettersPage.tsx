import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Newsletter, NewsletterStats } from '@/lib/supabase';
import { useToast } from '@/components/ui/Toast';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { Pagination } from '@/components/ui/Pagination';
import { usePagination } from '@/hooks/usePagination';
import {
  Plus,
  Mail,
  Search,
  Trash2,
  Edit,
  Share2,
  TrendingUp,
  MousePointerClick,
  ArrowUpDown,
} from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';

type StatusFilter = 'all' | 'draft' | 'scheduled' | 'sent';
type SortKey = 'created_at' | 'open_rate' | 'click_rate' | 'status';

type NewsletterWithStats = Newsletter & {
  stats?: Pick<NewsletterStats, 'open_rate' | 'click_rate' | 'total_sent'>;
};

export function NewslettersPage() {
  const { tenant } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [newsletters, setNewsletters] = useState<NewsletterWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (tenant) {
      loadNewsletters();
    }
  }, [tenant]);

  async function loadNewsletters() {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('newsletters')
        .select('*')
        .eq('tenant_id', tenant!.id)
        .order('created_at', { ascending: false });

      const newsletters = data || [];

      // Join newsletter_stats for sent newsletters
      const sentIds = newsletters.filter(n => n.status === 'sent').map(n => n.id);
      let statsMap: Record<string, Pick<NewsletterStats, 'open_rate' | 'click_rate' | 'total_sent'>> = {};

      if (sentIds.length > 0) {
        const { data: statsData } = await supabase
          .from('newsletter_stats')
          .select('newsletter_id, open_rate, click_rate, total_sent')
          .in('newsletter_id', sentIds);

        if (statsData) {
          statsMap = Object.fromEntries(statsData.map(s => [s.newsletter_id, {
            open_rate: s.open_rate,
            click_rate: s.click_rate,
            total_sent: s.total_sent,
          }]));
        }
      }

      setNewsletters(newsletters.map(n => ({ ...n, stats: statsMap[n.id] })));
    } catch (error) {
      console.error('Error loading newsletters:', error);
      toast.error('Failed to load newsletters');
    } finally {
      setLoading(false);
    }
  }

  async function createNewsletter() {
    if (!tenant) return;

    try {
      const { data, error } = await supabase
        .from('newsletters')
        .insert({
          tenant_id: tenant.id,
          title: 'Untitled Newsletter',
          status: 'draft',
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      if (data) {
        navigate(`/newsletters/${data.id}/edit`);
      }
    } catch (error) {
      console.error('Error creating newsletter:', error);
      toast.error('Failed to create newsletter');
    }
  }

  async function deleteNewsletter(id: string) {
    try {
      await supabase.from('newsletters').delete().eq('id', id);
      setNewsletters(prev => prev.filter(n => n.id !== id));
      toast.success('Newsletter deleted');
    } catch (error) {
      console.error('Error deleting newsletter:', error);
      toast.error('Failed to delete newsletter');
    }
  }

  const filteredAndSorted = useMemo(() => {
    let list = newsletters.filter(n => {
      if (filter !== 'all' && n.status !== filter) return false;
      if (searchQuery && !n.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });

    list = [...list].sort((a, b) => {
      if (sortKey === 'open_rate') return (b.stats?.open_rate || 0) - (a.stats?.open_rate || 0);
      if (sortKey === 'click_rate') return (b.stats?.click_rate || 0) - (a.stats?.click_rate || 0);
      if (sortKey === 'status') return a.status.localeCompare(b.status);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return list;
  }, [newsletters, filter, searchQuery, sortKey]);

  const { page, setPage, totalPages, paginatedItems } = usePagination(filteredAndSorted, 20);

  const filterButtons: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'draft', label: 'Drafts' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'sent', label: 'Sent' },
  ];

  const STATUS_STYLES: Record<string, string> = {
    draft: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300',
    generating: 'bg-warning/10 text-warning animate-pulse',
    review: 'bg-primary-50 text-primary-600',
    scheduled: 'bg-info/10 text-info',
    sending: 'bg-warning/10 text-warning animate-pulse',
    sent: 'bg-success/10 text-success',
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold font-display text-neutral-900 dark:text-white">Newsletters</h1>
          <p className="text-neutral-500 mt-1">Create, edit, and manage your newsletters</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={createNewsletter}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-neutral-100 dark:bg-white/5 text-neutral-700 dark:text-neutral-300 font-medium rounded-lg hover:bg-neutral-200 dark:hover:bg-white/10 transition-colors border border-neutral-200 dark:border-white/10"
          >
            <Plus className="w-5 h-5" />
            Blank Draft
          </button>
          <Link
            to="/wizard"
            className="inline-flex items-center gap-2 px-4 py-2.5 btn-primary-gradient text-sm shadow-glow-sm"
          >
            <Plus className="w-5 h-5" />
            Create with AI
          </Link>
        </div>
      </div>

      {/* Filters + Sort */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search newsletters..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-surface-dark border border-neutral-200 dark:border-white/5 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {filterButtons.map((btn) => (
            <button
              key={btn.value}
              onClick={() => setFilter(btn.value)}
              className={clsx(
                'px-4 py-2.5 rounded-lg font-medium text-sm transition-colors',
                filter === btn.value
                  ? 'bg-primary-500 text-white'
                  : 'bg-white dark:bg-surface-dark text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-white/10 hover:bg-neutral-50 dark:hover:bg-white/5'
              )}
            >
              {btn.label}
            </button>
          ))}

          {/* Sort dropdown */}
          <div className="relative">
            <select
              value={sortKey}
              onChange={e => setSortKey(e.target.value as SortKey)}
              aria-label="Sort newsletters"
              className="appearance-none pl-8 pr-4 py-2.5 bg-white dark:bg-surface-dark border border-neutral-200 dark:border-white/5 rounded-lg text-sm text-neutral-700 dark:text-neutral-300 cursor-pointer focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="created_at">Sort: Date</option>
              <option value="open_rate">Sort: Open Rate</option>
              <option value="click_rate">Sort: Click Rate</option>
              <option value="status">Sort: Status</option>
            </select>
            <ArrowUpDown className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Newsletters List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
        </div>
      ) : paginatedItems.length === 0 ? (
        <div className="bg-white dark:bg-surface-dark rounded-xl border border-neutral-200 dark:border-white/5 p-12 text-center">
          <Mail className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
            {filteredAndSorted.length === 0 && newsletters.length > 0
              ? 'No newsletters match your filters'
              : 'No newsletters yet'}
          </h3>
          <p className="text-neutral-500 mb-6">Create your first AI-powered newsletter</p>
          <Link
            to="/wizard"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Newsletter
          </Link>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-surface-dark rounded-xl border border-neutral-200 dark:border-white/5 overflow-hidden">
            <div className="divide-y divide-neutral-200 dark:divide-white/5">
              {paginatedItems.map((newsletter) => (
                <div
                  key={newsletter.id}
                  className="flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors"
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-medium text-neutral-900 dark:text-white truncate">
                        {newsletter.title}
                      </h3>
                      <span className={clsx('px-2.5 py-1 text-xs font-medium rounded-full capitalize flex-shrink-0', STATUS_STYLES[newsletter.status] || STATUS_STYLES.draft)}>
                        {newsletter.status}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-500 truncate">
                      {newsletter.subject_line || 'No subject line'}
                    </p>
                    <div className="flex items-center gap-4 mt-1">
                      <p className="text-xs text-neutral-400">
                        {format(new Date(newsletter.created_at), 'MMM d, yyyy')}
                      </p>
                      {newsletter.stats && (
                        <>
                          <span className="flex items-center gap-1 text-xs text-neutral-500">
                            <TrendingUp className="w-3 h-3" />
                            {newsletter.stats.open_rate.toFixed(1)}% open
                          </span>
                          <span className="flex items-center gap-1 text-xs text-neutral-500">
                            <MousePointerClick className="w-3 h-3" />
                            {newsletter.stats.click_rate.toFixed(1)}% click
                          </span>
                          {newsletter.stats.total_sent > 0 && (
                            <span className="text-xs text-neutral-400">
                              {newsletter.stats.total_sent.toLocaleString()} sent
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Link
                      to={`/newsletters/${newsletter.id}/edit`}
                      aria-label={`Edit ${newsletter.title}`}
                      className="p-2 text-neutral-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <Link
                      to={`/newsletters/${newsletter.id}/social`}
                      aria-label={`Social posts for ${newsletter.title}`}
                      className="p-2 text-neutral-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                    >
                      <Share2 className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => setDeleteConfirmId(newsletter.id)}
                      aria-label={`Delete ${newsletter.title}`}
                      className="p-2 text-neutral-500 hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            className="mt-6"
          />
        </>
      )}

      <ConfirmDialog
        open={deleteConfirmId !== null}
        onOpenChange={open => { if (!open) setDeleteConfirmId(null); }}
        title="Delete newsletter?"
        description="This newsletter and all its content will be permanently deleted."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => {
          if (deleteConfirmId) deleteNewsletter(deleteConfirmId);
          setDeleteConfirmId(null);
        }}
      />
    </div>
  );
}
