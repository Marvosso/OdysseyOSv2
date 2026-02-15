-- Beta feedback table (Postgres 13+ gen_random_uuid())
CREATE TABLE IF NOT EXISTS public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text,
  rating int CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
  message text NOT NULL,
  page text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public.feedback(created_at);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- No direct client access; API uses service role to insert
COMMENT ON TABLE public.feedback IS 'Beta feedback submissions';
