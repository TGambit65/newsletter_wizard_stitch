import { useMemo, useState } from 'react';
import { KnowledgeSource } from '@/lib/supabase';
import {
  ChevronDown,
  ChevronUp,
  Activity,
  Database,
  Clock,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  AlertCircle,
  Trash2,
  Download,
  XCircle
} from 'lucide-react';
import clsx from 'clsx';

interface HealthDashboardProps {
  sources: KnowledgeSource[];
  onRetry: (source: KnowledgeSource) => void;
  onDelete: (id: string) => void;
  onRefresh: (source: KnowledgeSource) => void;
  staleDaysThreshold?: number;
}

interface SourceStats {
  total: number;
  ready: number;
  processing: number;
  pending: number;
  failed: number;
  totalTokens: number;
  lastUpdated: Date | null;
}

interface AttentionItem {
  source: KnowledgeSource;
  reason: 'failed' | 'stale' | 'token_limit';
  message: string;
}

// Helper to get age in days
function getAgeDays(date: string | Date): number {
  const created = new Date(date);
  const now = new Date();
  return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
}

// Helper to get age badge
function getAgeBadge(days: number): { label: string; color: string } {
  if (days < 7) return { label: 'Fresh', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' };
  if (days < 30) return { label: 'Recent', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' };
  return { label: 'Stale', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' };
}

export function HealthDashboard({
  sources,
  onRetry,
  onDelete,
  onRefresh,
  staleDaysThreshold = 30
}: HealthDashboardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  // Calculate stats
  const stats = useMemo<SourceStats>(() => {
    const result: SourceStats = {
      total: sources.length,
      ready: 0,
      processing: 0,
      pending: 0,
      failed: 0,
      totalTokens: 0,
      lastUpdated: null
    };

    sources.forEach(source => {
      switch (source.status) {
        case 'ready': result.ready++; break;
        case 'processing': result.processing++; break;
        case 'pending': result.pending++; break;
        case 'error': result.failed++; break;
      }
      result.totalTokens += source.token_count || 0;
      
      const updated = new Date(source.updated_at || source.created_at);
      if (!result.lastUpdated || updated > result.lastUpdated) {
        result.lastUpdated = updated;
      }
    });

    return result;
  }, [sources]);

  // Items needing attention
  const attentionItems = useMemo<AttentionItem[]>(() => {
    const items: AttentionItem[] = [];
    const TOKEN_LIMIT = 50000; // Per-source token limit (configurable)

    sources.forEach(source => {
      // Failed sources
      if (source.status === 'error') {
        items.push({
          source,
          reason: 'failed',
          message: source.error_message || 'Processing failed'
        });
      }
      // Stale sources
      else if (source.status === 'ready') {
        const days = getAgeDays(source.updated_at || source.created_at);
        if (days >= staleDaysThreshold) {
          items.push({
            source,
            reason: 'stale',
            message: `Not refreshed in ${days} days`
          });
        }
        // Token limit warning
        if ((source.token_count || 0) > TOKEN_LIMIT * 0.8) {
          items.push({
            source,
            reason: 'token_limit',
            message: `${Math.round(((source.token_count || 0) / TOKEN_LIMIT) * 100)}% of token limit`
          });
        }
      }
    });

    return items.slice(0, 10); // Limit to top 10
  }, [sources, staleDaysThreshold]);

  // Processing queue
  const processingQueue = useMemo(() => {
    return sources.filter(s => s.status === 'processing' || s.status === 'pending');
  }, [sources]);

  // Donut chart calculations
  const chartData = useMemo(() => {
    const data = [
      { status: 'ready', count: stats.ready, color: '#22c55e', label: 'Ready' },
      { status: 'processing', count: stats.processing, color: '#f59e0b', label: 'Processing' },
      { status: 'pending', count: stats.pending, color: '#9ca3af', label: 'Pending' },
      { status: 'error', count: stats.failed, color: '#ef4444', label: 'Failed' },
    ].filter(d => d.count > 0);

    let cumulative = 0;
    return data.map(d => {
      const percentage = (d.count / stats.total) * 100;
      const startAngle = cumulative;
      cumulative += percentage;
      return { ...d, percentage, startAngle, endAngle: cumulative };
    });
  }, [stats]);

  // Export health report
  const exportReport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      summary: stats,
      attentionItems: attentionItems.map(item => ({
        title: item.source.title,
        type: item.source.source_type,
        reason: item.reason,
        message: item.message
      })),
      allSources: sources.map(s => ({
        title: s.title,
        type: s.source_type,
        status: s.status,
        tokens: s.token_count,
        chunks: s.chunk_count,
        created: s.created_at,
        updated: s.updated_at
      }))
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `knowledge-base-health-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (sources.length === 0) return null;

  return (
    <div className="mb-6 bg-white dark:bg-surface-dark rounded-xl border border-neutral-200 dark:border-white/10 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-750 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-primary-500" />
          <span className="font-semibold text-neutral-900 dark:text-white">Knowledge Base Health</span>
          {attentionItems.length > 0 && (
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs font-medium rounded-full">
              {attentionItems.length} need attention
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-neutral-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-neutral-400" />
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-6 pb-6 border-t border-neutral-100 dark:border-white/10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-neutral-50 dark:bg-background-dark rounded-lg p-4">
                <div className="flex items-center gap-2 text-neutral-500 text-sm mb-1">
                  <Database className="w-4 h-4" />
                  Total Sources
                </div>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.total}</p>
              </div>
              <div className="bg-neutral-50 dark:bg-background-dark rounded-lg p-4">
                <div className="flex items-center gap-2 text-neutral-500 text-sm mb-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Ready
                </div>
                <p className="text-2xl font-bold text-green-600">{stats.ready}</p>
              </div>
              <div className="bg-neutral-50 dark:bg-background-dark rounded-lg p-4">
                <div className="flex items-center gap-2 text-neutral-500 text-sm mb-1">
                  <Activity className="w-4 h-4" />
                  Tokens
                </div>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {stats.totalTokens >= 1000 ? `${(stats.totalTokens / 1000).toFixed(1)}k` : stats.totalTokens}
                </p>
              </div>
              <div className="bg-neutral-50 dark:bg-background-dark rounded-lg p-4">
                <div className="flex items-center gap-2 text-neutral-500 text-sm mb-1">
                  <Clock className="w-4 h-4" />
                  Last Updated
                </div>
                <p className="text-lg font-bold text-neutral-900 dark:text-white">
                  {stats.lastUpdated ? stats.lastUpdated.toLocaleDateString() : '-'}
                </p>
              </div>
            </div>

            {/* Status Chart */}
            <div className="flex items-center justify-center gap-6">
              {/* SVG Donut Chart */}
              <div className="relative">
                <svg
                  width="120"
                  height="120"
                  viewBox="0 0 120 120"
                  role="img"
                  aria-label={`Source status: ${chartData.map(d => `${d.label} ${d.count}`).join(', ')}`}
                >
                  {chartData.length === 0 ? (
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="16"
                    />
                  ) : (
                    chartData.map((segment, i) => {
                      const radius = 50;
                      const circumference = 2 * Math.PI * radius;
                      const strokeDasharray = (segment.percentage / 100) * circumference;
                      const strokeDashoffset = -(segment.startAngle / 100) * circumference;
                      
                      return (
                        <circle
                          key={i}
                          cx="60"
                          cy="60"
                          r={radius}
                          fill="none"
                          stroke={segment.color}
                          strokeWidth="16"
                          strokeDasharray={`${strokeDasharray} ${circumference}`}
                          strokeDashoffset={strokeDashoffset}
                          transform="rotate(-90 60 60)"
                          className={clsx(
                            'cursor-pointer transition-opacity',
                            selectedStatus && selectedStatus !== segment.status && 'opacity-40'
                          )}
                          onClick={() => setSelectedStatus(
                            selectedStatus === segment.status ? null : segment.status
                          )}
                        />
                      );
                    })
                  )}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-neutral-900 dark:text-white">
                    {stats.total}
                  </span>
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-2">
                {chartData.map((segment, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedStatus(
                      selectedStatus === segment.status ? null : segment.status
                    )}
                    className={clsx(
                      'flex items-center gap-2 text-sm transition-opacity',
                      selectedStatus && selectedStatus !== segment.status && 'opacity-40'
                    )}
                  >
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: segment.color }}
                    />
                    <span className="text-neutral-700 dark:text-neutral-300">
                      {segment.label}
                    </span>
                    <span className="font-medium text-neutral-900 dark:text-white">
                      {segment.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Attention Required */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-neutral-900 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Attention Required
                </h4>
                <button
                  onClick={exportReport}
                  className="text-xs text-primary-500 hover:text-primary-600 flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  Export
                </button>
              </div>

              {attentionItems.length === 0 ? (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                  <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-green-700 dark:text-green-400">
                    All sources are healthy!
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {attentionItems.map((item, i) => (
                    <div
                      key={i}
                      className={clsx(
                        'rounded-lg p-3 border-l-4',
                        item.reason === 'failed' 
                          ? 'bg-red-50 dark:bg-red-900/20 border-red-500'
                          : item.reason === 'stale'
                          ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-500'
                          : 'bg-orange-50 dark:bg-orange-900/20 border-orange-500'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                            {item.source.title}
                          </p>
                          <p className="text-xs text-neutral-500 mt-0.5">{item.message}</p>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => item.reason === 'failed' ? onRetry(item.source) : onRefresh(item.source)}
                            className="p-1 hover:bg-white/50 dark:hover:bg-black/20 rounded"
                            title={item.reason === 'failed' ? 'Retry' : 'Refresh'}
                          >
                            <RefreshCw className="w-3.5 h-3.5 text-neutral-600" />
                          </button>
                          <button
                            onClick={() => onDelete(item.source.id)}
                            className="p-1 hover:bg-white/50 dark:hover:bg-black/20 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Processing Queue */}
          {processingQueue.length > 0 && (
            <div className="mt-6 pt-6 border-t border-neutral-100 dark:border-white/10">
              <h4 className="font-medium text-neutral-900 dark:text-white flex items-center gap-2 mb-3">
                <RefreshCw className="w-4 h-4 text-amber-500 animate-spin" />
                Processing Queue ({processingQueue.length})
              </h4>
              <div className="space-y-2">
                {processingQueue.slice(0, 5).map((source) => (
                  <div
                    key={source.id}
                    className="flex items-center gap-3 bg-neutral-50 dark:bg-background-dark rounded-lg p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                        {source.title}
                      </p>
                      <div
                        className="mt-1 w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-1.5"
                        role="progressbar"
                        aria-label={`${source.title} ${source.status}`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={source.status === 'processing' ? 60 : 20}
                      >
                        <div
                          className="bg-primary-500 h-1.5 rounded-full animate-pulse"
                          style={{ width: source.status === 'processing' ? '60%' : '20%' }}
                        />
                      </div>
                    </div>
                    <span className={clsx(
                      'text-xs font-medium capitalize px-2 py-1 rounded',
                      source.status === 'processing' 
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        : 'bg-neutral-200 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400'
                    )}>
                      {source.status}
                    </span>
                  </div>
                ))}
                {processingQueue.length > 5 && (
                  <p className="text-xs text-neutral-500 text-center">
                    +{processingQueue.length - 5} more in queue
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Source Age Badge Component (for use in source cards)
export function SourceAgeBadge({ date }: { date: string | Date }) {
  const days = getAgeDays(date);
  const { label, color } = getAgeBadge(days);
  
  return (
    <span className={clsx('px-2 py-0.5 text-xs font-medium rounded', color)}>
      {label}
    </span>
  );
}
