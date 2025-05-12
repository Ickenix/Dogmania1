/*
  # Fix media_uploads foreign key relationships
  
  1. Changes
    - Add foreign key constraint from media_uploads.user_id to profiles.id
    - Add foreign key constraint from media_uploads.dog_id to dogs.id if not exists
*/

-- Add foreign key constraint from media_uploads.user_id to profiles.id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'media_uploads_user_id_fkey'
  ) THEN
    ALTER TABLE media_uploads
    ADD CONSTRAINT media_uploads_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add foreign key constraint from media_uploads.dog_id to dogs.id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'media_uploads_dog_id_fkey'
  ) THEN
    ALTER TABLE media_uploads
    ADD CONSTRAINT media_uploads_dog_id_fkey
    FOREIGN KEY (dog_id) REFERENCES dogs(id) ON DELETE SET NULL;
  END IF;
END $$;