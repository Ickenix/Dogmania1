/*
  # Fix group policies with existence checks
  
  1. Changes
    - Drops existing policies only if they exist
    - Creates new policies only if they don't exist
    - Uses auth.uid() instead of uid() function
    - Avoids policy name conflicts
  
  2. Security
    - Maintains same security rules for groups
    - Ensures proper access control for viewing, creating, and updating groups
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "view_groups_policy" ON "public"."groups";
DROP POLICY IF EXISTS "Anyone can view public groups" ON "public"."groups";
DROP POLICY IF EXISTS "Group admins can update groups" ON "public"."groups";
DROP POLICY IF EXISTS "Users can create groups" ON "public"."groups";
DROP POLICY IF EXISTS "create_groups_policy" ON "public"."groups";
DROP POLICY IF EXISTS "update_groups_policy" ON "public"."groups";

-- Create new policy for viewing groups
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'groups' 
    AND policyname = 'view_groups_policy'
  ) THEN
    EXECUTE format('
      CREATE POLICY "view_groups_policy" ON "public"."groups"
      FOR SELECT
      TO public
      USING (
        (NOT is_private) OR
        (auth.uid() = creator_id) OR
        EXISTS (
          SELECT 1 
          FROM group_members 
          WHERE group_members.group_id = groups.id 
          AND group_members.user_id = auth.uid()
        )
      )
    ');
  END IF;
END $$;

-- Create policy for creating groups
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'groups' 
    AND policyname = 'create_groups_policy'
  ) THEN
    EXECUTE format('
      CREATE POLICY "create_groups_policy" ON "public"."groups"
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = creator_id)
    ');
  END IF;
END $$;

-- Create policy for updating groups
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'groups' 
    AND policyname = 'update_groups_policy'
  ) THEN
    EXECUTE format('
      CREATE POLICY "update_groups_policy" ON "public"."groups"
      FOR UPDATE
      TO public
      USING (
        EXISTS (
          SELECT 1 FROM group_members
          WHERE group_members.group_id = groups.id
          AND group_members.user_id = auth.uid()
          AND group_members.role = ''admin''
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM group_members
          WHERE group_members.group_id = groups.id
          AND group_members.user_id = auth.uid()
          AND group_members.role = ''admin''
        )
      )
    ');
  END IF;
END $$;