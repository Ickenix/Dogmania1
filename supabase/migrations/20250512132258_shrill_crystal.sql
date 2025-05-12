/*
  # Add foreign key relationship to media_uploads table

  1. Changes
    - Add foreign key constraint from media_uploads.user_id to profiles.id
    - Ensure CASCADE deletion to maintain referential integrity

  2. Security
    - No changes to RLS policies required
*/

DO $$ BEGIN
  -- Add foreign key constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'media_uploads_user_id_fkey'
  ) THEN
    ALTER TABLE media_uploads
    ADD CONSTRAINT media_uploads_user_id_fkey
    FOREIGN KEY (user_id) 
    REFERENCES profiles(id)
    ON DELETE CASCADE;
  END IF;
END $$;