import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import {
  MessageSquare,
  ThumbsUp,
  Plus,
  Send,
  Smile,
  Meh,
  Frown,
  CheckCircle2,
  Trophy,
} from 'lucide-react';
import clsx from 'clsx';

type Mood = 'great' | 'okay' | 'poor' | null;

interface FeatureRequest {
  id: string;
  title: string;
  description: string;
  votes: number;
  userVoted: boolean;
  status: 'open' | 'planned' | 'in-progress' | 'shipped';
}

const STATUS_CONFIG: Record<FeatureRequest['status'], { label: string; color: string; bg: string }> = {
  open:        { label: 'Open',        color: 'text-neutral-600 dark:text-neutral-400', bg: 'bg-neutral-100 dark:bg-neutral-700' },
  planned:     { label: 'Planned',     color: 'text-info',    bg: 'bg-info/10'    },
  'in-progress': { label: 'In Progress', color: 'text-warning', bg: 'bg-warning/10' },
  shipped:     { label: 'Shipped',     color: 'text-success', bg: 'bg-success/10' },
};

const DB_MOOD_MAP: Record<NonNullable<Mood>, 'happy' | 'neutral' | 'sad'> = {
  great: 'happy',
  okay:  'neutral',
  poor:  'sad',
};

const MOOD_CONFIG: { id: Mood; label: string; icon: React.ComponentType<{ className?: string }>; color: string }[] = [
  { id: 'great', label: 'Great!',     icon: Smile, color: 'text-success' },
  { id: 'okay',  label: 'Okay',       icon: Meh,   color: 'text-warning' },
  { id: 'poor',  label: 'Needs work', icon: Frown,  color: 'text-error'   },
];

