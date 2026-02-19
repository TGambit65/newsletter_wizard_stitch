import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Newsletter } from '@/lib/supabase';
import { api, SendTimeSlot } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { useBetaFeatures } from '@/hooks/useBetaFeatures';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  List,
  Clock,
  Mail,
  Plus,
  Zap,
  Lock,
} from 'lucide-react';
import clsx from 'clsx';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  parseISO,
  startOfDay,
} from 'date-fns';

type ViewMode = 'month' | 'week' | 'list';

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-info/10 text-info border-info/20',
  sent: 'bg-success/10 text-success border-success/20',
  draft: 'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-700 dark:text-neutral-300 dark:border-neutral-600',
};

function getNewslettersForDay(newsletters: Newsletter[], day: Date): Newsletter[] {
  return newsletters.filter(n => {
    const dateStr = n.scheduled_at || n.sent_at;
    if (!dateStr) return false;
    return isSameDay(parseISO(dateStr), day);
  });
}

export function SchedulingPage() {
  const { tenant } = useAuth();
  const toast = useToast();
  const { isBetaEnabled } = useBetaFeatures();
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [sendSlots, setSendSlots] = useState<SendTimeSlot[]>([]);
  const [loadingSendTime, setLoadingSendTime] = useState(false);

  useEffect(() => {
    if (tenant) {
      loadScheduledNewsletters();
      loadSendTimeRecommendations();
    }
  }, [tenant]);

  async function loadSendTimeRecommendations() {
    setLoadingSendTime(true);
    try {
      const result = await api.suggestSendTime();
      setSendSlots(result.recommended_slots);
    } catch {
      // silently fail — no recommendations
    } finally {
      setLoadingSendTime(false);
    }
  }

  async function loadScheduledNewsletters() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('newsletters')
        .select('*')
        .eq('tenant_id', tenant!.id)
        .or('status.eq.scheduled,status.eq.sent')
        .not('scheduled_at', 'is', null)
        .order('scheduled_at', { ascending: true });

      if (error) throw error;
      setNewsletters(data || []);
    } catch {
      toast.error('Failed to load scheduled newsletters');
    } finally {
      setLoading(false);
    }
  }

  // Build calendar days for month view
  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  // Build days for week view
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 });
    const end = endOfWeek(currentDate, { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  // Upcoming newsletters (sorted, future first)
  const upcoming = useMemo(() => {
    const today = startOfDay(new Date());
    return newsletters.filter(n => {
      const dateStr = n.scheduled_at || n.sent_at;
      if (!dateStr) return false;
      return parseISO(dateStr) >= today;
    });
  }, [newsletters]);

  function navigate(direction: 1 | -1) {
    if (viewMode === 'month') {
      setCurrentDate(d => direction === 1 ? addMonths(d, 1) : subMonths(d, 1));
    } else {
      setCurrentDate(d => direction === 1 ? addWeeks(d, 1) : subWeeks(d, 1));
    }
  }

  function goToToday() {
    setCurrentDate(new Date());
  }

  const periodLabel = viewMode === 'month'
    ? format(currentDate, 'MMMM yyyy')
    : `${format(startOfWeek(currentDate, { weekStartsOn: 0 }), 'MMM d')} – ${format(endOfWeek(currentDate, { weekStartsOn: 0 }), 'MMM d, yyyy')}`;

  const WEEK_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Scheduling</h1>
          <p className="text-neutral-500 mt-1">Plan and manage your newsletter send schedule</p>
        </div>
        <Link
          to="/wizard"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Schedule Newsletter
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Calendar panel */}
        <div className="flex-1">
          {/* Calendar controls */}
          <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(-1)}
                  aria-label="Previous period"
                  className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                </button>
                <h2 className="text-base font-semibold text-neutral-900 dark:text-white min-w-[160px] text-center">
                  {periodLabel}
                </h2>
                <button
                  onClick={() => navigate(1)}
                  aria-label="Next period"
                  className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                </button>
                <button
                  onClick={goToToday}
                  className="ml-2 px-2.5 py-1 text-xs font-medium border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 rounded hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                >
                  Today
                </button>
              </div>
              <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-900 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('month')}
                  aria-label="Month view"
                  className={clsx(
                    'p-1.5 rounded transition-colors',
                    viewMode === 'month'
                      ? 'bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-white'
                      : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                  )}
                >
                  <Calendar className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('week')}
                  aria-label="Week view"
                  className={clsx(
                    'p-1.5 rounded transition-colors',
                    viewMode === 'week'
                      ? 'bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-white'
                      : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                  )}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
              </div>
            ) : viewMode === 'month' ? (
              /* Month calendar grid */
              <div className="p-4">
                {/* Day headers */}
                <div className="grid grid-cols-7 mb-2">
                  {WEEK_HEADERS.map(d => (
                    <div key={d} className="text-center text-xs font-medium text-neutral-500 py-1">
                      {d}
                    </div>
                  ))}
                </div>
                {/* Day cells */}
                <div className="grid grid-cols-7 gap-px bg-neutral-200 dark:bg-neutral-700 rounded-lg overflow-hidden">
                  {monthDays.map(day => {
                    const dayNewsletters = getNewslettersForDay(newsletters, day);
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    const todayFlag = isToday(day);
                    return (
                      <div
                        key={day.toISOString()}
                        className={clsx(
                          'min-h-[80px] p-1.5 bg-white dark:bg-neutral-800 transition-colors',
                          !isCurrentMonth && 'opacity-40',
                          todayFlag && 'bg-primary-50 dark:bg-primary-900/10'
                        )}
                      >
                        <div className={clsx(
                          'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1',
                          todayFlag
                            ? 'bg-primary-500 text-white'
                            : 'text-neutral-600 dark:text-neutral-400'
                        )}>
                          {format(day, 'd')}
                        </div>
                        <div className="space-y-0.5">
                          {dayNewsletters.slice(0, 2).map(n => (
                            <Link
                              key={n.id}
                              to={`/newsletters/${n.id}/edit`}
                              title={n.title}
                              className={clsx(
                                'block truncate text-[10px] leading-tight px-1 py-0.5 rounded border transition-opacity hover:opacity-80',
                                STATUS_COLORS[n.status] || STATUS_COLORS.draft
                              )}
                            >
                              {n.title}
                            </Link>
                          ))}
                          {dayNewsletters.length > 2 && (
                            <p className="text-[10px] text-neutral-400 pl-1">
                              +{dayNewsletters.length - 2} more
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Week view */
              <div className="p-4">
                <div className="grid grid-cols-7 gap-px bg-neutral-200 dark:bg-neutral-700 rounded-lg overflow-hidden">
                  {weekDays.map(day => {
                    const dayNewsletters = getNewslettersForDay(newsletters, day);
                    const todayFlag = isToday(day);
                    return (
                      <div
                        key={day.toISOString()}
                        className={clsx(
                          'min-h-[200px] p-2 bg-white dark:bg-neutral-800',
                          todayFlag && 'bg-primary-50 dark:bg-primary-900/10'
                        )}
                      >
                        <div className="text-center mb-2">
                          <p className="text-xs font-medium text-neutral-500">{format(day, 'EEE')}</p>
                          <div className={clsx(
                            'text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full mx-auto',
                            todayFlag ? 'bg-primary-500 text-white' : 'text-neutral-900 dark:text-white'
                          )}>
                            {format(day, 'd')}
                          </div>
                        </div>
                        <div className="space-y-1">
                          {dayNewsletters.map(n => (
                            <Link
                              key={n.id}
                              to={`/newsletters/${n.id}/edit`}
                              className={clsx(
                                'block text-xs px-1.5 py-1 rounded border truncate transition-opacity hover:opacity-80',
                                STATUS_COLORS[n.status] || STATUS_COLORS.draft
                              )}
                            >
                              {n.scheduled_at && (
                                <span className="flex items-center gap-0.5 mb-0.5 opacity-70">
                                  <Clock className="w-2.5 h-2.5" />
                                  {format(parseISO(n.scheduled_at), 'h:mm a')}
                                </span>
                              )}
                              {n.title}
                            </Link>
                          ))}
                          {dayNewsletters.length === 0 && (
                            <p className="text-[10px] text-neutral-300 dark:text-neutral-600 text-center pt-4">
                              Nothing scheduled
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming sidebar */}
        <div className="lg:w-72 flex-shrink-0">
          <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
              <h3 className="font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary-500" />
                Upcoming Sends
              </h3>
            </div>

            {loading ? (
              <div className="p-4 space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4 mb-1.5" />
                    <div className="h-2.5 bg-neutral-100 dark:bg-neutral-600 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : upcoming.length === 0 ? (
              <div className="p-6 text-center">
                <Mail className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
                <p className="text-sm text-neutral-500">No upcoming sends</p>
                <Link
                  to="/newsletters"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary-600 dark:text-primary-400 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Schedule one
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-neutral-200 dark:divide-neutral-700 max-h-[500px] overflow-y-auto">
                {upcoming.map(n => {
                  const dateStr = n.scheduled_at || n.sent_at;
                  const date = dateStr ? parseISO(dateStr) : null;
                  return (
                    <Link
                      key={n.id}
                      to={`/newsletters/${n.id}/edit`}
                      className="flex items-start gap-3 p-4 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors"
                    >
                      <div className={clsx(
                        'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5',
                        n.status === 'scheduled'
                          ? 'bg-info/10 text-info'
                          : 'bg-success/10 text-success'
                      )}>
                        <Mail className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">{n.title}</p>
                        {date && (
                          <p className="text-xs text-neutral-500 mt-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(date, 'MMM d, yyyy')}
                            {n.scheduled_at && ` at ${format(date, 'h:mm a')}`}
                          </p>
                        )}
                        <span className={clsx(
                          'inline-block mt-1 px-1.5 py-0.5 text-xs font-medium rounded-full capitalize',
                          n.status === 'scheduled'
                            ? 'bg-info/10 text-info'
                            : 'bg-success/10 text-success'
                        )}>
                          {n.status}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="mt-4 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-3">Legend</p>
            <div className="space-y-2">
              {[
                { label: 'Scheduled', color: 'bg-info/10 text-info border-info/20' },
                { label: 'Sent', color: 'bg-success/10 text-success border-success/20' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2">
                  <span className={clsx('w-3 h-3 rounded border flex-shrink-0', item.color)} />
                  <span className="text-xs text-neutral-600 dark:text-neutral-400">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Send Time Recommendations — beta-gated */}
          <div className="mt-4 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-warning" />
              AI Best Times
            </p>
            {!isBetaEnabled('smart-scheduling') ? (
              <div className="flex flex-col items-center gap-2 py-2 text-center">
                <Lock className="w-4 h-4 text-neutral-300 dark:text-neutral-600" />
                <p className="text-xs text-neutral-400">
                  Enable{' '}
                  <Link to="/beta-lab" className="text-primary-500 hover:underline">
                    Smart Scheduling AI
                  </Link>{' '}
                  in Beta Lab to see optimal send times.
                </p>
              </div>
            ) : loadingSendTime ? (
              <div className="space-y-2 animate-pulse">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded" />
                ))}
              </div>
            ) : sendSlots.length === 0 ? (
              <p className="text-xs text-neutral-400 leading-relaxed">
                Send more newsletters to get personalized timing recommendations.
              </p>
            ) : (
              <div className="space-y-2">
                {sendSlots.slice(0, 3).map((slot, i) => {
                  const hour = slot.hour;
                  const timeLabel = hour === 0 ? '12am' : hour < 12 ? `${hour}am` : hour === 12 ? '12pm' : `${hour - 12}pm`;
                  return (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-neutral-700 dark:text-neutral-300">
                        {slot.day_name}s at {timeLabel}
                      </span>
                      {slot.avg_open_rate != null && (
                        <span className="text-success font-medium">
                          {slot.avg_open_rate.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
