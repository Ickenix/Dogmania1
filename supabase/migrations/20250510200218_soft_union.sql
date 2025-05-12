/*
  # Marketplace Tables Migration

  1. New Tables
    - marketplace_listings (product listings)
    - marketplace_favorites (user favorites)
    - marketplace_messages (user communication)
  
  2. Security
    - RLS enabled on all tables
    - Policies for CRUD operations
  
  3. Features
    - Full text search
    - Indexes for performance
    - Automatic updated_at timestamps
*/

-- Create marketplace_listings table
CREATE TABLE IF NOT EXISTS marketplace_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL,
  category text NOT NULL,
  condition text CHECK (condition IN ('new', 'like_new', 'good', 'fair', 'poor')),
  location text,
  contact_info text,
  images text[] DEFAULT '{}',
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create marketplace_favorites table
CREATE TABLE IF NOT EXISTS marketplace_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  listing_id uuid REFERENCES marketplace_listings(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, listing_id)
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

-- Enable RLS
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Anyone can view available listings" ON marketplace_listings;
  DROP POLICY IF EXISTS "Users can create their own listings" ON marketplace_listings;
  DROP POLICY IF EXISTS "Users can update their own listings" ON marketplace_listings;
  DROP POLICY IF EXISTS "Users can delete their own listings" ON marketplace_listings;
  DROP POLICY IF EXISTS "Users can view their own favorites" ON marketplace_favorites;
  DROP POLICY IF EXISTS "Users can add favorites" ON marketplace_favorites;
  DROP POLICY IF EXISTS "Users can remove their favorites" ON marketplace_favorites;
  DROP POLICY IF EXISTS "Users can view their own messages" ON marketplace_messages;
  DROP POLICY IF EXISTS "Users can send messages" ON marketplace_messages;
  DROP POLICY IF EXISTS "Recipients can mark messages as read" ON marketplace_messages;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

-- Listings policies
CREATE POLICY "Anyone can view available listings"
  ON marketplace_listings
  FOR SELECT
  USING (is_available = true);

CREATE POLICY "Users can create their own listings"
  ON marketplace_listings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own listings"
  ON marketplace_listings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own listings"
  ON marketplace_listings
  FOR DELETE
  USING (auth.uid() = user_id);

-- Favorites policies
CREATE POLICY "Users can view their own favorites"
  ON marketplace_favorites
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites"
  ON marketplace_favorites
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their favorites"
  ON marketplace_favorites
  FOR DELETE
  USING (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Users can view their own messages"
  ON marketplace_messages
  FOR SELECT
  USING (auth.uid() IN (sender_id, recipient_id));

CREATE POLICY "Users can send messages"
  ON marketplace_messages
  FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Recipients can mark messages as read"
  ON marketplace_messages
  FOR UPDATE
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_user_id ON marketplace_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_category ON marketplace_listings(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_price ON marketplace_listings(price);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_created_at ON marketplace_listings(created_at);

-- Add full text search
ALTER TABLE marketplace_listings ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('german', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('german', coalesce(description, '')), 'B')
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_marketplace_listings_fts ON marketplace_listings USING gin(fts);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_marketplace_listings_updated_at
  BEFORE UPDATE ON marketplace_listings
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();