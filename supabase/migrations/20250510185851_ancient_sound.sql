/*
  # Marketplace Schema

  1. New Tables
    - marketplace_categories: Product categories with optional parent category
    - marketplace_products: Main product listings
    - marketplace_images: Product images with primary flag
    - marketplace_messages: Communication between buyers and sellers
    - marketplace_reviews: Product and seller reviews
    - marketplace_favorites: User's favorite products

  2. Security
    - RLS enabled on all tables
    - Public read access for categories and active products
    - Sellers can manage their own products and images
    - Users can manage their own messages, reviews, and favorites

  3. Constraints
    - Product conditions: new, like_new, good, fair, poor
    - Product status: active, sold, reserved, inactive
    - Review ratings: 1-5
    - Unique constraints on favorites and reviews
*/

-- Create marketplace_categories table
CREATE TABLE IF NOT EXISTS marketplace_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  parent_id uuid REFERENCES marketplace_categories(id),
  icon text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create marketplace_products table
CREATE TABLE IF NOT EXISTS marketplace_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  price numeric NOT NULL,
  category_id uuid REFERENCES marketplace_categories(id) ON DELETE SET NULL,
  condition text,
  location text,
  is_service boolean DEFAULT false,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT marketplace_products_condition_check CHECK (
    condition = ANY (ARRAY['new', 'like_new', 'good', 'fair', 'poor'])
  ),
  CONSTRAINT marketplace_products_status_check CHECK (
    status = ANY (ARRAY['active', 'sold', 'reserved', 'inactive'])
  )
);

-- Create marketplace_images table
CREATE TABLE IF NOT EXISTS marketplace_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES marketplace_products(id) ON DELETE CASCADE NOT NULL,
  image_url text NOT NULL,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create marketplace_messages table
CREATE TABLE IF NOT EXISTS marketplace_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES marketplace_products(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  recipient_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create marketplace_reviews table
CREATE TABLE IF NOT EXISTS marketplace_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES marketplace_products(id) ON DELETE CASCADE NOT NULL,
  reviewer_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  seller_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(product_id, reviewer_id)
);

-- Create marketplace_favorites table
CREATE TABLE IF NOT EXISTS marketplace_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES marketplace_products(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Enable Row Level Security
DO $$ 
BEGIN
  ALTER TABLE marketplace_categories ENABLE ROW LEVEL SECURITY;
  ALTER TABLE marketplace_products ENABLE ROW LEVEL SECURITY;
  ALTER TABLE marketplace_images ENABLE ROW LEVEL SECURITY;
  ALTER TABLE marketplace_messages ENABLE ROW LEVEL SECURITY;
  ALTER TABLE marketplace_reviews ENABLE ROW LEVEL SECURITY;
  ALTER TABLE marketplace_favorites ENABLE ROW LEVEL SECURITY;
END $$;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Jeder kann Kategorien lesen" ON marketplace_categories;
  DROP POLICY IF EXISTS "Jeder kann aktive Produkte lesen" ON marketplace_products;
  DROP POLICY IF EXISTS "Verkäufer können ihre eigenen Produkte erstellen" ON marketplace_products;
  DROP POLICY IF EXISTS "Verkäufer können ihre eigenen Produkte aktualisieren" ON marketplace_products;
  DROP POLICY IF EXISTS "Verkäufer können ihre eigenen Produkte löschen" ON marketplace_products;
  DROP POLICY IF EXISTS "Jeder kann Produktbilder sehen" ON marketplace_images;
  DROP POLICY IF EXISTS "Verkäufer können Bilder zu ihren Produkten hinzufügen" ON marketplace_images;
  DROP POLICY IF EXISTS "Verkäufer können Bilder ihrer Produkte aktualisieren" ON marketplace_images;
  DROP POLICY IF EXISTS "Verkäufer können Bilder ihrer Produkte löschen" ON marketplace_images;
  DROP POLICY IF EXISTS "Users can view messages they're part of" ON marketplace_messages;
  DROP POLICY IF EXISTS "Users can send messages" ON marketplace_messages;
  DROP POLICY IF EXISTS "Users can mark messages as read" ON marketplace_messages;
  DROP POLICY IF EXISTS "Jeder kann Bewertungen lesen" ON marketplace_reviews;
  DROP POLICY IF EXISTS "Käufer können Bewertungen erstellen" ON marketplace_reviews;
  DROP POLICY IF EXISTS "Users can view their own favorites" ON marketplace_favorites;
  DROP POLICY IF EXISTS "Users can insert their own favorites" ON marketplace_favorites;
  DROP POLICY IF EXISTS "Users can delete their own favorites" ON marketplace_favorites;
END $$;

-- Create new policies
CREATE POLICY "marketplace_categories_select_policy"
  ON marketplace_categories FOR SELECT
  TO public
  USING (true);

CREATE POLICY "marketplace_products_select_policy"
  ON marketplace_products FOR SELECT
  TO public
  USING (status = 'active' OR seller_id = auth.uid());

CREATE POLICY "marketplace_products_insert_policy"
  ON marketplace_products FOR INSERT
  TO public
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "marketplace_products_update_policy"
  ON marketplace_products FOR UPDATE
  TO public
  USING (auth.uid() = seller_id);

CREATE POLICY "marketplace_products_delete_policy"
  ON marketplace_products FOR DELETE
  TO public
  USING (auth.uid() = seller_id);

CREATE POLICY "marketplace_images_select_policy"
  ON marketplace_images FOR SELECT
  TO public
  USING (true);

CREATE POLICY "marketplace_images_insert_policy"
  ON marketplace_images FOR INSERT
  TO public
  WITH CHECK (EXISTS (
    SELECT 1 FROM marketplace_products
    WHERE marketplace_products.id = product_id
    AND marketplace_products.seller_id = auth.uid()
  ));

CREATE POLICY "marketplace_images_update_policy"
  ON marketplace_images FOR UPDATE
  TO public
  USING (EXISTS (
    SELECT 1 FROM marketplace_products
    WHERE marketplace_products.id = product_id
    AND marketplace_products.seller_id = auth.uid()
  ));

CREATE POLICY "marketplace_images_delete_policy"
  ON marketplace_images FOR DELETE
  TO public
  USING (EXISTS (
    SELECT 1 FROM marketplace_products
    WHERE marketplace_products.id = product_id
    AND marketplace_products.seller_id = auth.uid()
  ));

CREATE POLICY "marketplace_messages_select_policy"
  ON marketplace_messages FOR SELECT
  TO public
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "marketplace_messages_insert_policy"
  ON marketplace_messages FOR INSERT
  TO public
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "marketplace_messages_update_policy"
  ON marketplace_messages FOR UPDATE
  TO public
  USING (auth.uid() = recipient_id);

CREATE POLICY "marketplace_reviews_select_policy"
  ON marketplace_reviews FOR SELECT
  TO public
  USING (true);

CREATE POLICY "marketplace_reviews_insert_policy"
  ON marketplace_reviews FOR INSERT
  TO public
  WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "marketplace_favorites_select_policy"
  ON marketplace_favorites FOR SELECT
  TO public
  USING (auth.uid() = user_id);

CREATE POLICY "marketplace_favorites_insert_policy"
  ON marketplace_favorites FOR INSERT
  TO public
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "marketplace_favorites_delete_policy"
  ON marketplace_favorites FOR DELETE
  TO public
  USING (auth.uid() = user_id);