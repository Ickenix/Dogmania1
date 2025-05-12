/*
  # AI Coach System Schema
  
  1. New Table
    - ai_chats: Stores user-AI conversation history
      - id (uuid, primary key)
      - user_id (uuid, references auth.users)
      - dog_id (uuid, references dogs, nullable)
      - role (text, either 'user' or 'assistant')
      - content (text, the message content)
      - created_at (timestamp)
  
  2. Security
    - Enable RLS
    - Add policies for user access control
*/

-- Create ai_chats table
CREATE TABLE IF NOT EXISTS ai_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  dog_id uuid REFERENCES dogs(id) ON DELETE SET NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE ai_chats ENABLE ROW LEVEL SECURITY;

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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_chats_user_id ON ai_chats(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chats_dog_id ON ai_chats(dog_id);
CREATE INDEX IF NOT EXISTS idx_ai_chats_created_at ON ai_chats(created_at);