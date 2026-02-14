import { describe, it, expect, vi } from 'vitest';

// Webhook and API Key Tests
describe('Webhooks', () => {
  describe('Webhook URL Validation', () => {
    function isValidWebhookUrl(url: string): boolean {
      try {
        const parsed = new URL(url);
        return parsed.protocol === 'https:';
      } catch {
        return false;
      }
    }

    it('accepts valid HTTPS URLs', () => {
      expect(isValidWebhookUrl('https://example.com/webhook')).toBe(true);
      expect(isValidWebhookUrl('https://api.example.com/v1/hook')).toBe(true);
    });

    it('rejects HTTP URLs', () => {
      expect(isValidWebhookUrl('http://example.com/webhook')).toBe(false);
    });

    it('rejects invalid URLs', () => {
      expect(isValidWebhookUrl('not-a-url')).toBe(false);
      expect(isValidWebhookUrl('')).toBe(false);
    });
  });

  describe('Webhook Event Types', () => {
    const WEBHOOK_EVENTS = [
      'newsletter.created',
      'newsletter.sent',
      'newsletter.opened',
      'newsletter.clicked',
      'subscriber.added',
      'subscriber.removed',
      'source.added',
      'source.processed',
    ];

    function isValidEvent(event: string): boolean {
      return WEBHOOK_EVENTS.includes(event);
    }

    it('validates known events', () => {
      expect(isValidEvent('newsletter.created')).toBe(true);
      expect(isValidEvent('newsletter.sent')).toBe(true);
      expect(isValidEvent('subscriber.added')).toBe(true);
    });

    it('rejects unknown events', () => {
      expect(isValidEvent('unknown.event')).toBe(false);
      expect(isValidEvent('')).toBe(false);
    });
  });

  describe('Webhook Payload Signing', () => {
    async function signPayload(payload: object, secret: string): Promise<string> {
      const encoder = new TextEncoder();
      const data = encoder.encode(JSON.stringify(payload));
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const signature = await crypto.subtle.sign('HMAC', key, data);
      return Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    }

    async function verifySignature(payload: object, signature: string, secret: string): Promise<boolean> {
      const expected = await signPayload(payload, secret);
      return signature === expected;
    }

    it('generates consistent signatures', async () => {
      const payload = { event: 'newsletter.sent', data: { id: '123' } };
      const secret = 'test-secret-key';
      
      const sig1 = await signPayload(payload, secret);
      const sig2 = await signPayload(payload, secret);
      
      expect(sig1).toBe(sig2);
    });

    it('verifies valid signatures', async () => {
      const payload = { event: 'test' };
      const secret = 'secret123';
      const signature = await signPayload(payload, secret);
      
      expect(await verifySignature(payload, signature, secret)).toBe(true);
    });

    it('rejects invalid signatures', async () => {
      const payload = { event: 'test' };
      const secret = 'secret123';
      
      expect(await verifySignature(payload, 'invalid-signature', secret)).toBe(false);
    });
  });

  describe('Webhook Retry Logic', () => {
    function calculateRetryDelay(attemptNumber: number, baseDelay: number = 1000): number {
      // Exponential backoff with max of 1 hour
      const delay = baseDelay * Math.pow(2, attemptNumber - 1);
      return Math.min(delay, 3600000);
    }

    function shouldRetry(statusCode: number, attemptNumber: number, maxAttempts: number = 5): boolean {
      if (attemptNumber >= maxAttempts) return false;
      // Retry on 5xx errors and timeouts
      return statusCode >= 500 || statusCode === 408;
    }

    it('calculates exponential backoff', () => {
      expect(calculateRetryDelay(1, 1000)).toBe(1000);
      expect(calculateRetryDelay(2, 1000)).toBe(2000);
      expect(calculateRetryDelay(3, 1000)).toBe(4000);
      expect(calculateRetryDelay(4, 1000)).toBe(8000);
    });

    it('caps delay at 1 hour', () => {
      expect(calculateRetryDelay(20, 1000)).toBe(3600000);
    });

    it('determines if should retry', () => {
      expect(shouldRetry(500, 1)).toBe(true);
      expect(shouldRetry(502, 3)).toBe(true);
      expect(shouldRetry(408, 1)).toBe(true); // Timeout
      expect(shouldRetry(404, 1)).toBe(false); // 4xx should not retry
      expect(shouldRetry(500, 5)).toBe(false); // Max attempts reached
    });
  });
});

