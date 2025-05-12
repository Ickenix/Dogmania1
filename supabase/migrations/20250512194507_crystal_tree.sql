/*
  # Fix groups table RLS policies
  
  1. Changes
    - Drop existing policies that cause infinite recursion
    - Create new policies using auth.uid() instead of uid()
    - Implement proper RLS policies for viewing, creating, and updating groups
  2. Security
    - Maintain same security rules but fix the implementation
    - Public groups are viewable by everyone
    - Private groups are only viewable by members and creators
    - Only group admins can update groups
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view public groups" ON groups;
DROP POLICY IF EXISTS "Group admins can update groups" ON groups;
DROP POLICY IF EXISTS "Users can create groups" ON groups;

-- Create new policies without recursion
CREATE POLICY "view_groups_policy"
ON groups
FOR SELECT
TO public
USING (
  NOT is_private 
  OR auth.uid() = creator_id 
  OR EXISTS (
    SELECT 1 FROM group_members 
    WHERE group_members.group_id = groups.id 
    AND group_members.user_id = auth.uid()
  )
);

CREATE POLICY "create_groups_policy"
ON groups
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "update_groups_policy"
ON groups
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