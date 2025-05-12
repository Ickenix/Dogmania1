/*
  # Fix groups table policies

  1. Changes
    - Replace uid() with auth.uid() in all policies
    - Recreate policies for groups table to fix infinite recursion
  
  2. Security
    - Maintain same security model with proper function calls
    - Public groups visible to everyone
    - Private groups only visible to creator and members
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
  auth.uid() = creator_id OR
  EXISTS (
    SELECT 1 FROM group_members 
    WHERE group_members.group_id = groups.id 
    AND group_members.user_id = auth.uid()
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
    AND group_members.user_id = auth.uid() 
    AND group_members.role = 'admin'
  )
);

CREATE POLICY "Users can create groups"
ON groups
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = creator_id
);