/*
  # Community Feed Tables

  1. New Tables
    - community_posts: Stores user posts with content and media
    - community_likes: Tracks post likes
    - community_comments: Stores post comments
  
  2. Security
    - Enable RLS on all tables
    - Add policies for CRUD operations
    
  3. Indexes
    - Add indexes for better query performance
*/

-- Create community_posts table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'community_posts') THEN
    CREATE TABLE community_posts (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      author_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
      title text,
      content text,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      category text,
      image_url text
    );

    -- Create index
    CREATE INDEX idx_community_posts_author_id ON community_posts(author_id);

    -- Enable RLS
    ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

    -- Create policies
    CREATE POLICY "Allow users to read posts" 
      ON community_posts FOR SELECT 
      TO public 
      USING (true);

    CREATE POLICY "Allow users to create posts" 
      ON community_posts FOR INSERT 
      TO public 
      WITH CHECK (author_id = auth.uid());

    CREATE POLICY "Allow users to update their own posts" 
      ON community_posts FOR UPDATE 
      TO public 
      USING (author_id = auth.uid());

    CREATE POLICY "Allow users to delete their own posts" 
      ON community_posts FOR DELETE 
      TO public 
      USING (author_id = auth.uid());
  END IF;
END $$;

-- Create community_likes table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'community_likes') THEN
    CREATE TABLE community_likes (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      post_id uuid REFERENCES community_posts(id) ON DELETE CASCADE,
      user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
      created_at timestamptz DEFAULT now(),
      UNIQUE(post_id, user_id)
    );

    -- Enable RLS
    ALTER TABLE community_likes ENABLE ROW LEVEL SECURITY;

    -- Create policies
    CREATE POLICY "Allow users to read likes" 
      ON community_likes FOR SELECT 
      TO public 
      USING (true);

    CREATE POLICY "Allow users to create likes" 
      ON community_likes FOR INSERT 
      TO public 
      WITH CHECK (user_id = auth.uid());

    CREATE POLICY "Allow users to delete their own likes" 
      ON community_likes FOR DELETE 
      TO public 
      USING (user_id = auth.uid());
  END IF;
END $$;

-- Create community_comments table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'community_comments') THEN
    CREATE TABLE community_comments (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      post_id uuid REFERENCES community_posts(id) ON DELETE CASCADE,
      user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
      content text NOT NULL,
      created_at timestamptz DEFAULT now()
    );

    -- Create index
    CREATE INDEX idx_community_comments_post_id ON community_comments(post_id);

    -- Enable RLS
    ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;

    -- Create policies
    CREATE POLICY "Allow users to read comments" 
      ON community_comments FOR SELECT 
      TO public 
      USING (true);

    CREATE POLICY "Allow users to create comments" 
      ON community_comments FOR INSERT 
      TO public 
      WITH CHECK (user_id = auth.uid());

    CREATE POLICY "Allow users to update their own comments" 
      ON community_comments FOR UPDATE 
      TO public 
      USING (user_id = auth.uid());

    CREATE POLICY "Allow users to delete their own comments" 
      ON community_comments FOR DELETE 
      TO public 
      USING (user_id = auth.uid());
  END IF;
END $$;