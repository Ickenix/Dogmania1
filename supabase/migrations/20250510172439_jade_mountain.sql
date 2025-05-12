/*
  # Dog Management Schema

  1. New Tables
    - `dogs` table for storing dog profiles
    - `diary_entries` table for dog diary entries
  
  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their dogs and diary entries
    
  3. Indexes & Triggers
    - Add indexes for performance optimization
    - Add updated_at trigger for diary entries
*/

-- Create dogs table
CREATE TABLE IF NOT EXISTS dogs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  breed text DEFAULT 'Unbekannt',
  birth_date date,
  weight numeric,
  bio text,
  training_level text,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create diary_entries table
CREATE TABLE IF NOT EXISTS diary_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_id uuid NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text,
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  entry_type text,
  mood_rating integer,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE dogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_dogs_owner_id ON dogs(owner_id);
CREATE INDEX IF NOT EXISTS idx_diary_entries_dog_id ON diary_entries(dog_id);

-- Create updated_at trigger function
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

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert their own dogs" ON dogs;
DROP POLICY IF EXISTS "Users can view their own dogs" ON dogs;
DROP POLICY IF EXISTS "Users can update their own dogs" ON dogs;
DROP POLICY IF EXISTS "Users can delete their own dogs" ON dogs;
DROP POLICY IF EXISTS "Users can insert diary entries for their own dogs" ON diary_entries;
DROP POLICY IF EXISTS "Users can read diary entries for their own dogs" ON diary_entries;
DROP POLICY IF EXISTS "Users can update diary entries for their own dogs" ON diary_entries;
DROP POLICY IF EXISTS "Users can delete diary entries for their own dogs" ON diary_entries;

-- Policies for dogs table
CREATE POLICY "Users can insert their own dogs"
  ON dogs
  FOR INSERT
  TO public
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can view their own dogs"
  ON dogs
  FOR SELECT
  TO public
  USING (owner_id = auth.uid());

CREATE POLICY "Users can update their own dogs"
  ON dogs
  FOR UPDATE
  TO public
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can delete their own dogs"
  ON dogs
  FOR DELETE
  TO public
  USING (owner_id = auth.uid());

-- Policies for diary_entries table
CREATE POLICY "Users can insert diary entries for their own dogs"
  ON diary_entries
  FOR INSERT
  TO public
  WITH CHECK (dog_id IN (
    SELECT id FROM dogs WHERE owner_id = auth.uid()
  ));

CREATE POLICY "Users can read diary entries for their own dogs"
  ON diary_entries
  FOR SELECT
  TO public
  USING (dog_id IN (
    SELECT id FROM dogs WHERE owner_id = auth.uid()
  ));

CREATE POLICY "Users can update diary entries for their own dogs"
  ON diary_entries
  FOR UPDATE
  TO public
  USING (EXISTS (
    SELECT 1 FROM dogs 
    WHERE dogs.id = diary_entries.dog_id 
    AND dogs.owner_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM dogs 
    WHERE dogs.id = diary_entries.dog_id 
    AND dogs.owner_id = auth.uid()
  ));

CREATE POLICY "Users can delete diary entries for their own dogs"
  ON diary_entries
  FOR DELETE
  TO public
  USING (EXISTS (
    SELECT 1 FROM dogs 
    WHERE dogs.id = diary_entries.dog_id 
    AND dogs.owner_id = auth.uid()
  ));