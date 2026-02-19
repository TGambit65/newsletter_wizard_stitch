import { useState, useEffect } from 'react';
import { Wand2, RefreshCw, Clock } from 'lucide-react';

const MESSAGES = [
  { title: 'AI Recalibrating', subtitle: "Our wizard is recharging their spells. We'll be back shortly." },
  { title: 'Magic Recharging', subtitle: "The enchantments are being refreshed. Hang tight!" },
  { title: 'Maintenance Mode', subtitle: "We're making improvements. Check back in a few minutes." },
];

export function MaintenancePage() {
  const [msgIndex] = useState(() => Math.floor(Math.random() * MESSAGES.length));
  const [countdown, setCountdown] = useState(60);
  const [checking, setChecking] = useState(false);

  const msg = MESSAGES[msgIndex];

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          window.location.reload();
          return 60;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  function handleCheckNow() {
    setChecking(true);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-white dark:from-neutral-900 dark:to-neutral-800 px-4">
      <div className="w-full max-w-md text-center">
        {/* Animated wizard icon */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="w-24 h-24 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center animate-pulse">
            <Wand2 className="w-12 h-12 text-primary-500" />
          </div>
          {/* Sparkle dots */}
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-primary-400 rounded-full animate-ping"
              style={{
                top: `${[0, 0, 100, 100][i]}%`,
                left: `${[0, 100, 0, 100][i]}%`,
                animationDelay: `${i * 0.3}s`,
                animationDuration: '1.5s',
              }}
            />
          ))}
        </div>

        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
          {msg.title}
        </h1>
        <p className="text-neutral-500 mb-8">{msg.subtitle}</p>

        {/* ETA countdown */}
        <div className="flex items-center justify-center gap-2 text-neutral-400 text-sm mb-6">
          <Clock className="w-4 h-4" />
          <span>Auto-checking in {countdown}s</span>
        </div>

        <button
          onClick={handleCheckNow}
          disabled={checking}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium disabled:opacity-50"
        >
          <RefreshCw className={checking ? 'w-4 h-4 animate-spin' : 'w-4 h-4'} />
          {checking ? 'Checking...' : 'Check again now'}
        </button>

        <p className="mt-6 text-xs text-neutral-400">
          Follow{' '}
          <a href="https://status.newsletterwizard.io" className="text-primary-500 hover:underline" target="_blank" rel="noopener noreferrer">
            status.newsletterwizard.io
          </a>{' '}
          for real-time updates
        </p>
      </div>
    </div>
  );
}
