/**
 * Subscription types for the frontend.
 *
 * The on-chain model (tiers, user subscription) lives in services/TeraPContracts.ts and is
 * re-exported here so UI code has a single import. `TierPresentation` carries the off-chain
 * marketing copy (description, colour, highlights) keyed by the on-chain tier name.
 */
export type { SubscriptionTierOnChain, SubscriptionOnChain } from '@/services/TeraPContracts';

export interface TierPresentation {
  /** Must match `TeraPSubscription.Tier.name` exactly. */
  name: string;
  description: string;
  highlights: string[];
  /** Tailwind-friendly hex colour used for accents. */
  color: string;
  popular: boolean;
}

/** Number of 30-day periods a user can buy in one transaction. */
export type SubscriptionPeriods = 1 | 3 | 6 | 12;
