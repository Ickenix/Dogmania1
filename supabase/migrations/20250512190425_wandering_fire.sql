/*
  # Add image_url column to dog_journals table

  1. Changes
    - Add `image_url` column to the `dog_journals` table to store references to uploaded images
    - Add `location` column to the `dog_journals` table to store location information
*/

-- Add image_url column to dog_journals table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'dog_journals' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE dog_journals ADD COLUMN image_url text;
  END IF;
END $$;

-- Add location column to dog_journals table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'dog_journals' AND column_name = 'location'
  ) THEN
    ALTER TABLE dog_journals ADD COLUMN location text;
  END IF;
END $$;