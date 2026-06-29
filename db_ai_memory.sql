-- =============================================================================
--  SIR AI — Phase 1: AI Context-Aware Memory Fields for task_chats
-- =============================================================================
--  Run this ENTIRE script once in the Supabase SQL Editor.
--
--  What it does:
--    1. Adds retry_count (INTEGER, default 0) to track how many times the
--       AI has retried a failing task.
--    2. Adds last_error (TEXT, nullable) to store the most recent error
--       message for debugging / context injection.
--    3. Adds is_stuck (BOOLEAN, default false) to flag tasks where the SOS
--       Protocol should kick in.
--
--  Notes:
--    * This script is IDEMPOTENT — each column uses IF NOT EXISTS so it can
--      be re-run safely.
--    * Existing rows get the default values automatically (retry_count = 0,
--      is_stuck = false, last_error = NULL).
-- =============================================================================

BEGIN;

-- Add retry_count column (tracks consecutive AI retry attempts)
ALTER TABLE public.task_chats
    ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0;

-- Add last_error column (stores the most recent error for context injection)
ALTER TABLE public.task_chats
    ADD COLUMN IF NOT EXISTS last_error TEXT;

-- Add is_stuck column (flag to trigger SOS Protocol — anti-stuck logic)
ALTER TABLE public.task_chats
    ADD COLUMN IF NOT EXISTS is_stuck BOOLEAN NOT NULL DEFAULT false;

COMMIT;

-- =============================================================================
--  ✅ DONE.
--
--  Verify the new columns with:
--
--    SELECT column_name, data_type, is_nullable, column_default
--    FROM information_schema.columns
--    WHERE table_schema = 'public'
--      AND table_name   = 'task_chats'
--    ORDER BY ordinal_position;
-- =============================================================================