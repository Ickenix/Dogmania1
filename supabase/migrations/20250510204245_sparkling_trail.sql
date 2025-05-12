/*
  # Course Certificates Schema
  
  1. New Table
    - course_certificates: Stores user course completion certificates
  
  2. Security
    - Enable RLS
    - Add policies for certificate access
*/

-- Create course_certificates table
CREATE TABLE IF NOT EXISTS course_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  download_url text NOT NULL,
  issued_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- Enable RLS
ALTER TABLE course_certificates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own certificates"
  ON course_certificates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own certificates"
  ON course_certificates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_course_certificates_user ON course_certificates(user_id);
CREATE INDEX idx_course_certificates_course ON course_certificates(course_id);