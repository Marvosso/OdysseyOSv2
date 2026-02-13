-- Add stripe_customer_id for Billing Portal (manage subscription)
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id text;
