/*
  # Trainer Booking System

  1. New Tables
    - availability: Stores trainer availability slots
    - bookings: Stores user bookings with trainers

  2. Security
    - Enable RLS on both tables
    - Add policies for viewing and managing availability
    - Add policies for bookings management

  3. Changes
    - Add triggers for updated_at timestamps
    - Add constraints for valid time ranges
*/

-- Create availability table
CREATE TABLE IF NOT EXISTS availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id uuid REFERENCES trainers(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  start_time time without time zone NOT NULL,
  end_time time without time zone NOT NULL,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  trainer_id uuid REFERENCES trainers(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  start_time time without time zone NOT NULL,
  end_time time without time zone NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Everyone can view trainer availability" ON availability;
  DROP POLICY IF EXISTS "Trainers can manage their availability" ON availability;
  DROP POLICY IF EXISTS "Users can view their bookings" ON bookings;
  DROP POLICY IF EXISTS "Users can create bookings" ON bookings;
  DROP POLICY IF EXISTS "Users can update their bookings" ON bookings;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Drop existing triggers if they exist
DO $$ 
BEGIN
  DROP TRIGGER IF EXISTS set_availability_updated_at ON availability;
  DROP TRIGGER IF EXISTS set_bookings_updated_at ON bookings;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Availability policies
CREATE POLICY "Everyone can view trainer availability"
  ON availability
  FOR SELECT
  USING (true);

CREATE POLICY "Trainers can manage their availability"
  ON availability
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM trainers
      WHERE id = availability.trainer_id
      AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trainers
      WHERE id = availability.trainer_id
      AND user_id = auth.uid()
    )
  );

-- Bookings policies
CREATE POLICY "Users can view their bookings"
  ON bookings
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM trainers
      WHERE id = bookings.trainer_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create bookings"
  ON bookings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their bookings"
  ON bookings
  FOR UPDATE
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM trainers
      WHERE id = bookings.trainer_id
      AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM trainers
      WHERE id = bookings.trainer_id
      AND user_id = auth.uid()
    )
  );

-- Add triggers for updated_at
CREATE TRIGGER set_availability_updated_at
  BEFORE UPDATE ON availability
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();