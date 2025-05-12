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
    'Du hast eine neue Nachricht erhalten',
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
      'Deine Buchung wurde bestätigt',
      'booking',
      '/bookings/' || NEW.id
    );
  ELSIF NEW.status = 'cancelled' THEN
    PERFORM create_notification(
      NEW.user_id,
      'Buchung abgelehnt',
      'Deine Buchung wurde leider abgelehnt',
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
      'Jemand hat deinen Beitrag kommentiert',
      'comment',
      '/community'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function for new ratings
CREATE OR REPLACE FUNCTION notify_new_rating()
RETURNS TRIGGER AS $$
DECLARE
  v_trainer_user_id uuid;
BEGIN
  SELECT user_id INTO v_trainer_user_id
  FROM trainers
  WHERE id = NEW.trainer_id;

  PERFORM create_notification(
    v_trainer_user_id,
    'Neue Bewertung',
    'Du hast eine neue Bewertung erhalten',
    'rating',
    '/trainer'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Conditionally create triggers
DO $$ 
BEGIN
  -- Check if trigger_new_message trigger exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_new_message'
  ) THEN
    CREATE TRIGGER trigger_new_message
      AFTER INSERT ON messages
      FOR EACH ROW
      EXECUTE FUNCTION notify_new_message();
  END IF;

  -- Check if trigger_booking_status trigger exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_booking_status'
  ) THEN
    CREATE TRIGGER trigger_booking_status
      AFTER UPDATE OF status ON bookings
      FOR EACH ROW
      EXECUTE FUNCTION notify_booking_status();
  END IF;

  -- Check if trigger_new_comment trigger exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_new_comment'
  ) THEN
    CREATE TRIGGER trigger_new_comment
      AFTER INSERT ON community_comments
      FOR EACH ROW
      EXECUTE FUNCTION notify_new_comment();
  END IF;

  -- Check if trigger_new_rating trigger exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_new_rating'
  ) THEN
    CREATE TRIGGER trigger_new_rating
      AFTER INSERT ON ratings
      FOR EACH ROW
      EXECUTE FUNCTION notify_new_rating();
  END IF;
END $$;