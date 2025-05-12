/*
  # Fix infinite recursion in groups policy

  1. Changes
    - Remove recursive policy conditions for groups table
    - Simplify group access policies to prevent infinite loops
    - Maintain security while avoiding policy recursion

  2. Security
    - Public groups remain visible to everyone
    - Private groups visible only to members and creator
    - Group creation restricted to authenticated users
    - Group updates restricted to admins
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Anyone can view public groups" ON groups;
DROP POLICY IF EXISTS "Group admins can update groups" ON groups;
DROP POLICY IF EXISTS "Users can create groups" ON groups;

-- Create new non-recursive policies
CREATE POLICY "Anyone can view public groups"
ON groups
FOR SELECT
TO public
USING (
  NOT is_private OR 
  uid() = creator_id OR
  EXISTS (
    SELECT 1 FROM group_members 
    WHERE group_members.group_id = groups.id 
    AND group_members.user_id = uid()
  )
);

CREATE POLICY "Group admins can update groups"
ON groups
FOR UPDATE
TO public
USING (
  EXISTS (
    SELECT 1 FROM group_members 
    WHERE group_members.group_id = groups.id 
    AND group_members.user_id = uid() 
    AND group_members.role = 'admin'
  )
);

CREATE POLICY "Users can create groups"
ON groups
FOR INSERT
TO authenticated
WITH CHECK (
  uid() = creator_id
);