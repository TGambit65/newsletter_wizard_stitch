import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { reactivateAccount } from '@/lib/api';
import { Wand2, AlertCircle, CheckCircle2, LogOut } from 'lucide-react';

export function ReactivatePage() {
  const { signOut, reloadProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  async function handleReactivate() {
    setLoading(true);
    setError(null);

    try {
      await reactivateAccount();
      setSuccess(true);

      // Refresh the session so AuthContext reloads the profile with is_active = true
      await supabase.auth.refreshSession();
      await reloadProfile();

      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (err) {
      setError((err as Error).message || 'Failed to reactivate account. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-white dark:from-neutral-900 dark:to-neutral-800 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-xl p-8">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
              <Wand2 className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-neutral-900 dark:text-white">Newsletter Wizard</span>
          </div>

          {success ? (
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
                Account Reactivated!
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400">
                Welcome back. Redirecting to your dashboard…
              </p>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="flex items-center justify-center w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full mx-auto mb-4">
                  <AlertCircle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                </div>
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
                  Account Deactivated
                </h2>
                <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                  Your account has been deactivated. You can reactivate it at any time to restore full access.
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-700 dark:text-red-400 text-sm mb-4">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={handleReactivate}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <CheckCircle2 className="h-5 w-5" />
                      Reactivate My Account
                    </>
                  )}
                </button>

                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white font-medium rounded-xl border border-neutral-200 dark:border-white/10 hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
