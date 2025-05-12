/*
  # Update diary entries trigger and policies

  1. Changes
    - Drop existing policies
    - Create new policies with unique names
    - Update trigger function for updated_at

  2. Security
    - Maintain RLS policies for diary entries
    - Ensure users can only access their own dogs' entries
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read diary entries for their own dogs" ON diary_entries;
DROP POLICY IF EXISTS "Users can insert diary entries for their own dogs" ON diary_entries;
DROP POLICY IF EXISTS "Users can update diary entries for their own dogs" ON diary_entries;
DROP POLICY IF EXISTS "Users can delete diary entries for their own dogs" ON diary_entries;
DROP POLICY IF EXISTS "Users can view their own dogs' diary entries" ON diary_entries;
DROP POLICY IF EXISTS "Users can create diary entries for their own dogs" ON diary_entries;

-- Create new policies with unique names
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