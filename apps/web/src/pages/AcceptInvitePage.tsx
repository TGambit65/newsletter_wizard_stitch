import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { validateInvitation, acceptInvitation, type InvitationDetails } from '@/lib/api';
import { Wand2, AlertCircle, CheckCircle2, Users, Mail, Lock, User } from 'lucide-react';

type AuthTab = 'signin' | 'signup';

export function AcceptInvitePage() {
  const [searchParams]          = useSearchParams();
  const { user, reloadProfile } = useAuth();
  const navigate                = useNavigate();
  const token                   = searchParams.get('token') ?? '';

  const [invitation, setInvitation]       = useState<InvitationDetails | null>(null);
  const [validating, setValidating]       = useState(true);
  const [accepting, setAccepting]         = useState(false);
  const [success, setSuccess]             = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const [authError, setAuthError]         = useState<string | null>(null);
  const [checkEmailMsg, setCheckEmailMsg] = useState<string | null>(null);
  const [tab, setTab]                     = useState<AuthTab>('signin');

  // Form state
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setValidating(false);
      setError('No invitation token found in the URL.');
      return;
    }
    validateInvitation(token)
      .then((data) => {
        setInvitation(data);
        if (data.valid && data.email) setEmail(data.email);
      })
      .catch(() => setError('Unable to validate invitation. Please check the link.'))
      .finally(() => setValidating(false));
  }, [token]);

  async function handleAccept() {
    setAccepting(true);
    setError(null);
    try {
      await acceptInvitation(token);
      setSuccess(true);
      await reloadProfile();
      setTimeout(() => navigate('/dashboard'), 1200);
    } catch (err) {
      setError((err as Error).message || 'Failed to accept invitation.');
    } finally {
      setAccepting(false);
    }
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError || !data.session) {
      setAuthError(signInError?.message ?? 'Sign in failed. Please check your credentials.');
      setAuthLoading(false);
      return;
    }

    // Now accept the invitation using the new session token
    try {
      await acceptInvitation(token);
      setSuccess(true);
      await reloadProfile();
      setTimeout(() => navigate('/dashboard'), 1200);
    } catch (err) {
      setAuthError((err as Error).message || 'Failed to accept invitation after signing in.');
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/accept-invite?token=${token}`,
      },
    });

    if (signUpError) {
      setAuthError(signUpError.message);
      setAuthLoading(false);
      return;
    }

    if (!data.session) {
      // Email confirmation required — tell user to check email
      setCheckEmailMsg(
        `A confirmation link has been sent to ${email}. Click it to verify your account, then return to this page to accept the invitation.`
      );
      setAuthLoading(false);
      return;
    }

    // Session exists (email confirmation disabled) — accept immediately
    try {
      await acceptInvitation(token);
      setSuccess(true);
      await reloadProfile();
      setTimeout(() => navigate('/dashboard'), 1200);
    } catch (err) {
      setAuthError((err as Error).message || 'Failed to accept invitation after sign up.');
    } finally {
      setAuthLoading(false);
    }
  }

  const loggedInEmailMismatch =
    user && invitation?.valid && invitation.email &&
    user.email?.toLowerCase() !== invitation.email.toLowerCase();

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-white dark:from-neutral-900 dark:to-neutral-800 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-xl p-8">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
              <Wand2 className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-neutral-900 dark:text-white">Newsletter Wizard</span>
          </div>

          {/* Loading */}
          {validating && (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
              <p className="text-neutral-500 dark:text-neutral-400 text-sm">Validating invitation…</p>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="text-center py-4">
              <div className="flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
                Welcome to the team!
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                You've joined <strong>{invitation?.tenant_name}</strong>. Redirecting to your dashboard…
              </p>
            </div>
          )}

          {/* Fatal error (no token, invalid invitation) */}
          {!validating && !success && error && !invitation?.valid && (
            <div className="text-center py-4">
              <div className="flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
                Invalid Invitation
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400 text-sm mb-6">{error}</p>
              <Link
                to="/login"
                className="text-primary-600 dark:text-primary-400 hover:underline text-sm"
              >
                Go to Login
              </Link>
            </div>
          )}

          {/* Check email message */}
          {checkEmailMsg && (
            <div className="text-center py-4">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mx-auto mb-4">
                <Mail className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
                Check Your Email
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400 text-sm">{checkEmailMsg}</p>
            </div>
          )}

          {/* Valid invitation */}
          {!validating && !success && !checkEmailMsg && invitation?.valid && (
            <>
              {/* Invitation info card */}
              <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary-100 dark:bg-primary-800 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-900 dark:text-white">
                      You've been invited to join
                    </p>
                    <p className="text-base font-semibold text-primary-700 dark:text-primary-300">
                      {invitation.tenant_name}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      as <span className="font-medium capitalize">{invitation.role}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Inline error */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-700 dark:text-red-400 text-sm mb-4">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* Logged-in + email matches → Accept button */}
              {user && !loggedInEmailMismatch && (
                <div className="space-y-3">
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 text-center">
                    Signed in as <strong>{user.email}</strong>
                  </p>
                  <button
                    onClick={handleAccept}
                    disabled={accepting}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {accepting ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        <CheckCircle2 className="h-5 w-5" />
                        Accept Invitation &amp; Join Workspace
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Logged-in + wrong email */}
              {loggedInEmailMismatch && (
                <div className="space-y-3">
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-700 dark:text-amber-400 text-sm">
                    <p className="font-medium mb-1">Wrong account</p>
                    <p>
                      This invitation was sent to <strong>{invitation.email}</strong>, but you're signed in as{' '}
                      <strong>{user.email}</strong>. Please sign out and sign in with the invited email.
                    </p>
                  </div>
                  <Link
                    to="/login"
                    className="block w-full text-center px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors text-sm font-medium"
                  >
                    Sign In with a Different Account
                  </Link>
                </div>
              )}

              {/* Not logged in → auth tabs */}
              {!user && (
                <>
                  {/* Tabs */}
                  <div className="flex rounded-lg bg-neutral-100 dark:bg-neutral-700 p-1 mb-5">
                    {(['signin', 'signup'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => { setTab(t); setAuthError(null); }}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                          tab === t
                            ? 'bg-white dark:bg-neutral-600 text-neutral-900 dark:text-white shadow-sm'
                            : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
                        }`}
                      >
                        {t === 'signin' ? 'Sign In' : 'Create Account'}
                      </button>
                    ))}
                  </div>

                  {authError && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-700 dark:text-red-400 text-sm mb-4">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      {authError}
                    </div>
                  )}

                  {/* Sign In form */}
                  {tab === 'signin' && (
                    <form onSubmit={handleSignIn} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                          Email
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                            placeholder="you@example.com"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                          Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                          <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                            placeholder="••••••••"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={authLoading}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {authLoading ? (
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : 'Sign In & Accept Invitation'}
                      </button>
                    </form>
                  )}

                  {/* Sign Up form */}
                  {tab === 'signup' && (
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                          Full Name
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                          <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                            placeholder="Jane Smith"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                          Email
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                            placeholder="you@example.com"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                          Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                          <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={8}
                            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                            placeholder="Min. 8 characters"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={authLoading}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {authLoading ? (
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : 'Create Account & Join Workspace'}
                      </button>
                    </form>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
