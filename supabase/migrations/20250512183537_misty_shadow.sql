/*
  # Create storage buckets

  1. New Storage Buckets
    - dogmedia: For storing dog-related media files
    - dogs: For storing dog profile images
    - avatars: For storing user avatar images
    - groups: For storing group-related media
    - marketplace: For storing marketplace listing images
    - certificates: For storing trainer certificates and documents

  2. Security
    - Enable public access for viewing files
    - Restrict file uploads to authenticated users
    - Set appropriate file size limits and allowed MIME types
*/

-- Create dogmedia bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('dogmedia', 'dogmedia', true)
ON CONFLICT (id) DO NOTHING;

-- Set CORS and security policies for dogmedia
INSERT INTO storage.policies (bucket_id, name, definition)
VALUES
  ('dogmedia', 'Public Read Access',
    '{"statement": {"effect": "allow", "principal": "*", "action": ["select"], "resource": ["dogmedia/*"]}}'),
  ('dogmedia', 'Authenticated Upload',
    '{"statement": {"effect": "allow", "principal": {"type": "user"}, "action": ["insert"], "resource": ["dogmedia/*"]}}')
ON CONFLICT DO NOTHING;

-- Create dogs bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('dogs', 'dogs', true)
ON CONFLICT (id) DO NOTHING;

-- Set CORS and security policies for dogs
INSERT INTO storage.policies (bucket_id, name, definition)
VALUES
  ('dogs', 'Public Read Access',
    '{"statement": {"effect": "allow", "principal": "*", "action": ["select"], "resource": ["dogs/*"]}}'),
  ('dogs', 'Authenticated Upload',
    '{"statement": {"effect": "allow", "principal": {"type": "user"}, "action": ["insert"], "resource": ["dogs/*"]}}')
ON CONFLICT DO NOTHING;

-- Create avatars bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Set CORS and security policies for avatars
INSERT INTO storage.policies (bucket_id, name, definition)
VALUES
  ('avatars', 'Public Read Access',
    '{"statement": {"effect": "allow", "principal": "*", "action": ["select"], "resource": ["avatars/*"]}}'),
  ('avatars', 'Authenticated Upload',
    '{"statement": {"effect": "allow", "principal": {"type": "user"}, "action": ["insert"], "resource": ["avatars/*"]}}')
ON CONFLICT DO NOTHING;

-- Create groups bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('groups', 'groups', true)
ON CONFLICT (id) DO NOTHING;

-- Set CORS and security policies for groups
INSERT INTO storage.policies (bucket_id, name, definition)
VALUES
  ('groups', 'Public Read Access',
    '{"statement": {"effect": "allow", "principal": "*", "action": ["select"], "resource": ["groups/*"]}}'),
  ('groups', 'Authenticated Upload',
    '{"statement": {"effect": "allow", "principal": {"type": "user"}, "action": ["insert"], "resource": ["groups/*"]}}')
ON CONFLICT DO NOTHING;

-- Create marketplace bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('marketplace', 'marketplace', true)
ON CONFLICT (id) DO NOTHING;

-- Set CORS and security policies for marketplace
INSERT INTO storage.policies (bucket_id, name, definition)
VALUES
  ('marketplace', 'Public Read Access',
    '{"statement": {"effect": "allow", "principal": "*", "action": ["select"], "resource": ["marketplace/*"]}}'),
  ('marketplace', 'Authenticated Upload',
    '{"statement": {"effect": "allow", "principal": {"type": "user"}, "action": ["insert"], "resource": ["marketplace/*"]}}')
ON CONFLICT DO NOTHING;

-- Create certificates bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('certificates', 'certificates', true)
ON CONFLICT (id) DO NOTHING;

-- Set CORS and security policies for certificates
INSERT INTO storage.policies (bucket_id, name, definition)
VALUES
  ('certificates', 'Public Read Access',
    '{"statement": {"effect": "allow", "principal": "*", "action": ["select"], "resource": ["certificates/*"]}}'),
  ('certificates', 'Authenticated Upload',
    '{"statement": {"effect": "allow", "principal": {"type": "user"}, "action": ["insert"], "resource": ["certificates/*"]}}')
ON CONFLICT DO NOTHING;

-- Set file size limits and allowed MIME types for all buckets
UPDATE storage.buckets
SET file_size_limit = 10485760, -- 10MB
    allowed_mime_types = ARRAY[
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/webm',
      'application/pdf'
    ]
WHERE id IN ('dogmedia', 'dogs', 'avatars', 'groups', 'marketplace', 'certificates');