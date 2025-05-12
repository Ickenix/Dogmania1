/*
  # Fix recursive RLS policy for groups table

  1. Changes
    - Remove recursive policy check for group visibility
    - Implement direct policy check for group access
    - Simplify group member access verification

  2. Security
    - Maintains security by still checking group privacy and membership
    - Prevents infinite recursion while preserving access control
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view public groups" ON groups;

-- Create new non-recursive policy
CREATE POLICY "Anyone can view public groups" ON groups
FOR SELECT USING (
  NOT is_private OR 
  uid() = creator_id OR
  EXISTS (
    SELECT 1 FROM group_members 
    WHERE group_members.group_id = groups.id 
    AND group_members.user_id = uid()
  )
);