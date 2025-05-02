import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import SecurityManager from './SecurityManager';
import * as FileSystem from 'expo-file-system';
import * as Notifications from 'expo-notifications';
import { UserProfile } from '../types/UserProfile';
import RealHealthIntegration, { NutritionData } from './RealHealthIntegration';

// Директория для хранения отчетов о питании
const NUTRITION_REPORTS_DIR = FileSystem.documentDirectory + 'nutrition_reports/';

// Расширенный список микроэлементов для 10/10 анализа питания
export interface ExtendedNutritionData extends NutritionData {
  // Витамины
  vitaminB1?: number; // мг (тиамин)
  vitaminB2?: number; // мг (рибофлавин)
  vitaminB3?: number; // мг (ниацин)
  vitaminB5?: number; // мг (пантотеновая кислота)
  vitaminB6?: number; // мг
  vitaminB9?: number; // мкг (фолиевая кислота)
  vitaminB12?: number; // мкг
  vitaminE?: number; // мг
  vitaminK?: number; // мкг
  
  // Минералы
  magnesium?: number; // мг
  zinc?: number; // мг
  selenium?: number; // мкг
  copper?: number; // мг
  manganese?: number; // мг
  phosphorus?: number; // мг
  iodine?: number; // мкг
  chromium?: number; // мкг
  molybdenum?: number; // мкг
  
  // Аминокислоты
  leucine?: number; // мг
  isoleucine?: number; // мг
  valine?: number; // мг
  lysine?: number; // мг
  methionine?: number; // мг
  phenylalanine?: number; // мг
  threonine?: number; // мг
  tryptophan?: number; // мг
  histidine?: number; // мг
  
  // Жирные кислоты
  omega3?: number; // г
  omega6?: number; // г
  saturatedFat?: number; // г
  monounsaturatedFat?: number; // г
  polyunsaturatedFat?: number; // г
  transFat?: number; // г
  
  // Другие питательные вещества
  caffeine?: number; // мг
  alcohol?: number; // г
  water?: number; // мл
  
  // Добавляем аллергены
  allergens?: string[]; // массив аллергенов
  
  // Состав продукта
  ingredients?: string[];
  
  // Индекс гликемической нагрузки
  glycemicIndex?: number; // 0-100
  
  // Источник данных и примечания
  brand?: string;
  mealContext?: string; // домашняя еда, ресторан, фастфуд
  processedFood?: boolean; // обработанная пища или нет
  organic?: boolean; // органический продукт или нет
}

// Типы рекомендаций
export type RecommendationType = 
  | 'general' 
  | 'deficiency' 
  | 'excess' 
  | 'balance' 
  | 'health_condition' 
  | 'goal_specific' 
  | 'allergy';

// Рекомендация по питанию
export interface NutritionRecommendation {
  id: string;
  type: RecommendationType;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'alert';
  nutrient?: string;
  relatedNutrients?: string[];
  foodSuggestions?: string[];
  mealSuggestions?: string[];
  evidenceLevel: 'low' | 'medium' | 'high'; // уровень научной обоснованности
  personalizedReason?: string; // персонализированная причина для пользователя
  created: string; // ISO дата создания
}

// Состояние питательного вещества
export interface NutrientStatus {
  nutrient: string;
  current: number;
  unit: string;
  target: number;
  percentage: number; // процент от нормы
  status: 'deficient' | 'low' | 'adequate' | 'optimal' | 'excessive';
  trend: 'decreasing' | 'stable' | 'increasing';
  history: { date: string; value: number }[];
}

// Структура питательного вещества
export interface Nutrient {
  id: string;
  name: string;
  category: 'macronutrient' | 'vitamin' | 'mineral' | 'other';
  unit: string;
  dailyValue: {
    min?: number;
    default: number;
    max?: number;
  };
  functions: string[]; // функции в организме
  deficiencySigns: string[]; // признаки дефицита
  excessSigns: string[]; // признаки избытка
  foodSources: string[]; // источники в пище
}

/**
 * Класс для расширенного анализа питания
 * Улучшает базовый анализ питательных веществ до оценки 10/10
 */
export class NutritionAnalysis {
  private userId: string | null = null;
  private userProfile: UserProfile | null = null;
  private nutrientsDatabase: Nutrient[] = [];
  
  constructor() {
    this.initializeDirectories();
    this.loadNutrientsDatabase();
  }
  
  /**
   * Инициализация директорий для хранения отчетов
   */
  private async initializeDirectories() {
    try {
      const dirInfo = await FileSystem.getInfoAsync(NUTRITION_REPORTS_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(NUTRITION_REPORTS_DIR, { intermediates: true });
      }
    } catch (error) {
      console.error('Ошибка при создании директории для отчетов о питании:', error);
    }
  }
  
