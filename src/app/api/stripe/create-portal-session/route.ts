/**
 * Create Stripe Billing Portal session (manage subscription).
 * Requires Authorization: Bearer <Supabase access_token>.
 * Returns { url } to redirect to Stripe Portal when the customer has a subscription.
 * Returns { needsSubscribe: true } when the customer has no active subscription — the
 * portal cannot be used to choose a plan; the app should send them to Checkout instead.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { getSupabaseServiceClient } from '@/lib/supabase/server';
import { getStripeSecretKey } from '@/lib/stripe/config';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const key = getStripeSecretKey();
    if (!key) {
      const hint =
        process.env.VERCEL === '1'
          ? 'Set STRIPE_SECRET_KEY in Vercel → Project → Settings → Environment Variables.'
          : 'Add STRIPE_SECRET_KEY to .env.local (project root) and restart the dev server.';
      return NextResponse.json(
        { error: `Stripe is not configured. ${hint}` },
        { status: 503 }
      );
    }

    const db = getSupabaseServiceClient();
    if (!db) {
      return NextResponse.json(
        { error: 'Server config missing. Set SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL in .env.local.' },
        { status: 503 }
      );
    }

    const { data: profile } = await db
      .from('user_profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .maybeSingle();

    let customerId = profile?.stripe_customer_id as string | null | undefined;

    const stripe = new Stripe(key);
    const origin = request.headers.get('origin') || request.nextUrl?.origin || '';

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;
      await db
        .from('user_profiles')
        .upsert(
          { id: user.id, stripe_customer_id: customerId },
          { onConflict: 'id' }
        );
    }

    // Portal is for managing existing subscriptions only. No subscription → send to Checkout to pick a plan.
    const { data: subscriptions } = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    });
    if (subscriptions.length === 0) {
      return NextResponse.json({ needsSubscribe: true }, { status: 200 });
    }

    const configId =
      process.env.STRIPE_PORTAL_CONFIGURATION_ID ||
      (await stripe.billingPortal.configurations.list({ is_default: true, limit: 1 }).then((list) => list.data[0]?.id));

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/dashboard`,
      ...(configId && { configuration: configId }),
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error('[create-portal-session]', e);
    return NextResponse.json({ error: 'Failed to create portal session' }, { status: 500 });
  }
}
