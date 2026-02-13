-- Add stripe_subscription_id for webhook and subscription management
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text;
