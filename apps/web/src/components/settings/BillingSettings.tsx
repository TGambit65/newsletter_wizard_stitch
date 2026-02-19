import { Check, ArrowRight } from 'lucide-react';
import clsx from 'clsx';
import { TIER_LIMITS, SubscriptionTier } from '@/lib/supabase';

interface Plan {
  name: string;
  tier: SubscriptionTier;
  price: number;
  popular?: boolean;
  features: string[];
}

const PLANS: Plan[] = [
  {
    name: 'Free',
    tier: 'free',
    price: 0,
    features: ['10 knowledge sources', '5 newsletters/month', '50 AI generations', 'Basic analytics'],
  },
  {
    name: 'Creator',
    tier: 'creator',
    price: 39,
    features: [
      '50 knowledge sources',
      '25 newsletters/month',
      '250 AI generations',
      'Advanced analytics',
      'Voice profiles',
    ],
  },
  {
    name: 'Pro',
    tier: 'pro',
    price: 99,
    popular: true,
    features: [
      '200 knowledge sources',
      '100 newsletters/month',
      '1,000 AI generations',
      'A/B testing',
      'Priority support',
    ],
  },
  {
    name: 'Business',
    tier: 'business',
    price: 249,
    features: [
      '1,000 knowledge sources',
      '500 newsletters/month',
      '5,000 AI generations',
      'Team collaboration',
      'API access',
      'Custom integrations',
    ],
  },
];

interface BillingSettingsProps {
  currentTier: SubscriptionTier;
  upgrading: string | null;
  onUpgrade: (tier: SubscriptionTier) => void;
}

export function BillingSettings({ currentTier, upgrading, onUpgrade }: BillingSettingsProps) {
  const currentLimits = TIER_LIMITS[currentTier];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Current Plan</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white capitalize">
              {currentTier}
            </p>
            <p className="text-neutral-500">${currentLimits.price}/month</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-neutral-500">Usage this period</p>
            <p className="font-medium text-neutral-900 dark:text-white">
              8 / {currentLimits.aiGenerations} AI generations
            </p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
          Available Plans
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PLANS.map((plan) => (
            <div
              key={plan.tier}
              className={clsx(
                'rounded-xl border-2 p-6 relative',
                currentTier === plan.tier
                  ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/10'
                  : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800'
              )}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-4 px-3 py-1 bg-primary-500 text-white text-xs font-medium rounded-full">
                  Popular
                </span>
              )}
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                  {plan.name}
                </h3>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">
                  ${plan.price}
                  <span className="text-sm font-normal text-neutral-500">/mo</span>
                </p>
              </div>
              <ul className="space-y-2 mb-6">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400"
                  >
                    <Check className="w-4 h-4 text-success" />
                    {feature}
                  </li>
                ))}
              </ul>
              {currentTier === plan.tier ? (
                <button
                  disabled
                  className="w-full py-2.5 bg-neutral-100 dark:bg-neutral-700 text-neutral-500 font-medium rounded-lg"
                >
                  Current Plan
                </button>
              ) : (
                <button
                  onClick={() => onUpgrade(plan.tier)}
                  disabled={upgrading === plan.tier}
                  className="w-full py-2.5 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {upgrading === plan.tier ? 'Processing...' : 'Upgrade'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
