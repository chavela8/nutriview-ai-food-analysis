import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { USDA_API_KEY } from './ApiKeys';

// Интерфейсы для работы с продуктами
export interface FoodProduct {
  id: string;
  name: string;
  brand?: string;
  barcode?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  servingSize: number;
  servingUnit: string;
  image?: string;
  source: 'USDA' | 'OpenFoodFacts' | 'Custom';
}

class FoodDatabaseAPI {
  private USDA_API_KEY: string = USDA_API_KEY;
  private CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 дней в мс
  
  // Задание API ключа
  setUSDAApiKey(key: string) {
    this.USDA_API_KEY = key;
  }
  
  // Поиск продукта по штрих-коду
  async searchByBarcode(barcode: string): Promise<FoodProduct | null> {
    try {
      // Сначала проверяем кэш
      const cachedProduct = await this.getCachedProduct(`barcode_${barcode}`);
      if (cachedProduct) {
        return cachedProduct;
      }
      
      // Поиск в Open Food Facts, так как USDA не поддерживает поиск по штрих-коду
      const product = await this.searchOpenFoodFacts(barcode);
      
      if (product) {
        // Кэшируем результат
        await this.cacheProduct(`barcode_${barcode}`, product);
        return product;
      }
      
      return null;
    } catch (error) {
      console.error('Ошибка при поиске по штрих-коду:', error);
      return null;
    }
  }
  
  // Поиск продуктов по названию
  async searchByName(query: string, limit: number = 20): Promise<FoodProduct[]> {
    try {
      // Сначала проверяем кэш
      const cacheKey = `name_search_${query}_${limit}`;
      const cachedResults = await this.getCachedResults(cacheKey);
      if (cachedResults && cachedResults.length > 0) {
        return cachedResults;
      }
      
      // Поиск в USDA
      const usdaResults = await this.searchUSDA(query, limit);
      
      // Поиск в Open Food Facts
      const offResults = await this.searchOpenFoodFactsByName(query, limit);
      
      // Объединяем результаты
      const combinedResults = [...usdaResults, ...offResults].slice(0, limit);
      
      // Кэшируем результаты
      await this.cacheResults(cacheKey, combinedResults);
      
      return combinedResults;
    } catch (error) {
      console.error('Ошибка при поиске по названию:', error);
      return [];
    }
  }
  
  // Получение подробной информации о продукте по ID
  async getProductDetails(id: string, source: 'USDA' | 'OpenFoodFacts'): Promise<FoodProduct | null> {
    try {
      // Проверяем кэш
      const cachedProduct = await this.getCachedProduct(`product_${source}_${id}`);
      if (cachedProduct) {
        return cachedProduct;
      }
      
      let product: FoodProduct | null = null;
      
      if (source === 'USDA') {
        product = await this.getUSDAProductDetails(id);
      } else if (source === 'OpenFoodFacts') {
        product = await this.getOpenFoodFactsProductDetails(id);
      }
      
      if (product) {
        // Кэшируем результат
        await this.cacheProduct(`product_${source}_${id}`, product);
        return product;
      }
      
      return null;
    } catch (error) {
      console.error('Ошибка при получении деталей продукта:', error);
      return null;
    }
  }
  
  // Поиск продукта в USDA
  private async searchUSDA(query: string, limit: number): Promise<FoodProduct[]> {
    if (!this.USDA_API_KEY) {
      console.warn('USDA API ключ не настроен');
      return [];
    }
    
    try {
      const response = await axios.get(
        `https://api.nal.usda.gov/fdc/v1/foods/search`, {
          params: {
            api_key: this.USDA_API_KEY,
            query,
            pageSize: limit,
            dataType: 'Survey (FNDDS)'
          }
        }
      );
      
      if (response.data && response.data.foods) {
        return response.data.foods.map((item: any) => this.mapUSDAFoodToProduct(item));
      }
      
      return [];
    } catch (error) {
      console.error('Ошибка при поиске в USDA:', error);
      return [];
    }
  }
  
  // Получение деталей продукта из USDA
  private async getUSDAProductDetails(id: string): Promise<FoodProduct | null> {
    if (!this.USDA_API_KEY) {
      console.warn('USDA API ключ не настроен');
      return null;
    }
    
    try {
      const response = await axios.get(
        `https://api.nal.usda.gov/fdc/v1/food/${id}`, {
          params: {
            api_key: this.USDA_API_KEY
          }
        }
      );
      
      if (response.data) {
        return this.mapUSDAFoodToProduct(response.data);
      }
      
      return null;
    } catch (error) {
      console.error('Ошибка при получении деталей продукта из USDA:', error);
      return null;
    }
  }
  
