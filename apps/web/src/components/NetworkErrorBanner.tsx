import { useState, useEffect } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import clsx from 'clsx';

export function NetworkErrorBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);
  const [countdown, setCountdown] = useState(10);
  const [visible, setVisible] = useState(!navigator.onLine);

  useEffect(() => {
    function handleOffline() {
      setOffline(true);
      setVisible(true);
      setCountdown(10);
    }

    function handleOnline() {
      setOffline(false);
      // Keep banner visible briefly to show "reconnected" before hiding
      setTimeout(() => setVisible(false), 2000);
    }

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  // Auto-retry countdown when offline
  useEffect(() => {
    if (!offline) return;

    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          // Try to reload/ping
          if (navigator.onLine) {
            setOffline(false);
            setTimeout(() => setVisible(false), 2000);
          }
          return 10;
        }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [offline]);

  if (!visible) return null;

  return (
    <div className={clsx(
      'fixed bottom-0 left-0 right-0 z-[90] flex items-center justify-between px-4 py-3 text-sm font-medium transition-all duration-300',
      offline
        ? 'bg-error text-white'
        : 'bg-success text-white'
    )}>
      <div className="flex items-center gap-2">
        <WifiOff className="w-4 h-4 flex-shrink-0" />
        {offline ? (
          <span>No internet connection. Retrying in {countdown}s...</span>
        ) : (
          <span>Back online!</span>
        )}
      </div>
      {offline && (
        <button
          onClick={() => { setCountdown(10); window.location.reload(); }}
          className="flex items-center gap-1.5 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-xs"
        >
          <RefreshCw className="w-3 h-3" />
          Retry now
        </button>
      )}
    </div>
  );
}
