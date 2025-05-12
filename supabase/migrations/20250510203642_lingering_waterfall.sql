/*
  # Trainer Booking System

  1. New Tables
    - availability: Stores trainer time slots
    - bookings: Manages training session bookings
  
  2. Security
    - RLS enabled on both tables
    - Policies for proper access control
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
  DROP POLICY IF EXISTS "availability_select_policy" ON availability;
  DROP POLICY IF EXISTS "availability_manage_policy" ON availability;
  DROP POLICY IF EXISTS "bookings_select_policy" ON bookings;
  DROP POLICY IF EXISTS "bookings_insert_policy" ON bookings;
  DROP POLICY IF EXISTS "bookings_update_policy" ON bookings;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Availability policies
CREATE POLICY "availability_select_policy"
  ON availability FOR SELECT
  USING (true);

CREATE POLICY "availability_manage_policy"
  ON availability FOR ALL
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
CREATE POLICY "bookings_select_policy"
  ON bookings FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM trainers
      WHERE id = bookings.trainer_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "bookings_insert_policy"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bookings_update_policy"
  ON bookings FOR UPDATE
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