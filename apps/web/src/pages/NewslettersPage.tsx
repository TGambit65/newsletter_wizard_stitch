import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Newsletter } from '@/lib/supabase';
import { 
  Plus, 
  Mail, 
  Search,
  Trash2,
  Edit,
  Eye,
  Send,
  Clock,
  CheckCircle,
  MoreVertical,
  ArrowRight,
  Share2
} from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';

type StatusFilter = 'all' | 'draft' | 'scheduled' | 'sent';

export function NewslettersPage() {
  const { tenant } = useAuth();
  const navigate = useNavigate();
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

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
      
      setNewsletters(data || []);
    } catch (error) {
      console.error('Error loading newsletters:', error);
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
          status: 'draft'
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      if (data) {
        navigate(`/newsletters/${data.id}/edit`);
      }
    } catch (error) {
      console.error('Error creating newsletter:', error);
    }
  }

  async function deleteNewsletter(id: string) {
    if (!confirm('Are you sure you want to delete this newsletter?')) return;
    
    try {
      await supabase.from('newsletters').delete().eq('id', id);
      setNewsletters(newsletters.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error deleting newsletter:', error);
    }
  }

  const filteredNewsletters = newsletters.filter(newsletter => {
    if (filter !== 'all' && newsletter.status !== filter) return false;
    if (searchQuery && !newsletter.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const filterButtons: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'draft', label: 'Drafts' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'sent', label: 'Sent' },
  ];

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'bg-neutral-100 text-neutral-700',
      generating: 'bg-warning/10 text-warning',
      review: 'bg-primary-50 text-primary-600',
      scheduled: 'bg-info/10 text-info',
      sending: 'bg-warning/10 text-warning',
      sent: 'bg-success/10 text-success',
    };
    return (
      <span className={clsx('px-2.5 py-1 text-xs font-medium rounded-full capitalize', styles[status as keyof typeof styles] || styles.draft)}>
        {status}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Newsletters</h1>
          <p className="text-neutral-500 mt-1">Create, edit, and manage your newsletters</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={createNewsletter}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-medium rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Blank Draft
          </button>
          <Link
            to="/wizard"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors"
          >
            <Send className="w-5 h-5" />
            Create with AI
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search newsletters..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          />
        </div>
        <div className="flex gap-2">
          {filterButtons.map((btn) => (
            <button
              key={btn.value}
              onClick={() => setFilter(btn.value)}
              className={clsx(
                'px-4 py-2.5 rounded-lg font-medium text-sm transition-colors',
                filter === btn.value
                  ? 'bg-primary-500 text-white'
                  : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700'
              )}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Newsletters List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
        </div>
      ) : filteredNewsletters.length === 0 ? (
        <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-12 text-center">
          <Mail className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">No newsletters yet</h3>
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
        <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
            {filteredNewsletters.map((newsletter) => (
              <div
                key={newsletter.id}
                className="flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors"
              >
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-medium text-neutral-900 dark:text-white truncate">
                      {newsletter.title}
                    </h3>
                    {getStatusBadge(newsletter.status)}
                  </div>
                  <p className="text-sm text-neutral-500 truncate">
                    {newsletter.subject_line || 'No subject line'}
                  </p>
                  <p className="text-xs text-neutral-400 mt-1">
                    {format(new Date(newsletter.created_at), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    to={`/newsletters/${newsletter.id}/edit`}
                    className="p-2 text-neutral-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-5 h-5" />
                  </Link>
                  <Link
                    to={`/newsletters/${newsletter.id}/social`}
                    className="p-2 text-neutral-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                    title="Social Media Posts"
                  >
                    <Share2 className="w-5 h-5" />
                  </Link>
                  <button
                    onClick={() => deleteNewsletter(newsletter.id)}
                    className="p-2 text-neutral-500 hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
