import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useWhiteLabel } from '@/contexts/WhiteLabelContext';
import { Wand2, AlertCircle, CheckCircle2, Eye, EyeOff, ArrowRight } from 'lucide-react';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const { config } = useWhiteLabel();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  useEffect(() => {
    // Supabase appends access_token + refresh_token in the URL hash after redirect.
    // The supabase client picks these up automatically via onAuthStateChange.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setTokenValid(true);
      }
    });

    // Give the client 3 seconds to detect the recovery token; if not found, show error
    const timeout = setTimeout(() => {
      setTokenValid(prev => prev === null ? false : prev);
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setError('Failed to update password. Your reset link may have expired. Please request a new one.');
    } else {
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    }
  };

  const inputClass = 'w-full pl-11 pr-12 py-4 bg-white dark:bg-surface-dark border border-neutral-200 dark:border-white/10 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all duration-200 text-sm';

  const pageWrapper = (children: React.ReactNode) => (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-display flex items-center justify-center p-4 antialiased overflow-hidden relative">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary-500/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-primary-500/10 rounded-full blur-[120px] pointer-events-none" />
      <main className="w-full max-w-md mx-auto relative z-10 flex flex-col items-center text-center">
        {children}
      </main>
    </div>
  );

  if (tokenValid === false) {
    return pageWrapper(
      <div className="w-full space-y-6 py-16">
        <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8 text-error" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2 tracking-tight">Link expired</h1>
          <p className="text-neutral-500 dark:text-neutral-400">
            This password reset link is no longer valid. Please request a new one.
          </p>
        </div>
        <Link
          to="/forgot-password"
          className="inline-flex items-center justify-center gap-2 px-8 py-4 btn-primary-gradient text-sm"
        >
          Request new link
        </Link>
      </div>
    );
  }

  if (success) {
    return pageWrapper(
      <div className="w-full space-y-6 py-16">
        <CheckCircle2 className="w-16 h-16 text-success mx-auto" />
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2 tracking-tight">Password updated!</h1>
          <p className="text-neutral-500 dark:text-neutral-400">
            Your password has been changed. Redirecting to login…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-display flex items-center justify-center p-4 antialiased overflow-hidden relative">
      {/* Ambient background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary-500/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-primary-500/10 rounded-full blur-[120px] pointer-events-none" />

      <main className="w-full max-w-md mx-auto relative z-10 flex flex-col min-h-[520px] justify-between">

        {/* Header */}
        <div className="pt-10 pb-8 flex flex-col items-center text-center">
          <div className="relative mb-6 group">
            <div className="absolute inset-0 bg-primary-500 rounded-full blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-500" />
            <div className="relative w-20 h-20 bg-surface-dark rounded-2xl flex items-center justify-center border border-primary-500/30 shadow-glow">
              {config.logo_url ? (
                <img src={config.logo_url} alt={config.brand_name} className="w-12 h-12 object-contain rounded-xl" />
              ) : (
                <Wand2 className="w-10 h-10 text-primary-500" />
              )}
            </div>
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2 tracking-tight">
            Set new password
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-lg">
            Choose a strong password for your account.
          </p>
        </div>

        {/* Form */}
        <div className="w-full space-y-5 px-1">
          {error && (
            <div className="p-4 bg-error/10 border border-error/20 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-error flex-shrink-0" />
              <p className="text-sm text-error">{error}</p>
            </div>
          )}

          {tokenValid === null && (
            <div className="flex items-center justify-center gap-2 py-4 text-sm text-neutral-500">
              <div className="w-4 h-4 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
              Verifying reset link…
            </div>
          )}

          {tokenValid && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* New password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 ml-1">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClass}
                    placeholder="At least 8 characters"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-400 hover:text-primary-500 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div>
                <label htmlFor="confirm" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 ml-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="confirm"
                    type={showPassword ? 'text' : 'password'}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className={inputClass}
                    placeholder="Repeat your new password"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 flex items-center justify-center gap-2 btn-primary-gradient text-sm group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{loading ? 'Updating…' : 'Update password'}</span>
                {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="pb-6 pt-6 text-center">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Remember it?{' '}
            <Link to="/login" className="font-semibold text-primary-500 hover:text-primary-light transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
