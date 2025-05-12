/*
  # Create Storage Buckets

  1. New Storage Buckets
    - `dogmedia`: For storing dog-related media files
    - `dogs`: For storing dog profile images
    - `avatars`: For storing user avatar images
    - `groups`: For storing group-related media
    - `marketplace`: For storing marketplace listing images
    - `certificates`: For storing trainer certificates and documents
  
  2. Security
    - Public read access for all buckets
    - Authenticated upload access for all buckets
    - 10MB file size limit
    - Restricted MIME types to images, videos, and PDFs
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

-- Create policies for dogmedia bucket
INSERT INTO storage.policies (name, definition, bucket_id)
VALUES 
  ('Public Read Access', 
   '{"statement": {"effect": "allow", "principal": "*", "action": "select", "resource": "object"}}',
   'dogmedia'),
  ('Authenticated Upload', 
   '{"statement": {"effect": "allow", "principal": {"id": "authenticated"}, "action": "insert", "resource": "object"}}',
   'dogmedia')
ON CONFLICT DO NOTHING;

-- Create policies for dogs bucket
INSERT INTO storage.policies (name, definition, bucket_id)
VALUES 
  ('Public Read Access', 
   '{"statement": {"effect": "allow", "principal": "*", "action": "select", "resource": "object"}}',
   'dogs'),
  ('Authenticated Upload', 
   '{"statement": {"effect": "allow", "principal": {"id": "authenticated"}, "action": "insert", "resource": "object"}}',
   'dogs')
ON CONFLICT DO NOTHING;

-- Create policies for avatars bucket
INSERT INTO storage.policies (name, definition, bucket_id)
VALUES 
  ('Public Read Access', 
   '{"statement": {"effect": "allow", "principal": "*", "action": "select", "resource": "object"}}',
   'avatars'),
  ('Authenticated Upload', 
   '{"statement": {"effect": "allow", "principal": {"id": "authenticated"}, "action": "insert", "resource": "object"}}',
   'avatars')
ON CONFLICT DO NOTHING;

-- Create policies for groups bucket
INSERT INTO storage.policies (name, definition, bucket_id)
VALUES 
  ('Public Read Access', 
   '{"statement": {"effect": "allow", "principal": "*", "action": "select", "resource": "object"}}',
   'groups'),
  ('Authenticated Upload', 
   '{"statement": {"effect": "allow", "principal": {"id": "authenticated"}, "action": "insert", "resource": "object"}}',
   'groups')
ON CONFLICT DO NOTHING;

-- Create policies for marketplace bucket
INSERT INTO storage.policies (name, definition, bucket_id)
VALUES 
  ('Public Read Access', 
   '{"statement": {"effect": "allow", "principal": "*", "action": "select", "resource": "object"}}',
   'marketplace'),
  ('Authenticated Upload', 
   '{"statement": {"effect": "allow", "principal": {"id": "authenticated"}, "action": "insert", "resource": "object"}}',
   'marketplace')
ON CONFLICT DO NOTHING;

-- Create policies for certificates bucket
INSERT INTO storage.policies (name, definition, bucket_id)
VALUES 
  ('Public Read Access', 
   '{"statement": {"effect": "allow", "principal": "*", "action": "select", "resource": "object"}}',
   'certificates'),
  ('Authenticated Upload', 
   '{"statement": {"effect": "allow", "principal": {"id": "authenticated"}, "action": "insert", "resource": "object"}}',
   'certificates')
ON CONFLICT DO NOTHING;