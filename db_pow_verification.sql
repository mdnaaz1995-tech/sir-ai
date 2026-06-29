-- =============================================================================
--  SIR AI — M-PoW Verification Layer (Phase: AI Vision Evaluation)
-- =============================================================================
--  Run this ENTIRE script once in the Supabase SQL Editor.
--
--  What it does:
--    1. Adds verified_status (BOOLEAN, nullable) to project_progress.
--    2. Adds verified_feedback (TEXT, nullable) to store AI feedback.
--    3. Adds verified_timestamp (TIMESTAMPTZ, nullable) to record when
--       verification happened.
--
--  Notes:
--    * This script is IDEMPOTENT — each column uses IF NOT EXISTS.
-- =============================================================================

BEGIN;

-- Add verified_status column (true = passed, false = failed, null = pending)
ALTER TABLE public.project_progress
    ADD COLUMN IF NOT EXISTS verified_status BOOLEAN;

-- Add verified_feedback column (AI-generated feedback on the submission)
ALTER TABLE public.project_progress
    ADD COLUMN IF NOT EXISTS verified_feedback TEXT;

-- Add verified_timestamp column (when verification was performed)
ALTER TABLE public.project_progress
    ADD COLUMN IF NOT EXISTS verified_timestamp TIMESTAMPTZ;

COMMIT;

-- =============================================================================
--  ✅ Verify with:
--    SELECT column_name, data_type, is_nullable, column_default
--    FROM information_schema.columns
--    WHERE table_schema = 'public' AND table_name = 'project_progress'
--    ORDER BY ordinal_position;
-- =============================================================================