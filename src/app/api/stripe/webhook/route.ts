/**
 * Stripe webhook handler.
 *
 * - Raw body required for signature verification (use req.text()).
 * - Verifies signature with STRIPE_WEBHOOK_SECRET.
 * - checkout.session.completed: set tier, stripe_customer_id, stripe_subscription_id.
 * - customer.subscription.deleted: downgrade user to free, clear stripe_subscription_id.
 */

import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getSupabaseServiceClient } from '@/lib/supabase/server';
import { getStripeSecretKey } from '@/lib/stripe/config';
import {
  tierFromPriceId,
  storyLimitForTier,
  aiUsageLimitForTier,
  type Tier,
} from '@/lib/stripe/tierFromPrice';
import { logError, logDbError, logStripeWebhookError, logWarn } from '@/lib/logger';

export const dynamic = 'force-dynamic';

function getStripe(): Stripe {
  const key = getStripeSecretKey();
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
  return new Stripe(key);
}

function getPriceIdFromSubscription(subscription: Stripe.Subscription): string | null {
  const item = subscription.items.data[0];
  return item?.price?.id ?? null;
}

async function updateUserProfile(
  userId: string,
  updates: {
    tier: Tier;
    stripe_customer_id?: string | null;
    stripe_subscription_id?: string | null;
  }
): Promise<boolean> {
  const db = getSupabaseServiceClient();
  if (!db) {
    logError('Supabase service client not configured', new Error('Service client null'), { user_id: userId });
    return false;
  }
  const row: Record<string, unknown> = {
    id: userId,
    tier: updates.tier,
    story_limit: storyLimitForTier(updates.tier),
    ai_usage_limit: aiUsageLimitForTier(updates.tier),
  };
  if (updates.stripe_customer_id !== undefined) row.stripe_customer_id = updates.stripe_customer_id;
  if (updates.stripe_subscription_id !== undefined) row.stripe_subscription_id = updates.stripe_subscription_id;
  const { error } = await db.from('user_profiles').upsert(row, { onConflict: 'id' });
  if (error) {
    logDbError('upsert', 'user_profiles', error, { user_id: userId });
    return false;
  }
  return true;
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? null;

  if (!webhookSecret || !signature) {
    logStripeWebhookError('Missing STRIPE_WEBHOOK_SECRET or stripe-signature header', new Error('Config missing'));
    return NextResponse.json({ error: 'Webhook configuration error' }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    logStripeWebhookError('Signature verification failed', err);
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = (session.metadata?.user_id ?? session.client_reference_id) as string | null;
        if (!userId) {
          logWarn('checkout.session.completed: no metadata.user_id or client_reference_id');
          return NextResponse.json({ received: true }, { status: 200 });
        }
        const subscriptionId = typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription?.id ?? null;
        if (!subscriptionId) {
          logWarn('checkout.session.completed: no subscription id');
          return NextResponse.json({ received: true }, { status: 200 });
        }
        const stripe = getStripe();
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = getPriceIdFromSubscription(subscription);
        const tier = tierFromPriceId(priceId);
        const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null;
        await updateUserProfile(userId, {
          tier,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
        });
        console.log('[Stripe webhook] checkout.session.completed: tier=%s, user=%s', tier, userId);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.user_id as string | null;
        if (!userId) {
          logWarn('customer.subscription.deleted: no metadata.user_id');
          return NextResponse.json({ received: true }, { status: 200 });
        }
        await updateUserProfile(userId, {
          tier: 'free',
          stripe_subscription_id: null,
        });
        console.log('[Stripe webhook] customer.subscription.deleted: user=%s set to free', userId);
        break;
      }

      default:
        break;
    }
  } catch (err) {
    logStripeWebhookError('Handler error', err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
