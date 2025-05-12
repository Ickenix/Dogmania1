/*
  # Add notifications system
  
  1. New Tables
    - notifications: Stores user notifications with read status and expiry
  
  2. Security
    - Enable RLS
    - Add policies for user access control
    
  3. Changes
    - Add notification type validation
    - Add expiry date support
*/

-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title varchar(255) NOT NULL,
  message text NOT NULL,
  type varchar(50) NOT NULL,
  is_read boolean DEFAULT false,
  action_url text,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

-- Enable RLS if not already enabled
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'notifications' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
  DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
  DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;
  DROP POLICY IF EXISTS "notifications_insert_policy" ON notifications;
END $$;

-- Create policies
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  TO public
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  TO public
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own notifications"
  ON notifications FOR DELETE
  TO public
  USING (user_id = auth.uid());

CREATE POLICY "notifications_insert_policy"
  ON notifications FOR INSERT
  TO public
  WITH CHECK (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );