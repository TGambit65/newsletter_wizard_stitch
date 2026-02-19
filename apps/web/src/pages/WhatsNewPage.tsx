import { useState, useEffect } from 'react';
import { Sparkles, Zap, Shield, BarChart3, BookOpen, Calendar, Users, Search, Mic } from 'lucide-react';
import clsx from 'clsx';

type Tag = 'new' | 'improvement' | 'fix' | 'beta';

interface ChangelogEntry {
  id: string;
  date: string;
  version: string;
  title: string;
  description: string;
  tag: Tag;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  iconBg: string;
}

const TAG_CONFIG: Record<Tag, { label: string; color: string; bg: string }> = {
  new: { label: 'New', color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-50 dark:bg-primary-900/20' },
  improvement: { label: 'Improvement', color: 'text-success', bg: 'bg-success/10' },
  fix: { label: 'Fix', color: 'text-neutral-600 dark:text-neutral-400', bg: 'bg-neutral-100 dark:bg-neutral-700' },
  beta: { label: 'Beta', color: 'text-warning', bg: 'bg-warning/10' },
};

const ENTRIES: ChangelogEntry[] = [
  {
    id: 'phase4-team',
    date: '2026-02-19',
    version: '0.9.0',
    title: 'Team Management',
    description: 'Invite collaborators to your workspace with role-based access control. Assign Admin, Editor, or Viewer roles. View permissions matrix showing exactly what each role can do.',
    tag: 'new',
    icon: Users,
    iconColor: 'text-primary-600 dark:text-primary-400',
    iconBg: 'bg-primary-50 dark:bg-primary-900/20',
  },
  {
    id: 'phase4-brandvoice',
    date: '2026-02-19',
    version: '0.9.0',
    title: 'Brand Voice Advanced UI',
    description: 'Redesigned brand voice configuration with archetype picker (Educator, Entertainer, Authority, Storyteller, Analyst), interactive tone sliders, and a live playground to preview AI output.',
    tag: 'improvement',
    icon: Mic,
    iconColor: 'text-teal-600 dark:text-teal-400',
    iconBg: 'bg-teal-50 dark:bg-teal-900/20',
  },
  {
    id: 'phase4-search',
    date: '2026-02-19',
    version: '0.9.0',
    title: 'Global Search (Cmd+K)',
    description: 'Press Cmd/Ctrl+K from anywhere to instantly find newsletters, knowledge sources, and pages. Full search page at /search with type filters and date info.',
    tag: 'new',
    icon: Search,
    iconColor: 'text-purple-600 dark:text-purple-400',
    iconBg: 'bg-purple-50 dark:bg-purple-900/20',
  },
  {
    id: 'phase4-analytics',
    date: '2026-02-19',
    version: '0.9.0',
    title: 'Real Analytics + AI Tips',
    description: 'Analytics now uses real newsletter_stats data. Date range filter actually affects results. New AI tips section generates data-driven suggestions. Newsletter comparison table added.',
    tag: 'improvement',
    icon: BarChart3,
    iconColor: 'text-success',
    iconBg: 'bg-success/10',
  },
  {
    id: 'phase3-templates',
    date: '2026-02-18',
    version: '0.8.0',
    title: 'Template Library',
    description: '12 curated newsletter templates across 6 categories. Filter by goal (grow subscribers, drive clicks, re-engage, inform). One-click to create a newsletter from any template.',
    tag: 'new',
    icon: BookOpen,
    iconColor: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-50 dark:bg-amber-900/20',
  },
  {
    id: 'phase3-scheduling',
    date: '2026-02-18',
    version: '0.8.0',
    title: 'Scheduling Calendar',
    description: 'Visual month and week calendar showing all scheduled and sent newsletters. Navigate forward/back, switch views, see upcoming sends in the sidebar.',
    tag: 'new',
    icon: Calendar,
    iconColor: 'text-info',
    iconBg: 'bg-info/10',
  },
  {
    id: 'phase3-preview',
    date: '2026-02-18',
    version: '0.8.0',
    title: 'Multi-Device Email Preview',
    description: 'Preview your newsletter on Desktop, Tablet, and Mobile. Includes inbox simulation header, quality check grades (A–F) for subject line, content, and spam word detection.',
    tag: 'improvement',
    icon: Sparkles,
    iconColor: 'text-primary-600 dark:text-primary-400',
    iconBg: 'bg-primary-50 dark:bg-primary-900/20',
  },
  {
    id: 'phase2-darkmode',
    date: '2026-02-15',
    version: '0.7.0',
    title: 'Dark Mode & Theme System',
    description: 'Full dark mode support with system-preference detection. Toggle between Light, Dark, and System in the sidebar or top bar. ECharts charts are fully theme-aware.',
    tag: 'new',
    icon: Shield,
    iconColor: 'text-neutral-600 dark:text-neutral-400',
    iconBg: 'bg-neutral-100 dark:bg-neutral-700',
  },
  {
    id: 'phase1-toast',
    date: '2026-02-12',
    version: '0.6.0',
    title: 'Toast Notifications & Confirm Dialogs',
    description: 'All actions now provide proper feedback via toast notifications. Delete operations use accessible confirm dialogs with keyboard support (Escape to close, Enter to confirm).',
    tag: 'improvement',
    icon: Zap,
    iconColor: 'text-warning',
    iconBg: 'bg-warning/10',
  },
];

const READ_KEY = 'whats-new-last-read';

function getLastRead(): string {
  return localStorage.getItem(READ_KEY) || '';
}

function markAllRead() {
  localStorage.setItem(READ_KEY, new Date().toISOString().split('T')[0]);
}

export function WhatsNewPage() {
  const [lastRead, setLastRead] = useState(getLastRead);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    markAllRead();
    setLastRead(today);
  }, []);

  const unreadCount = ENTRIES.filter(e => e.date > lastRead).length;

  // Group by version
  const grouped = ENTRIES.reduce<Record<string, ChangelogEntry[]>>((acc, entry) => {
    if (!acc[entry.version]) acc[entry.version] = [];
    acc[entry.version].push(entry);
    return acc;
  }, {});

  const versions = Object.keys(grouped).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-6 h-6 text-primary-500" />
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">What's New</h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold bg-primary-500 text-white rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          <p className="text-neutral-500">Latest features, improvements, and fixes</p>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-10">
        {versions.map(version => (
          <div key={version}>
            {/* Version header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="px-3 py-1 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg text-sm font-bold font-mono">
                v{version}
              </div>
              <div className="text-sm text-neutral-400">
                {grouped[version][0].date}
              </div>
              <div className="flex-1 border-t border-neutral-200 dark:border-neutral-700" />
            </div>

            {/* Entries */}
            <div className="space-y-4 pl-4 border-l-2 border-neutral-200 dark:border-neutral-700">
              {grouped[version].map(entry => {
                const tagConf = TAG_CONFIG[entry.tag];
                const Icon = entry.icon;
                const isNew = entry.date > lastRead;
                return (
                  <div key={entry.id} className={clsx(
                    'relative bg-white dark:bg-neutral-800 rounded-xl border p-5 transition-all',
                    isNew
                      ? 'border-primary-200 dark:border-primary-800 shadow-sm'
                      : 'border-neutral-200 dark:border-neutral-700'
                  )}>
                    {/* Timeline dot */}
                    <div className="absolute -left-[calc(1rem+5px)] top-6 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-neutral-900 bg-neutral-400 dark:bg-neutral-500" />

                    <div className="flex items-start gap-4">
                      <div className={clsx('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', entry.iconBg)}>
                        <Icon className={clsx('w-5 h-5', entry.iconColor)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-semibold text-neutral-900 dark:text-white">{entry.title}</h3>
                          <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', tagConf.bg, tagConf.color)}>
                            {tagConf.label}
                          </span>
                          {isNew && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary-500 text-white font-medium">
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">{entry.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-10 p-5 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl text-center">
        <p className="text-sm text-neutral-500">
          Want to suggest a feature?{' '}
          <a href="/feedback" className="text-primary-600 dark:text-primary-400 hover:underline font-medium">
            Submit a feature request
          </a>
        </p>
      </div>
    </div>
  );
}
