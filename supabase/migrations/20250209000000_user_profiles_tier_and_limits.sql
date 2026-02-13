-- user_profiles: add tier, story_limit, ai_usage_limit, created_at
-- Run in Supabase SQL Editor. Idempotent: safe to run multiple times.

-- Ensure table exists (minimal: just id)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Add columns if missing
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS tier text DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS story_limit integer DEFAULT 3,
  ADD COLUMN IF NOT EXISTS ai_usage_limit integer DEFAULT 5,
  ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT now();

-- Restrict tier to allowed values
ALTER TABLE public.user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_tier_check;
ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_tier_check
  CHECK (tier IN ('free', 'pro', 'studio'));