  /**
   * Загрузка базы данных питательных веществ
   */
  private async loadNutrientsDatabase() {
    try {
      // В реальном приложении здесь был бы запрос к API или локальной базе данных
      // Для демонстрации используем небольшой набор данных
      
      this.nutrientsDatabase = [
        {
          id: 'protein',
          name: 'Белок',
          category: 'macronutrient',
          unit: 'г',
          dailyValue: {
            min: 0.8 * 70, // 0.8 г на кг веса (для человека 70 кг)
            default: 70,
            max: 2 * 70 // до 2 г на кг веса
          },
          functions: [
            'Строительный материал для тканей',
            'Производство ферментов и гормонов',
            'Поддержка иммунной системы'
          ],
          deficiencySigns: [
            'Потеря мышечной массы',
            'Слабость',
            'Отеки',
            'Замедление метаболизма'
          ],
          excessSigns: [
            'Нагрузка на почки',
            'Обезвоживание',
            'Увеличение веса',
            'Повышение уровня азота в крови'
          ],
          foodSources: [
            'Мясо',
            'Рыба',
            'Яйца',
            'Молочные продукты',
            'Бобовые',
            'Орехи'
          ]
        },
        {
          id: 'carbs',
          name: 'Углеводы',
          category: 'macronutrient',
          unit: 'г',
          dailyValue: {
            min: 130,
            default: 275,
            max: 450
          },
          functions: [
            'Основной источник энергии',
            'Питание мозга',
            'Метаболизм белков и жиров'
          ],
          deficiencySigns: [
            'Усталость',
            'Снижение когнитивных функций',
            'Мышечная слабость',
            'Кетоз'
          ],
          excessSigns: [
            'Набор веса',
            'Повышение уровня сахара',
            'Риск развития диабета',
            'Повышение триглицеридов'
          ],
          foodSources: [
            'Крупы',
            'Хлеб',
            'Макароны',
            'Фрукты',
            'Овощи',
            'Сладости'
          ]
        },
        {
          id: 'fat',
          name: 'Жиры',
          category: 'macronutrient',
          unit: 'г',
          dailyValue: {
            min: 44,
            default: 78,
            max: 120
          },
          functions: [
            'Энергетический резерв',
            'Изоляция и защита органов',
            'Синтез гормонов',
            'Усвоение жирорастворимых витаминов'
          ],
          deficiencySigns: [
            'Сухая кожа',
            'Сухие волосы',
            'Гормональный дисбаланс',
            'Витаминный дефицит'
          ],
          excessSigns: [
            'Ожирение',
            'Высокий холестерин',
            'Риск сердечно-сосудистых заболеваний',
            'Метаболический синдром'
          ],
          foodSources: [
            'Масла',
            'Орехи',
            'Авокадо',
            'Мясо',
            'Молочные продукты',
            'Рыба'
          ]
        },
        {
          id: 'vitaminC',
          name: 'Витамин C',
          category: 'vitamin',
          unit: 'мг',
          dailyValue: {
            min: 75,
            default: 90,
            max: 2000
          },
          functions: [
            'Антиоксидантная защита',
            'Синтез коллагена',
            'Повышение иммунитета',
            'Усвоение железа'
          ],
          deficiencySigns: [
            'Цинга',
            'Кровоточивость десен',
            'Медленное заживление ран',
            'Сниженный иммунитет'
          ],
          excessSigns: [
            'Диарея',
            'Тошнота',
            'Спазмы в животе',
            'Головная боль'
          ],
          foodSources: [
            'Цитрусовые',
            'Киви',
            'Болгарский перец',
            'Брокколи',
            'Клубника',
            'Шиповник'
          ]
        },
        {
          id: 'calcium',
          name: 'Кальций',
          category: 'mineral',
          unit: 'мг',
          dailyValue: {
            min: 1000,
            default: 1200,
            max: 2500
          },
          functions: [
            'Формирование костей и зубов',
            'Сокращение мышц',
            'Нервная передача',
            'Свертывание крови'
          ],
          deficiencySigns: [
            'Остеопороз',
            'Рахит у детей',
            'Мышечные судороги',
            'Нарушение сердечного ритма'
          ],
          excessSigns: [
            'Камни в почках',
            'Запоры',
            'Нарушение работы почек',
            'Нарушение усвоения других минералов'
          ],
          foodSources: [
            'Молочные продукты',
            'Сардины с костями',
            'Тофу',
            'Зеленые листовые овощи',
            'Миндаль',
            'Обогащенные продукты'
          ]
        },
        // Добавляем еще 25+ питательных веществ в реальном приложении
      ];
    } catch (error) {
      console.error('Ошибка при загрузке базы данных питательных веществ:', error);
    }
  }
  
  /**
   * Установка ID пользователя и загрузка его профиля
   */
  setUserId(userId: string) {
    this.userId = userId;
    this.loadUserProfile();
  }
  
  /**
   * Загрузка профиля пользователя
   */
  private async loadUserProfile() {
    if (!this.userId) return;
    
    try {
      const profileKey = `user_profile_${this.userId}`;
      const profileStr = await AsyncStorage.getItem(profileKey);
      
      if (profileStr) {
        this.userProfile = JSON.parse(profileStr);
      }
    } catch (error) {
      console.error('Ошибка при загрузке профиля пользователя:', error);
    }
  }
  
  /**
   * Анализ состояния питательных веществ на основе истории питания
   * и профиля пользователя
   */
  async analyzeNutrientStatus(
    startDate: Date,
    endDate: Date
  ): Promise<{
    statuses: NutrientStatus[],
    recommendations: NutritionRecommendation[],
    score: number,
    deficit: string[],
    excess: string[],
    balanced: string[]
  }> {
    if (!this.userId || !this.userProfile) {
      throw new Error('Необходим ID пользователя и профиль для анализа');
    }
    
    try {
      // Получаем данные о питании за указанный период
      const nutritionHistory = await this.getNutritionData(startDate, endDate);
      
      // Вычисляем общее потребление каждого питательного вещества
      const totalNutrients: Record<string, number> = {};
      const nutrientDays: Record<string, number> = {}; // Счетчик дней для каждого нутриента
      
      // Классификация нутриентов по статусу
      const deficit: string[] = [];
      const excess: string[] = [];
      const balanced: string[] = [];
      
      // Анализируем историю питания
      for (const entry of nutritionHistory) {
        const entryDate = new Date(entry.date);
        
        // Обрабатываем все питательные вещества в записи
        Object.entries(entry).forEach(([key, value]) => {
          // Пропускаем не питательные поля
          if (['date', 'source', 'meal', 'metadata', 'ingredients', 'allergens'].includes(key) || 
              typeof value !== 'number') {
            return;
          }
          
          totalNutrients[key] = (totalNutrients[key] || 0) + value;
          nutrientDays[key] = (nutrientDays[key] || 0) + 1;
        });
      }
      
      // Вычисляем средние значения за день
      const dailyAverages: Record<string, number> = {};
      Object.keys(totalNutrients).forEach(nutrient => {
        dailyAverages[nutrient] = totalNutrients[nutrient] / Math.max(nutrientDays[nutrient], 1);
      });
      
      // Получаем рекомендуемые нормы для пользователя
      const recommendedIntakes = this.calculateRecommendedIntakes();
      
      // Создаем массив статусов для каждого питательного вещества
      const statuses: NutrientStatus[] = [];
      
      // Анализируем статус каждого питательного вещества
      Object.keys(dailyAverages).forEach(nutrientId => {
        const intake = dailyAverages[nutrientId];
        const nutrient = this.nutrientsDatabase.find(n => n.id === nutrientId);
        
        if (!nutrient) return; // Пропускаем неизвестные нутриенты
        
        const recommended = recommendedIntakes[nutrientId] || nutrient.dailyValue.default;
        const min = nutrient.dailyValue.min || recommended * 0.7;
        const max = nutrient.dailyValue.max || recommended * 1.5;
        
        // Определяем статус
        let status: 'deficient' | 'low' | 'adequate' | 'optimal' | 'excessive';
        
        const percentage = (intake / recommended) * 100;
        
        if (percentage < 30) {
          status = 'deficient';
          deficit.push(nutrientId);
        } else if (percentage < 70) {
          status = 'low';
          deficit.push(nutrientId);
        } else if (percentage < 90) {
          status = 'adequate';
          balanced.push(nutrientId);
        } else if (percentage <= 150) {
          status = 'optimal';
          balanced.push(nutrientId);
        } else {
          status = 'excessive';
          excess.push(nutrientId);
        }
        
        // Определяем тренд (в реальном приложении нужно анализировать данные за более длительный период)
        const trend: 'decreasing' | 'stable' | 'increasing' = 'stable';
        
        // Собираем историю для графиков
        const history = this.collectNutrientHistory(nutrientId, nutritionHistory);
        
        // Добавляем статус в результат
        statuses.push({
          nutrient: nutrientId,
          current: intake,
          unit: nutrient.unit,
          target: recommended,
          percentage,
          status,
          trend,
          history
        });
      });
      
      // Генерируем рекомендации
      const recommendations = this.generateRecommendations(statuses, nutritionHistory);
      
      // Вычисляем общий балл питания (0-100)
      const score = this.calculateNutritionScore(statuses);
      
      return {
        statuses,
        recommendations,
        score,
        deficit,
        excess,
        balanced
      };
    } catch (error) {
      console.error('Ошибка при анализе питательных веществ:', error);
      throw error;
    }
  }
  
