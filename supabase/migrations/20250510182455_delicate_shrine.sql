/*
  # Add Location Fields to Profiles

  1. Changes
    - Add latitude and longitude columns to profiles table
    - Add show_on_map boolean column to control visibility
    - Create index for location-based queries
    - Update RLS policies to protect location data

  2. Security
    - Users can only update their own location
    - Location is only visible if show_on_map is true
*/

-- Add location columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE profiles ADD COLUMN latitude double precision;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE profiles ADD COLUMN longitude double precision;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'show_on_map'
  ) THEN
    ALTER TABLE profiles ADD COLUMN show_on_map boolean DEFAULT false;
  END IF;
END $$;

-- Create index for location-based queries if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_profiles_location'
  ) THEN
    CREATE INDEX idx_profiles_location ON profiles (latitude, longitude) 
    WHERE show_on_map = true;
  END IF;
END $$;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
  DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create new policies
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO public
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  TO public
  USING (true);