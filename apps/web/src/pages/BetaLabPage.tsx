import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import {
  ToggleLeft,
  ToggleRight,
  ThumbsUp,
  ThumbsDown,
  Lock,
  FlaskConical,
  Sparkles,
} from 'lucide-react';
import clsx from 'clsx';

type Stability = 'stable' | 'beta' | 'experimental';
type Tier = 'free' | 'creator' | 'pro' | 'business';

interface BetaFeature {
  key:          string;
  name:         string;
  description:  string;
  stability:    Stability;
  requiredTier: Tier;
  voteCount:    number;
  userVote:     -1 | 0 | 1;
  enabled:      boolean;
  comingSoon:   boolean;
}

const STABILITY_CONFIG: Record<Stability, { label: string; color: string; bg: string }> = {
  stable:       { label: 'Stable',       color: 'text-success',  bg: 'bg-success/10' },
  beta:         { label: 'Beta',         color: 'text-warning',  bg: 'bg-warning/10' },
  experimental: { label: 'Experimental', color: 'text-error',    bg: 'bg-error/10'   },
};

const TIER_ORDER: Tier[] = ['free', 'creator', 'pro', 'business'];

export function BetaLabPage() {
  const { profile } = useAuth();
  const toast = useToast();

  const [features, setFeatures]         = useState<BetaFeature[]>([]);
  const [loading, setLoading]           = useState(true);
  const [masterEnabled, setMasterEnabled] = useState(true);
  const [filter, setFilter]             = useState<Stability | 'all'>('all');

  const tenantId = profile?.tenant_id;
  const currentTier: Tier = (profile as { subscription_tier?: Tier })?.subscription_tier ?? 'pro';

  function canAccess(requiredTier: Tier): boolean {
    return TIER_ORDER.indexOf(currentTier) >= TIER_ORDER.indexOf(requiredTier);
  }

  // ── Load features ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!tenantId) return;

    async function load() {
      const [featuresResult, tenantStateResult] = await Promise.all([
        supabase.from('beta_features').select('*').order('vote_count', { ascending: false }),
        supabase.from('tenant_beta_features').select('*').eq('tenant_id', tenantId),
      ]);

      if (featuresResult.error) {
        toast.error('Failed to load beta features');
        setLoading(false);
        return;
      }

      const stateMap: Record<string, { enabled: boolean; vote: number }> = {};
      for (const s of tenantStateResult.data ?? []) {
        stateMap[s.feature_key] = { enabled: s.enabled, vote: s.vote };
      }

      const merged: BetaFeature[] = (featuresResult.data ?? []).map((f: {
        key: string; name: string; description: string; stability: string;
        required_tier: string; vote_count: number; coming_soon: boolean;
      }) => ({
        key:          f.key,
        name:         f.name,
        description:  f.description,
        stability:    f.stability as Stability,
        requiredTier: f.required_tier as Tier,
        voteCount:    f.vote_count,
        userVote:     (stateMap[f.key]?.vote ?? 0) as -1 | 0 | 1,
        enabled:      stateMap[f.key]?.enabled ?? false,
        comingSoon:   f.coming_soon,
      }));

      setFeatures(merged);
      setLoading(false);
    }

    load();
  }, [tenantId]);

  // ── Toggle feature ────────────────────────────────────────────────────────
  async function toggleFeature(key: string) {
    const feature = features.find(f => f.key === key);
    if (!feature || !tenantId) return;

    if (!canAccess(feature.requiredTier)) {
      toast.error(`This feature requires a ${feature.requiredTier} plan`);
      return;
    }
    if (feature.comingSoon) {
      toast.error('This feature is coming soon');
      return;
    }

    const next = !feature.enabled;

    // Optimistic update
    setFeatures(prev => prev.map(f => f.key === key ? { ...f, enabled: next } : f));

    const { error } = await supabase.from('tenant_beta_features').upsert({
      tenant_id:   tenantId,
      feature_key: key,
      enabled:     next,
      vote:        feature.userVote,
    }, { onConflict: 'tenant_id,feature_key' });

    if (error) {
      // Revert
      setFeatures(prev => prev.map(f => f.key === key ? { ...f, enabled: feature.enabled } : f));
      toast.error('Failed to save — please try again');
    } else {
      toast.success(`${feature.name} ${next ? 'enabled' : 'disabled'}`);
    }
  }

  // ── Vote on feature ───────────────────────────────────────────────────────
  async function castVote(key: string, direction: 1 | -1) {
    const feature = features.find(f => f.key === key);
    if (!feature || !tenantId) return;

    const prevVote = feature.userVote;
    const newVote: -1 | 0 | 1 = prevVote === direction ? 0 : direction;
    const delta = newVote - prevVote;

    // Optimistic update
    setFeatures(prev => prev.map(f =>
      f.key === key
        ? { ...f, userVote: newVote, voteCount: f.voteCount + delta }
        : f
    ));

    const [upsertResult, countResult] = await Promise.all([
      supabase.from('tenant_beta_features').upsert({
        tenant_id:   tenantId,
        feature_key: key,
        enabled:     feature.enabled,
        vote:        newVote,
      }, { onConflict: 'tenant_id,feature_key' }),
      supabase.from('beta_features')
        .update({ vote_count: feature.voteCount + delta })
        .eq('key', key),
    ]);

    if (upsertResult.error || countResult.error) {
      // Revert
      setFeatures(prev => prev.map(f =>
        f.key === key ? { ...f, userVote: prevVote, voteCount: feature.voteCount } : f
      ));
      toast.error('Vote failed — please try again');
    }
  }

  const filtered = features
    .filter(f => filter === 'all' || f.stability === filter)
    .sort((a, b) => (b.voteCount - b.voteCount === 0 ? 0 : b.voteCount - a.voteCount));

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FlaskConical className="w-6 h-6 text-primary-500" />
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Beta Lab</h1>
          </div>
          <p className="text-neutral-500">Try upcoming features before they ship. Your votes shape the roadmap.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-neutral-500">All features</span>
          <button
            onClick={() => setMasterEnabled(v => !v)}
            aria-pressed={masterEnabled}
            className="text-neutral-400 hover:text-primary-500 transition-colors"
          >
            {masterEnabled ? <ToggleRight className="w-8 h-8 text-primary-500" /> : <ToggleLeft className="w-8 h-8" />}
          </button>
        </div>
      </div>

      {/* Stability filter */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'stable', 'beta', 'experimental'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize',
              filter === s
                ? 'bg-primary-500 text-white'
                : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-600'
            )}
          >
            {s === 'all' ? 'All features' : s}
          </button>
        ))}
      </div>

      {/* Feature list */}
      <div className="space-y-4">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-neutral-400">
            <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No features in this category yet.</p>
          </div>
        )}

        {filtered.map(feature => {
          const stabilityConf = STABILITY_CONFIG[feature.stability];
          const accessible    = canAccess(feature.requiredTier);
          const netScore      = feature.voteCount;

          return (
            <div
              key={feature.key}
              className={clsx(
                'bg-white dark:bg-surface-dark rounded-xl border p-5 transition-all',
                !masterEnabled || !accessible || feature.comingSoon
                  ? 'opacity-60'
                  : 'border-neutral-200 dark:border-white/10'
              )}
            >
              <div className="flex items-start gap-4">
                {/* Vote column */}
                <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-0.5">
                  <button
                    onClick={() => castVote(feature.key, 1)}
                    className={clsx(
                      'p-1.5 rounded-lg transition-colors',
                      feature.userVote === 1
                        ? 'text-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'text-neutral-400 hover:text-primary-500 hover:bg-neutral-100 dark:hover:bg-white/5'
                    )}
                  >
                    <ThumbsUp className="w-4 h-4" />
                  </button>
                  <span className={clsx(
                    'text-xs font-semibold',
                    netScore > 0 ? 'text-primary-500' : netScore < 0 ? 'text-error' : 'text-neutral-400'
                  )}>
                    {netScore > 0 ? `+${netScore}` : netScore}
                  </span>
                  <button
                    onClick={() => castVote(feature.key, -1)}
                    className={clsx(
                      'p-1.5 rounded-lg transition-colors',
                      feature.userVote === -1
                        ? 'text-error bg-error/10'
                        : 'text-neutral-400 hover:text-error hover:bg-neutral-100 dark:hover:bg-white/5'
                    )}
                  >
                    <ThumbsDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-1 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-neutral-900 dark:text-white">{feature.name}</h3>
                      <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', stabilityConf.bg, stabilityConf.color)}>
                        {stabilityConf.label}
                      </span>
                      {!accessible && (
                        <span className="flex items-center gap-1 text-xs text-neutral-400">
                          <Lock className="w-3 h-3" />
                          {feature.requiredTier}
                        </span>
                      )}
                      {feature.comingSoon && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-700 text-neutral-500">
                          Coming soon
                        </span>
                      )}
                    </div>

                    {/* Toggle */}
                    <button
                      onClick={() => toggleFeature(feature.key)}
                      disabled={!masterEnabled || !accessible || feature.comingSoon}
                      className="flex-shrink-0"
                      aria-pressed={feature.enabled}
                      aria-label={`${feature.enabled ? 'Disable' : 'Enable'} ${feature.name}`}
                    >
                      {feature.enabled && masterEnabled && accessible && !feature.comingSoon
                        ? <ToggleRight className="w-7 h-7 text-primary-500" />
                        : <ToggleLeft className="w-7 h-7 text-neutral-300 dark:text-neutral-600" />
                      }
                    </button>
                  </div>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">{feature.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-5 bg-neutral-50 dark:bg-surface-dark/50 rounded-xl text-center">
        <p className="text-sm text-neutral-500">
          Have a feature idea?{' '}
          <a href="/feedback" className="text-primary-600 dark:text-primary-400 hover:underline font-medium">
            Submit a feature request
          </a>
        </p>
      </div>
    </div>
  );
}
