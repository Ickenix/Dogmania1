/*
  # Fix groups table policies

  1. Changes
    - Drop existing policies that use the incorrect uid() function
    - Create new policies using the correct auth.uid() function
    - Fix infinite recursion issue in the policies
*/

-- Drop the existing policies that might be causing recursion
DROP POLICY IF EXISTS "view_groups_policy" ON "public"."groups";
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
  EXISTS ( -- Members can see groups they're in
    SELECT 1 
    FROM group_members 
    WHERE group_members.group_id = groups.id 
    AND group_members.user_id = auth.uid()
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
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = groups.id
    AND group_members.user_id = auth.uid()
    AND group_members.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = groups.id
    AND group_members.user_id = auth.uid()
    AND group_members.role = 'admin'
  )
);