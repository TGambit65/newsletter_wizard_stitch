import { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import clsx from 'clsx';

interface Phase {
  label: string;
  duration: number; // ms total for this phase
}

const PHASES: Phase[] = [
  { label: 'Analyzing writing samples', duration: 3500 },
  { label: 'Learning patterns', duration: 4000 },
  { label: 'Calibrating voice model', duration: 3000 },
];

interface AITrainingProgressProps {
  open: boolean;
  onComplete: () => void;
  onRetry?: () => void;
  error?: string | null;
}

export function AITrainingProgress({ open, onComplete, error, onRetry }: AITrainingProgressProps) {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open || error) return;

    setPhaseIndex(0);
    setProgress(0);
    setDone(false);

    let canceled = false;

    async function runPhases() {
      for (let i = 0; i < PHASES.length; i++) {
        if (canceled) return;
        setPhaseIndex(i);
        const phase = PHASES[i];
        const startPct = (i / PHASES.length) * 100;
        const endPct = ((i + 1) / PHASES.length) * 100;
        const steps = 40;
        for (let s = 0; s <= steps; s++) {
          if (canceled) return;
          await new Promise<void>(r => setTimeout(r, phase.duration / steps));
          setProgress(startPct + (endPct - startPct) * (s / steps));
        }
      }
      if (!canceled) {
        setProgress(100);
        setDone(true);
        setTimeout(() => {
          if (!canceled) onComplete();
        }, 1800);
      }
    }

    runPhases();

    return () => {
      canceled = true;
    };
  }, [open, error, onComplete]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white dark:bg-surface-dark rounded-2xl shadow-2xl p-8">

        {error ? (
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-error" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Training failed</h2>
              <p className="text-sm text-neutral-500 mt-1">{error}</p>
            </div>
            {onRetry && (
              <button
                onClick={onRetry}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                Try again
              </button>
            )}
          </div>

        ) : done ? (
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-success" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Voice training complete!</h2>
              <p className="text-sm text-neutral-500 mt-1">Your brand voice has been calibrated successfully.</p>
            </div>
          </div>

        ) : (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary-50 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
              </div>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Training your voice model</h2>
              <p className="text-sm text-neutral-500 mt-1">This typically takes 10–20 seconds</p>
            </div>

            {/* Progress bar */}
            <div className="mb-5">
              <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 rounded-full transition-all duration-300 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-xs text-neutral-500 truncate pr-2">{PHASES[phaseIndex]?.label}</span>
                <span className="text-xs text-neutral-500 font-medium flex-shrink-0">{Math.round(progress)}%</span>
              </div>
            </div>

            {/* Phase steps */}
            <div className="space-y-2">
              {PHASES.map((phase, i) => {
                const isPast = i < phaseIndex;
                const isCurrent = i === phaseIndex;
                return (
                  <div
                    key={i}
                    className={clsx(
                      'flex items-center gap-3 text-sm px-3 py-2 rounded-lg transition-colors',
                      isPast && 'text-success',
                      isCurrent && 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20',
                      !isPast && !isCurrent && 'text-neutral-400'
                    )}
                  >
                    <div className={clsx(
                      'w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center',
                      isPast ? 'border-success bg-success' : isCurrent ? 'border-primary-500' : 'border-neutral-300 dark:border-neutral-600'
                    )}>
                      {isPast && (
                        <svg className="w-3 h-3 text-white" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <span>{phase.label}</span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
