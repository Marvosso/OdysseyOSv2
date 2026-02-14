-- Add subscription_status for Stripe subscription lifecycle
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS subscription_status text;
