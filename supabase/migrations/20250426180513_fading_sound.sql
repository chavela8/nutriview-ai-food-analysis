/*
  # Добавление таблицы для инвентаризации холодильника

  1. Новая таблица
    - `inventory_items` - Продукты в холодильнике
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `name` (text)
      - `quantity` (float)
      - `unit` (text)
      - `category` (text)
      - `expiry_date` (date)
      - `created_at` (timestamptz)

  2. Безопасность
    - Включение RLS
    - Политики для управления своими продуктами
*/

-- Создание таблицы продуктов
CREATE TABLE inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  name text NOT NULL,
  quantity float NOT NULL,
  unit text NOT NULL,
  category text NOT NULL,
  expiry_date date,
  created_at timestamptz DEFAULT now()
);

-- Включение RLS
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

-- Политики для продуктов
CREATE POLICY "Users can view own inventory"
  ON inventory_items
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create inventory items"
  ON inventory_items
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own inventory"
  ON inventory_items
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own inventory"
  ON inventory_items
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());