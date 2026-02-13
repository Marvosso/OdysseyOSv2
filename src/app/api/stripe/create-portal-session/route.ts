/**
 * Create Stripe Billing Portal session (manage subscription).
 * Requires Authorization: Bearer <Supabase access_token>.
 * Returns { url } to redirect to Stripe Portal, or { needsSubscribe: true } if no customer yet.
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
      return NextResponse.json({ error: 'Stripe is not configured' }, { status: 503 });
    }

    const db = getSupabaseServiceClient();
    if (!db) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 503 });
    }

    const { data: profile } = await db
      .from('user_profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .maybeSingle();

    const customerId = profile?.stripe_customer_id as string | null | undefined;
    if (!customerId) {
      return NextResponse.json({ needsSubscribe: true }, { status: 200 });
    }

    const stripe = new Stripe(key);
    const origin = request.headers.get('origin') || request.nextUrl?.origin || '';

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/dashboard`,
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error('[create-portal-session]', e);
    return NextResponse.json({ error: 'Failed to create portal session' }, { status: 500 });
  }
}
