import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Newsletter } from '@/lib/supabase';
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
  Calendar,
  ArrowUpRight
} from 'lucide-react';
import clsx from 'clsx';

interface AnalyticsData {
  totalSent: number;
  avgOpenRate: number;
  avgClickRate: number;
  totalSubscribers: number;
  openRateTrend: number;
  clickRateTrend: number;
}

export function AnalyticsPage() {
  const { tenant } = useAuth();
  const { resolvedTheme } = useTheme();
  const ct = useMemo(() => getChartTheme(resolvedTheme), [resolvedTheme]);
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);
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
      const { data } = await supabase
        .from('newsletters')
        .select('*')
        .eq('tenant_id', tenant!.id)
        .eq('status', 'sent');
      
      setNewsletters(data || []);

      // Mock analytics data
      setAnalytics({
        totalSent: data?.length || 0,
        avgOpenRate: 24.5,
        avgClickRate: 3.2,
        totalSubscribers: 1250,
        openRateTrend: 2.3,
        clickRateTrend: -0.5
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  }

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

  const topLinks = [
    { url: 'example.com/product', clicks: 245, ctr: '4.2%' },
    { url: 'example.com/blog/tips', clicks: 189, ctr: '3.8%' },
    { url: 'example.com/signup', clicks: 156, ctr: '3.1%' },
    { url: 'example.com/pricing', clicks: 134, ctr: '2.7%' },
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Analytics</h1>
          <p className="text-neutral-500 mt-1">Track your newsletter performance</p>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-1">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={clsx(
                'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                dateRange === range
                  ? 'bg-primary-500 text-white'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700'
              )}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div
            key={stat.name}
            className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700 shadow-sm"
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
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
            Engagement Over Time
          </h2>
          <ReactECharts option={engagementChartOption} style={{ height: 300 }} />
        </div>

        {/* Subscriber Growth Chart */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
            Subscriber Growth
          </h2>
          <ReactECharts option={subscriberChartOption} style={{ height: 300 }} />
        </div>
      </div>

      {/* Top Links */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700">
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Top Performing Links</h2>
        </div>
        <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
          {topLinks.map((link, index) => (
            <div key={index} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 bg-neutral-100 dark:bg-neutral-700 rounded-full flex items-center justify-center text-sm font-medium text-neutral-600 dark:text-neutral-400">
                  {index + 1}
                </span>
                <span className="text-neutral-900 dark:text-white">{link.url}</span>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-sm font-medium text-neutral-900 dark:text-white">{link.clicks}</p>
                  <p className="text-xs text-neutral-500">clicks</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-primary-600">{link.ctr}</p>
                  <p className="text-xs text-neutral-500">CTR</p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-neutral-400" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
