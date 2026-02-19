/**
 * Normalize Supabase auth error messages to prevent information leakage.
 * Raw Supabase errors can reveal whether an email exists in the system.
 */

const LOGIN_ERRORS: Record<string, string> = {
  'Invalid login credentials': 'Invalid email or password.',
  'Email not confirmed': 'Please verify your email address before signing in.',
  'Too many requests': 'Too many attempts. Please wait a moment and try again.',
  'User not found': 'Invalid email or password.',
};

const SIGNUP_ERRORS: Record<string, string> = {
  'User already registered': 'An account with this email already exists.',
  'Password should be at least 6 characters': 'Password must be at least 8 characters.',
  'Unable to validate email address: invalid format': 'Please enter a valid email address.',
};

const RESET_ERRORS: Record<string, string> = {
  'User not found': 'If this email is registered, a reset link has been sent.',
  'For security purposes, you can only request this after': 'Please wait before requesting another reset link.',
};

function normalize(message: string, map: Record<string, string>, fallback: string): string {
  for (const [pattern, normalized] of Object.entries(map)) {
    if (message.includes(pattern)) return normalized;
  }
  return fallback;
}

export function normalizeLoginError(message: string): string {
  return normalize(message, LOGIN_ERRORS, 'Invalid email or password.');
}

export function normalizeSignupError(message: string): string {
  return normalize(message, SIGNUP_ERRORS, 'Something went wrong. Please try again.');
}

export function normalizeResetError(message: string): string {
  return normalize(message, RESET_ERRORS, 'If this email is registered, a reset link has been sent.');
}
