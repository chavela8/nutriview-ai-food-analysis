import AsyncStorage from '@react-native-async-storage/async-storage';
import { USDA_API_KEY, OPENAI_API_KEY, GOOGLE_VISION_API_KEY } from './ApiKeys';
import FoodDatabaseAPI from './FoodDatabaseAPI';
import AIServices from './AIServices';
import BackgroundSync from './BackgroundSync';

class AppInitialization {
  async initialize() {
    await this.initializeAPIKeys();
    await this.setupBackgroundSync();
  }

  async initializeAPIKeys() {
    try {
      // Загрузка сохраненных API ключей из AsyncStorage (если есть)
      const savedUSDAKey = await AsyncStorage.getItem('usda_api_key');
      const savedOpenAIKey = await AsyncStorage.getItem('openai_api_key');
      const savedGoogleVisionKey = await AsyncStorage.getItem('google_vision_api_key');
      
      // Установка API ключей для сервисов
      if (savedUSDAKey) {
        FoodDatabaseAPI.setUSDAApiKey(savedUSDAKey);
      } else {
        // Используем ключ по умолчанию из lib/ApiKeys.ts
        FoodDatabaseAPI.setUSDAApiKey(USDA_API_KEY);
      }
      
      // Установка ключей для AI сервисов
      AIServices.setAPIKeys(
        savedOpenAIKey || OPENAI_API_KEY,
        savedGoogleVisionKey || GOOGLE_VISION_API_KEY
      );
      
      console.log('API ключи успешно инициализированы');
    } catch (error) {
      console.error('Ошибка при инициализации API ключей:', error);
    }
  }

  async setupBackgroundSync() {
    try {
      // Проверка настроек автоматической синхронизации
      const syncSettingsStr = await AsyncStorage.getItem('health_sync_settings');
      if (syncSettingsStr) {
        const syncSettings = JSON.parse(syncSettingsStr);
        
        // Если автосинхронизация включена, настраиваем фоновые задачи
        if (syncSettings.autoSync) {
          console.log('Настройка фоновой синхронизации...');
          await BackgroundSync.configure();
        }
      }
    } catch (error) {
      console.error('Ошибка при настройке фоновой синхронизации:', error);
    }
  }
}

export default new AppInitialization();
