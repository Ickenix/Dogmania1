-- Create training_plans table if it doesn't exist
CREATE TABLE IF NOT EXISTS training_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  dog_id uuid REFERENCES dogs(id) ON DELETE CASCADE NOT NULL,
  day_of_week text NOT NULL CHECK (day_of_week IN ('Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So')),
  task_title text NOT NULL,
  category text NOT NULL,
  description text,
  time text NOT NULL,
  duration integer NOT NULL,
  completed boolean DEFAULT false,
  "order" integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS if not already enabled
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'training_plans' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE training_plans ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view their own training plans" ON training_plans;
  DROP POLICY IF EXISTS "Users can create their own training plans" ON training_plans;
  DROP POLICY IF EXISTS "Users can update their own training plans" ON training_plans;
  DROP POLICY IF EXISTS "Users can delete their own training plans" ON training_plans;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create policies
CREATE POLICY "Users can view their own training plans"
  ON training_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own training plans"
  ON training_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own training plans"
  ON training_plans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own training plans"
  ON training_plans FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better performance if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_training_plans_user_id'
  ) THEN
    CREATE INDEX idx_training_plans_user_id ON training_plans(user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_training_plans_dog_id'
  ) THEN
    CREATE INDEX idx_training_plans_dog_id ON training_plans(dog_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_training_plans_day_of_week'
  ) THEN
    CREATE INDEX idx_training_plans_day_of_week ON training_plans(day_of_week);
  END IF;
END $$;

-- Drop existing trigger if it exists
DO $$ 
BEGIN
  DROP TRIGGER IF EXISTS set_training_plans_updated_at ON training_plans;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create or replace trigger function for updated_at
CREATE OR REPLACE FUNCTION update_training_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER set_training_plans_updated_at
  BEFORE UPDATE ON training_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_training_plans_updated_at();