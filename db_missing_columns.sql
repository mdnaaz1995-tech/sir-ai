-- Migration: Add missing columns to project_progress
-- The following columns exist in TypeScript types but were never added to the DB:
--   - task_index (INTEGER, required for upsert conflict target)
--   - user_name   (TEXT, used for Wall of Fame display)
--   - proof_url   (TEXT, legacy alias — already has project_url)
--   - verified_status, verified_feedback, verified_timestamp (from db_pow_verification.sql)
--   - completed_at (TIMESTAMPTZ, when submission was made)
--
-- Also adds the composite unique constraint needed for the upsert.

BEGIN;

-- Add task_index column (required for upsert onConflict: "roadmap_id, task_index")
ALTER TABLE public.project_progress
    ADD COLUMN IF NOT EXISTS task_index INTEGER;

-- Add user_name column (used in Showcase/Wall of Fame)
ALTER TABLE public.project_progress
    ADD COLUMN IF NOT EXISTS user_name TEXT;

-- Add completed_at column (when the submission was made)
ALTER TABLE public.project_progress
    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Add proof_url as an alias for project_url (backward compatibility)
ALTER TABLE public.project_progress
    ADD COLUMN IF NOT EXISTS proof_url TEXT;

-- Add the composite unique constraint needed for upsert (if not exists)
-- We use DO block because PostgreSQL doesn't support IF NOT EXISTS for constraints easily
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'project_progress_roadmap_id_task_index_key'
        AND conrelid = 'public.project_progress'::regclass
    ) THEN
        ALTER TABLE public.project_progress
            ADD CONSTRAINT project_progress_roadmap_id_task_index_key
            UNIQUE (roadmap_id, task_index);
    END IF;
END $$;

COMMIT;