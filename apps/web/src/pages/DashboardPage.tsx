import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Newsletter, KnowledgeSource, TIER_LIMITS } from '@/lib/supabase';
import { useToast } from '@/components/ui/Toast';
import { 
  Wand2, 
  Database, 
  BarChart3, 
  Mail, 
  TrendingUp,
  Users,
  MousePointerClick,
  ArrowRight,
  Plus
} from 'lucide-react';
import clsx from 'clsx';

interface DashboardStats {
  totalSources: number;
  sentNewsletters: number;
  newslettersThisMonth: number;
  avgOpenRate: number | null;
  totalSubscribers: number | null;
}

export function DashboardPage() {
  const { profile, tenant } = useAuth();
  const { toast } = useToast();
  const [recentNewsletters, setRecentNewsletters] = useState<Newsletter[]>([]);
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalSources: 0,
    sentNewsletters: 0,
    newslettersThisMonth: 0,
    avgOpenRate: null,
    totalSubscribers: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tenant) {
      loadDashboardData();
    }
  }, [tenant]);

  async function loadDashboardData() {
    setLoading(true);
    try {
      // Recent newsletters for list
      const { data: newsletters } = await supabase
        .from('newsletters')
        .select('*')
        .eq('tenant_id', tenant!.id)
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentNewsletters(newsletters || []);

      // Sources
      const { data: sourcesData } = await supabase
        .from('knowledge_sources')
        .select('*')
        .eq('tenant_id', tenant!.id);

      setSources(sourcesData || []);

      // Count sent newsletters (all time)
      const { count: sentCount } = await supabase
        .from('newsletters')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenant!.id)
        .eq('status', 'sent');

      // Count newsletters created this month (for usage bar)
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const { count: monthCount } = await supabase
        .from('newsletters')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenant!.id)
        .gte('created_at', startOfMonth.toISOString());

      // Avg open rate from newsletter_stats
      let avgOpenRate: number | null = null;
      const sentIds = (sentCount && sentCount > 0)
        ? await supabase
            .from('newsletters')
            .select('id')
            .eq('tenant_id', tenant!.id)
            .eq('status', 'sent')
        : null;

      if (sentIds?.data && sentIds.data.length > 0) {
        const { data: statsData } = await supabase
          .from('newsletter_stats')
          .select('open_rate')
          .in('newsletter_id', sentIds.data.map(n => n.id));

        if (statsData && statsData.length > 0) {
          const sum = statsData.reduce((s, r) => s + (r.open_rate || 0), 0);
          avgOpenRate = Math.round((sum / statsData.length) * 10) / 10;
        }
      }

      setStats({
        totalSources: sourcesData?.length || 0,
        sentNewsletters: sentCount || 0,
        newslettersThisMonth: monthCount || 0,
        avgOpenRate,
        totalSubscribers: null,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data. Please refresh.');
    } finally {
      setLoading(false);
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const tier = tenant?.subscription_tier || 'free';
  const limits = TIER_LIMITS[tier as keyof typeof TIER_LIMITS];

  const quickActions = [
    { name: 'Create Newsletter', href: '/wizard', icon: Wand2, color: 'bg-primary-500' },
    { name: 'Add Source', href: '/knowledge-base', icon: Database, color: 'bg-success' },
    { name: 'View Analytics', href: '/analytics', icon: BarChart3, color: 'bg-info' },
  ];

  const statCards = [
    { name: 'Knowledge Sources', value: stats.totalSources, icon: Database, limit: limits.sources },
    { name: 'Newsletters Sent', value: stats.sentNewsletters, icon: Mail, limit: limits.newsletters },
    {
      name: 'Avg. Open Rate',
      value: stats.avgOpenRate !== null ? `${stats.avgOpenRate}%` : '—',
      icon: TrendingUp,
    },
    {
      name: 'Total Subscribers',
      value: stats.totalSubscribers !== null ? stats.totalSubscribers.toLocaleString() : '—',
      icon: Users,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Welcome Header — Stitch glass hero */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 p-8"
           style={{ background: 'linear-gradient(135deg, rgba(51,13,242,0.25) 0%, rgba(30,27,46,0.9) 60%)' }}>
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-3xl font-bold font-display text-white mb-2">
            {getGreeting()}, {profile?.full_name?.split(' ')[0] || 'there'}
          </h1>
          <p className="text-neutral-300 mb-6">
            Ready to create your next newsletter? Your knowledge base has {stats.totalSources} sources ready.
          </p>
          <Link
            to="/wizard"
            className="inline-flex items-center gap-2 px-6 py-3 btn-primary-gradient text-sm shadow-glow-sm"
          >
            <Wand2 className="w-5 h-5" />
            Create Newsletter
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div
            key={stat.name}
            className="bg-white dark:bg-surface-dark rounded-xl p-6 border border-neutral-200 dark:border-white/5 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-primary-50 dark:bg-primary-900/20 rounded-lg flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-primary-500" />
              </div>
              {stat.limit && (
                <span className="text-xs text-neutral-500">
                  / {stat.limit}
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">{stat.value}</p>
            <p className="text-sm text-neutral-500">{stat.name}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Newsletters */}
        <div className="lg:col-span-2 bg-white dark:bg-surface-dark rounded-xl border border-neutral-200 dark:border-white/5 shadow-sm">
          <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-white/10">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Recent Newsletters</h2>
            <Link
              to="/newsletters"
              className="text-sm text-primary-500 hover:text-primary-light font-medium flex items-center gap-1"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-neutral-200 dark:divide-white/5">
            {recentNewsletters.length === 0 ? (
              <div className="p-8 text-center">
                <Mail className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                <p className="text-neutral-500 mb-4">No newsletters yet</p>
                <Link
                  to="/wizard"
                  className="inline-flex items-center gap-2 px-4 py-2 btn-primary-gradient text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Create your first
                </Link>
              </div>
            ) : (
              recentNewsletters.map((newsletter) => (
                <Link
                  key={newsletter.id}
                  to={`/newsletters/${newsletter.id}/edit`}
                  className="flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-neutral-900 dark:text-white truncate">
                      {newsletter.title}
                    </p>
                    <p className="text-sm text-neutral-500 truncate">
                      {newsletter.subject_line || 'No subject line'}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={clsx(
                      'px-2.5 py-1 text-xs font-medium rounded-full',
                      newsletter.status === 'sent' ? 'bg-success/10 text-success' :
                      newsletter.status === 'draft' ? 'bg-neutral-100 text-neutral-700' :
                      newsletter.status === 'scheduled' ? 'bg-primary-50 text-primary-600' :
                      'bg-warning/10 text-warning'
                    )}>
                      {newsletter.status}
                    </span>
                    <ArrowRight className="w-4 h-4 text-neutral-400" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions & Usage */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white dark:bg-surface-dark rounded-xl border border-neutral-200 dark:border-white/5 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Quick Actions</h2>
            <div className="space-y-3">
              {quickActions.map((action) => (
                <Link
                  key={action.name}
                  to={action.href}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors group"
                >
                  <div className={clsx('w-10 h-10 rounded-lg flex items-center justify-center', action.color)}>
                    <action.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-medium text-neutral-700 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-white">
                    {action.name}
                  </span>
                  <ArrowRight className="w-4 h-4 text-neutral-400 ml-auto" />
                </Link>
              ))}
            </div>
          </div>

          {/* Usage Summary */}
          <div className="bg-white dark:bg-surface-dark rounded-xl border border-neutral-200 dark:border-white/5 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Usage This Month</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-neutral-600 dark:text-neutral-400">Newsletters Created</span>
                  <span className="font-medium text-neutral-900 dark:text-white">
                    {stats.newslettersThisMonth} / {limits.aiGenerations}
                  </span>
                </div>
                <div className="h-2 bg-neutral-100 dark:bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((stats.newslettersThisMonth / limits.aiGenerations) * 100, 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-neutral-600 dark:text-neutral-400">Newsletters</span>
                  <span className="font-medium text-neutral-900 dark:text-white">
                    {stats.sentNewsletters} / {limits.newsletters}
                  </span>
                </div>
                <div className="h-2 bg-neutral-100 dark:bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-success rounded-full transition-all duration-500"
                    style={{ width: `${(stats.sentNewsletters / limits.newsletters) * 100}%` }}
                  />
                </div>
              </div>
            </div>
            <Link
              to="/settings"
              className="mt-4 block text-center text-sm text-primary-500 hover:text-primary-light font-medium"
            >
              View billing details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
