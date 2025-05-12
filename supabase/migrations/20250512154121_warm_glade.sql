/*
  # Fix Media Foreign Keys

  1. Changes
     - Fix foreign key relationships for media_uploads, media_comments, and media_likes tables
     - Ensure proper references to profiles table instead of auth.users
     - Add missing constraints and indexes

  2. Security
     - Maintain existing RLS policies
*/

-- First, check if the media_uploads table exists
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'media_uploads') THEN
    -- Drop existing foreign key constraints if they exist
    ALTER TABLE IF EXISTS public.media_uploads 
    DROP CONSTRAINT IF EXISTS media_uploads_user_id_fkey;

    -- Add the correct foreign key constraint to profiles table
    ALTER TABLE public.media_uploads
    ADD CONSTRAINT media_uploads_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

    -- Also fix the dog_id foreign key if needed
    ALTER TABLE IF EXISTS public.media_uploads
    DROP CONSTRAINT IF EXISTS media_uploads_dog_id_fkey;

    ALTER TABLE public.media_uploads
    ADD CONSTRAINT media_uploads_dog_id_fkey
    FOREIGN KEY (dog_id) REFERENCES public.dogs(id) ON DELETE SET NULL;

    -- Ensure tags column has a default value
    ALTER TABLE public.media_uploads 
    ALTER COLUMN tags SET DEFAULT '{}';
  END IF;
END $$;

-- Fix media_comments foreign keys
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'media_comments') THEN
    -- Drop existing foreign key constraints if they exist
    ALTER TABLE IF EXISTS public.media_comments
    DROP CONSTRAINT IF EXISTS media_comments_user_id_fkey;

    -- Add the correct foreign key constraint to profiles table
    ALTER TABLE public.media_comments
    ADD CONSTRAINT media_comments_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

    -- Fix the media_id foreign key if needed
    ALTER TABLE IF EXISTS public.media_comments
    DROP CONSTRAINT IF EXISTS media_comments_media_id_fkey;

    ALTER TABLE public.media_comments
    ADD CONSTRAINT media_comments_media_id_fkey
    FOREIGN KEY (media_id) REFERENCES public.media_uploads(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Fix media_likes foreign keys
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'media_likes') THEN
    -- Drop existing foreign key constraints if they exist
    ALTER TABLE IF EXISTS public.media_likes
    DROP CONSTRAINT IF EXISTS media_likes_user_id_fkey;

    -- Add the correct foreign key constraint to profiles table
    ALTER TABLE public.media_likes
    ADD CONSTRAINT media_likes_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

    -- Fix the media_id foreign key if needed
    ALTER TABLE IF EXISTS public.media_likes
    DROP CONSTRAINT IF EXISTS media_likes_media_id_fkey;

    ALTER TABLE public.media_likes
    ADD CONSTRAINT media_likes_media_id_fkey
    FOREIGN KEY (media_id) REFERENCES public.media_uploads(id) ON DELETE CASCADE;
  END IF;
END $$;