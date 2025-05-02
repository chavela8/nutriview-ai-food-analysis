/*
  # Initial schema setup for NutriView AI

  1. Tables
    - users
      - id (uuid, primary key)
      - email (text)
      - full_name (text)
      - avatar_url (text)
      - preferences (jsonb)
      - created_at (timestamp)
      
    - food_items
      - id (uuid)
      - name (text)
      - calories (integer)
      - protein (float)
      - carbs (float)
      - fat (float)
      - user_id (uuid, foreign key)
      - image_url (text)
      - created_at (timestamp)
      
    - meal_logs
      - id (uuid)
      - user_id (uuid)
      - food_item_id (uuid)
      - meal_type (text)
      - portion_size (float)
      - eaten_at (timestamp)
      - created_at (timestamp)
      
    - water_logs
      - id (uuid)
      - user_id (uuid)
      - amount (integer)
      - logged_at (timestamp)
      - created_at (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create users table
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  preferences jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create food_items table
CREATE TABLE food_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  calories integer NOT NULL,
  protein float NOT NULL,
  carbs float NOT NULL,
  fat float NOT NULL,
  user_id uuid REFERENCES users(id),
  image_url text,
  created_at timestamptz DEFAULT now()
);

-- Create meal_logs table
CREATE TABLE meal_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  food_item_id uuid REFERENCES food_items(id) NOT NULL,
  meal_type text NOT NULL,
  portion_size float DEFAULT 1.0,
  eaten_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create water_logs table
CREATE TABLE water_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  amount integer NOT NULL,
  logged_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can view own food items"
  ON food_items
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create food items"
  ON food_items
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own meal logs"
  ON meal_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create meal logs"
  ON meal_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own water logs"
  ON water_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create water logs"
  ON water_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());