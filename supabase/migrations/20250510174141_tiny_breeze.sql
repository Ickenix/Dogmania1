/*
  # Create trainer-related tables and policies

  1. New Tables
    - trainers: Stores trainer profiles
    - availability: Manages trainer availability slots
    - bookings: Tracks training session bookings
    - ratings: Stores user ratings for trainers
    - certificates: Manages trainer certificates

  2. Security
    - Enable RLS on all tables
    - Add policies for proper access control
*/

-- Create trainers table if it doesn't exist
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS trainers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    bio text,
    location text,
    specialization text[],
    is_verified boolean DEFAULT false,
    latitude double precision,
    longitude double precision,
    hourly_rate numeric(10,2),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT trainers_user_id_key UNIQUE (user_id)
  );
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

-- Create availability table if it doesn't exist
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS availability (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    trainer_id uuid REFERENCES trainers(id) ON DELETE CASCADE NOT NULL,
    date date NOT NULL,
    start_time time NOT NULL,
    end_time time NOT NULL,
    is_available boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT valid_time_range CHECK (start_time < end_time)
  );
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

-- Create bookings table if it doesn't exist
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS bookings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    trainer_id uuid REFERENCES trainers(id) ON DELETE CASCADE NOT NULL,
    date date NOT NULL,
    start_time time NOT NULL,
    end_time time NOT NULL,
    status text DEFAULT 'pending',
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT bookings_status_check CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed'))
  );
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

-- Create ratings table if it doesn't exist
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS ratings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    trainer_id uuid REFERENCES trainers(id) ON DELETE CASCADE NOT NULL,
    booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
    rating integer NOT NULL,
    comment text,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT ratings_rating_check CHECK (rating >= 1 AND rating <= 5),
    CONSTRAINT ratings_user_id_booking_id_key UNIQUE (user_id, booking_id)
  );
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

-- Create certificates table if it doesn't exist
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS certificates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    trainer_id uuid REFERENCES trainers(id) ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    issuer text NOT NULL,
    issue_date date NOT NULL,
    expiry_date date,
    file_url text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

-- Enable RLS on all tables
DO $$ BEGIN
  ALTER TABLE trainers ENABLE ROW LEVEL SECURITY;
  ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
  ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
  ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
  ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Drop existing policies to avoid conflicts
DO $$ BEGIN
  DROP POLICY IF EXISTS "Everyone can view trainer profiles" ON trainers;
  DROP POLICY IF EXISTS "Trainers can manage their own profile" ON trainers;
  DROP POLICY IF EXISTS "Everyone can view trainer availability" ON availability;
  DROP POLICY IF EXISTS "Trainers can manage their availability" ON availability;
  DROP POLICY IF EXISTS "Users can view their bookings" ON bookings;
  DROP POLICY IF EXISTS "Users can create bookings" ON bookings;
  DROP POLICY IF EXISTS "Users can update their bookings" ON bookings;
  DROP POLICY IF EXISTS "Everyone can view ratings" ON ratings;
  DROP POLICY IF EXISTS "Users can rate completed bookings" ON ratings;
  DROP POLICY IF EXISTS "Everyone can view certificates" ON certificates;
  DROP POLICY IF EXISTS "Trainers can manage their certificates" ON certificates;
END $$;

-- Create new policies
CREATE POLICY "Everyone can view trainer profiles"
  ON trainers FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Trainers can manage their own profile"
  ON trainers FOR ALL
  TO public
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Everyone can view trainer availability"
  ON availability FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Trainers can manage their availability"
  ON availability FOR ALL
  TO public
  USING (EXISTS (
    SELECT 1 FROM trainers
    WHERE trainers.id = availability.trainer_id
    AND trainers.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM trainers
    WHERE trainers.id = availability.trainer_id
    AND trainers.user_id = auth.uid()
  ));

CREATE POLICY "Users can view their bookings"
  ON bookings FOR SELECT
  TO public
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM trainers
    WHERE trainers.id = bookings.trainer_id
    AND trainers.user_id = auth.uid()
  ));

CREATE POLICY "Users can create bookings"
  ON bookings FOR INSERT
  TO public
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their bookings"
  ON bookings FOR UPDATE
  TO public
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM trainers
    WHERE trainers.id = bookings.trainer_id
    AND trainers.user_id = auth.uid()
  ))
  WITH CHECK (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM trainers
    WHERE trainers.id = bookings.trainer_id
    AND trainers.user_id = auth.uid()
  ));

CREATE POLICY "Everyone can view ratings"
  ON ratings FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can rate completed bookings"
  ON ratings FOR INSERT
  TO public
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = ratings.booking_id
      AND bookings.status = 'completed'
      AND bookings.user_id = auth.uid()
    )
  );

CREATE POLICY "Everyone can view certificates"
  ON certificates FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Trainers can manage their certificates"
  ON certificates FOR ALL
  TO public
  USING (EXISTS (
    SELECT 1 FROM trainers
    WHERE trainers.id = certificates.trainer_id
    AND trainers.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM trainers
    WHERE trainers.id = certificates.trainer_id
    AND trainers.user_id = auth.uid()
  ));