  // Поиск продукта в Open Food Facts по штрих-коду
  private async searchOpenFoodFacts(barcode: string): Promise<FoodProduct | null> {
    try {
      const response = await axios.get(
        `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
      );
      
      if (response.data && response.data.status === 1 && response.data.product) {
        return this.mapOFFProductToProduct(response.data.product);
      }
      
      return null;
    } catch (error) {
      console.error('Ошибка при поиске в Open Food Facts:', error);
      return null;
    }
  }
  
  // Поиск продуктов в Open Food Facts по названию
  private async searchOpenFoodFactsByName(query: string, limit: number): Promise<FoodProduct[]> {
    try {
      const response = await axios.get(
        `https://world.openfoodfacts.org/cgi/search.pl`, {
          params: {
            search_terms: query,
            json: 1,
            page_size: limit
          }
        }
      );
      
      if (response.data && response.data.products) {
        return response.data.products
          .map((product: any) => this.mapOFFProductToProduct(product))
          .filter((product: FoodProduct | null) => product !== null) as FoodProduct[];
      }
      
      return [];
    } catch (error) {
      console.error('Ошибка при поиске в Open Food Facts по названию:', error);
      return [];
    }
  }
  
  // Получение деталей продукта из Open Food Facts
  private async getOpenFoodFactsProductDetails(id: string): Promise<FoodProduct | null> {
    try {
      const response = await axios.get(
        `https://world.openfoodfacts.org/api/v0/product/${id}.json`
      );
      
      if (response.data && response.data.status === 1 && response.data.product) {
        return this.mapOFFProductToProduct(response.data.product);
      }
      
      return null;
    } catch (error) {
      console.error('Ошибка при получении деталей продукта из Open Food Facts:', error);
      return null;
    }
  }
  
  // Преобразование USDA данных в формат FoodProduct
  private mapUSDAFoodToProduct(usdaFood: any): FoodProduct {
    // Поиск питательных веществ в данных
    const getNutrientValue = (nutrients: any[], nutrientId: number, defaultValue: number = 0) => {
      const nutrient = nutrients.find(n => n.nutrientId === nutrientId);
      return nutrient ? nutrient.value : defaultValue;
    };
    
    // Извлечение данных из USDA формата
    const nutrients = usdaFood.foodNutrients || [];
    
    return {
      id: usdaFood.fdcId,
      name: usdaFood.description || usdaFood.lowercaseDescription || 'Неизвестный продукт',
      brand: usdaFood.brandOwner || usdaFood.brandName || undefined,
      calories: getNutrientValue(nutrients, 1008), // Энергия (ккал)
      protein: getNutrientValue(nutrients, 1003), // Белок
      carbs: getNutrientValue(nutrients, 1005), // Углеводы
      fat: getNutrientValue(nutrients, 1004), // Жиры
      fiber: getNutrientValue(nutrients, 1079), // Клетчатка
      sugar: getNutrientValue(nutrients, 2000), // Сахар
      sodium: getNutrientValue(nutrients, 1093), // Натрий
      servingSize: usdaFood.servingSize || 100,
      servingUnit: usdaFood.servingSizeUnit || 'g',
      source: 'USDA'
    };
  }
  
  // Преобразование Open Food Facts данных в формат FoodProduct
  private mapOFFProductToProduct(offProduct: any): FoodProduct | null {
    // Проверка наличия обязательных полей
    if (!offProduct.product_name || !offProduct.nutriments) {
      return null;
    }
    
    // Получение значения питательного вещества с учетом размера порции
    const getNutrientValue = (nutriments: any, key: string, defaultValue: number = 0) => {
      return nutriments[key] !== undefined ? Number(nutriments[key]) : defaultValue;
    };
    
    const nutriments = offProduct.nutriments;
    
    return {
      id: offProduct.code || offProduct._id,
      name: offProduct.product_name,
      brand: offProduct.brands,
      barcode: offProduct.code,
      calories: getNutrientValue(nutriments, 'energy-kcal_100g') || getNutrientValue(nutriments, 'energy_100g') / 4.184,
      protein: getNutrientValue(nutriments, 'proteins_100g'),
      carbs: getNutrientValue(nutriments, 'carbohydrates_100g'),
      fat: getNutrientValue(nutriments, 'fat_100g'),
      fiber: getNutrientValue(nutriments, 'fiber_100g'),
      sugar: getNutrientValue(nutriments, 'sugars_100g'),
      sodium: getNutrientValue(nutriments, 'sodium_100g') * 1000, // конвертация из г в мг
      servingSize: offProduct.serving_quantity || 100,
      servingUnit: offProduct.serving_size || 'g',
      image: offProduct.image_url,
      source: 'OpenFoodFacts'
    };
  }
  
  // Сохранение продукта в кэш
  private async cacheProduct(key: string, product: FoodProduct): Promise<void> {
    try {
      // Добавление временной метки для управления сроком кэша
      const cacheData = {
        timestamp: Date.now(),
        product
      };
      
      await AsyncStorage.setItem(key, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Ошибка при кэшировании продукта:', error);
    }
  }
  
  // Получение продукта из кэша
  private async getCachedProduct(key: string): Promise<FoodProduct | null> {
    try {
      const cachedDataStr = await AsyncStorage.getItem(key);
      if (!cachedDataStr) return null;
      
      const cachedData = JSON.parse(cachedDataStr);
      
      // Проверка срока действия кэша
      if (Date.now() - cachedData.timestamp > this.CACHE_EXPIRY) {
        // Кэш устарел
        await AsyncStorage.removeItem(key);
        return null;
      }
      
      return cachedData.product;
    } catch (error) {
      console.error('Ошибка при получении продукта из кэша:', error);
      return null;
    }
  }
  
  // Сохранение результатов поиска в кэш
  private async cacheResults(key: string, products: FoodProduct[]): Promise<void> {
    try {
      const cacheData = {
        timestamp: Date.now(),
        products
      };
      
      await AsyncStorage.setItem(key, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Ошибка при кэшировании результатов поиска:', error);
    }
  }
  
  // Получение результатов поиска из кэша
  private async getCachedResults(key: string): Promise<FoodProduct[] | null> {
    try {
      const cachedDataStr = await AsyncStorage.getItem(key);
      if (!cachedDataStr) return null;
      
      const cachedData = JSON.parse(cachedDataStr);
      
      // Проверка срока действия кэша
      if (Date.now() - cachedData.timestamp > this.CACHE_EXPIRY) {
        // Кэш устарел
        await AsyncStorage.removeItem(key);
        return null;
      }
      
      return cachedData.products;
    } catch (error) {
      console.error('Ошибка при получении результатов поиска из кэша:', error);
      return null;
    }
  }
  
  // Создание пользовательского продукта
  async createCustomProduct(product: Omit<FoodProduct, 'id' | 'source'>): Promise<FoodProduct> {
    const customId = `custom-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    const customProduct: FoodProduct = {
      ...product,
      id: customId,
      source: 'Custom'
    };
    
    try {
      // Сохранение в пользовательскую базу данных продуктов
      const customProductsStr = await AsyncStorage.getItem('custom_products');
      const customProducts: FoodProduct[] = customProductsStr ? JSON.parse(customProductsStr) : [];
      
      customProducts.push(customProduct);
      await AsyncStorage.setItem('custom_products', JSON.stringify(customProducts));
      
      return customProduct;
    } catch (error) {
      console.error('Ошибка при создании пользовательского продукта:', error);
      return customProduct; // Все равно возвращаем продукт, даже если не удалось сохранить
    }
  }
  
  // Получение всех пользовательских продуктов
  async getCustomProducts(): Promise<FoodProduct[]> {
    try {
      const customProductsStr = await AsyncStorage.getItem('custom_products');
      return customProductsStr ? JSON.parse(customProductsStr) : [];
    } catch (error) {
      console.error('Ошибка при получении пользовательских продуктов:', error);
      return [];
    }
  }
  
  // Удаление пользовательского продукта
  async deleteCustomProduct(id: string): Promise<boolean> {
    try {
      const customProductsStr = await AsyncStorage.getItem('custom_products');
      if (!customProductsStr) return false;
      
      const customProducts: FoodProduct[] = JSON.parse(customProductsStr);
      const updatedProducts = customProducts.filter(product => product.id !== id);
      
      if (customProducts.length === updatedProducts.length) {
        return false; // Продукт не найден
      }
      
      await AsyncStorage.setItem('custom_products', JSON.stringify(updatedProducts));
      return true;
    } catch (error) {
      console.error('Ошибка при удалении пользовательского продукта:', error);
      return false;
    }
  }
}

export default new FoodDatabaseAPI();
