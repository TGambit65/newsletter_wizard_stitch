import { Wand2, FileText, Database, Sparkles, Clock, X } from 'lucide-react';
import type { SessionMetrics } from '@/contexts/SessionMetricsContext';

interface SessionSummaryProps {
  metrics: SessionMetrics;
  onConfirmSignOut: () => void;
  onDismiss: () => void;
}

function formatDuration(start: Date): string {
  const ms = Date.now() - start.getTime();
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return 'less than a minute';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function getGoodbyeMessage(metrics: SessionMetrics): string {
  const total = metrics.newslettersCreated + metrics.newslettersEdited + metrics.sourcesAdded + metrics.aiGenerations;
  if (total === 0) return "Short session — see you next time!";
  if (metrics.newslettersCreated > 0) return "Great work creating new content! Your audience will love it.";
  if (metrics.aiGenerations > 2) return "You really put the AI to work today. Nice efficiency!";
  if (metrics.sourcesAdded > 0) return "Knowledge base growing stronger. Keep it up!";
  return "Another productive session in the books. See you soon!";
}

function StatRow({ icon: Icon, label, value, color }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
}) {
  if (value === 0) return null;
  return (
    <div className="flex items-center gap-3">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <span className="flex-1 text-sm text-neutral-600 dark:text-neutral-400">{label}</span>
      <span className="text-sm font-semibold text-neutral-900 dark:text-white">{value}</span>
    </div>
  );
}

export function SessionSummary({ metrics, onConfirmSignOut, onDismiss }: SessionSummaryProps) {
  const duration = formatDuration(metrics.sessionStart);
  const goodbye = getGoodbyeMessage(metrics);
  const hasActivity = (
    metrics.newslettersCreated +
    metrics.newslettersEdited +
    metrics.sourcesAdded +
    metrics.aiGenerations
  ) > 0;

  return (
    /* Backdrop */
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm bg-white dark:bg-surface-dark rounded-2xl shadow-xl border border-neutral-200 dark:border-white/10 overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-primary-50 to-white dark:from-primary-900/20 dark:to-neutral-800 px-6 pt-8 pb-6 text-center">
          <button
            onClick={onDismiss}
            className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Wand2 className="w-8 h-8 text-primary-500" />
          </div>

          <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-1">Session Summary</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{goodbye}</p>
        </div>

        {/* Stats */}
        <div className="px-6 py-5">
          {hasActivity ? (
            <div className="space-y-3 mb-5">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-neutral-400" />
                <span className="text-xs text-neutral-400">Session duration: {duration}</span>
              </div>
              <StatRow
                icon={FileText}
                label="Newsletters created"
                value={metrics.newslettersCreated}
                color="bg-primary-50 dark:bg-primary-900/20 text-primary-500"
              />
              <StatRow
                icon={FileText}
                label="Newsletters edited"
                value={metrics.newslettersEdited}
                color="bg-neutral-100 dark:bg-neutral-700 text-neutral-500"
              />
              <StatRow
                icon={Database}
                label="Sources added"
                value={metrics.sourcesAdded}
                color="bg-success/10 text-success"
              />
              <StatRow
                icon={Sparkles}
                label="AI generations"
                value={metrics.aiGenerations}
                color="bg-warning/10 text-warning"
              />
            </div>
          ) : (
            <div className="text-center py-4 mb-5">
              <Clock className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
              <p className="text-sm text-neutral-400">Session duration: {duration}</p>
            </div>
          )}

          {/* Quick links */}
          <div className="flex gap-2 text-xs mb-5">
            <a
              href="/newsletters"
              onClick={onDismiss}
              className="flex-1 text-center py-2 border border-neutral-200 dark:border-white/10 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors"
            >
              Save drafts
            </a>
            <a
              href="/scheduling"
              onClick={onDismiss}
              className="flex-1 text-center py-2 border border-neutral-200 dark:border-white/10 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors"
            >
              Schedule pending
            </a>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onDismiss}
              className="flex-1 py-2.5 border border-neutral-200 dark:border-white/10 rounded-lg text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors"
            >
              Keep working
            </button>
            <button
              onClick={onConfirmSignOut}
              className="flex-1 py-2.5 bg-error/10 text-error border border-error/20 rounded-lg text-sm font-medium hover:bg-error/20 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
