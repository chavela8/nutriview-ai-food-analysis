import axios from 'axios';
import { OPENAI_API_KEY, GOOGLE_VISION_API_KEY } from './ApiKeys';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface NutritionQuestion {
  id: string;
  question: string;
  answer?: string;
  timestamp: number;
  isAnswering?: boolean;
  category?: string;
}

export interface ImageAnalysisResult {
  detectedFood: {
    name: string;
    probability: number;
  }[];
  nutritionFacts?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    servingSize?: string;
  };
  error?: string;
}

class AIServices {
  private OPENAI_API_KEY: string = OPENAI_API_KEY;
  private GOOGLE_VISION_API_KEY: string = GOOGLE_VISION_API_KEY;
  
  // Установка ключей API
  setAPIKeys(openAIKey: string, googleVisionKey: string) {
    this.OPENAI_API_KEY = openAIKey;
    this.GOOGLE_VISION_API_KEY = googleVisionKey;
  }
  
  // Получение ответа на вопрос по питанию
  async askNutritionQuestion(question: string): Promise<string> {
    if (!this.OPENAI_API_KEY) {
      console.warn('OpenAI API ключ не настроен');
      return 'Извините, но сервис AI временно недоступен. Пожалуйста, проверьте настройки API ключа.';
    }
    
    try {
      // Создание контекста для запроса
      const prompt = `Я диетолог и нутрициолог. Вы задали вопрос о питании: "${question}"\n\nМой профессиональный ответ:`;
      
      const response = await axios.post(
        'https://api.openai.com/v1/completions',
        {
          model: 'gpt-3.5-turbo-instruct',
          prompt,
          max_tokens: 500,
          temperature: 0.7
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.OPENAI_API_KEY}`
          }
        }
      );
      
      if (response.data && response.data.choices && response.data.choices.length > 0) {
        return response.data.choices[0].text.trim();
      } else {
        return 'Извините, я не смог сформулировать ответ на ваш вопрос. Пожалуйста, попробуйте задать вопрос по-другому.';
      }
    } catch (error) {
      console.error('Ошибка при запросе к OpenAI:', error);
      return 'Произошла ошибка при обработке вашего вопроса. Пожалуйста, попробуйте позже.';
    }
  }
  
  // Генерация персонализированного плана питания
  async generateMealPlan(preferences: {
    calorieTarget: number;
    dietType: string;  // e.g., 'vegetarian', 'keto', 'balanced'
    allergies: string[];
    numberOfDays: number;
    mealsPerDay: number;
  }): Promise<string> {
    if (!this.OPENAI_API_KEY) {
      console.warn('OpenAI API ключ не настроен');
      return 'Извините, но сервис AI временно недоступен. Пожалуйста, проверьте настройки API ключа.';
    }
    
    try {
      const allergiesText = preferences.allergies.length > 0 
        ? `Аллергии/Исключения: ${preferences.allergies.join(', ')}.` 
        : 'Нет аллергий или исключений.';
      
      const prompt = `Создай план питания на ${preferences.numberOfDays} дней с ${preferences.mealsPerDay} приемами пищи в день.
Целевые калории: ${preferences.calorieTarget} в день.
Тип питания: ${preferences.dietType}.
${allergiesText}

План питания должен включать разнообразные блюда, быть хорошо сбалансированным и реалистичным для приготовления.
Для каждого приема пищи, укажи название блюда, основные ингредиенты и примерные калории.`;
      
      const response = await axios.post(
        'https://api.openai.com/v1/completions',
        {
          model: 'gpt-3.5-turbo-instruct',
          prompt,
          max_tokens: 1500,
          temperature: 0.7
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.OPENAI_API_KEY}`
          }
        }
      );
      
