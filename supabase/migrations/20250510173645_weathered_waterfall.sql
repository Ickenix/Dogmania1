/*
  # Course Management System Schema

  1. New Tables
    - courses: Main course information
    - chapters: Course content structure
    - user_progress: Track user completion
    - quizzes: Course assessments
    - quiz_results: User quiz performance
    - enrollments: Course enrollment tracking

  2. Security
    - RLS enabled on all tables
    - Policies for user access control
*/

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  instructor text,
  start_date date,
  end_date date,
  max_participants integer,
  image_url text,
  difficulty_level text,
  duration integer, -- in minutes
  price numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  difficulty text NOT NULL DEFAULT 'beginner',
  category text NOT NULL DEFAULT 'general',
  is_premium boolean NOT NULL DEFAULT false,
  CONSTRAINT courses_difficulty_check CHECK (difficulty IN ('beginner', 'intermediate', 'advanced'))
);

-- Create chapters table
CREATE TABLE IF NOT EXISTS chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text,
  video_url text,
  "order" integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT chapters_course_id_order_key UNIQUE (course_id, "order")
);

-- Create user progress table
CREATE TABLE IF NOT EXISTS user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  chapter_id uuid REFERENCES chapters(id) ON DELETE CASCADE NOT NULL,
  completed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT user_progress_user_id_chapter_id_key UNIQUE (user_id, chapter_id)
);

-- Create quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  question text NOT NULL,
  options text[] NOT NULL,
  correct_option integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create quiz results table
CREATE TABLE IF NOT EXISTS quiz_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  quiz_id uuid REFERENCES quizzes(id) ON DELETE CASCADE NOT NULL,
  score integer NOT NULL,
  passed boolean NOT NULL,
  completed_at timestamptz DEFAULT now(),
  CONSTRAINT quiz_results_user_id_quiz_id_key UNIQUE (user_id, quiz_id)
);

-- Create enrollments table to track course enrollment
CREATE TABLE IF NOT EXISTS enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  dog_id uuid REFERENCES dogs(id) ON DELETE SET NULL,
  enrolled_at timestamptz DEFAULT now(),
  status text DEFAULT 'active',
  completed_at timestamptz,
  progress integer DEFAULT 0,
  CONSTRAINT enrollments_user_id_course_id_dog_id_key UNIQUE (user_id, course_id, dog_id)
);

-- Enable RLS
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Jeder kann Kurse sehen" ON courses;
DROP POLICY IF EXISTS "Chapters are viewable by everyone" ON chapters;
DROP POLICY IF EXISTS "Users can insert their own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can view their own progress" ON user_progress;
DROP POLICY IF EXISTS "Quizzes are viewable by everyone" ON quizzes;
DROP POLICY IF EXISTS "Users can insert their own quiz results" ON quiz_results;
DROP POLICY IF EXISTS "Users can view their own quiz results" ON quiz_results;
DROP POLICY IF EXISTS "Benutzer können ihre eigenen Einschreibungen aktualisieren" ON enrollments;
DROP POLICY IF EXISTS "Benutzer können ihre eigenen Einschreibungen löschen" ON enrollments;
DROP POLICY IF EXISTS "Benutzer können ihre eigenen Einschreibungen sehen" ON enrollments;
DROP POLICY IF EXISTS "Benutzer können sich für Kurse einschreiben" ON enrollments;

-- Create new policies
CREATE POLICY "courses_select_policy"
  ON courses FOR SELECT
  TO public
  USING (true);

CREATE POLICY "chapters_select_policy"
  ON chapters FOR SELECT
  TO public
  USING (true);

CREATE POLICY "user_progress_insert_policy"
  ON user_progress FOR INSERT
  TO public
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_progress_select_policy"
  ON user_progress FOR SELECT
  TO public
  USING (auth.uid() = user_id);

CREATE POLICY "quizzes_select_policy"
  ON quizzes FOR SELECT
  TO public
  USING (true);

CREATE POLICY "quiz_results_insert_policy"
  ON quiz_results FOR INSERT
  TO public
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "quiz_results_select_policy"
  ON quiz_results FOR SELECT
  TO public
  USING (auth.uid() = user_id);

CREATE POLICY "enrollments_update_policy"
  ON enrollments FOR UPDATE
  TO public
  USING (auth.uid() = user_id);

CREATE POLICY "enrollments_delete_policy"
  ON enrollments FOR DELETE
  TO public
  USING (auth.uid() = user_id);

CREATE POLICY "enrollments_select_policy"
  ON enrollments FOR SELECT
  TO public
  USING (auth.uid() = user_id);

CREATE POLICY "enrollments_insert_policy"
  ON enrollments FOR INSERT
  TO public
  WITH CHECK (auth.uid() = user_id);