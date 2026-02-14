/**
 * Production-ready Stripe webhook handler.
 *
 * - Verifies Stripe signature
 * - Idempotent: skips already-processed events via stripe_webhook_events
 * - Handles: checkout.session.completed, customer.subscription.{created,updated,deleted}
 * - Updates user_profiles: tier, stripe_customer_id, stripe_subscription_id, subscription_status
 * - Uses Supabase service role (RLS bypass)
 * - Safe error logging (no secrets)
 */

import Stripe from 'stripe';
import { NextResponse } from 'next/server';
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

type SubscriptionStatus = string | null;

function getStripe(): Stripe {
  const key = getStripeSecretKey();
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
  return new Stripe(key);
}

function getPriceIdFromSubscription(subscription: Stripe.Subscription): string | null {
  const item = subscription.items.data[0];
  return item?.price?.id ?? null;
}

/** Check if event was already processed (idempotency) */
async function isAlreadyProcessed(eventId: string): Promise<boolean> {
  const db = getSupabaseServiceClient();
  if (!db) return false;
  const { data } = await db
    .from('stripe_webhook_events')
    .select('event_id')
    .eq('event_id', eventId)
    .maybeSingle();
  return !!data;
}

/** Mark event as processed */
async function markProcessed(eventId: string): Promise<void> {
  const db = getSupabaseServiceClient();
  if (!db) return;
  await db
    .from('stripe_webhook_events')
    .upsert({ event_id: eventId }, { onConflict: 'event_id' });
}

async function updateUserProfile(
  userId: string,
  updates: {
    tier: Tier;
    stripe_customer_id?: string | null;
    stripe_subscription_id?: string | null;
    subscription_status?: SubscriptionStatus;
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
  if (updates.subscription_status !== undefined) row.subscription_status = updates.subscription_status;

  const { error } = await db.from('user_profiles').upsert(row, { onConflict: 'id' });
  if (error) {
    logDbError('upsert', 'user_profiles', error, { user_id: userId });
    return false;
  }
  return true;
}

/** Resolve user_id from subscription (metadata or lookup by customer_id) */
async function getUserIdFromSubscription(subscription: Stripe.Subscription): Promise<string | null> {
  const userId = subscription.metadata?.user_id as string | null;
  if (userId) return userId;

  const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id;
  if (!customerId) return null;

  const db = getSupabaseServiceClient();
  if (!db) return null;
  const { data } = await db
    .from('user_profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();
  return data?.id ?? null;
}

function applySubscriptionEvent(
  subscription: Stripe.Subscription,
  status: SubscriptionStatus
): { tier: Tier; subscriptionId: string | null; customerId: string | null } {
  const priceId = getPriceIdFromSubscription(subscription);
  const tier = status === 'active' || status === 'trialing' ? tierFromPriceId(priceId) : 'free';
  const subscriptionId = subscription.id;
  const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id ?? null;
  return { tier, subscriptionId, customerId };
}

export async function POST(req: Request) {
  const body = await req.text();
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
    logStripeWebhookError('Signature verification failed', err, { event_id: 'unknown' });
    return NextResponse.json({ error: 'Webhook signature invalid' }, { status: 400 });
  }

  const eventId = event.id;

  if (await isAlreadyProcessed(eventId)) {
    return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = (session.metadata?.user_id ?? session.client_reference_id) as string | null;
        if (!userId) {
          logWarn('checkout.session.completed: no user_id in metadata or client_reference_id', { event_id: eventId });
          await markProcessed(eventId);
          return NextResponse.json({ received: true }, { status: 200 });
        }
        const subscriptionId =
          typeof session.subscription === 'string' ? session.subscription : session.subscription?.id ?? null;
        if (!subscriptionId) {
          logWarn('checkout.session.completed: no subscription id', { event_id: eventId });
          await markProcessed(eventId);
          return NextResponse.json({ received: true }, { status: 200 });
        }
        const stripeClient = getStripe();
        const subscription = await stripeClient.subscriptions.retrieve(subscriptionId);
        const status = subscription.status as SubscriptionStatus;
        const { tier, customerId } = applySubscriptionEvent(subscription, status);
        await updateUserProfile(userId, {
          tier,
          stripe_customer_id: typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null,
          stripe_subscription_id: subscriptionId,
          subscription_status: status,
        });
        await markProcessed(eventId);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = await getUserIdFromSubscription(subscription);
        if (!userId) {
          logWarn(`${event.type}: no user_id (metadata or customer lookup)`, { event_id: eventId, event_type: event.type });
          await markProcessed(eventId);
          return NextResponse.json({ received: true }, { status: 200 });
        }
        const status = subscription.status as SubscriptionStatus;
        const { tier, subscriptionId, customerId } = applySubscriptionEvent(subscription, status);
        await updateUserProfile(userId, {
          tier,
          stripe_customer_id: customerId ?? undefined,
          stripe_subscription_id: subscriptionId,
          subscription_status: status,
        });
        await markProcessed(eventId);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = await getUserIdFromSubscription(subscription);
        if (!userId) {
          logWarn('customer.subscription.deleted: no user_id', { event_id: eventId });
          await markProcessed(eventId);
          return NextResponse.json({ received: true }, { status: 200 });
        }
        await updateUserProfile(userId, {
          tier: 'free',
          stripe_subscription_id: null,
          subscription_status: 'canceled',
        });
        await markProcessed(eventId);
        break;
      }

      default:
        await markProcessed(eventId);
        break;
    }
  } catch (err) {
    logStripeWebhookError('Handler error', err, { event_id: eventId, event_type: event.type });
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
