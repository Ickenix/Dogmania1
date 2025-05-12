/*
  # Certification System Schema
  
  1. New Tables
    - certifications: Tracks user certification progress and status
    - certification_types: Defines different certification types and requirements
    - certification_criteria: Defines criteria for each certification type
  
  2. Security
    - RLS enabled on all tables
    - Policies for proper access control
*/

-- Create certification_types table
CREATE TABLE IF NOT EXISTS certification_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  level text NOT NULL CHECK (level IN ('bronze', 'silver', 'gold', 'platinum')),
  icon text,
  required_courses integer DEFAULT 1,
  required_score integer DEFAULT 70,
  created_at timestamptz DEFAULT now()
);

-- Create certifications table
CREATE TABLE IF NOT EXISTS certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  dog_id uuid REFERENCES dogs(id) ON DELETE SET NULL,
  certification_type_id uuid REFERENCES certification_types(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'started' CHECK (status IN ('started', 'eligible', 'certified')),
  completion_pct integer DEFAULT 0,
  certificate_url text,
  issued_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, dog_id, certification_type_id)
);

-- Create certification_criteria table
CREATE TABLE IF NOT EXISTS certification_criteria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  certification_type_id uuid REFERENCES certification_types(id) ON DELETE CASCADE NOT NULL,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  criteria_type text NOT NULL CHECK (criteria_type IN ('course_completion', 'quiz_score', 'training_days')),
  required_value integer NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE certification_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE certification_criteria ENABLE ROW LEVEL SECURITY;

-- Create policies for certification_types
CREATE POLICY "Anyone can view certification types"
  ON certification_types FOR SELECT
  USING (true);

-- Create policies for certifications
CREATE POLICY "Users can view their own certifications"
  ON certifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own certifications"
  ON certifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own certifications"
  ON certifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for certification_criteria
CREATE POLICY "Anyone can view certification criteria"
  ON certification_criteria FOR SELECT
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_certifications_user_id ON certifications(user_id);
CREATE INDEX IF NOT EXISTS idx_certifications_dog_id ON certifications(dog_id);
CREATE INDEX IF NOT EXISTS idx_certifications_type_id ON certifications(certification_type_id);
CREATE INDEX IF NOT EXISTS idx_certification_criteria_type_id ON certification_criteria(certification_type_id);

-- Insert default certification types
INSERT INTO certification_types (name, description, level, required_courses, required_score)
VALUES 
('Grundgehorsam Bronze', 'Grundlegende Gehorsamkeitsübungen für Anfänger', 'bronze', 1, 70),
('Grundgehorsam Silber', 'Fortgeschrittene Gehorsamkeitsübungen', 'silver', 2, 75),
('Grundgehorsam Gold', 'Fortgeschrittene Gehorsamkeitsübungen mit hoher Präzision', 'gold', 3, 80),
('Grundgehorsam Platin', 'Meisterhafte Beherrschung aller Grundgehorsamkeitsübungen', 'platinum', 5, 90),
('Agility Bronze', 'Einführung in Agility-Training', 'bronze', 1, 70),
('Agility Silber', 'Fortgeschrittenes Agility-Training', 'silver', 2, 75),
('Agility Gold', 'Fortgeschrittenes Agility-Training mit Hindernissen', 'gold', 3, 80),
('Agility Platin', 'Meisterhafte Beherrschung aller Agility-Übungen', 'platinum', 5, 90);

-- Create function to check certification eligibility
CREATE OR REPLACE FUNCTION check_certification_eligibility()
RETURNS TRIGGER AS $$
DECLARE
  v_certification_record RECORD;
  v_criteria_record RECORD;
  v_completion_count INTEGER;
  v_total_criteria INTEGER;
  v_completion_pct INTEGER;
  v_is_eligible BOOLEAN := TRUE;
