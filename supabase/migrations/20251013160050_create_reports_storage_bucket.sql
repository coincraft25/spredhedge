/*
  # Create Reports Storage Bucket

  ## Overview
  Creates a Supabase Storage bucket for storing PDF reports with proper access controls.

  ## Changes
  1. Storage Bucket
    - Create 'reports' bucket for PDF file storage
    - Public access disabled (authenticated users only)
    - File size limit: 10MB
    - Allowed MIME types: application/pdf

  2. Security Policies
    - Authenticated users can read/download reports
    - Only admins can upload new reports
    - Only admins can delete reports
    - Partners/investors have read-only access

  ## Notes
  - Files will be stored with unique names to prevent conflicts
  - Old reports are preserved when new ones are uploaded
  - Bucket policies enforce authentication for all operations
*/

-- Create the reports storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'reports',
  'reports',
  false,
  10485760,
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow authenticated users to read/download reports
CREATE POLICY "Authenticated users can read reports"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'reports');

-- Policy: Allow admins to upload reports
CREATE POLICY "Admins can upload reports"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'reports' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Policy: Allow admins to delete reports
CREATE POLICY "Admins can delete reports"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'reports' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);