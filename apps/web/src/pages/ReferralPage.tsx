import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/Toast';
import { getReferralCode, getReferralStats, sendReferralInvite, getReferralLeaderboard, type LeaderboardEntry } from '@/lib/api';
import {
  Link2,
  Copy,
  Check,
  Trophy,
  Mail,
  Gift,
  Users,
  TrendingUp,
} from 'lucide-react';
import clsx from 'clsx';

interface RewardTier {
  count: number;
  label: string;
  reward: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
}

const REWARD_TIERS: RewardTier[] = [
  {
    count: 1,
    label: '1 Referral',
    reward: '1 month free',
    icon: Gift,
    color: 'text-primary-600 dark:text-primary-400',
    bg: 'bg-primary-50 dark:bg-primary-900/20',
  },
  {
    count: 5,
    label: '5 Referrals',
    reward: 'Pro plan upgrade',
    icon: TrendingUp,
    color: 'text-warning',
    bg: 'bg-warning/10',
  },
  {
    count: 10,
    label: '10 Referrals',
    reward: 'Lifetime deal',
    icon: Trophy,
    color: 'text-success',
    bg: 'bg-success/10',
  },
];

const RANK_BADGES: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

export function ReferralPage() {
  const toast = useToast();

  const [referralCode, setReferralCode]   = useState('');
  const [referralLink, setReferralLink]   = useState('');
  const [stats, setStats]                 = useState({ sent: 0, converted: 0, earned: '$0' });
  const [leaderboard, setLeaderboard]     = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading]             = useState(true);
  const [copied, setCopied]               = useState(false);
  const [inviteEmail, setInviteEmail]     = useState('');
  const [inviting, setInviting]           = useState(false);
  const [inviteSent, setInviteSent]       = useState(false);

  const referralsMade = stats.converted; // for tier progress

  useEffect(() => {
    async function load() {
      try {
        const [codeData, statsData, boardData] = await Promise.all([
          getReferralCode(),
          getReferralStats(),
          getReferralLeaderboard(),
        ]);
        setReferralCode(codeData.code);
        setReferralLink(codeData.link);
        setStats(statsData);
        setLeaderboard(boardData.leaderboard);
      } catch {
        toast.error('Failed to load referral data');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function handleCopy() {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      toast.success('Referral link copied!');
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      const result = await sendReferralInvite(inviteEmail.trim());
      if (result.already_invited) {
        toast.success(`${inviteEmail} was already invited`);
      } else {
        toast.success(`Invite sent to ${inviteEmail}`);
      }
      setInviteSent(true);
      setInviteEmail('');
      setTimeout(() => setInviteSent(false), 3000);
      // Refresh stats
      getReferralStats().then(setStats);
    } catch {
      toast.error('Failed to send invite. Please try again.');
    } finally {
      setInviting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-1">Referral Program</h1>
        <p className="text-neutral-500">Invite friends and earn rewards for every sign-up.</p>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
        </div>
      )}

      {loading ? null : (<>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Invites sent', value: stats.sent },
          { label: 'Converted', value: stats.converted },
          { label: 'Rewards earned', value: stats.earned },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-surface-dark rounded-xl border border-neutral-200 dark:border-white/10 p-4 text-center">
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">{s.value}</p>
            <p className="text-sm text-neutral-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Referral link */}
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-neutral-200 dark:border-white/10 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Link2 className="w-5 h-5 text-primary-500" />
          <h2 className="font-semibold text-neutral-900 dark:text-white">Your referral link</h2>
        </div>

        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 px-4 py-3 bg-neutral-50 dark:bg-background-dark border border-neutral-200 dark:border-white/10 rounded-lg min-w-0">
            <span className="text-sm text-neutral-600 dark:text-neutral-400 truncate font-mono">{referralLink}</span>
          </div>
          <button
            onClick={handleCopy}
            className={clsx(
              'flex items-center gap-2 px-4 py-3 rounded-lg font-medium text-sm transition-colors flex-shrink-0',
              copied
                ? 'bg-success/10 text-success border border-success/30'
                : 'bg-primary-500 text-white hover:bg-primary-600'
            )}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        <p className="mt-3 text-xs text-neutral-400">
          Share this link and earn rewards when friends sign up and become subscribers.
        </p>
      </div>

      {/* Reward tiers */}
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-neutral-200 dark:border-white/10 p-6">
        <h2 className="font-semibold text-neutral-900 dark:text-white mb-4">Reward tiers</h2>
        <div className="space-y-4">
          {REWARD_TIERS.map(tier => {
            const achieved = referralsMade >= tier.count;
            const Icon = tier.icon;
            return (
              <div key={tier.count} className={clsx(
                'flex items-center gap-4 p-4 rounded-lg border transition-all',
                achieved
                  ? 'border-success/30 bg-success/5'
                  : 'border-neutral-200 dark:border-white/10'
              )}>
                <div className={clsx('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', tier.bg)}>
                  <Icon className={clsx('w-5 h-5', tier.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-neutral-900 dark:text-white text-sm">{tier.label}</p>
                  <p className="text-xs text-neutral-500">{tier.reward}</p>
                </div>
                <div className="flex-shrink-0">
                  {achieved ? (
                    <span className="text-xs px-2 py-1 bg-success/10 text-success rounded-full font-medium">Earned</span>
                  ) : (
                    <span className="text-xs text-neutral-400">
                      {Math.max(0, tier.count - referralsMade)} more needed
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Direct invite */}
        <div className="bg-white dark:bg-surface-dark rounded-xl border border-neutral-200 dark:border-white/10 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="w-5 h-5 text-primary-500" />
            <h2 className="font-semibold text-neutral-900 dark:text-white">Invite directly</h2>
          </div>
          <form onSubmit={handleInvite} className="space-y-3">
            <input
              type="email"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              placeholder="colleague@example.com"
              className="w-full px-3 py-2.5 border border-neutral-200 dark:border-white/10 rounded-lg bg-white dark:bg-background-dark text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              disabled={inviting || inviteSent}
            />
            <button
              type="submit"
              disabled={!inviteEmail.trim() || inviting || inviteSent}
              className="w-full py-2.5 bg-primary-500 text-white rounded-lg font-medium text-sm hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {inviteSent ? '✓ Invite sent!' : inviting ? 'Sending...' : 'Send invite'}
            </button>
          </form>
        </div>

        {/* Leaderboard */}
        <div className="bg-white dark:bg-surface-dark rounded-xl border border-neutral-200 dark:border-white/10 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-primary-500" />
            <h2 className="font-semibold text-neutral-900 dark:text-white">Top referrers</h2>
          </div>
          <div className="space-y-2">
            {leaderboard.length === 0 ? (
              <p className="text-sm text-neutral-400 text-center py-4">No referrals yet — be the first!</p>
            ) : leaderboard.map(entry => (
              <div key={entry.rank} className="flex items-center gap-3">
                <span className="w-6 text-center text-sm font-mono text-neutral-400">
                  {RANK_BADGES[entry.rank] ?? `${entry.rank}.`}
                </span>
                <span className="flex-1 text-sm text-neutral-700 dark:text-neutral-300">{entry.name}</span>
                <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                  {entry.referrals}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-neutral-400">Updated daily</p>
        </div>
      </div>
    </>)}
    </div>
  );
}
