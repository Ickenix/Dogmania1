/*
  # Premium Features Schema

  1. Changes
    - Add premium_until to profiles table
    - Add subscription_status to profiles table
    - Add stripe_customer_id to profiles table
    - Add policies for premium content access
*/

-- Add premium-related columns to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS premium_until timestamptz,
ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'free' CHECK (subscription_status IN ('free', 'premium')),
ADD COLUMN IF NOT EXISTS stripe_customer_id text;

-- Add premium flag to courses
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS is_premium boolean DEFAULT false;

-- Create subscription_plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL,
  interval text NOT NULL CHECK (interval IN ('month', 'year')),
  stripe_price_id text NOT NULL,
  features jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

-- Create subscription_history table
CREATE TABLE IF NOT EXISTS subscription_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id uuid REFERENCES subscription_plans(id) ON DELETE SET NULL,
  stripe_subscription_id text,
  status text NOT NULL CHECK (status IN ('active', 'cancelled', 'expired')),
  start_date timestamptz NOT NULL,
  end_date timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view subscription plans"
  ON subscription_plans FOR SELECT
  USING (true);

CREATE POLICY "Users can view their subscription history"
  ON subscription_history FOR SELECT
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_subscription_history_user ON subscription_history(user_id);
CREATE INDEX idx_subscription_history_status ON subscription_history(status);

-- Insert default subscription plans
INSERT INTO subscription_plans (name, description, price, interval, stripe_price_id, features) VALUES
('Premium Monthly', 'Monatlicher Premium-Zugang', 9.99, 'month', 'price_monthly', '[
  "Zugang zu allen Premium-Kursen",
  "Unbegrenzte Trainerbuchungen",
  "Erweiterte Community-Features",
  "Prioritäts-Support"
]'::jsonb),
('Premium Yearly', 'Jährlicher Premium-Zugang', 99.99, 'year', 'price_yearly', '[
  "Zugang zu allen Premium-Kursen",
  "Unbegrenzte Trainerbuchungen",
  "Erweiterte Community-Features",
  "Prioritäts-Support",
  "2 Monate gratis"
]'::jsonb);