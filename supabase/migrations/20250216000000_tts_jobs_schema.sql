-- Ensure tts_jobs table exists with required columns for async TTS flow
-- job_id (job_uuid), user_id, status, audio_url (media_url), created_at, updated_at
CREATE TABLE IF NOT EXISTS public.tts_jobs (
  job_uuid text PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  media_url text,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tts_jobs_user_id ON public.tts_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_tts_jobs_created_at ON public.tts_jobs(created_at);

ALTER TABLE public.tts_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tts_jobs_select_own ON public.tts_jobs;
CREATE POLICY tts_jobs_select_own ON public.tts_jobs
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

COMMENT ON TABLE public.tts_jobs IS 'Async TTS job results; webhook updates, status API reads';