describe('API Keys', () => {
  describe('API Key Generation', () => {
    function generateApiKey(prefix: string = 'nw'): string {
      const randomPart = Array.from({ length: 32 }, () => 
        Math.random().toString(36).charAt(2)
      ).join('');
      return `${prefix}_${randomPart}`;
    }

    it('generates keys with correct prefix', () => {
      const key = generateApiKey('nw');
      expect(key.startsWith('nw_')).toBe(true);
    });

    it('generates keys of correct length', () => {
      const key = generateApiKey('nw');
      expect(key.length).toBe(35); // 2 (prefix) + 1 (_) + 32 (random)
    });

    it('generates unique keys', () => {
      const key1 = generateApiKey('nw');
      const key2 = generateApiKey('nw');
      expect(key1).not.toBe(key2);
    });
  });

  describe('API Key Validation', () => {
    function isValidApiKey(key: string): boolean {
      // Format: prefix_randomchars (e.g., nw_abc123...)
      const pattern = /^[a-z]{2,4}_[a-z0-9]{24,48}$/;
      return pattern.test(key);
    }

    it('validates correct format', () => {
      expect(isValidApiKey('nw_' + 'a'.repeat(32))).toBe(true);
      expect(isValidApiKey('test_' + 'a1b2'.repeat(8))).toBe(true);
    });

    it('rejects invalid formats', () => {
      expect(isValidApiKey('')).toBe(false);
      expect(isValidApiKey('invalid')).toBe(false);
      expect(isValidApiKey('ab_short')).toBe(false);
    });
  });

  describe('API Key Hashing', () => {
    async function hashApiKey(key: string): Promise<string> {
      const encoder = new TextEncoder();
      const data = encoder.encode(key);
      const hash = await crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    }

    it('produces consistent hashes', async () => {
      const key = 'nw_testkey123';
      const hash1 = await hashApiKey(key);
      const hash2 = await hashApiKey(key);
      expect(hash1).toBe(hash2);
    });

    it('produces 64-character hex hashes', async () => {
      const hash = await hashApiKey('nw_testkey');
      expect(hash.length).toBe(64);
      expect(/^[0-9a-f]+$/.test(hash)).toBe(true);
    });
  });

  describe('Rate Limiting', () => {
    interface RateLimitConfig {
      requests_per_minute: number;
      requests_per_hour: number;
      requests_per_day: number;
    }

    const RATE_LIMITS: Record<string, RateLimitConfig> = {
      free: { requests_per_minute: 10, requests_per_hour: 100, requests_per_day: 500 },
      starter: { requests_per_minute: 30, requests_per_hour: 500, requests_per_day: 5000 },
      professional: { requests_per_minute: 100, requests_per_hour: 2000, requests_per_day: 20000 },
      enterprise: { requests_per_minute: 1000, requests_per_hour: 10000, requests_per_day: 100000 },
    };

    function isRateLimited(
      tier: string,
      requestCounts: { minute: number; hour: number; day: number }
    ): { limited: boolean; reason?: string } {
      const limits = RATE_LIMITS[tier];
      if (!limits) return { limited: true, reason: 'Invalid tier' };

      if (requestCounts.minute >= limits.requests_per_minute) {
        return { limited: true, reason: 'Minute limit exceeded' };
      }
      if (requestCounts.hour >= limits.requests_per_hour) {
        return { limited: true, reason: 'Hour limit exceeded' };
      }
      if (requestCounts.day >= limits.requests_per_day) {
        return { limited: true, reason: 'Day limit exceeded' };
      }

      return { limited: false };
    }

    it('allows requests within limits', () => {
      const result = isRateLimited('free', { minute: 5, hour: 50, day: 200 });
      expect(result.limited).toBe(false);
    });

    it('limits when minute quota exceeded', () => {
      const result = isRateLimited('free', { minute: 10, hour: 50, day: 200 });
      expect(result.limited).toBe(true);
      expect(result.reason).toBe('Minute limit exceeded');
    });

    it('limits when hour quota exceeded', () => {
      const result = isRateLimited('free', { minute: 5, hour: 100, day: 200 });
      expect(result.limited).toBe(true);
      expect(result.reason).toBe('Hour limit exceeded');
    });
  });
});
