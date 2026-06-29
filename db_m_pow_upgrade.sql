-- Migration script to upgrade project_progress for Multi-Modal Proof of Work (M-PoW)
-- This script is safe to run on the existing Supabase PostgreSQL database.
-- It makes the existing project_url column nullable, adds a submission_type
-- column with a default of 'url' for backward compatibility, and adds a
-- submission_data JSONB column to store arbitrary payloads (images, audio,
-- text, etc.).

BEGIN;

-- Allow null values for project_url (existing rows may already have nulls)
ALTER TABLE public.project_progress
    ALTER COLUMN project_url DROP NOT NULL;

-- Add submission_type column (default 'url')
ALTER TABLE public.project_progress
    ADD COLUMN submission_type TEXT NOT NULL DEFAULT 'url';

-- Add submission_data column for dynamic payloads
ALTER TABLE public.project_progress
    ADD COLUMN submission_data JSONB;

COMMIT;

