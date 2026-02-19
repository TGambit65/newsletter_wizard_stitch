import { useState } from 'react';
import { useToast } from '@/components/ui/Toast';
import {
  MessageSquare,
  ThumbsUp,
  Plus,
  Send,
  Smile,
  Meh,
  Frown,
  ArrowUpRight,
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
  open: { label: 'Open', color: 'text-neutral-600 dark:text-neutral-400', bg: 'bg-neutral-100 dark:bg-neutral-700' },
  planned: { label: 'Planned', color: 'text-info', bg: 'bg-info/10' },
  'in-progress': { label: 'In Progress', color: 'text-warning', bg: 'bg-warning/10' },
  shipped: { label: 'Shipped', color: 'text-success', bg: 'bg-success/10' },
};

const INITIAL_REQUESTS: FeatureRequest[] = [
  {
    id: '1',
    title: 'Newsletter duplication / copy',
    description: 'Clone an existing newsletter as a starting point for a new one, keeping the same structure and template.',
    votes: 287,
    userVoted: false,
    status: 'planned',
  },
  {
    id: '2',
    title: 'Email preview mode in mobile browser',
    description: 'Mobile-friendly preview of newsletters that matches how they look in email clients on iOS/Android.',
    votes: 214,
    userVoted: false,
    status: 'in-progress',
  },
  {
    id: '3',
    title: 'Drag-and-drop section reordering',
    description: 'Reorder newsletter sections by dragging them up/down in the editor without cutting and pasting.',
    votes: 198,
    userVoted: false,
    status: 'planned',
  },
  {
    id: '4',
    title: 'Custom unsubscribe page',
    description: 'Branded unsubscribe flow with "pause instead of unsubscribe" option and reason survey.',
    votes: 156,
    userVoted: false,
    status: 'open',
  },
  {
    id: '5',
    title: 'Zapier / Make integration',
    description: 'Trigger newsletters or add knowledge sources via Zapier/Make.com automations.',
    votes: 143,
    userVoted: false,
    status: 'open',
  },
  {
    id: '6',
    title: 'AI-generated images inline',
    description: 'Generate images directly inside the newsletter editor using DALL-E or Stable Diffusion.',
    votes: 121,
    userVoted: false,
    status: 'open',
  },
  {
    id: '7',
    title: 'Multi-language newsletter generation',
    description: 'Auto-translate or natively generate newsletters in Spanish, French, German, and other languages.',
    votes: 98,
    userVoted: false,
    status: 'open',
  },
  {
    id: '8',
    title: 'Dark mode email templates',
    description: 'Newsletter templates that properly render in dark mode email clients with appropriate color inversions.',
    votes: 89,
    userVoted: false,
    status: 'shipped',
  },
];

const MOOD_CONFIG: { id: Mood; label: string; icon: React.ComponentType<{ className?: string }>; color: string }[] = [
  { id: 'great', label: 'Great!', icon: Smile, color: 'text-success' },
  { id: 'okay', label: 'Okay', icon: Meh, color: 'text-warning' },
  { id: 'poor', label: 'Needs work', icon: Frown, color: 'text-error' },
];

export function FeedbackPage() {
  const toast = useToast();

  // Quick feedback
  const [mood, setMood] = useState<Mood>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Feature requests
  const [requests, setRequests] = useState<FeatureRequest[]>(INITIAL_REQUESTS);
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [filterStatus, setFilterStatus] = useState<FeatureRequest['status'] | 'all'>('all');

  function handleFeedbackSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!mood) {
      toast.error('Please select how you feel first');
      return;
    }
    setFeedbackSubmitted(true);
    toast.success('Thanks for your feedback!');
  }

  function handleVote(id: string) {
    setRequests(prev => prev.map(r => {
      if (r.id !== id) return r;
      return {
        ...r,
        userVoted: !r.userVoted,
        votes: r.userVoted ? r.votes - 1 : r.votes + 1,
      };
    }));
  }

  function handleNewRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const newReq: FeatureRequest = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      description: newDesc.trim(),
      votes: 1,
      userVoted: true,
      status: 'open',
    };
    setRequests(prev => [newReq, ...prev]);
    setNewTitle('');
    setNewDesc('');
    setShowNewRequest(false);
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
      <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-8">
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
                        : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
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
              className="w-full px-3 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white text-sm resize-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />

            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium text-sm"
            >
              <Send className="w-4 h-4" />
              Send feedback
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
          <form onSubmit={handleNewRequest} className="mb-4 p-4 bg-white dark:bg-neutral-800 border border-primary-200 dark:border-primary-800 rounded-xl space-y-3">
            <input
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              required
              placeholder="Feature title (be specific)"
              className="w-full px-3 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            />
            <textarea
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              rows={2}
              placeholder="Describe the problem this would solve..."
              className="w-full px-3 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white text-sm resize-none focus:ring-2 focus:ring-primary-500 outline-none"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm font-medium"
              >
                Submit
              </button>
              <button
                type="button"
                onClick={() => setShowNewRequest(false)}
                className="px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-sm"
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
                  : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700'
              )}
            >
              {s === 'all' ? 'All' : STATUS_CONFIG[s as FeatureRequest['status']]?.label || s}
            </button>
          ))}
        </div>

        {/* Request list */}
        <div className="space-y-3">
          {sorted.map((req, i) => {
            const statusConf = STATUS_CONFIG[req.status];
            return (
              <div key={req.id} className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-4 flex gap-4">
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
                        : 'border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:border-neutral-300 dark:hover:border-neutral-600'
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
      </div>
    </div>
  );
}
