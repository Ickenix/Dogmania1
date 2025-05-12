/*
  # Create Storage Buckets

  1. New Buckets
    - Creates 6 storage buckets for the application:
      - dogmedia: For media uploads (images, videos)
      - dogs: For dog profile images
      - avatars: For user profile images
      - groups: For group images
      - marketplace: For marketplace product images
      - certificates: For trainer certificates
  
  2. Security
    - All buckets are set to public for read access
    - File size limits and allowed MIME types are configured
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

-- Create storage policies for all buckets
DO $$
BEGIN
  -- dogmedia bucket policies
  EXECUTE format('
    CREATE POLICY "Public Read Access" ON storage.objects
    FOR SELECT USING (bucket_id = ''%I'');
    
    CREATE POLICY "Authenticated Upload" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = ''%I'' AND auth.role() = ''authenticated'');
  ', 'dogmedia', 'dogmedia');

  -- dogs bucket policies
  EXECUTE format('
    CREATE POLICY "Public Read Access" ON storage.objects
    FOR SELECT USING (bucket_id = ''%I'');
    
    CREATE POLICY "Authenticated Upload" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = ''%I'' AND auth.role() = ''authenticated'');
  ', 'dogs', 'dogs');

  -- avatars bucket policies
  EXECUTE format('
    CREATE POLICY "Public Read Access" ON storage.objects
    FOR SELECT USING (bucket_id = ''%I'');
    
    CREATE POLICY "Authenticated Upload" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = ''%I'' AND auth.role() = ''authenticated'');
  ', 'avatars', 'avatars');

  -- groups bucket policies
  EXECUTE format('
    CREATE POLICY "Public Read Access" ON storage.objects
    FOR SELECT USING (bucket_id = ''%I'');
    
    CREATE POLICY "Authenticated Upload" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = ''%I'' AND auth.role() = ''authenticated'');
  ', 'groups', 'groups');

  -- marketplace bucket policies
  EXECUTE format('
    CREATE POLICY "Public Read Access" ON storage.objects
    FOR SELECT USING (bucket_id = ''%I'');
    
    CREATE POLICY "Authenticated Upload" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = ''%I'' AND auth.role() = ''authenticated'');
  ', 'marketplace', 'marketplace');

  -- certificates bucket policies
  EXECUTE format('
    CREATE POLICY "Public Read Access" ON storage.objects
    FOR SELECT USING (bucket_id = ''%I'');
    
    CREATE POLICY "Authenticated Upload" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = ''%I'' AND auth.role() = ''authenticated'');
  ', 'certificates', 'certificates');
END $$;