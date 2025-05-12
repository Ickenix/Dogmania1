-- Create ai_chats table if it doesn't exist
CREATE TABLE IF NOT EXISTS ai_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  dog_id uuid REFERENCES dogs(id) ON DELETE SET NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS if not already enabled
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'ai_chats' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE ai_chats ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view their own chat history" ON ai_chats;
  DROP POLICY IF EXISTS "Users can insert into their own chat history" ON ai_chats;
  DROP POLICY IF EXISTS "Users can delete their own chat history" ON ai_chats;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create policies
CREATE POLICY "Users can view their own chat history"
  ON ai_chats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into their own chat history"
  ON ai_chats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat history"
  ON ai_chats FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better performance if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_ai_chats_user_id'
  ) THEN
    CREATE INDEX idx_ai_chats_user_id ON ai_chats(user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_ai_chats_dog_id'
  ) THEN
    CREATE INDEX idx_ai_chats_dog_id ON ai_chats(dog_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_ai_chats_created_at'
  ) THEN
    CREATE INDEX idx_ai_chats_created_at ON ai_chats(created_at);
  END IF;
END $$;