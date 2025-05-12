/*
  # Fix groups table policies

  1. Changes
    - Replace recursive view_groups_policy with a simplified version that avoids infinite recursion
    - Maintain security by still checking private/public status and membership
  
  2. Security
    - Users can still only view groups they have access to
    - Private groups remain restricted to members only
    - Public groups remain visible to everyone
*/

-- Drop the existing policy that's causing recursion
DROP POLICY IF EXISTS "view_groups_policy" ON "public"."groups";

-- Create new, non-recursive policy
CREATE POLICY "view_groups_policy" ON "public"."groups"
FOR SELECT
TO public
USING (
  (NOT is_private) OR -- Public groups are visible to everyone
  (uid() = creator_id) OR -- Creator can always see their groups
  EXISTS ( -- Members can see groups they're in
    SELECT 1 
    FROM group_members 
    WHERE group_members.group_id = groups.id 
    AND group_members.user_id = uid()
  )
);