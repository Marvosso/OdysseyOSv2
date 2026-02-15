-- TTS jobs: store async TTS results for webhook + status polling
-- Webhook receives callback from TTSOpenAI, updates by job_uuid
-- Status API reads by job_uuid + user_id for auth
CREATE TABLE IF NOT EXISTS public.tts_jobs (
  job_uuid text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  media_url text,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tts_jobs_user_id ON public.tts_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_tts_jobs_created_at ON public.tts_jobs(created_at);

ALTER TABLE public.tts_jobs ENABLE ROW LEVEL SECURITY;

-- Users can only read their own jobs (for status polling)
CREATE POLICY tts_jobs_select_own ON public.tts_jobs
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- No direct insert/update from client; service role (API + webhook) handles writes
COMMENT ON TABLE public.tts_jobs IS 'Async TTS job results; webhook updates, status API reads';
