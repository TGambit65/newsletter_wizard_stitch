import { useState } from 'react';
import { useToast } from '@/components/ui/Toast';
import {
  Zap,
  ToggleLeft,
  ToggleRight,
  ThumbsUp,
  ThumbsDown,
  Lock,
  Star,
  FlaskConical,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import clsx from 'clsx';

type Stability = 'stable' | 'beta' | 'experimental';
type Tier = 'free' | 'pro' | 'business';

interface BetaFeature {
  id: string;
  name: string;
  description: string;
  stability: Stability;
  requiredTier: Tier;
  upvotes: number;
  downvotes: number;
  userVote: 'up' | 'down' | null;
  enabled: boolean;
  comingSoon?: boolean;
}

const STABILITY_CONFIG: Record<Stability, { label: string; color: string; bg: string }> = {
  stable: { label: 'Stable', color: 'text-success', bg: 'bg-success/10' },
  beta: { label: 'Beta', color: 'text-warning', bg: 'bg-warning/10' },
  experimental: { label: 'Experimental', color: 'text-error', bg: 'bg-error/10' },
};

const INITIAL_FEATURES: BetaFeature[] = [
  {
    id: 'ai-subject-optimizer',
    name: 'AI Subject Line Optimizer',
    description: 'Automatically generate and A/B test multiple subject lines. AI picks the winner based on historical open rate patterns.',
    stability: 'beta',
    requiredTier: 'pro',
    upvotes: 142,
    downvotes: 8,
    userVote: null,
    enabled: false,
  },
  {
    id: 'smart-send-time',
    name: 'Smart Send Time',
    description: 'Analyze each subscriber\'s open history to send newsletters at their optimal time, not a single broadcast time.',
    stability: 'experimental',
    requiredTier: 'business',
    upvotes: 89,
    downvotes: 12,
    userVote: null,
    enabled: false,
  },
  {
    id: 'content-repurposer',
    name: 'Content Repurposer',
    description: 'One-click conversion of newsletter content into blog posts, LinkedIn articles, and podcast scripts.',
    stability: 'beta',
    requiredTier: 'pro',
    upvotes: 201,
    downvotes: 5,
    userVote: null,
    enabled: true,
  },
  {
    id: 'audience-segments',
    name: 'Audience Segmentation',
    description: 'Split your subscriber list into segments by engagement level, join date, or custom tags. Send targeted versions.',
    stability: 'beta',
    requiredTier: 'business',
    upvotes: 178,
    downvotes: 9,
    userVote: null,
    enabled: false,
  },
  {
    id: 'ai-image-prompts',
    name: 'AI Image Prompt Generator',
    description: 'Generate optimized image prompts for DALL-E or Midjourney based on your newsletter content and brand voice.',
    stability: 'experimental',
    requiredTier: 'pro',
    upvotes: 95,
    downvotes: 22,
    userVote: null,
    enabled: false,
  },
  {
    id: 'rss-auto-digest',
    name: 'RSS Auto-Digest',
    description: 'Monitor RSS feeds from your knowledge sources and auto-draft newsletters when new content matches your topics.',
    stability: 'experimental',
    requiredTier: 'pro',
    upvotes: 134,
    downvotes: 15,
    userVote: null,
    enabled: false,
    comingSoon: true,
  },
  {
    id: 'collaborative-editing',
    name: 'Collaborative Editing',
    description: 'Real-time co-editing of newsletters with team members. See cursors, leave inline comments, and track changes.',
    stability: 'experimental',
    requiredTier: 'business',
    upvotes: 267,
    downvotes: 3,
    userVote: null,
    enabled: false,
    comingSoon: true,
  },
  {
    id: 'inbox-preview',
    name: 'Live Inbox Preview',
    description: 'Preview your newsletter exactly as it appears in Gmail, Outlook, Apple Mail, and mobile clients before sending.',
    stability: 'stable',
    requiredTier: 'free',
    upvotes: 312,
    downvotes: 7,
    userVote: null,
    enabled: true,
  },
];

// Simulated current user tier
const CURRENT_TIER: Tier = 'pro';
const TIER_ORDER: Tier[] = ['free', 'pro', 'business'];

function canAccess(requiredTier: Tier): boolean {
  return TIER_ORDER.indexOf(CURRENT_TIER) >= TIER_ORDER.indexOf(requiredTier);
}

export function BetaLabPage() {
  const toast = useToast();
  const [features, setFeatures] = useState<BetaFeature[]>(INITIAL_FEATURES);
  const [masterEnabled, setMasterEnabled] = useState(true);
  const [filter, setFilter] = useState<Stability | 'all'>('all');

  function toggleFeature(id: string) {
    setFeatures(prev => prev.map(f => {
      if (f.id !== id) return f;
      if (!canAccess(f.requiredTier)) {
        toast.error(`This feature requires a ${f.requiredTier} plan`);
        return f;
      }
      if (f.comingSoon) {
        toast.error('This feature is coming soon');
        return f;
      }
      const next = !f.enabled;
      toast.success(`${f.name} ${next ? 'enabled' : 'disabled'}`);
      return { ...f, enabled: next };
    }));
  }

  function vote(id: string, direction: 'up' | 'down') {
    setFeatures(prev => prev.map(f => {
      if (f.id !== id) return f;
      if (f.userVote === direction) {
        // Unvote
        return {
          ...f,
          userVote: null,
          upvotes: direction === 'up' ? f.upvotes - 1 : f.upvotes,
          downvotes: direction === 'down' ? f.downvotes - 1 : f.downvotes,
        };
      }
      const wasOpposite = f.userVote !== null;
      return {
        ...f,
        userVote: direction,
        upvotes: direction === 'up'
          ? f.upvotes + 1
          : wasOpposite ? f.upvotes - 1 : f.upvotes,
        downvotes: direction === 'down'
          ? f.downvotes + 1
          : wasOpposite ? f.downvotes - 1 : f.downvotes,
      };
    }));
  }

  const filtered = features.filter(f => filter === 'all' || f.stability === filter);
  const sortedFiltered = [...filtered].sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes));
  const enabledCount = features.filter(f => f.enabled).length;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FlaskConical className="w-6 h-6 text-primary-500" />
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Beta Lab</h1>
          </div>
          <p className="text-neutral-500">Try experimental features and vote on what ships next</p>
        </div>

        {/* Master toggle */}
        <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl">
          <div>
            <p className="text-sm font-medium text-neutral-900 dark:text-white">Beta features</p>
            <p className="text-xs text-neutral-500">{enabledCount} of {features.length} enabled</p>
          </div>
          <button
            onClick={() => {
              setMasterEnabled(v => !v);
              if (masterEnabled) {
                setFeatures(prev => prev.map(f => ({ ...f, enabled: false })));
                toast.success('All beta features disabled');
              } else {
                toast.success('Beta features re-enabled');
              }
            }}
            aria-label="Toggle all beta features"
            className="flex-shrink-0"
          >
            {masterEnabled ? (
              <ToggleRight className="w-8 h-8 text-primary-500" />
            ) : (
              <ToggleLeft className="w-8 h-8 text-neutral-400" />
            )}
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(['all', 'stable', 'beta', 'experimental'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={clsx(
              'px-3 py-1.5 rounded-full text-sm font-medium transition-colors capitalize',
              filter === s
                ? 'bg-primary-500 text-white'
                : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700'
            )}
          >
            {s === 'all' ? 'All features' : s}
          </button>
        ))}
      </div>

      {/* Feature list */}
      <div className="space-y-4">
        {sortedFiltered.map(feature => {
          const stabConf = STABILITY_CONFIG[feature.stability];
          const accessible = canAccess(feature.requiredTier);
          const score = feature.upvotes - feature.downvotes;

          return (
            <div
              key={feature.id}
              className={clsx(
                'bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5 transition-all',
                !accessible && 'opacity-70'
              )}
            >
              <div className="flex items-start justify-between gap-4">
                {/* Left: info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-neutral-900 dark:text-white">{feature.name}</h3>
                    <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', stabConf.bg, stabConf.color)}>
                      {stabConf.label}
                    </span>
                    {feature.comingSoon && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-700 text-neutral-500 font-medium">
                        Coming Soon
                      </span>
                    )}
                    {!accessible && (
                      <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 font-medium capitalize">
                        <Lock className="w-3 h-3" />
                        {feature.requiredTier}+
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">{feature.description}</p>

                  {/* Vote row */}
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => vote(feature.id, 'up')}
                        aria-label="Upvote"
                        className={clsx(
                          'flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-medium transition-colors',
                          feature.userVote === 'up'
                            ? 'bg-success/10 text-success'
                            : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                        )}
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        {feature.upvotes}
                      </button>
                      <button
                        onClick={() => vote(feature.id, 'down')}
                        aria-label="Downvote"
                        className={clsx(
                          'flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-medium transition-colors',
                          feature.userVote === 'down'
                            ? 'bg-error/10 text-error'
                            : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                        )}
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                        {feature.downvotes}
                      </button>
                    </div>
                    <span className="text-xs text-neutral-400">
                      {score > 0 ? '+' : ''}{score} net votes
                    </span>
                  </div>
                </div>

                {/* Right: toggle */}
                <div className="flex-shrink-0">
                  <button
                    onClick={() => toggleFeature(feature.id)}
                    disabled={!masterEnabled}
                    aria-label={`${feature.enabled ? 'Disable' : 'Enable'} ${feature.name}`}
                    className="disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {feature.enabled ? (
                      <ToggleRight className="w-8 h-8 text-primary-500" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-neutral-300 dark:text-neutral-600" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer CTA */}
      <div className="mt-8 p-6 bg-gradient-to-br from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20 rounded-xl border border-primary-100 dark:border-primary-800">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-neutral-900 dark:text-white mb-1">Have a feature idea?</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
              Feature requests with the most votes get prioritized for development. Submit yours on the Feedback page.
            </p>
            <a
              href="/feedback"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
            >
              Submit a request
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
