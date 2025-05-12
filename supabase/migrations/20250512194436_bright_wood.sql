/*
  # Fix groups table RLS policy

  1. Changes
    - Remove recursive policy check for groups table
    - Simplify policy to check only direct membership and privacy status
    - Add separate policies for different operations

  2. Security
    - Enable RLS on groups table
    - Add policies for:
      - Viewing groups (public groups or member access)
      - Creating groups (authenticated users)
      - Updating groups (group admins only)
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
  OR uid() = creator_id 
  OR EXISTS (
    SELECT 1 FROM group_members 
    WHERE group_members.group_id = groups.id 
    AND group_members.user_id = uid()
  )
);

CREATE POLICY "create_groups_policy"
ON groups
FOR INSERT
TO authenticated
WITH CHECK (uid() = creator_id);

CREATE POLICY "update_groups_policy"
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
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = groups.id
    AND group_members.user_id = uid()
    AND group_members.role = 'admin'
  )
);