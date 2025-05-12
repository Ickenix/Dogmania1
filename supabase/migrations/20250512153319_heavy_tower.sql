/*
  # Fix Media Uploads Relationships

  1. Changes
    - Fix the relationship between media_uploads and profiles tables
    - Fix the relationship between media_uploads and dogs tables
    - Add default empty array for tags column
    - Ensure proper RLS policies are in place
*/

-- First, check if the media_uploads table exists
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'media_uploads') THEN
    -- Drop existing foreign key constraints if they exist
    IF EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'media_uploads_user_id_fkey' 
      AND conrelid = 'public.media_uploads'::regclass
    ) THEN
      ALTER TABLE public.media_uploads DROP CONSTRAINT media_uploads_user_id_fkey;
    END IF;

    IF EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'media_uploads_dog_id_fkey' 
      AND conrelid = 'public.media_uploads'::regclass
    ) THEN
      ALTER TABLE public.media_uploads DROP CONSTRAINT media_uploads_dog_id_fkey;
    END IF;

    -- Add the correct foreign key constraints
    ALTER TABLE public.media_uploads 
    ADD CONSTRAINT media_uploads_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

    ALTER TABLE public.media_uploads 
    ADD CONSTRAINT media_uploads_dog_id_fkey 
    FOREIGN KEY (dog_id) REFERENCES public.dogs(id) ON DELETE SET NULL;

    -- Set default empty array for tags if not already set
    ALTER TABLE public.media_uploads 
    ALTER COLUMN tags SET DEFAULT '{}';

    -- Ensure RLS is enabled
    ALTER TABLE public.media_uploads ENABLE ROW LEVEL SECURITY;

    -- Recreate RLS policies to ensure they're correct
    -- First drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can delete their own media" ON public.media_uploads;
    DROP POLICY IF EXISTS "Users can update their own media" ON public.media_uploads;
    DROP POLICY IF EXISTS "Users can upload their own media" ON public.media_uploads;
    DROP POLICY IF EXISTS "Users can view all media" ON public.media_uploads;

    -- Create RLS policies
    CREATE POLICY "Users can delete their own media" 
      ON public.media_uploads 
      FOR DELETE 
      TO public 
      USING (user_id = auth.uid());

    CREATE POLICY "Users can update their own media" 
      ON public.media_uploads 
      FOR UPDATE 
      TO public 
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());

    CREATE POLICY "Users can upload their own media" 
      ON public.media_uploads 
      FOR INSERT 
      TO public 
      WITH CHECK (user_id = auth.uid());

    CREATE POLICY "Users can view all media" 
      ON public.media_uploads 
      FOR SELECT 
      TO public 
      USING (true);
  END IF;
END $$;

-- Do the same for media_comments table
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'media_comments') THEN
    -- Drop existing foreign key constraints if they exist
    IF EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'media_comments_user_id_fkey' 
      AND conrelid = 'public.media_comments'::regclass
    ) THEN
      ALTER TABLE public.media_comments DROP CONSTRAINT media_comments_user_id_fkey;
    END IF;

    -- Add the correct foreign key constraints
    ALTER TABLE public.media_comments 
    ADD CONSTRAINT media_comments_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

    -- Ensure RLS is enabled
    ALTER TABLE public.media_comments ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Do the same for media_likes table
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'media_likes') THEN
    -- Drop existing foreign key constraints if they exist
    IF EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'media_likes_user_id_fkey' 
      AND conrelid = 'public.media_likes'::regclass
    ) THEN
      ALTER TABLE public.media_likes DROP CONSTRAINT media_likes_user_id_fkey;
    END IF;

    -- Add the correct foreign key constraints
    ALTER TABLE public.media_likes 
    ADD CONSTRAINT media_likes_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

    -- Ensure RLS is enabled
    ALTER TABLE public.media_likes ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;