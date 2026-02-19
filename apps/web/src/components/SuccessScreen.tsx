import { CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';

interface SuccessAction {
  label: string;
  href?: string;
  onClick?: () => void;
  primary?: boolean;
}

interface SuccessStat {
  label: string;
  value: string | number;
}

export interface SuccessScreenProps {
  title: string;
  message: string;
  stats?: SuccessStat[];
  actions?: SuccessAction[];
  icon?: React.ComponentType<{ className?: string }>;
  children?: React.ReactNode;
}

function Confetti() {
  const COLORS = ['#0066FF', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6'];
  const particles = Array.from({ length: 64 }, (_, i) => ({
    id: i,
    color: COLORS[i % COLORS.length],
    left: (i * 1.5873) % 100,
    delay: (i * 0.0625) % 2.5,
    duration: 2.2 + (i % 7) * 0.3,
    size: 6 + (i % 5) * 2,
    isCircle: i % 3 === 0,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <style>{`
        @keyframes confetti-fall {
          0%   { transform: translateY(-24px) rotate(0deg);   opacity: 1; }
          80%  { opacity: 0.8; }
          100% { transform: translateY(100%) rotate(540deg); opacity: 0; }
        }
      `}</style>
      {particles.map(p => (
        <span
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.left}%`,
            top: '-24px',
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            borderRadius: p.isCircle ? '50%' : '2px',
            animation: `confetti-fall ${p.duration}s ${p.delay}s ease-in both`,
          }}
        />
      ))}
    </div>
  );
}

export function SuccessScreen({
  title,
  message,
  stats,
  actions,
  icon: Icon,
  children,
}: SuccessScreenProps) {
  return (
    <div className="relative min-h-full flex items-center justify-center bg-gradient-to-br from-primary-50 to-white dark:from-neutral-900 dark:to-neutral-800 px-4 py-16 overflow-hidden">
      <Confetti />

      <div className="relative z-10 w-full max-w-md text-center">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          {Icon ? (
            <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center">
              <Icon className="w-10 h-10 text-primary-500" />
            </div>
          ) : (
            <CheckCircle2 className="w-20 h-20 text-success" />
          )}
        </div>

        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-3">{title}</h1>
        <p className="text-neutral-500 dark:text-neutral-400 mb-8">{message}</p>

        {/* Stats grid */}
        {stats && stats.length > 0 && (
          <div className={clsx(
            'grid gap-4 mb-8',
            stats.length === 1 ? 'grid-cols-1 max-w-xs mx-auto' : 'grid-cols-2'
          )}>
            {stats.map(stat => (
              <div key={stat.label} className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">{stat.value}</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Custom children (e.g. social share row) */}
        {children && <div className="mb-6">{children}</div>}

        {/* Actions */}
        {actions && actions.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 justify-center flex-wrap">
            {actions.map(action =>
              action.href ? (
                <a
                  key={action.label}
                  href={action.href}
                  className={clsx(
                    'inline-flex items-center justify-center px-6 py-3 rounded-lg font-medium transition-colors text-sm',
                    action.primary
                      ? 'bg-primary-500 text-white hover:bg-primary-600'
                      : 'border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                  )}
                >
                  {action.label}
                </a>
              ) : (
                <button
                  key={action.label}
                  onClick={action.onClick}
                  className={clsx(
                    'inline-flex items-center justify-center px-6 py-3 rounded-lg font-medium transition-colors text-sm',
                    action.primary
                      ? 'bg-primary-500 text-white hover:bg-primary-600'
                      : 'border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                  )}
                >
                  {action.label}
                </button>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