export function FeedbackPage() {
  const { profile } = useAuth();
  const toast = useToast();

  const tenantId = profile?.tenant_id;
  const userId   = profile?.id;

  // Quick feedback
  const [mood, setMood]                     = useState<Mood>(null);
  const [feedbackText, setFeedbackText]     = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [submitting, setSubmitting]         = useState(false);

  // Feature requests
  const [requests, setRequests]             = useState<FeatureRequest[]>([]);
  const [loading, setLoading]               = useState(true);
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [newTitle, setNewTitle]             = useState('');
  const [newDesc, setNewDesc]               = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [filterStatus, setFilterStatus]     = useState<FeatureRequest['status'] | 'all'>('all');

  // ── Load feature requests ────────────────────────────────────────────────
  useEffect(() => {
    if (!tenantId) return;

    async function load() {
      const [requestsResult, votesResult] = await Promise.all([
        supabase.from('feature_requests').select('*').order('vote_count', { ascending: false }),
        supabase.from('feature_request_votes').select('feature_request_id').eq('tenant_id', tenantId),
      ]);

      if (requestsResult.error) {
        toast.error('Failed to load feature requests');
        setLoading(false);
        return;
      }

      const votedIds = new Set((votesResult.data ?? []).map(v => v.feature_request_id));

      const merged: FeatureRequest[] = (requestsResult.data ?? []).map((r: {
        id: string; title: string; description: string | null;
        vote_count: number; status: string;
      }) => ({
        id:          r.id,
        title:       r.title,
        description: r.description ?? '',
        votes:       r.vote_count,
        userVoted:   votedIds.has(r.id),
        status:      r.status as FeatureRequest['status'],
      }));

      setRequests(merged);
      setLoading(false);
    }

    load();
  }, [tenantId]);

  // ── Submit mood feedback ─────────────────────────────────────────────────
  async function handleFeedbackSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!mood) {
      toast.error('Please select how you feel first');
      return;
    }
    if (!tenantId || !userId) return;

    setSubmitting(true);
    const { error } = await supabase.from('feedback').insert({
      tenant_id: tenantId,
      user_id:   userId,
      mood:      DB_MOOD_MAP[mood],
      comment:   feedbackText.trim() || null,
    });
    setSubmitting(false);

    if (error) {
      toast.error('Failed to submit feedback — please try again');
    } else {
      setFeedbackSubmitted(true);
      toast.success('Thanks for your feedback!');
    }
  }

  // ── Vote on feature request ──────────────────────────────────────────────
  async function handleVote(id: string) {
    if (!tenantId) return;

    const req = requests.find(r => r.id === id);
    if (!req) return;

    const wasVoted  = req.userVoted;
    const newVoted  = !wasVoted;
    const delta     = newVoted ? 1 : -1;

    // Optimistic update
    setRequests(prev => prev.map(r =>
      r.id === id ? { ...r, userVoted: newVoted, votes: r.votes + delta } : r
    ));

    let voteError: { message: string } | null = null;
    let countError: { message: string } | null = null;

    if (newVoted) {
      const result = await supabase.from('feature_request_votes').insert({
        tenant_id:          tenantId,
        feature_request_id: id,
      });
      voteError = result.error;
    } else {
      const result = await supabase.from('feature_request_votes')
        .delete()
        .eq('tenant_id', tenantId)
        .eq('feature_request_id', id);
      voteError = result.error;
    }

    if (!voteError) {
      const result = await supabase.from('feature_requests')
        .update({ vote_count: req.votes + delta })
        .eq('id', id);
      countError = result.error;
    }

    if (voteError || countError) {
      // Revert
      setRequests(prev => prev.map(r =>
        r.id === id ? { ...r, userVoted: wasVoted, votes: req.votes } : r
      ));
      toast.error('Vote failed — please try again');
    }
  }

  // ── Submit new feature request ───────────────────────────────────────────
  async function handleNewRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || !tenantId) return;

    setSubmittingRequest(true);
    const { data, error } = await supabase.from('feature_requests').insert({
      title:       newTitle.trim(),
      description: newDesc.trim() || null,
      status:      'open',
      vote_count:  1,
    }).select().single();

    if (error || !data) {
      setSubmittingRequest(false);
      toast.error('Failed to submit request — please try again');
      return;
    }

    // Also cast a vote for the newly created request
    await supabase.from('feature_request_votes').insert({
      tenant_id:          tenantId,
      feature_request_id: data.id,
    });

    const newReq: FeatureRequest = {
      id:          data.id,
      title:       data.title,
      description: data.description ?? '',
      votes:       1,
      userVoted:   true,
      status:      'open',
    };

    setRequests(prev => [newReq, ...prev]);
    setNewTitle('');
    setNewDesc('');
    setShowNewRequest(false);
    setSubmittingRequest(false);
    toast.success('Feature request submitted!');
  }

  const sorted = [...requests]
    .filter(r => filterStatus === 'all' || r.status === filterStatus)
    .sort((a, b) => b.votes - a.votes);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-1">Feedback</h1>
        <p className="text-neutral-500">Your input shapes what gets built next</p>
      </div>

      {/* Quick Feedback Card */}
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-neutral-200 dark:border-white/10 p-6 mb-8">
        <h2 className="font-semibold text-neutral-900 dark:text-white mb-1">How's Newsletter Wizard working for you?</h2>
        <p className="text-sm text-neutral-500 mb-5">Takes 10 seconds. Helps a lot.</p>

        {feedbackSubmitted ? (
          <div className="flex flex-col items-center py-6 gap-3">
            <CheckCircle2 className="w-10 h-10 text-success" />
            <p className="font-medium text-neutral-900 dark:text-white">Thank you for the feedback!</p>
            <button
              onClick={() => { setFeedbackSubmitted(false); setMood(null); setFeedbackText(''); }}
              className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
            >
              Submit another
            </button>
          </div>
        ) : (
          <form onSubmit={handleFeedbackSubmit} className="space-y-4">
            {/* Mood selector */}
            <div className="flex gap-3">
              {MOOD_CONFIG.map(m => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMood(m.id)}
                    className={clsx(
                      'flex-1 flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-all',
                      mood === m.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-neutral-200 dark:border-white/10 hover:border-neutral-300 dark:hover:border-neutral-600'
                    )}
                  >
                    <Icon className={clsx('w-7 h-7', mood === m.id ? 'text-primary-500' : m.color)} />
                    <span className={clsx('text-sm font-medium', mood === m.id ? 'text-primary-600 dark:text-primary-400' : 'text-neutral-600 dark:text-neutral-400')}>
                      {m.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Optional text */}
            <textarea
              value={feedbackText}
              onChange={e => setFeedbackText(e.target.value)}
              rows={3}
              placeholder="Tell us more (optional) — what's working, what isn't..."
              className="w-full px-3 py-2.5 border border-neutral-200 dark:border-white/10 rounded-lg bg-white dark:bg-background-dark text-neutral-900 dark:text-white text-sm resize-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Sending...' : 'Send feedback'}
            </button>
          </form>
        )}
      </div>

      {/* Feature Requests */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Feature Requests</h2>
            <p className="text-sm text-neutral-500 mt-0.5">Most-voted features get prioritized</p>
          </div>
          <button
            onClick={() => setShowNewRequest(v => !v)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            New request
          </button>
        </div>

        {/* New request form */}
        {showNewRequest && (
          <form onSubmit={handleNewRequest} className="mb-4 p-4 bg-white dark:bg-surface-dark border border-primary-200 dark:border-primary-800 rounded-xl space-y-3">
            <input
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              required
              placeholder="Feature title (be specific)"
              className="w-full px-3 py-2.5 border border-neutral-200 dark:border-white/10 rounded-lg bg-white dark:bg-background-dark text-neutral-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            />
            <textarea
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              rows={2}
              placeholder="Describe the problem this would solve..."
              className="w-full px-3 py-2.5 border border-neutral-200 dark:border-white/10 rounded-lg bg-white dark:bg-background-dark text-neutral-900 dark:text-white text-sm resize-none focus:ring-2 focus:ring-primary-500 outline-none"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submittingRequest}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {submittingRequest ? 'Submitting...' : 'Submit'}
              </button>
              <button
                type="button"
                onClick={() => setShowNewRequest(false)}
                className="px-4 py-2 border border-neutral-200 dark:border-white/10 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-white/5 text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Status filter */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {(['all', 'open', 'planned', 'in-progress', 'shipped'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={clsx(
                'px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize',
                filterStatus === s
                  ? 'bg-primary-500 text-white'
                  : 'bg-white dark:bg-surface-dark text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-white/10 hover:bg-neutral-50 dark:hover:bg-white/5'
              )}
            >
              {s === 'all' ? 'All' : STATUS_CONFIG[s as FeatureRequest['status']]?.label || s}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
          </div>
        )}

        {/* Request list */}
        {!loading && (
          <div className="space-y-3">
            {sorted.length === 0 && (
              <div className="text-center py-12 text-neutral-400">
                <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>No feature requests yet — be the first!</p>
              </div>
            )}
            {sorted.map((req, i) => {
              const statusConf = STATUS_CONFIG[req.status];
              return (
                <div key={req.id} className="bg-white dark:bg-surface-dark border border-neutral-200 dark:border-white/10 rounded-xl p-4 flex gap-4">
                  {/* Rank */}
                  <div className="flex-shrink-0 flex flex-col items-center gap-1 pt-1">
                    {i < 3 && filterStatus === 'all' && req.status !== 'shipped' ? (
                      <Trophy className={clsx('w-5 h-5', i === 0 ? 'text-amber-500' : i === 1 ? 'text-neutral-400' : 'text-amber-700')} />
                    ) : (
                      <span className="text-sm font-bold text-neutral-400 w-5 text-center">{i + 1}</span>
                    )}
                  </div>

                  {/* Vote button */}
                  <div className="flex-shrink-0">
                    <button
                      onClick={() => handleVote(req.id)}
                      className={clsx(
                        'flex flex-col items-center gap-0.5 px-2.5 py-2 rounded-lg border-2 transition-all min-w-[52px]',
                        req.userVoted
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                          : 'border-neutral-200 dark:border-white/10 text-neutral-500 hover:border-neutral-300 dark:hover:border-neutral-600'
                      )}
                      aria-label={req.userVoted ? 'Remove vote' : 'Vote for this feature'}
                    >
                      <ThumbsUp className="w-4 h-4" />
                      <span className="text-xs font-bold">{req.votes}</span>
                    </button>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <h3 className="font-medium text-neutral-900 dark:text-white">{req.title}</h3>
                      <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', statusConf.bg, statusConf.color)}>
                        {statusConf.label}
                      </span>
                    </div>
                    {req.description && (
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">{req.description}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
