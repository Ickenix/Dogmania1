-- Create conversations table if it doesn't exist
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user2_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user1_id, user2_id)
);

-- Create messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create blocked_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS blocked_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  blocked_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;
  DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
  DROP POLICY IF EXISTS "Users can update their own conversations" ON conversations;
  DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
  DROP POLICY IF EXISTS "Users can send messages in their conversations" ON messages;
  DROP POLICY IF EXISTS "Users can mark messages as read" ON messages;
  DROP POLICY IF EXISTS "Users can view their blocked users" ON blocked_users;
  DROP POLICY IF EXISTS "Users can block other users" ON blocked_users;
  DROP POLICY IF EXISTS "Users can unblock users they blocked" ON blocked_users;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create policies for conversations
CREATE POLICY "Users can view their own conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can update their own conversations"
  ON conversations FOR UPDATE
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Create policies for messages
CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = messages.conversation_id
      AND (auth.uid() = user1_id OR auth.uid() = user2_id)
    )
  );

CREATE POLICY "Users can send messages in their conversations"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = conversation_id
      AND (auth.uid() = user1_id OR auth.uid() = user2_id)
    ) AND
    NOT EXISTS (
      SELECT 1 FROM blocked_users
      WHERE (blocker_id = auth.uid() AND blocked_id IN (
        SELECT CASE WHEN user1_id = auth.uid() THEN user2_id ELSE user1_id END
        FROM conversations
        WHERE id = conversation_id
      )) OR
      (blocked_id = auth.uid() AND blocker_id IN (
        SELECT CASE WHEN user1_id = auth.uid() THEN user2_id ELSE user1_id END
        FROM conversations
        WHERE id = conversation_id
      ))
    )
  );

CREATE POLICY "Users can mark messages as read"
  ON messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = messages.conversation_id
      AND (auth.uid() = user1_id OR auth.uid() = user2_id)
    )
  );

-- Create policies for blocked_users
CREATE POLICY "Users can view their blocked users"
  ON blocked_users FOR SELECT
  USING (auth.uid() = blocker_id OR auth.uid() = blocked_id);

CREATE POLICY "Users can block other users"
  ON blocked_users FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can unblock users they blocked"
  ON blocked_users FOR DELETE
  USING (auth.uid() = blocker_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_users ON conversations(user1_id, user2_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_read_status ON messages(conversation_id, is_read);
CREATE INDEX IF NOT EXISTS idx_blocked_users ON blocked_users(blocker_id, blocked_id);

-- Create trigger function to update conversation timestamp
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Check if trigger exists before creating it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_conversation_timestamp'
  ) THEN
    CREATE TRIGGER update_conversation_timestamp
      AFTER INSERT ON messages
      FOR EACH ROW
      EXECUTE FUNCTION update_conversation_timestamp();
  END IF;
END $$;

-- Create trigger function for new message notifications
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
  recipient_id uuid;
  conversation_record record;
BEGIN
  -- Get the conversation to determine the recipient
  SELECT * INTO conversation_record FROM conversations WHERE id = NEW.conversation_id;
  
  -- Set the recipient as the other user in the conversation
  IF conversation_record.user1_id = NEW.sender_id THEN
    recipient_id := conversation_record.user2_id;
  ELSE
    recipient_id := conversation_record.user1_id;
  END IF;
  
  -- Create a notification for the recipient
  INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    action_url,
    is_read
  ) VALUES (
    recipient_id,
    'Neue Nachricht',
    'Du hast eine neue Nachricht erhalten',
    'message',
    '/messages',
    false
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Check if trigger exists before creating it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_new_message'
  ) THEN
    CREATE TRIGGER trigger_new_message
      AFTER INSERT ON messages
      FOR EACH ROW
      EXECUTE FUNCTION notify_new_message();
  END IF;
END $$;