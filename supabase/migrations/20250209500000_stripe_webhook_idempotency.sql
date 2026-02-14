-- Idempotency: prevent duplicate webhook event processing
-- Service role only (RLS enabled, no grants for anon/authenticated)
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  event_id text PRIMARY KEY,
  processed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;
