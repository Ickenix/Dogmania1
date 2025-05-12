/*
  # Marketplace Tables Migration

  1. New Tables
    - marketplace_listings
    - marketplace_reports
    - marketplace_messages
    - marketplace_favorites
  
  2. Security
    - RLS enabled on all tables
    - Policies for CRUD operations
*/

-- Create marketplace_listings table
CREATE TABLE IF NOT EXISTS marketplace_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  price numeric(10,2) NOT NULL,
  category text NOT NULL,
  condition text CHECK (condition IN ('new', 'like_new', 'good', 'fair', 'poor')),
  location text,
  contact_info text,
  images text[] DEFAULT '{}',
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  fts tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('german', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('german', coalesce(description, '')), 'B')
  ) STORED
);

-- Create marketplace_reports table
CREATE TABLE IF NOT EXISTS marketplace_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES marketplace_listings(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reason text NOT NULL,
  description text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
  created_at timestamptz DEFAULT now()
);

-- Create marketplace_messages table
CREATE TABLE IF NOT EXISTS marketplace_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES marketplace_listings(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipient_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create marketplace_favorites table
CREATE TABLE IF NOT EXISTS marketplace_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  listing_id uuid REFERENCES marketplace_listings(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, listing_id)
);

-- Enable RLS
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_favorites ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_fts ON marketplace_listings USING gin(fts);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_category ON marketplace_listings(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_price ON marketplace_listings(price);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_created_at ON marketplace_listings(created_at);

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "marketplace_listings_select_policy" ON marketplace_listings;
  DROP POLICY IF EXISTS "marketplace_listings_insert_policy" ON marketplace_listings;
  DROP POLICY IF EXISTS "marketplace_listings_update_policy" ON marketplace_listings;
  DROP POLICY IF EXISTS "marketplace_listings_delete_policy" ON marketplace_listings;
  DROP POLICY IF EXISTS "marketplace_reports_insert_policy" ON marketplace_reports;
  DROP POLICY IF EXISTS "marketplace_reports_select_policy" ON marketplace_reports;
  DROP POLICY IF EXISTS "marketplace_messages_select_policy" ON marketplace_messages;
  DROP POLICY IF EXISTS "marketplace_messages_insert_policy" ON marketplace_messages;
  DROP POLICY IF EXISTS "marketplace_messages_update_policy" ON marketplace_messages;
  DROP POLICY IF EXISTS "marketplace_favorites_select_policy" ON marketplace_favorites;
  DROP POLICY IF EXISTS "marketplace_favorites_insert_policy" ON marketplace_favorites;
  DROP POLICY IF EXISTS "marketplace_favorites_delete_policy" ON marketplace_favorites;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create new policies

-- Listings policies
CREATE POLICY "marketplace_listings_select_policy"
  ON marketplace_listings FOR SELECT
  USING (is_available = true);

CREATE POLICY "marketplace_listings_insert_policy"
  ON marketplace_listings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "marketplace_listings_update_policy"
  ON marketplace_listings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "marketplace_listings_delete_policy"
  ON marketplace_listings FOR DELETE
  USING (auth.uid() = user_id);

-- Reports policies
CREATE POLICY "marketplace_reports_insert_policy"
  ON marketplace_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "marketplace_reports_select_policy"
  ON marketplace_reports FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  ));

-- Messages policies
CREATE POLICY "marketplace_messages_select_policy"
  ON marketplace_messages FOR SELECT
  USING (auth.uid() IN (sender_id, recipient_id));

CREATE POLICY "marketplace_messages_insert_policy"
  ON marketplace_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "marketplace_messages_update_policy"
  ON marketplace_messages FOR UPDATE
  USING (auth.uid() = recipient_id);

-- Favorites policies
CREATE POLICY "marketplace_favorites_select_policy"
  ON marketplace_favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "marketplace_favorites_insert_policy"
  ON marketplace_favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "marketplace_favorites_delete_policy"
  ON marketplace_favorites FOR DELETE
  USING (auth.uid() = user_id);