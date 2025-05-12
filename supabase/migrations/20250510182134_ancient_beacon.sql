/*
  # Community Schema Update
  
  1. New Tables
    - community_posts: For storing user posts
    - community_comments: For post comments
    - community_likes: For post likes
  
  2. Indexes
    - Author and post indexes for faster queries
  
  3. Security
    - RLS enabled on all tables
    - Policies for CRUD operations
*/

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view all posts" ON community_posts;
  DROP POLICY IF EXISTS "Users can insert their own posts" ON community_posts;
  DROP POLICY IF EXISTS "Users can update their own posts" ON community_posts;
  DROP POLICY IF EXISTS "Users can delete their own posts" ON community_posts;
  DROP POLICY IF EXISTS "Users can read comments" ON community_comments;
  DROP POLICY IF EXISTS "Users can insert their own comments" ON community_comments;
  DROP POLICY IF EXISTS "Users can update their own comments" ON community_comments;
  DROP POLICY IF EXISTS "Users can delete their own comments" ON community_comments;
  DROP POLICY IF EXISTS "Users can view all likes" ON community_likes;
  DROP POLICY IF EXISTS "Users can insert their own likes" ON community_likes;
  DROP POLICY IF EXISTS "Users can delete their own likes" ON community_likes;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create or update community_posts table
CREATE TABLE IF NOT EXISTS community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title text,
  content text,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  category text
);

-- Create or update community_comments table
CREATE TABLE IF NOT EXISTS community_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES community_posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create or update community_likes table
CREATE TABLE IF NOT EXISTS community_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES community_posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT community_likes_post_id_user_id_key UNIQUE (post_id, user_id)
);

-- Create indexes if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_community_posts_author_id'
  ) THEN
    CREATE INDEX idx_community_posts_author_id ON community_posts(author_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_community_comments_post_id'
  ) THEN
    CREATE INDEX idx_community_comments_post_id ON community_comments(post_id);
  END IF;
END $$;

-- Enable RLS
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_likes ENABLE ROW LEVEL SECURITY;

-- Create new policies
CREATE POLICY "Users can view all posts"
  ON community_posts FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can insert their own posts"
  ON community_posts FOR INSERT
  TO public
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own posts"
  ON community_posts FOR UPDATE
  TO public
  USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own posts"
  ON community_posts FOR DELETE
  TO public
  USING (auth.uid() = author_id);

CREATE POLICY "Users can read comments"
  ON community_comments FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can insert their own comments"
  ON community_comments FOR INSERT
  TO public
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON community_comments FOR UPDATE
  TO public
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON community_comments FOR DELETE
  TO public
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view all likes"
  ON community_likes FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can insert their own likes"
  ON community_likes FOR INSERT
  TO public
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes"
  ON community_likes FOR DELETE
  TO public
  USING (auth.uid() = user_id);