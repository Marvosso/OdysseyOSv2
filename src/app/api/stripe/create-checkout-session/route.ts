/**
 * Create Stripe Checkout Session for subscription.
 * POST body: { plan: 'pro' | 'studio' }
 * Requires Authorization: Bearer <Supabase access_token>.
 * Returns { url } to redirect the user to Stripe Checkout.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { getStripeSecretKey } from '@/lib/stripe/config';
import { logError } from '@/lib/logger';
import { getStripePriceIdPro, getStripePriceIdStudio } from '@/lib/stripe/tierFromPrice';
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

    const body = await request.json().catch(() => ({})) as { plan?: string };
    const plan = body?.plan === 'studio' ? 'studio' : 'pro';
    const priceId = plan === 'studio' ? getStripePriceIdStudio() : getStripePriceIdPro();

    const stripe = new Stripe(key);
    const origin = request.headers.get('origin') || request.nextUrl?.origin || '';

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/dashboard?checkout=success`,
      cancel_url: `${origin}/dashboard?checkout=cancelled`,
      client_reference_id: user.id,
      subscription_data: {
        metadata: { user_id: user.id },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    logError('create-checkout-session failed', e);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
