/*
  # Storage Buckets Setup
  
  This migration creates the necessary storage buckets for the application:
  
  1. New Buckets
    - `dogmedia`: For storing dog-related media files (images, videos)
    - `dogs`: For storing dog profile images
    - `avatars`: For storing user profile images
    - `groups`: For storing group images
    - `marketplace`: For storing marketplace product images
    - `certificates`: For storing trainer certificates
    
  2. Security
    - Each bucket has public read access
    - Each bucket restricts uploads to authenticated users
    - File size limits and allowed MIME types are set appropriately
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

-- Create policies for dogmedia bucket using the correct approach
BEGIN;
-- Public read access for dogmedia
INSERT INTO storage.objects (bucket_id, name)
VALUES ('dogmedia', '.policies') 
ON CONFLICT (bucket_id, name) DO NOTHING;

UPDATE storage.objects
SET policy = '{"statement": [{"effect": "allow", "principal": "*", "action": "select", "resource": "object"}]}'::jsonb
WHERE bucket_id = 'dogmedia' AND name = '.policies';

-- Authenticated upload for dogmedia
INSERT INTO storage.objects (bucket_id, name)
VALUES ('dogmedia', '.policies.insert') 
ON CONFLICT (bucket_id, name) DO NOTHING;

UPDATE storage.objects
SET policy = '{"statement": [{"effect": "allow", "principal": {"id": "authenticated"}, "action": "insert", "resource": "object"}]}'::jsonb
WHERE bucket_id = 'dogmedia' AND name = '.policies.insert';
COMMIT;

-- Create policies for dogs bucket
BEGIN;
-- Public read access for dogs
INSERT INTO storage.objects (bucket_id, name)
VALUES ('dogs', '.policies') 
ON CONFLICT (bucket_id, name) DO NOTHING;

UPDATE storage.objects
SET policy = '{"statement": [{"effect": "allow", "principal": "*", "action": "select", "resource": "object"}]}'::jsonb
WHERE bucket_id = 'dogs' AND name = '.policies';

-- Authenticated upload for dogs
INSERT INTO storage.objects (bucket_id, name)
VALUES ('dogs', '.policies.insert') 
ON CONFLICT (bucket_id, name) DO NOTHING;

UPDATE storage.objects
SET policy = '{"statement": [{"effect": "allow", "principal": {"id": "authenticated"}, "action": "insert", "resource": "object"}]}'::jsonb
WHERE bucket_id = 'dogs' AND name = '.policies.insert';
COMMIT;

-- Create policies for avatars bucket
BEGIN;
-- Public read access for avatars
INSERT INTO storage.objects (bucket_id, name)
VALUES ('avatars', '.policies') 
ON CONFLICT (bucket_id, name) DO NOTHING;

UPDATE storage.objects
SET policy = '{"statement": [{"effect": "allow", "principal": "*", "action": "select", "resource": "object"}]}'::jsonb
WHERE bucket_id = 'avatars' AND name = '.policies';

-- Authenticated upload for avatars
INSERT INTO storage.objects (bucket_id, name)
VALUES ('avatars', '.policies.insert') 
ON CONFLICT (bucket_id, name) DO NOTHING;

UPDATE storage.objects
SET policy = '{"statement": [{"effect": "allow", "principal": {"id": "authenticated"}, "action": "insert", "resource": "object"}]}'::jsonb
WHERE bucket_id = 'avatars' AND name = '.policies.insert';
COMMIT;

-- Create policies for groups bucket
BEGIN;
-- Public read access for groups
INSERT INTO storage.objects (bucket_id, name)
VALUES ('groups', '.policies') 
ON CONFLICT (bucket_id, name) DO NOTHING;

UPDATE storage.objects
SET policy = '{"statement": [{"effect": "allow", "principal": "*", "action": "select", "resource": "object"}]}'::jsonb
WHERE bucket_id = 'groups' AND name = '.policies';

-- Authenticated upload for groups
INSERT INTO storage.objects (bucket_id, name)
VALUES ('groups', '.policies.insert') 
ON CONFLICT (bucket_id, name) DO NOTHING;

UPDATE storage.objects
SET policy = '{"statement": [{"effect": "allow", "principal": {"id": "authenticated"}, "action": "insert", "resource": "object"}]}'::jsonb
WHERE bucket_id = 'groups' AND name = '.policies.insert';
COMMIT;

-- Create policies for marketplace bucket
BEGIN;
-- Public read access for marketplace
INSERT INTO storage.objects (bucket_id, name)
VALUES ('marketplace', '.policies') 
ON CONFLICT (bucket_id, name) DO NOTHING;

UPDATE storage.objects
SET policy = '{"statement": [{"effect": "allow", "principal": "*", "action": "select", "resource": "object"}]}'::jsonb
WHERE bucket_id = 'marketplace' AND name = '.policies';

-- Authenticated upload for marketplace
INSERT INTO storage.objects (bucket_id, name)
VALUES ('marketplace', '.policies.insert') 
ON CONFLICT (bucket_id, name) DO NOTHING;

UPDATE storage.objects
SET policy = '{"statement": [{"effect": "allow", "principal": {"id": "authenticated"}, "action": "insert", "resource": "object"}]}'::jsonb
WHERE bucket_id = 'marketplace' AND name = '.policies.insert';
COMMIT;

-- Create policies for certificates bucket
BEGIN;
-- Public read access for certificates
INSERT INTO storage.objects (bucket_id, name)
VALUES ('certificates', '.policies') 
ON CONFLICT (bucket_id, name) DO NOTHING;

UPDATE storage.objects
SET policy = '{"statement": [{"effect": "allow", "principal": "*", "action": "select", "resource": "object"}]}'::jsonb
WHERE bucket_id = 'certificates' AND name = '.policies';

-- Authenticated upload for certificates
INSERT INTO storage.objects (bucket_id, name)
VALUES ('certificates', '.policies.insert') 
ON CONFLICT (bucket_id, name) DO NOTHING;

UPDATE storage.objects
SET policy = '{"statement": [{"effect": "allow", "principal": {"id": "authenticated"}, "action": "insert", "resource": "object"}]}'::jsonb
WHERE bucket_id = 'certificates' AND name = '.policies.insert';
COMMIT;