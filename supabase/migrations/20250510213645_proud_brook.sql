/*
  # Add notification system
  
  1. Changes
    - Create notifications table
    - Add triggers for various events
    - Add policies for notification access
    
  2. Security
    - Enable RLS
    - Add policies for user access control
*/

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
  DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
  DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create notifications table
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

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own notifications"
  ON notifications FOR DELETE
  USING (user_id = auth.uid());

-- Create function to create notifications
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id uuid,
  p_title text,
  p_message text,
  p_type text,
  p_action_url text DEFAULT NULL,
  p_expires_at timestamptz DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  v_notification_id uuid;
BEGIN
  INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    action_url,
    expires_at
  ) VALUES (
    p_user_id,
    p_title,
    p_message,
    p_type,
    p_action_url,
    p_expires_at
  ) RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger function for new messages
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_notification(
    NEW.recipient_id,
    'Neue Nachricht',
    'Sie haben eine neue Nachricht erhalten',
    'message',
    '/messages'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function for booking status changes
CREATE OR REPLACE FUNCTION notify_booking_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'confirmed' THEN
    PERFORM create_notification(
      NEW.user_id,
      'Buchung bestätigt',
      'Ihre Buchung wurde bestätigt',
      'booking',
      '/bookings/' || NEW.id
    );
  ELSIF NEW.status = 'cancelled' THEN
    PERFORM create_notification(
      NEW.user_id,
      'Buchung abgelehnt',
      'Ihre Buchung wurde leider abgelehnt',
      'booking',
      '/bookings/' || NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function for new comments
CREATE OR REPLACE FUNCTION notify_new_comment()
RETURNS TRIGGER AS $$
DECLARE
  v_post_author_id uuid;
BEGIN
  SELECT author_id INTO v_post_author_id
  FROM community_posts
  WHERE id = NEW.post_id;

  IF v_post_author_id != NEW.user_id THEN
    PERFORM create_notification(
      v_post_author_id,
      'Neuer Kommentar',
      'Jemand hat Ihren Beitrag kommentiert',
      'comment',
      '/community/posts/' || NEW.post_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function for new ratings
CREATE OR REPLACE FUNCTION notify_new_rating()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_notification(
    NEW.trainer_id,
    'Neue Bewertung',
    'Sie haben eine neue Bewertung erhalten',
    'rating',
    '/trainer/ratings'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DO $$ 
BEGIN
  DROP TRIGGER IF EXISTS trigger_new_message ON messages;
  DROP TRIGGER IF EXISTS trigger_booking_status ON bookings;
  DROP TRIGGER IF EXISTS trigger_new_comment ON community_comments;
  DROP TRIGGER IF EXISTS trigger_new_rating ON ratings;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create triggers
CREATE TRIGGER trigger_new_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message();

CREATE TRIGGER trigger_booking_status
  AFTER UPDATE OF status ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_booking_status();

CREATE TRIGGER trigger_new_comment
  AFTER INSERT ON community_comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_comment();

CREATE TRIGGER trigger_new_rating
  AFTER INSERT ON ratings
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_rating();