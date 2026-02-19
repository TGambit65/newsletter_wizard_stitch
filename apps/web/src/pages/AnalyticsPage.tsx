import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Newsletter, NewsletterStats } from '@/lib/supabase';
import { useTheme } from '@/hooks/useTheme';
import { getChartTheme } from '@/lib/chart-colors';
import EChartsReact from 'echarts-for-react';

const ReactECharts = EChartsReact as any;
import {
  TrendingUp,
  TrendingDown,
  Mail,
  MousePointerClick,
  Eye,
  Users,
  Lightbulb,
  Target,
  Clock,
  Zap,
  Download,
} from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

interface AnalyticsData {
  totalSent: number;
  avgOpenRate: number;
  avgClickRate: number;
  totalSubscribers: number;
  openRateTrend: number;
  clickRateTrend: number;
}

interface NewsletterWithStats extends Newsletter {
  stats?: Pick<NewsletterStats, 'open_rate' | 'click_rate' | 'total_sent' | 'unsubscribes'>;
}

interface PerformanceTip {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
}

export function AnalyticsPage() {
  const { tenant } = useAuth();
  const { toast } = useToast();
  const { resolvedTheme } = useTheme();
  const ct = useMemo(() => getChartTheme(resolvedTheme), [resolvedTheme]);
  const [newsletters, setNewsletters] = useState<NewsletterWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportingReport, setExportingReport] = useState(false);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalSent: 0,
    avgOpenRate: 0,
    avgClickRate: 0,
    totalSubscribers: 0,
    openRateTrend: 0,
    clickRateTrend: 0
  });

  useEffect(() => {
    if (tenant) {
      loadAnalytics();
    }
  }, [tenant, dateRange]);

  async function loadAnalytics() {
    setLoading(true);
    try {
      const cutoff = new Date();
      const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
      cutoff.setDate(cutoff.getDate() - days);

      const { data: newsletterData } = await supabase
        .from('newsletters')
        .select('*')
        .eq('tenant_id', tenant!.id)
        .eq('status', 'sent')
        .gte('sent_at', cutoff.toISOString())
        .order('sent_at', { ascending: false });

      const sent = newsletterData || [];

      let statsMap: Record<string, Pick<NewsletterStats, 'open_rate' | 'click_rate' | 'total_sent' | 'unsubscribes'>> = {};
      if (sent.length > 0) {
        const { data: statsData } = await supabase
          .from('newsletter_stats')
          .select('newsletter_id, open_rate, click_rate, total_sent, unsubscribes')
          .in('newsletter_id', sent.map(n => n.id));
        if (statsData) {
          statsMap = Object.fromEntries(statsData.map(s => [s.newsletter_id, {
            open_rate: s.open_rate,
            click_rate: s.click_rate,
            total_sent: s.total_sent,
            unsubscribes: s.unsubscribes,
          }]));
        }
      }

      const withStats: NewsletterWithStats[] = sent.map(n => ({ ...n, stats: statsMap[n.id] }));
      setNewsletters(withStats);

      const openRates = withStats.filter(n => n.stats).map(n => n.stats!.open_rate);
      const clickRates = withStats.filter(n => n.stats).map(n => n.stats!.click_rate);
      const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

      const midpoint = Math.floor(openRates.length / 2);
      const recentOpen = avg(openRates.slice(0, midpoint));
      const olderOpen = avg(openRates.slice(midpoint));
      const openTrend = olderOpen > 0 ? +(recentOpen - olderOpen).toFixed(1) : 0;
      const recentClick = avg(clickRates.slice(0, midpoint));
      const olderClick = avg(clickRates.slice(midpoint));
      const clickTrend = olderClick > 0 ? +(recentClick - olderClick).toFixed(1) : 0;

      setAnalytics({
        totalSent: sent.length,
        avgOpenRate: +avg(openRates).toFixed(1),
        avgClickRate: +avg(clickRates).toFixed(1),
        totalSubscribers: 0,
        openRateTrend: openTrend,
        clickRateTrend: clickTrend,
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics data.');
    } finally {
      setLoading(false);
    }
  }

  async function handleExportReport() {
    setExportingReport(true);
    try {
      const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      const result = await api.exportPerformanceReport({ date_range: { start: cutoff.toISOString() } });
      const blob = new Blob([result.report_html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch {
      // silently fail — no data to export
    } finally {
      setExportingReport(false);
    }
  }

  // Generate AI tips based on real data
  const aiTips = useMemo((): PerformanceTip[] => {
    const tips: PerformanceTip[] = [];

    if (analytics.avgOpenRate < 20 && analytics.totalSent > 0) {
      tips.push({
        title: 'Improve your subject lines',
        description: `Your average open rate is ${analytics.avgOpenRate}% — below the 20% industry benchmark. Try shorter, curiosity-driven subject lines (30–50 characters).`,
        icon: Mail,
        color: 'text-primary-600 dark:text-primary-400',
        bg: 'bg-primary-50 dark:bg-primary-900/20',
      });
    }

    if (analytics.avgClickRate < 2.5 && analytics.totalSent > 0) {
      tips.push({
        title: 'Strengthen your calls to action',
        description: `Click rate of ${analytics.avgClickRate}% suggests readers aren't converting. Add a single, clear CTA button in the first 300 words.`,
        icon: Target,
        color: 'text-success',
        bg: 'bg-success/10',
      });
    }

    if (analytics.totalSent === 0) {
      tips.push({
        title: 'Send your first newsletter',
        description: 'No analytics data yet. Create and send your first newsletter to start tracking performance.',
        icon: Zap,
        color: 'text-warning',
        bg: 'bg-warning/10',
      });
    }

    if (analytics.openRateTrend < -2) {
      tips.push({
        title: 'Engagement is trending down',
        description: `Open rates dropped ${Math.abs(analytics.openRateTrend)}% recently. Review your send frequency and list hygiene.`,
        icon: TrendingDown,
        color: 'text-error',
        bg: 'bg-error/10',
      });
    }

    if (analytics.openRateTrend > 2) {
      tips.push({
        title: 'Great momentum — keep it up',
        description: `Open rates are up ${analytics.openRateTrend}% this period. Analyze what's working (subject line style, send time) and replicate it.`,
        icon: TrendingUp,
        color: 'text-success',
        bg: 'bg-success/10',
      });
    }

    // Default tip when there are no specific issues
    if (tips.length === 0) {
      tips.push({
        title: 'Consistency is key',
        description: 'Your metrics look healthy. Maintain a regular send cadence (weekly or bi-weekly) to keep subscribers engaged.',
        icon: Clock,
        color: 'text-info',
        bg: 'bg-info/10',
      });
    }

    return tips.slice(0, 4);
  }, [analytics]);

  const statCards = [
    {
      name: 'Total Sent',
      value: analytics.totalSent.toLocaleString(),
      icon: Mail,
      color: 'text-primary-500',
      bgColor: 'bg-primary-50 dark:bg-primary-900/20'
    },
    {
      name: 'Avg. Open Rate',
      value: `${analytics.avgOpenRate}%`,
      trend: analytics.openRateTrend,
      icon: Eye,
      color: 'text-success',
      bgColor: 'bg-success/10'
    },
    {
      name: 'Avg. Click Rate',
      value: `${analytics.avgClickRate}%`,
      trend: analytics.clickRateTrend,
      icon: MousePointerClick,
      color: 'text-info',
      bgColor: 'bg-info/10'
    },
    {
      name: 'Total Subscribers',
      value: analytics.totalSubscribers.toLocaleString(),
      icon: Users,
      color: 'text-warning',
      bgColor: 'bg-warning/10'
    }
  ];

  // Mock chart data (theme-aware)
  const engagementChartOption = useMemo(() => ({
    tooltip: {
      trigger: 'axis',
      backgroundColor: ct.tooltipBg,
      borderColor: ct.tooltipBorder,
      borderWidth: 1,
      textStyle: { color: ct.tooltipText }
    },
    legend: {
      data: ['Open Rate', 'Click Rate'],
      bottom: 0,
      textStyle: { color: ct.legendText }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      axisLine: { lineStyle: { color: ct.axisLine } },
      axisLabel: { color: ct.axisLabel }
    },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: '{value}%', color: ct.axisLabel },
      splitLine: { lineStyle: { color: ct.splitLine, type: 'dashed' } }
    },
    series: [
      {
        name: 'Open Rate',
        type: 'line',
        data: [22, 24, 23, 26],
        smooth: true,
        lineStyle: { color: ct.primary, width: 3 },
        itemStyle: { color: ct.primary },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: `${ct.primary}33` },
              { offset: 1, color: `${ct.primary}00` }
            ]
          }
        }
      },
      {
        name: 'Click Rate',
        type: 'line',
        data: [3.1, 3.4, 2.9, 3.5],
        smooth: true,
        lineStyle: { color: ct.secondary, width: 3 },
        itemStyle: { color: ct.secondary }
      }
    ]
  }), [ct]);

  const subscriberChartOption = useMemo(() => ({
    tooltip: {
      trigger: 'axis',
      backgroundColor: ct.tooltipBg,
      borderColor: ct.tooltipBorder,
      borderWidth: 1,
      textStyle: { color: ct.tooltipText }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      axisLine: { lineStyle: { color: ct.axisLine } },
      axisLabel: { color: ct.axisLabel }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: ct.axisLabel },
      splitLine: { lineStyle: { color: ct.splitLine, type: 'dashed' } }
    },
    series: [
      {
        type: 'bar',
        data: [850, 920, 980, 1050, 1150, 1250],
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: ct.primary },
              { offset: 1, color: ct.secondary }
            ]
          },
          borderRadius: [4, 4, 0, 0]
        }
      }
    ]
  }), [ct]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-neutral-900 dark:text-white">Analytics</h1>
          <p className="text-neutral-500 mt-1">Track your newsletter performance</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportReport}
            disabled={exportingReport || analytics.totalSent === 0}
            className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-white/5 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-200 dark:hover:bg-white/10 transition-colors text-sm font-medium border border-neutral-200 dark:border-white/10 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {exportingReport ? 'Exporting...' : 'Export Report'}
          </button>
          <div className="flex items-center gap-2 bg-white dark:bg-surface-dark border border-neutral-200 dark:border-white/10 rounded-lg p-1">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={clsx(
                  'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                  dateRange === range
                    ? 'bg-primary-500 text-white'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5'
                )}
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div
            key={stat.name}
            className="bg-white dark:bg-surface-dark rounded-xl p-6 border border-neutral-200 dark:border-white/10 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={clsx('w-10 h-10 rounded-lg flex items-center justify-center', stat.bgColor)}>
                <stat.icon className={clsx('w-5 h-5', stat.color)} />
              </div>
              {stat.trend !== undefined && (
                <div className={clsx(
                  'flex items-center gap-1 text-sm font-medium',
                  stat.trend >= 0 ? 'text-success' : 'text-error'
                )}>
                  {stat.trend >= 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {Math.abs(stat.trend)}%
                </div>
              )}
            </div>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">{stat.value}</p>
            <p className="text-sm text-neutral-500">{stat.name}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Engagement Chart */}
        <div className="bg-white dark:bg-surface-dark rounded-xl p-6 border border-neutral-200 dark:border-white/10">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
            Engagement Over Time
          </h2>
          <ReactECharts option={engagementChartOption} style={{ height: 300 }} />
        </div>

        {/* Subscriber Growth Chart */}
        <div className="bg-white dark:bg-surface-dark rounded-xl p-6 border border-neutral-200 dark:border-white/10">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
            Subscriber Growth
          </h2>
          <ReactECharts option={subscriberChartOption} style={{ height: 300 }} />
        </div>
      </div>

      {/* AI Performance Tips */}
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-neutral-200 dark:border-white/10">
        <div className="p-6 border-b border-neutral-200 dark:border-white/10 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-warning" />
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">AI Performance Tips</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
          {aiTips.map((tip, i) => {
            const TipIcon = tip.icon;
            return (
              <div key={i} className={clsx('flex gap-3 p-4 rounded-xl', tip.bg)}>
                <div className="flex-shrink-0 mt-0.5">
                  <TipIcon className={clsx('w-5 h-5', tip.color)} />
                </div>
                <div>
                  <p className={clsx('font-medium text-sm mb-1', tip.color)}>{tip.title}</p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">{tip.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Newsletter Comparison Table */}
      {newsletters.length > 0 && (
        <div className="bg-white dark:bg-surface-dark rounded-xl border border-neutral-200 dark:border-white/10">
          <div className="p-6 border-b border-neutral-200 dark:border-white/10">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Newsletter Performance</h2>
            <p className="text-sm text-neutral-500 mt-1">All sent newsletters in the selected period</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-50 dark:bg-background-dark border-b border-neutral-200 dark:border-white/10">
                  <th className="text-left px-6 py-3 text-neutral-600 dark:text-neutral-400 font-medium">Newsletter</th>
                  <th className="text-right px-4 py-3 text-neutral-600 dark:text-neutral-400 font-medium">Sent</th>
                  <th className="text-right px-4 py-3 text-neutral-600 dark:text-neutral-400 font-medium">Open Rate</th>
                  <th className="text-right px-4 py-3 text-neutral-600 dark:text-neutral-400 font-medium">Click Rate</th>
                  <th className="text-right px-6 py-3 text-neutral-600 dark:text-neutral-400 font-medium">Unsubs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-white/5">
                {newsletters.map(n => (
                  <tr key={n.id} className="hover:bg-neutral-50 dark:hover:bg-white/5">
                    <td className="px-6 py-3">
                      <p className="font-medium text-neutral-900 dark:text-white truncate max-w-xs">{n.title}</p>
                      {n.sent_at && (
                        <p className="text-xs text-neutral-400 mt-0.5">{format(new Date(n.sent_at), 'MMM d, yyyy')}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-neutral-700 dark:text-neutral-300">
                      {n.stats?.total_sent?.toLocaleString() || '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {n.stats ? (
                        <span className={clsx(
                          'font-medium',
                          n.stats.open_rate >= 20 ? 'text-success' : n.stats.open_rate >= 10 ? 'text-warning' : 'text-error'
                        )}>
                          {n.stats.open_rate.toFixed(1)}%
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {n.stats ? (
                        <span className={clsx(
                          'font-medium',
                          n.stats.click_rate >= 3 ? 'text-success' : n.stats.click_rate >= 1 ? 'text-warning' : 'text-error'
                        )}>
                          {n.stats.click_rate.toFixed(1)}%
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-6 py-3 text-right text-neutral-500">
                      {n.stats?.unsubscribes ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
