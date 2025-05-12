/*
  # Create dog_journal storage bucket with policies

  1. New Storage Bucket
    - Creates 'dog_journal' bucket for storing dog journal images
  
  2. Security
    - Adds policy for authenticated users to upload images
    - Adds policy for public users to view images
    - Adds policy for users to delete their own images
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
USING (bucket_id = 'dog_journal' AND (owner)::uuid = auth.uid());