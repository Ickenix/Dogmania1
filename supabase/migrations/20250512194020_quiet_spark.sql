/*
  # Fix infinite recursion in groups policy

  1. Changes
    - Drop existing policy that causes infinite recursion
    - Create new non-recursive policy for groups table
    - Fix policy to use auth.uid() instead of uid()
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view public groups" ON groups;

-- Create new non-recursive policy
CREATE POLICY "Anyone can view public groups" ON groups
FOR SELECT USING (
  NOT is_private OR 
  auth.uid() = creator_id OR
  EXISTS (
    SELECT 1 FROM group_members 
    WHERE group_members.group_id = groups.id 
    AND group_members.user_id = auth.uid()
  )
);