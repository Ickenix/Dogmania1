/*
  # Fix media_uploads foreign key relationships

  1. Changes
     - Drops and recreates the foreign key constraint between media_uploads.user_id and profiles.id
     - Ensures proper relationship naming for Supabase RLS and joins
  
  2. Security
     - Maintains existing RLS policies
*/

-- Drop the existing foreign key constraint if it exists
ALTER TABLE IF EXISTS public.media_uploads 
DROP CONSTRAINT IF EXISTS media_uploads_user_id_fkey;

-- Add the correct foreign key constraint to profiles table
ALTER TABLE public.media_uploads
ADD CONSTRAINT media_uploads_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Also fix the media_comments foreign key to profiles if needed
ALTER TABLE IF EXISTS public.media_comments
DROP CONSTRAINT IF EXISTS media_comments_user_id_fkey;

ALTER TABLE public.media_comments
ADD CONSTRAINT media_comments_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Also fix the media_likes foreign key to profiles if needed
ALTER TABLE IF EXISTS public.media_likes
DROP CONSTRAINT IF EXISTS media_likes_user_id_fkey;

ALTER TABLE public.media_likes
ADD CONSTRAINT media_likes_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;