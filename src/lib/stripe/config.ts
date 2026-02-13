/**
 * Stripe config: all keys and price IDs from env.
 * - Client: use stripePublishableKey (NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
 * - Server: webhook and create-checkout-session use STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, price IDs
 */

/** Publishable key for client (Stripe.js, etc.). Set in .env.local as NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY. */
export const stripePublishableKey =
  typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '')
    : '';

/** Server-only: secret key for Stripe API (webhook, create checkout). */
export function getStripeSecretKey(): string | null {
  const key = process.env.STRIPE_SECRET_KEY;
  return key && key.trim().length > 0 ? key.trim() : null;
}

/** Server-only: webhook signing secret. */
export function getStripeWebhookSecret(): string | null {
  return process.env.STRIPE_WEBHOOK_SECRET ?? null;
}
