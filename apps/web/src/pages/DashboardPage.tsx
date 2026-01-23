import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Newsletter, KnowledgeSource, TIER_LIMITS } from '@/lib/supabase';
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
  totalNewsletters: number;
  avgOpenRate: number;
  totalSubscribers: number;
}

export function DashboardPage() {
  const { profile, tenant } = useAuth();
  const [recentNewsletters, setRecentNewsletters] = useState<Newsletter[]>([]);
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalSources: 0,
    totalNewsletters: 0,
    avgOpenRate: 0,
    totalSubscribers: 0
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
      // Load recent newsletters
      const { data: newsletters } = await supabase
        .from('newsletters')
        .select('*')
        .eq('tenant_id', tenant!.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      setRecentNewsletters(newsletters || []);

      // Load sources
      const { data: sourcesData } = await supabase
        .from('knowledge_sources')
        .select('*')
        .eq('tenant_id', tenant!.id);
      
      setSources(sourcesData || []);

      // Calculate stats
      setStats({
        totalSources: sourcesData?.length || 0,
        totalNewsletters: newsletters?.length || 0,
        avgOpenRate: 24.5, // Mock for demo
        totalSubscribers: 1250 // Mock for demo
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
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
    { name: 'Newsletters Sent', value: stats.totalNewsletters, icon: Mail, limit: limits.newsletters },
    { name: 'Avg. Open Rate', value: `${stats.avgOpenRate}%`, icon: TrendingUp },
    { name: 'Total Subscribers', value: stats.totalSubscribers.toLocaleString(), icon: Users },
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
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">
          {getGreeting()}, {profile?.full_name?.split(' ')[0] || 'there'}
        </h1>
        <p className="text-primary-100 mb-6">
          Ready to create your next newsletter? Your knowledge base has {stats.totalSources} sources ready.
        </p>
        <Link
          to="/wizard"
          className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary-600 font-semibold rounded-lg hover:bg-primary-50 transition-colors"
        >
          <Wand2 className="w-5 h-5" />
          Create Newsletter
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div
            key={stat.name}
            className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700 shadow-sm"
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
        <div className="lg:col-span-2 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm">
          <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Recent Newsletters</h2>
            <Link
              to="/newsletters"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
            {recentNewsletters.length === 0 ? (
              <div className="p-8 text-center">
                <Mail className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                <p className="text-neutral-500 mb-4">No newsletters yet</p>
                <Link
                  to="/wizard"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
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
                  className="flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors"
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
          <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Quick Actions</h2>
            <div className="space-y-3">
              {quickActions.map((action) => (
                <Link
                  key={action.name}
                  to={action.href}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors group"
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
          <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Usage This Month</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-neutral-600 dark:text-neutral-400">AI Generations</span>
                  <span className="font-medium text-neutral-900 dark:text-white">
                    8 / {limits.aiGenerations}
                  </span>
                </div>
                <div className="h-2 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary-500 rounded-full transition-all duration-500"
                    style={{ width: `${(8 / limits.aiGenerations) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-neutral-600 dark:text-neutral-400">Newsletters</span>
                  <span className="font-medium text-neutral-900 dark:text-white">
                    {stats.totalNewsletters} / {limits.newsletters}
                  </span>
                </div>
                <div className="h-2 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-success rounded-full transition-all duration-500"
                    style={{ width: `${(stats.totalNewsletters / limits.newsletters) * 100}%` }}
                  />
                </div>
              </div>
            </div>
            <Link
              to="/settings"
              className="mt-4 block text-center text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              View billing details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
