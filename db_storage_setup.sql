-- Create a public storage bucket for Proof of Work uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('pow_images', 'pow_images', TRUE)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- Enable Row Level Security on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: allow anyone to SELECT (read) objects from the public bucket
CREATE POLICY "public read access pow_images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'pow_images');

-- Policy: allow authenticated users to INSERT (upload) objects to the bucket
CREATE POLICY "authenticated upload pow_images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'pow_images' AND auth.role() = 'authenticated');

-- Policy: allow users to update their own uploads
CREATE POLICY "user update own files pow_images"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'pow_images' AND auth.uid() = owner)
  WITH CHECK (bucket_id = 'pow_images' AND auth.uid() = owner);

-- Policy: allow users to delete their own uploads
CREATE POLICY "user delete own files pow_images"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'pow_images' AND auth.uid() = owner);

-- Ensure the policies are active
ALTER TABLE storage.objects FORCE ROW LEVEL SECURITY;

