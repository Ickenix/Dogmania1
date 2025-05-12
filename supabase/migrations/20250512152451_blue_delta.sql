/*
  # Fix Media Uploads Relationships

  1. Changes
    - Add proper foreign key constraints for media_uploads table
    - Ensure proper relationships between media_uploads and profiles/dogs tables
    - Add missing indexes for performance optimization

  2. Security
    - Update RLS policies to ensure proper access control
*/

-- First, check if the media_uploads table exists and create it if not
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'media_uploads') THEN
    CREATE TABLE public.media_uploads (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      file_url text NOT NULL,
      file_type text NOT NULL CHECK (file_type IN ('image', 'video')),
      description text,
      tags text[] DEFAULT '{}',
      dog_id uuid REFERENCES public.dogs(id) ON DELETE SET NULL,
      show_in_feed boolean DEFAULT true,
      created_at timestamptz DEFAULT now()
    );

    -- Create indexes for performance
    CREATE INDEX idx_media_uploads_created_at ON public.media_uploads USING btree (created_at);
    CREATE INDEX idx_media_uploads_dog_id ON public.media_uploads USING btree (dog_id);
    CREATE INDEX idx_media_uploads_user_id ON public.media_uploads USING btree (user_id);

    -- Enable RLS
    ALTER TABLE public.media_uploads ENABLE ROW LEVEL SECURITY;

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
  ELSE
    -- If table exists, ensure the foreign keys are properly set up
    -- First check if the foreign key to auth.users exists
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'media_uploads_user_id_fkey' 
      AND conrelid = 'public.media_uploads'::regclass
    ) THEN
      -- Add the foreign key constraint
      ALTER TABLE public.media_uploads 
      ADD CONSTRAINT media_uploads_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    -- Check if the foreign key to dogs exists
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'media_uploads_dog_id_fkey' 
      AND conrelid = 'public.media_uploads'::regclass
    ) THEN
      -- Add the foreign key constraint
      ALTER TABLE public.media_uploads 
      ADD CONSTRAINT media_uploads_dog_id_fkey 
      FOREIGN KEY (dog_id) REFERENCES public.dogs(id) ON DELETE SET NULL;
    END IF;

    -- Ensure indexes exist
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_media_uploads_created_at') THEN
      CREATE INDEX idx_media_uploads_created_at ON public.media_uploads USING btree (created_at);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_media_uploads_dog_id') THEN
      CREATE INDEX idx_media_uploads_dog_id ON public.media_uploads USING btree (dog_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_media_uploads_user_id') THEN
      CREATE INDEX idx_media_uploads_user_id ON public.media_uploads USING btree (user_id);
    END IF;
  END IF;
END $$;

-- Create media_likes table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'media_likes') THEN
    CREATE TABLE public.media_likes (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      media_id uuid NOT NULL REFERENCES public.media_uploads(id) ON DELETE CASCADE,
      user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      created_at timestamptz DEFAULT now()
    );

    -- Create unique constraint to prevent multiple likes
    CREATE UNIQUE INDEX media_likes_media_id_user_id_key ON public.media_likes USING btree (media_id, user_id);
    
    -- Create index for performance
    CREATE INDEX idx_media_likes_media_id ON public.media_likes USING btree (media_id);

    -- Enable RLS
    ALTER TABLE public.media_likes ENABLE ROW LEVEL SECURITY;

    -- Create RLS policies
    CREATE POLICY "Users can like media" 
      ON public.media_likes 
      FOR INSERT 
      TO public 
      WITH CHECK (user_id = auth.uid());

    CREATE POLICY "Users can unlike media" 
      ON public.media_likes 
      FOR DELETE 
      TO public 
      USING (user_id = auth.uid());

    CREATE POLICY "Users can view all likes" 
      ON public.media_likes 
      FOR SELECT 
      TO public 
      USING (true);
  END IF;
END $$;

-- Create media_comments table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'media_comments') THEN
    CREATE TABLE public.media_comments (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      media_id uuid NOT NULL REFERENCES public.media_uploads(id) ON DELETE CASCADE,
      user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      content text NOT NULL,
      created_at timestamptz DEFAULT now()
    );

    -- Create index for performance
    CREATE INDEX idx_media_comments_media_id ON public.media_comments USING btree (media_id);

    -- Enable RLS
    ALTER TABLE public.media_comments ENABLE ROW LEVEL SECURITY;

    -- Create RLS policies
    CREATE POLICY "Users can comment on media" 
      ON public.media_comments 
      FOR INSERT 
      TO public 
      WITH CHECK (user_id = auth.uid());

    CREATE POLICY "Users can delete their own comments" 
      ON public.media_comments 
      FOR DELETE 
      TO public 
      USING (user_id = auth.uid());

    CREATE POLICY "Users can view all comments" 
      ON public.media_comments 
      FOR SELECT 
      TO public 
      USING (true);
  END IF;
END $$;