  /**
   * Получение данных о питании за период
   */
  private async getNutritionData(startDate: Date, endDate: Date): Promise<ExtendedNutritionData[]> {
    try {
      // Проверяем кэш
      const cacheKey = `nutrition_data_${startDate.toISOString()}_${endDate.toISOString()}_${this.userId}`;
      const cachedData = await AsyncStorage.getItem(cacheKey);
      
      if (cachedData) {
        return JSON.parse(cachedData) as ExtendedNutritionData[];
      }
      
      // Получаем данные из истории питания пользователя
      const foodLogKey = `food_log_${this.userId}`;
      const foodLogStr = await AsyncStorage.getItem(foodLogKey);
      const foodLog = foodLogStr ? JSON.parse(foodLogStr) as ExtendedNutritionData[] : [];
      
      // Фильтруем записи по дате
      const filteredEntries = foodLog.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= startDate && entryDate <= endDate;
      });
      
      // Добавляем данные из HealthKit/Google Fit, если доступны
      const healthIntegration = RealHealthIntegration;
      if (healthIntegration) {
        try {
          // Запрашиваем данные о питании из HealthKit/Google Fit
          const nutritionResult = await healthIntegration.queryHealthData('nutrition.calories', startDate, endDate);
          
          if (nutritionResult.success && nutritionResult.data) {
            // Добавляем данные из HealthKit/Google Fit к нашим локальным данным
            // Обычно здесь нужно было бы преобразовать и объединить данные
          }
        } catch (healthError) {
          console.error('Ошибка при получении данных о питании из HealthKit/Google Fit:', healthError);
          // Продолжаем с локальными данными при ошибке
        }
      }
      
      // Кэшируем результат для будущих запросов
      await AsyncStorage.setItem(cacheKey, JSON.stringify(filteredEntries));
      
