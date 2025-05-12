/*
  # Storage Buckets and Policies

  1. New Buckets
    - dogmedia: For storing media uploads
    - dogs: For dog profile images
    - avatars: For user profile images
    - groups: For group images
    - marketplace: For marketplace product images
    - certificates: For trainer certificates
  
  2. Security
    - All buckets are public for read access
    - Only authenticated users can upload files
    - File size limits and MIME type restrictions applied
*/

-- Create dogmedia bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'dogmedia', 
  'dogmedia', 
  true, 
  10485760, -- 10MB
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'application/pdf'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Create dogs bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'dogs', 
  'dogs', 
  true, 
  10485760, -- 10MB
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Create avatars bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars', 
  'avatars', 
  true, 
  10485760, -- 10MB
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Create groups bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'groups', 
  'groups', 
  true, 
  10485760, -- 10MB
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Create marketplace bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'marketplace', 
  'marketplace', 
  true, 
  10485760, -- 10MB
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Create certificates bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'certificates', 
  'certificates', 
  true, 
  10485760, -- 10MB
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for all buckets with unique names
DO $$
BEGIN
  -- dogmedia bucket policies
  BEGIN
    EXECUTE format('
      CREATE POLICY "dogmedia_read_policy" ON storage.objects
      FOR SELECT USING (bucket_id = ''%I'');
    ', 'dogmedia');
    EXCEPTION WHEN duplicate_object THEN
      RAISE NOTICE 'Policy dogmedia_read_policy already exists, skipping';
  END;
  
  BEGIN
    EXECUTE format('
      CREATE POLICY "dogmedia_insert_policy" ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = ''%I'' AND auth.role() = ''authenticated'');
    ', 'dogmedia');
    EXCEPTION WHEN duplicate_object THEN
      RAISE NOTICE 'Policy dogmedia_insert_policy already exists, skipping';
  END;

  -- dogs bucket policies
  BEGIN
    EXECUTE format('
      CREATE POLICY "dogs_read_policy" ON storage.objects
      FOR SELECT USING (bucket_id = ''%I'');
    ', 'dogs');
    EXCEPTION WHEN duplicate_object THEN
      RAISE NOTICE 'Policy dogs_read_policy already exists, skipping';
  END;
  
  BEGIN
    EXECUTE format('
      CREATE POLICY "dogs_insert_policy" ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = ''%I'' AND auth.role() = ''authenticated'');
    ', 'dogs');
    EXCEPTION WHEN duplicate_object THEN
      RAISE NOTICE 'Policy dogs_insert_policy already exists, skipping';
  END;

  -- avatars bucket policies
  BEGIN
    EXECUTE format('
      CREATE POLICY "avatars_read_policy" ON storage.objects
      FOR SELECT USING (bucket_id = ''%I'');
    ', 'avatars');
    EXCEPTION WHEN duplicate_object THEN
      RAISE NOTICE 'Policy avatars_read_policy already exists, skipping';
  END;
  
  BEGIN
    EXECUTE format('
      CREATE POLICY "avatars_insert_policy" ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = ''%I'' AND auth.role() = ''authenticated'');
    ', 'avatars');
    EXCEPTION WHEN duplicate_object THEN
      RAISE NOTICE 'Policy avatars_insert_policy already exists, skipping';
  END;

  -- groups bucket policies
  BEGIN
    EXECUTE format('
      CREATE POLICY "groups_read_policy" ON storage.objects
      FOR SELECT USING (bucket_id = ''%I'');
    ', 'groups');
    EXCEPTION WHEN duplicate_object THEN
      RAISE NOTICE 'Policy groups_read_policy already exists, skipping';
  END;
  
  BEGIN
    EXECUTE format('
      CREATE POLICY "groups_insert_policy" ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = ''%I'' AND auth.role() = ''authenticated'');
    ', 'groups');
    EXCEPTION WHEN duplicate_object THEN
      RAISE NOTICE 'Policy groups_insert_policy already exists, skipping';
  END;

  -- marketplace bucket policies
  BEGIN
    EXECUTE format('
      CREATE POLICY "marketplace_read_policy" ON storage.objects
      FOR SELECT USING (bucket_id = ''%I'');
    ', 'marketplace');
    EXCEPTION WHEN duplicate_object THEN
      RAISE NOTICE 'Policy marketplace_read_policy already exists, skipping';
  END;
  
  BEGIN
    EXECUTE format('
      CREATE POLICY "marketplace_insert_policy" ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = ''%I'' AND auth.role() = ''authenticated'');
    ', 'marketplace');
    EXCEPTION WHEN duplicate_object THEN
      RAISE NOTICE 'Policy marketplace_insert_policy already exists, skipping';
  END;

  -- certificates bucket policies
  BEGIN
    EXECUTE format('
      CREATE POLICY "certificates_read_policy" ON storage.objects
      FOR SELECT USING (bucket_id = ''%I'');
    ', 'certificates');
    EXCEPTION WHEN duplicate_object THEN
      RAISE NOTICE 'Policy certificates_read_policy already exists, skipping';
  END;
  
  BEGIN
    EXECUTE format('
      CREATE POLICY "certificates_insert_policy" ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = ''%I'' AND auth.role() = ''authenticated'');
    ', 'certificates');
    EXCEPTION WHEN duplicate_object THEN
      RAISE NOTICE 'Policy certificates_insert_policy already exists, skipping';
  END;
END $$;