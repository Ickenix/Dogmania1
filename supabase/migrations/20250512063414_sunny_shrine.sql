/*
  # Fix Media Uploads Foreign Key Relationships
  
  1. Changes
    - Check if foreign key constraint already exists before adding it
    - Ensure proper relationship between media_uploads and profiles
    
  2. Security
    - Maintain existing RLS policies
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

-- Ensure dog_id foreign key exists as well
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'media_uploads_dog_id_fkey' 
    AND conrelid = 'media_uploads'::regclass
  ) THEN
    ALTER TABLE media_uploads
    ADD CONSTRAINT media_uploads_dog_id_fkey
    FOREIGN KEY (dog_id) REFERENCES dogs(id)
    ON DELETE SET NULL;
  END IF;
END $$;