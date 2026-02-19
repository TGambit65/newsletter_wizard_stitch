import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { exportUserData, deleteAccount } from '@/lib/api';
import {
  Download,
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import clsx from 'clsx';

type Step = 1 | 2 | 3 | 4;

const EXIT_REASONS = [
  "I don't use it enough",
  "Missing a feature I need",
  "Too expensive",
  "Switching to a competitor",
  "Just trying it out — never intended to stay",
  "Technical issues",
  "Other",
];

export function DeleteAccountPage() {
  const { signOut, profile } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [step, setStep] = useState<Step>(1);
  const [reason, setReason] = useState('');
  const [comment, setComment] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [exported, setExported] = useState(false);

  async function handleExport() {
    try {
      const data = await exportUserData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'newsletter-wizard-export.json';
      a.click();
      URL.revokeObjectURL(url);
      setExported(true);
      toast.success('Data export downloaded');
    } catch {
      toast.error('Export failed — please try again');
    }
  }

  async function handleDelete() {
    if (confirmation !== 'DELETE') return;
    setDeleting(true);
    try {
      await deleteAccount({ confirmation, reason, comment });
      setStep(4);
      setTimeout(() => signOut(), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Deletion failed. Please try again.';
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  }

  const steps = [
    { num: 1, label: 'Export data' },
    { num: 2, label: 'Exit survey' },
    { num: 3, label: 'Confirm' },
    { num: 4, label: 'Done' },
  ];

  return (
    <div className="max-w-lg mx-auto">
      {/* Back link */}
      {step < 4 && (
        <button
          onClick={() => step === 1 ? navigate('/settings') : setStep(s => (s - 1) as Step)}
          className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {step === 1 ? 'Back to Settings' : 'Back'}
        </button>
      )}

      {/* Progress steps */}
      {step < 4 && (
        <div className="flex items-center gap-2 mb-8">
          {steps.slice(0, 3).map((s, i) => (
            <div key={s.num} className="flex items-center gap-2">
              <div className={clsx(
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold',
                step > s.num ? 'bg-success text-white' :
                step === s.num ? 'bg-error text-white' :
                'bg-neutral-100 dark:bg-neutral-700 text-neutral-400'
              )}>
                {step > s.num ? '✓' : s.num}
              </div>
              <span className={clsx('text-xs hidden sm:block', step === s.num ? 'text-neutral-900 dark:text-white font-medium' : 'text-neutral-400')}>
                {s.label}
              </span>
              {i < 2 && <ChevronRight className="w-4 h-4 text-neutral-300 flex-shrink-0" />}
            </div>
          ))}
        </div>
      )}

      {/* Step 1: Export */}
      {step === 1 && (
        <div className="bg-white dark:bg-surface-dark rounded-xl border border-neutral-200 dark:border-white/10 p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Download className="w-8 h-8 text-neutral-500" />
            </div>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">Before you go — export your data</h1>
            <p className="text-neutral-500 text-sm">
              Download all your newsletters, knowledge sources, and analytics. This is your data and you should keep a copy.
            </p>
          </div>

          <div className="space-y-3 mb-6">
            {['All newsletters and drafts', 'Knowledge sources and content', 'Analytics and performance data', 'Voice profiles and settings'].map(item => (
              <div key={item} className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                {item}
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleExport}
              className={clsx(
                'flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-colors text-sm',
                exported
                  ? 'bg-success/10 text-success border border-success/30'
                  : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600'
              )}
            >
              <Download className="w-4 h-4" />
              {exported ? 'Downloaded' : 'Download my data'}
            </button>
            <button
              onClick={() => setStep(2)}
              className="flex-1 py-3 bg-error/10 text-error border border-error/20 rounded-lg font-medium hover:bg-error/20 transition-colors text-sm"
            >
              Continue anyway
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Exit survey */}
      {step === 2 && (
        <div className="bg-white dark:bg-surface-dark rounded-xl border border-neutral-200 dark:border-white/10 p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="w-8 h-8 text-neutral-500" />
            </div>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">Why are you leaving?</h1>
            <p className="text-neutral-500 text-sm">This helps us improve for future users. Optional but appreciated.</p>
          </div>

          <div className="space-y-2 mb-5">
            {EXIT_REASONS.map(r => (
              <button
                key={r}
                onClick={() => setReason(r)}
                className={clsx(
                  'w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors',
                  reason === r
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'border-neutral-200 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-white/5'
                )}
              >
                {r}
              </button>
            ))}
          </div>

          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={3}
            placeholder="Any additional comments? (optional)"
            className="w-full px-3 py-2.5 mb-5 border border-neutral-200 dark:border-white/10 rounded-lg bg-white dark:bg-background-dark text-sm resize-none focus:ring-2 focus:ring-primary-500 outline-none"
          />

          <button
            onClick={() => setStep(3)}
            className="w-full py-3 bg-error/10 text-error border border-error/20 rounded-lg font-medium hover:bg-error/20 transition-colors"
          >
            Continue to final step
          </button>
        </div>
      )}

      {/* Step 3: Confirm deletion */}
      {step === 3 && (
        <div className="bg-white dark:bg-surface-dark rounded-xl border border-error/30 p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-error" />
            </div>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">This cannot be undone</h1>
            <p className="text-neutral-500 text-sm">
              All your newsletters, knowledge sources, voice profiles, and analytics will be permanently deleted.
            </p>
          </div>

          <div className="p-4 bg-error/5 rounded-lg border border-error/20 mb-5">
            <p className="text-sm font-medium text-error mb-1">What will be deleted:</p>
            <ul className="text-sm text-neutral-600 dark:text-neutral-400 space-y-1 list-disc list-inside">
              <li>Your account and profile</li>
              <li>All newsletters (drafts, sent, scheduled)</li>
              <li>All knowledge sources and uploaded content</li>
              <li>All voice profiles and training data</li>
              <li>All analytics and performance history</li>
            </ul>
          </div>

          <div className="mb-5">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Type <strong>DELETE</strong> to confirm
            </label>
            <input
              type="text"
              value={confirmation}
              onChange={e => setConfirmation(e.target.value)}
              placeholder="DELETE"
              className="w-full px-4 py-3 border border-neutral-200 dark:border-white/10 rounded-lg bg-white dark:bg-background-dark text-neutral-900 dark:text-white focus:ring-2 focus:ring-error focus:border-error outline-none font-mono"
            />
          </div>

          <button
            onClick={handleDelete}
            disabled={confirmation !== 'DELETE' || deleting}
            className="w-full py-3 bg-error text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {deleting ? 'Deleting account...' : 'Delete my account permanently'}
          </button>
        </div>
      )}

      {/* Step 4: Goodbye */}
      {step === 4 && (
        <div className="bg-white dark:bg-surface-dark rounded-xl border border-neutral-200 dark:border-white/10 p-8 text-center">
          <CheckCircle2 className="w-16 h-16 text-success mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Account deleted</h1>
          <p className="text-neutral-500 mb-2">
            Your account and all associated data have been permanently deleted.
          </p>
          <p className="text-sm text-neutral-400">
            Thank you for using Newsletter Wizard. We hope to see you again someday.
          </p>
          <p className="text-xs text-neutral-400 mt-4">Redirecting you in a moment...</p>
        </div>
      )}
    </div>
  );
}
