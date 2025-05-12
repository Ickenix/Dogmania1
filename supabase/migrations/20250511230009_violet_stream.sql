-- Create availability table if it doesn't exist
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

-- Create bookings table if it doesn't exist
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

-- Create ratings table if it doesn't exist
CREATE TABLE IF NOT EXISTS ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  trainer_id uuid REFERENCES trainers(id) ON DELETE CASCADE NOT NULL,
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, booking_id)
);

-- Enable RLS
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Everyone can view trainer availability" ON availability;
DROP POLICY IF EXISTS "Trainers can manage their availability" ON availability;
DROP POLICY IF EXISTS "Users can view their bookings" ON bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update their bookings" ON bookings;
DROP POLICY IF EXISTS "Everyone can view ratings" ON ratings;
DROP POLICY IF EXISTS "Users can rate completed bookings" ON ratings;

-- Create policies for availability
CREATE POLICY "Everyone can view trainer availability"
  ON availability FOR SELECT
  USING (true);

CREATE POLICY "Trainers can manage their availability"
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

-- Create policies for bookings
CREATE POLICY "Users can view their bookings"
  ON bookings FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM trainers
      WHERE id = bookings.trainer_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their bookings"
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

-- Create policies for ratings
CREATE POLICY "Everyone can view ratings"
  ON ratings FOR SELECT
  USING (true);

CREATE POLICY "Users can rate completed bookings"
  ON ratings FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = ratings.booking_id
      AND bookings.status = 'completed'
      AND bookings.user_id = auth.uid()
    )
  );

-- Create trigger function for booking status notifications if it doesn't exist
CREATE OR REPLACE FUNCTION notify_booking_status()
RETURNS TRIGGER AS $$
DECLARE
  notification_function_exists boolean;
BEGIN
  -- Check if create_notification function exists
  SELECT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'create_notification'
  ) INTO notification_function_exists;

  IF notification_function_exists THEN
    IF NEW.status = 'confirmed' THEN
      PERFORM create_notification(
        NEW.user_id,
        'Buchung bestätigt',
        'Deine Buchung wurde bestätigt',
        'booking',
        '/bookings/' || NEW.id
      );
    ELSIF NEW.status = 'cancelled' THEN
      PERFORM create_notification(
        NEW.user_id,
        'Buchung abgelehnt',
        'Deine Buchung wurde leider abgelehnt',
        'booking',
        '/bookings/' || NEW.id
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function for new rating notifications if it doesn't exist
CREATE OR REPLACE FUNCTION notify_new_rating()
RETURNS TRIGGER AS $$
DECLARE
  trainer_user_id uuid;
  notification_function_exists boolean;
BEGIN
  -- Check if create_notification function exists
  SELECT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'create_notification'
  ) INTO notification_function_exists;

  IF notification_function_exists THEN
    SELECT user_id INTO trainer_user_id
    FROM trainers
    WHERE id = NEW.trainer_id;

    PERFORM create_notification(
      trainer_user_id,
      'Neue Bewertung',
      'Du hast eine neue Bewertung erhalten',
      'rating',
      '/trainer/ratings'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_booking_status ON bookings;
DROP TRIGGER IF EXISTS trigger_new_rating ON ratings;

-- Create triggers
CREATE TRIGGER trigger_booking_status
  AFTER UPDATE OF status ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_booking_status();

CREATE TRIGGER trigger_new_rating
  AFTER INSERT ON ratings
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_rating();