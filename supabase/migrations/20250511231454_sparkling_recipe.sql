/*
  # Fix media_uploads foreign key relationships
  
  1. Changes
    - Add foreign key constraints if they don't exist
    - Check for existing constraints before adding
*/

-- Check if constraints exist before adding them
DO $$ 
BEGIN
  -- Check if media_uploads_user_id_fkey constraint exists
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

  -- Check if media_uploads_dog_id_fkey constraint exists
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