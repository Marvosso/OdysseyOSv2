/**
 * Map Stripe price IDs to user_profiles tier.
 * Uses STRIPE_PRO_PRICE_ID and STRIPE_STUDIO_PRICE_ID from env (see .env.example).
 */

export type Tier = 'free' | 'pro' | 'studio';

const PRICE_PRO = process.env.STRIPE_PRO_PRICE_ID ?? process.env.STRIPE_PRICE_PRO ?? 'price_1T0SFDAkaSYomILs3xrCboww';
const PRICE_STUDIO = process.env.STRIPE_STUDIO_PRICE_ID ?? process.env.STRIPE_PRICE_STUDIO ?? 'price_1T0SGkAkaSYomILsPIZU8fTP';

/** Price ID for Pro plan (for creating Checkout Session). */
export function getStripePriceIdPro(): string {
  return PRICE_PRO;
}

/** Price ID for Studio plan (for creating Checkout Session). */
export function getStripePriceIdStudio(): string {
  return PRICE_STUDIO;
}

export function tierFromPriceId(priceId: string | null | undefined): Tier {
  if (!priceId) return 'free';
  if (PRICE_STUDIO && priceId === PRICE_STUDIO) return 'studio';
  if (PRICE_PRO && priceId === PRICE_PRO) return 'pro';
  return 'free';
}

export function storyLimitForTier(tier: Tier): number {
  switch (tier) {
    case 'studio':
      return 50;
    case 'pro':
      return 15;
    default:
      return 3;
  }
}

export function aiUsageLimitForTier(tier: Tier): number {
  switch (tier) {
    case 'studio':
      return 500;
    case 'pro':
      return 100;
    default:
      return 5;
  }
}