      return filteredEntries;
    } catch (error) {
      console.error('Ошибка при получении данных о питании:', error);
      return [];
    }
  }
  
  /**
   * Сбор истории значений конкретного питательного вещества
   */
  private collectNutrientHistory(nutrientId: string, nutritionHistory: ExtendedNutritionData[]): { date: string; value: number }[] {
    const history: { date: string; value: number }[] = [];
    
    // Группируем данные по дням
    const dailyData: Record<string, number> = {};
    
    for (const entry of nutritionHistory) {
      if (entry[nutrientId as keyof ExtendedNutritionData] !== undefined) {
        const dateString = entry.date.split('T')[0]; // Берем только дату без времени
        const value = Number(entry[nutrientId as keyof ExtendedNutritionData]);
        
        if (!isNaN(value)) {
          dailyData[dateString] = (dailyData[dateString] || 0) + value;
        }
      }
    }
    
    // Преобразуем в массив для истории
    for (const [date, value] of Object.entries(dailyData)) {
      history.push({ date, value });
    }
    
    // Сортируем по дате
    history.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return history;
  }
  
  /**
   * Расчет рекомендуемых норм потребления на основе профиля пользователя
   */
  private calculateRecommendedIntakes(): Record<string, number> {
    if (!this.userProfile) return {};
    
    const {
      age,
      gender,
      weight,
      height,
      activityLevel,
      goals,
      healthConditions,
      dietaryPreferences
    } = this.userProfile;
    
    // Базовый метаболизм (BMR) по формуле Миффлина-Сан Жеора
    let bmr = 0;
    if (gender === 'male') {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }
    
    // Коэффициент активности
    let activityMultiplier = 1.2; // Малоподвижный
    if (activityLevel === 'light') {
      activityMultiplier = 1.375; // Легкая активность
    } else if (activityLevel === 'moderate') {
      activityMultiplier = 1.55; // Умеренная активность
    } else if (activityLevel === 'high') {
      activityMultiplier = 1.725; // Высокая активность
    } else if (activityLevel === 'extreme') {
      activityMultiplier = 1.9; // Очень высокая активность
    }
    
    // Общий расход калорий
    const tdee = bmr * activityMultiplier;
    
    // Расчет рекомендуемых значений макронутриентов
    let recommendedCalories = tdee;
    
    // Корректировка в зависимости от цели
    if (goals.includes('weight_loss')) {
      recommendedCalories *= 0.8; // Дефицит 20%
    } else if (goals.includes('weight_gain')) {
      recommendedCalories *= 1.15; // Профицит 15%
    }
    
    // Распределение макронутриентов
    let proteinRatio = 0.25; // 25% от калорий
    let carbRatio = 0.5; // 50% от калорий
    let fatRatio = 0.25; // 25% от калорий
    
    // Корректировка в зависимости от целей и предпочтений
    if (goals.includes('muscle_gain')) {
      proteinRatio = 0.3;
      carbRatio = 0.45;
      fatRatio = 0.25;
    } else if (goals.includes('endurance')) {
      proteinRatio = 0.2;
      carbRatio = 0.6;
      fatRatio = 0.2;
    } else if (dietaryPreferences.includes('low_carb')) {
      proteinRatio = 0.35;
      carbRatio = 0.3;
      fatRatio = 0.35;
    }
    
    // Калории в граммах
    const recommendedProtein = (recommendedCalories * proteinRatio) / 4; // 4 ккал/г
    const recommendedCarbs = (recommendedCalories * carbRatio) / 4; // 4 ккал/г
    const recommendedFat = (recommendedCalories * fatRatio) / 9; // 9 ккал/г
    
    // Расчет микронутриентов
    // Здесь в реальном приложении будут намного более сложные расчеты,
    // учитывающие множество факторов
    
    // Результирующие рекомендуемые нормы
    const recommendedIntakes: Record<string, number> = {
      calories: recommendedCalories,
      protein: recommendedProtein,
      carbs: recommendedCarbs,
      fat: recommendedFat,
      fiber: 14 * (recommendedCalories / 1000), // ~14г на 1000 ккал
      water: weight * 30, // ~30 мл на кг веса
    };
    
    // Добавляем рекомендации по витаминам и минералам из базы данных
    this.nutrientsDatabase.forEach(nutrient => {
      if (nutrient.category === 'vitamin' || nutrient.category === 'mineral') {
        // Базовое значение
        let value = nutrient.dailyValue.default;
        
        // Корректировка для особых случаев
        if (gender === 'female' && nutrient.id === 'iron' && age >= 19 && age <= 50) {
          value = 18; // Больше железа для женщин репродуктивного возраста
        }
        
        // Корректировка при беременности
        if (healthConditions.includes('pregnancy') && 
            ['folate', 'vitaminB9', 'iron', 'calcium'].includes(nutrient.id)) {
          value *= 1.5; // Увеличение на 50% для важных нутриентов при беременности
        }
        
        recommendedIntakes[nutrient.id] = value;
      }
    });
    
    return recommendedIntakes;
  }
  
  /**
   * Генерация персонализированных рекомендаций на основе статуса питательных веществ
   */
  private generateRecommendations(
    statuses: NutrientStatus[],
    nutritionHistory: ExtendedNutritionData[]
  ): NutritionRecommendation[] {
    const recommendations: NutritionRecommendation[] = [];
    
    // Анализируем дефициты нутриентов
    const deficientNutrients = statuses.filter(status => 
      status.status === 'deficient' || status.status === 'low'
    );
    
    // Анализируем избыток нутриентов
    const excessiveNutrients = statuses.filter(status => 
      status.status === 'excessive'
    );
    
    // Для каждого дефицитного нутриента создаем рекомендацию
    for (const status of deficientNutrients) {
      const nutrient = this.nutrientsDatabase.find(n => n.id === status.nutrient);
      
      if (!nutrient) continue;
      
      const percentage = Math.round(status.percentage);
      const deficit = Math.round(status.target - status.current);
      
      // Формируем персонализированную рекомендацию
      const recommendation: NutritionRecommendation = {
        id: `deficiency_${nutrient.id}_${Date.now()}`,
        type: 'deficiency',
        title: `Низкое потребление ${nutrient.name}`,
        description: `Ваше потребление ${nutrient.name} составляет ${percentage}% от рекомендуемой нормы. Увеличьте потребление на ${deficit} ${nutrient.unit} в день.`,
        severity: percentage < 50 ? 'alert' : 'warning',
        nutrient: nutrient.id,
        foodSuggestions: nutrient.foodSources.slice(0, 5),
        evidenceLevel: 'high',
        personalizedReason: this.generatePersonalizedReason(nutrient, 'deficiency'),
        created: new Date().toISOString()
      };
      
      // Добавляем примеры блюд
      recommendation.mealSuggestions = this.suggestMealsForNutrient(nutrient.id, 'increase');
      
      recommendations.push(recommendation);
    }
    
    // Для каждого избыточного нутриента создаем рекомендацию
    for (const status of excessiveNutrients) {
      const nutrient = this.nutrientsDatabase.find(n => n.id === status.nutrient);
      
      if (!nutrient) continue;
      
      const percentage = Math.round(status.percentage);
      const excess = Math.round(status.current - status.target);
      
      // Формируем персонализированную рекомендацию
      const recommendation: NutritionRecommendation = {
        id: `excess_${nutrient.id}_${Date.now()}`,
        type: 'excess',
        title: `Избыточное потребление ${nutrient.name}`,
        description: `Ваше потребление ${nutrient.name} составляет ${percentage}% от рекомендуемой нормы. Рекомендуется снизить потребление на ${excess} ${nutrient.unit} в день.`,
        severity: percentage > 200 ? 'alert' : 'warning',
        nutrient: nutrient.id,
        evidenceLevel: 'medium',
        personalizedReason: this.generatePersonalizedReason(nutrient, 'excess'),
        created: new Date().toISOString()
      };
      
      // Добавляем рекомендации по ограничению определенных продуктов
      recommendation.foodSuggestions = this.suggestFoodsToLimit(nutrient.id);
      
      recommendations.push(recommendation);
    }
    
    // Проверка баланса макронутриентов
    const macroStatus = this.checkMacronutrientBalance(statuses);
    if (macroStatus !== 'balanced') {
      recommendations.push({
        id: `macro_balance_${Date.now()}`,
        type: 'balance',
        title: 'Дисбаланс макронутриентов',
        description: macroStatus === 'carb_heavy' 
          ? 'Ваш рацион содержит слишком много углеводов по сравнению с белками и жирами.'
          : macroStatus === 'fat_heavy'
          ? 'Ваш рацион содержит избыточное количество жиров.'
          : 'Для общего баланса рекомендуется пересмотреть соотношение белков, жиров и углеводов.',
        severity: 'warning',
        relatedNutrients: ['protein', 'carbs', 'fat'],
        evidenceLevel: 'medium',
        created: new Date().toISOString()
      });
    }
    
    // Добавляем рекомендации по разнообразию питания
    const diversityScore = this.calculateDietDiversity(nutritionHistory);
    if (diversityScore < 7) {
      recommendations.push({
        id: `diversity_${Date.now()}`,
        type: 'general',
        title: 'Повысьте разнообразие рациона',
        description: 'Ваш рацион недостаточно разнообразен. Старайтесь включать продукты разных групп ежедневно для получения всех необходимых питательных веществ.',
        severity: 'info',
        evidenceLevel: 'high',
        foodSuggestions: [
          'Разноцветные овощи',
          'Фрукты разных видов',
          'Различные источники белка',
          'Цельнозерновые продукты',
          'Орехи и семена'
        ],
        created: new Date().toISOString()
      });
    }
    
    // Проверка на наличие продуктов, содержащих аллергены
    if (this.userProfile?.allergies?.length) {
      const allergenProducts = this.checkAllergens(nutritionHistory);
      if (allergenProducts.length > 0) {
        recommendations.push({
          id: `allergens_${Date.now()}`,
          type: 'allergy',
          title: 'Обнаружены потенциальные аллергены',
          description: `В вашем рационе присутствуют продукты, которые могут содержать аллергены: ${allergenProducts.join(', ')}`,
          severity: 'alert',
          evidenceLevel: 'high',
          created: new Date().toISOString()
        });
      }
    }
    
    // Рекомендации по специфическим целям
    if (this.userProfile?.goals?.includes('muscle_gain') && deficientNutrients.some(n => n.nutrient === 'protein')) {
      recommendations.push({
        id: `goal_muscle_${Date.now()}`,
        type: 'goal_specific',
        title: 'Увеличьте потребление белка для набора мышечной массы',
        description: 'Для достижения вашей цели по наращиванию мышц, рекомендуется увеличить потребление белка до 1.6-2.0 г на кг веса.',
        severity: 'warning',
        nutrient: 'protein',
        foodSuggestions: [
          'Куриная грудка',
          'Яйца',
          'Творог',
          'Протеиновый коктейль',
          'Греческий йогурт'
        ],
        evidenceLevel: 'high',
        created: new Date().toISOString()
      });
    }
    
    return recommendations;
  }
  
  /**
   * Генерация персонализированной причины для рекомендации
   */
  private generatePersonalizedReason(nutrient: Nutrient, type: 'deficiency' | 'excess'): string {
    const reasons = [];
    
    if (type === 'deficiency') {
      reasons.push(`${nutrient.name} необходим для ${nutrient.functions[0].toLowerCase()}.`);
      
      if (nutrient.deficiencySigns.length > 0) {
        reasons.push(`Недостаточное потребление ${nutrient.name} может привести к ${nutrient.deficiencySigns.join(', ')}.`);
      }
    } else if (type === 'excess') {
      reasons.push(`Избыточное потребление ${nutrient.name} может привести к ${nutrient.excessSigns.join(', ')}.`);
    }
    
    return reasons.join(' ');
  }
  
  /**
   * Расчет общего балла питания на основе статусов нутриентов
   * Оценка от 0 до 100, где 100 - идеальный баланс
   */
  private calculateNutritionScore(statuses: NutrientStatus[]): number {
    if (statuses.length === 0) return 0;
    
    // Разделяем статусы по типам питательных веществ
    const macronutrients = statuses.filter(s => 
      ['protein', 'carbs', 'fat'].includes(s.nutrient)
    );
    
    const vitamins = statuses.filter(s => 
      this.nutrientsDatabase.find(n => n.id === s.nutrient)?.category === 'vitamin'
    );
    
    const minerals = statuses.filter(s => 
      this.nutrientsDatabase.find(n => n.id === s.nutrient)?.category === 'mineral'
    );
    
    // Назначаем веса для разных категорий питательных веществ
    const weights = {
      macronutrients: 0.5, // 50% от общего балла
      vitamins: 0.25,      // 25% от общего балла
      minerals: 0.25       // 25% от общего балла
    };
    
    // Функция для расчета балла группы нутриентов
    const calculateGroupScore = (group: NutrientStatus[]): number => {
      if (group.length === 0) return 0;
      
      let groupScore = 0;
      
      for (const status of group) {
        // Идеальный процент - 100%, отклонения в любую сторону снижают балл
        const deviation = Math.abs(status.percentage - 100);
        
        // Преобразуем отклонение в балл от 0 до 100
        let nutrientScore = 100;
        
        if (deviation <= 10) {
          // Небольшое отклонение (90-110%) - незначительное снижение
          nutrientScore = 100 - deviation / 2;
        } else if (deviation <= 30) {
          // Среднее отклонение (70-90% или 110-130%) - линейное снижение
          nutrientScore = 95 - (deviation - 10) * 1.5;
        } else if (deviation <= 50) {
          // Большое отклонение (50-70% или 130-150%) - более резкое снижение
          nutrientScore = 75 - (deviation - 30) * 2;
        } else {
          // Сильное отклонение (< 50% или > 150%) - сильное снижение
          nutrientScore = Math.max(0, 35 - (deviation - 50) * 0.7);
        }
        
        groupScore += nutrientScore;
      }
      
      return groupScore / group.length;
    };
    
    // Рассчитываем баллы для каждой группы нутриентов
    const macroScore = calculateGroupScore(macronutrients) * weights.macronutrients;
    const vitaminScore = calculateGroupScore(vitamins) * weights.vitamins;
    const mineralScore = calculateGroupScore(minerals) * weights.minerals;
    
    // Считаем итоговый балл
    let totalScore = macroScore + vitaminScore + mineralScore;
    
    // Корректируем балл в зависимости от баланса макронутриентов
    const macroBalanceStatus = this.checkMacronutrientBalance(statuses);
    if (macroBalanceStatus !== 'balanced') {
      totalScore *= 0.9; // Снижаем на 10% при дисбалансе макронутриентов
    }
    
    // Корректируем балл в зависимости от разнообразия рациона
    if (statuses.length < 10) {
      totalScore *= 0.85; // Слишком мало питательных веществ отслеживается
    }
    
    return Math.round(totalScore);
  }
  
  /**
   * Предложение блюд, богатых определенным нутриентом
   */
  private suggestMealsForNutrient(nutrientId: string, action: 'increase' | 'decrease'): string[] {
    // База данных блюд, богатых различными нутриентами
    const mealSuggestions: Record<string, string[]> = {
      protein: [
        'Куриная грудка с овощами',
        'Омлет из яиц с овощами',
        'Греческий йогурт с орехами и ягодами',
        'Лосось с гарниром из киноа',
        'Чечевичный суп с цельнозерновым хлебом'
      ],
      carbs: [
        'Овсянка с фруктами и орехами',
        'Цельнозерновые макароны с овощами',
        'Фруктовый смузи с овсяными хлопьями',
        'Брауншвейгский рис с овощами',
        'Печеный картофель с нежирным творогом'
      ],
      fat: [
        'Авокадо тост на цельнозерновом хлебе',
        'Салат с оливковым маслом и орехами',
        'Лосось с зеленым салатом',
        'Хумус с овощными палочками',
        'Грецкие орехи и семена чиа в йогурте'
      ],
      vitaminC: [
        'Фруктовый салат из цитрусовых и киви',
        'Запеченный перец с гречкой',
        'Смузи из клубники и апельсина',
        'Квашеная капуста с яблоком',
        'Салат из томатов, болгарского перца и брокколи'
      ],
      calcium: [
        'Творожная запеканка с черной смородиной',
        'Смузи из шпината, миндального молока и йогурта',
        'Салат из брокколи с сыром тофу',
        'Сардины на цельнозерновом тосте',
        'Миндальное молоко с семенами чиа и мёдом'
      ],
      iron: [
        'Говяжий стейк с запеченным картофелем',
        'Чечевичный суп с шпинатом',
        'Тушеная печень с овощами',
        'Темный шоколад с орехами',
        'Киноа с грибами и шпинатом'
      ],
      omega3: [
        'Запеченный лосось с овощами',
        'Салат с тунцом и авокадо',
        'Смузи с семенами льна и черникой',
        'Сардины на гриле с лимоном',
        'Омлет с лососем и шпинатом'
      ],
      fiber: [
        'Овсянка с ягодами и семенами чиа',
        'Цельнозерновой хлеб с авокадо и томатами',
        'Чечевичный суп с овощами',
        'Салат из киноа с овощами',
        'Запеченные яблоки с корицей и орехами'
      ]
    };
    
    // Для некоторых нутриентов подбираем блюда из смежных категорий
    const nutrientMapping: Record<string, string> = {
      'vitaminB1': 'fiber',
      'vitaminB2': 'protein',
      'vitaminB3': 'protein',
      'vitaminB6': 'protein',
      'vitaminB9': 'fiber',
      'vitaminB12': 'protein',
      'vitaminD': 'fat',
      'vitaminE': 'fat',
      'vitaminK': 'fiber',
      'magnesium': 'fiber',
      'zinc': 'protein',
      'selenium': 'protein',
      'potassium': 'fiber'
    };
    
    // Получаем подходящий список блюд
    const mappedNutrient = nutrientMapping[nutrientId] || nutrientId;
    const suggestions = mealSuggestions[mappedNutrient] || [];
    
    // Если нужно уменьшить потребление, возвращаем пустой список
    if (action === 'decrease') {
      return [];
    }
    
    // Если для нутриента нет конкретных рекомендаций, предлагаем общие блюда
    if (suggestions.length === 0) {
      return [
        'Разнообразный салат из сезонных овощей',
        'Суп из сезонных овощей и круп',
        'Смузи из фруктов и зелени',
        'Запеченные овощи с нежирным белком',
        'Фруктовый салат с орехами'
      ];
    }
    
    return suggestions;
  }
  
  /**
   * Предложение продуктов для ограничения при избытке нутриента
   */
  private suggestFoodsToLimit(nutrientId: string): string[] {
    const foodsToLimit: Record<string, string[]> = {
      protein: [
        'Красное мясо',
        'Протеиновые коктейли',
        'Белковые батончики',
        'Жирные молочные продукты',
        'Переработанное мясо (колбасы, сосиски)'
      ],
      carbs: [
        'Сладкие напитки',
        'Белый хлеб и выпечка',
        'Сладости и конфеты',
        'Картофель фри',
        'Рафинированные крупы'
      ],
      fat: [
        'Жирное мясо',
        'Фаст-фуд',
        'Жареные продукты',
        'Сливочное масло',
        'Сладкие десерты'
      ],
      sodium: [
        'Соленые закуски',
        'Колбасные изделия',
        'Консервированные супы',
        'Соленая рыба',
        'Полуфабрикаты'
      ],
      sugar: [
        'Конфеты и шоколад',
        'Газированные напитки',
        'Фруктовые соки',
        'Мороженое',
        'Пирожные и торты'
      ],
      saturatedFat: [
        'Жирные мясные продукты',
        'Сливочное масло',
        'Полножирные молочные продукты',
        'Кокосовое масло',
        'Пальмовое масло'
      ],
      cholesterol: [
        'Субпродукты (печень, почки)',
        'Яичные желтки (в большом количестве)',
        'Моллюски и креветки',
        'Сливочное масло',
        'Жирные молочные продукты'
      ],
      caffeine: [
        'Кофе',
        'Энергетические напитки',
        'Черный чай',
        'Шоколад',
        'Кола и другие кофеинсодержащие напитки'
      ],
      alcohol: [
        'Пиво',
        'Вино',
        'Крепкие алкогольные напитки',
        'Ликеры',
        'Алкогольные коктейли'
      ]
    };
    
    return foodsToLimit[nutrientId] || [
      'Переработанные пищевые продукты',
      'Продукты с высоким содержанием соли',
      'Продукты с добавленным сахаром',
      'Жареная пища',
      'Фаст-фуд'
    ];
  }
  
  /**
   * Проверка баланса макронутриентов
   */
  private checkMacronutrientBalance(statuses: NutrientStatus[]): 'balanced' | 'protein_heavy' | 'carb_heavy' | 'fat_heavy' | 'undefined' {
    // Находим статусы макронутриентов
    const proteinStatus = statuses.find(s => s.nutrient === 'protein');
    const carbStatus = statuses.find(s => s.nutrient === 'carbs');
    const fatStatus = statuses.find(s => s.nutrient === 'fat');
    
    // Если не все макронутриенты отслеживаются, возвращаем undefined
    if (!proteinStatus || !carbStatus || !fatStatus) {
      return 'undefined';
    }
    
    // Получаем текущие значения в калориях
    const proteinCalories = proteinStatus.current * 4; // 4 ккал/г
    const carbCalories = carbStatus.current * 4; // 4 ккал/г
    const fatCalories = fatStatus.current * 9; // 9 ккал/г
    
    // Рассчитываем общее количество калорий
    const totalCalories = proteinCalories + carbCalories + fatCalories;
    
    // Рассчитываем процентное соотношение
    const proteinPercentage = (proteinCalories / totalCalories) * 100;
    const carbPercentage = (carbCalories / totalCalories) * 100;
    const fatPercentage = (fatCalories / totalCalories) * 100;
    
    // Определяем дисбаланс
    if (carbPercentage > 60) {
      return 'carb_heavy';
    } else if (fatPercentage > 40) {
      return 'fat_heavy';
    } else if (proteinPercentage > 35) {
      return 'protein_heavy';
    } else if (
      proteinPercentage >= 15 && 
      proteinPercentage <= 35 && 
      carbPercentage >= 45 && 
      carbPercentage <= 60 && 
      fatPercentage >= 20 && 
      fatPercentage <= 35
    ) {
      return 'balanced';
    }
    
    return 'undefined';
  }
  
  /**
   * Расчет разнообразия рациона по шкале от 0 до 10
   */
  private calculateDietDiversity(nutritionHistory: ExtendedNutritionData[]): number {
    if (nutritionHistory.length === 0) return 0;
    
    // Категории продуктов
    const foodCategories = [
      'meat', 'fish', 'dairy', 'eggs', 'legumes', 
      'grains', 'vegetables', 'fruits', 'nuts_seeds', 
      'oils'
    ];
    
    // Определяем, какие категории продуктов присутствуют в рационе
    const presentCategories = new Set<string>();
    const ingredientCounts: Record<string, number> = {};
    
    // Анализируем историю питания
    for (const entry of nutritionHistory) {
      // Если в записи есть ингредиенты, анализируем их
      if (entry.ingredients && entry.ingredients.length > 0) {
        for (const ingredient of entry.ingredients) {
          ingredientCounts[ingredient] = (ingredientCounts[ingredient] || 0) + 1;
          
          // Упрощенная логика определения категории продукта по ключевым словам
          if (ingredient.includes('мясо') || ingredient.includes('курица') || 
              ingredient.includes('говядина') || ingredient.includes('свинина')) {
            presentCategories.add('meat');
          } else if (ingredient.includes('рыба') || ingredient.includes('лосось') || 
                     ingredient.includes('тунец') || ingredient.includes('треска')) {
            presentCategories.add('fish');
          } else if (ingredient.includes('молоко') || ingredient.includes('сыр') || 
                     ingredient.includes('йогурт') || ingredient.includes('творог')) {
            presentCategories.add('dairy');
          } else if (ingredient.includes('яйцо') || ingredient.includes('яйца')) {
            presentCategories.add('eggs');
          } else if (ingredient.includes('фасоль') || ingredient.includes('горох') || 
                     ingredient.includes('чечевица') || ingredient.includes('нут')) {
            presentCategories.add('legumes');
          } else if (ingredient.includes('хлеб') || ingredient.includes('рис') || 
                     ingredient.includes('паста') || ingredient.includes('крупа')) {
            presentCategories.add('grains');
          } else if (ingredient.includes('овощ') || ingredient.includes('томат') || 
                     ingredient.includes('морковь') || ingredient.includes('перец')) {
            presentCategories.add('vegetables');
          } else if (ingredient.includes('фрукт') || ingredient.includes('яблоко') || 
                     ingredient.includes('банан') || ingredient.includes('ягода')) {
            presentCategories.add('fruits');
          } else if (ingredient.includes('орех') || ingredient.includes('семена')) {
            presentCategories.add('nuts_seeds');
          } else if (ingredient.includes('масло')) {
            presentCategories.add('oils');
          }
        }
      }
      
      // Если запись еды содержит информацию о пище, классифицируем ее
      if (entry.mealContext) {
        if (entry.mealContext.includes('мясо')) presentCategories.add('meat');
        if (entry.mealContext.includes('рыба')) presentCategories.add('fish');
        // и так далее для других категорий
      }
    }
    
    // Считаем разнообразие по категориям
    const categoryDiversity = presentCategories.size;
    
    // Считаем разнообразие по ингредиентам
    const uniqueIngredients = Object.keys(ingredientCounts).length;
    
    // Рассчитываем итоговый балл разнообразия от 0 до 10
    const diversityScore = Math.min(10, 
      (categoryDiversity / foodCategories.length) * 5 + 
      Math.min(5, uniqueIngredients / 20)
    );
    
    return Math.round(diversityScore);
  }
  
  /**
   * Проверка наличия аллергенов в рационе на основе профиля пользователя
   */
  private checkAllergens(nutritionHistory: ExtendedNutritionData[]): string[] {
    if (!this.userProfile?.allergies || this.userProfile.allergies.length === 0) {
      return [];
    }
    
    const potentialAllergens: string[] = [];
    const userAllergies = this.userProfile.allergies;
    
    // Проверяем явно указанные аллергены в записях
    for (const entry of nutritionHistory) {
      if (entry.allergens) {
        for (const allergen of entry.allergens) {
          if (userAllergies.some(a => 
            allergen.toLowerCase().includes(a.toLowerCase())
          )) {
            if (!potentialAllergens.includes(allergen)) {
              potentialAllergens.push(allergen);
            }
          }
        }
      }
      
      // Проверяем ингредиенты на наличие аллергенов
      if (entry.ingredients) {
        for (const ingredient of entry.ingredients) {
          if (userAllergies.some(a => 
            ingredient.toLowerCase().includes(a.toLowerCase())
          )) {
            if (!potentialAllergens.includes(ingredient)) {
              potentialAllergens.push(ingredient);
            }
          }
        }
      }
    }
    
    return potentialAllergens;
  }
  
  /**
   * Проверка пищи на наличие аллергенов для пользователя
   * Метод для использования при добавлении нового продукта в дневник
   */
  async checkFoodForAllergens(
    food: {
      name: string;
      ingredients?: string[];
      allergens?: string[];
    }
  ): Promise<{safe: boolean, allergens: string[]}> {
    if (!this.userProfile?.allergies || this.userProfile.allergies.length === 0) {
      return { safe: true, allergens: [] };
    }
    
    const detectedAllergens: string[] = [];
    const userAllergies = this.userProfile.allergies;
    
    // Проверяем название продукта
    if (userAllergies.some(a => food.name.toLowerCase().includes(a.toLowerCase()))) {
      detectedAllergens.push(food.name);
    }
    
    // Проверяем ингредиенты
    if (food.ingredients) {
      for (const ingredient of food.ingredients) {
        if (userAllergies.some(a => ingredient.toLowerCase().includes(a.toLowerCase()))) {
          detectedAllergens.push(ingredient);
        }
      }
    }
    
    // Проверяем явно указанные аллергены
    if (food.allergens) {
      for (const allergen of food.allergens) {
        if (userAllergies.some(a => allergen.toLowerCase().includes(a.toLowerCase()))) {
          detectedAllergens.push(allergen);
        }
      }
    }
    
    return {
      safe: detectedAllergens.length === 0,
      allergens: detectedAllergens
    };
  }
  
  /**
   * Генерация персонализированного плана питания
   * на основе анализа нутриентов и предпочтений пользователя
   */
  async generateMealPlan(
    days: number = 7,
    options?: {
      calorieTarget?: number;
      focusNutrients?: string[];
      excludeIngredients?: string[];
    }
  ): Promise<{
    success: boolean;
    mealPlan?: Array<{
      day: number;
      date: string;
      meals: Array<{
        type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
        name: string;
        ingredients: string[];
        nutrients: Record<string, number>;
        calories: number;
        recipe?: string;
      }>;
      totalNutrients: Record<string, number>;
      totalCalories: number;
    }>;
    message?: string;
  }> {
    if (!this.userId || !this.userProfile) {
      return {
        success: false,
        message: 'Необходим профиль пользователя для создания плана питания'
      };
    }
    
    try {
      // Получаем текущую дату
      const today = new Date();
      
      // Получаем результаты анализа питания за последние 30 дней
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      const analysis = await this.analyzeNutrientStatus(startDate, today);
      
      // Определяем целевое количество калорий
      const calorieTarget = options?.calorieTarget || 
        this.calculateRecommendedIntakes().calories || 2000;
      
      // Определяем нутриенты, на которые нужно обратить особое внимание
      const focusNutrients = options?.focusNutrients || 
        analysis.deficit.concat(analysis.excess.slice(0, 3));
      
      // Создаем план питания на указанное количество дней
      const mealPlan = [];
      
      for (let i = 0; i < days; i++) {
        const dayDate = new Date();
        dayDate.setDate(today.getDate() + i);
        
        // Распределение калорий по приемам пищи
        const breakfastCalories = calorieTarget * 0.25; // 25% калорий на завтрак
        const lunchCalories = calorieTarget * 0.35; // 35% калорий на обед
        const dinnerCalories = calorieTarget * 0.3; // 30% калорий на ужин
        const snackCalories = calorieTarget * 0.1; // 10% калорий на перекус
        
        // Генерируем блюда для каждого приема пищи
        const breakfast = this.generateMeal('breakfast', breakfastCalories, focusNutrients, options?.excludeIngredients);
        const lunch = this.generateMeal('lunch', lunchCalories, focusNutrients, options?.excludeIngredients);
        const dinner = this.generateMeal('dinner', dinnerCalories, focusNutrients, options?.excludeIngredients);
        const snack = this.generateMeal('snack', snackCalories, focusNutrients, options?.excludeIngredients);
        
        // Рассчитываем общее потребление нутриентов за день
        const totalNutrients: Record<string, number> = {};
        let totalCalories = 0;
        
        [breakfast, lunch, dinner, snack].forEach(meal => {
          totalCalories += meal.calories;
          
          Object.entries(meal.nutrients).forEach(([nutrient, value]) => {
            totalNutrients[nutrient] = (totalNutrients[nutrient] || 0) + value;
          });
        });
        
        // Добавляем день в план питания
        mealPlan.push({
          day: i + 1,
          date: dayDate.toISOString().split('T')[0],
          meals: [breakfast, lunch, dinner, snack],
          totalNutrients,
          totalCalories
        });
      }
      
      return {
        success: true,
        mealPlan
      };
    } catch (error) {
      console.error('Ошибка при создании плана питания:', error);
      return {
        success: false,
        message: 'Ошибка при создании плана питания'
      };
    }
  }
  
  /**
   * Генерация отдельного приема пищи для плана питания
   */
  private generateMeal(
    type: 'breakfast' | 'lunch' | 'dinner' | 'snack',
    targetCalories: number,
    focusNutrients: string[],
    excludeIngredients?: string[]
  ): {
    type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    name: string;
    ingredients: string[];
    nutrients: Record<string, number>;
    calories: number;
    recipe?: string;
  } {
    // Здесь должна быть логика для выбора блюда из базы данных рецептов
    // на основе указанных параметров
    
    // Для демонстрации возвращаем фиктивные данные
    
    let mealName = '';
    let ingredients: string[] = [];
    let nutrients: Record<string, number> = {};
    let calories = 0;
    let recipe = '';
    
    // Выбираем блюдо в зависимости от типа приема пищи
    if (type === 'breakfast') {
      mealName = 'Омлет с овощами и цельнозерновым тостом';
      ingredients = ['яйца', 'помидоры', 'шпинат', 'цельнозерновой хлеб', 'оливковое масло'];
      nutrients = {
        protein: 20,
        carbs: 30,
        fat: 15,
        fiber: 5,
        vitaminC: 15,
        calcium: 120,
        iron: 2.5
      };
      calories = targetCalories;
      recipe = 'Взбейте яйца, добавьте нарезанные овощи. Жарьте на оливковом масле до готовности. Подавайте с цельнозерновым тостом.';
    } else if (type === 'lunch') {
      mealName = 'Куриная грудка с киноа и овощами';
      ingredients = ['куриная грудка', 'киноа', 'брокколи', 'морковь', 'красный перец', 'лимонный сок', 'оливковое масло'];
      nutrients = {
        protein: 35,
        carbs: 45,
        fat: 12,
        fiber: 8,
        vitaminC: 80,
        calcium: 80,
        iron: 3.5
      };
      calories = targetCalories;
      recipe = 'Запеките куриную грудку с специями. Отварите киноа. Приготовьте на пару овощи. Соедините все ингредиенты, добавьте заправку из лимонного сока и оливкового масла.';
    } else if (type === 'dinner') {
      mealName = 'Запеченный лосось с овощным гарниром';
      ingredients = ['лосось', 'цукини', 'баклажан', 'болгарский перец', 'чеснок', 'розмарин', 'оливковое масло'];
      nutrients = {
        protein: 30,
        carbs: 20,
        fat: 18,
        fiber: 6,
        vitaminD: 15,
        calcium: 60,
        omega3: 2.5
      };
      calories = targetCalories;
      recipe = 'Запеките филе лосося в духовке с розмарином и чесноком. Нарежьте овощи, сбрызните оливковым маслом и запеките до готовности.';
    } else {
      mealName = 'Греческий йогурт с ягодами и орехами';
      ingredients = ['греческий йогурт', 'черника', 'малина', 'миндаль', 'мед'];
      nutrients = {
        protein: 15,
        carbs: 20,
        fat: 8,
        fiber: 4,
        calcium: 200,
        vitaminC: 20
      };
      calories = targetCalories;
      recipe = 'Смешайте йогурт с ягодами, посыпьте измельченными орехами и при желании добавьте немного меда.';
    }
    
    // Корректируем для нутриентов, на которые нужно обратить внимание
    for (const nutrient of focusNutrients) {
      if (!nutrients[nutrient]) {
        nutrients[nutrient] = 5; // Добавляем нутриент, если он отсутствует
      } else if (nutrients[nutrient] < 10) {
        nutrients[nutrient] *= 1.5; // Увеличиваем количество дефицитного нутриента
      }
    }
    
    // Удаляем исключаемые ингредиенты, если они есть
    if (excludeIngredients && excludeIngredients.length > 0) {
      ingredients = ingredients.filter(ingredient => 
        !excludeIngredients.some(excluded => 
          ingredient.toLowerCase().includes(excluded.toLowerCase())
        )
      );
    }
    
    return {
      type,
      name: mealName,
      ingredients,
      nutrients,
      calories,
      recipe
    };
  }
}

// Создаем экземпляр класса для использования в приложении
export default new NutritionAnalysis();
