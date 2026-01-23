import { describe, it, expect } from 'vitest';
import { TIER_LIMITS } from '@/lib/supabase';

describe('Supabase utilities', () => {
  describe('TIER_LIMITS', () => {
    it('has correct free tier limits', () => {
      expect(TIER_LIMITS.free).toEqual({
        sources: 10,
        newsletters: 5,
        aiGenerations: 50,
        price: 0,
      });
    });

    it('has correct creator tier limits', () => {
      expect(TIER_LIMITS.creator).toEqual({
        sources: 50,
        newsletters: 25,
        aiGenerations: 250,
        price: 39,
      });
    });

    it('has correct pro tier limits', () => {
      expect(TIER_LIMITS.pro).toEqual({
        sources: 200,
        newsletters: 100,
        aiGenerations: 1000,
        price: 99,
      });
    });

    it('has correct business tier limits', () => {
      expect(TIER_LIMITS.business).toEqual({
        sources: 1000,
        newsletters: 500,
        aiGenerations: 5000,
        price: 249,
      });
    });

    it('tiers scale appropriately', () => {
      const tiers = ['free', 'creator', 'pro', 'business'] as const;
      for (let i = 1; i < tiers.length; i++) {
        const prev = TIER_LIMITS[tiers[i - 1]];
        const curr = TIER_LIMITS[tiers[i]];
        expect(curr.sources).toBeGreaterThan(prev.sources);
        expect(curr.newsletters).toBeGreaterThan(prev.newsletters);
        expect(curr.aiGenerations).toBeGreaterThan(prev.aiGenerations);
        expect(curr.price).toBeGreaterThan(prev.price);
      }
    });
  });
});
