/*
  # Add location fields to profiles
  
  1. Changes
    - Add latitude and longitude columns to profiles table
    - Add show_on_map boolean column with default false
    - Create index for location-based queries
    - Add RLS policies for profile access
*/

-- Add new columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'latitude') THEN
    ALTER TABLE profiles ADD COLUMN latitude double precision;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'longitude') THEN
    ALTER TABLE profiles ADD COLUMN longitude double precision;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'show_on_map') THEN
    ALTER TABLE profiles ADD COLUMN show_on_map boolean DEFAULT false;
  END IF;
END $$;

-- Create index for location-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles (latitude, longitude) WHERE show_on_map = true;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Create new policies
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO public
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);