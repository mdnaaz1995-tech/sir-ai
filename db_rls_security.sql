-- =============================================================================
--  SIR AI — Row Level Security (RLS) Hardening Script
-- =============================================================================
--  Run this ENTIRE script once in the Supabase SQL Editor.
--
--  What it does:
--    1. Enables Row Level Security on every user-specific table.
--    2. Restricts SELECT / INSERT / UPDATE / DELETE so a logged-in user can
--       only ever touch their OWN rows (user_id = auth.uid()).
--    3. The "Wall of Fame" / Showcase table (project_progress) is made PUBLIC
--       for reading, but writes remain locked to the authenticated owner.
--
--  Notes:
--    * This script is IDEMPOTENT — it can be re-run safely. Existing policies
--      with the same names are dropped first via DROP POLICY IF EXISTS.
--    * Storage RLS (the pow_uploads bucket) is handled separately in
--      db_storage_setup.sql and is intentionally NOT touched here.
--    * task_chats has no direct user_id column; ownership is derived through
--      its parent roadmaps.user_id via a subquery — the secure, correct pattern.
-- =============================================================================

BEGIN;

-- =============================================================================
--  1. ROADMAPS  (PRIVATE — owner-only)
--     Columns: id, user_id, topic, level, goal, roadmap_content,
--              current_task_index, created_at
-- =============================================================================

ALTER TABLE public.roadmaps ENABLE ROW LEVEL SECURITY;
-- FORCE ensures the table owner is also subject to RLS (defense in depth).
ALTER TABLE public.roadmaps FORCE ROW LEVEL SECURITY;

-- Clean slate (re-runnable)
DROP POLICY IF EXISTS "roadmaps_select_own" ON public.roadmaps;
DROP POLICY IF EXISTS "roadmaps_insert_own" ON public.roadmaps;
DROP POLICY IF EXISTS "roadmaps_update_own" ON public.roadmaps;
DROP POLICY IF EXISTS "roadmaps_delete_own" ON public.roadmaps;

-- SELECT: a user can only read their own roadmaps
CREATE POLICY "roadmaps_select_own"
  ON public.roadmaps
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- INSERT: a user can only create rows owned by themselves
CREATE POLICY "roadmaps_insert_own"
  ON public.roadmaps
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: a user can only modify their own rows, and cannot re-assign ownership
CREATE POLICY "roadmaps_update_own"
  ON public.roadmaps
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: a user can only delete their own rows
CREATE POLICY "roadmaps_delete_own"
  ON public.roadmaps
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


-- =============================================================================
--  2. TASK_CHATS  (PRIVATE — ownership derived from parent roadmap)
--     Columns: roadmap_id, task_index, messages
--     There is no user_id column here, so we enforce ownership by checking
--     that the referenced roadmap belongs to the current user.
-- =============================================================================

ALTER TABLE public.task_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_chats FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "task_chats_select_own" ON public.task_chats;
DROP POLICY IF EXISTS "task_chats_insert_own" ON public.task_chats;
DROP POLICY IF EXISTS "task_chats_update_own" ON public.task_chats;
DROP POLICY IF EXISTS "task_chats_delete_own" ON public.task_chats;

-- SELECT: only chats tied to a roadmap the user owns
CREATE POLICY "task_chats_select_own"
  ON public.task_chats
  FOR SELECT
  TO authenticated
  USING (
    roadmap_id IN (
      SELECT id FROM public.roadmaps WHERE user_id = auth.uid()
    )
  );

-- INSERT: can only attach a chat to a roadmap the user owns
CREATE POLICY "task_chats_insert_own"
  ON public.task_chats
  FOR INSERT
  TO authenticated
  WITH CHECK (
    roadmap_id IN (
      SELECT id FROM public.roadmaps WHERE user_id = auth.uid()
    )
  );

-- UPDATE: can only modify chats on a roadmap the user owns
CREATE POLICY "task_chats_update_own"
  ON public.task_chats
  FOR UPDATE
  TO authenticated
  USING (
    roadmap_id IN (
      SELECT id FROM public.roadmaps WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    roadmap_id IN (
      SELECT id FROM public.roadmaps WHERE user_id = auth.uid()
    )
  );

-- DELETE: can only delete chats on a roadmap the user owns
CREATE POLICY "task_chats_delete_own"
  ON public.task_chats
  FOR DELETE
  TO authenticated
  USING (
    roadmap_id IN (
      SELECT id FROM public.roadmaps WHERE user_id = auth.uid()
    )
  );


-- =============================================================================
--  3. PROJECT_PROGRESS  (PUBLIC SHOWCASE — "Wall of Fame")
--     Columns: id, user_id, user_name, roadmap_id, task_index, task_text,
--              proof_url, submission_type, submission_data, completed_at
--
--     The /showcase page reads this table WITHOUT authentication, so reads
--     are PUBLIC. Writes (insert/update/delete) are locked to the owner.
-- =============================================================================

ALTER TABLE public.project_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_progress FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "project_progress_public_select" ON public.project_progress;
DROP POLICY IF EXISTS "project_progress_insert_own"   ON public.project_progress;
DROP POLICY IF EXISTS "project_progress_update_own"   ON public.project_progress;
DROP POLICY IF EXISTS "project_progress_delete_own"   ON public.project_progress;

-- SELECT: PUBLIC read access (anonymous + authenticated) for the Wall of Fame
CREATE POLICY "project_progress_public_select"
  ON public.project_progress
  FOR SELECT
  TO public
  USING (true);

-- INSERT: only the authenticated owner may submit a project
CREATE POLICY "project_progress_insert_own"
  ON public.project_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: only the authenticated owner may edit their submission
CREATE POLICY "project_progress_update_own"
  ON public.project_progress
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: only the authenticated owner may remove their submission
CREATE POLICY "project_progress_delete_own"
  ON public.project_progress
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


COMMIT;

-- =============================================================================
--  ✅ DONE.
--
--  Verify the policies anytime with:
--
--    SELECT schemaname, tablename, policyname, cmd, roles
--    FROM pg_policies
--    WHERE schemaname = 'public'
--    ORDER BY tablename, cmd;
--
--  And confirm RLS is enabled with:
--
--    SELECT relname, relrowsecurity, relforcerowsecurity
--    FROM pg_class
--    WHERE relname IN ('roadmaps', 'task_chats', 'project_progress');
-- =============================================================================
