/*
  # Community Forum and Groups Schema
  
  1. New Tables
    - forums: Stores forum posts/threads
    - forum_comments: Stores comments on forum posts
    - groups: Community groups
    - group_members: Group membership with roles
    - group_reactions: Likes and reactions on posts/comments
  
  2. Security
    - RLS enabled on all tables
    - Policies for proper access control
*/

-- Create forums table
CREATE TABLE IF NOT EXISTS forums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create forum_comments table
CREATE TABLE IF NOT EXISTS forum_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  forum_id uuid REFERENCES forums(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create forum_reactions table
CREATE TABLE IF NOT EXISTS forum_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_type text NOT NULL CHECK (reference_type IN ('post', 'comment')),
  reference_id uuid NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reaction_type text NOT NULL DEFAULT 'like',
  created_at timestamptz DEFAULT now(),
  UNIQUE(reference_type, reference_id, user_id)
);

-- Enable RLS
ALTER TABLE forums ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_reactions ENABLE ROW LEVEL SECURITY;

-- Create policies for forums
CREATE POLICY "Anyone can view public forums"
  ON forums FOR SELECT
  USING (
    group_id IS NULL OR 
    EXISTS (
      SELECT 1 FROM groups
      WHERE id = forums.group_id
      AND (
        NOT is_private OR
        EXISTS (
          SELECT 1 FROM group_members
          WHERE group_id = groups.id
          AND user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can create forum posts"
  ON forums FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    (
      group_id IS NULL OR
      EXISTS (
        SELECT 1 FROM group_members
        WHERE group_id = forums.group_id
        AND user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update their own forum posts"
  ON forums FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own forum posts"
  ON forums FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for forum_comments
CREATE POLICY "Anyone can view comments on accessible forums"
  ON forum_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM forums
      WHERE id = forum_comments.forum_id
      AND (
        group_id IS NULL OR
        EXISTS (
          SELECT 1 FROM groups
          WHERE id = forums.group_id
          AND (
            NOT is_private OR
            EXISTS (
              SELECT 1 FROM group_members
              WHERE group_id = groups.id
              AND user_id = auth.uid()
            )
          )
        )
      )
    )
  );

CREATE POLICY "Users can create comments on accessible forums"
  ON forum_comments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM forums
      WHERE id = forum_comments.forum_id
      AND (
        group_id IS NULL OR
        EXISTS (
          SELECT 1 FROM group_members
          WHERE group_id = forums.group_id
          AND user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can update their own comments"
  ON forum_comments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON forum_comments FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for forum_reactions
CREATE POLICY "Anyone can view reactions"
  ON forum_reactions FOR SELECT
  USING (true);

CREATE POLICY "Users can create reactions"
  ON forum_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions"
  ON forum_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_forums_user_id ON forums(user_id);
CREATE INDEX IF NOT EXISTS idx_forums_group_id ON forums(group_id);
CREATE INDEX IF NOT EXISTS idx_forum_comments_forum_id ON forum_comments(forum_id);
CREATE INDEX IF NOT EXISTS idx_forum_comments_user_id ON forum_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_reactions_reference ON forum_reactions(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_forum_reactions_user_id ON forum_reactions(user_id);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for forums
CREATE TRIGGER update_forums_updated_at
  BEFORE UPDATE ON forums
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for forum_comments
CREATE TRIGGER update_forum_comments_updated_at
  BEFORE UPDATE ON forum_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();