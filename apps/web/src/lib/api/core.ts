import { supabase, supabaseUrl, supabaseAnonKey } from '../supabase';

// Error types for better user feedback
export class ApiError extends Error {
  code: string;
  retryable: boolean;

  constructor(message: string, code: string, retryable = false) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.retryable = retryable;
  }
}

// User-friendly error messages
export const errorMessages: Record<string, string> = {
  'RATE_LIMIT':        'Too many requests. Please wait a moment and try again.',
  'NETWORK_ERROR':     'Network connection failed. Please check your internet connection.',
  'TIMEOUT':           'The request took too long. Please try again.',
  'AUTH_ERROR':        'Authentication failed. Please log in again.',
  'PROCESSING_FAILED': 'Processing failed. Please check your input and try again.',
  'GENERATION_FAILED': 'Content generation failed. Please try with different input.',
  'UNKNOWN':           'An unexpected error occurred. Please try again.',
};

export async function callEdgeFunction<T>(
  functionName: string,
  body: object,
  options: { maxRetries?: number; timeout?: number } = {}
): Promise<T> {
  const { maxRetries = 3, timeout = 30000 } = options;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId  = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body:   JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        const errorCode  = data.error?.code || 'UNKNOWN';
        const isRetryable = response.status === 429 || response.status >= 500;

        if (response.status === 429 && attempt < maxRetries) {
          const retryAfter = parseInt(response.headers.get('Retry-After') || '5', 10);
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          continue;
        }

        if (response.status >= 500 && attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          continue;
        }

        const userMessage = errorMessages[errorCode] || data.error?.message || errorMessages['UNKNOWN'];
        throw new ApiError(userMessage, errorCode, isRetryable);
      }

      return data as T;
    } catch (error) {
      lastError = error as Error;

      if (error instanceof Error && error.name === 'AbortError') {
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        throw new ApiError(errorMessages['TIMEOUT'], 'TIMEOUT', true);
      }

      if (error instanceof TypeError && error.message.includes('fetch')) {
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          continue;
        }
        throw new ApiError(errorMessages['NETWORK_ERROR'], 'NETWORK_ERROR', true);
      }

      if (error instanceof ApiError) throw error;
    }
  }

  throw lastError || new ApiError(errorMessages['UNKNOWN'], 'UNKNOWN', false);
}

// Uses the current user's JWT — required for user-scoped functions.
export async function callAuthEdgeFunction<T>(functionName: string, body: object): Promise<T> {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) {
    throw new ApiError(errorMessages['AUTH_ERROR'], 'AUTH_ERROR', false);
  }

  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body:   JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = await response.json();
    if (!response.ok) {
      const msg = data?.error ?? errorMessages['UNKNOWN'];
      throw new ApiError(typeof msg === 'string' ? msg : errorMessages['UNKNOWN'], 'API_ERROR', false);
    }
    return data as T;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof ApiError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError(errorMessages['TIMEOUT'], 'TIMEOUT', true);
    }
    throw new ApiError(errorMessages['NETWORK_ERROR'], 'NETWORK_ERROR', true);
  }
}
