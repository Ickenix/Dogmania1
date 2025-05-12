-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;
  DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
  DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
  DROP POLICY IF EXISTS "Users can send messages in their conversations" ON messages;
  DROP POLICY IF EXISTS "Users can mark messages as read" ON messages;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user2_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user1_id, user2_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_conversations_users ON conversations(user1_id, user2_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Create policies with unique names
CREATE POLICY "conversations_select_policy"
  ON conversations FOR SELECT
  USING (auth.uid() IN (user1_id, user2_id));

CREATE POLICY "conversations_insert_policy"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() IN (user1_id, user2_id));

CREATE POLICY "messages_select_policy"
  ON messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM conversations
    WHERE id = messages.conversation_id
    AND auth.uid() IN (user1_id, user2_id)
  ));

CREATE POLICY "messages_insert_policy"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = conversation_id
      AND auth.uid() IN (user1_id, user2_id)
    )
  );

CREATE POLICY "messages_update_policy"
  ON messages FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM conversations
    WHERE id = messages.conversation_id
    AND auth.uid() IN (user1_id, user2_id)
  ));

-- Add trigger for updating conversation timestamp
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_timestamp
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();