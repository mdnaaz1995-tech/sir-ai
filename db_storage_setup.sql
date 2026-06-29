-- Create a public storage bucket for Proof of Work uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('pow_uploads', 'pow_uploads', TRUE)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- Enable Row Level Security on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: allow anyone to SELECT (read) objects from the public bucket
CREATE POLICY "public read access"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'pow_uploads');

-- Policy: allow authenticated users to INSERT (upload) objects to the bucket
CREATE POLICY "authenticated upload"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'pow_uploads' AND auth.role() = 'authenticated');

-- Ensure the policies are active
ALTER TABLE storage.objects FORCE ROW LEVEL SECURITY;

