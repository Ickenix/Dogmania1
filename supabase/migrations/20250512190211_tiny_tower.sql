/*
  # Create dog journal storage bucket
  
  1. New Storage Bucket
    - Creates a new storage bucket 'dog_journal' for storing dog diary images
  2. Security
    - Adds policies for upload, view, and delete permissions
*/

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('dog_journal', 'dog_journal', true);

-- Set up storage policy to allow authenticated users to upload
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'dog_journal');

-- Set up storage policy to allow public access to view images
CREATE POLICY "Public users can view images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'dog_journal');

-- Set up storage policy to allow users to delete their own images
CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'dog_journal' AND owner = auth.uid()::text);