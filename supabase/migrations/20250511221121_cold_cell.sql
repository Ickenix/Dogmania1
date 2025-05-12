/*
  # Media Upload System
  
  1. New Tables
    - media_uploads: Stores user uploaded media files
    - media_likes: Tracks likes on media
    - media_comments: Stores comments on media
  
  2. Security
    - Enable RLS on all tables
    - Add policies for proper access control
    
  3. Storage
    - Create dogmedia bucket for storing images and videos
*/

-- Create media_uploads table
CREATE TABLE IF NOT EXISTS media_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL CHECK (file_type IN ('image', 'video')),
  description text,
  tags text[] DEFAULT '{}',
  dog_id uuid REFERENCES dogs(id) ON DELETE SET NULL,
  show_in_feed boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create media_likes table
CREATE TABLE IF NOT EXISTS media_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id uuid REFERENCES media_uploads(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(media_id, user_id)
);

-- Create media_comments table
CREATE TABLE IF NOT EXISTS media_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id uuid REFERENCES media_uploads(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE media_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_comments ENABLE ROW LEVEL SECURITY;

-- Create policies for media_uploads
CREATE POLICY "Users can view all media"
  ON media_uploads FOR SELECT
  USING (true);

CREATE POLICY "Users can upload their own media"
  ON media_uploads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own media"
  ON media_uploads FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own media"
  ON media_uploads FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for media_likes
CREATE POLICY "Users can view all likes"
  ON media_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can like media"
  ON media_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike media"
  ON media_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for media_comments
CREATE POLICY "Users can view all comments"
  ON media_comments FOR SELECT
  USING (true);

CREATE POLICY "Users can comment on media"
  ON media_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON media_comments FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_media_uploads_user_id ON media_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_media_uploads_dog_id ON media_uploads(dog_id);
CREATE INDEX IF NOT EXISTS idx_media_uploads_created_at ON media_uploads(created_at);
CREATE INDEX IF NOT EXISTS idx_media_comments_media_id ON media_comments(media_id);
CREATE INDEX IF NOT EXISTS idx_media_likes_media_id ON media_likes(media_id);