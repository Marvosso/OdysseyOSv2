-- RLS audit and policies for stories, scenes, user_profiles
-- Requirements:
--   Stories: read/insert only where user_id = auth.uid()
--   Scenes: read/insert only where parent story belongs to auth.uid()
--   user_profiles: read/update/insert own row only (id = auth.uid())
--   Deny anonymous (all policies use auth.uid(), so null = no access)
-- Idempotent: drops policies by name if they exist, then creates.

-- ========== STORIES ==========
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own stories" ON public.stories;
DROP POLICY IF EXISTS "stories_select_own" ON public.stories;
DROP POLICY IF EXISTS "stories_insert_own" ON public.stories;
DROP POLICY IF EXISTS "stories_update_own" ON public.stories;
DROP POLICY IF EXISTS "stories_delete_own" ON public.stories;

-- Read only own stories
CREATE POLICY "stories_select_own"
  ON public.stories FOR SELECT
  USING (auth.uid() = user_id);

-- Insert only with own user_id
CREATE POLICY "stories_insert_own"
  ON public.stories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Update/delete only own stories
CREATE POLICY "stories_update_own"
  ON public.stories FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "stories_delete_own"
  ON public.stories FOR DELETE
  USING (auth.uid() = user_id);

-- ========== SCENES ==========
ALTER TABLE public.scenes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own scenes" ON public.scenes;
DROP POLICY IF EXISTS "scenes_select_story_owner" ON public.scenes;
DROP POLICY IF EXISTS "scenes_insert_story_owner" ON public.scenes;
DROP POLICY IF EXISTS "scenes_update_story_owner" ON public.scenes;
DROP POLICY IF EXISTS "scenes_delete_story_owner" ON public.scenes;

-- Read scenes only when parent story belongs to current user
CREATE POLICY "scenes_select_story_owner"
  ON public.scenes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stories s
      WHERE s.id = scenes.story_id AND s.user_id = auth.uid()
    )
  );

-- Insert only when parent story belongs to user and scene.user_id = auth.uid()
CREATE POLICY "scenes_insert_story_owner"
  ON public.scenes FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.stories s
      WHERE s.id = story_id AND s.user_id = auth.uid()
    )
  );

-- Update/delete only when parent story belongs to user
CREATE POLICY "scenes_update_story_owner"
  ON public.scenes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.stories s
      WHERE s.id = scenes.story_id AND s.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stories s
      WHERE s.id = story_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "scenes_delete_story_owner"
  ON public.scenes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.stories s
      WHERE s.id = scenes.story_id AND s.user_id = auth.uid()
    )
  );

-- ========== USER_PROFILES ==========
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_profiles_select_own" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert_own" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_own" ON public.user_profiles;

-- Read only own profile
CREATE POLICY "user_profiles_select_own"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

-- Insert only own row (e.g. first-time profile creation)
CREATE POLICY "user_profiles_insert_own"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Update only own profile
CREATE POLICY "user_profiles_update_own"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- No DELETE policy: users cannot delete their profile row (service role can if needed)
