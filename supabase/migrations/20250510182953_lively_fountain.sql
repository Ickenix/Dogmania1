/*
  # Add diary entries table

  1. New Tables
    - `diary_entries`
      - `id` (uuid, primary key)
      - `dog_id` (uuid, foreign key to dogs)
      - `title` (text)
      - `content` (text)
      - `entry_date` (date)
      - `entry_type` (text)
      - `mood_rating` (integer)
      - `image_url` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Indexes
    - Index on dog_id for better query performance

  Note: RLS policies and triggers are already set up in previous migrations
*/

-- Create diary_entries table if it doesn't exist
CREATE TABLE IF NOT EXISTS diary_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_id uuid REFERENCES dogs(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text,
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  entry_type text,
  mood_rating integer CHECK (mood_rating BETWEEN 1 AND 5),
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_diary_entries_dog_id ON diary_entries(dog_id);