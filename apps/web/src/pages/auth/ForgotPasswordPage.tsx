import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useWhiteLabel } from '@/contexts/WhiteLabelContext';
import { normalizeResetError } from '@/lib/auth-errors';
import { Wand2, AlertCircle, CheckCircle2, ArrowLeft, Mail } from 'lucide-react';

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const { config } = useWhiteLabel();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await resetPassword(email);
    if (error) {
      setError(normalizeResetError(error.message));
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  const inputClass = 'w-full pl-11 pr-4 py-4 bg-white dark:bg-surface-dark border border-neutral-200 dark:border-white/10 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all duration-200 text-sm';

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-display flex items-center justify-center p-4 antialiased overflow-hidden relative">
      {/* Ambient background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary-500/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-primary-500/10 rounded-full blur-[120px] pointer-events-none" />

      <main className="w-full max-w-md mx-auto relative z-10 flex flex-col min-h-[520px] justify-between">

        {/* Header */}
        <div className="pt-10 pb-8 flex flex-col items-center text-center">
          {/* Logo with glow */}
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

          {success ? (
            <>
              <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2 tracking-tight">
                Check your inbox
              </h1>
              <p className="text-neutral-500 dark:text-neutral-400">
                We sent a reset link to <strong className="text-neutral-900 dark:text-white">{email}</strong>
              </p>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2 tracking-tight">
                Forgot Password?
              </h1>
              <p className="text-neutral-500 dark:text-neutral-400 text-lg">
                No worries — we'll send you a reset link.
              </p>
            </>
          )}
        </div>

        {/* Form / Success */}
        <div className="w-full space-y-5 px-1">
          {success ? (
            <Link
              to="/login"
              className="w-full py-4 px-6 flex items-center justify-center gap-2 btn-primary-gradient text-sm"
            >
              Back to Sign In
            </Link>
          ) : (
            <>
              {error && (
                <div className="p-4 bg-error/10 border border-error/20 rounded-xl flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-error flex-shrink-0" />
                  <p className="text-sm text-error">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 ml-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="w-5 h-5 text-neutral-400" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputClass}
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 px-6 flex items-center justify-center btn-primary-gradient text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="pb-6 pt-6 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary-500 hover:text-primary-light transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sign In
          </Link>
        </div>
      </main>
    </div>
  );
}
