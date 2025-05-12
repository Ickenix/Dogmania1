/*
  # Course System Schema

  1. Tables
    - courses: Stores course information
    - chapters: Course content organized in chapters
    - quizzes: Course assessment questions
    - user_progress: Tracks user progress through chapters
    - quiz_results: Stores quiz completion data

  2. Security
    - RLS enabled on all tables
    - Appropriate constraints for data integrity
*/

-- Create courses table if not exists
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  difficulty text DEFAULT 'beginner' NOT NULL,
  category text DEFAULT 'general' NOT NULL,
  is_premium boolean DEFAULT false NOT NULL,
  image_url text,
  duration integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create chapters table if not exists
CREATE TABLE IF NOT EXISTS chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text,
  video_url text,
  "order" integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(course_id, "order")
);

-- Create quizzes table if not exists
CREATE TABLE IF NOT EXISTS quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  question text NOT NULL,
  options text[] NOT NULL,
  correct_option integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create user_progress table if not exists
CREATE TABLE IF NOT EXISTS user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  chapter_id uuid REFERENCES chapters(id) ON DELETE CASCADE NOT NULL,
  completed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, chapter_id)
);

-- Create quiz_results table if not exists
CREATE TABLE IF NOT EXISTS quiz_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  quiz_id uuid REFERENCES quizzes(id) ON DELETE CASCADE NOT NULL,
  score integer NOT NULL,
  passed boolean NOT NULL,
  completed_at timestamptz DEFAULT now(),
  UNIQUE(user_id, quiz_id)
);

-- Enable RLS if not already enabled
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'courses' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'chapters' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'quizzes' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'user_progress' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'quiz_results' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Add constraints if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'quizzes_correct_option_check'
  ) THEN
    ALTER TABLE quizzes
      ADD CONSTRAINT quizzes_correct_option_check
      CHECK (correct_option >= 0 AND array_length(options, 1) > correct_option);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'courses_difficulty_check'
  ) THEN
    ALTER TABLE courses
      ADD CONSTRAINT courses_difficulty_check
      CHECK (difficulty = ANY (ARRAY['beginner'::text, 'intermediate'::text, 'advanced'::text]));
  END IF;
END $$;