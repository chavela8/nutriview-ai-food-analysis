/*
  # Добавление таблиц для калькулятора рецептов

  1. Новые таблицы
    - `recipes` - Рецепты пользователей
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `name` (text)
      - `description` (text)
      - `servings` (integer)
      - `cooking_time` (integer) - время приготовления в минутах
      - `image_url` (text)
      - `created_at` (timestamptz)
    
    - `recipe_ingredients` - Ингредиенты рецептов
      - `id` (uuid, primary key)
      - `recipe_id` (uuid, foreign key)
      - `food_item_id` (uuid, foreign key)
      - `amount` (float) - количество
      - `unit` (text) - единица измерения

  2. Безопасность
    - Включение RLS для обеих таблиц
    - Политики для чтения и записи собственных рецептов
*/

-- Создание таблицы рецептов
CREATE TABLE recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  name text NOT NULL,
  description text,
  servings integer NOT NULL DEFAULT 1,
  cooking_time integer,
  image_url text,
  created_at timestamptz DEFAULT now()
);

-- Создание таблицы ингредиентов рецепта
CREATE TABLE recipe_ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
  food_item_id uuid REFERENCES food_items(id) NOT NULL,
  amount float NOT NULL,
  unit text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Включение RLS
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;

-- Политики для рецептов
CREATE POLICY "Users can view own recipes"
  ON recipes
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own recipes"
  ON recipes
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own recipes"
  ON recipes
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own recipes"
  ON recipes
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Политики для ингредиентов рецепта
CREATE POLICY "Users can view recipe ingredients"
  ON recipe_ingredients
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_ingredients.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage recipe ingredients"
  ON recipe_ingredients
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_ingredients.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );