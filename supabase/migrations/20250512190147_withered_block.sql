/*
  # Create storage bucket for dog journal

  1. New Storage Bucket
    - Creates a new public storage bucket named 'dog_journal'
    - Enables public access for reading images
    - Restricts uploads to authenticated users only
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
USING (bucket_id = 'dog_journal' AND (auth.uid())::text = owner);