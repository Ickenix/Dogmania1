/*
  # Fix Media Uploads Foreign Key Relationships
  
  1. Changes
    - Drop existing foreign key constraints if they exist
    - Add correct foreign key constraint from media_uploads.user_id to auth.users
    - Fix dog_id relationship to use the correct reference
    
  2. Security
    - Update RLS policies to use the correct foreign key relationship
*/

-- Drop existing foreign key constraints if they exist
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'media_uploads_user_id_fkey' 
    AND conrelid = 'media_uploads'::regclass
  ) THEN
    ALTER TABLE media_uploads DROP CONSTRAINT media_uploads_user_id_fkey;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'media_uploads_dog_id_fkey' 
    AND conrelid = 'media_uploads'::regclass
  ) THEN
    ALTER TABLE media_uploads DROP CONSTRAINT media_uploads_dog_id_fkey;
  END IF;
END $$;

-- Add correct foreign key constraints
ALTER TABLE media_uploads
ADD CONSTRAINT media_uploads_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id)
ON DELETE CASCADE;

ALTER TABLE media_uploads
ADD CONSTRAINT media_uploads_dog_id_fkey
FOREIGN KEY (dog_id) REFERENCES dogs(id)
ON DELETE SET NULL;

-- Update RLS policies to use the correct foreign key relationship
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