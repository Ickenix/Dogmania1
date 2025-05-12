/*
  # Fix Media Uploads Foreign Key Relationships
  
  1. Changes
    - Conditionally add foreign key constraints if they don't exist
    - Prevent errors when constraints already exist
    
  2. Security
    - Maintain existing relationships for RLS policies
*/

-- Conditionally add foreign key constraints
DO $$ 
BEGIN
  -- Check if media_uploads_user_id_fkey constraint exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'media_uploads_user_id_fkey' 
    AND conrelid = 'media_uploads'::regclass
  ) THEN
    -- Add foreign key from media_uploads.user_id to profiles.id
    ALTER TABLE media_uploads
    ADD CONSTRAINT media_uploads_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(id)
    ON DELETE CASCADE;
  END IF;

  -- Check if media_uploads_dog_id_fkey constraint exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'media_uploads_dog_id_fkey' 
    AND conrelid = 'media_uploads'::regclass
  ) THEN
    -- Add foreign key from media_uploads.dog_id to dogs.id
    ALTER TABLE media_uploads
    ADD CONSTRAINT media_uploads_dog_id_fkey
    FOREIGN KEY (dog_id) REFERENCES dogs(id)
    ON DELETE SET NULL;
  END IF;
END $$;