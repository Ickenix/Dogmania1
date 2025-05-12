/*
  # Certificate and Achievement System
  
  1. New Tables
    - course_certificates: Stores user course completion certificates
    - user_achievements: Tracks user achievements and badges
    - trainer_certifications: Manages trainer certification verification
  
  2. Security
    - RLS enabled on all tables
    - Policies for proper access control
    
  3. Features
    - Automatic achievement awarding on course completion
    - Multi-level achievement system (bronze, silver, gold, platinum)
    - Certification verification workflow for trainers
*/

-- Create course_certificates table if it doesn't exist
CREATE TABLE IF NOT EXISTS course_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  dog_id uuid REFERENCES dogs(id) ON DELETE SET NULL,
  download_url text NOT NULL,
  issued_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, course_id, dog_id)
);

-- Create user_achievements table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('course', 'trainer', 'community', 'streak', 'premium')),
  title text NOT NULL,
  description text,
  level text NOT NULL CHECK (level IN ('bronze', 'silver', 'gold', 'platinum')),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, type, title)
);

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
ALTER TABLE course_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_certifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view their own certificates" ON course_certificates;
  DROP POLICY IF EXISTS "Users can create their own certificates" ON course_certificates;
  DROP POLICY IF EXISTS "Users can view their own achievements" ON user_achievements;
  DROP POLICY IF EXISTS "System can create achievements" ON user_achievements;
  DROP POLICY IF EXISTS "Trainers can view their own certifications" ON trainer_certifications;
  DROP POLICY IF EXISTS "Admins can view all trainer certifications" ON trainer_certifications;
  DROP POLICY IF EXISTS "Trainers can create their own certifications" ON trainer_certifications;
  DROP POLICY IF EXISTS "Admins can update certification verification status" ON trainer_certifications;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create policies for course_certificates
CREATE POLICY "Users can view their own certificates"
  ON course_certificates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own certificates"
  ON course_certificates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policies for user_achievements
CREATE POLICY "Users can view their own achievements"
  ON user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create achievements"
  ON user_achievements FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Create policies for trainer_certifications
CREATE POLICY "Trainers can view their own certifications"
  ON trainer_certifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trainers
      WHERE trainers.id = trainer_id
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
      WHERE trainers.id = trainer_id
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
CREATE INDEX IF NOT EXISTS idx_course_certificates_user ON course_certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_course_certificates_course ON course_certificates(course_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_type ON user_achievements(type);
CREATE INDEX IF NOT EXISTS idx_trainer_certifications_trainer ON trainer_certifications(trainer_id);
CREATE INDEX IF NOT EXISTS idx_trainer_certifications_status ON trainer_certifications(verification_status);

-- Drop existing function and trigger if they exist
DROP TRIGGER IF EXISTS award_course_achievement_trigger ON course_certificates;
DROP FUNCTION IF EXISTS award_course_achievement();

-- Create function to award achievement when course is completed
CREATE OR REPLACE FUNCTION award_course_achievement()
RETURNS TRIGGER AS $$
DECLARE
  course_count integer;
  achievement_level text;
  achievement_title text;
  achievement_description text;
  course_category text;
BEGIN
  -- Get the course category
  SELECT category INTO course_category
  FROM courses
  WHERE id = NEW.course_id;
  
  -- Count completed courses in this category
  SELECT COUNT(*) INTO course_count
  FROM course_certificates
  WHERE user_id = NEW.user_id
  AND course_id IN (
    SELECT id FROM courses WHERE category = course_category
  );
  
  -- Determine achievement level based on count
  IF course_count >= 10 THEN
    achievement_level := 'platinum';
  ELSIF course_count >= 5 THEN
    achievement_level := 'gold';
  ELSIF course_count >= 3 THEN
    achievement_level := 'silver';
  ELSE
    achievement_level := 'bronze';
  END IF;
  
  -- Set achievement title and description
  achievement_title := course_category || ' Experte';
  achievement_description := course_count || ' Kurse in der Kategorie ' || course_category || ' abgeschlossen';
  
  -- Insert or update achievement
  INSERT INTO user_achievements (
    user_id,
    type,
    title,
    description,
    level,
    metadata
  ) VALUES (
    NEW.user_id,
    'course',
    achievement_title,
    achievement_description,
    achievement_level,
    jsonb_build_object(
      'category', course_category,
      'count', course_count
    )
  )
  ON CONFLICT (user_id, type, title)
  DO UPDATE SET
    level = EXCLUDED.level,
    description = EXCLUDED.description,
    metadata = EXCLUDED.metadata;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for course completion achievement
CREATE TRIGGER award_course_achievement_trigger
AFTER INSERT ON course_certificates
FOR EACH ROW
EXECUTE FUNCTION award_course_achievement();