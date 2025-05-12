/*
  # Add contact messages table
  
  1. New Table
    - contact_messages: Stores contact form submissions
    
  2. Security
    - Enable RLS
    - Add policies for message access
*/

CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Only admins can view messages
CREATE POLICY "Only admins can view messages"
  ON contact_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Anyone can insert messages
CREATE POLICY "Anyone can submit contact messages"
  ON contact_messages FOR INSERT
  TO public
  WITH CHECK (true);