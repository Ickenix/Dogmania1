/*
  # Fix media_uploads foreign key relationship
  
  1. Changes
    - Check if the foreign key constraint already exists before adding it
    - If it exists, do nothing
    - If it doesn't exist, add the constraint
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