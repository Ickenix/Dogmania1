/*
  # Fix media_uploads foreign key relationships
  
  1. Changes
    - Drop existing foreign key constraints if they exist
    - Add correct foreign key constraint from media_uploads.user_id to auth.users.id
    - Add correct foreign key constraint from media_uploads.dog_id to dogs.id
*/

-- Drop existing foreign key constraints if they exist
ALTER TABLE media_uploads 
DROP CONSTRAINT IF EXISTS media_uploads_user_id_fkey,
DROP CONSTRAINT IF EXISTS media_uploads_dog_id_fkey;

-- Add correct foreign key constraints
ALTER TABLE media_uploads
ADD CONSTRAINT media_uploads_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE media_uploads
ADD CONSTRAINT media_uploads_dog_id_fkey
FOREIGN KEY (dog_id) REFERENCES dogs(id) ON DELETE SET NULL;