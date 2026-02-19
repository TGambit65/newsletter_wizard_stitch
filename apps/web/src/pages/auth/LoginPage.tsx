import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useWhiteLabel } from '@/contexts/WhiteLabelContext';
import { supabase } from '@/lib/supabase';
import { normalizeLoginError } from '@/lib/auth-errors';
import { Wand2, Eye, EyeOff, AlertCircle, Mail, CheckCircle2 } from 'lucide-react';

export function LoginPage() {
  const { signIn } = useAuth();
  const { config } = useWhiteLabel();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Magic link state
  const [magicMode, setMagicMode] = useState(false);
  const [magicEmail, setMagicEmail] = useState('');
  const [magicSent, setMagicSent] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!magicEmail.trim()) return;
    setMagicLoading(true);
    setError(null);
    const { error: otpError } = await supabase.auth.signInWithOtp({ email: magicEmail.trim() });
    if (otpError) {
      // Normalize to prevent email enumeration — don't reveal if the email exists
      const isRateLimit = otpError.message.toLowerCase().includes('rate') || otpError.message.toLowerCase().includes('wait');
      setError(isRateLimit ? 'Too many attempts. Please wait before requesting another link.' : 'If an account exists with this email, a sign-in link has been sent.');
    } else {
      setMagicSent(true);
    }
    setMagicLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await signIn(email, password);
    if (error) {
      setError(normalizeLoginError(error.message));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-white dark:from-neutral-900 dark:to-neutral-800 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-xl p-8">
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
            Welcome back
          </h1>
          <p className="text-center text-neutral-500 dark:text-neutral-400 mb-8">
            Sign in to your account to continue
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

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all pr-12"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-500 hover:text-neutral-700"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <Link 
                to="/forgot-password" 
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 border-t border-neutral-200 dark:border-neutral-700" />
            <span className="text-xs text-neutral-400 uppercase tracking-wide">or</span>
            <div className="flex-1 border-t border-neutral-200 dark:border-neutral-700" />
          </div>

          {/* Magic link section */}
          {!magicMode ? (
            <button
              onClick={() => setMagicMode(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors font-medium"
            >
              <Mail className="w-4 h-4" />
              Sign in with email link
            </button>
          ) : magicSent ? (
            <div className="text-center py-4">
              <CheckCircle2 className="w-10 h-10 text-success mx-auto mb-3" />
              <p className="font-medium text-neutral-900 dark:text-white mb-1">Check your inbox</p>
              <p className="text-sm text-neutral-500">We sent a sign-in link to <strong>{magicEmail}</strong></p>
              <button
                onClick={() => { setMagicMode(false); setMagicSent(false); setMagicEmail(''); }}
                className="mt-4 text-sm text-primary-600 hover:underline"
              >
                Back to sign in
              </button>
            </div>
          ) : (
            <form onSubmit={handleMagicLink} className="space-y-3">
              <p className="text-sm text-neutral-500 text-center mb-3">We'll email you a magic sign-in link — no password needed.</p>
              <input
                type="email"
                value={magicEmail}
                onChange={e => setMagicEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMagicMode(false)}
                  className="flex-1 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={magicLoading}
                  className="flex-1 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {magicLoading ? 'Sending...' : 'Send link'}
                </button>
              </div>
            </form>
          )}

          <p className="mt-6 text-center text-neutral-600 dark:text-neutral-400">
            Do not have an account?{' '}
            <Link to="/signup" className="text-primary-600 hover:text-primary-700 font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
