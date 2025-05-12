/*
  # Training Plan Schema
  
  1. New Table
    - training_plans: Stores weekly training tasks for dogs
  
  2. Security
    - Enable RLS
    - Add policies for proper access control
*/

-- Create training_plans table
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

-- Enable RLS
ALTER TABLE training_plans ENABLE ROW LEVEL SECURITY;

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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_training_plans_user_id ON training_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_training_plans_dog_id ON training_plans(dog_id);
CREATE INDEX IF NOT EXISTS idx_training_plans_day_of_week ON training_plans(day_of_week);

-- Create trigger function for updated_at
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