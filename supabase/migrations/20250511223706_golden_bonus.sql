/*
  # Fix Media Uploads Foreign Key Relationships
  
  1. Changes
    - Check if foreign key constraint already exists before adding it
    - Update RLS policies to use the correct foreign key relationship
    
  2. Security
    - Maintain existing RLS policies with correct references
*/

-- Check if constraint exists before adding it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'media_uploads_user_id_fkey' 
    AND conrelid = 'media_uploads'::regclass
  ) THEN
    ALTER TABLE media_uploads
    ADD CONSTRAINT media_uploads_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- Update RLS policies to use the correct foreign key
DROP POLICY IF EXISTS "Users can delete their own media" ON media_uploads;
DROP POLICY IF EXISTS "Users can update their own media" ON media_uploads;
DROP POLICY IF EXISTS "Users can upload their own media" ON media_uploads;
DROP POLICY IF EXISTS "Users can view all media" ON media_uploads;

CREATE POLICY "Users can delete their own media"
ON media_uploads FOR DELETE
TO public
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own media"
ON media_uploads FOR UPDATE
TO public
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can upload their own media"
ON media_uploads FOR INSERT
TO public
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view all media"
ON media_uploads FOR SELECT
TO public
USING (true);