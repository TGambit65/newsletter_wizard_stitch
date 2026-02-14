import { describe, it, expect } from 'vitest';

// Tier Limits and Billing Tests
describe('Subscription Tiers', () => {
  const TIER_LIMITS = {
    free: {
      newsletters_per_month: 5,
      sources: 10,
      voice_profiles: 1,
      team_members: 1,
    },
    starter: {
      newsletters_per_month: 20,
      sources: 50,
      voice_profiles: 3,
      team_members: 3,
    },
    professional: {
      newsletters_per_month: 100,
      sources: 200,
      voice_profiles: 10,
      team_members: 10,
    },
    enterprise: {
      newsletters_per_month: -1, // Unlimited
      sources: -1,
      voice_profiles: -1,
      team_members: -1,
    },
  };

  type TierName = keyof typeof TIER_LIMITS;

  function getTierLimit(tier: TierName, feature: keyof typeof TIER_LIMITS['free']): number {
    return TIER_LIMITS[tier][feature];
  }

  function isWithinLimit(tier: TierName, feature: keyof typeof TIER_LIMITS['free'], current: number): boolean {
    const limit = getTierLimit(tier, feature);
    if (limit === -1) return true; // Unlimited
    return current < limit;
  }

  describe('Tier Limits', () => {
    it('returns correct limits for free tier', () => {
      expect(getTierLimit('free', 'newsletters_per_month')).toBe(5);
      expect(getTierLimit('free', 'sources')).toBe(10);
      expect(getTierLimit('free', 'voice_profiles')).toBe(1);
    });

    it('returns correct limits for professional tier', () => {
      expect(getTierLimit('professional', 'newsletters_per_month')).toBe(100);
      expect(getTierLimit('professional', 'sources')).toBe(200);
    });

    it('returns unlimited for enterprise', () => {
      expect(getTierLimit('enterprise', 'newsletters_per_month')).toBe(-1);
    });
  });

  describe('Limit Checking', () => {
    it('checks if within limit correctly', () => {
      expect(isWithinLimit('free', 'newsletters_per_month', 3)).toBe(true);
      expect(isWithinLimit('free', 'newsletters_per_month', 5)).toBe(false);
      expect(isWithinLimit('free', 'newsletters_per_month', 6)).toBe(false);
    });

    it('enterprise always within limit', () => {
      expect(isWithinLimit('enterprise', 'newsletters_per_month', 1000)).toBe(true);
      expect(isWithinLimit('enterprise', 'sources', 10000)).toBe(true);
    });
  });
});

describe('Usage Tracking', () => {
  interface UsageRecord {
    tenant_id: string;
    period_start: Date;
    period_end: Date;
    newsletters_sent: number;
    sources_added: number;
    ai_generations: number;
  }

  function calculateUsagePercentage(used: number, limit: number): number {
    if (limit === -1) return 0; // Unlimited
    return Math.min(Math.round((used / limit) * 100), 100);
  }

  function isApproachingLimit(used: number, limit: number, threshold: number = 0.8): boolean {
    if (limit === -1) return false;
    return used >= limit * threshold;
  }

  function getUsageStatus(used: number, limit: number): 'ok' | 'warning' | 'exceeded' {
    if (limit === -1) return 'ok';
    if (used >= limit) return 'exceeded';
    if (used >= limit * 0.8) return 'warning';
    return 'ok';
  }

  describe('Usage Percentage', () => {
    it('calculates percentage correctly', () => {
      expect(calculateUsagePercentage(50, 100)).toBe(50);
      expect(calculateUsagePercentage(80, 100)).toBe(80);
      expect(calculateUsagePercentage(100, 100)).toBe(100);
    });

    it('caps at 100%', () => {
      expect(calculateUsagePercentage(150, 100)).toBe(100);
    });

    it('returns 0 for unlimited', () => {
      expect(calculateUsagePercentage(1000, -1)).toBe(0);
    });
  });

  describe('Approaching Limit Warning', () => {
    it('warns at 80% threshold', () => {
      expect(isApproachingLimit(79, 100)).toBe(false);
      expect(isApproachingLimit(80, 100)).toBe(true);
      expect(isApproachingLimit(100, 100)).toBe(true);
    });

    it('never warns for unlimited', () => {
      expect(isApproachingLimit(10000, -1)).toBe(false);
    });
  });

  describe('Usage Status', () => {
    it('returns correct status', () => {
      expect(getUsageStatus(50, 100)).toBe('ok');
      expect(getUsageStatus(80, 100)).toBe('warning');
      expect(getUsageStatus(100, 100)).toBe('exceeded');
      expect(getUsageStatus(150, 100)).toBe('exceeded');
    });
  });
});

describe('Billing Calculations', () => {
  interface PricingTier {
    name: string;
    monthly_price: number;
    annual_price: number;
  }

  const PRICING: PricingTier[] = [
    { name: 'free', monthly_price: 0, annual_price: 0 },
    { name: 'starter', monthly_price: 29, annual_price: 290 },
    { name: 'professional', monthly_price: 99, annual_price: 990 },
    { name: 'enterprise', monthly_price: 299, annual_price: 2990 },
  ];

  function calculateAnnualSavings(tierName: string): number {
    const tier = PRICING.find(t => t.name === tierName);
    if (!tier || tier.monthly_price === 0) return 0;
    
    const monthlyTotal = tier.monthly_price * 12;
    return monthlyTotal - tier.annual_price;
  }

  function calculateSavingsPercentage(tierName: string): number {
    const tier = PRICING.find(t => t.name === tierName);
    if (!tier || tier.monthly_price === 0) return 0;
    
    const monthlyTotal = tier.monthly_price * 12;
    return Math.round(((monthlyTotal - tier.annual_price) / monthlyTotal) * 100);
  }

  describe('Annual Savings', () => {
    it('calculates savings for starter', () => {
      expect(calculateAnnualSavings('starter')).toBe(58); // 348 - 290
    });

    it('calculates savings for professional', () => {
      expect(calculateAnnualSavings('professional')).toBe(198); // 1188 - 990
    });

    it('returns 0 for free tier', () => {
      expect(calculateAnnualSavings('free')).toBe(0);
    });
  });

  describe('Savings Percentage', () => {
    it('calculates percentage correctly', () => {
      expect(calculateSavingsPercentage('starter')).toBe(17); // ~16.67%
      expect(calculateSavingsPercentage('professional')).toBe(17); // ~16.67%
    });
  });
});
