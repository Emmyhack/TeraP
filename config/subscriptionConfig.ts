import type { SubscriptionPeriods, TierPresentation } from '@/types/subscription';

/** Length of one subscription period, mirrors `TeraPSubscription.PERIOD`. */
export const SUBSCRIPTION_PERIOD_DAYS = 30;

/** Period bundles offered in the UI. */
export const SUBSCRIPTION_PERIOD_OPTIONS: SubscriptionPeriods[] = [1, 3, 6, 12];

/**
 * Marketing copy per on-chain tier, keyed by the tier name created in script/Deploy.s.sol.
 * Prices and minutes always come from the contract; nothing here is authoritative.
 */
export const SUBSCRIPTION_TIERS: TierPresentation[] = [
  {
    name: 'Essential Care',
    description: 'Perfect for getting started with mental wellness support',
    highlights: ['Pay for sessions with plan minutes', 'Access to wellness circles', 'Encrypted session notes'],
    color: '#10B981',
    popular: false,
  },
  {
    name: 'Complete Care',
    description: 'Enhanced support for regular sessions',
    highlights: ['More minutes per period', 'Access to wellness circles', 'Encrypted session notes'],
    color: '#3B82F6',
    popular: true,
  },
  {
    name: 'Premium Care',
    description: 'Comprehensive support for frequent sessions',
    highlights: ['Generous minutes per period', 'Access to wellness circles', 'Encrypted session notes'],
    color: '#8B5CF6',
    popular: false,
  },
  {
    name: 'Organization Care',
    description: 'High-volume access for organizations and families',
    highlights: ['Largest minute allowance', 'Access to wellness circles', 'Encrypted session notes'],
    color: '#F59E0B',
    popular: false,
  },
];

const FALLBACK_PRESENTATION: Omit<TierPresentation, 'name'> = {
  description: 'Prepaid therapy minutes, renewed every 30 days',
  highlights: ['Pay for sessions with plan minutes', 'Access to wellness circles'],
  color: '#6366F1',
  popular: false,
};

/** Presentation for a tier name, with a neutral fallback for tiers added after deploy. */
export function getTierPresentation(name: string): TierPresentation {
  return SUBSCRIPTION_TIERS.find((t) => t.name === name) ?? { name, ...FALLBACK_PRESENTATION };
}

/**
 * Emergency session pricing shown in the booking flow (USD, informational only).
 * Kept for components/booking/SessionBooking.tsx.
 */
export const EMERGENCY_SESSION_RATES = {
  base: 89.99,
  urgent: 129.99,
  critical: 199.99,
  additional_minutes: 2.99,
};
