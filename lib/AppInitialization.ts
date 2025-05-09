/**
 * Сервис инициализации приложения
 * Выполняет необходимые действия при запуске:
 * - Настройка уведомлений
 * - Инициализация API ключей
 * - Загрузка данных пользователя
 * - Настройка аналитики
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as SplashScreen from 'expo-splash-screen';
import { AIRecommendationEngine } from './AIRecommendationEngine.enhanced';
import { USDA_API_KEY, OPENAI_API_KEY, GOOGLE_VISION_API_KEY } from './ApiKeys';
import FoodDatabaseAPI from './FoodDatabaseAPI';
import AIServices from './AIServices';
import BackgroundSync from './BackgroundSync';

// Информация о разработчике
const DEVELOPER_INFO = {
  name: 'Roman Markan',
  github: 'https://github.com/chavela8',
  version: '1.0.0'
};

class AppInitializer {
  private initialized: boolean = false;
  private aiEngine: AIRecommendationEngine | null = null;

  /**
   * Инициализация всех компонентов приложения
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('Starting app initialization...');

      // Сохраняем информацию о разработчике для доступа из других частей приложения
      await this.saveDeveloperInfo();
      
      // Инициализируем AI движок и API ключи
      this.aiEngine = new AIRecommendationEngine();
      await this.initializeAPIKeys();
      
      // Загружаем данные пользователя
      await this.loadUserData();
      
      // Настраиваем уведомления
      await this.setupNotifications();
      
      // Инициализируем фоновую синхронизацию
      await this.setupBackgroundSync();
      
      this.initialized = true;
      console.log('App initialization completed successfully');
    } catch (error) {
      console.error('Error during app initialization:', error);
      // Обработка ошибок инициализации
    } finally {
      // Скрываем splash screen, если он еще отображается
      try {
        await SplashScreen.hideAsync();
      } catch (e) {
        // Splash screen возможно уже был скрыт
      }
    }
  }

  /**
   * Сохраняем информацию о разработчике
   */
  private async saveDeveloperInfo(): Promise<void> {
    try {
      await AsyncStorage.setItem('developer_info', JSON.stringify(DEVELOPER_INFO));
      console.log('Developer info saved:', DEVELOPER_INFO.name);
    } catch (error) {
      console.warn('Error saving developer info:', error);
    }
  }

  /**
   * Инициализируем API ключи
   */
  private async initializeAPIKeys(): Promise<void> {
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
      
      console.log('API keys successfully initialized');
    } catch (error) {
      console.error('Error initializing API keys:', error);
    }
  }

  /**
   * Загружаем данные пользователя
   */
  private async loadUserData(): Promise<void> {
    try {
      const userId = await AsyncStorage.getItem('user_id');
      if (userId && this.aiEngine) {
        this.aiEngine.setUserId(userId);
        console.log('User data loaded for ID:', userId);
      }
    } catch (error) {
      console.warn('Error loading user data:', error);
    }
  }

  /**
   * Настройка системы уведомлений
   */
  private async setupNotifications(): Promise<void> {
    try {
      // В реальном приложении здесь бы вызывались методы настройки уведомлений
      console.log('Notifications configured for platform:', Platform.OS);
    } catch (error) {
      console.warn('Error setting up notifications:', error);
    }
  }

  /**
   * Настройка фоновой синхронизации
   */
  private async setupBackgroundSync(): Promise<void> {
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

  /**
   * Получение экземпляра AI движка
   */
  getAIEngine(): AIRecommendationEngine | null {
    return this.aiEngine;
  }

  /**
   * Очистка ресурсов при выходе
   */
  shutdown(): void {
    if (this.aiEngine) {
      // Освобождаем ресурсы
      this.aiEngine = null;
    }
    this.initialized = false;
    console.log('App resources cleaned up');
  }
}

// Экспортируем синглтон
export default new AppInitializer();
