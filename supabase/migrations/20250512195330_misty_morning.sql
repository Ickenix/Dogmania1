/*
  # Fix infinite recursion in groups policy

  1. Changes
    - Drop existing policies on the groups table that are causing recursion
    - Create new non-recursive policies for the groups table
    - Implement proper access control for viewing, creating, and updating groups
  
  2. Security
    - Maintain the same security model but fix the implementation
    - Ensure public groups are visible to everyone
    - Ensure private groups are only visible to members and creators
*/

-- Drop the existing policies that are causing recursion
DROP POLICY IF EXISTS "view_groups_policy" ON "public"."groups";
DROP POLICY IF EXISTS "create_groups_policy" ON "public"."groups";
DROP POLICY IF EXISTS "update_groups_policy" ON "public"."groups";
DROP POLICY IF EXISTS "Anyone can view public groups" ON "public"."groups";
DROP POLICY IF EXISTS "Group admins can update groups" ON "public"."groups";
DROP POLICY IF EXISTS "Users can create groups" ON "public"."groups";

-- Create new, non-recursive policy for viewing groups
CREATE POLICY "view_groups_policy" ON "public"."groups"
FOR SELECT
TO public
USING (
  (NOT is_private) OR -- Public groups are visible to everyone
  (auth.uid() = creator_id) OR -- Creator can always see their groups
  (
    -- Members can see groups they're in
    id IN (
      SELECT group_id 
      FROM group_members 
      WHERE user_id = auth.uid()
    )
  )
);

-- Create policy for creating groups
CREATE POLICY "create_groups_policy" ON "public"."groups"
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = creator_id);

-- Create policy for updating groups
CREATE POLICY "update_groups_policy" ON "public"."groups"
FOR UPDATE
TO public
USING (
  -- Only group admins can update groups
  id IN (
    SELECT group_id 
    FROM group_members
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
)
WITH CHECK (
  -- Only group admins can update groups
  id IN (
    SELECT group_id 
    FROM group_members
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);