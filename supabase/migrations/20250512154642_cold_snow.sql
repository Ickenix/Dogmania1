/*
  # Dog Health Records Schema

  1. New Tables
    - `dog_vaccinations` - Track dog vaccination records
    - `dog_medications` - Track dog medication records
    - `dog_health_records` - Track general health records and vet visits
    - `dog_weight_history` - Track dog weight over time
  
  2. Security
    - Enable RLS on all tables
    - Add policies to ensure owners can only manage their own dogs' records
    
  3. Changes
    - Add foreign key relationships to dogs table
*/

-- Create dog_vaccinations table if it doesn't exist
CREATE TABLE IF NOT EXISTS dog_vaccinations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  dog_id uuid NOT NULL,
  name varchar(100) NOT NULL,
  date date NOT NULL,
  expiry_date date,
  vet_name varchar(100),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  FOREIGN KEY (dog_id) REFERENCES dogs(id) ON DELETE CASCADE
);

-- Create dog_medications table if it doesn't exist
CREATE TABLE IF NOT EXISTS dog_medications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  dog_id uuid NOT NULL,
  name varchar(100) NOT NULL,
  dosage varchar(100) NOT NULL,
  frequency varchar(100) NOT NULL,
  start_date date NOT NULL,
  end_date date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  FOREIGN KEY (dog_id) REFERENCES dogs(id) ON DELETE CASCADE
);

-- Create dog_health_records table if it doesn't exist
CREATE TABLE IF NOT EXISTS dog_health_records (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  dog_id uuid NOT NULL,
  type varchar(50) NOT NULL,
  date date NOT NULL,
  title varchar(100) NOT NULL,
  description text,
  vet_name varchar(100),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  FOREIGN KEY (dog_id) REFERENCES dogs(id) ON DELETE CASCADE
);

-- Create dog_weight_history table if it doesn't exist
CREATE TABLE IF NOT EXISTS dog_weight_history (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  dog_id uuid NOT NULL,
  weight numeric(5,2) NOT NULL,
  date date NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  FOREIGN KEY (dog_id) REFERENCES dogs(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE dog_vaccinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE dog_medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE dog_health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE dog_weight_history ENABLE ROW LEVEL SECURITY;

-- Create policies for dog_vaccinations
CREATE POLICY dog_vaccinations_select_policy ON dog_vaccinations
  FOR SELECT TO public
  USING (dog_id IN (SELECT id FROM dogs WHERE owner_id = auth.uid()));

CREATE POLICY dog_vaccinations_insert_policy ON dog_vaccinations
  FOR INSERT TO public
  WITH CHECK (dog_id IN (SELECT id FROM dogs WHERE owner_id = auth.uid()));

CREATE POLICY dog_vaccinations_update_policy ON dog_vaccinations
  FOR UPDATE TO public
  USING (dog_id IN (SELECT id FROM dogs WHERE owner_id = auth.uid()));

CREATE POLICY dog_vaccinations_delete_policy ON dog_vaccinations
  FOR DELETE TO public
  USING (dog_id IN (SELECT id FROM dogs WHERE owner_id = auth.uid()));

-- Create policies for dog_medications
CREATE POLICY dog_medications_select_policy ON dog_medications
  FOR SELECT TO public
  USING (dog_id IN (SELECT id FROM dogs WHERE owner_id = auth.uid()));

CREATE POLICY dog_medications_insert_policy ON dog_medications
  FOR INSERT TO public
  WITH CHECK (dog_id IN (SELECT id FROM dogs WHERE owner_id = auth.uid()));

CREATE POLICY dog_medications_update_policy ON dog_medications
  FOR UPDATE TO public
  USING (dog_id IN (SELECT id FROM dogs WHERE owner_id = auth.uid()));

CREATE POLICY dog_medications_delete_policy ON dog_medications
  FOR DELETE TO public
  USING (dog_id IN (SELECT id FROM dogs WHERE owner_id = auth.uid()));

-- Create policies for dog_health_records
CREATE POLICY dog_health_records_select_policy ON dog_health_records
  FOR SELECT TO public
  USING (dog_id IN (SELECT id FROM dogs WHERE owner_id = auth.uid()));

CREATE POLICY dog_health_records_insert_policy ON dog_health_records
  FOR INSERT TO public
  WITH CHECK (dog_id IN (SELECT id FROM dogs WHERE owner_id = auth.uid()));

CREATE POLICY dog_health_records_update_policy ON dog_health_records
  FOR UPDATE TO public
  USING (dog_id IN (SELECT id FROM dogs WHERE owner_id = auth.uid()));

CREATE POLICY dog_health_records_delete_policy ON dog_health_records
  FOR DELETE TO public
  USING (dog_id IN (SELECT id FROM dogs WHERE owner_id = auth.uid()));

-- Create policies for dog_weight_history
CREATE POLICY dog_weight_history_select_policy ON dog_weight_history
  FOR SELECT TO public
  USING (dog_id IN (SELECT id FROM dogs WHERE owner_id = auth.uid()));

CREATE POLICY dog_weight_history_insert_policy ON dog_weight_history
  FOR INSERT TO public
  WITH CHECK (dog_id IN (SELECT id FROM dogs WHERE owner_id = auth.uid()));

CREATE POLICY dog_weight_history_update_policy ON dog_weight_history
  FOR UPDATE TO public
  USING (dog_id IN (SELECT id FROM dogs WHERE owner_id = auth.uid()));

CREATE POLICY dog_weight_history_delete_policy ON dog_weight_history
  FOR DELETE TO public
  USING (dog_id IN (SELECT id FROM dogs WHERE owner_id = auth.uid()));