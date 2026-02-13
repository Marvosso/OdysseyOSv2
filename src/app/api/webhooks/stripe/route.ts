/**
 * Stripe webhook handler
 *
 * - Verifies signature with STRIPE_WEBHOOK_SECRET
 * - checkout.session.completed: set tier from subscription price (client_reference_id = user id)
 * - customer.subscription.updated: upgrade/downgrade tier from new price
 * - customer.subscription.deleted: set tier to free
 *
 * When creating Checkout Session, set:
 * - client_reference_id = Supabase user id (uuid)
 * - subscription_data.metadata = { user_id: <Supabase user id> }
 */

import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getSupabaseServiceClient } from '@/lib/supabase/server';
import { getStripeSecretKey } from '@/lib/stripe/config';
import { tierFromPriceId, storyLimitForTier, aiUsageLimitForTier, type Tier } from '@/lib/stripe/tierFromPrice';

function getStripe(): Stripe {
  const key = getStripeSecretKey();
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
  return new Stripe(key);
}

async function setUserTier(userId: string, tier: Tier): Promise<boolean> {
  const db = getSupabaseServiceClient();
  if (!db) {
    console.error('[Stripe webhook] Supabase service client not configured');
    return false;
  }
  const { error } = await db
    .from('user_profiles')
    .upsert(
      {
        id: userId,
        tier,
        story_limit: storyLimitForTier(tier),
        ai_usage_limit: aiUsageLimitForTier(tier),
      },
      { onConflict: 'id' }
    );
  if (error) {
    console.error('[Stripe webhook] Failed to update user_profiles:', error);
    return false;
  }
  return true;
}

function getPriceIdFromSubscription(subscription: Stripe.Subscription): string | null {
  const item = subscription.items.data[0];
  return item?.price?.id ?? null;
}

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? null;

  if (!webhookSecret || !signature) {
    console.error('[Stripe webhook] Missing STRIPE_WEBHOOK_SECRET or stripe-signature header');
    return NextResponse.json({ error: 'Webhook configuration error' }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Stripe webhook] Signature verification failed:', message);
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = (session.client_reference_id ?? session.metadata?.user_id) as string | null;
        if (!userId) {
          console.warn('[Stripe webhook] checkout.session.completed: no client_reference_id or metadata.user_id');
          break;
        }
        const subscriptionId = session.subscription as string | null;
        if (!subscriptionId) {
          console.warn('[Stripe webhook] checkout.session.completed: no subscription id');
          break;
        }
        const stripe = getStripe();
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = getPriceIdFromSubscription(subscription);
        const tier = tierFromPriceId(priceId);
        await setUserTier(userId, tier);
        console.log('[Stripe webhook] checkout.session.completed: tier set to', tier, 'for user', userId);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.user_id as string | null;
        if (!userId) {
          console.warn('[Stripe webhook] customer.subscription.updated: no metadata.user_id');
          break;
        }
        const priceId = getPriceIdFromSubscription(subscription);
        const tier = tierFromPriceId(priceId);
        await setUserTier(userId, tier);
        console.log('[Stripe webhook] customer.subscription.updated: tier set to', tier, 'for user', userId);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.user_id as string | null;
        if (!userId) {
          console.warn('[Stripe webhook] customer.subscription.deleted: no metadata.user_id');
          break;
        }
        await setUserTier(userId, 'free');
        console.log('[Stripe webhook] customer.subscription.deleted: tier set to free for user', userId);
        break;
      }

      default:
        // Unhandled event type - still return 200 so Stripe doesn't retry
        break;
    }
  } catch (err) {
    console.error('[Stripe webhook] Handler error:', err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
