/*
  # Add messaging system tables
  
  1. New Tables
    - conversations
      - id (uuid, primary key)
      - user1_id (uuid, references auth.users)
      - user2_id (uuid, references auth.users)
      - created_at (timestamp)
      - updated_at (timestamp)
    
    - messages
      - id (uuid, primary key)
      - conversation_id (uuid, references conversations)
      - sender_id (uuid, references auth.users)
      - content (text)
      - is_read (boolean)
      - created_at (timestamp)
  
  2. Security
    - Enable RLS on both tables
    - Add policies for conversation and message access
*/

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

-- Conversations policies
CREATE POLICY "Users can view their own conversations"
  ON conversations
  FOR SELECT
  USING (auth.uid() IN (user1_id, user2_id));

CREATE POLICY "Users can create conversations"
  ON conversations
  FOR INSERT
  WITH CHECK (auth.uid() IN (user1_id, user2_id));

-- Messages policies
CREATE POLICY "Users can view messages in their conversations"
  ON messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = messages.conversation_id
      AND auth.uid() IN (user1_id, user2_id)
    )
  );

CREATE POLICY "Users can send messages in their conversations"
  ON messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = conversation_id
      AND auth.uid() IN (user1_id, user2_id)
    )
  );

CREATE POLICY "Users can mark messages as read"
  ON messages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = messages.conversation_id
      AND auth.uid() IN (user1_id, user2_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = messages.conversation_id
      AND auth.uid() IN (user1_id, user2_id)
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_conversations_users 
  ON conversations(user1_id, user2_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation 
  ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at 
  ON messages(created_at);

-- Add updated_at trigger for conversations
CREATE TRIGGER set_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();