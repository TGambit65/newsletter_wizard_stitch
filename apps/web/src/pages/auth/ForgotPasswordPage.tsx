import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useWhiteLabel } from '@/contexts/WhiteLabelContext';
import { normalizeResetError } from '@/lib/auth-errors';
import { Wand2, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

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

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-white dark:from-neutral-900 dark:to-neutral-800 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
              Check your email
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 mb-6">
              We have sent a password reset link to <strong>{email}</strong>.
            </p>
            <Link
              to="/login"
              className="inline-block px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-white dark:from-neutral-900 dark:to-neutral-800 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-xl p-8">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>

          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {config.logo_url ? (
              <img src={config.logo_url} alt={config.brand_name} className="h-10 w-auto object-contain" />
            ) : (
              <>
                <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
                  <Wand2 className="w-6 h-6 text-white" />
                </div>
                <span className="font-bold text-xl text-neutral-900 dark:text-white">{config.brand_name}</span>
              </>
            )}
          </div>

          <h1 className="text-2xl font-bold text-center text-neutral-900 dark:text-white mb-2">
            Reset your password
          </h1>
          <p className="text-center text-neutral-500 dark:text-neutral-400 mb-8">
            Enter your email and we will send you a reset link
          </p>

          {error && (
            <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-error flex-shrink-0" />
              <p className="text-sm text-error">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                placeholder="you@example.com"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
