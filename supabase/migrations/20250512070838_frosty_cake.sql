/*
  # Fix Media Uploads Foreign Key Relationships
  
  1. Changes
    - Drop existing foreign key constraints if they exist
    - Recreate the foreign key relationships with proper references
    - Update the media_comments foreign key relationship
  
  2. Security
    - Maintain existing RLS policies
*/

-- First drop existing constraints if they exist
DO $$ 
BEGIN
  -- Try to drop the constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'media_uploads_user_id_fkey' 
    AND conrelid = 'media_uploads'::regclass
  ) THEN
    ALTER TABLE media_uploads DROP CONSTRAINT media_uploads_user_id_fkey;
  END IF;
  
  -- Also check and drop dog_id constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'media_uploads_dog_id_fkey' 
    AND conrelid = 'media_uploads'::regclass
  ) THEN
    ALTER TABLE media_uploads DROP CONSTRAINT media_uploads_dog_id_fkey;
  END IF;
END $$;

-- Now add the constraints fresh
ALTER TABLE media_uploads
ADD CONSTRAINT media_uploads_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id)
ON DELETE CASCADE;

ALTER TABLE media_uploads
ADD CONSTRAINT media_uploads_dog_id_fkey
FOREIGN KEY (dog_id) REFERENCES dogs(id)
ON DELETE SET NULL;

-- Also fix the media_comments foreign key if needed
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'media_comments_user_id_fkey' 
    AND conrelid = 'media_comments'::regclass
  ) THEN
    ALTER TABLE media_comments DROP CONSTRAINT media_comments_user_id_fkey;
  END IF;
END $$;

ALTER TABLE media_comments
ADD CONSTRAINT media_comments_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id)
ON DELETE CASCADE;