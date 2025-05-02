/*
  # Добавление таблиц для планировщика питания

  1. Новые таблицы
    - `meal_plans` - Планы питания
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `name` (text)
      - `start_date` (date)
      - `end_date` (date)
      - `created_at` (timestamptz)
    
    - `planned_meals` - Запланированные приемы пищи
      - `id` (uuid, primary key)
      - `meal_plan_id` (uuid, foreign key)
      - `recipe_id` (uuid, foreign key, optional)
      - `food_item_id` (uuid, foreign key, optional)
      - `meal_type` (text)
      - `planned_for` (timestamptz)
      - `servings` (float)
      - `notes` (text)

  2. Безопасность
    - Включение RLS для обеих таблиц
    - Политики для управления своими планами питания
*/

-- Создание таблицы планов питания
CREATE TABLE meal_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Создание таблицы запланированных приемов пищи
CREATE TABLE planned_meals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_id uuid REFERENCES meal_plans(id) ON DELETE CASCADE NOT NULL,
  recipe_id uuid REFERENCES recipes(id),
  food_item_id uuid REFERENCES food_items(id),
  meal_type text NOT NULL,
  planned_for timestamptz NOT NULL,
  servings float DEFAULT 1.0,
  notes text,
  created_at timestamptz DEFAULT now(),
  -- Проверка: должен быть указан либо рецепт, либо продукт
  CONSTRAINT meal_source_check CHECK (
    (recipe_id IS NOT NULL AND food_item_id IS NULL) OR
    (recipe_id IS NULL AND food_item_id IS NOT NULL)
  )
);

-- Включение RLS
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE planned_meals ENABLE ROW LEVEL SECURITY;

-- Политики для планов питания
CREATE POLICY "Users can view own meal plans"
  ON meal_plans
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create meal plans"
  ON meal_plans
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own meal plans"
  ON meal_plans
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own meal plans"
  ON meal_plans
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Политики для запланированных приемов пищи
CREATE POLICY "Users can view own planned meals"
  ON planned_meals
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM meal_plans
      WHERE meal_plans.id = planned_meals.meal_plan_id
      AND meal_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage planned meals"
  ON planned_meals
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM meal_plans
      WHERE meal_plans.id = planned_meals.meal_plan_id
      AND meal_plans.user_id = auth.uid()
    )
  );