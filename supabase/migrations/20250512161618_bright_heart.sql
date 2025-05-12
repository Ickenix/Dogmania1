-- Create dog_personality_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS dog_personality_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_id uuid NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
  traits jsonb NOT NULL DEFAULT '{}'::jsonb,
  summary text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_dog_personality_profiles_dog_id ON dog_personality_profiles(dog_id);

-- Enable Row Level Security
ALTER TABLE dog_personality_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for dog_personality_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'dog_personality_profiles' AND policyname = 'dog_personality_profiles_select_policy'
  ) THEN
    CREATE POLICY dog_personality_profiles_select_policy ON dog_personality_profiles
      FOR SELECT TO public
      USING (dog_id IN (SELECT id FROM dogs WHERE owner_id = auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'dog_personality_profiles' AND policyname = 'dog_personality_profiles_insert_policy'
  ) THEN
    CREATE POLICY dog_personality_profiles_insert_policy ON dog_personality_profiles
      FOR INSERT TO public
      WITH CHECK (dog_id IN (SELECT id FROM dogs WHERE owner_id = auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'dog_personality_profiles' AND policyname = 'dog_personality_profiles_update_policy'
  ) THEN
    CREATE POLICY dog_personality_profiles_update_policy ON dog_personality_profiles
      FOR UPDATE TO public
      USING (dog_id IN (SELECT id FROM dogs WHERE owner_id = auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'dog_personality_profiles' AND policyname = 'dog_personality_profiles_delete_policy'
  ) THEN
    CREATE POLICY dog_personality_profiles_delete_policy ON dog_personality_profiles
      FOR DELETE TO public
      USING (dog_id IN (SELECT id FROM dogs WHERE owner_id = auth.uid()));
  END IF;
END $$;