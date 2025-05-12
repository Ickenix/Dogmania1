/*
  # Dog Diary Module Schema

  1. New Table
    - `diary_entries`: Stores dog diary entries with mood, categories, and media
  
  2. Security
    - Enable RLS on the table
    - Add policies for proper access control
    
  3. Features
    - Support for categories, mood ratings, and photo uploads
    - Location tracking
    - Timestamps for created and updated entries
*/

-- Create diary_entries table if it doesn't exist
CREATE TABLE IF NOT EXISTS diary_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_id uuid REFERENCES dogs(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text,
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  entry_type text NOT NULL,
  mood_rating integer CHECK (mood_rating BETWEEN 1 AND 5),
  image_url text,
  location text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_diary_entries_dog_id ON diary_entries(dog_id);

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "diary_entries_select_policy" ON diary_entries;
DROP POLICY IF EXISTS "diary_entries_insert_policy" ON diary_entries;
DROP POLICY IF EXISTS "diary_entries_update_policy" ON diary_entries;
DROP POLICY IF EXISTS "diary_entries_delete_policy" ON diary_entries;

-- Create policies
CREATE POLICY "diary_entries_select_policy"
  ON diary_entries FOR SELECT
  TO public
  USING (dog_id IN (
    SELECT id FROM dogs
    WHERE owner_id = auth.uid()
  ));

CREATE POLICY "diary_entries_insert_policy"
  ON diary_entries FOR INSERT
  TO public
  WITH CHECK (dog_id IN (
    SELECT id FROM dogs
    WHERE owner_id = auth.uid()
  ));

CREATE POLICY "diary_entries_update_policy"
  ON diary_entries FOR UPDATE
  TO public
  USING (dog_id IN (
    SELECT id FROM dogs
    WHERE owner_id = auth.uid()
  ));

CREATE POLICY "diary_entries_delete_policy"
  ON diary_entries FOR DELETE
  TO public
  USING (dog_id IN (
    SELECT id FROM dogs
    WHERE owner_id = auth.uid()
  ));

-- Create or replace trigger function for updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS set_diary_entries_updated_at ON diary_entries;
CREATE TRIGGER set_diary_entries_updated_at
  BEFORE UPDATE ON diary_entries
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();