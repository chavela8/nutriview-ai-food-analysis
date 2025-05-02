import axios from 'axios';
import { GOOGLE_VISION_API_KEY } from './ApiKeys';
import FoodDatabaseAPI, { FoodProduct } from './FoodDatabaseAPI';

class FoodRecognitionService {
  private VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate';
  
  async recognizeFoodFromImage(imageBase64: string): Promise<{
    success: boolean,
    detectedItems: string[],
    suggestedFoods?: FoodProduct[]
  }> {
    try {
      // Запрос к Google Vision API
      const response = await axios.post(
        `${this.VISION_API_URL}?key=${GOOGLE_VISION_API_KEY}`,
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
      
      if (!response.data || !response.data.responses || !response.data.responses[0]) {
        throw new Error('Неожиданный формат ответа от Google Vision API');
      }
      
      // Объединение меток и веб-сущностей для лучшего распознавания
      const labels = response.data.responses[0].labelAnnotations || [];
      const webEntities = response.data.responses[0].webDetection?.webEntities || [];
      
      // Фильтрация только меток, связанных с едой
      const foodLabels = labels
        .filter((label: any) => this.isFoodRelated(label.description))
        .map((label: any) => label.description);
      
      // Фильтрация только веб-сущностей, связанных с едой
      const foodWebEntities = webEntities
        .filter((entity: any) => entity.description && this.isFoodRelated(entity.description))
        .map((entity: any) => entity.description);
      
      // Объединение уникальных результатов
      const uniqueFoodItems = Array.from(new Set([...foodLabels, ...foodWebEntities]));
      
      if (uniqueFoodItems.length === 0) {
        return {
          success: false,
          detectedItems: [],
          suggestedFoods: []
        };
      }
      
      // Поиск продуктов на основе распознанных меток
      const suggestedFoods: FoodProduct[] = [];
      
      // Ищем продукты для каждой метки (до 3 продуктов на метку)
      for (const label of uniqueFoodItems.slice(0, 3)) {
        const foods = await FoodDatabaseAPI.searchByName(label, 2);
        suggestedFoods.push(...foods);
      }
      
      return {
        success: true,
        detectedItems: uniqueFoodItems,
        suggestedFoods: suggestedFoods.slice(0, 10) // Лимитируем до 10 предложений
      };
    } catch (error) {
      console.error('Ошибка при распознавании пищи:', error);
      return {
        success: false,
        detectedItems: [],
      };
    }
  }
  
  // Проверка, связана ли метка с пищей
  private isFoodRelated(label: string): boolean {
    const foodKeywords = [
      'food', 'eat', 'meal', 'dish', 'cuisine', 'breakfast', 'lunch', 'dinner',
      'fruit', 'vegetable', 'meat', 'fish', 'dairy', 'dessert', 'snack',
      'пища', 'еда', 'блюдо', 'завтрак', 'обед', 'ужин', 'фрукт', 'овощ',
      'мясо', 'рыба', 'молочный', 'десерт', 'закуска', 'суп', 'салат', 'напиток'
    ];
    
    // Набор слов, не связанных с пищей, но часто встречающихся в распознавании
    const nonFoodKeywords = [
      'person', 'human', 'people', 'table', 'furniture', 'room', 'product',
      'человек', 'люди', 'стол', 'мебель', 'комната', 'продукт', 'изображение'
    ];
    
    // Проверка на ключевые слова пищи
    const labelLower = label.toLowerCase();
    const hasFoodKeyword = foodKeywords.some(keyword => labelLower.includes(keyword));
    const hasNonFoodKeyword = nonFoodKeywords.some(keyword => labelLower === keyword);
    
    return hasFoodKeyword && !hasNonFoodKeyword;
  }
}

export default new FoodRecognitionService();
