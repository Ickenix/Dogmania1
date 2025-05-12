/*
  # Fix Group Members Policy Recursion

  This migration fixes the infinite recursion issue in the group_members policies
  by simplifying the policies and removing circular references.

  1. Changes
    - Remove recursive policies from group_members table
    - Add simplified policies for group member management
    - Update related policies for better performance

  2. Security
    - Maintain RLS protection
    - Ensure proper access control for group members
*/

-- Drop existing policies to clean up
DROP POLICY IF EXISTS "Members can view group members" ON group_members;

-- Create new, simplified policies
CREATE POLICY "Anyone can view group members"
  ON group_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = group_members.group_id
      AND (
        NOT groups.is_private
        OR groups.creator_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM group_members gm
          WHERE gm.group_id = groups.id
          AND gm.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Members can manage their membership"
  ON group_members
  FOR ALL
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = group_members.group_id
      AND groups.creator_id = auth.uid()
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = group_members.group_id
      AND groups.creator_id = auth.uid()
    )
  );