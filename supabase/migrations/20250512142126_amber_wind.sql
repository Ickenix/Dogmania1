/*
  # Dog Journal Schema
  
  1. New Table
    - `dog_journals`: Stores diary entries for dogs
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `dog_id` (uuid, references dogs)
      - `date` (date)
      - `category` (text)
      - `title` (text)
      - `content` (text)
      - `mood` (text)
      - `photo_url` (text)
      - `location` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Security
    - Enable RLS
    - Add policies for user access control
*/

-- Create dog_journals table
CREATE TABLE IF NOT EXISTS dog_journals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  dog_id uuid REFERENCES dogs(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  category text NOT NULL,
  title text NOT NULL,
  content text,
  mood text,
  photo_url text,
  location text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE dog_journals ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own dog journals"
  ON dog_journals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own dog journals"
  ON dog_journals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dog journals"
  ON dog_journals FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dog journals"
  ON dog_journals FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_dog_journals_user_id ON dog_journals(user_id);
CREATE INDEX idx_dog_journals_dog_id ON dog_journals(dog_id);
CREATE INDEX idx_dog_journals_date ON dog_journals(date);
CREATE INDEX idx_dog_journals_category ON dog_journals(category);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_dog_journals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER set_dog_journals_updated_at
  BEFORE UPDATE ON dog_journals
  FOR EACH ROW
  EXECUTE FUNCTION update_dog_journals_updated_at();