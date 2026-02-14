# RLS Audit: stories, scenes, user_profiles

## Requirements (audit criteria)

| Requirement | Target |
|-------------|--------|
| Stories read | Only where `user_id = auth.uid()` |
| Stories insert | Only where `user_id = auth.uid()` |
| Scenes read | Only where parent story belongs to `auth.uid()` |
| Scenes insert | Only where parent story belongs to `auth.uid()` |
| Cross-user access | Prevented |
| Anonymous access | Denied (no access when `auth.uid()` is null) |

---

## Audit results

### 1. Migrations in repo (before this audit)

- **user_profiles:** Table and columns defined in `20250209000000_user_profiles_tier_and_limits.sql` (and later migrations). **No RLS** was defined in any migration.
- **stories / scenes:** No table or RLS migrations in repo. Setup is documented in `src/lib/cloud/README.md` with example SQL that includes:
  - `stories`: RLS enabled, one policy `"Users can manage own stories"` with `FOR ALL USING (auth.uid() = user_id)`.
  - `scenes`: RLS enabled, one policy `"Users can manage own scenes"` with `FOR ALL USING (auth.uid() = user_id)`.
  - **Gap:** Scenes policy does **not** enforce parent-story ownership. A user could insert/read a scene with `user_id = auth.uid()` but `story_id` pointing to another user’s story (if they knew the id), or rely on app logic only. To fully prevent cross-user access, scenes must be restricted by “parent story belongs to auth.uid()”.

### 2. user_profiles

- **Before:** No RLS in migrations; if RLS was never enabled, all rows were visible to any authenticated client (and possibly anon, depending on Supabase defaults).
- **Required:** Enable RLS; allow SELECT/INSERT/UPDATE only for the row where `id = auth.uid()`; no DELETE for users (service role can still do whatever).

### 3. Anonymous access

- When RLS is enabled and policies use only `auth.uid() = ...`, unauthenticated requests (`auth.uid()` is null) get no rows and cannot insert/update/delete. So “deny all anonymous access” is satisfied by the new policies.

---

## Applied fix: migration `20250209300000_rls_stories_scenes_profiles.sql`

- **Stories:** RLS enabled. Separate policies for SELECT, INSERT, UPDATE, DELETE; all require `user_id = auth.uid()`. INSERT uses `WITH CHECK (auth.uid() = user_id)`.
- **Scenes:** RLS enabled. All operations require that the parent row in `stories` has `user_id = auth.uid()` (via `EXISTS (SELECT 1 FROM stories s WHERE s.id = scenes.story_id AND s.user_id = auth.uid())`). INSERT also requires `user_id = auth.uid()` on the new scene row.
- **user_profiles:** RLS enabled. SELECT, INSERT, UPDATE only for `id = auth.uid()`. No DELETE policy (service role can still delete if needed).
- Existing policies with names used in the README (e.g. `"Users can manage own stories"`) are dropped so the new, stricter policies are the only ones in effect.

---

## How to apply

Run the migration against your Supabase project (e.g. Supabase Dashboard SQL Editor, or `supabase db push` / your usual migration path):

```bash
# If using Supabase CLI
supabase db push
```

Or paste the contents of `20250209300000_rls_stories_scenes_profiles.sql` into the SQL Editor and run it.

---

## Service role

The Supabase **service role** key bypasses RLS. All server-side usage (e.g. Stripe webhooks, TTS tier check, create-portal-session, export) that uses `getSupabaseServiceClient()` is unaffected by these policies.
