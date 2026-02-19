import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useWhiteLabel } from '@/contexts/WhiteLabelContext';
import { supabase } from '@/lib/supabase';
import { normalizeLoginError } from '@/lib/auth-errors';
import { Wand2, Eye, EyeOff, AlertCircle, Mail, CheckCircle2, ArrowRight } from 'lucide-react';

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

  const inputClass = 'w-full pl-11 pr-4 py-4 bg-white dark:bg-surface-dark border border-neutral-200 dark:border-white/10 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all duration-200 text-sm';

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-display flex items-center justify-center p-4 antialiased overflow-hidden relative">
      {/* Ambient background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary-500/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-primary-500/10 rounded-full blur-[120px] pointer-events-none" />

      <main className="w-full max-w-md mx-auto relative z-10 flex flex-col min-h-[600px] justify-between">

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
          <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-2 tracking-tight">
            Welcome Back!
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-lg">
            Sign in to continue crafting magic.
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

          {!magicMode ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
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
                    placeholder="wizard@newsletter.com"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 ml-1">
                  Password
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
                    className={`${inputClass} pr-12`}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-400 hover:text-primary-500 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <div className="flex justify-end mt-2">
                  <Link to="/forgot-password" className="text-sm font-medium text-primary-500 hover:text-primary-light transition-colors">
                    Forgot Password?
                  </Link>
                </div>
              </div>

              {/* Sign In button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 flex items-center justify-center gap-2 btn-primary-gradient text-sm group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{loading ? 'Signing in…' : 'Sign In'}</span>
                {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
              </button>
            </form>
          ) : magicSent ? (
            <div className="text-center py-6">
              <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-3" />
              <p className="font-semibold text-neutral-900 dark:text-white mb-1">Check your inbox</p>
              <p className="text-sm text-neutral-500">We sent a sign-in link to <strong>{magicEmail}</strong></p>
              <button
                onClick={() => { setMagicMode(false); setMagicSent(false); setMagicEmail(''); }}
                className="mt-4 text-sm text-primary-500 hover:underline"
              >
                Back to sign in
              </button>
            </div>
          ) : (
            <form onSubmit={handleMagicLink} className="space-y-3">
              <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center">
                We'll email you a magic sign-in link — no password needed.
              </p>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-neutral-400" />
                </div>
                <input
                  type="email"
                  value={magicEmail}
                  onChange={e => setMagicEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className={inputClass}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMagicMode(false)}
                  className="flex-1 py-3 border border-neutral-200 dark:border-white/10 rounded-xl text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={magicLoading}
                  className="flex-1 py-3 btn-primary-gradient text-sm disabled:opacity-50"
                >
                  {magicLoading ? 'Sending…' : 'Send link'}
                </button>
              </div>
            </form>
          )}

          {/* Divider */}
          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-neutral-200 dark:border-white/10" />
            <span className="flex-shrink-0 mx-4 text-neutral-400 dark:text-neutral-500 text-sm font-medium">Or continue with</span>
            <div className="flex-grow border-t border-neutral-200 dark:border-white/10" />
          </div>

          {/* Magic link toggle */}
          {!magicMode && !magicSent && (
            <button
              onClick={() => setMagicMode(true)}
              className="w-full flex items-center justify-center gap-2 py-3 border border-neutral-200 dark:border-white/10 rounded-xl text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-white/5 hover:border-primary-500/30 transition-all font-medium"
            >
              <Mail className="w-4 h-4" />
              Sign in with email link
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="pb-6 pt-6 text-center">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Don't have an account?{' '}
            <Link to="/signup" className="font-semibold text-primary-500 hover:text-primary-light transition-colors">
              Sign Up
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
