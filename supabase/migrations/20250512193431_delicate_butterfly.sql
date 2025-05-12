/*
  # Fix recursive RLS policy for groups table
  
  1. Changes
    - Drop existing policy that causes infinite recursion
    - Create new non-recursive policy for groups table
  2. Security
    - Maintain proper access control while fixing recursion issue
    - Allow access to non-private groups, groups where user is creator, or groups where user is a member
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