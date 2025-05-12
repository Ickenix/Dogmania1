-- Create trainer_certifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS trainer_certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id uuid REFERENCES trainers(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  issuer text NOT NULL,
  verification_status text NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE trainer_certifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Trainers can view their own certifications" ON trainer_certifications;
  DROP POLICY IF EXISTS "Admins can view all trainer certifications" ON trainer_certifications;
  DROP POLICY IF EXISTS "Trainers can create their own certifications" ON trainer_certifications;
  DROP POLICY IF EXISTS "Admins can update certification verification status" ON trainer_certifications;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create policies
CREATE POLICY "Trainers can view their own certifications"
  ON trainer_certifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trainers
      WHERE trainers.id = trainer_certifications.trainer_id
      AND trainers.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all trainer certifications"
  ON trainer_certifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Trainers can create their own certifications"
  ON trainer_certifications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trainers
      WHERE trainers.id = trainer_certifications.trainer_id
      AND trainers.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update certification verification status"
  ON trainer_certifications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_trainer_certifications_trainer ON trainer_certifications(trainer_id);
CREATE INDEX IF NOT EXISTS idx_trainer_certifications_status ON trainer_certifications(verification_status);

-- Create trigger function for certification notifications
CREATE OR REPLACE FUNCTION notify_certification_status()
RETURNS TRIGGER AS $$
DECLARE
  trainer_user_id uuid;
BEGIN
  -- Get the user_id from the trainers table
  SELECT user_id INTO trainer_user_id
  FROM trainers
  WHERE id = NEW.trainer_id;

  IF NEW.verification_status = 'verified' AND 
     (OLD.verification_status IS NULL OR OLD.verification_status != 'verified') THEN
    -- Create notification for verified certification
    INSERT INTO notifications (
      user_id,
      title,
      message,
      type,
      action_url
    ) VALUES (
      trainer_user_id,
      'Zertifizierung bestätigt',
      'Deine Trainer-Zertifizierung wurde bestätigt. Du bist jetzt ein verifizierter Trainer!',
      'certification',
      '/trainer'
    );
  ELSIF NEW.verification_status = 'rejected' AND 
        (OLD.verification_status IS NULL OR OLD.verification_status != 'rejected') THEN
    -- Create notification for rejected certification
    INSERT INTO notifications (
      user_id,
      title,
      message,
      type,
      action_url
    ) VALUES (
      trainer_user_id,
      'Zertifizierung abgelehnt',
      'Deine Trainer-Zertifizierung wurde abgelehnt. Bitte überprüfe die Anmerkungen und versuche es erneut.',
      'certification',
      '/trainer'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_certification_status
  AFTER UPDATE OF verification_status ON trainer_certifications
  FOR EACH ROW
  EXECUTE FUNCTION notify_certification_status();

-- Insert sample data for testing
INSERT INTO trainer_certifications (
  trainer_id,
  title,
  issuer,
  verification_status
)
SELECT 
  t.id,
  'Hundetrainer-Zertifikat',
  'Deutsche Hundetrainer Akademie',
  'pending'
FROM trainers t
WHERE NOT EXISTS (
  SELECT 1 FROM trainer_certifications tc
  WHERE tc.trainer_id = t.id
)
LIMIT 5;