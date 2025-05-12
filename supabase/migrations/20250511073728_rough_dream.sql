/*
  # Forum and Groups System
  
  1. New Tables
    - groups: Community groups/forums
    - group_members: Group membership and roles
    - group_threads: Forum threads/topics
    - group_comments: Thread comments/replies
    - group_likes: Likes for threads and comments
    - reports: Content moderation reports
  
  2. Security
    - Enable RLS on all tables
    - Add policies for access control
    - Ensure proper data validation
*/

-- Create groups table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'groups') THEN
    CREATE TABLE groups (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      description text,
      is_private boolean DEFAULT false,
      image_url text,
      creator_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
    
    -- Enable RLS
    ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
    
    -- Create policies
    CREATE POLICY "Anyone can view public groups"
      ON groups FOR SELECT
      USING (NOT is_private OR EXISTS (
        SELECT 1 FROM group_members
        WHERE group_members.group_id = groups.id
        AND group_members.user_id = auth.uid()
      ));

    CREATE POLICY "Users can create groups"
      ON groups FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = creator_id);

    CREATE POLICY "Group admins can update groups"
      ON groups FOR UPDATE
      USING (EXISTS (
        SELECT 1 FROM group_members
        WHERE group_members.group_id = groups.id
        AND group_members.user_id = auth.uid()
        AND group_members.role = 'admin'
      ));
  END IF;
END $$;

-- Create group_members table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'group_members') THEN
    CREATE TABLE group_members (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      group_id uuid REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
      user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      role text DEFAULT 'member' NOT NULL,
      joined_at timestamptz DEFAULT now(),
      UNIQUE(group_id, user_id),
      CONSTRAINT valid_role CHECK (role IN ('admin', 'member'))
    );
    
    -- Enable RLS
    ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
    
    -- Create policies
    CREATE POLICY "Members can view group members"
      ON group_members FOR SELECT
      USING (EXISTS (
        SELECT 1 FROM group_members gm
        WHERE gm.group_id = group_members.group_id
        AND gm.user_id = auth.uid()
      ));

    CREATE POLICY "Users can join public groups"
      ON group_members FOR INSERT
      TO authenticated
      WITH CHECK (
        auth.uid() = user_id AND
        NOT EXISTS (
          SELECT 1 FROM groups
          WHERE groups.id = group_id
          AND groups.is_private = true
        )
      );
      
    -- Create index
    CREATE INDEX idx_group_members_user_id ON group_members(user_id);
  END IF;
END $$;

-- Create group_threads table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'group_threads') THEN
    CREATE TABLE group_threads (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      group_id uuid REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
      title text NOT NULL,
      content text NOT NULL,
      user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      is_pinned boolean DEFAULT false,
      is_locked boolean DEFAULT false,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
    
    -- Enable RLS
    ALTER TABLE group_threads ENABLE ROW LEVEL SECURITY;
    
    -- Create policies
    CREATE POLICY "Members can view group threads"
      ON group_threads FOR SELECT
      USING (EXISTS (
        SELECT 1 FROM group_members
        WHERE group_members.group_id = group_threads.group_id
        AND group_members.user_id = auth.uid()
      ));

    CREATE POLICY "Members can create threads"
      ON group_threads FOR INSERT
      TO authenticated
      WITH CHECK (EXISTS (
        SELECT 1 FROM group_members
        WHERE group_members.group_id = group_threads.group_id
        AND group_members.user_id = auth.uid()
      ));

    CREATE POLICY "Authors and admins can update threads"
      ON group_threads FOR UPDATE
      USING (
        auth.uid() = user_id OR
        EXISTS (
          SELECT 1 FROM group_members
          WHERE group_members.group_id = group_threads.group_id
          AND group_members.user_id = auth.uid()
          AND group_members.role = 'admin'
        )
      );
      
    -- Create index
    CREATE INDEX idx_group_threads_group_id ON group_threads(group_id);
  END IF;
END $$;

-- Create group_comments table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'group_comments') THEN
    CREATE TABLE group_comments (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      thread_id uuid REFERENCES group_threads(id) ON DELETE CASCADE NOT NULL,
      user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      content text NOT NULL,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
    
    -- Enable RLS
    ALTER TABLE group_comments ENABLE ROW LEVEL SECURITY;
    
    -- Create policies
    CREATE POLICY "Members can view comments"
      ON group_comments FOR SELECT
      USING (EXISTS (
        SELECT 1 FROM group_threads
        JOIN group_members ON group_threads.group_id = group_members.group_id
        WHERE group_threads.id = group_comments.thread_id
        AND group_members.user_id = auth.uid()
      ));

    CREATE POLICY "Members can create comments"
      ON group_comments FOR INSERT
      TO authenticated
      WITH CHECK (EXISTS (
        SELECT 1 FROM group_threads
        JOIN group_members ON group_threads.group_id = group_members.group_id
        WHERE group_threads.id = group_comments.thread_id
        AND group_members.user_id = auth.uid()
      ));
      
    -- Create index
    CREATE INDEX idx_group_comments_thread_id ON group_comments(thread_id);
  END IF;
END $$;

-- Create group_likes table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'group_likes') THEN
    CREATE TABLE group_likes (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      reference_type text NOT NULL,
      reference_id uuid NOT NULL,
      created_at timestamptz DEFAULT now(),
      CONSTRAINT valid_reference_type CHECK (reference_type IN ('thread', 'comment')),
      UNIQUE(user_id, reference_type, reference_id)
    );
    
    -- Enable RLS
    ALTER TABLE group_likes ENABLE ROW LEVEL SECURITY;
    
    -- Create policies
    CREATE POLICY "Anyone can view likes"
      ON group_likes FOR SELECT
      USING (true);

    CREATE POLICY "Members can like content"
      ON group_likes FOR INSERT
      TO authenticated
      WITH CHECK (
        auth.uid() = user_id AND
        (
          (reference_type = 'thread' AND EXISTS (
            SELECT 1 FROM group_threads
            JOIN group_members ON group_threads.group_id = group_members.group_id
            WHERE group_threads.id = group_likes.reference_id
            AND group_members.user_id = auth.uid()
          )) OR
          (reference_type = 'comment' AND EXISTS (
            SELECT 1 FROM group_comments
            JOIN group_threads ON group_comments.thread_id = group_threads.id
            JOIN group_members ON group_threads.group_id = group_members.group_id
            WHERE group_comments.id = group_likes.reference_id
            AND group_members.user_id = auth.uid()
          ))
        )
      );

    CREATE POLICY "Users can remove their likes"
      ON group_likes FOR DELETE
      USING (auth.uid() = user_id);
      
    -- Create index
    CREATE INDEX idx_group_likes_reference ON group_likes(reference_type, reference_id);
  END IF;
END $$;

-- Create reports table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'reports') THEN
    CREATE TABLE reports (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      type text NOT NULL,
      reference_id uuid NOT NULL,
      reason text NOT NULL,
      reported_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      status text DEFAULT 'pending' NOT NULL,
      created_at timestamptz DEFAULT now(),
      resolved_at timestamptz,
      CONSTRAINT valid_type CHECK (type IN ('thread', 'comment')),
      CONSTRAINT valid_status CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed'))
    );
    
    -- Enable RLS
    ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
    
    -- Create policies
    CREATE POLICY "Users can create reports"
      ON reports FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = reported_by);

    CREATE POLICY "Admins can view reports"
      ON reports FOR SELECT
      USING (EXISTS (
        SELECT 1 FROM group_members
        WHERE group_members.role = 'admin'
        AND group_members.user_id = auth.uid()
      ));
  END IF;
END $$;