BEGIN
  -- Get certification type details
  SELECT * INTO v_certification_record
  FROM certification_types
  WHERE id = NEW.certification_type_id;
  
  -- Count total criteria
  SELECT COUNT(*) INTO v_total_criteria
  FROM certification_criteria
  WHERE certification_type_id = NEW.certification_type_id;
  
  -- Count completed criteria
  v_completion_count := 0;
  
  FOR v_criteria_record IN 
    SELECT * FROM certification_criteria 
    WHERE certification_type_id = NEW.certification_type_id
  LOOP
    -- Check course completion criteria
    IF v_criteria_record.criteria_type = 'course_completion' THEN
      IF EXISTS (
        SELECT 1 FROM user_progress
        WHERE user_id = NEW.user_id
        AND course_id = v_criteria_record.course_id
        GROUP BY course_id
        HAVING COUNT(*) >= v_criteria_record.required_value
      ) THEN
        v_completion_count := v_completion_count + 1;
      ELSE
        v_is_eligible := FALSE;
      END IF;
    
    -- Check quiz score criteria
    ELSIF v_criteria_record.criteria_type = 'quiz_score' THEN
      IF EXISTS (
        SELECT 1 FROM quiz_results
        WHERE user_id = NEW.user_id
        AND quiz_id IN (
          SELECT id FROM quizzes WHERE course_id = v_criteria_record.course_id
        )
        AND score >= v_criteria_record.required_value
      ) THEN
        v_completion_count := v_completion_count + 1;
      ELSE
        v_is_eligible := FALSE;
      END IF;
    
    -- Check training days criteria
    ELSIF v_criteria_record.criteria_type = 'training_days' THEN
      IF EXISTS (
        SELECT 1 FROM training_plans
        WHERE user_id = NEW.user_id
        AND dog_id = NEW.dog_id
        AND completed = TRUE
        GROUP BY user_id, dog_id
        HAVING COUNT(DISTINCT day_of_week) >= v_criteria_record.required_value
      ) THEN
        v_completion_count := v_completion_count + 1;
      ELSE
        v_is_eligible := FALSE;
      END IF;
    END IF;
  END LOOP;
  
  -- Calculate completion percentage
  IF v_total_criteria > 0 THEN
    v_completion_pct := (v_completion_count * 100) / v_total_criteria;
  ELSE
    v_completion_pct := 0;
  END IF;
  
  -- Update certification status
  NEW.completion_pct := v_completion_pct;
  
  IF v_is_eligible AND v_completion_pct >= 100 THEN
    NEW.status := 'eligible';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for certification eligibility check
CREATE TRIGGER check_certification_eligibility_trigger
  BEFORE INSERT OR UPDATE ON certifications
  FOR EACH ROW
  EXECUTE FUNCTION check_certification_eligibility();

-- Create function to update certification status when course is completed
CREATE OR REPLACE FUNCTION update_certification_on_course_completion()
RETURNS TRIGGER AS $$
DECLARE
  v_certification_record RECORD;
BEGIN
  -- Find all certifications that might be affected by this course completion
  FOR v_certification_record IN 
    SELECT c.* 
    FROM certifications c
    JOIN certification_criteria cc ON c.certification_type_id = cc.certification_type_id
    WHERE c.user_id = NEW.user_id
    AND cc.course_id = NEW.course_id
    AND cc.criteria_type = 'course_completion'
  LOOP
    -- Trigger the eligibility check by updating the certification
    UPDATE certifications
    SET updated_at = NOW()
    WHERE id = v_certification_record.id;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for course completion
CREATE TRIGGER update_certification_on_course_completion_trigger
  AFTER INSERT ON user_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_certification_on_course_completion();

-- Create function to update certification status when quiz is completed
CREATE OR REPLACE FUNCTION update_certification_on_quiz_completion()
RETURNS TRIGGER AS $$
DECLARE
  v_course_id uuid;
  v_certification_record RECORD;
BEGIN
  -- Get the course ID for this quiz
  SELECT course_id INTO v_course_id
  FROM quizzes
  WHERE id = NEW.quiz_id;
  
  -- Find all certifications that might be affected by this quiz completion
  FOR v_certification_record IN 
    SELECT c.* 
    FROM certifications c
    JOIN certification_criteria cc ON c.certification_type_id = cc.certification_type_id
    WHERE c.user_id = NEW.user_id
    AND cc.course_id = v_course_id
    AND cc.criteria_type = 'quiz_score'
  LOOP
    -- Trigger the eligibility check by updating the certification
    UPDATE certifications
    SET updated_at = NOW()
    WHERE id = v_certification_record.id;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for quiz completion
CREATE TRIGGER update_certification_on_quiz_completion_trigger
  AFTER INSERT ON quiz_results
  FOR EACH ROW
  EXECUTE FUNCTION update_certification_on_quiz_completion();