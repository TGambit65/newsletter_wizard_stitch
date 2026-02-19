import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { AlertCircle } from 'lucide-react';

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');

  useEffect(() => {
    // Give auth 15 seconds to complete before showing an error
    const timeout = setTimeout(() => setStatus('error'), 15000);

    // Primary path: listen for auth state change (PKCE, magic link, and token-refresh flows)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        clearTimeout(timeout);
        navigate('/dashboard', { replace: true });
      }
    });

    // Secondary path: hash-fragment tokens (legacy implicit OAuth flow)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');

    if (accessToken && refreshToken) {
      supabase.auth
        .setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ error }) => {
          if (error) {
            clearTimeout(timeout);
            setStatus('error');
          }
          // on success, onAuthStateChange fires SIGNED_IN above
        });
    } else if (!window.location.search && !window.location.hash) {
      // User navigated directly to /auth/callback with no params at all
      clearTimeout(timeout);
      setStatus('error');
    }

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [navigate]);

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-background-dark px-4">
        <div className="w-full max-w-md bg-white dark:bg-surface-dark rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-error" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
            Authentication failed
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mb-8">
            We couldn't complete your sign in. The link may have expired or already been used.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              to="/login"
              className="block px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors"
            >
              Back to login
            </Link>
            <Link
              to="/forgot-password"
              className="block px-6 py-3 border border-neutral-200 dark:border-white/10 text-neutral-700 dark:text-neutral-300 font-medium rounded-lg hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors"
            >
              Request a new link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-background-dark">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent mx-auto mb-4" />
        <p className="text-neutral-600 dark:text-neutral-400">Completing sign in…</p>
      </div>
    </div>
  );
}
