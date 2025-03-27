-- Create the site-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-images', 'site-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the bucket
-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'site-images');

-- Allow authenticated users to select files
CREATE POLICY "Authenticated users can view images"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'site-images');

-- Allow authenticated users to update files
CREATE POLICY "Authenticated users can update images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'site-images')
WITH CHECK (bucket_id = 'site-images');

-- Allow authenticated users to delete files
CREATE POLICY "Authenticated users can delete images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'site-images');