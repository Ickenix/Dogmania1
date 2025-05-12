-- Create dog_diary table if it doesn't exist
CREATE TABLE IF NOT EXISTS dog_diary (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  dog_id uuid REFERENCES dogs(id) ON DELETE CASCADE,
  entry text,
  date date,
  created_at timestamp without time zone DEFAULT now()
);

-- Enable RLS if not already enabled
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'dog_diary' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE dog_diary ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can read own diary entries" ON dog_diary;
  DROP POLICY IF EXISTS "Users can insert own diary entries" ON dog_diary;
  DROP POLICY IF EXISTS "Users can update own diary entries" ON dog_diary;
  DROP POLICY IF EXISTS "Users can delete own diary entries" ON dog_diary;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create new policies
CREATE POLICY "Users can read own diary entries"
  ON dog_diary FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own diary entries"
  ON dog_diary FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own diary entries"
  ON dog_diary FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own diary entries"
  ON dog_diary FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());