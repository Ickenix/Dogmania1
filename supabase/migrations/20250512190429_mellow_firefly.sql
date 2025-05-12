/*
  # Create storage bucket for dog journal images

  1. New Storage
    - Create a storage bucket named 'dogmedia' for storing dog journal images
  
  2. Security
    - Add policies to allow authenticated users to upload images
    - Allow public access to view images
    - Allow users to delete their own images
*/

-- Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
SELECT 'dogmedia', 'dogmedia', true
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'dogmedia'
);

-- Set up storage policy to allow authenticated users to upload
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Authenticated users can upload dog journal images'
  ) THEN
    CREATE POLICY "Authenticated users can upload dog journal images"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'dogmedia');
  END IF;
END $$;

-- Set up storage policy to allow public access to view images
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Public users can view dog journal images'
  ) THEN
    CREATE POLICY "Public users can view dog journal images"
    ON storage.objects FOR SELECT TO public
    USING (bucket_id = 'dogmedia');
  END IF;
END $$;

-- Set up storage policy to allow users to delete their own images
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Users can delete their own dog journal images'
  ) THEN
    CREATE POLICY "Users can delete their own dog journal images"
    ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'dogmedia' AND (owner)::uuid = auth.uid());
  END IF;
END $$;