      if (response.data && response.data.choices && response.data.choices.length > 0) {
        return response.data.choices[0].text.trim();
      } else {
        return 'Извините, я не смог сгенерировать план питания. Пожалуйста, попробуйте изменить параметры.';
      }
    } catch (error) {
      console.error('Ошибка при запросе к OpenAI для генерации плана питания:', error);
      return 'Произошла ошибка при создании плана питания. Пожалуйста, попробуйте позже.';
    }
  }
  
  // Анализ фотографии еды
  async analyzeFoodImage(imageBase64: string): Promise<ImageAnalysisResult> {
    if (!this.GOOGLE_VISION_API_KEY) {
      console.warn('Google Vision API ключ не настроен');
      return {
        detectedFood: [],
        error: 'API ключ для распознавания изображений не настроен'
      };
    }
    
    try {
      // Запрос к Google Vision API для распознавания объектов
      const visionResponse = await axios.post(
        `https://vision.googleapis.com/v1/images:annotate?key=${this.GOOGLE_VISION_API_KEY}`,
        {
          requests: [
            {
              image: {
                content: imageBase64
              },
              features: [
                {
                  type: 'LABEL_DETECTION',
                  maxResults: 10
                },
                {
                  type: 'WEB_DETECTION',
                  maxResults: 10
                }
              ]
            }
          ]
        }
      );
      
      // Обработка результатов Google Vision
      const visionData = visionResponse.data;
      
      if (!visionData.responses || visionData.responses.length === 0) {
        return {
          detectedFood: [],
          error: 'Не удалось распознать изображение'
        };
      }
      
      // Извлечение информации о распознанных объектах
      const labels = visionData.responses[0].labelAnnotations || [];
      const webEntities = visionData.responses[0].webDetection?.webEntities || [];
      
      // Фильтрация только пищевых продуктов из распознанных меток
      const foodKeywords = ['food', 'dish', 'cuisine', 'meal', 'breakfast', 'lunch', 'dinner', 
                          'fruit', 'vegetable', 'meat', 'dessert', 'snack', 'recipe'];
      
      const possibleFoodLabels = labels
        .filter((label: any) => {
          // Проверяем, содержит ли метка пищевые ключевые слова
          const description = label.description.toLowerCase();
          return foodKeywords.some(keyword => description.includes(keyword)) || 
                 label.score > 0.7; // Также добавляем метки с высокой уверенностью
        })
        .map((label: any) => ({
          name: label.description,
          probability: label.score
        }));
      
      // Добавляем веб-сущности, если они не дублируют уже имеющиеся метки
      const webFoodEntities = webEntities
        .filter((entity: any) => {
          const description = entity.description.toLowerCase();
          return foodKeywords.some(keyword => description.includes(keyword)) &&
                 !possibleFoodLabels.some(label => label.name.toLowerCase() === description);
        })
        .map((entity: any) => ({
          name: entity.description,
          probability: entity.score / 1.0 // Нормализация значения
        }));
      
      const detectedFood = [...possibleFoodLabels, ...webFoodEntities]
        .sort((a, b) => b.probability - a.probability)
        .slice(0, 5); // Берем только 5 наиболее вероятных объектов
      
      if (detectedFood.length === 0) {
        return {
          detectedFood: [],
          error: 'Не удалось распознать продукты питания на изображении'
        };
      }
      
      // Теперь запрашиваем информацию о питательной ценности через OpenAI
      if (this.OPENAI_API_KEY) {
        const foodNames = detectedFood.map(food => food.name).join(', ');
        
        const nutritionPrompt = `На изображении обнаружены следующие продукты питания: ${foodNames}.
Предоставь примерную информацию о питательной ценности на порцию (в формате JSON):
- калории (kcal)
- белок (г)
- углеводы (г)
- жиры (г)
- размер порции`;
        
        const nutritionResponse = await axios.post(
          'https://api.openai.com/v1/completions',
          {
            model: 'gpt-3.5-turbo-instruct',
            prompt: nutritionPrompt,
            max_tokens: 500,
            temperature: 0.3
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.OPENAI_API_KEY}`
            }
          }
        );
        
        if (nutritionResponse.data && nutritionResponse.data.choices && nutritionResponse.data.choices.length > 0) {
          const nutritionText = nutritionResponse.data.choices[0].text.trim();
          
          try {
            // Пытаемся извлечь JSON из ответа
            const jsonMatch = nutritionText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const nutritionJson = JSON.parse(jsonMatch[0]);
              
              return {
                detectedFood,
                nutritionFacts: {
                  calories: nutritionJson.calories || nutritionJson.калории,
                  protein: nutritionJson.protein || nutritionJson.белок,
                  carbs: nutritionJson.carbs || nutritionJson.углеводы,
                  fat: nutritionJson.fat || nutritionJson.жиры,
                  servingSize: nutritionJson.servingSize || nutritionJson['размер порции']
                }
              };
            }
          } catch (error) {
            console.error('Ошибка при обработке информации о питательной ценности:', error);
            // Если не удалось обработать JSON, просто возвращаем распознанные продукты
          }
        }
      }
      
      // Если не удалось получить информацию о питательной ценности, просто возвращаем распознанные продукты
      return { detectedFood };
      
    } catch (error) {
      console.error('Ошибка при анализе изображения:', error);
      return {
        detectedFood: [],
        error: 'Произошла ошибка при анализе изображения'
      };
    }
  }
  
  // Сохранение вопроса в истории
  async saveQuestion(question: string, answer: string): Promise<void> {
    try {
      const historyStr = await AsyncStorage.getItem('nutrition_questions_history');
      const history: NutritionQuestion[] = historyStr ? JSON.parse(historyStr) : [];
      
      // Категоризация вопроса
      const categories = [
        { name: 'Потеря веса', keywords: ['похудение', 'вес', 'калории', 'диета', 'жир', 'сбросить'] },
        { name: 'Набор массы', keywords: ['набор массы', 'мышцы', 'белок', 'вес набрать', 'масса'] },
        { name: 'Здоровое питание', keywords: ['здоровое', 'витамины', 'минералы', 'питание', 'полезное'] },
        { name: 'Диеты', keywords: ['кето', 'веган', 'вегетарианство', 'палео', 'безглютеновая', 'детокс'] },
        { name: 'Спортивное питание', keywords: ['спорт', 'тренировка', 'восстановление', 'энергия', 'добавки'] }
      ];
      
      let category = 'Другое';
      const lowerQuestion = question.toLowerCase();
      
      for (const cat of categories) {
        if (cat.keywords.some(keyword => lowerQuestion.includes(keyword))) {
          category = cat.name;
          break;
        }
      }
      
      // Создание нового вопроса
      const newQuestion: NutritionQuestion = {
        id: `question-${Date.now()}`,
        question,
        answer,
        timestamp: Date.now(),
        category
      };
      
      // Добавление в историю
      history.unshift(newQuestion);
      
      // Ограничение истории до 100 вопросов
      const limitedHistory = history.slice(0, 100);
      
      await AsyncStorage.setItem('nutrition_questions_history', JSON.stringify(limitedHistory));
    } catch (error) {
      console.error('Ошибка при сохранении вопроса:', error);
    }
  }
  
  // Получение истории вопросов
  async getQuestionsHistory(): Promise<NutritionQuestion[]> {
    try {
      const historyStr = await AsyncStorage.getItem('nutrition_questions_history');
      return historyStr ? JSON.parse(historyStr) : [];
    } catch (error) {
      console.error('Ошибка при получении истории вопросов:', error);
      return [];
    }
  }
}

export default new AIServices();
