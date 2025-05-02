import { supabase } from './supabase';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Расширенный интерфейс для питательной ценности
export interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  vitamins?: Record<string, string>;
  minerals?: Record<string, string>;
  portionWeight?: number;
  portionUnit?: string;
}

// Интерфейс для анализа еды
export interface FoodAnalysis {
  name: string;
  description?: string;
  nutrition: NutritionData;
  confidence?: number;
  glycemicIndex?: number;
  allergens?: string[];
  foodGroup?: string;
  image_url?: string;
}

// Интерфейс для результата множественного анализа
export interface MultipleFoodAnalysis {
  foods: FoodAnalysis[];
}

/**
 * Анализирует изображение пищи и возвращает информацию о питательной ценности
 * @param imageBase64 Изображение в формате base64
 * @param detectMultiple Если true, пытается распознать несколько продуктов на фото
 * @returns Информация о пище или массив продуктов, если detectMultiple=true
 */
export async function analyzeFoodImage(imageBase64: string, detectMultiple: boolean = false): Promise<FoodAnalysis | MultipleFoodAnalysis> {
  try {
    const apiUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/analyze-food`;
    
    // Добавляем user-agent и device-info для улучшения работы с API
    const deviceInfo = {
      platform: Platform.OS,
      version: Platform.Version,
      brand: Platform.OS === 'android' ? Constants.expoConfig?.android?.package : 'ios',
      model: 'NutriView App ' + Constants.expoConfig?.version
    };
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'User-Agent': `NutriView/${Constants.expoConfig?.version || '1.0.0'} (${Platform.OS})`,
        'X-Device-Info': JSON.stringify(deviceInfo)
      },
      body: JSON.stringify({ 
        image: imageBase64,
        detect_multiple: detectMultiple,
        include_micronutrients: true,
        include_glycemic_index: true,
        include_allergens: true
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || `Ошибка при анализе изображения: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Ошибка при анализе изображения:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Не удалось проанализировать изображение');
  }
}

/**
 * Сохраняет информацию о продукте в базу данных
 */
export async function saveFoodItem(foodData: {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  glycemic_index?: number;
  allergens?: string[];
  image_url?: string;
  vitamins?: Record<string, string>;
  minerals?: Record<string, string>;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Пользователь не авторизован');
  }

  const { data, error } = await supabase
    .from('food_items')
    .insert([{
      ...foodData,
      user_id: user.id,
      created_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) {
    console.error('Ошибка при сохранении продукта:', error);
    throw error;
  }

  return data;
}

/**
 * Добавляет запись о приеме пищи в журнал
 */
export async function addMealLog(
  foodItemId: string, 
  mealType: string, 
  portionSize: number = 1,
  mealTime: Date = new Date()
) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Пользователь не авторизован');
  }

  const { data, error } = await supabase
    .from('meal_logs')
    .insert([{
      user_id: user.id,
      food_item_id: foodItemId,
      meal_type: mealType,
      portion_size: portionSize,
      meal_time: mealTime.toISOString(),
      created_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) {
    console.error('Ошибка при добавлении записи о приеме пищи:', error);
    throw error;
  }

  return data;
}

/**
 * Получает данные о питательной ценности по штрих-коду продукта
 */
export async function getFoodByBarcode(barcode: string): Promise<FoodAnalysis> {
  try {
    const apiUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/food-by-barcode`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ barcode }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || `Продукт с штрих-кодом ${barcode} не найден`);
    }

    return await response.json();
  } catch (error) {
    console.error('Ошибка при получении данных по штрих-коду:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Не удалось получить данные о продукте по штрих-коду');
  }
}

/**
 * Получает персонализированные рекомендации по питанию на основе профиля пользователя
 */
export async function getNutritionRecommendations() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Пользователь не авторизован');
  }

  try {
    // Получаем профиль пользователя с предпочтениями
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      throw profileError;
    }

    // Получаем историю приемов пищи
    const { data: mealLogs, error: mealLogsError } = await supabase
      .from('meal_logs')
      .select(`
        *,
        food_item:food_item_id(*)
      `)
      .eq('user_id', user.id)
      .order('meal_time', { ascending: false })
      .limit(50);

    if (mealLogsError) {
      throw mealLogsError;
    }

    // Получаем рекомендации через Edge Function
    const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/nutrition-recommendations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        profile,
        meal_history: mealLogs
      }),
    });

    if (!response.ok) {
      throw new Error('Не удалось получить рекомендации');
    }

    return await response.json();
  } catch (error) {
    console.error('Ошибка при получении рекомендаций:', error);
    throw new Error('Не удалось получить персонализированные рекомендации');
  }
}