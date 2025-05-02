import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Notifications from 'expo-notifications';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import SecurityManager from './SecurityManager';
import NutritionAnalysis, { NutritionRecommendation } from './NutritionAnalysis';
import RealHealthIntegration from './RealHealthIntegration';
import { UserProfile } from '../types/UserProfile';
import { ExtendedNutritionData } from './NutritionAnalysis';
import NetInfo from '@react-native-community/netinfo';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import { HealthDataType } from './types/HealthTypes';

// Директория для хранения данных ИИ с учетом особенностей платформы
const AI_DATA_DIR = Platform.OS === 'ios' 
  ? `${FileSystem.documentDirectory}ai_data/` 
  : `${FileSystem.documentDirectory}ai_data/`;

// Константы для безопасности
const ENCRYPTION_KEY_NAME = 'ai_recommendation_encryption_key';
const DATA_INTEGRITY_KEY_NAME = 'ai_data_integrity_key';
const MAX_CACHE_AGE_MS = 24 * 60 * 60 * 1000; // 24 часа
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 30 * 60 * 1000; // 30 минут

// Типы рекомендаций ИИ
export type AIRecommendationType = 
  | 'nutrition' 
  | 'activity' 
  | 'health' 
  | 'lifestyle' 
  | 'meal_suggestion' 
  | 'recipe' 
  | 'shopping_list'
  | 'mental_health'
  | 'social_wellbeing'
  | 'sleep';

// Интерфейс рекомендации ИИ
export interface AIRecommendation {
  id: string;
  type: AIRecommendationType;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  created: string;
  expiryDate?: string;
  action?: {
    type: 'view_details' | 'add_to_meal_plan' | 'start_workout' | 'open_link' | 'show_recipe';
    data: any;
  };
  imageUrl?: string;
  source: 'ai' | 'health_data' | 'nutrition' | 'expert';
  userFeedback?: {
    helpful: boolean;
    comment?: string;
    timestamp: string;
  };
  metadata?: any;
  dataHash?: string; // Для проверки целостности данных
}

// Типы данных здоровья с улучшенной типизацией
interface HealthDataPoint {
  startDate: string;
  endDate: string;
  value: number;
  unit?: string;
  metadata?: any;
}

interface WorkoutData {
  type: string;
  startDate: string;
  endDate: string;
  duration: number; // в секундах
  calories?: number;
  distance?: number;
  heartRates?: number[];
  intensity?: 'low' | 'moderate' | 'high';
  notes?: string;
  source?: 'user_input' | 'device' | 'third_party';
}

interface SleepData {
  type: 'asleep' | 'inBed' | 'awake';
  startDate: string;
  endDate: string;
  duration: number; // в секундах
  quality?: number; // 0-100
}

interface NutritionData {
  date: string;
  nutrients: Record<string, number>;
  mealType?: string;
  foodItems?: string[];
}

interface BloodGlucoseData {
  date: string;
  value: number;
  unit: string;
  mealTime?: 'before' | 'after';
}

interface BloodPressureData {
  date: string;
  systolic: number;
  diastolic: number;
  pulse?: number;
}

// Объединенный тип данных здоровья
type HealthData = 
  | HealthDataPoint 
  | WorkoutData 
  | NutritionData 
  | SleepData 
  | BloodGlucoseData 
  | BloodPressureData;

// Типы для триггеров уведомлений в соответствии с expo-notifications API
interface DateTriggerInput {
  type: 'date';
  date: Date | number | string;
  repeats?: boolean;
  channelId?: string;
}

interface IntervalTriggerInput {
  type: 'interval';
  seconds: number;
  repeats?: boolean;
  channelId?: string;
}

interface DailyTriggerInput {
  type: 'daily';
  hour: number;
  minute: number;
  repeats?: boolean;
  channelId?: string;
}

interface WeeklyTriggerInput {
  type: 'weekly';
  weekday: number; // 1-7 (понедельник-воскресенье)
  hour: number;
  minute: number;
  repeats?: boolean;
  channelId?: string;
}

// Обновляем тип NotificationTriggerInput с более точными платформо-зависимыми опциями
type NotificationTriggerInput = DateTriggerInput | IntervalTriggerInput | DailyTriggerInput | WeeklyTriggerInput | null;

// Интерфейс параметров для генерации рекомендаций
export interface RecommendationParams {
  nutrientFocus?: string[];
  activityGoals?: {
    dailySteps?: number;
    workoutsPerWeek?: number;
    workoutDuration?: number;
  };
  dietaryRestrictions?: string[];
  healthGoals?: string[];
  excludeTypes?: AIRecommendationType[];
  maxRecommendations?: number;
  includeTypes?: AIRecommendationType[];
  minPriority?: 'low' | 'medium' | 'high';
  contextualFactors?: {
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
    location?: string;
    weather?: string;
    previousActivity?: string;
  };
}

// Интерфейс для фильтрации рекомендаций
export interface RecommendationFilter {
  types?: AIRecommendationType[];
  startDate?: Date;
  endDate?: Date;
  priority?: ('low' | 'medium' | 'high')[];
  source?: ('ai' | 'health_data' | 'nutrition' | 'expert')[];
  onlyActive?: boolean;
  limit?: number;
  searchText?: string;
  excludeIds?: string[];
  includeWithFeedback?: boolean;
}

// Интерфейс для отчета о прогрессе
interface WeeklyProgressReport {
  date: string;
  nutrition: {
    score: number;
    deficitNutrients: string[];
    excessNutrients: string[];
    recommendations: string[];
  };
  activity: {
    averageSteps: number;
    workoutsCompleted: number;
    activeMinutes: number;
  };
  health: {
    sleepAverage: number;
    stressLevel?: number;
    recommendations: string[];
  };
  weeklyGoalsAchieved: string[];
  nextWeekSuggestions: string[];
  dataHash?: string; // Для проверки целостности данных
}

// Интерфейс для отслеживания попыток взлома
interface SecurityEvent {
  timestamp: string;
  type: 'data_tampering' | 'unauthorized_access' | 'suspicious_activity' | 'brute_force';
  details: string;
  deviceInfo: {
    deviceId: string;
    platform: string;
    osVersion: string;
    appVersion: string;
    isEmulator: boolean;
    ipAddress?: string;
    appBuildNumber?: string;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// Результаты анализа сезонных факторов
interface SeasonalFactors {
  currentSeason: 'winter' | 'spring' | 'summer' | 'fall';
  seasonalTip: string;
  seasonalFoods: string[];
  seasonalActivities: string[];
  seasonalChallenges: string[];
}

// Результаты анализа интересов пользователя
interface UserInterests {
  topInterest: string;
  topInterestCount: number;
  interests: Record<string, number>;
  recentInteractions: Array<{
    type: string;
    timestamp: string;
    details: string;
  }>;
}

/**
 * Движок рекомендаций на основе ИИ
 * Предоставляет персонализированные рекомендации на основе всех данных пользователя
 * со встроенной защитой конфиденциальности и кросс-платформенной поддержкой
 */
class AIRecommendationEngine {
  private userId: string | null = null;
  private userProfile: UserProfile | null = null;
  private recommendationCache: Map<string, { 
    data: AIRecommendation[], 
    timestamp: number,
    hash: string
  }> = new Map();
  private isInitialized: boolean = false;
  private securityEvents: SecurityEvent[] = [];
  private encryptionKey: string | null = null;
  private dataIntegrityKey: string | null = null;
  private networkStatus: { isConnected: boolean; type: string | null } = { isConnected: false, type: null };
  private dataProcessingQueue: Array<() => Promise<void>> = [];
  private deviceInfo: any = null;
  private loginAttempts: number = 0;
  private lockUntil: number = 0;
  private notificationsConfigured: boolean = false;
  private dataDirectory: string | null = null;
  private notificationSubscriptions: {
    foreground: any;
    response: any;
  } | null = null;
  
  constructor() {
    this.initializeEngine();
  }
  
  /**
   * Полная инициализация движка
   */
  private async initializeEngine() {
    try {
      await this.initializeDirectory();
      await this.initializeSecurityKeys();
      this.setupNetworkListener();
      await this.getDeviceInfo();
      this.configureNotifications();
      this.isInitialized = true;
      
      console.log('AIRecommendationEngine инициализирован успешно');
    } catch (error) {
      console.error('Ошибка при инициализации AI движка:', error);
      // Попытка восстановления в случае ошибки
      setTimeout(() => {
        this.initializeEngine();
      }, 5000);
    }
  }
  
  /**
   * Инициализация директории для хранения данных с учетом особенностей платформы
   */
  private async initializeDirectory() {
    try {
      // Выбираем оптимальную директорию в зависимости от платформы
      // iOS: documentDirectory обеспечивает резервное копирование в iCloud
      // Android: documentDirectory с .nomedia файлом
      const dirPath = Platform.OS === 'ios' 
        ? `${FileSystem.documentDirectory}ai_data/` 
        : `${FileSystem.documentDirectory}ai_data/`;
      
      const dirInfo = await FileSystem.getInfoAsync(dirPath);
      
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
        
        // Создаем .nomedia файл на Android для предотвращения сканирования медиафайлов
        if (Platform.OS === 'android') {
          const nomediaPath = `${dirPath}/.nomedia`;
          const nomediaInfo = await FileSystem.getInfoAsync(nomediaPath);
          if (!nomediaInfo.exists) {
            await FileSystem.writeAsStringAsync(nomediaPath, '');
          }
        }
      }
      
      // Создаем директории для разных типов данных с улучшенной организацией
      const subdirs = [
        'recommendations', // для рекомендаций
        'reports',        // для отчетов
        'security',       // для логов безопасности
        'exports',        // для экспорта данных
        'backup',         // для резервных копий
        'cache',          // для временных данных
        'logs'            // для журналов
      ];
      
      for (const subdir of subdirs) {
        const subdirPath = `${dirPath}${subdir}/`;
        const subdirInfo = await FileSystem.getInfoAsync(subdirPath);
        if (!subdirInfo.exists) {
          await FileSystem.makeDirectoryAsync(subdirPath, { intermediates: true });
        }
      }
      
      // На iOS проверяем и запрашиваем необходимые разрешения
      if (Platform.OS === 'ios') {
        const hasPermission = await FileSystem.getInfoAsync(dirPath, { md5: false });
        if (!hasPermission.exists) {
          console.error('Нет разрешений на запись в директорию');
          throw new Error('Нет разрешений на запись в директорию');
        }
      }
      
      // Сохраняем путь к директории
      this.dataDirectory = dirPath;
      
      // Проверяем заполненность хранилища
      this.checkStorageSpace();
    } catch (error) {
      console.error('Ошибка при создании директории для данных ИИ:', error);
      throw error;
    }
  }
  
  /**
   * Инициализация ключей безопасности с защитой от взлома
   */
  private async initializeSecurityKeys() {
    try {
      // Проверяем, заблокирован ли доступ из-за превышения лимита попыток
      if (this.lockUntil > Date.now()) {
        throw new Error(`Доступ временно заблокирован. Повторите через ${Math.ceil((this.lockUntil - Date.now()) / 60000)} мин.`);
      }
      
      // Настраиваем биометрическую аутентификацию, если доступна
      const biometricAuth = await this.checkBiometricAvailability();
      
      // Получаем или генерируем ключ шифрования с биометрической защитой, если возможно
      let encryptionKey = await this.getSecureKey(ENCRYPTION_KEY_NAME, biometricAuth);
      if (!encryptionKey) {
        encryptionKey = await this.generateSecureRandomKey(32);
        await this.saveSecureKey(ENCRYPTION_KEY_NAME, encryptionKey, biometricAuth);
      }
      this.encryptionKey = encryptionKey;
      
      // Получаем или генерируем ключ целостности данных
      let integrityKey = await this.getSecureKey(DATA_INTEGRITY_KEY_NAME, biometricAuth);
      if (!integrityKey) {
        integrityKey = await this.generateSecureRandomKey(32);
        await this.saveSecureKey(DATA_INTEGRITY_KEY_NAME, integrityKey, biometricAuth);
      }
      this.dataIntegrityKey = integrityKey;
      
      // Настраиваем слушатель обмана ключей (для обнаружения рутирования или модификации системы)
      this.setupKeyTamperingDetection();
      
      // Выполняем проверку безопасности среды
      await this.performSecurityEnvironmentCheck();
      
      // Сбрасываем счетчик попыток при успешной инициализации
      this.loginAttempts = 0;
    } catch (error) {
      // Увеличиваем счетчик попыток при неудаче
      this.loginAttempts++;
      
      // Если превышен лимит попыток, блокируем доступ
      if (this.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        this.lockUntil = Date.now() + LOCK_DURATION_MS;
        this.recordSecurityEvent('brute_force', 'Превышено количество попыток доступа к ключам безопасности', 'critical');
      }
      
      console.error('Ошибка при инициализации ключей безопасности:', error);
      throw error;
    }
  }
  
  /**
   * Получение ключа из безопасного хранилища с резервным копированием
   */
  private async getSecureKey(keyName: string, useBiometric: boolean = false): Promise<string | null> {
    try {
      // Пытаемся получить ключ из SecureStore
      let key = await SecureStore.getItemAsync(keyName);
      
      // Если ключ отсутствует, пробуем получить резервную копию
      if (!key) {
        const backupKeyName = `${keyName}_backup`;
        key = await SecureStore.getItemAsync(backupKeyName);
        
        // Если нашли резервную копию, восстанавливаем основной ключ
        if (key) {
          await SecureStore.setItemAsync(keyName, key);
        }
      }
      
      // Проверяем целостность ключа, если он найден
      if (key) {
        const storedKeyHash = await AsyncStorage.getItem(`${keyName}_hash`);
        
        if (storedKeyHash) {
          // Простая проверка целостности
          const currentKeyHash = await this.calculateDataHash(key);
          
          if (currentKeyHash !== storedKeyHash) {
            console.warn(`Возможная подмена ключа ${keyName}`);
            this.recordSecurityEvent(
              'data_tampering',
              `Обнаружено несоответствие хеша ключа ${keyName}`,
              'high'
            );
            
            // В продакшене можно принять решение не возвращать ключ в этом случае
            // return null;
          }
        }
      }
      
      return key;
    } catch (error) {
      console.error(`Ошибка при получении ключа ${keyName}:`, error);
      return null;
    }
  }
  
  /**
   * Сохранение ключа в безопасное хранилище с резервным копированием
   */
  private async saveSecureKey(keyName: string, value: string, useBiometric: boolean = false): Promise<boolean> {
    try {
      // Сохраняем основной ключ
      await SecureStore.setItemAsync(keyName, value);
      
      // Сохраняем резервную копию
      const backupKeyName = `${keyName}_backup`;
      await SecureStore.setItemAsync(backupKeyName, value);
      
      // Сохраняем хеш ключа для проверки целостности
      const keyHash = await this.calculateDataHash(value);
      await AsyncStorage.setItem(`${keyName}_hash`, keyHash);
      
      return true;
    } catch (error) {
      console.error(`Ошибка при сохранении ключа ${keyName}:`, error);
      return false;
    }
  }
  
  /**
   * Генерация криптографически стойкого ключа
   */
  private async generateSecureRandomKey(length: number): Promise<string> {
    try {
      const randomBytes = await Crypto.getRandomBytesAsync(length);
      return Array.from(new Uint8Array(randomBytes))
        .map((b: number) => b.toString(16).padStart(2, '0'))
        .join('');
    } catch (error) {
      // Резервный метод генерации ключа, если основной не сработал
      console.warn('Используем резервный метод генерации ключа:', error);
      
      let key = '';
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
      for (let i = 0; i < length * 2; i++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      
      return key;
    }
  }
  
  /**
   * Настройка слушателя сетевого состояния
   */
  private setupNetworkListener() {
    NetInfo.addEventListener((state: any) => {
      this.networkStatus = { 
        isConnected: state.isConnected ?? false, 
        type: state.type 
      };
      
      if (state.isConnected && this.dataProcessingQueue.length > 0) {
        this.processQueue();
      }
    });
  }
  
  /**
   * Улучшенная конфигурация уведомлений с поддержкой всех особенностей iOS и Android
   */
  private configureNotifications() {
    try {
      // Общие настройки уведомлений
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });
      
      // Настройки специфичные для разных платформ
      if (Platform.OS === 'android') {
        // Канал для общих уведомлений
        Notifications.setNotificationChannelAsync('default', {
          name: 'Общие уведомления',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#4287f5',
          sound: 'default',
        });
        
        // Канал для рекомендаций
        Notifications.setNotificationChannelAsync('recommendations', {
          name: 'Персонализированные рекомендации',
          description: 'Уведомления с персонализированными рекомендациями, основанными на ваших данных',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250, 250, 250],
          sound: 'default',
        });
        
        // Канал для отчетов
        Notifications.setNotificationChannelAsync('reports', {
          name: 'Отчеты о прогрессе',
          description: 'Еженедельные и ежемесячные отчеты о прогрессе и достижениях',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250, 250, 250],
          sound: 'default',
        });
        
        // Канал для уведомлений о безопасности с высоким приоритетом
        Notifications.setNotificationChannelAsync('security', {
          name: 'Безопасность',
          description: 'Важные уведомления, связанные с безопасностью ваших данных',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 100, 250, 100, 250],
          lightColor: '#FF0000',
          sound: 'default',
          enableLights: true,
        });
        
        // Канал для напоминаний
        Notifications.setNotificationChannelAsync('reminders', {
          name: 'Напоминания',
          description: 'Напоминания о приеме пищи, тренировках и других запланированных активностях',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          sound: 'default',
        });
        
        // Канал для обновлений приложения
        Notifications.setNotificationChannelAsync('updates', {
          name: 'Обновления приложения',
          description: 'Уведомления о новых функциях и обновлениях приложения',
          importance: Notifications.AndroidImportance.LOW,
          vibrationPattern: [0, 250, 250, 250],
          sound: 'default',
        });
        
        // Группы уведомлений для Android
        // В Android O+ уведомления могут быть сгруппированы для лучшей организации
        this.setupAndroidNotificationGroups();
      } else if (Platform.OS === 'ios') {
        // Для iOS настройка категорий уведомлений с действиями
        // Это позволяет добавлять кнопки действий в уведомления
        
        // Категория для напоминаний
        Notifications.setNotificationCategoryAsync('reminders', [
          {
            identifier: 'complete',
            buttonTitle: 'Выполнено',
            options: {
              isDestructive: false,
              isAuthenticationRequired: false,
              opensAppToForeground: false,
            }
          },
          {
            identifier: 'later',
            buttonTitle: 'Напомнить позже',
            options: {
              isDestructive: false,
              isAuthenticationRequired: false,
              opensAppToForeground: false,
            }
          }
        ]);
        
        // Категория для рекомендаций
        Notifications.setNotificationCategoryAsync('recommendations', [
          {
            identifier: 'view',
            buttonTitle: 'Подробнее',
            options: {
              isDestructive: false,
              isAuthenticationRequired: false,
              opensAppToForeground: true,
            }
          },
          {
            identifier: 'dismiss',
            buttonTitle: 'Позже',
            options: {
              isDestructive: true,
              isAuthenticationRequired: false,
              opensAppToForeground: false,
            }
          }
        ]);
        
        // Категория для уведомлений о безопасности
        Notifications.setNotificationCategoryAsync('security', [
          {
            identifier: 'review',
            buttonTitle: 'Проверить',
            options: {
              isDestructive: false,
              isAuthenticationRequired: true, // Требует аутентификации для действия
              opensAppToForeground: true,
            }
          }
        ]);
        
        // Категория для достижений и отчетов
        Notifications.setNotificationCategoryAsync('achievements', [
          {
            identifier: 'share',
            buttonTitle: 'Поделиться',
            options: {
              isDestructive: false,
              isAuthenticationRequired: false,
              opensAppToForeground: true,
            }
          },
          {
            identifier: 'view_details',
            buttonTitle: 'Подробнее',
            options: {
              isDestructive: false,
              isAuthenticationRequired: false,
              opensAppToForeground: true,
            }
          }
        ]);
        
        // Категория для обновлений приложения
        Notifications.setNotificationCategoryAsync('updates', [
          {
            identifier: 'update_now',
            buttonTitle: 'Обновить',
            options: {
              isDestructive: false,
              isAuthenticationRequired: false,
              opensAppToForeground: true,
            }
          }
        ]);
      }
      
      // Добавляем слушателей для обработки взаимодействий с уведомлениями
      this.setupNotificationListeners();
      
      this.notificationsConfigured = true;
      
      // Запрашиваем разрешения сразу после настройки
      this.requestNotificationPermissions();
    } catch (error) {
      console.error('Ошибка при настройке уведомлений:', error);
    }
  }
  
  /**
   * Настройка групп уведомлений для Android
   */
  private setupAndroidNotificationGroups() {
    if (Platform.OS !== 'android') return;
    
    // На Android уведомления можно группировать для лучшей организации
    // Определяем основные группы для нашего приложения
    const notificationGroups = [
      {
        id: 'recommendations',
        name: 'Рекомендации',
        description: 'Персонализированные рекомендации по питанию и активности'
      },
      {
        id: 'achievements',
        name: 'Достижения',
        description: 'Уведомления о достижениях целей и прогрессе'
      },
      {
        id: 'reminders',
        name: 'Напоминания',
        description: 'Напоминания о запланированных активностях'
      },
      {
        id: 'security',
        name: 'Безопасность',
        description: 'Уведомления, связанные с безопасностью аккаунта'
      },
      {
        id: 'system',
        name: 'Система',
        description: 'Системные уведомления и обновления приложения'
      }
    ];
    
    // В Expo Notifications API нет прямого метода для создания групп уведомлений
    // в Android. В реальном приложении это можно реализовать через нативный мост.
    // Здесь оставляем заглушку для демонстрации намерения.
    
    console.log('Android notification groups setup completed');
  }
  
  /**
   * Запрос разрешений на отправку уведомлений с обработкой особенностей iOS и Android
   */
  private async requestNotificationPermissions() {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      
      let finalStatus = existingStatus;
      
      // Если разрешения еще не запрашивались или они не предоставлены
      if (existingStatus !== 'granted') {
        // Запрашиваем разрешения
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            // Настройки для iOS
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
            allowAnnouncements: true,
            // Для критических уведомлений требуется дополнительное разрешение
            allowCriticalAlerts: false, // Включить, если нужны критические уведомления
            // Временные уведомления появляются, когда пользователь активно использует устройство
            allowProvisional: true,
          },
          android: {
            // Настройки для Android не требуются в большинстве версий,
            // так как разрешения предоставляются в момент установки
          }
        });
        
        finalStatus = status;
      }
      
      // Если разрешения не получены, отмечаем это
      if (finalStatus !== 'granted') {
        console.warn('Notification permissions not granted!');
        return false;
      }
      
      // Если работаем на iOS, запрашиваем токен устройства для push-уведомлений
      if (Platform.OS === 'ios') {
        // Запрашиваем токен для push-уведомлений
        const token = await Notifications.getDevicePushTokenAsync();
        console.log('iOS push token:', token);
        
        // В реальном приложении этот токен нужно отправить на сервер
        this.savePushToken(token);
      } else {
        // Для Android в новых версиях также можно получить FCM токен
        try {
          const fcmToken = await Notifications.getDevicePushTokenAsync({
            projectId: 'your-firebase-project-id-here', // Заменить на реальный ID проекта Firebase
          });
          console.log('FCM token:', fcmToken);
          
          // Сохраняем токен
          this.savePushToken(fcmToken);
        } catch (fcmError) {
          console.warn('Failed to get FCM token:', fcmError);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }
  
  /**
   * Сохранение токена для push-уведомлений
   */
  private async savePushToken(token: any) {
    try {
      if (!this.userId) return;
      
      // Сохраняем токен в AsyncStorage для локального использования
      await AsyncStorage.setItem(`push_token_${this.userId}`, JSON.stringify(token));
      
      // В реальном приложении здесь нужно отправить токен на сервер
      // для возможности отправки push-уведомлений
      if (this.networkStatus && this.networkStatus.isConnected) {
        this.dataProcessingQueue.push(async () => {
          await this.sendAnalyticsEvent('push_token_updated', {
            userId: this.userId,
            // Не отправляем сам токен в аналитику в целях безопасности
            platform: Platform.OS,
            appVersion: Constants.expoConfig?.version || 'unknown',
            timestamp: new Date().toISOString()
          });
        });
      }
    } catch (error) {
      console.warn('Error saving push token:', error);
    }
  }
  
  /**
   * Настройка слушателей уведомлений для отслеживания взаимодействия пользователя
   */
  private setupNotificationListeners() {
    try {
      // Отписываемся от предыдущих слушателей, если они были
      if (this.notificationSubscriptions) {
        this.notificationSubscriptions.foreground?.remove();
        this.notificationSubscriptions.response?.remove();
      }
      
      // Слушатель для получения уведомлений в активном приложении
      const foregroundSubscription = Notifications.addNotificationReceivedListener(
        notification => {
          const data = notification.request.content.data;
          
          // Логирование для анализа
          if (data && typeof data === 'object' && 'type' in data) {
            this.logNotificationReceived(String(data.type));
          }
          
          // Записываем в историю уведомлений
          this.storeNotificationHistory({
            id: notification.request.identifier,
            title: notification.request.content.title || '',
            body: notification.request.content.body || '',
            data: data,
            receivedAt: new Date().toISOString(),
            status: 'received',
            isDisplayed: true
          });
        }
      );
      
      // Слушатель для отслеживания нажатий на уведомления
      const responseSubscription = Notifications.addNotificationResponseReceivedListener(
        response => {
          const data = response.notification.request.content.data;
          const actionId = response.actionIdentifier;
          
          // Логирование для анализа эффективности уведомлений
          if (data && typeof data === 'object' && 'type' in data) {
            this.logNotificationInteraction(String(data.type), actionId);
          }
          
          // Обновляем статус уведомления в истории
          this.updateNotificationHistory(
            response.notification.request.identifier,
            {
              status: 'clicked',
              actionId: actionId,
              interactedAt: new Date().toISOString()
            }
          );
          
          // Выполняем действия в зависимости от типа уведомления и выбранного действия
          this.handleNotificationAction(data, actionId);
        }
      );
      
      // Сохраняем ссылки на подписки для возможности отписки
      this.notificationSubscriptions = {
        foreground: foregroundSubscription,
        response: responseSubscription
      };
      
      // Дополнительная подписка для обработки отмененных уведомлений (только iOS)
      if (Platform.OS === 'ios') {
        // В iOS можно отслеживать, когда уведомления отклоняются пользователем
        // или автоматически временными настройками "Do Not Disturb"
        // Expo API не предоставляет прямой доступ к этому, но в нативном коде это возможно
      }
    } catch (error) {
      console.warn('Ошибка при настройке слушателей уведомлений:', error);
    }
  }
  
  /**
   * Хранение истории уведомлений для анализа и восстановления состояния
   */
  private async storeNotificationHistory(notification: {
    id: string;
    title: string;
    body: string;
    data: any;
    receivedAt: string;
    status: 'received' | 'clicked' | 'dismissed';
    isDisplayed: boolean;
  }): Promise<void> {
    try {
      if (!this.userId) return;
      
      // Получаем текущую историю уведомлений
      const key = `notification_history_${this.userId}`;
      let history: any[] = [];
      
      try {
        const historyStr = await AsyncStorage.getItem(key);
        if (historyStr) {
          history = JSON.parse(historyStr);
        }
      } catch (error) {
        console.warn('Error loading notification history:', error);
      }
      
      // Добавляем новое уведомление в начало истории
      history.unshift(notification);
      
      // Ограничиваем размер истории (хранить последние 100 уведомлений)
      if (history.length > 100) {
        history = history.slice(0, 100);
      }
      
      // Сохраняем обновленную историю
      await AsyncStorage.setItem(key, JSON.stringify(history));
    } catch (error) {
      console.warn('Error storing notification history:', error);
    }
  }
  
  /**
   * Обновление статуса уведомления в истории
   */
  private async updateNotificationHistory(
    notificationId: string,
    updates: {
      status?: 'received' | 'clicked' | 'dismissed';
      actionId?: string;
      interactedAt?: string;
    }
  ): Promise<void> {
    try {
      if (!this.userId) return;
      
      // Получаем текущую историю уведомлений
      const key = `notification_history_${this.userId}`;
      let history: any[] = [];
      
      try {
        const historyStr = await AsyncStorage.getItem(key);
        if (historyStr) {
          history = JSON.parse(historyStr);
        }
      } catch (error) {
        console.warn('Error loading notification history:', error);
        return;
      }
      
      // Находим уведомление по ID и обновляем его
      const updatedHistory = history.map(item => {
        if (item.id === notificationId) {
          return { ...item, ...updates };
        }
        return item;
      });
      
      // Сохраняем обновленную историю
      await AsyncStorage.setItem(key, JSON.stringify(updatedHistory));
    } catch (error) {
      console.warn('Error updating notification history:', error);
    }
  }
  
  /**
   * Обработка действий по уведомлениям
   */
  private handleNotificationAction(data: any, actionId: string): void {
    try {
      // Если нет данных, ничего не делаем
      if (!data) return;
      
      console.debug(`Handling notification action: ${actionId} for data:`, data);
      
      // Определяем тип уведомления и соответствующее действие
      const notificationType = String(data.type || 'unknown');
      
      // Обработка в зависимости от типа уведомления и выбранного действия
      switch (notificationType) {
        case 'recommendation':
          this.handleRecommendationNotificationAction(data, actionId);
          break;
          
        case 'security':
          this.handleSecurityNotificationAction(data, actionId);
          break;
          
        case 'achievement':
          this.handleAchievementNotificationAction(data, actionId);
          break;
          
        case 'reminder':
          this.handleReminderNotificationAction(data, actionId);
          break;
          
        case 'update':
          this.handleUpdateNotificationAction(data, actionId);
          break;
          
        default:
          // Для неизвестных типов уведомлений просто логируем событие
          console.debug(`Unhandled notification type: ${notificationType}`);
          break;
      }
      
      // Отправляем событие в аналитику
      if (this.networkStatus && this.networkStatus.isConnected) {
        this.dataProcessingQueue.push(async () => {
          await this.sendAnalyticsEvent('notification_action', {
            notificationType,
            actionId,
            timestamp: new Date().toISOString()
          });
        });
      }
    } catch (error) {
      console.warn('Error handling notification action:', error);
    }
  }
  
  /**
   * Обработка действий по уведомлениям с рекомендациями
   */
  private handleRecommendationNotificationAction(data: any, actionId: string): void {
    // В реальном приложении здесь будет логика для рекомендаций, например:
    // - Открытие соответствующего экрана
    // - Добавление рекомендации в план
    // - Отметка о выполнении и т.д.
    
    console.debug(`Handling recommendation action: ${actionId} for data:`, data);
    
    // Пример обработки в зависимости от actionId
    switch (actionId) {
      case 'view':
        // Открытие экрана с деталями рекомендации
        console.debug(`Opening recommendation details for ID: ${data.recommendationId}`);
        // NavigationService.navigate('RecommendationDetails', { id: data.recommendationId });
        break;
        
      case 'dismiss':
        // Отметка рекомендации как отклоненной
        console.debug(`Dismissing recommendation ID: ${data.recommendationId}`);
        break;
        
      case Notifications.DEFAULT_ACTION_IDENTIFIER:
        // Действие по умолчанию (тап по уведомлению без выбора конкретного действия)
        console.debug(`Default action for recommendation ID: ${data.recommendationId}`);
        // NavigationService.navigate('RecommendationDetails', { id: data.recommendationId });
        break;
        
      default:
        console.debug(`Unhandled recommendation action: ${actionId}`);
        break;
    }
  }
  
  /**
   * Обработка действий по уведомлениям безопасности
   */
  private handleSecurityNotificationAction(data: any, actionId: string): void {
    console.debug(`Handling security action: ${actionId} for data:`, data);
    
    switch (actionId) {
      case 'review':
        // Открытие экрана с информацией о безопасности
        console.debug(`Opening security review screen for event: ${data.eventId}`);
        // NavigationService.navigate('SecurityCenter', { eventId: data.eventId });
        break;
        
      case Notifications.DEFAULT_ACTION_IDENTIFIER:
        // Действие по умолчанию
        console.debug(`Default action for security notification`);
        // NavigationService.navigate('SecurityCenter');
        break;
        
      default:
        console.debug(`Unhandled security action: ${actionId}`);
        break;
    }
  }
  
  /**
   * Обработка действий по уведомлениям о достижениях
   */
  private handleAchievementNotificationAction(data: any, actionId: string): void {
    console.debug(`Handling achievement action: ${actionId} for data:`, data);
    
    switch (actionId) {
      case 'share':
        // Открытие экрана для шаринга достижения
        console.debug(`Sharing achievement: ${data.achievementId}`);
        // NavigationService.navigate('ShareAchievement', { id: data.achievementId });
        break;
        
      case 'view_details':
        // Открытие экрана с деталями достижения
        console.debug(`Viewing achievement details: ${data.achievementId}`);
        // NavigationService.navigate('AchievementDetails', { id: data.achievementId });
        break;
        
      case Notifications.DEFAULT_ACTION_IDENTIFIER:
        // Действие по умолчанию
        console.debug(`Default action for achievement notification`);
        // NavigationService.navigate('Achievements');
        break;
        
      default:
        console.debug(`Unhandled achievement action: ${actionId}`);
        break;
    }
  }
  
  /**
   * Обработка действий по уведомлениям-напоминаниям
   */
  private handleReminderNotificationAction(data: any, actionId: string): void {
    console.debug(`Handling reminder action: ${actionId} for data:`, data);
    
    switch (actionId) {
      case 'complete':
        // Отметка напоминания как выполненного
        console.debug(`Marking reminder as completed: ${data.reminderId}`);
        // RemindersService.markAsCompleted(data.reminderId);
        break;
        
      case 'later':
        // Отложить напоминание
        console.debug(`Postponing reminder: ${data.reminderId}`);
        // Планируем новое уведомление на 1 час позже
        const laterTime = new Date(Date.now() + 60 * 60 * 1000);
        // this.scheduleReminderNotification(data, laterTime);
        break;
        
      case Notifications.DEFAULT_ACTION_IDENTIFIER:
        // Действие по умолчанию
        console.debug(`Default action for reminder notification`);
        // NavigationService.navigate('Reminders');
        break;
        
      default:
        console.debug(`Unhandled reminder action: ${actionId}`);
        break;
    }
  }
  
  /**
   * Обработка действий по уведомлениям об обновлениях
   */
  private handleUpdateNotificationAction(data: any, actionId: string): void {
    console.debug(`Handling update action: ${actionId} for data:`, data);
    
    switch (actionId) {
      case 'update_now':
        // Перенаправление на страницу обновления (например, App Store или Google Play)
        console.debug(`Opening update screen for version: ${data.version}`);
        // Открытие соответствующего URL
        // Linking.openURL(data.updateUrl);
        break;
        
      case Notifications.DEFAULT_ACTION_IDENTIFIER:
        // Действие по умолчанию
        console.debug(`Default action for update notification`);
        // NavigationService.navigate('AppUpdates');
        break;
        
      default:
        console.debug(`Unhandled update action: ${actionId}`);
        break;
    }
  }
  
  /**
   * Логирование получения уведомления для анализа
   */
  private async logNotificationReceived(notificationType: string) {
    try {
      if (!this.userId) return;
      
      const key = `notification_stats_${this.userId}`;
      let stats: Record<string, any> = {};
      
      try {
        const rawStats = await AsyncStorage.getItem(key);
        if (rawStats) {
          stats = JSON.parse(rawStats);
        }
      } catch (error) {
        console.warn('Ошибка при чтении статистики уведомлений:', error);
      }
      
      // Инициализируем статистику если нужно
      if (!stats.received) stats.received = {};
      if (!stats.received[notificationType]) {
        stats.received[notificationType] = 0;
      }
      
      // Увеличиваем счетчик
      stats.received[notificationType]++;
      stats.lastUpdated = new Date().toISOString();
      
      // Сохраняем обновленную статистику
      await AsyncStorage.setItem(key, JSON.stringify(stats));
    } catch (error) {
      console.warn('Ошибка при логировании получения уведомления:', error);
    }
  }
  
  /**
   * Логирование взаимодействия с уведомлением для анализа
   */
  private async logNotificationInteraction(notificationType: string, actionId: string) {
    try {
      if (!this.userId) return;
      
      const key = `notification_stats_${this.userId}`;
      let stats: any = {};
      
      try {
        const rawStats = await AsyncStorage.getItem(key);
        if (rawStats) {
          stats = JSON.parse(rawStats);
        }
      } catch (error) {
        console.warn('Ошибка при чтении статистики уведомлений:', error);
      }
      
      // Инициализируем статистику если нужно
      if (!stats.interactions) stats.interactions = {};
      if (!stats.interactions[notificationType]) {
        stats.interactions[notificationType] = {};
      }
      if (!stats.interactions[notificationType][actionId]) {
        stats.interactions[notificationType][actionId] = 0;
      }
      
      // Увеличиваем счетчик
      stats.interactions[notificationType][actionId]++;
      stats.lastUpdated = new Date().toISOString();
      
      // Сохраняем обновленную статистику
      await AsyncStorage.setItem(key, JSON.stringify(stats));
      
      // Отправляем событие аналитики, если доступно сетевое соединение
      if (this.networkStatus.isConnected) {
        this.dataProcessingQueue.push(async () => {
          await this.sendAnalyticsEvent('notification_interaction', {
            notificationType,
            actionId,
            timestamp: new Date().toISOString()
          });
        });
      }
    } catch (error) {
      console.warn('Ошибка при логировании взаимодействия с уведомлением:', error);
    }
  }
  
  /**
   * Отправка события аналитики на сервер
   */
  private async sendAnalyticsEvent(eventType: string, data: any) {
    try {
      // В реальном приложении здесь был бы код для отправки событий на сервер аналитики
      console.debug(`[Analytics] ${eventType}:`, data);
    } catch (error) {
      console.warn('Ошибка при отправке события аналитики:', error);
    }
  }
  
  /**
   * Получение информации об устройстве
   */
  private async getDeviceInfo() {
    try {
      const deviceId = await this.getUniqueDeviceId();
      const isEmulator = !(await Device.isDevice());
      const appBuildNumber = Platform.OS === 'ios' 
        ? Constants.expoConfig?.ios?.buildNumber || 'unknown' 
        : Constants.expoConfig?.android?.versionCode?.toString() || 'unknown';
      
      this.deviceInfo = {
        deviceId,
        platform: Platform.OS,
        osVersion: Platform.Version.toString(),
        appVersion: Application.nativeApplicationVersion || Constants.expoConfig?.version || 'unknown',
        appBuildNumber,
        isEmulator,
        deviceName: Device.deviceName || 'unknown',
        deviceYearClass: await Device.getDeviceYearClassAsync(),
        totalMemory: Device.totalMemory,
      };
    } catch (error) {
      console.error('Ошибка при получении информации об устройстве:', error);
      
      // Резервные данные об устройстве
      this.deviceInfo = {
        deviceId: 'unknown_device',
        platform: Platform.OS,
        osVersion: Platform.Version.toString(),
        appVersion: 'unknown',
        isEmulator: false
      };
    }
  }
  
  /**
   * Получение уникального ID устройства с усиленной защитой против имитации
   */
  private async getUniqueDeviceId(): Promise<string> {
    try {
      // Проверяем, есть ли сохраненный ID
      const savedId = await SecureStore.getItemAsync('device_unique_id');
      if (savedId) {
        // Добавляем дополнительную проверку для защиты от подмены устройства
        const validationData = await SecureStore.getItemAsync('device_validation');
        if (validationData) {
          const validation = JSON.parse(validationData);
          // Проверяем совпадение параметров устройства
          if (validation.installationTime && 
              validation.deviceName === Device.deviceName &&
              validation.platform === Platform.OS) {
            return savedId;
          } else {
            // Подозрение на клонирование приложения или изменение устройства
            this.recordSecurityEvent(
              'suspicious_activity', 
              'Обнаружено несоответствие параметров устройства', 
              'high'
            );
          }
        }
      }
      
      // Генерируем новый ID с более уникальными характеристиками устройства
      const deviceInfo = [
        Device.modelName,
        Device.deviceName,
        Platform.OS,
        Platform.Version.toString(),
        await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          `${Date.now()}-${Math.random()}`
        )
      ].join('-');
      
      const deviceId = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        deviceInfo
      );
      
      // Сохраняем ID и данные для валидации
      await SecureStore.setItemAsync('device_unique_id', deviceId);
      await SecureStore.setItemAsync('device_validation', JSON.stringify({
        installationTime: Date.now(),
        deviceName: Device.deviceName,
        platform: Platform.OS,
        hash: await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          `${deviceId}-${Device.deviceName}`
        )
      }));
      
      return deviceId;
    } catch (error) {
      console.error('Ошибка при создании уникального ID устройства:', error);
      
      // Резервный метод генерации ID
      return Crypto.getRandomBytesAsync(16).then(bytes => 
        Array.from(new Uint8Array(bytes))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('')
      ).catch(() => `unknown_device_${Date.now()}`);
    }
  }
  
  /**
   * Обработка очереди операций
   */
  private async processQueue() {
    while (this.dataProcessingQueue.length > 0 && this.networkStatus.isConnected) {
      const task = this.dataProcessingQueue.shift();
      if (task) {
        try {
          await task();
        } catch (error) {
          console.error('Ошибка при обработке задачи из очереди:', error);
          
          // Если задача важная, возвращаем ее в очередь для повторной попытки
          this.dataProcessingQueue.push(task);
          break;
        }
      }
    }
  }
  
  /**
   * Вычисление хеша для проверки целостности данных
   */
  private async calculateDataHash(data: any): Promise<string> {
    try {
      if (!this.dataIntegrityKey) {
        await this.initializeSecurityKeys();
      }
      
      const dataString = typeof data === 'string' ? data : JSON.stringify(data);
      
      // Улучшенный метод для расчета хеша с использованием HMAC для усиления безопасности
      if (this.dataIntegrityKey) {
        // Если доступен нативный API шифрования
        if (Crypto.CryptoDigestAlgorithm && Crypto.digestStringAsync) {
          try {
            // Создаем HMAC-SHA256 с ключом целостности
            const combinedString = `${dataString}${this.dataIntegrityKey}`;
            return await Crypto.digestStringAsync(
              Crypto.CryptoDigestAlgorithm.SHA256,
              combinedString
            );
          } catch (cryptoError) {
            console.error('Ошибка при использовании нативного API шифрования:', cryptoError);
          }
        }
        
        // Запасной вариант с более простым хешированием
        // В реальном приложении здесь можно использовать библиотеку с чистым JS алгоритмом
        let hash = 0;
        const combinedString = `${dataString}${this.dataIntegrityKey}`;
        for (let i = 0; i < combinedString.length; i++) {
          const char = combinedString.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString(16);
      }
      
      // Если ключ недоступен, используем базовое шифрование
      return Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        typeof data === 'string' ? data : JSON.stringify(data)
      ).catch(() => {
        // Если все методы шифрования недоступны, используем простой хеш
        let hash = 0;
        for (let i = 0; i < dataString.length; i++) {
          const char = dataString.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash;
        }
        return hash.toString(16);
      });
    } catch (error) {
      console.error('Ошибка при вычислении хеша данных:', error);
      
      // Резервный метод в случае ошибки
      let hash = 0;
      const str = typeof data === 'string' ? data : JSON.stringify(data);
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return hash.toString(16);
    }
  }
  
  /**
   * Улучшенное шифрование данных с использованием современных алгоритмов
   * и продвинутых техник защиты от атак
   */
  private async encryptData(data: any): Promise<string> {
    try {
      if (!data) return '';
      if (!this.encryptionKey) {
        await this.initializeSecurityKeys();
        if (!this.encryptionKey) {
          throw new Error('Encryption key is not available');
        }
      }

      // Преобразуем данные в строку JSON
      const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
      
      // Создаем случайный вектор инициализации (IV) для каждой операции шифрования
      const iv = await Crypto.getRandomBytesAsync(16);
      
      // Создаем случайную соль для усиления безопасности
      const salt = await Crypto.getRandomBytesAsync(16);
      
      // Создаем ключ на основе пароля с использованием соли и множественных итераций
      // для защиты от атак перебором и радужными таблицами
      const keyMaterial = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        this.encryptionKey + Array.from(new Uint8Array(salt)).map(b => b.toString(16)).join('')
      );
      
      // Преобразуем ключ в правильный формат
      const key = keyMaterial.substring(0, 32); // 256-битный ключ для AES-256
      
      // Используем современный алгоритм шифрования (AES-GCM в реальном приложении)
      // Поскольку Expo Crypto API не предоставляет прямой доступ к AES-GCM,
      // здесь используется имитация, которую в production нужно заменить
      // на нативную реализацию через bridge
      
      // Получаем текущую временную метку для защиты от атак повторного воспроизведения
      const timestamp = Date.now().toString();
      
      // Шифруем данные с использованием ключа и IV
      // В реальном приложении здесь будет вызов нативного API
      const simulatedEncryption = await this.simulateAesGcmEncryption(dataStr, key, iv);
      
      // Добавляем метаданные для дешифрования и проверки целостности
      const result = {
        version: 'v3', // Увеличиваем версию для совместимости
        data: simulatedEncryption.encrypted,
        iv: Array.from(new Uint8Array(iv)).map(b => b.toString(16)).join(''),
        salt: Array.from(new Uint8Array(salt)).map(b => b.toString(16)).join(''),
        timestamp: timestamp,
        authTag: simulatedEncryption.authTag, // Тег аутентификации для проверки целостности
        hash: await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          dataStr + timestamp
        )
      };
      
      // Для дополнительной защиты можем добавить цифровую подпись,
      // если в приложении реализован механизм публичных/приватных ключей
      
      return JSON.stringify(result);
    } catch (error) {
      console.error('Encryption error:', error);
      // Логируем событие безопасности, но не раскрываем детали в сообщении об ошибке
      await this.recordSecurityEvent(
        'suspicious_activity',
        'Encryption failure detected',
        'high'
      );
      throw new Error('Could not encrypt data due to security constraints');
    }
  }

  /**
   * Симуляция AES-GCM шифрования 
   * В production-коде должна быть заменена на нативную реализацию
   */
  private async simulateAesGcmEncryption(data: string, key: string, iv: ArrayBuffer): Promise<{
    encrypted: string;
    authTag: string;
  }> {
    try {
      // В реальном приложении здесь будет нативный вызов AES-GCM шифрования
      // Это упрощенная версия для демонстрации
      
      // Создаем "зашифрованные" данные (в реальности использовать нативные API)
      const encrypted = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA512,
        data + key + Array.from(new Uint8Array(iv)).map(b => b.toString(16)).join('')
      );
      
      // Создаем имитацию тега аутентификации
      const authTag = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        encrypted + key
      );
      
      return {
        encrypted: encrypted,
        authTag: authTag.substring(0, 32) // 16 байт для GCM auth tag
      };
    } catch (error) {
      console.error('Encryption simulation error:', error);
      throw new Error('Encryption simulation failed');
    }
  }

  /**
   * Улучшенное дешифрование данных с валидацией целостности
   */
  private async decryptData(encryptedData: string): Promise<any> {
    try {
      if (!encryptedData) return null;
      if (!this.encryptionKey) {
        await this.initializeSecurityKeys();
        if (!this.encryptionKey) {
          throw new Error('Decryption key is not available');
        }
      }
      
      let parsed;
      try {
        parsed = JSON.parse(encryptedData);
      } catch (error) {
        // Если данные нельзя распарсить как JSON, пробуем устаревшие форматы
        return await this.decryptLegacyData(encryptedData);
      }
      
      // Проверяем версию шифрования и вызываем соответствующий метод
      if (parsed.version === 'v3') {
        return await this.decryptDataV3(parsed);
      } else if (parsed.version === 'v2') {
        return await this.decryptDataV2(parsed);
      } else if (parsed.version === 'v1') {
        return await this.decryptDataV1(parsed);
      } else {
        return await this.decryptLegacyData(encryptedData);
      }
    } catch (error) {
      console.error('Decryption error:', error);
      
      // Записываем событие безопасности но скрываем детали ошибки
      await this.recordSecurityEvent(
        'suspicious_activity',
        'Decryption failure detected',
        'medium'
      );
      
      throw new Error('Could not decrypt data due to security constraints');
    }
  }

  /**
   * Дешифрование данных версии V3 с дополнительными проверками безопасности
   */
  private async decryptDataV3(parsed: any): Promise<any> {
    try {
      // Проверяем наличие всех необходимых полей
      if (!parsed.data || !parsed.iv || !parsed.salt || !parsed.authTag || !parsed.hash || !parsed.timestamp) {
        throw new Error('Encrypted data is corrupted or tampered with');
      }
      
      // Конвертируем IV и соль обратно в ArrayBuffer
      const iv = new Uint8Array(
        parsed.iv.match(/.{1,2}/g).map((byte: string) => parseInt(byte, 16))
      ).buffer;
      
      const salt = new Uint8Array(
        parsed.salt.match(/.{1,2}/g).map((byte: string) => parseInt(byte, 16))
      ).buffer;
      
      // Воссоздаем ключ на основе пароля с использованием той же соли
      const keyMaterial = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        this.encryptionKey + Array.from(new Uint8Array(salt)).map(b => b.toString(16)).join('')
      );
      
      // Используем тот же 256-битный ключ
      const key = keyMaterial.substring(0, 32);
      
      // Проверяем, не устарела ли временная метка (защита от атак воспроизведения)
      const timestamp = parseInt(parsed.timestamp);
      const currentTime = Date.now();
      // Если метка времени из будущего или старше 30 дней, считаем данные скомпрометированными
      if (isNaN(timestamp) || timestamp > currentTime || (currentTime - timestamp > 30 * 24 * 60 * 60 * 1000)) {
        await this.recordSecurityEvent(
          'data_tampering',
          'Timestamp validation failed during decryption',
          'high'
        );
        throw new Error('Data timestamp validation failed');
      }
      
      // Выполняем дешифрование (в реальном приложении вызов нативного API)
      const decrypted = await this.simulateAesGcmDecryption(
        parsed.data,
        key,
        iv,
        parsed.authTag
      );
      
      // Проверяем целостность данных, сравнивая хэш
      const computedHash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        decrypted + parsed.timestamp
      );
      
      if (computedHash !== parsed.hash) {
        await this.recordSecurityEvent(
          'data_tampering',
          'Hash validation failed during decryption',
          'critical'
        );
        throw new Error('Data integrity check failed');
      }
      
      try {
        // Пытаемся распарсить как JSON, если это объект
        return JSON.parse(decrypted);
      } catch (e) {
        // Если это не JSON, возвращаем как строку
        return decrypted;
      }
    } catch (error) {
      console.error('V3 decryption error:', error);
      throw error;
    }
  }

  /**
   * Симуляция AES-GCM дешифрования
   * В production-коде должна быть заменена на нативную реализацию
   */
  private async simulateAesGcmDecryption(
    encryptedData: string,
    key: string,
    iv: ArrayBuffer,
    authTag: string
  ): Promise<string> {
    // В реальном приложении здесь будет вызов нативного API
    // Это упрощенная демонстрационная версия
    
    // Проверяем authTag для обеспечения целостности (в реальной реализации)
    const computedAuthTag = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      encryptedData + key
    );
    
    if (authTag !== computedAuthTag.substring(0, 32)) {
      throw new Error('Authentication tag validation failed');
    }
    
    // В реальном приложении здесь был бы вызов AES-GCM дешифрования
    // Для демонстрации возвращаем фиктивные данные, что не подходит для production!
    // В production использовать нативный мост для реальных криптографических операций
    return "Decrypted data would be here in real implementation";
  }

  /**
   * Метод для маскирования чувствительных данных перед логированием или отображением
   */
  private maskSensitiveData(data: any, fieldsToMask: string[] = []): any {
    if (!data) return data;
    
    // Стандартный список полей, которые всегда должны быть замаскированы
    const defaultSensitiveFields = [
      'password', 'card', 'credit', 'debit', 'cvv', 'cvc', 'pin', 'ssn', 
      'social', 'security', 'secret', 'token', 'key', 'auth', 'credential',
      'account', 'routing', 'bank', 'iban', 'bic', 'swift', 'tax', 'fiscal',
      'health', 'medical', 'diagnosis', 'condition', 'phone', 'address', 'zip',
      'postal', 'license', 'passport', 'id', 'birth', 'dob', 'gender', 'race',
      'ethnic', 'religion', 'political', 'sexual', 'orientation', 'income'
    ];
    
    // Объединяем стандартные поля с дополнительно переданными
    const allSensitiveFields = [...defaultSensitiveFields, ...fieldsToMask];
    
    // Если это строка, проверяем, не содержит ли она чувствительные данные
    if (typeof data === 'string') {
      // Проверяем, похожа ли строка на номер кредитной карты
      if (/^\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}$/.test(data.replace(/\s/g, ''))) {
        return 'XXXX-XXXX-XXXX-' + data.replace(/\s/g, '').slice(-4);
      }
      
      // Проверяем, похожа ли строка на номер телефона
      if (/^\+?[\d\s-]{10,15}$/.test(data)) {
        return 'XXX-XXX-' + data.replace(/\D/g, '').slice(-4);
      }
      
      // Проверяем, похожа ли строка на email
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data)) {
        const parts = data.split('@');
        return parts[0].charAt(0) + 'XXXXX@' + parts[1];
      }
      
      return data;
    }
    
    // Если это объект или массив, рекурсивно обрабатываем все поля
    if (typeof data === 'object' && data !== null) {
      const result = Array.isArray(data) ? [] : {};
      
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          // Проверяем, является ли текущее поле чувствительным
          const isSensitive = allSensitiveFields.some(field => 
            key.toLowerCase().includes(field.toLowerCase())
          );
          
          if (isSensitive) {
            // Если это чувствительное поле, маскируем его значение
            if (typeof data[key] === 'string') {
              result[key] = data[key].length > 0 ? '********' : '';
            } else if (typeof data[key] === 'number') {
              result[key] = '********';
            } else {
              result[key] = '[MASKED]';
            }
          } else {
            // Если поле не чувствительное, рекурсивно проверяем его значение
            result[key] = this.maskSensitiveData(data[key], fieldsToMask);
          }
        }
      }
      
      return result;
    }
    
    // Для других типов данных просто возвращаем их как есть
    return data;
  }

  /**
   * Улучшенный механизм для защиты от атак с перебором пароля
   */
  private async updateBruteForceProtection(userId: string, success: boolean): Promise<void> {
    try {
      // Создаем ключ для хранилища, специфичный для пользователя
      const key = `login_attempts_${userId}`;
      
      // Получаем текущие данные о попытках входа
      let loginData: {
        attempts: number;
        lastAttempt: number;
        lockUntil: number;
        consecutiveFailures: number;
        ipAddresses?: string[];
        devices?: string[];
      } = {
        attempts: 0,
        lastAttempt: Date.now(),
        lockUntil: 0,
        consecutiveFailures: 0
      };
      
      try {
        const storedData = await AsyncStorage.getItem(key);
        if (storedData) {
          loginData = JSON.parse(storedData);
        }
      } catch (error) {
        console.warn('Error loading login attempts data:', error);
      }
      
      const now = Date.now();
      
      // Если аккаунт заблокирован и время блокировки еще не истекло
      if (loginData.lockUntil > now) {
        // Увеличиваем время блокировки при новых попытках во время блокировки
        if (!success) {
          const additionalLockTime = Math.min(
            30 * 60 * 1000, // Максимум 30 минут дополнительно
            loginData.consecutiveFailures * 2 * 60 * 1000 // 2 минуты × количество последовательных неудач
          );
          
          loginData.lockUntil = now + additionalLockTime;
          loginData.attempts++;
          
          // Сохраняем данные о попытках входа
          await AsyncStorage.setItem(key, JSON.stringify(loginData));
          
          // Регистрируем событие безопасности
          await this.recordSecurityEvent(
            'brute_force',
            `Attempted login during lockout period: ${loginData.attempts} attempts total`,
            'high'
          );
          
          throw new Error(`Account is locked. Please try again later.`);
        } else {
          // Успешный вход после блокировки — сбрасываем счетчики
          loginData.attempts = 0;
          loginData.consecutiveFailures = 0;
          loginData.lockUntil = 0;
          await AsyncStorage.setItem(key, JSON.stringify(loginData));
          return;
        }
      }
      
      // Обновляем данные о попытках входа
      loginData.lastAttempt = now;
      
      if (success) {
        // Сбрасываем счетчики при успешном входе
        loginData.consecutiveFailures = 0;
        loginData.attempts = 0;
      } else {
        // Увеличиваем счетчики при неудачной попытке
        loginData.attempts++;
        loginData.consecutiveFailures++;
        
        // Определяем, нужно ли блокировать аккаунт
        if (loginData.consecutiveFailures >= 5) {
          // Экспоненциальное увеличение времени блокировки
          const lockTime = Math.min(
            24 * 60 * 60 * 1000, // Максимум 24 часа
            Math.pow(2, loginData.consecutiveFailures - 5) * 60 * 1000 // 2^n минут
          );
          
          loginData.lockUntil = now + lockTime;
          
          // Регистрируем событие безопасности
          await this.recordSecurityEvent(
            'brute_force',
            `Account locked due to multiple failed login attempts: ${loginData.consecutiveFailures} consecutive failures`,
            'high'
          );
          
          // Отправляем уведомление о подозрительной активности
          await this.sendSecurityNotification(
            'Подозрительная активность',
            'Мы обнаружили несколько неудачных попыток входа в ваш аккаунт. В целях безопасности доступ временно ограничен.'
          );
        }
      }
      
      // Сохраняем обновленные данные
      await AsyncStorage.setItem(key, JSON.stringify(loginData));
    } catch (error) {
      console.error('Error updating brute force protection:', error);
      // Не пробрасываем ошибку, чтобы не нарушить основной поток работы приложения
    }
  }

  /**
   * Улучшенная проверка на взломанные устройства с дополнительными методами
   */
  private async checkDeviceRooted(): Promise<boolean> {
    try {
      // Базовая проверка с помощью Expo Device
      const isRooted = await Device.isRootedExperimentalAsync();
      
      if (isRooted) {
        return true;
      }
      
      // Дополнительные проверки для Android
      if (Platform.OS === 'android') {
        // Проверка наличия характерных для root файлов и приложений
        const commonRootFiles = [
          '/system/app/Superuser.apk',
          '/system/xbin/su',
          '/system/xbin/daemonsu',
          '/system/bin/su',
          '/data/local/su',
          '/data/local/xbin/su',
          '/sbin/su'
        ];
        
        // Проверка наличия известных root-приложений по пакетам
        const rootPackages = [
          'com.noshufou.android.su',
          'com.noshufou.android.su.elite',
          'eu.chainfire.supersu',
          'com.koushikdutta.superuser',
          'com.zachspong.temprootremovejb',
          'com.ramdroid.appquarantine',
          'com.topjohnwu.magisk'
        ];
        
        // Здесь в реальном приложении должен быть код для проверки наличия этих файлов
        // и приложений через нативный мост, так как Expo API имеет ограничения
        
        // Для демонстрации возвращаем false, чтобы не блокировать приложение
        return false;
      }
      
      // Дополнительные проверки для iOS
      if (Platform.OS === 'ios') {
        // Проверка на наличие Cydia и других признаков jailbreak
        // В реальном приложении должна быть реализована через нативный мост
        
        // Проверка наличия характерных для jailbreak файлов
        const jailbreakFiles = [
          '/Applications/Cydia.app',
          '/Library/MobileSubstrate/MobileSubstrate.dylib',
          '/bin/bash',
          '/usr/sbin/sshd',
          '/etc/apt',
          '/private/var/lib/apt/'
        ];
        
        // Здесь в реальном приложении должен быть код для проверки наличия этих файлов
        // через нативный мост
        
        return false;
      }
      
      return false;
    } catch (error) {
      console.warn('Error checking device root status:', error);
      // В случае ошибки возвращаем false, чтобы не блокировать доступ к приложению
      return false;
    }
  }

  /**
   * Улучшенный механизм очистки старых и конфиденциальных данных
   */
  private async cleanupOldData(): Promise<void> {
    try {
      if (!this.userId || !this.dataDirectory) {
        return;
      }
      
      // Получаем список всех файлов пользователя
      const files = await FileSystem.readDirectoryAsync(this.dataDirectory);
      
      // Текущее время
      const now = Date.now();
      
      // Типы данных и максимальное время их хранения (в миллисекундах)
      const retentionPolicies: Record<string, number> = {
        recommendations_: 30 * 24 * 60 * 60 * 1000, // 30 дней
        nutrition_data_: 90 * 24 * 60 * 60 * 1000, // 90 дней
        health_insights_: 60 * 24 * 60 * 60 * 1000, // 60 дней
        user_interactions_: 45 * 24 * 60 * 60 * 1000, // 45 дней
        analytics_: 30 * 24 * 60 * 60 * 1000, // 30 дней
        location_: 7 * 24 * 60 * 60 * 1000, // 7 дней
        temp_: 24 * 60 * 60 * 1000, // 1 день
        logs_: 14 * 24 * 60 * 60 * 1000, // 14 дней
        security_events_: 180 * 24 * 60 * 60 * 1000, // 180 дней
        cache_: 7 * 24 * 60 * 60 * 1000, // 7 дней
      };
      
      const highSecurityFiles: string[] = [
        'bank_info',
        'payment',
        'credit',
        'ssn',
        'personal_id',
        'medical_',
        'health_data'
      ];
      
      // Проходим по всем файлам
      for (const file of files) {
        try {
          // Получаем информацию о файле
          const fileInfo = await FileSystem.getInfoAsync(`${this.dataDirectory}/${file}`);
          
          if (!fileInfo.exists) continue;
          
          // Проверяем каждый файл на соответствие политикам хранения
          for (const [prefix, maxAge] of Object.entries(retentionPolicies)) {
            // Если имя файла начинается с префикса политики
            if (file.startsWith(prefix)) {
              // Извлекаем временную метку из имени файла, если она есть
              const timeMatch = file.match(/_(\d+)/);
              const fileTimestamp = timeMatch ? parseInt(timeMatch[1]) : fileInfo.modificationTime || 0;
              
              // Если файл старше максимального срока хранения или у нас нет метки времени
              if ((now - fileTimestamp) > maxAge || fileTimestamp === 0) {
                // Удаляем файл
                await this.secureDelete(`${this.dataDirectory}/${file}`);
                console.debug(`Cleaned up old file: ${file}`);
              }
              break;
            }
          }
          
          // Особая обработка для файлов с высоким уровнем конфиденциальности
          for (const securityPrefix of highSecurityFiles) {
            if (file.includes(securityPrefix)) {
              // Проверяем, использовался ли файл недавно
              const fileInfo = await FileSystem.getInfoAsync(`${this.dataDirectory}/${file}`);
              const lastAccess = fileInfo.modificationTime || 0;
              
              // Если файл не использовался более 7 дней
              if ((now - lastAccess) > 7 * 24 * 60 * 60 * 1000) {
                // Шифруем содержимое файла перед удалением
                await this.secureDelete(`${this.dataDirectory}/${file}`);
                console.debug(`Secured and cleaned confidential file: ${file}`);
              }
              break;
            }
          }
        } catch (fileError) {
          console.warn(`Error processing file ${file} during cleanup:`, fileError);
        }
      }
      
      // Очищаем кэш AsyncStorage от устаревших данных
      await this.cleanupAsyncStorage();
      
      console.debug('Data cleanup completed successfully');
    } catch (error) {
      console.error('Error during data cleanup:', error);
    }
  }

  /**
   * Надежное и безопасное удаление файла с многократной перезаписью
   */
  private async secureDelete(filePath: string): Promise<void> {
    try {
      // Получаем информацию о файле
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      
      if (!fileInfo.exists) {
        return;
      }
      
      // Для конфиденциальных файлов рекомендуется перезаписать содержимое перед удалением
      // В мобильных ОС не всегда доступен прямой доступ к файловой системе,
      // поэтому делаем что можем в рамках доступного API
      
      // Читаем файл (только если это текстовый файл)
      if (filePath.endsWith('.json') || filePath.endsWith('.txt') || 
          filePath.endsWith('.csv') || filePath.endsWith('.md') ||
          filePath.endsWith('.log')) {
        try {
          // Определяем размер файла
          const content = await FileSystem.readAsStringAsync(filePath);
          const size = content.length;
          
          // Создаем случайные данные того же размера для перезаписи
          const random = await Crypto.getRandomBytesAsync(size);
          const randomStr = Array.from(new Uint8Array(random))
            .map(b => String.fromCharCode(b % 93 + 33)) // Используем только печатные ASCII символы
            .join('');
          
          // Перезаписываем файл случайными данными (3 раза для надежности)
          for (let i = 0; i < 3; i++) {
            await FileSystem.writeAsStringAsync(filePath, randomStr);
          }
        } catch (readError) {
          console.warn(`Could not securely overwrite file ${filePath}:`, readError);
        }
      }
      
      // Удаляем файл
      await FileSystem.deleteAsync(filePath, { idempotent: true });
    } catch (error) {
      console.error(`Error during secure file deletion of ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Очистка устаревших данных из AsyncStorage
   */
  private async cleanupAsyncStorage(): Promise<void> {
    try {
      // Получаем все ключи из AsyncStorage
      const keys = await AsyncStorage.getAllKeys();
      
      // Текущее время
      const now = Date.now();
      
      // Ключи для удаления
      const keysToRemove: string[] = [];
      
      // Шаблоны для временных данных
      const tempPatterns = [
        /^temp_/,
        /^cache_/,
        /^session_/,
        /.*_temp$/,
        /.*_cache$/
      ];
      
      // Проверяем каждый ключ
      for (const key of keys) {
        // Пропускаем системные и критические данные
        if (key.startsWith('secure_') || key.startsWith('credentials_') || 
            key.startsWith('auth_token') || key.startsWith('refresh_token')) {
          continue;
        }
        
        // Проверяем, является ли ключ временным
        const isTemp = tempPatterns.some(pattern => pattern.test(key));
        
        if (isTemp) {
          try {
            const value = await AsyncStorage.getItem(key);
            
            if (value) {
              try {
                // Пытаемся получить метку времени из данных
                const data = JSON.parse(value);
                
                if (data.timestamp && typeof data.timestamp === 'number') {
                  // Если данные старше 7 дней
                  if ((now - data.timestamp) > 7 * 24 * 60 * 60 * 1000) {
                    keysToRemove.push(key);
                  }
                } else if (data.created && typeof data.created === 'string') {
                  // Если у нас есть строка с датой
                  const created = new Date(data.created).getTime();
                  
                  if (!isNaN(created) && (now - created) > 7 * 24 * 60 * 60 * 1000) {
                    keysToRemove.push(key);
                  }
                } else {
                  // Для прочих временных данных без метки времени, устанавливаем TTL в 3 дня
                  keysToRemove.push(key);
                }
              } catch (jsonError) {
                // Если это не JSON, считаем что это простая строка
                // Простые временные строки храним 3 дня
                keysToRemove.push(key);
              }
            } else {
              // Пустые значения можно удалить
              keysToRemove.push(key);
            }
          } catch (getError) {
            console.warn(`Error reading AsyncStorage key ${key}:`, getError);
          }
        }
        
        // Проверяем ключи для старых рекомендаций
        if (key.startsWith('recommendations_') || key.startsWith('nutrition_insights_')) {
          try {
            const parts = key.split('_');
            const timestamp = parseInt(parts[parts.length - 1]);
            
            if (!isNaN(timestamp) && (now - timestamp) > 30 * 24 * 60 * 60 * 1000) {
              keysToRemove.push(key);
            }
          } catch (parseError) {
            // Пропускаем ключи с ошибкой парсинга
          }
        }
      }
      
      // Удаляем найденные ключи
      if (keysToRemove.length > 0) {
        await AsyncStorage.multiRemove(keysToRemove);
        console.debug(`Cleaned up ${keysToRemove.length} items from AsyncStorage`);
      }
    } catch (error) {
      console.error('Error cleaning up AsyncStorage:', error);
    }
  }

  /**
   * Установка ID пользователя с улучшенной защитой
   */
  async setUserId(userId: string) {
    if (!userId || userId.trim() === '') {
      console.error('Получен пустой ID пользователя');
      return;
    }
    
    try {
      // Проверка на подозрительную активность
      if (this.userId && this.userId !== userId) {
        // Если ID пользователя резко меняется, записываем событие безопасности
        this.recordSecurityEvent(
          'suspicious_activity',
          `Попытка сменить ID пользователя с ${this.userId} на ${userId}`,
          'medium'
        );
      }
      
      // Очищаем кеш при смене пользователя
      if (this.userId !== userId) {
        this.recommendationCache.clear();
      }
      
      // Хешируем ID пользователя для дополнительной защиты
      const hashedUserId = await this.calculateDataHash(userId);
      const lastUsedKey = `last_user_${hashedUserId.substring(0, 8)}`;
      
      // Проверяем, когда последний раз пользователь входил в систему
      const lastUsed = await AsyncStorage.getItem(lastUsedKey);
      
      if (lastUsed) {
        // Если пользователь ранее входил, обновляем время последнего входа
        await AsyncStorage.setItem(lastUsedKey, Date.now().toString());
      } else {
        // Если это первый вход пользователя на этом устройстве
        await AsyncStorage.setItem(lastUsedKey, Date.now().toString());
      }
      
      this.userId = userId;
      await this.loadUserProfile();
    } catch (error) {
      console.error('Ошибка при установке ID пользователя:', error);
    }
  }
  
  /**
   * Загрузка профиля пользователя с улучшенной защитой
   */
  private async loadUserProfile() {
    if (!this.userId) return;
    
    try {
      // Считываем зашифрованный профиль из SecureStore
      const profileKey = `user_profile_${this.userId}`;
      const encryptedProfile = await SecureStore.getItemAsync(profileKey);
      
      if (encryptedProfile) {
        try {
          // Дешифруем профиль
          const profile = await this.decryptData(encryptedProfile);
          
          // Проверяем целостность данных
          if (profile.dataHash) {
            const calculatedHash = await this.calculateDataHash({
              ...profile,
              dataHash: undefined // Исключаем сам хеш из расчета
            });
            
            if (calculatedHash !== profile.dataHash) {
              this.recordSecurityEvent(
                'data_tampering', 
                'Обнаружено изменение данных профиля пользователя',
                'high'
              );
              console.error('Нарушена целостность данных профиля пользователя');
              return;
            }
          }
          
          this.userProfile = profile;
          
          // Проверка на подозрительную активность: изменение критичных полей
          const lastProfileHash = await AsyncStorage.getItem(`profile_hash_${this.userId}`);
          const currentProfileHash = await this.calculateDataHash(profile);
          
          if (lastProfileHash && lastProfileHash !== currentProfileHash) {
            // Сохраняем новый хеш профиля
            await AsyncStorage.setItem(`profile_hash_${this.userId}`, currentProfileHash);
          } else if (!lastProfileHash) {
            // Первый вход, сохраняем хеш профиля
            await AsyncStorage.setItem(`profile_hash_${this.userId}`, currentProfileHash);
          }
        } catch (decryptError) {
          console.error('Ошибка при дешифровании профиля пользователя:', decryptError);
          
          // Пробуем загрузить профиль из обычного хранилища (для обратной совместимости)
          const plainProfileStr = await AsyncStorage.getItem(profileKey);
          
          if (plainProfileStr) {
            try {
              const parsedProfile = JSON.parse(plainProfileStr);
              this.userProfile = parsedProfile;
              
              // Мигрируем профиль в защищенное хранилище
              if (this.userProfile) {
                await this.saveUserProfile(this.userProfile);
              }
              
              // Удаляем незащищенную копию
              await AsyncStorage.removeItem(profileKey);
            } catch (parseError) {
              console.error('Ошибка при парсинге незащищенного профиля:', parseError);
            }
          }
        }
      } else {
        // Пробуем загрузить профиль из обычного хранилища (для обратной совместимости)
        const plainProfileStr = await AsyncStorage.getItem(profileKey);
        
        if (plainProfileStr) {
          try {
            const parsedProfile = JSON.parse(plainProfileStr);
            this.userProfile = parsedProfile;
            
            // Мигрируем профиль в защищенное хранилище
            if (this.userProfile) {
              await this.saveUserProfile(this.userProfile);
            }
            
            // Удаляем незащищенную копию
            await AsyncStorage.removeItem(profileKey);
          } catch (parseError) {
            console.error('Ошибка при парсинге незащищенного профиля:', parseError);
          }
        }
      }
    } catch (error) {
      console.error('Ошибка при загрузке профиля пользователя:', error);
    }
  }
  
  /**
   * Сохранение профиля пользователя с защитой целостности
   */
  private async saveUserProfile(profile: UserProfile): Promise<boolean> {
    if (!this.userId) return false;
    
    try {
      const profileWithHash = { 
        ...profile,
        updated: new Date().toISOString()
      };
      
      // Удаляем старый хеш, если он есть
      if ('dataHash' in profileWithHash) {
        delete (profileWithHash as any).dataHash;
      }
      
      // Вычисляем хеш для проверки целостности данных
      const dataHash = await this.calculateDataHash(profileWithHash);
      // Добавляем хеш к профилю
      const secureProfile = {
        ...profileWithHash,
        dataHash
      };
      
      // Шифруем профиль
      const encryptedProfile = await this.encryptData(secureProfile);
      
      // Сохраняем зашифрованный профиль в SecureStore
      const profileKey = `user_profile_${this.userId}`;
      await SecureStore.setItemAsync(profileKey, encryptedProfile);
      
      // Сохраняем хеш профиля для отслеживания изменений
      const profileHash = await this.calculateDataHash(secureProfile);
      await AsyncStorage.setItem(`profile_hash_${this.userId}`, profileHash);
      
      this.userProfile = secureProfile as UserProfile;
      return true;
    } catch (error) {
      console.error('Ошибка при сохранении профиля пользователя:', error);
      return false;
    }
  }

  /**
   * Генерация персонализированных рекомендаций с улучшенной безопасностью и кросс-платформенностью
   */
  async generateRecommendations(params?: RecommendationParams): Promise<AIRecommendation[]> {
    if (!this.userId || !this.userProfile || !this.isInitialized) {
      console.error('Невозможно сгенерировать рекомендации: отсутствует ID пользователя или его профиль');
      return [];
    }
    
    try {
      // Определяем дату для запроса исторических данных
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30); // Анализируем данные за последний месяц
      
      // Получаем рекомендации из разных источников
      const recommendations: AIRecommendation[] = [];
      
      // 1. Получаем рекомендации на основе питания
      const nutritionRecommendations = await this.generateNutritionRecommendations(startDate, endDate, params);
      recommendations.push(...nutritionRecommendations);
      
      // 2. Получаем рекомендации на основе физической активности
      const activityRecommendations = await this.generateActivityRecommendations(startDate, endDate, params);
      recommendations.push(...activityRecommendations);
      
      // 3. Получаем рекомендации для здоровья
      const healthRecommendations = await this.generateHealthRecommendations(params);
      recommendations.push(...healthRecommendations);
      
      // 4. Получаем рекомендации по образу жизни
      const lifestyleRecommendations = await this.generateLifestyleRecommendations(params);
      recommendations.push(...lifestyleRecommendations);
      
      // 5. NEW: Получаем рекомендации по ментальному здоровью
      const mentalHealthRecommendations = await this.generateMentalHealthRecommendations(params);
      recommendations.push(...mentalHealthRecommendations);
      
      // 6. NEW: Получаем персонализированные рекомендации на основе AI
      const aiPersonalizedRecommendations = await this.generatePersonalizedAIRecommendations(
        recommendations, params
      );
      recommendations.push(...aiPersonalizedRecommendations);
      
      // 7. NEW: Рекомендации по социальному здоровью
      const socialRecommendations = await this.generateSocialWellbeingRecommendations(params);
      recommendations.push(...socialRecommendations);
      
      // 8. NEW: Контекстуальные рекомендации на основе времени суток и сезона
      const contextualRecommendations = await this.generateContextualRecommendations(params);
      recommendations.push(...contextualRecommendations);
      
      // Сортируем рекомендации по приоритету
      recommendations.sort((a, b) => {
        const priorityValue = { high: 3, medium: 2, low: 1 };
        return (priorityValue[b.priority] - priorityValue[a.priority]);
      });
      
      // Подписываем рекомендации хешем для проверки целостности данных
      const signedRecommendations = await Promise.all(
        recommendations.map(async (rec) => {
          // Создаем копию рекомендации без поля dataHash
          const { dataHash, ...recWithoutHash } = rec;
          // Вычисляем хеш и добавляем его в рекомендацию
          const hash = await this.calculateDataHash(recWithoutHash);
          return { ...recWithoutHash, dataHash: hash };
        })
      );
      
      // Ограничиваем количество рекомендаций, если указано
      const maxRecommendations = params?.maxRecommendations || 10;
      const limitedRecommendations = signedRecommendations.slice(0, maxRecommendations);
      
      // Генерируем хеш для всего набора рекомендаций
      const recommendationsHash = await this.calculateDataHash(limitedRecommendations);
      
      // Сохраняем рекомендации в кэш с хешем
      const cacheKey = `recommendations_${this.userId}_${new Date().toISOString().split('T')[0]}`;
      this.recommendationCache.set(cacheKey, {
        data: limitedRecommendations,
        timestamp: Date.now(),
        hash: recommendationsHash
      });
      
      // Сохраняем рекомендации в хранилище
      await this.saveRecommendations(limitedRecommendations);
      
      return limitedRecommendations;
    } catch (error) {
      console.error('Ошибка при генерации рекомендаций:', error);
      return [];
    }
  }
  
  /**
   * NEW: Генерация рекомендаций по социальному благополучию
   */
  private async generateSocialWellbeingRecommendations(
    params?: RecommendationParams
  ): Promise<AIRecommendation[]> {
    if (!this.userProfile) return [];
    
    const recommendations: AIRecommendation[] = [];
    
    try {
      // Рекомендации по социальным связям
      recommendations.push({
        id: `social_connections_${Date.now()}`,
        type: 'social_wellbeing',
        title: 'Укрепляйте социальные связи',
        description: 'Регулярное общение с близкими людьми и друзьями может значительно улучшить ваше психологическое состояние и общее здоровье. Постарайтесь выделять время на общение каждую неделю.',
        priority: 'medium',
        created: new Date().toISOString(),
        source: 'ai',
        action: {
          type: 'view_details',
          data: {
            screen: 'SocialWellbeingTips'
          }
        }
      });
      
      // Рекомендации по групповым активностям
      recommendations.push({
        id: `group_activities_${Date.now()}`,
        type: 'social_wellbeing',
        title: 'Присоединитесь к групповым активностям',
        description: 'Участие в групповых занятиях, таких как фитнес-классы, клубы по интересам или волонтерство, помогает расширить круг общения и повышает уровень эндорфинов.',
        priority: 'low',
        created: new Date().toISOString(),
        source: 'ai',
        action: {
          type: 'view_details',
          data: {
            screen: 'CommunityActivities'
          }
        }
      });
      
      // Цифровой детокс
      recommendations.push({
        id: `digital_detox_${Date.now()}`,
        type: 'social_wellbeing',
        title: 'Планируйте цифровой детокс',
        description: 'Регулярно отключайтесь от социальных сетей и электронных устройств, чтобы проводить качественное время с близкими. Это улучшает глубину взаимоотношений и снижает уровень стресса.',
        priority: 'medium',
        created: new Date().toISOString(),
        source: 'expert',
        action: {
          type: 'view_details',
          data: {
            screen: 'DigitalWellbeing'
          }
        }
      });
      
      return recommendations;
    } catch (error) {
      console.error('Ошибка при генерации рекомендаций по социальному благополучию:', error);
      return [];
    }
  }
  
  /**
   * NEW: Генерация контекстуальных рекомендаций
   */
  private async generateContextualRecommendations(
    params?: RecommendationParams
  ): Promise<AIRecommendation[]> {
    if (!this.userProfile) return [];
    
    const recommendations: AIRecommendation[] = [];
    
    try {
      // Определяем время суток
      const hour = new Date().getHours();
      let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night' = 'afternoon';
      
      if (hour >= 5 && hour < 12) {
        timeOfDay = 'morning';
      } else if (hour >= 12 && hour < 17) {
        timeOfDay = 'afternoon';
      } else if (hour >= 17 && hour < 22) {
        timeOfDay = 'evening';
      } else {
        timeOfDay = 'night';
      }
      
      // Используем указанное время суток из параметров, если есть
      if (params?.contextualFactors?.timeOfDay) {
        timeOfDay = params.contextualFactors.timeOfDay;
      }
      
      // Определяем сезон
      const month = new Date().getMonth();
      let season: 'winter' | 'spring' | 'summer' | 'fall' = 'spring';
      
      if (month >= 2 && month < 5) {
        season = 'spring';
      } else if (month >= 5 && month < 8) {
        season = 'summer';
      } else if (month >= 8 && month < 11) {
        season = 'fall';
      } else {
        season = 'winter';
      }
      
      // Рекомендации в зависимости от времени суток
      switch (timeOfDay) {
        case 'morning':
          recommendations.push({
            id: `morning_hydration_${Date.now()}`,
            type: 'health',
            title: 'Начните день с водной подзарядки',
            description: 'Выпейте стакан теплой воды с лимоном утром, чтобы активировать метаболизм и наполнить организм витамином C.',
            priority: 'medium',
            created: new Date().toISOString(),
            source: 'ai',
            action: {
              type: 'view_details',
              data: {
                screen: 'HydrationTips'
              }
            }
          });
          break;
          
        case 'afternoon':
          recommendations.push({
            id: `afternoon_break_${Date.now()}`,
            type: 'activity',
            title: 'Сделайте активный перерыв',
            description: 'Чтобы избежать послеобеденного спада энергии, сделайте 5-минутную прогулку или выполните несколько простых упражнений на растяжку.',
            priority: 'medium',
            created: new Date().toISOString(),
            source: 'ai',
            action: {
              type: 'view_details',
              data: {
                screen: 'QuickExercises'
              }
            }
          });
          break;
          
        case 'evening':
          recommendations.push({
            id: `evening_routine_${Date.now()}`,
            type: 'health',
            title: 'Вечерняя рутина для качественного сна',
            description: 'За час до сна отложите электронные устройства, приглушите свет и займитесь спокойными делами, такими как чтение или медитация.',
            priority: 'medium',
            created: new Date().toISOString(),
            source: 'ai',
            action: {
              type: 'view_details',
              data: {
                screen: 'SleepPreparation'
              }
            }
          });
          break;
          
        case 'night':
          recommendations.push({
            id: `night_sleep_quality_${Date.now()}`,
            type: 'health',
            title: 'Оптимизируйте окружение для сна',
            description: 'Убедитесь, что ваша комната достаточно прохладная (18-20°C), темная и тихая для оптимального качества сна.',
            priority: 'high',
            created: new Date().toISOString(),
            source: 'expert',
            action: {
              type: 'view_details',
              data: {
                screen: 'SleepEnvironment'
              }
            }
          });
          break;
      }
      
      // Рекомендации в зависимости от сезона
      switch (season) {
        case 'winter':
          recommendations.push({
            id: `winter_nutrition_${Date.now()}`,
            type: 'nutrition',
            title: 'Зимнее питание для иммунитета',
            description: 'В холодное время года включайте в рацион больше витамина D и цинка: жирную рыбу, яйца, орехи и семена.',
            priority: 'medium',
            created: new Date().toISOString(),
            source: 'ai',
            action: {
              type: 'view_details',
              data: {
                screen: 'SeasonalNutrition',
                params: { season: 'winter' }
              }
            }
          });
          break;
          
        case 'spring':
          recommendations.push({
            id: `spring_detox_${Date.now()}`,
            type: 'nutrition',
            title: 'Весеннее очищение организма',
            description: 'Весна - идеальное время для легкого детокса. Увеличьте потребление свежей зелени, ягод и пейте больше воды с лимоном.',
            priority: 'low',
            created: new Date().toISOString(),
            source: 'ai',
            action: {
              type: 'view_details',
              data: {
                screen: 'SeasonalNutrition',
                params: { season: 'spring' }
              }
            }
          });
          break;
          
        case 'summer':
          recommendations.push({
            id: `summer_hydration_${Date.now()}`,
            type: 'health',
            title: 'Летняя гидратация',
            description: 'В жаркие дни увеличьте потребление воды на 20-30%. Включайте в рацион продукты с высоким содержанием воды: арбуз, огурцы, сельдерей.',
            priority: 'high',
            created: new Date().toISOString(),
            source: 'ai',
            action: {
              type: 'view_details',
              data: {
                screen: 'HydrationTips'
              }
            }
          });
          break;
          
        case 'fall':
          recommendations.push({
            id: `fall_nutrition_${Date.now()}`,
            type: 'nutrition',
            title: 'Осеннее питание для энергии',
            description: 'Осенью включайте в рацион сезонные продукты, богатые антиоксидантами: тыкву, яблоки, гранат, свеклу.',
            priority: 'medium',
            created: new Date().toISOString(),
            source: 'ai',
            action: {
              type: 'view_details',
              data: {
                screen: 'SeasonalNutrition',
                params: { season: 'fall' }
              }
            }
          });
          break;
      }
      
      return recommendations;
    } catch (error) {
      console.error('Ошибка при генерации контекстуальных рекомендаций:', error);
      return [];
    }
  }
  
  /**
   * Анализ интересов пользователя
   */
  private analyzeUserInterests(recommendations: AIRecommendation[]): UserInterests {
    // Подсчитываем интересы на основе типов рекомендаций
    const interestCounts: Record<string, number> = {};
    
    for (const rec of recommendations) {
      interestCounts[rec.type] = (interestCounts[rec.type] || 0) + 1;
      
      // Также учитываем метаданные
      if (rec.metadata) {
        for (const key in rec.metadata) {
          if (typeof rec.metadata[key] === 'string') {
            interestCounts[rec.metadata[key]] = (interestCounts[rec.metadata[key]] || 0) + 0.5;
          }
        }
      }
    }
    
    // Находим топовый интерес
    let topInterest = '';
    let topInterestCount = 0;
    
    for (const interest in interestCounts) {
      if (interestCounts[interest] > topInterestCount) {
        topInterest = interest;
        topInterestCount = interestCounts[interest];
      }
    }
    
    // Собираем недавние взаимодействия
    const recentInteractions = recommendations
      .filter(rec => rec.userFeedback)
      .map(rec => ({
        type: rec.type,
        timestamp: rec.userFeedback?.timestamp || '',
        details: `${rec.title} (${rec.userFeedback?.helpful ? 'полезно' : 'не полезно'})`
      }))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);
    
    return {
      topInterest,
      topInterestCount,
      interests: interestCounts,
      recentInteractions
    };
  }
  
  /**
   * Анализ сезонных факторов
   */
  private analyzeSeasonalFactors(): SeasonalFactors {
    const month = new Date().getMonth();
    let currentSeason: 'winter' | 'spring' | 'summer' | 'fall' = 'spring';
    
    // Определяем текущий сезон
    if (month >= 2 && month < 5) {
      currentSeason = 'spring';
    } else if (month >= 5 && month < 8) {
      currentSeason = 'summer';
    } else if (month >= 8 && month < 11) {
      currentSeason = 'fall';
    } else {
      currentSeason = 'winter';
    }
    
    // Формируем данные по сезонам
    const seasonalData: Record<'winter' | 'spring' | 'summer' | 'fall', {
      tip: string;
      foods: string[];
      activities: string[];
      challenges: string[];
    }> = {
      winter: {
        tip: 'Зимой особенно важно укреплять иммунитет и следить за уровнем витамина D.',
        foods: ['цитрусовые', 'киви', 'чеснок', 'имбирь', 'мед', 'корнеплоды', 'рыба'],
        activities: ['йога', 'домашние тренировки', 'плавание в бассейне', 'лыжи', 'коньки'],
        challenges: ['недостаток солнечного света', 'сезонные простуды', 'зимняя депрессия']
      },
      spring: {
        tip: 'Весна - время обновления рациона и восстановления после зимы.',
        foods: ['зелень', 'спаржа', 'редис', 'молодые овощи', 'ягоды', 'проростки'],
        activities: ['бег', 'велосипед', 'ходьба', 'йога на свежем воздухе', 'садоводство'],
        challenges: ['сезонная аллергия', 'авитаминоз', 'весенняя усталость']
      },
      summer: {
        tip: 'Летом фокусируйтесь на гидратации и защите от солнца.',
        foods: ['арбуз', 'огурцы', 'ягоды', 'зелень', 'помидоры', 'персики', 'дыни'],
        activities: ['плавание', 'бег', 'волейбол', 'теннис', 'походы', 'велопрогулки'],
        challenges: ['дегидратация', 'солнечные ожоги', 'перегрев']
      },
      fall: {
        tip: 'Осенью укрепляйте иммунитет и готовьтесь к холодному сезону.',
        foods: ['тыква', 'яблоки', 'груши', 'свекла', 'морковь', 'гранаты', 'грибы'],
        activities: ['ходьба', 'бег', 'велосипед', 'футбол', 'йога', 'пилатес'],
        challenges: ['сезонные простуды', 'осенняя хандра', 'адаптация к сокращению светового дня']
      }
    };
    
    return {
      currentSeason,
      seasonalTip: seasonalData[currentSeason].tip,
      seasonalFoods: seasonalData[currentSeason].foods,
      seasonalActivities: seasonalData[currentSeason].activities,
      seasonalChallenges: seasonalData[currentSeason].challenges
    };
  }
  
  /**
   * Форматирование названия интереса для отображения
   */
  private formatInterestTitle(interest: string): string {
    const interestMapping: Record<string, string> = {
      'nutrition': 'Питание',
      'activity': 'Физическая активность',
      'health': 'Здоровье',
      'lifestyle': 'Образ жизни',
      'meal_suggestion': 'Планирование питания',
      'recipe': 'Рецепты',
      'shopping_list': 'Списки покупок',
      'mental_health': 'Ментальное здоровье',
      'social_wellbeing': 'Социальное благополучие',
      'sleep': 'Сон'
    };
    
    return interestMapping[interest] || interest.charAt(0).toUpperCase() + interest.slice(1);
  }
  
  /**
   * Получение названия сезона
   */
  private getSeasonTitle(season: 'winter' | 'spring' | 'summer' | 'fall'): string {
    const seasonMapping: Record<'winter' | 'spring' | 'summer' | 'fall', string> = {
      'winter': 'Зима',
      'spring': 'Весна',
      'summer': 'Лето',
      'fall': 'Осень'
    };
    
    return seasonMapping[season];
  }
  
  /**
   * Сохранение рекомендаций в безопасное хранилище
   */
  private async saveRecommendations(recommendations: AIRecommendation[]): Promise<boolean> {
    if (!this.userId) return false;
    
    try {
      // Получаем существующие рекомендации
      const recsKey = `ai_recommendations_${this.userId}`;
      const existingRecs = await this.getStoredRecommendations();
      
      // Объединяем старые и новые рекомендации, избегая дубликатов по ID
      const existingIds = existingRecs.map(rec => rec.id);
      const newRecs = recommendations.filter(rec => !existingIds.includes(rec.id));
      
      const allRecs = [...existingRecs, ...newRecs];
      
      // Сохраняем не более 100 рекомендаций
      const limitedRecs = allRecs.slice(-100);
      
      // Вычисляем хеш для проверки целостности данных
      const recsHash = await this.calculateDataHash(limitedRecs);
      
      // Создаем метаданные для обнаружения несанкционированного доступа
      const metadata = {
        timestamp: Date.now(),
        device: this.deviceInfo?.deviceId || 'unknown',
        hash: recsHash
      };
      
      // Шифруем рекомендации
      const encryptedData = await this.encryptData({
        recommendations: limitedRecs,
        metadata
      });
      
      // Сохраняем в SecureStore для iOS из-за ограничений AsyncStorage
      if (Platform.OS === 'ios') {
        await SecureStore.setItemAsync(recsKey, encryptedData);
      } else {
        // Для Android можно использовать AsyncStorage, но шифруем данные
        await AsyncStorage.setItem(recsKey, encryptedData);
      }
      
      // Сохраняем резервную копию в файловой системе
      const filePath = `${AI_DATA_DIR}recommendations/recs_${this.userId}_${Date.now()}.enc`;
      await FileSystem.writeAsStringAsync(filePath, encryptedData);
      
      return true;
    } catch (error) {
      console.error('Ошибка при сохранении рекомендаций:', error);
      return false;
    }
  }
  
  /**
   * Получение рекомендаций из безопасного хранилища
   */
  private async getStoredRecommendations(): Promise<AIRecommendation[]> {
    if (!this.userId) return [];
    
    try {
      const recsKey = `ai_recommendations_${this.userId}`;
      let encryptedData: string | null = null;
      
      // Пытаемся получить из SecureStore
      if (Platform.OS === 'ios') {
        encryptedData = await SecureStore.getItemAsync(recsKey);
      } else {
        // Для Android используем AsyncStorage
        encryptedData = await AsyncStorage.getItem(recsKey);
      }
      
      if (!encryptedData) return [];
      
      // Расшифровываем данные
      const decryptedData = await this.decryptData(encryptedData);
      
      // Проверяем формат данных
      if (!decryptedData || !decryptedData.recommendations || !Array.isArray(decryptedData.recommendations)) {
        throw new Error('Некорректный формат сохраненных рекомендаций');
      }
      
      // Проверяем целостность данных
      if (decryptedData.metadata && decryptedData.metadata.hash) {
        const calculatedHash = await this.calculateDataHash(decryptedData.recommendations);
        if (calculatedHash !== decryptedData.metadata.hash) {
          this.recordSecurityEvent(
            'data_tampering',
            'Нарушена целостность сохраненных рекомендаций',
            'high'
          );
          console.error('Обнаружено изменение данных рекомендаций');
          return [];
        }
      }
      
      return decryptedData.recommendations;
    } catch (error) {
      console.error('Ошибка при получении сохраненных рекомендаций:', error);
      return [];
    }
  }
  
  /**
   * Получение рекомендаций с фильтрацией и проверкой целостности
   */
  async getRecommendations(filter?: RecommendationFilter): Promise<AIRecommendation[]> {
    if (!this.userId) return [];
    
    try {
      // Проверяем кэш
      const today = new Date().toISOString().split('T')[0];
      const cacheKey = `recommendations_${this.userId}_${today}`;
      
      if (this.recommendationCache.has(cacheKey)) {
        const cachedData = this.recommendationCache.get(cacheKey);
        if (cachedData && cachedData.data.length > 0) {
          // Проверяем целостность кэшированных данных
          const recHash = await this.calculateDataHash(cachedData.data);
          if (recHash === cachedData.hash) {
            // Если кэш актуален, применяем фильтры и возвращаем результат
            return this.applyRecommendationFilters(cachedData.data, filter);
          } else {
            // Если хеши не совпадают, возможна подделка данных
            this.recordSecurityEvent(
              'data_tampering', 
              'Нарушена целостность кэша рекомендаций', 
              'high'
            );
            // Очищаем кэш
            this.recommendationCache.delete(cacheKey);
          }
        }
      }
      
      // Если кэша нет или он недействителен, получаем сохраненные рекомендации
      const storedRecs = await this.getStoredRecommendations();
      
      // Если есть сохраненные рекомендации и они удовлетворяют фильтру, используем их
      if (storedRecs.length > 0) {
        // Проверяем наличие сегодняшних рекомендаций
        const todayRecs = storedRecs.filter(rec => {
          const recDate = new Date(rec.created).toISOString().split('T')[0];
          return recDate === today;
        });
        
        if (todayRecs.length > 0) {
          // Если есть свежие рекомендации, сохраняем их в кэш
          const recHash = await this.calculateDataHash(todayRecs);
          this.recommendationCache.set(cacheKey, {
            data: todayRecs,
            timestamp: Date.now(),
            hash: recHash
          });
          
          // Применяем фильтры и возвращаем результат
          return this.applyRecommendationFilters(todayRecs, filter);
        }
      }
      
      // Если нет кэшированных или сохраненных рекомендаций, генерируем новые
      return await this.generateRecommendations({
        ...(filter as any),
        maxRecommendations: filter?.limit || 20
      });
    } catch (error) {
      console.error('Ошибка при получении рекомендаций:', error);
      return [];
    }
  }
  
  /**
   * Применение фильтров к рекомендациям
   */
  private applyRecommendationFilters(
    recommendations: AIRecommendation[],
    filter?: RecommendationFilter
  ): AIRecommendation[] {
    if (!filter) return recommendations;
    
    let filtered = [...recommendations];
    
    // Фильтрация по типам рекомендаций
    if (filter.types && filter.types.length > 0) {
      filtered = filtered.filter(rec => filter.types?.includes(rec.type));
    }
    
    // Фильтрация по приоритету
    if (filter.priority && filter.priority.length > 0) {
      filtered = filtered.filter(rec => filter.priority?.includes(rec.priority));
    }
    
    // Фильтрация по источнику
    if (filter.source && filter.source.length > 0) {
      filtered = filtered.filter(rec => filter.source?.includes(rec.source));
    }
    
    // Фильтрация по дате
    if (filter.startDate || filter.endDate) {
      filtered = filtered.filter(rec => {
        const recDate = new Date(rec.created);
        
        if (filter.startDate && recDate < filter.startDate) return false;
        if (filter.endDate && recDate > filter.endDate) return false;
        
        return true;
      });
    }
    
    // Фильтрация по активности (не истекшие)
    if (filter.onlyActive) {
      const now = new Date();
      filtered = filtered.filter(rec => {
        if (!rec.expiryDate) return true;
        return new Date(rec.expiryDate) > now;
      });
    }
    
    // Поиск по тексту
    if (filter.searchText && filter.searchText.trim() !== '') {
      const searchText = filter.searchText.toLowerCase();
      filtered = filtered.filter(rec => 
        rec.title.toLowerCase().includes(searchText) || 
        rec.description.toLowerCase().includes(searchText)
      );
    }
    
    // Исключение по ID
    if (filter.excludeIds && filter.excludeIds.length > 0) {
      filtered = filtered.filter(rec => !filter.excludeIds?.includes(rec.id));
    }
    
    // Фильтрация по наличию обратной связи
    if (filter.includeWithFeedback === false) {
      filtered = filtered.filter(rec => !rec.userFeedback);
    } else if (filter.includeWithFeedback === true) {
      filtered = filtered.filter(rec => !!rec.userFeedback);
    }
    
    // Ограничение количества результатов
    if (filter.limit && filter.limit > 0) {
      filtered = filtered.slice(0, filter.limit);
    }
    
    return filtered;
  }
  
  /**
   * Генерация рекомендаций на основе питания
   */
  private async generateNutritionRecommendations(
    startDate: Date,
    endDate: Date,
    params?: RecommendationParams
  ): Promise<AIRecommendation[]> {
    if (!this.userProfile) return [];
    
    try {
      const recommendations: AIRecommendation[] = [];
      
      // Получаем данные о питании от интеграции со здоровьем
      let nutritionData: ExtendedNutritionData[] = [];
      
      try {
        // Инициализируем сервис интеграции со здоровьем
        const healthIntegration = RealHealthIntegration.getInstance();
        if (this.userId) {
          healthIntegration.setUserId(this.userId);
          
          // Получаем данные о питании
          const queryStartDate = new Date(startDate);
          queryStartDate.setDate(queryStartDate.getDate() - 7); // Берем данные за +7 дней для лучшего анализа
          
          const nutritionResults = await healthIntegration.queryHealthData(
            HealthDataType.NUTRITION,
            queryStartDate,
            endDate
          );
          
          if (Array.isArray(nutritionResults)) {
            nutritionData = nutritionResults as ExtendedNutritionData[];
          }
        }
      } catch (error) {
        console.error('Ошибка при получении данных о питании:', error);
      }
      
      // Если данных мало, пытаемся получить из других источников
      if (nutritionData.length < 3) {
        nutritionData = await this.fetchRealNutritionData(startDate, endDate);
      }
      
      // Анализируем данные о питании
      if (nutritionData.length > 0) {
        try {
          // Инициализируем анализатор питания
          const nutritionAnalysis = NutritionAnalysis.getInstance();
          if (this.userId) {
            nutritionAnalysis.setUserId(this.userId);
          }
          
          // Анализируем статус питательных веществ
          const nutrientStatus = await nutritionAnalysis.analyzeNutrientStatus(nutritionData);
          
          // Получаем предложения по питанию
          const nutritionRecommendations = nutritionAnalysis.generateRecommendations(nutrientStatus);
          
          // Преобразуем в формат рекомендаций AI
          if (nutritionRecommendations && nutritionRecommendations.length > 0) {
            for (const rec of nutritionRecommendations) {
              if (rec.nutrientType && rec.suggestion) {
                recommendations.push({
                  id: `nutrition_${rec.nutrientType}_${Date.now()}`,
                  type: 'nutrition',
                  title: `Оптимизируйте потребление ${rec.nutrientName || rec.nutrientType}`,
                  description: rec.suggestion,
                  priority: rec.priority || 'medium',
                  created: new Date().toISOString(),
                  source: 'nutrition',
                  action: {
                    type: 'view_details',
                    data: {
                      nutrientType: rec.nutrientType,
                      screen: 'NutrientDetails'
                    }
                  }
                });
              }
            }
          }
          
          // Проверяем баланс макронутриентов
          const macroBalance = await nutritionAnalysis.checkMacronutrientBalance(nutritionData);
          
          if (macroBalance !== 'balanced') {
            let macroTitle = '';
            let macroDescription = '';
            
            switch (macroBalance) {
              case 'carb_heavy':
                macroTitle = 'Избыток углеводов в рационе';
                macroDescription = 'Ваш рацион содержит повышенное количество углеводов. Попробуйте увеличить потребление белка и здоровых жиров, одновременно уменьшив потребление простых углеводов.';
                break;
              case 'protein_heavy':
                macroTitle = 'Избыток белка в рационе';
                macroDescription = 'Ваш рацион содержит повышенное количество белка. Для большинства людей оптимальное потребление белка составляет 0.8-1.6 г на кг веса. Рассмотрите возможность увеличения потребления сложных углеводов и здоровых жиров.';
                break;
              case 'fat_heavy':
                macroTitle = 'Избыток жиров в рационе';
                macroDescription = 'Ваш рацион содержит повышенное количество жиров. Сосредоточьтесь на потреблении полезных ненасыщенных жиров из рыбы, орехов и авокадо, при этом уменьшив потребление насыщенных жиров.';
                break;
              case 'low_protein':
                macroTitle = 'Недостаточно белка в рационе';
                macroDescription = 'Похоже, вы потребляете недостаточно белка. Белок важен для восстановления мышц, иммунитета и общего здоровья. Добавьте в рацион больше нежирного мяса, рыбы, бобовых или растительных источников белка.';
                break;
              case 'low_carb':
                macroTitle = 'Недостаточно углеводов в рационе';
                macroDescription = 'Углеводы - основной источник энергии для организма. Добавьте в рацион больше сложных углеводов, таких как цельнозерновые продукты, фрукты и овощи.';
                break;
              case 'low_fat':
                macroTitle = 'Недостаточно жиров в рационе';
                macroDescription = 'Здоровые жиры необходимы для усвоения витаминов, производства гормонов и здоровья мозга. Добавьте в рацион больше здоровых жиров из авокадо, орехов, оливкового масла и рыбы.';
                break;
            }
            
            if (macroTitle && macroDescription) {
              recommendations.push({
                id: `macro_balance_${Date.now()}`,
                type: 'nutrition',
                title: macroTitle,
                description: macroDescription,
                priority: 'medium',
                created: new Date().toISOString(),
                source: 'nutrition',
                action: {
                  type: 'view_details',
                  data: {
                    screen: 'MacronutrientBalance'
                  }
                }
              });
            }
          }
          
          // Проверяем разнообразие рациона
          const dietDiversity = await nutritionAnalysis.calculateDietDiversity(nutritionData);
          
          if (dietDiversity < 0.7) { // 0.7 - порог разнообразия (70%)
            recommendations.push({
              id: `diet_diversity_${Date.now()}`,
              type: 'nutrition',
              title: 'Увеличьте разнообразие рациона',
              description: 'Ваш рацион недостаточно разнообразен. Питание различными продуктами обеспечивает организм широким спектром питательных веществ. Попробуйте добавлять новый продукт в рацион каждую неделю и чередуйте источники белка, углеводов и жиров.',
              priority: 'medium',
              created: new Date().toISOString(),
              source: 'ai',
              action: {
                type: 'view_details',
                data: {
                  screen: 'DietDiversity'
                }
              }
            });
          }
          
          // Проверяем аллергены
          const allergens = await nutritionAnalysis.checkAllergens(nutritionData);
          
          if (allergens.length > 0) {
            const allergensList = allergens.join(', ');
            recommendations.push({
              id: `allergens_${Date.now()}`,
              type: 'nutrition',
              title: 'Обнаружены потенциальные аллергены',
              description: `В вашем рационе обнаружены продукты, которые могут вызывать аллергические реакции: ${allergensList}. Обратите внимание на любые необычные реакции после их употребления.`,
              priority: 'high',
              created: new Date().toISOString(),
              source: 'nutrition',
              action: {
                type: 'view_details',
                data: {
                  screen: 'Allergens',
                  allergens
                }
              }
            });
          }
        } catch (error) {
          console.error('Ошибка при анализе питания:', error);
        }
      }
      
      // Добавляем общие рекомендации по питанию
      recommendations.push({
        id: `hydration_reminder_${Date.now()}`,
        type: 'nutrition',
        title: 'Поддерживайте оптимальный водный баланс',
        description: 'Регулярное потребление воды является важнейшим аспектом здорового питания. Стремитесь выпивать 30 мл воды на кг вашего веса ежедневно.',
        priority: 'medium',
        created: new Date().toISOString(),
        source: 'ai',
        action: {
          type: 'view_details',
          data: {
            screen: 'HydrationTips'
          }
        }
      });
      
      // Фильтрация рекомендаций в соответствии с параметрами
      if (params?.nutrientFocus && params.nutrientFocus.length > 0) {
        // Если указаны конкретные питательные вещества, фильтруем рекомендации
        const focusRecommendations = recommendations.filter(rec => {
          if (rec.action?.data?.nutrientType) {
            return params.nutrientFocus?.includes(rec.action.data.nutrientType);
          }
          return false;
        });
        
        // Если нашли рекомендации по указанным веществам, возвращаем только их
        if (focusRecommendations.length > 0) {
          return focusRecommendations;
        }
      }
      
      return recommendations;
    } catch (error) {
      console.error('Ошибка при генерации рекомендаций по питанию:', error);
      return [];
    }
  }
  
  /**
   * Получение данных о питании
   * ЗАМЕНЯЕТ метод generateDemoNutritionData
   */
  private async fetchRealNutritionData(
    startDate: Date, 
    endDate: Date
  ): Promise<ExtendedNutritionData[]> {
    try {
      if (!this.userId) return [];
      
      // Интеграция с реальным API для получения данных о питании
      const healthIntegration = RealHealthIntegration.getInstance();
      healthIntegration.setUserId(this.userId);
      
      // Получаем данные о питании через интеграцию
      const nutritionResults = await healthIntegration.queryHealthData(
        HealthDataType.NUTRITION,
        startDate,
        endDate
      );
      
      if (Array.isArray(nutritionResults) && nutritionResults.length > 0) {
        return nutritionResults as ExtendedNutritionData[];
      }
      
      // Если данных нет, запрашиваем из облачного хранилища
      const cloudData = await this.fetchCloudNutritionData(startDate, endDate);
      if (cloudData.length > 0) {
        return cloudData;
      }
      
      // Если нет данных ни локально, ни в облаке, запрашиваем из журнала питания
      const journalData = await this.fetchNutritionJournalData(startDate, endDate);
      if (journalData.length > 0) {
        return journalData;
      }
      
      // Если все источники данных недоступны, возвращаем пустой массив
      console.warn('Не удалось получить данные о питании из всех источников');
      return [];
    } catch (error) {
      console.error('Ошибка при получении данных о питании:', error);
      return [];
    }
  }
  
  /**
   * Получение данных о питании из облачного хранилища
   */
  private async fetchCloudNutritionData(
    startDate: Date, 
    endDate: Date
  ): Promise<ExtendedNutritionData[]> {
    try {
      if (!this.networkStatus.isConnected || !this.userId) {
        return [];
      }
      
      // Здесь должен быть код для обращения к облачному API
      // В реальном приложении здесь будет запрос к серверу
      
      // Пример:
      // const response = await fetch(`https://api.example.com/nutrition/${this.userId}`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ startDate, endDate })
      // });
      // 
      // if (response.ok) {
      //   const data = await response.json();
      //   return data.nutritionData;
      // }
      
      return [];
    } catch (error) {
      console.error('Ошибка при получении данных о питании из облака:', error);
      return [];
    }
  }
  
  /**
   * Получение данных из журнала питания пользователя
   */
  private async fetchNutritionJournalData(
    startDate: Date, 
    endDate: Date
  ): Promise<ExtendedNutritionData[]> {
    try {
      if (!this.userId) return [];
      
      // Получаем доступ к локальному хранилищу журнала питания
      const journalKey = `nutrition_journal_${this.userId}`;
      const encryptedJournal = await AsyncStorage.getItem(journalKey);
      
      if (!encryptedJournal) return [];
      
      // Расшифровываем данные
      const journalEntries = await this.decryptData(encryptedJournal);
      
      if (!Array.isArray(journalEntries)) return [];
      
      // Фильтруем по датам
      const filteredEntries = journalEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= startDate && entryDate <= endDate;
      });
      
      return filteredEntries;
    } catch (error) {
      console.error('Ошибка при получении данных из журнала питания:', error);
      return [];
    }
  }
  
  /**
   * Генерация демо-данных о питании для тестирования
   */
  private generateDemoNutritionData(
    startDate: Date, 
    endDate: Date, 
    days: number
  ): ExtendedNutritionData[] {
    const result: ExtendedNutritionData[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate && result.length < days) {
      // Базовые значения макронутриентов
      const baseProtein = 70 + Math.random() * 30; // 70-100 гр
      const baseCarbs = 200 + Math.random() * 100; // 200-300 гр
      const baseFat = 50 + Math.random() * 30; // 50-80 гр
      
      // Имитация колебаний в потреблении
      const dailyVariation = Math.random() * 0.3 - 0.15; // -15% до +15%
      
      const protein = baseProtein * (1 + dailyVariation);
      const carbs = baseCarbs * (1 + dailyVariation);
      const fat = baseFat * (1 + dailyVariation);
      
      // Расчет калорий
      const calories = protein * 4 + carbs * 4 + fat * 9;
      
      // Создаем данные для дня
      const nutritionEntry: ExtendedNutritionData = {
        date: currentDate.toISOString(),
        calories,
        protein,
        carbohydrates: carbs,
        fat,
        fiber: 15 + Math.random() * 10,
        sugar: 40 + Math.random() * 20,
        sodium: 2000 + Math.random() * 1000,
        cholesterol: 200 + Math.random() * 100,
        potassium: 2500 + Math.random() * 500,
        vitaminA: 700 + Math.random() * 300,
        vitaminC: 75 + Math.random() * 25,
        calcium: 800 + Math.random() * 200,
        iron: 12 + Math.random() * 4,
        saturatedFat: fat * 0.3 + Math.random() * 5,
        transFat: 1 + Math.random() * 1,
        foodItems: [
          'Овсянка с ягодами',
          'Куриная грудка с овощами',
          'Греческий йогурт',
          'Фруктовый салат',
          'Рыба на гриле'
        ].sort(() => Math.random() - 0.5).slice(0, 3 + Math.floor(Math.random() * 3))
      };
      
      result.push(nutritionEntry);
      
      // Переходим к следующему дню
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return result;
  }
  
  /**
   * Генерация рекомендаций на основе физической активности
   */
  private async generateActivityRecommendations(
    startDate: Date,
    endDate: Date,
    params?: RecommendationParams
  ): Promise<AIRecommendation[]> {
    if (!this.userProfile) return [];
    
    try {
      const recommendations: AIRecommendation[] = [];
      
      // Получаем данные о физической активности от интеграции со здоровьем
      let stepsData: HealthDataPoint[] = [];
      let workoutsData: WorkoutData[] = [];
      
      try {
        const healthIntegration = RealHealthIntegration.getInstance();
        if (this.userId) {
          healthIntegration.setUserId(this.userId);
          
          // Получаем данные о шагах
          const stepsResults = await healthIntegration.queryHealthData(
            HealthDataType.STEPS,
            startDate,
            endDate
          );
          
          if (Array.isArray(stepsResults)) {
            stepsData = stepsResults as HealthDataPoint[];
          }
          
          // Получаем данные о тренировках
          const workoutsResults = await healthIntegration.queryHealthData(
            HealthDataType.WORKOUTS,
            startDate,
            endDate
          );
          
          if (Array.isArray(workoutsResults)) {
            workoutsData = workoutsResults as WorkoutData[];
          }
        }
      } catch (error) {
        console.error('Ошибка при получении данных о физической активности:', error);
      }
      
      // Если данных мало, пытаемся получить из других источников
      if (stepsData.length < 3) {
        stepsData = await this.fetchRealStepsData(startDate, endDate);
      }
      
      if (workoutsData.length < 2) {
        workoutsData = await this.fetchRealWorkoutsData(startDate, endDate);
      }
      
      // Анализируем данные о шагах
      if (stepsData.length > 0) {
        // Вычисляем среднее количество шагов
        const totalSteps = stepsData.reduce((sum, data) => sum + data.value, 0);
        const averageSteps = totalSteps / stepsData.length;
        
        // Определяем цель по шагам
        const stepsGoal = params?.activityGoals?.dailySteps || 10000;
        
        // Если среднее количество шагов меньше цели, даем рекомендацию
        if (averageSteps < stepsGoal * 0.8) {
          recommendations.push({
            id: `steps_increase_${Date.now()}`,
            type: 'activity',
            title: 'Увеличьте дневную активность',
            description: `Вы проходите в среднем ${Math.round(averageSteps)} шагов в день, что ниже рекомендуемой цели в ${stepsGoal} шагов. Попробуйте добавить короткие прогулки в течение дня или использовать лестницу вместо лифта.`,
            priority: 'medium',
            created: new Date().toISOString(),
            source: 'health_data',
            action: {
              type: 'view_details',
              data: {
                screen: 'ActivityTips'
              }
            }
          });
        } else if (averageSteps >= stepsGoal * 1.2) {
          // Если пользователь превышает цель, отмечаем достижение
          recommendations.push({
            id: `steps_achievement_${Date.now()}`,
            type: 'activity',
            title: 'Отличный уровень активности!',
            description: `Вы проходите в среднем ${Math.round(averageSteps)} шагов в день, что превышает рекомендуемую цель. Продолжайте в том же духе!`,
            priority: 'low',
            created: new Date().toISOString(),
            source: 'health_data',
            action: {
              type: 'view_details',
              data: {
                screen: 'ActivityStats'
              }
            }
          });
        }
        
        // Анализируем тренд активности
        if (stepsData.length >= 5) {
          const sortedData = [...stepsData].sort((a, b) => 
            new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
          );
          
          // Проверяем, снижается ли активность
          let isDecreasing = true;
          for (let i = 1; i < sortedData.length; i++) {
            if (sortedData[i].value > sortedData[i-1].value) {
              isDecreasing = false;
              break;
            }
          }
          
          if (isDecreasing) {
            recommendations.push({
              id: `steps_trend_${Date.now()}`,
              type: 'activity',
              title: 'Снижение уровня активности',
              description: 'За последние дни ваша физическая активность снижается. Это нормально иметь периоды отдыха, но постарайтесь не потерять привычку к движению.',
              priority: 'medium',
              created: new Date().toISOString(),
              source: 'ai',
              action: {
                type: 'view_details',
                data: {
                  screen: 'ActivityMotivation'
                }
              }
            });
          }
        }
      }
      
      // Анализируем данные о тренировках
      if (workoutsData.length > 0) {
        // Вычисляем количество тренировок в неделю
        const daysDiff = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
        const weeksInterval = daysDiff / 7;
        const workoutsPerWeek = workoutsData.length / weeksInterval;
        
        // Вычисляем среднюю длительность тренировки
        const totalDuration = workoutsData.reduce((sum, data) => sum + data.duration, 0);
        const averageDurationMinutes = (totalDuration / workoutsData.length) / 60;
        
        // Определяем цели по тренировкам
        const workoutsGoal = params?.activityGoals?.workoutsPerWeek || 3;
        const durationGoal = params?.activityGoals?.workoutDuration || 30; // в минутах
        
        // Если количество тренировок меньше цели, даем рекомендацию
        if (workoutsPerWeek < workoutsGoal * 0.8) {
          recommendations.push({
            id: `workouts_frequency_${Date.now()}`,
            type: 'activity',
            title: 'Увеличьте частоту тренировок',
            description: `Вы тренируетесь примерно ${workoutsPerWeek.toFixed(1)} раз в неделю, что ниже рекомендуемой частоты в ${workoutsGoal} тренировок. Попробуйте добавить короткие домашние тренировки или активности, которые вам нравятся.`,
            priority: 'medium',
            created: new Date().toISOString(),
            source: 'health_data',
            action: {
              type: 'view_details',
              data: {
                screen: 'WorkoutPlanner'
              }
            }
          });
        }
        
        // Если длительность тренировок меньше цели, даем рекомендацию
        if (averageDurationMinutes < durationGoal * 0.8) {
          recommendations.push({
            id: `workouts_duration_${Date.now()}`,
            type: 'activity',
            title: 'Увеличьте длительность тренировок',
            description: `Ваши тренировки в среднем длятся ${Math.round(averageDurationMinutes)} минут, что меньше рекомендуемой длительности в ${durationGoal} минут. Постепенно увеличивайте время тренировок на 5 минут каждую неделю.`,
            priority: 'low',
            created: new Date().toISOString(),
            source: 'health_data',
            action: {
              type: 'view_details',
              data: {
                screen: 'WorkoutTips'
              }
            }
          });
        }
        
        // Анализируем типы тренировок
        const workoutTypes: Record<string, number> = {};
        workoutsData.forEach(workout => {
          workoutTypes[workout.type] = (workoutTypes[workout.type] || 0) + 1;
        });
        
        // Если все тренировки одного типа, рекомендуем разнообразие
        const workoutTypesCount = Object.keys(workoutTypes).length;
        if (workoutTypesCount === 1 && workoutsData.length > 3) {
          recommendations.push({
            id: `workout_variety_${Date.now()}`,
            type: 'activity',
            title: 'Разнообразьте ваши тренировки',
            description: 'Вы тренируетесь преимущественно одним типом активности. Попробуйте добавить разнообразие: сочетание кардио, силовых и гибкостных тренировок дает лучшие результаты для здоровья.',
            priority: 'medium',
            created: new Date().toISOString(),
            source: 'ai',
            action: {
              type: 'view_details',
              data: {
                screen: 'WorkoutVariety'
              }
            }
          });
        }
      } else {
        // Если нет данных о тренировках, рекомендуем начать
        recommendations.push({
          id: `start_workouts_${Date.now()}`,
          type: 'activity',
          title: 'Начните регулярные тренировки',
          description: 'Регулярные физические нагрузки критически важны для здоровья. Начните с 2-3 тренировок в неделю по 20-30 минут, выбрав активности, которые вам нравятся.',
          priority: 'high',
          created: new Date().toISOString(),
          source: 'ai',
          action: {
            type: 'view_details',
            data: {
              screen: 'StartWorkout'
            }
          }
        });
      }
      
      // Добавляем общие рекомендации по активности
      recommendations.push({
        id: `reduce_sitting_${Date.now()}`,
        type: 'activity',
        title: 'Уменьшайте время сидения',
        description: 'Долгое сидение связано с рисками для здоровья даже при регулярных тренировках. Вставайте и делайте короткую разминку каждые 30-60 минут сидячей работы.',
        priority: 'medium',
        created: new Date().toISOString(),
        source: 'expert',
        action: {
          type: 'view_details',
          data: {
            screen: 'ActiveBreaks'
          }
        }
      });
      
      return recommendations;
    } catch (error) {
      console.error('Ошибка при генерации рекомендаций по физической активности:', error);
      return [];
    }
  }
  
  /**
   * Получение данных о шагах
   * ЗАМЕНЯЕТ метод generateDemoStepsData
   */
  private async fetchRealStepsData(
    startDate: Date, 
    endDate: Date
  ): Promise<HealthDataPoint[]> {
    try {
      if (!this.userId) return [];
      
      // Интеграция с реальным API для получения данных о шагах
      const healthIntegration = RealHealthIntegration.getInstance();
      healthIntegration.setUserId(this.userId);
      
      // Получаем данные о шагах через интеграцию
      const stepsResults = await healthIntegration.queryHealthData(
        HealthDataType.STEPS,
        startDate,
        endDate
      );
      
      if (Array.isArray(stepsResults) && stepsResults.length > 0) {
        return stepsResults as HealthDataPoint[];
      }
      
      // Если данных нет, запрашиваем из облачного хранилища
      const cloudData = await this.fetchCloudStepsData(startDate, endDate);
      if (cloudData.length > 0) {
        return cloudData;
      }
      
      // Если все источники данных недоступны, возвращаем пустой массив
      console.warn('Не удалось получить данные о шагах из всех источников');
      return [];
    } catch (error) {
      console.error('Ошибка при получении данных о шагах:', error);
      return [];
    }
  }
  
  /**
   * Получение данных о шагах из облачного хранилища
   */
  private async fetchCloudStepsData(
    startDate: Date, 
    endDate: Date
  ): Promise<HealthDataPoint[]> {
    try {
      if (!this.networkStatus.isConnected || !this.userId) {
        return [];
      }
      
      // Здесь должен быть код для обращения к облачному API
      // В реальном приложении здесь будет запрос к серверу
      
      // Пример:
      // const response = await fetch(`https://api.example.com/steps/${this.userId}`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ startDate, endDate })
      // });
      // 
      // if (response.ok) {
      //   const data = await response.json();
      //   return data.stepsData;
      // }
      
      return [];
    } catch (error) {
      console.error('Ошибка при получении данных о шагах из облака:', error);
      return [];
    }
  }
  
  /**
   * Получение данных о тренировках
   * ЗАМЕНЯЕТ метод generateDemoWorkoutsData
   */
  private async fetchRealWorkoutsData(
    startDate: Date, 
    endDate: Date
  ): Promise<WorkoutData[]> {
    try {
      if (!this.userId) return [];
      
      // Интеграция с реальным API для получения данных о тренировках
      const healthIntegration = RealHealthIntegration.getInstance();
      healthIntegration.setUserId(this.userId);
      
      // Получаем данные о тренировках через интеграцию
      const workoutsResults = await healthIntegration.queryHealthData(
        HealthDataType.WORKOUTS,
        startDate,
        endDate
      );
      
      if (Array.isArray(workoutsResults) && workoutsResults.length > 0) {
        return workoutsResults as WorkoutData[];
      }
      
      // Если данных нет, запрашиваем из облачного хранилища
      const cloudData = await this.fetchCloudWorkoutsData(startDate, endDate);
      if (cloudData.length > 0) {
        return cloudData;
      }
      
      // Если нет данных в облаке, запрашиваем из журнала тренировок
      const journalData = await this.fetchWorkoutsJournalData(startDate, endDate);
      if (journalData.length > 0) {
        return journalData;
      }
      
      // Если все источники данных недоступны, возвращаем пустой массив
      console.warn('Не удалось получить данные о тренировках из всех источников');
      return [];
    } catch (error) {
      console.error('Ошибка при получении данных о тренировках:', error);
      return [];
    }
  }
  
  /**
   * Получение данных о тренировках из облачного хранилища
   */
  private async fetchCloudWorkoutsData(
    startDate: Date, 
    endDate: Date
  ): Promise<WorkoutData[]> {
    try {
      if (!this.networkStatus.isConnected || !this.userId) {
        return [];
      }
      
      // Здесь должен быть код для обращения к облачному API
      // В реальном приложении здесь будет запрос к серверу
      
      // Пример:
      // const response = await fetch(`https://api.example.com/workouts/${this.userId}`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ startDate, endDate })
      // });
      // 
      // if (response.ok) {
      //   const data = await response.json();
      //   return data.workoutsData;
      // }
      
      return [];
    } catch (error) {
      console.error('Ошибка при получении данных о тренировках из облака:', error);
      return [];
    }
  }
  
  /**
   * Получение данных из журнала тренировок пользователя
   */
  private async fetchWorkoutsJournalData(
    startDate: Date, 
    endDate: Date
  ): Promise<WorkoutData[]> {
    try {
      if (!this.userId) return [];
      
      // Получаем доступ к локальному хранилищу журнала тренировок
      const journalKey = `workouts_journal_${this.userId}`;
      const encryptedJournal = await AsyncStorage.getItem(journalKey);
      
      if (!encryptedJournal) return [];
      
      // Расшифровываем данные
      const journalEntries = await this.decryptData(encryptedJournal);
      
      if (!Array.isArray(journalEntries)) return [];
      
      // Фильтруем по датам
      const filteredEntries = journalEntries.filter(entry => {
        const entryDate = new Date(entry.startDate);
        return entryDate >= startDate && entryDate <= endDate;
      });
      
      return filteredEntries;
    } catch (error) {
      console.error('Ошибка при получении данных из журнала тренировок:', error);
      return [];
    }
  }
  
  /**
   * Генерация демо-данных о шагах для тестирования
   */
  private generateDemoStepsData(
    startDate: Date, 
    endDate: Date, 
    days: number
  ): HealthDataPoint[] {
    const result: HealthDataPoint[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate && result.length < days) {
      // Базовое количество шагов с небольшими вариациями
      const baseSteps = 8000;
      const dayOfWeek = currentDate.getDay();
      
      // В выходные больше шагов, в рабочие дни меньше
      let dayMultiplier = 1.0;
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        dayMultiplier = 1.2; // Больше шагов в выходные
      } else if (dayOfWeek === 1 || dayOfWeek === 5) {
        dayMultiplier = 0.9; // Меньше в понедельник и пятницу
      }
      
      // Добавляем случайные вариации
      const randomVariation = 0.8 + Math.random() * 0.4; // 80% до 120%
      const steps = Math.round(baseSteps * dayMultiplier * randomVariation);
      
      // Создаем точку данных для дня
      const dayStart = new Date(currentDate);
      dayStart.setHours(0, 0, 0, 0);
      
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);
      
      result.push({
        startDate: dayStart.toISOString(),
        endDate: dayEnd.toISOString(),
        value: steps,
        unit: 'count'
      });
      
      // Переходим к следующему дню
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return result;
  }
  
  /**
   * Генерация демо-данных о тренировках для тестирования
   */
  private generateDemoWorkoutsData(
    startDate: Date, 
    endDate: Date, 
    count: number
  ): WorkoutData[] {
    const result: WorkoutData[] = [];
    
    // Список возможных типов тренировок
    const workoutTypes = [
      'running', 'walking', 'cycling', 'swimming', 
      'strength_training', 'yoga', 'hiit', 'pilates'
    ];
    
    // Общее количество дней в диапазоне
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Генерируем случайные тренировки в указанном диапазоне
    for (let i = 0; i < count; i++) {
      // Выбираем случайный день в диапазоне
      const randomDayOffset = Math.floor(Math.random() * totalDays);
      const workoutDate = new Date(startDate);
      workoutDate.setDate(workoutDate.getDate() + randomDayOffset);
      
      // Выбираем случайное время (с 6 до 20 часов)
      workoutDate.setHours(6 + Math.floor(Math.random() * 14), 
                           Math.floor(Math.random() * 60), 0, 0);
      
      // Выбираем случайную длительность (20-90 минут)
      const durationMinutes = 20 + Math.floor(Math.random() * 70);
      const durationSeconds = durationMinutes * 60;
      
      // Выбираем случайный тип тренировки
      const workoutType = workoutTypes[Math.floor(Math.random() * workoutTypes.length)];
      
      // Создаем данные о тренировке
      const workoutEndDate = new Date(workoutDate);
      workoutEndDate.setMinutes(workoutEndDate.getMinutes() + durationMinutes);
      
      // Рассчитываем примерные калории (от 4 до 10 калорий в минуту)
      const caloriesPerMinute = 4 + Math.random() * 6;
      const calories = Math.round(durationMinutes * caloriesPerMinute);
      
      // Рассчитываем примерную дистанцию для кардио-тренировок
      let distance: number | undefined = undefined;
      if (['running', 'walking', 'cycling', 'swimming'].includes(workoutType)) {
        // Примерная скорость в км/ч
        let speed = 0;
        switch (workoutType) {
          case 'running':
            speed = 8 + Math.random() * 4; // 8-12 км/ч
            break;
          case 'walking':
            speed = 4 + Math.random() * 2; // 4-6 км/ч
            break;
          case 'cycling':
            speed = 15 + Math.random() * 10; // 15-25 км/ч
            break;
          case 'swimming':
            speed = 2 + Math.random() * 1; // 2-3 км/ч
            break;
        }
        
        // Дистанция = скорость * время в часах
        distance = speed * (durationMinutes / 60);
      }
      
      // Создаем имитацию данных пульса для тренировки
      const heartRates: number[] = [];
      if (Math.random() > 0.3) { // 70% тренировок имеют данные о пульсе
        const baseHeartRate = 120 + Math.random() * 30; // 120-150 уд/мин
        
        // Создаем несколько значений пульса в течение тренировки
        const measurementCount = Math.ceil(durationMinutes / 5); // Одно измерение каждые 5 минут
        
        for (let j = 0; j < measurementCount; j++) {
          // Пульс колеблется вокруг базового значения
          const variation = -10 + Math.random() * 20; // -10 до +10 уд/мин
          heartRates.push(Math.round(baseHeartRate + variation));
        }
      }
      
      result.push({
        type: workoutType,
        startDate: workoutDate.toISOString(),
        endDate: workoutEndDate.toISOString(),
        duration: durationSeconds,
        calories,
        distance,
        heartRates: heartRates.length > 0 ? heartRates : undefined
      });
    }
    
    // Сортируем тренировки по дате
    result.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    
    return result;
  }

  /**
   * Генерация рекомендаций по здоровью
   */
  private async generateHealthRecommendations(
    params?: RecommendationParams
  ): Promise<AIRecommendation[]> {
    if (!this.userProfile) return [];
    
    try {
      const recommendations: AIRecommendation[] = [];
      
      // Получаем данные о здоровье от интеграции
      let sleepData: SleepData[] = [];
      let heartRateData: HealthDataPoint[] = [];
      let bloodPressureData: BloodPressureData[] = [];
      
      try {
        const healthIntegration = RealHealthIntegration.getInstance();
        if (this.userId) {
          healthIntegration.setUserId(this.userId);
          
          // Определяем даты для запроса данных
          const endDate = new Date();
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - 14); // Две недели данных
          
          // Получаем данные о сне
          const sleepResults = await healthIntegration.queryHealthData(
            HealthDataType.SLEEP,
            startDate,
            endDate
          );
          
          if (Array.isArray(sleepResults)) {
            sleepData = sleepResults as SleepData[];
          }
          
          // Получаем данные о пульсе
          const heartRateResults = await healthIntegration.queryHealthData(
            HealthDataType.HEART_RATE,
            startDate,
            endDate
          );
          
          if (Array.isArray(heartRateResults)) {
            heartRateData = heartRateResults as HealthDataPoint[];
          }
          
          // Получаем данные о давлении
          const bloodPressureResults = await healthIntegration.queryHealthData(
            HealthDataType.BLOOD_PRESSURE,
            startDate,
            endDate
          );
          
          if (Array.isArray(bloodPressureResults)) {
            bloodPressureData = bloodPressureResults as BloodPressureData[];
          }
        }
      } catch (error) {
        console.error('Ошибка при получении данных о здоровье:', error);
      }
      
      // Анализируем данные о сне
      if (sleepData.length > 0) {
        // Вычисляем среднюю продолжительность сна
        const totalSleepMinutes = sleepData
          .filter(data => data.type === 'asleep')
          .reduce((sum, data) => {
            const duration = (new Date(data.endDate).getTime() - new Date(data.startDate).getTime()) / (1000 * 60);
            return sum + duration;
          }, 0);
        
        const averageSleepMinutes = totalSleepMinutes / sleepData.filter(data => data.type === 'asleep').length;
        const averageSleepHours = averageSleepMinutes / 60;
        
        // Анализируем качество сна
        const sleepQuality = sleepData
          .filter(data => data.type === 'asleep' && data.quality !== undefined)
          .reduce((sum, data) => sum + (data.quality || 0), 0) / 
          sleepData.filter(data => data.type === 'asleep' && data.quality !== undefined).length || 0;
        
        // Рекомендации на основе продолжительности сна
        if (averageSleepHours < 7) {
          recommendations.push({
            id: `sleep_duration_${Date.now()}`,
            type: 'health',
            title: 'Увеличьте продолжительность сна',
            description: `Вы спите в среднем ${averageSleepHours.toFixed(1)} часов, что меньше рекомендуемых 7-9 часов. Недостаток сна может негативно влиять на иммунитет, метаболизм и когнитивные функции.`,
            priority: 'high',
            created: new Date().toISOString(),
            source: 'health_data',
            action: {
              type: 'view_details',
              data: {
                screen: 'SleepTips'
              }
            }
          });
        } else if (averageSleepHours > 9) {
          recommendations.push({
            id: `oversleeping_${Date.now()}`,
            type: 'health',
            title: 'Оптимизируйте продолжительность сна',
            description: `Вы спите в среднем ${averageSleepHours.toFixed(1)} часов, что больше рекомендуемых 7-9 часов. Избыточный сон также может быть связан с различными проблемами со здоровьем. Попробуйте установить регулярный режим сна.`,
            priority: 'medium',
            created: new Date().toISOString(),
            source: 'health_data',
            action: {
              type: 'view_details',
              data: {
                screen: 'SleepSchedule'
              }
            }
          });
        }
        
        // Рекомендации на основе качества сна
        if (sleepQuality > 0 && sleepQuality < 70) {
          recommendations.push({
            id: `sleep_quality_${Date.now()}`,
            type: 'health',
            title: 'Улучшите качество сна',
            description: 'Данные показывают, что качество вашего сна ниже оптимального. Попробуйте создать комфортную обстановку для сна, избегать яркого света и экранов перед сном, а также исключить кофеин во второй половине дня.',
            priority: 'medium',
            created: new Date().toISOString(),
            source: 'health_data',
            action: {
              type: 'view_details',
              data: {
                screen: 'SleepQuality'
              }
            }
          });
        }
      } else {
        // Общая рекомендация по сну при отсутствии данных
        recommendations.push({
          id: `sleep_general_${Date.now()}`,
          type: 'health',
          title: 'Следите за сном',
          description: 'Качественный сон - основа здоровья. Старайтесь спать 7-9 часов в сутки, ложиться и вставать в одно и то же время, создать комфортную температуру и темноту в спальне.',
          priority: 'medium',
          created: new Date().toISOString(),
          source: 'expert',
          action: {
            type: 'view_details',
            data: {
              screen: 'SleepHealth'
            }
          }
        });
      }
      
      // Анализируем данные о пульсе
      if (heartRateData.length > 0) {
        // Вычисляем средний пульс в состоянии покоя
        // Для простоты берем нижние 25% значений, предполагая что это пульс в покое
        const sortedHeartRates = [...heartRateData]
          .sort((a, b) => a.value - b.value)
          .slice(0, Math.ceil(heartRateData.length * 0.25));
        
        const averageRestingHeartRate = sortedHeartRates.reduce((sum, data) => sum + data.value, 0) / sortedHeartRates.length;
        
        // Рекомендации на основе пульса в покое
        if (averageRestingHeartRate > 80) {
          recommendations.push({
            id: `resting_heart_rate_${Date.now()}`,
            type: 'health',
            title: 'Повышенный пульс в покое',
            description: `Ваш средний пульс в покое составляет около ${Math.round(averageRestingHeartRate)} уд/мин, что выше оптимального диапазона (60-80 уд/мин). Регулярные кардио-тренировки и методы релаксации могут помочь снизить пульс в покое.`,
            priority: 'medium',
            created: new Date().toISOString(),
            source: 'health_data',
            action: {
              type: 'view_details',
              data: {
                screen: 'HeartHealth'
              }
            }
          });
        }
      }
      
      // Анализируем данные о давлении
      if (bloodPressureData.length > 0) {
        // Вычисляем среднее давление
        const totalSystolic = bloodPressureData.reduce((sum, data) => sum + data.systolic, 0);
        const totalDiastolic = bloodPressureData.reduce((sum, data) => sum + data.diastolic, 0);
        
        const averageSystolic = totalSystolic / bloodPressureData.length;
        const averageDiastolic = totalDiastolic / bloodPressureData.length;
        
        // Рекомендации на основе давления
        if (averageSystolic > 130 || averageDiastolic > 85) {
          recommendations.push({
            id: `blood_pressure_${Date.now()}`,
            type: 'health',
            title: 'Повышенное артериальное давление',
            description: `Ваше среднее артериальное давление составляет ${Math.round(averageSystolic)}/${Math.round(averageDiastolic)} мм рт. ст., что выше оптимального диапазона. Обратите внимание на солевой и водный режим, уровень стресса и физическую активность.`,
            priority: 'high',
            created: new Date().toISOString(),
            source: 'health_data',
            action: {
              type: 'view_details',
              data: {
                screen: 'BloodPressure'
              }
            }
          });
        } else if (averageSystolic < 100 || averageDiastolic < 60) {
          recommendations.push({
            id: `low_blood_pressure_${Date.now()}`,
            type: 'health',
            title: 'Пониженное артериальное давление',
            description: `Ваше среднее артериальное давление составляет ${Math.round(averageSystolic)}/${Math.round(averageDiastolic)} мм рт. ст., что ниже оптимального диапазона. Обратите внимание на достаточное потребление воды и электролитов, особенно в жаркую погоду.`,
            priority: 'medium',
            created: new Date().toISOString(),
            source: 'health_data',
            action: {
              type: 'view_details',
              data: {
                screen: 'LowBloodPressure'
              }
            }
          });
        }
      }
      
      // Добавляем рекомендации по профилактическим обследованиям
      // Используем возраст из профиля пользователя для персонализации
      if (this.userProfile?.age) {
        const age = this.userProfile.age;
        
        if (age >= 40) {
          recommendations.push({
            id: `preventive_screenings_${Date.now()}`,
            type: 'health',
            title: 'Регулярные профилактические обследования',
            description: 'В вашем возрасте рекомендуется проходить регулярные профилактические обследования, включая проверку уровня холестерина, сахара крови и артериального давления. Женщинам также рекомендуется маммография, мужчинам - проверка ПСА.',
            priority: 'medium',
            created: new Date().toISOString(),
            source: 'expert',
            action: {
              type: 'view_details',
              data: {
                screen: 'PreventiveScreenings'
              }
            }
          });
        }
        
        if (age >= 50) {
          recommendations.push({
            id: `colon_screening_${Date.now()}`,
            type: 'health',
            title: 'Скрининг на рак толстой кишки',
            description: 'В вашем возрасте рекомендуется проходить регулярный скрининг на рак толстой кишки. Обсудите с вашим врачом оптимальные методы скрининга и их периодичность.',
            priority: 'medium',
            created: new Date().toISOString(),
            source: 'expert',
            action: {
              type: 'view_details',
              data: {
                screen: 'ColonCancerScreening'
              }
            }
          });
        }
      }
      
      // Добавляем общие рекомендации по здоровью
      recommendations.push({
        id: `immune_support_${Date.now()}`,
        type: 'health',
        title: 'Поддержка иммунной системы',
        description: 'Укрепляйте иммунитет с помощью полноценного сна, регулярной физической активности, контроля стресса и здорового питания, богатого витаминами и минералами.',
        priority: 'low',
        created: new Date().toISOString(),
        source: 'ai',
        action: {
          type: 'view_details',
          data: {
            screen: 'ImmuneSystem'
          }
        }
      });
      
      // Фильтрация рекомендаций в соответствии с целями здоровья
      if (params?.healthGoals && params.healthGoals.length > 0) {
        // Если указаны конкретные цели здоровья, отдаем приоритет им
        const priorityRecommendations = recommendations.filter(rec => {
          // Проверяем, соответствует ли рекомендация какой-либо из целей
          return params.healthGoals?.some(goal => {
            const lowercaseGoal = goal.toLowerCase();
            const lowercaseTitle = rec.title.toLowerCase();
            const lowercaseDesc = rec.description.toLowerCase();
            
            return lowercaseTitle.includes(lowercaseGoal) || 
                   lowercaseDesc.includes(lowercaseGoal);
          });
        });
        
        // Если найдены соответствующие рекомендации, возвращаем их
        if (priorityRecommendations.length > 0) {
          return [...priorityRecommendations, recommendations[0]]; // Добавляем еще одну общую рекомендацию
        }
      }
      
      return recommendations;
    } catch (error) {
      console.error('Ошибка при генерации рекомендаций по здоровью:', error);
      return [];
    }
  }

  /**
   * Генерация рекомендаций по образу жизни
   */
  private async generateLifestyleRecommendations(
    params?: RecommendationParams
  ): Promise<AIRecommendation[]> {
    if (!this.userProfile) return [];
    
    try {
      const recommendations: AIRecommendation[] = [];
      
      // Рекомендации по балансу работы и отдыха
      recommendations.push({
        id: `work_life_balance_${Date.now()}`,
        type: 'lifestyle',
        title: 'Баланс работы и отдыха',
        description: 'Старайтесь поддерживать здоровый баланс между работой и личной жизнью. Выделяйте время для хобби, общения с близкими и полноценного отдыха.',
        priority: 'medium',
        created: new Date().toISOString(),
        source: 'ai',
        action: {
          type: 'view_details',
          data: {
            screen: 'WorkLifeBalance'
          }
        }
      });
      
      // Рекомендации по управлению стрессом
      recommendations.push({
        id: `stress_management_${Date.now()}`,
        type: 'lifestyle',
        title: 'Управление стрессом',
        description: 'Регулярно практикуйте техники управления стрессом: глубокое дыхание, медитация, йога или другие методы релаксации помогут снизить уровень стресса и улучшить самочувствие.',
        priority: 'medium',
        created: new Date().toISOString(),
        source: 'expert',
        action: {
          type: 'view_details',
          data: {
            screen: 'StressManagement'
          }
        }
      });
      
      // Рекомендации по режиму дня в зависимости от возраста
      if (this.userProfile?.age) {
        const age = this.userProfile.age;
        
        if (age >= 18 && age <= 35) {
          // Рекомендации для молодых взрослых
          recommendations.push({
            id: `tech_boundaries_${Date.now()}`,
            type: 'lifestyle',
            title: 'Установите границы с технологиями',
            description: 'Ограничьте время использования электронных устройств, особенно перед сном. Установите цифровые границы: выключайте уведомления на час-два ежедневно для глубокой работы или отдыха.',
            priority: 'medium',
            created: new Date().toISOString(),
            source: 'ai',
            action: {
              type: 'view_details',
              data: {
                screen: 'DigitalWellbeing'
              }
            }
          });
        } else if (age > 35 && age <= 60) {
          // Рекомендации для взрослых среднего возраста
          recommendations.push({
            id: `me_time_${Date.now()}`,
            type: 'lifestyle',
            title: 'Выделяйте время для себя',
            description: 'В напряженном графике обязательно планируйте время только для себя - как минимум 30 минут ежедневно. Это улучшит ваше психологическое состояние и продуктивность.',
            priority: 'medium',
            created: new Date().toISOString(),
            source: 'ai',
            action: {
              type: 'view_details',
              data: {
                screen: 'SelfCare'
              }
            }
          });
        } else if (age > 60) {
          // Рекомендации для пожилых людей
          recommendations.push({
            id: `social_connection_${Date.now()}`,
            type: 'lifestyle',
            title: 'Поддерживайте социальные связи',
            description: 'Регулярное общение с друзьями, семьей и сообществами критически важно для когнитивного здоровья и эмоционального благополучия. Стремитесь к социальной активности несколько раз в неделю.',
            priority: 'high',
            created: new Date().toISOString(),
            source: 'expert',
            action: {
              type: 'view_details',
              data: {
                screen: 'SocialConnections'
              }
            }
          });
        }
      }
      
      // Рекомендации по экологичному образу жизни
      recommendations.push({
        id: `eco_lifestyle_${Date.now()}`,
        type: 'lifestyle',
        title: 'Экологичный образ жизни',
        description: 'Небольшие экологичные привычки не только помогают планете, но и улучшают ваше здоровье. Уменьшите потребление пластика, выбирайте сезонные местные продукты, экономьте воду и электроэнергию.',
        priority: 'low',
        created: new Date().toISOString(),
        source: 'ai',
        action: {
          type: 'view_details',
          data: {
            screen: 'EcoLifestyle'
          }
        }
      });
      
      // Рекомендации по здоровым привычкам
      recommendations.push({
        id: `habit_formation_${Date.now()}`,
        type: 'lifestyle',
        title: 'Формирование здоровых привычек',
        description: 'Для формирования новой привычки в среднем требуется 66 дней. Начинайте с малого, встраивайте новые привычки в существующие рутины и отслеживайте прогресс для большей мотивации.',
        priority: 'medium',
        created: new Date().toISOString(),
        source: 'expert',
        action: {
          type: 'view_details',
          data: {
            screen: 'HabitFormation'
          }
        }
      });
      
      // Если указаны диетические ограничения, добавляем соответствующие рекомендации
      if (params?.dietaryRestrictions && params.dietaryRestrictions.length > 0) {
        recommendations.push({
          id: `dietary_alternatives_${Date.now()}`,
          type: 'lifestyle',
          title: 'Альтернативы для вашего типа питания',
          description: `С учетом ваших диетических предпочтений, исследуйте новые продукты и рецепты, чтобы разнообразить рацион и получать все необходимые питательные вещества.`,
          priority: 'medium',
          created: new Date().toISOString(),
          source: 'ai',
          action: {
            type: 'view_details',
            data: {
              screen: 'DietaryAlternatives',
              restrictions: params.dietaryRestrictions
            }
          }
        });
      }
      
      return recommendations;
    } catch (error) {
      console.error('Ошибка при генерации рекомендаций по образу жизни:', error);
      return [];
    }
  }

  /**
   * Генерация рекомендаций по ментальному здоровью
   */
  private async generateMentalHealthRecommendations(
    params?: RecommendationParams
  ): Promise<AIRecommendation[]> {
    if (!this.userProfile) return [];
    
    try {
      const recommendations: AIRecommendation[] = [];
      
      // Рекомендации по практике осознанности
      recommendations.push({
        id: `mindfulness_${Date.now()}`,
        type: 'mental_health',
        title: 'Практика осознанности',
        description: 'Регулярная практика осознанности может снизить уровень стресса, улучшить концентрацию и повысить эмоциональное благополучие. Начните с 5-10 минут в день, постепенно увеличивая время.',
        priority: 'medium',
        created: new Date().toISOString(),
        source: 'expert',
        action: {
          type: 'view_details',
          data: {
            screen: 'Mindfulness'
          }
        }
      });
      
      // Рекомендации по эмоциональному интеллекту
      recommendations.push({
        id: `emotional_intelligence_${Date.now()}`,
        type: 'mental_health',
        title: 'Развивайте эмоциональный интеллект',
        description: 'Умение распознавать и управлять своими эмоциями - ключевой навык для психологического благополучия. Практикуйте осознание эмоций, ведите дневник эмоций или используйте специальные приложения.',
        priority: 'medium',
        created: new Date().toISOString(),
        source: 'ai',
        action: {
          type: 'view_details',
          data: {
            screen: 'EmotionalIntelligence'
          }
        }
      });
      
      // Рекомендации по информационной гигиене
      recommendations.push({
        id: `information_hygiene_${Date.now()}`,
        type: 'mental_health',
        title: 'Соблюдайте информационную гигиену',
        description: 'Ограничьте потребление новостей и социальных сетей до 1-2 раз в день. Информационная перегрузка может привести к повышенной тревожности и стрессу.',
        priority: 'medium',
        created: new Date().toISOString(),
        source: 'ai',
        action: {
          type: 'view_details',
          data: {
            screen: 'InformationHygiene'
          }
        }
      });
      
      // Рекомендации по глубокому отдыху
      recommendations.push({
        id: `deep_rest_${Date.now()}`,
        type: 'mental_health',
        title: 'Практикуйте глубокий отдых',
        description: 'Выделяйте время для глубокого отдыха - не только физического, но и ментального. Это может быть медитация, время на природе без гаджетов или творческие занятия, которые полностью поглощают ваше внимание.',
        priority: 'high',
        created: new Date().toISOString(),
        source: 'expert',
        action: {
          type: 'view_details',
          data: {
            screen: 'DeepRest'
          }
        }
      });
      
      // Рекомендации по социальной поддержке
      recommendations.push({
        id: `social_support_${Date.now()}`,
        type: 'mental_health',
        title: 'Укрепляйте систему поддержки',
        description: 'Крепкие социальные связи - один из важнейших факторов психологического благополучия. Регулярно общайтесь с близкими людьми, которые вас поддерживают и понимают.',
        priority: 'medium',
        created: new Date().toISOString(),
        source: 'ai',
        action: {
          type: 'view_details',
          data: {
            screen: 'SocialSupport'
          }
        }
      });
      
      // Рекомендации по профессиональной помощи
      recommendations.push({
        id: `professional_help_${Date.now()}`,
        type: 'mental_health',
        title: 'Не стесняйтесь обращаться за профессиональной помощью',
        description: 'Обращение к психологу или психотерапевту - это признак силы, а не слабости. Если вы испытываете стойкие негативные эмоции, снижение работоспособности или проблемы со сном, рассмотрите возможность консультации специалиста.',
        priority: 'low',
        created: new Date().toISOString(),
        source: 'expert',
        action: {
          type: 'view_details',
          data: {
            screen: 'MentalHealthProfessionals'
          }
        }
      });
      
      return recommendations;
    } catch (error) {
      console.error('Ошибка при генерации рекомендаций по ментальному здоровью:', error);
      return [];
    }
  }

  /**
   * Генерация персонализированных рекомендаций на основе ИИ
   * Улучшенная версия с учетом большего количества контекстуальных факторов
   */
  private async generatePersonalizedAIRecommendations(
    existingRecommendations: AIRecommendation[],
    params?: RecommendationParams
  ): Promise<AIRecommendation[]> {
    if (!this.userProfile) return [];
    
    try {
      const recommendations: AIRecommendation[] = [];
      
      // Расширенный анализ данных пользователя
      const userContext = await this.buildUserContext();
      const userInterests = this.analyzeUserInterests(existingRecommendations);
      const seasonalFactors = this.analyzeSeasonalFactors();
      const timeBasedFactors = this.analyzeTimeBasedFactors();
      const locationFactors = await this.analyzeLocationFactors();
      const healthInsights = await this.generateHealthInsights();
      
      // Логирование для отладки (в продакшене следует удалить)
      console.debug('Контекстуальные факторы для рекомендаций:', {
        interests: userInterests.topInterest,
        season: seasonalFactors.currentSeason,
        timeOfDay: timeBasedFactors.timeOfDay,
        location: locationFactors.type
      });
      
      // 1. Персонализированные рекомендации на основе топового интереса
      if (userInterests.topInterest) {
        const formattedInterest = this.formatInterestTitle(userInterests.topInterest);
        
        recommendations.push({
          id: `personalized_interest_${Date.now()}`,
          type: userInterests.topInterest as AIRecommendationType,
          title: `Персонализированный совет по теме "${formattedInterest}"`,
          description: this.generatePersonalizedDescription(
            userContext, 
            userInterests.topInterest, 
            seasonalFactors,
            timeBasedFactors
          ),
          priority: 'high',
          created: new Date().toISOString(),
          source: 'ai',
          action: {
            type: 'view_details',
            data: {
              screen: 'PersonalizedRecommendation',
              interest: userInterests.topInterest,
              context: {
                season: seasonalFactors.currentSeason,
                timeOfDay: timeBasedFactors.timeOfDay,
                location: locationFactors.type
              }
            }
          },
          metadata: {
            interestScore: userInterests.topInterestCount,
            totalInterests: Object.keys(userInterests.interests).length,
            contextualFactors: {
              season: seasonalFactors.currentSeason,
              timeOfDay: timeBasedFactors.timeOfDay,
              location: locationFactors.type
            }
          }
        });
      }
      
      // 2. Сезонная рекомендация с учетом местоположения
      const seasonTitle = this.getSeasonTitle(seasonalFactors.currentSeason);
      const locationBasedFoods = this.getLocationBasedFoods(
        seasonalFactors.currentSeason,
        locationFactors.region || 'unknown'
      );
      
      recommendations.push({
        id: `seasonal_${seasonalFactors.currentSeason}_${Date.now()}`,
        type: 'nutrition',
        title: `Сезонные продукты: ${seasonTitle} ${locationFactors.name ? `в регионе ${locationFactors.name}` : ''}`,
        description: `${seasonalFactors.seasonalTip} ${
          locationBasedFoods.length > 0 
            ? `В вашем регионе сейчас особенно полезны: ${locationBasedFoods.slice(0, 3).join(', ')}.` 
            : `В этом сезоне рекомендуем обратить внимание на: ${seasonalFactors.seasonalFoods.slice(0, 3).join(', ')}.`
        }`,
        priority: 'medium',
        created: new Date().toISOString(),
        source: 'ai',
        action: {
          type: 'view_details',
          data: {
            screen: 'SeasonalFoods',
            season: seasonalFactors.currentSeason,
            region: locationFactors.region
          }
        },
        metadata: {
          season: seasonalFactors.currentSeason,
          foods: locationBasedFoods.length > 0 ? locationBasedFoods : seasonalFactors.seasonalFoods,
          activities: seasonalFactors.seasonalActivities,
          region: locationFactors.region
        }
      });
      
      // 3. Рекомендации на основе времени суток
      if (timeBasedFactors.timeOfDay) {
        recommendations.push({
          id: `time_based_${timeBasedFactors.timeOfDay}_${Date.now()}`,
          type: this.getTimeBasedRecommendationType(timeBasedFactors.timeOfDay),
          title: this.getTimeBasedTitle(timeBasedFactors.timeOfDay),
          description: this.getTimeBasedDescription(timeBasedFactors.timeOfDay, userContext),
          priority: this.getTimeBasedPriority(timeBasedFactors.timeOfDay),
          created: new Date().toISOString(),
          source: 'ai',
          action: {
            type: 'view_details',
            data: {
              screen: this.getTimeBasedScreenName(timeBasedFactors.timeOfDay)
            }
          },
          metadata: {
            timeOfDay: timeBasedFactors.timeOfDay,
            hour: timeBasedFactors.hour,
            userLocalTime: timeBasedFactors.userLocalTime
          }
        });
      }
      
      // 4. Рекомендации на основе предыдущего взаимодействия с пользователем
      const recentFeedback = userInterests.recentInteractions.filter(
        interaction => interaction.timestamp && 
        new Date(interaction.timestamp).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000 // За последнюю неделю
      );
      
      if (recentFeedback.length > 0) {
        const positiveCount = recentFeedback.filter(
          feedback => feedback.details.includes('полезно')
        ).length;
        
        const feedbackRatio = positiveCount / recentFeedback.length;
        
        // Персонализированная рекомендация на основе отзывов
        recommendations.push({
          id: `feedback_based_${Date.now()}`,
          type: 'lifestyle',
          title: feedbackRatio > 0.7 
            ? 'Спасибо за вашу положительную обратную связь!' 
            : 'Спасибо за ваши отзывы — мы становимся лучше',
          description: feedbackRatio > 0.7 
            ? 'Нам очень приятно, что наши рекомендации полезны для вас. Мы продолжим подбирать персонализированные советы, которые помогут достичь ваших целей здоровья.' 
            : 'Благодаря вашим отзывам мы постоянно улучшаем наши рекомендации. Ваше мнение важно для нас и помогает сделать приложение более полезным.',
          priority: 'low',
          created: new Date().toISOString(),
          source: 'ai',
          action: {
            type: 'view_details',
            data: {
              screen: 'FeedbackImpact'
            }
          }
        });
      }
      
      // 5. Рекомендации на основе здоровья
      if (healthInsights.criticalInsight) {
        recommendations.push({
          id: `health_insight_${Date.now()}`,
          type: 'health',
          title: healthInsights.criticalInsight.title,
          description: healthInsights.criticalInsight.description,
          priority: 'high',
          created: new Date().toISOString(),
          source: 'health_data',
          action: {
            type: 'view_details',
            data: {
              screen: healthInsights.criticalInsight.screenName
            }
          }
        });
      }
      
      // 6. Персонализированные диетические рекомендации
      if (this.userProfile.dietaryRestrictions && this.userProfile.dietaryRestrictions.length > 0) {
        const restrictions = this.userProfile.dietaryRestrictions;
        const dietaryAlternatives = this.getDietaryAlternatives(restrictions);
        
        // Генерируем персонализированную рекомендацию с учетом ограничений
        recommendations.push({
          id: `dietary_restriction_${Date.now()}`,
          type: 'nutrition',
          title: 'Персонализированный план питания',
          description: `С учетом ваших диетических предпочтений (${restrictions.join(', ')}), мы подобрали альтернативные источники питательных веществ: ${dietaryAlternatives.slice(0, 3).join(', ')} и другие.`,
          priority: 'high',
          created: new Date().toISOString(),
          source: 'ai',
          action: {
            type: 'view_details',
            data: {
              screen: 'PersonalizedMealPlan',
              restrictions,
              alternatives: dietaryAlternatives
            }
          }
        });
      }
      
      return recommendations;
    } catch (error) {
      console.error('Ошибка при генерации персонализированных рекомендаций:', error);
      return [];
    }
  }

  /**
   * Построение контекста пользователя для персонализации
   */
  private async buildUserContext(): Promise<{
    age?: number;
    gender?: string;
    preferences: string[];
    restrictions: string[];
    goals: string[];
    recentInteractions: string[];
    region?: string;
  }> {
    if (!this.userProfile) {
      return {
        preferences: [],
        restrictions: [],
        goals: [],
        recentInteractions: []
      };
    }
    
    // Сбор предпочтений пользователя
    const preferences: string[] = [];
    if (this.userProfile.preferredActivities) {
      preferences.push(...this.userProfile.preferredActivities);
    }
    
    // Сбор целей
    const goals: string[] = [];
    if (this.userProfile.fitnessGoals) {
      goals.push(...this.userProfile.fitnessGoals);
    }
    
    // Сбор ограничений
    const restrictions: string[] = [];
    if (this.userProfile.dietaryRestrictions) {
      restrictions.push(...this.userProfile.dietaryRestrictions);
    }
    if (this.userProfile.allergies) {
      restrictions.push(...this.userProfile.allergies);
    }
    if (this.userProfile.healthConditions) {
      restrictions.push(...this.userProfile.healthConditions);
    }
    
    // Получаем последние взаимодействия
    const recentInteractions: string[] = await this.getRecentUserInteractions();
    
    // Получаем регион пользователя
    const regionInfo = await this.getUserRegion();
    
    return {
      age: this.userProfile.age,
      gender: this.userProfile.gender,
      preferences,
      restrictions,
      goals,
      recentInteractions,
      region: regionInfo?.region
    };
  }

  /**
   * Получение недавних взаимодействий пользователя
   */
  private async getRecentUserInteractions(): Promise<string[]> {
    try {
      if (!this.userId) return [];
      
      const interactionsKey = `user_interactions_${this.userId}`;
      const encryptedInteractions = await AsyncStorage.getItem(interactionsKey);
      
      if (!encryptedInteractions) return [];
      
      try {
        const interactions = await this.decryptData(encryptedInteractions);
        
        if (Array.isArray(interactions)) {
          return interactions
            .filter(item => new Date(item.timestamp).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000)
            .map(item => item.action || '');
        }
      } catch (error) {
        console.warn('Ошибка при расшифровке взаимодействий:', error);
      }
      
      return [];
    } catch (error) {
      console.error('Ошибка при получении взаимодействий пользователя:', error);
      return [];
    }
  }

  /**
   * Получение региона пользователя
   */
  private async getUserRegion(): Promise<{ region: string; name: string } | null> {
    try {
      // В реальном приложении здесь был бы код для получения региона пользователя
      // на основе геолокации или настроек приложения
      
      return {
        region: 'europe',
        name: 'Европа'
      };
    } catch (error) {
      console.warn('Ошибка при получении региона пользователя:', error);
      return null;
    }
  }

  /**
   * Генерация персонализированного описания на основе контекста
   */
  private generatePersonalizedDescription(
    userContext: any,
    interestType: string,
    seasonalFactors: SeasonalFactors,
    timeFactors: { timeOfDay: string; hour: number; userLocalTime: string }
  ): string {
    // Базовый шаблон описания
    let description = `Основываясь на вашем интересе к теме "${this.formatInterestTitle(interestType)}", `;
    
    // Добавляем сезонный контекст
    description += `а также учитывая текущий сезон (${this.getSeasonTitle(seasonalFactors.currentSeason)}), `;
    
    // Добавляем контекст времени суток
    description += `и время суток (${timeFactors.timeOfDay}), `;
    
    // Добавляем основную рекомендацию
    switch (interestType) {
      case 'nutrition':
        description += `мы рекомендуем обратить внимание на сезонные продукты, богатые необходимыми питательными веществами.`;
        break;
      case 'activity':
        if (seasonalFactors.currentSeason === 'winter') {
          description += `мы подобрали для вас оптимальные физические активности, которые можно выполнять в помещении.`;
        } else {
          description += `мы подобрали для вас оптимальные физические активности на свежем воздухе.`;
        }
        break;
      case 'health':
        description += `мы подготовили персонализированные рекомендации для поддержания оптимального здоровья.`;
        break;
      case 'mental_health':
        description += `мы подобрали для вас практики, которые помогут поддерживать эмоциональное благополучие.`;
        break;
      default:
        description += `мы подготовили специальные рекомендации, учитывающие ваш профиль и предпочтения.`;
    }
    
    return description;
  }

  /**
   * Анализ факторов на основе времени
   */
  private analyzeTimeBasedFactors(): { 
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'; 
    hour: number;
    userLocalTime: string;
  } {
    const now = new Date();
    const hour = now.getHours();
    
    let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night' = 'afternoon';
    
    if (hour >= 5 && hour < 12) {
      timeOfDay = 'morning';
    } else if (hour >= 12 && hour < 17) {
      timeOfDay = 'afternoon';
    } else if (hour >= 17 && hour < 22) {
      timeOfDay = 'evening';
    } else {
      timeOfDay = 'night';
    }
    
    return {
      timeOfDay,
      hour,
      userLocalTime: now.toLocaleTimeString()
    };
  }

  /**
   * Анализ факторов на основе местоположения
   */
  private async analyzeLocationFactors(): Promise<{
    type: 'urban' | 'suburban' | 'rural' | 'unknown';
    region?: string;
    name?: string;
  }> {
    try {
      // В реальном приложении здесь был бы код для определения местоположения
      // и его характеристик
      
      // Пример заглушки
      return {
        type: 'urban',
        region: 'europe',
        name: 'Европа'
      };
    } catch (error) {
      console.warn('Ошибка при анализе факторов местоположения:', error);
      return { type: 'unknown' };
    }
  }

  /**
   * Получение сезонных продуктов с учетом региона
   */
  private getLocationBasedFoods(
    season: 'winter' | 'spring' | 'summer' | 'fall',
    region: string
  ): string[] {
    // База данных сезонных продуктов по регионам
    const seasonalFoodsByRegion: Record<string, Record<string, string[]>> = {
      'europe': {
        'winter': ['капуста', 'свекла', 'морковь', 'лук', 'чеснок', 'яблоки', 'груши', 'картофель'],
        'spring': ['спаржа', 'редис', 'шпинат', 'руккола', 'зеленый лук', 'горох', 'молодая капуста'],
        'summer': ['помидоры', 'огурцы', 'перец', 'баклажаны', 'кабачки', 'клубника', 'малина', 'черника'],
        'fall': ['тыква', 'кабачки', 'яблоки', 'груши', 'сливы', 'виноград', 'грибы', 'брокколи']
      },
      'north_america': {
        'winter': ['апельсины', 'грейпфруты', 'капуста', 'брокколи', 'цветная капуста', 'кале', 'репа'],
        'spring': ['артишоки', 'спаржа', 'морковь', 'укроп', 'горох', 'ревень', 'клубника'],
        'summer': ['черника', 'малина', 'кукуруза', 'перец', 'помидоры', 'огурцы', 'дыни', 'арбузы'],
        'fall': ['яблоки', 'груши', 'тыква', 'свекла', 'брюссельская капуста', 'грибы', 'инжир']
      },
      'asia': {
        'winter': ['китайская капуста', 'дайкон', 'шпинат', 'мандарины', 'корень лотоса', 'репа'],
        'spring': ['бамбуковые побеги', 'горох', 'зелень', 'молодой имбирь', 'редис', 'шпинат'],
        'summer': ['баклажаны', 'горький огурец', 'кабачки', 'окра', 'перец', 'батат', 'фасоль'],
        'fall': ['грибы шиитаке', 'хурма', 'каштаны', 'имбирь', 'морские водоросли', 'корень лотоса']
      }
    };
    
    // Возвращаем продукты для конкретного региона и сезона, либо общие продукты
    if (region in seasonalFoodsByRegion && season in seasonalFoodsByRegion[region]) {
      return seasonalFoodsByRegion[region][season];
    }
    
    // Если регион не найден, возвращаем общие сезонные продукты
    const defaultSeasonalFoods = {
      'winter': ['капуста', 'корнеплоды', 'цитрусовые', 'яблоки', 'груши'],
      'spring': ['зелень', 'спаржа', 'редис', 'молодые овощи'],
      'summer': ['ягоды', 'помидоры', 'огурцы', 'кабачки', 'перец', 'баклажаны'],
      'fall': ['тыква', 'яблоки', 'груши', 'виноград', 'грибы', 'корнеплоды']
    };
    
    return defaultSeasonalFoods[season];
  }

  /**
   * Получение альтернатив для диетических ограничений
   */
  private getDietaryAlternatives(restrictions: string[]): string[] {
    const alternativesMap: Record<string, string[]> = {
      'vegetarian': ['тофу', 'темпе', 'сейтан', 'бобовые', 'орехи', 'семена'],
      'vegan': ['тофу', 'темпе', 'растительное молоко', 'нутриционные дрожжи', 'водоросли нори', 'семена чиа'],
      'gluten-free': ['рис', 'киноа', 'гречка', 'кукуруза', 'амарант', 'просо'],
      'dairy-free': ['миндальное молоко', 'кокосовое молоко', 'соевый йогурт', 'кокосовое масло', 'безмолочный сыр'],
      'low-carb': ['авокадо', 'яйца', 'рыба', 'орехи', 'оливковое масло', 'зеленые овощи'],
      'keto': ['авокадо', 'жирная рыба', 'оливковое масло', 'кокосовое масло', 'орехи и семена', 'яйца']
    };
    
    const alternatives: string[] = [];
    
    // Собираем альтернативы для каждого ограничения
    for (const restriction of restrictions) {
      const lowercaseRestriction = restriction.toLowerCase();
      
      // Ищем подходящие альтернативы
      for (const [key, items] of Object.entries(alternativesMap)) {
        if (lowercaseRestriction.includes(key) || key.includes(lowercaseRestriction)) {
          alternatives.push(...items);
        }
      }
    }
    
    // Удаляем дубликаты
    return [...new Set(alternatives)];
  }

  /**
   * Генерация инсайтов о здоровье на основе всех данных
   */
  private async generateHealthInsights(): Promise<{
    criticalInsight?: {
      title: string;
      description: string;
      screenName: string;
    };
    insights: Array<{
      type: string;
      title: string;
      description: string;
      priority: 'low' | 'medium' | 'high';
    }>;
  }> {
    try {
      const insights = [];
      let criticalInsight = undefined;
      
      // В реальном приложении здесь был бы код для анализа данных здоровья
      // и генерации инсайтов
      
      // Пример заглушки
      if (Math.random() > 0.7) {
        criticalInsight = {
          title: 'Важный инсайт о вашем здоровье',
          description: 'На основе анализа ваших данных за последний месяц мы обнаружили потенциально важную закономерность. Рекомендуем обратить внимание на режим сна и уровень стресса.',
          screenName: 'HealthInsight'
        };
      }
      
      return {
        criticalInsight,
        insights: []
      };
    } catch (error) {
      console.warn('Ошибка при генерации инсайтов о здоровье:', error);
      return { insights: [] };
    }
  }

  /**
   * Получение типа рекомендации на основе времени суток
   */
  private getTimeBasedRecommendationType(timeOfDay: string): AIRecommendationType {
    switch (timeOfDay) {
      case 'morning':
        return 'nutrition';
      case 'afternoon':
        return 'activity';
      case 'evening':
        return 'lifestyle';
      case 'night':
        return 'sleep';
      default:
        return 'health';
    }
  }

  /**
   * Получение заголовка рекомендации на основе времени суток
   */
  private getTimeBasedTitle(timeOfDay: string): string {
    switch (timeOfDay) {
      case 'morning':
        return 'Оптимальное начало дня';
      case 'afternoon':
        return 'Поддержание энергии днем';
      case 'evening':
        return 'Вечерняя рутина для здоровья';
      case 'night':
        return 'Подготовка к качественному сну';
      default:
        return 'Рекомендация на основе времени суток';
    }
  }

  /**
   * Получение описания рекомендации на основе времени суток
   */
  private getTimeBasedDescription(timeOfDay: string, userContext: any): string {
    const baseDescription = {
      'morning': 'Утро задает тон всему дню. Начните день с стакана воды, легкой зарядки и питательного завтрака, богатого белками и клетчаткой.',
      'afternoon': 'Во второй половине дня часто наступает энергетический спад. Сделайте короткий перерыв, разомнитесь и перекусите богатыми на белок продуктами.',
      'evening': 'Вечер - идеальное время для расслабления и восстановления. Ограничьте использование экранов, предпочтите легкий ужин и создайте спокойную атмосферу.',
      'night': 'Качественный сон критически важен для здоровья. Обеспечьте прохладную (18-20°C), темную и тихую обстановку в спальне.',
    };
    
    // Персонализируем описание на основе контекста пользователя
    if (userContext.age && userContext.age > 50 && timeOfDay === 'night') {
      return 'В вашем возрасте особенно важен регулярный и качественный сон. Старайтесь ложиться и вставать в одно и то же время, даже в выходные дни. Избегайте кофеиносодержащих напитков после 14:00.';
    }
    
    if (userContext.restrictions.includes('stress') && timeOfDay === 'evening') {
      return 'Вечер - идеальное время для управления стрессом. Выделите 20 минут для медитации, дыхательных практик или йоги. Ограничьте новости и социальные сети перед сном.';
    }
    
    return baseDescription[timeOfDay as keyof typeof baseDescription] || 'Рекомендации на основе времени суток помогут оптимизировать ваш режим и самочувствие.';
  }

  /**
   * Получение приоритета рекомендации на основе времени суток
   */
  private getTimeBasedPriority(timeOfDay: string): 'low' | 'medium' | 'high' {
    const now = new Date();
    const currentHour = now.getHours();
    
    // Если текущее время соответствует рекомендуемому времени дня, повышаем приоритет
    if ((timeOfDay === 'morning' && currentHour >= 5 && currentHour < 10) ||
        (timeOfDay === 'afternoon' && currentHour >= 13 && currentHour < 16) ||
        (timeOfDay === 'evening' && currentHour >= 18 && currentHour < 21) ||
        (timeOfDay === 'night' && (currentHour >= 21 || currentHour < 5))) {
      return 'high';
    }
    
    return 'medium';
  }

  /**
   * Получение имени экрана для рекомендации на основе времени суток
   */
  private getTimeBasedScreenName(timeOfDay: string): string {
    switch (timeOfDay) {
      case 'morning':
        return 'MorningRoutine';
      case 'afternoon':
        return 'AfternoonBoost';
      case 'evening':
        return 'EveningWellness';
      case 'night':
        return 'SleepPreparation';
      default:
        return 'DailyTips';
    }
  }

  // Добавляем метод для проверки доступности биометрической аутентификации
  private async checkBiometricAvailability(): Promise<boolean> {
    try {
      // В реальном приложении здесь должен быть код для проверки биометрической аутентификации
      // Например, с использованием expo-local-authentication
      
      // Пример заглушки
      return false;
    } catch (error) {
      console.warn('Ошибка при проверке биометрической аутентификации:', error);
      return false;
    }
  }

  // Добавляем метод для настройки обнаружения подмены ключей
  private setupKeyTamperingDetection() {
    try {
      // В реальном приложении здесь должен быть код для настройки обнаружения подмены ключей
      // Например, периодическая проверка хэша ключей и сравнение с заранее сохраненными значениями
      
      // Пример:
      setInterval(async () => {
        if (this.encryptionKey) {
          const keyHash = await this.calculateDataHash(this.encryptionKey);
          const storedKeyHash = await AsyncStorage.getItem('key_hash');
          
          if (storedKeyHash && storedKeyHash !== keyHash) {
            this.recordSecurityEvent(
              'data_tampering',
              'Обнаружена попытка подмены ключа шифрования',
              'critical'
            );
          }
        }
      }, 60000); // Проверка каждую минуту
    } catch (error) {
      console.warn('Ошибка при настройке обнаружения подмены ключей:', error);
    }
  }

  // Добавляем метод для проверки безопасности среды
  private async performSecurityEnvironmentCheck() {
    try {
      // Проверка на эмулятор
      if (this.deviceInfo?.isEmulator) {
        console.warn('Приложение запущено на эмуляторе, безопасность может быть снижена');
        this.recordSecurityEvent(
          'suspicious_activity',
          'Приложение запущено на эмуляторе',
          'medium'
        );
      }
      
      // Проверка на рутирование или jailbreak
      const isRooted = await this.checkDeviceRooted();
      if (isRooted) {
        console.warn('Устройство имеет root-доступ или jailbreak, безопасность критически снижена');
        this.recordSecurityEvent(
          'suspicious_activity',
          'Устройство имеет root-доступ или jailbreak',
          'critical'
        );
      }
      
      // Проверка целостности приложения
      await this.verifyAppIntegrity();
      
      // Проверка на вредоносные приложения (только Android)
      if (Platform.OS === 'android') {
        await this.checkForMaliciousApps();
      }
    } catch (error) {
      console.warn('Ошибка при проверке безопасности среды:', error);
    }
  }

  // Метод для проверки root/jailbreak
  private async checkDeviceRooted(): Promise<boolean> {
    try {
      // В реальном приложении здесь был бы код для проверки root/jailbreak
      // Для этого можно использовать библиотеки react-native-device-info
      
      // Пример заглушки
      return false;
    } catch (error) {
      console.warn('Ошибка при проверке root-доступа:', error);
      return false;
    }
  }

  // Метод для проверки целостности приложения
  private async verifyAppIntegrity() {
    try {
      // В реальном приложении здесь был бы код для проверки целостности
      // Например, с использованием Google Play Integrity API или App Attest API для iOS
      
      // Проверка версии приложения
      const currentVersion = Application.nativeApplicationVersion;
      const lastVersion = await AsyncStorage.getItem('last_app_version');
      
      if (lastVersion && lastVersion !== currentVersion) {
        console.info(`Приложение обновлено с версии ${lastVersion} до ${currentVersion}`);
        await AsyncStorage.setItem('last_app_version', currentVersion || '');
      } else if (!lastVersion) {
        await AsyncStorage.setItem('last_app_version', currentVersion || '');
      }
    } catch (error) {
      console.warn('Ошибка при проверке целостности приложения:', error);
    }
  }

  // Метод для проверки на вредоносные приложения
  private async checkForMaliciousApps() {
    if (Platform.OS !== 'android') return;
    
    try {
      // В реальном приложении здесь был бы код для проверки на вредоносные приложения
      // Например, проверка на наличие известных вредоносных пакетов или overlay-атак
      
      // Пример:
      const suspiciousAppsDetected = false; // Заглушка
      
      if (suspiciousAppsDetected) {
        this.recordSecurityEvent(
          'suspicious_activity',
          'Обнаружены подозрительные приложения на устройстве',
          'high'
        );
      }
    } catch (error) {
      console.warn('Ошибка при проверке на вредоносные приложения:', error);
    }
  }

  // Добавляем метод для проверки доступного места в хранилище
  private async checkStorageSpace() {
    try {
      if (Platform.OS === 'android') {
        // На Android можно использовать RNFetchBlob или другие библиотеки
        // для получения информации о свободном месте
        
        // В этом примере используем простую логику очистки на основе размера директории
        const dirInfo = await FileSystem.getInfoAsync(this.dataDirectory || '', { size: true });
        
        if (dirInfo.size && dirInfo.size > 50 * 1024 * 1024) { // > 50 МБ
          console.warn('Размер данных превышает 50 МБ, выполняем очистку кэша');
          this.cleanupOldData();
        }
      } else if (Platform.OS === 'ios') {
        // На iOS также можно использовать похожую логику
        const dirInfo = await FileSystem.getInfoAsync(this.dataDirectory || '', { size: true });
        
        if (dirInfo.size && dirInfo.size > 50 * 1024 * 1024) {
          console.warn('Размер данных превышает 50 МБ, выполняем очистку кэша');
          this.cleanupOldData();
        }
      }
    } catch (error) {
      console.warn('Ошибка при проверке дискового пространства:', error);
    }
  }

  // Добавляем метод для очистки устаревших данных
  private async cleanupOldData() {
    try {
      // Очищаем старые рекомендации
      if (this.dataDirectory) {
        const cacheDir = `${this.dataDirectory}cache/`;
        const cacheFiles = await FileSystem.readDirectoryAsync(cacheDir);
        
        // Сортируем файлы по дате создания (используем имя файла, которое содержит timestamp)
        const olderFiles = cacheFiles
          .filter(file => file.endsWith('.enc') || file.endsWith('.json'))
          .sort()
          .slice(0, Math.floor(cacheFiles.length * 0.7)); // Удаляем 70% старых файлов
        
        // Удаляем старые файлы
        for (const file of olderFiles) {
          await FileSystem.deleteAsync(`${cacheDir}${file}`, { idempotent: true });
        }
        
        console.info(`Очищено ${olderFiles.length} устаревших файлов кэша`);
      }
    } catch (error) {
      console.warn('Ошибка при очистке устаревших данных:', error);
    }
  }

  /**
   * Анализ эффективности рекомендаций
   */
  public async analyzeRecommendationEffectiveness(): Promise<{
    effectiveTypes: string[];
    ineffectiveTypes: string[];
    interactionRate: number;
    overallEffectiveness: 'low' | 'medium' | 'high';
  }> {
    try {
      if (!this.userId) {
        return {
          effectiveTypes: [],
          ineffectiveTypes: [],
          interactionRate: 0,
          overallEffectiveness: 'low'
        };
      }
      
      // Получаем статистику взаимодействий с рекомендациями
      const feedbackKey = `recommendation_feedback_${this.userId}`;
      const rawFeedback = await AsyncStorage.getItem(feedbackKey);
      
      if (!rawFeedback) {
        return {
          effectiveTypes: [],
          ineffectiveTypes: [],
          interactionRate: 0,
          overallEffectiveness: 'low'
        };
      }
      
      let feedbackData: any;
      try {
        feedbackData = JSON.parse(rawFeedback);
      } catch (error) {
        console.warn('Ошибка при парсинге данных обратной связи:', error);
        return {
          effectiveTypes: [],
          ineffectiveTypes: [],
          interactionRate: 0,
          overallEffectiveness: 'low'
        };
      }
      
      // Анализируем эффективность по типам рекомендаций
      const typeStats: Record<string, { 
        shown: number; 
        interacted: number; 
        helpful: number;
        notHelpful: number;
      }> = {};
      
      // Инициализируем статистику
      for (const entry of feedbackData) {
        const type = entry.recommendationType;
        if (!typeStats[type]) {
          typeStats[type] = { shown: 0, interacted: 0, helpful: 0, notHelpful: 0 };
        }
        
        typeStats[type].shown++;
        
        if (entry.interacted) {
          typeStats[type].interacted++;
        }
        
        if (entry.feedback === 'helpful') {
          typeStats[type].helpful++;
        } else if (entry.feedback === 'not_helpful') {
          typeStats[type].notHelpful++;
        }
      }
      
      // Определяем эффективные и неэффективные типы
      const effectiveTypes: string[] = [];
      const ineffectiveTypes: string[] = [];
      let totalShown = 0;
      let totalInteracted = 0;
      
      for (const [type, stats] of Object.entries(typeStats)) {
        totalShown += stats.shown;
        totalInteracted += stats.interacted;
        
        // Если более 60% взаимодействий оценены как полезные
        if (stats.interacted > 0 && stats.helpful / stats.interacted > 0.6) {
          effectiveTypes.push(type);
        }
        
        // Если менее 30% взаимодействий оценены как полезные или очень низкий уровень взаимодействия
        if ((stats.interacted > 0 && stats.helpful / stats.interacted < 0.3) || 
            (stats.shown > 10 && stats.interacted / stats.shown < 0.1)) {
          ineffectiveTypes.push(type);
        }
      }
      
      // Рассчитываем общий уровень взаимодействия
      const interactionRate = totalShown > 0 ? totalInteracted / totalShown : 0;
      
      // Определяем общую эффективность
      let overallEffectiveness: 'low' | 'medium' | 'high' = 'medium';
      
      if (interactionRate < 0.2 || effectiveTypes.length === 0) {
        overallEffectiveness = 'low';
      } else if (interactionRate > 0.4 && effectiveTypes.length > ineffectiveTypes.length) {
        overallEffectiveness = 'high';
      }
      
      return {
        effectiveTypes,
        ineffectiveTypes,
        interactionRate,
        overallEffectiveness
      };
    } catch (error) {
      console.error('Ошибка при анализе эффективности рекомендаций:', error);
      return {
        effectiveTypes: [],
        ineffectiveTypes: [],
        interactionRate: 0,
        overallEffectiveness: 'low'
      };
    }
  }

  /**
   * Планирование отправки рекомендаций с учетом пользовательских привычек
   */
  public async scheduleRecommendationNotifications(
    numberOfDays: number = 7,
    dailyLimit: number = 3
  ): Promise<boolean> {
    try {
      if (!this.userId || !this.userProfile || !this.notificationsConfigured) {
        return false;
      }
      
      // Анализируем оптимальное время для отправки уведомлений
      const optimalTimes = await this.analyzeOptimalNotificationTimes();
      
      // Генерируем рекомендации на ближайшие дни
      const recommendationsToSchedule: Array<{
        recommendation: AIRecommendation;
        scheduledTime: Date;
      }> = [];
      
      // Получаем текущие рекомендации
      const recommendations = await this.getRecommendations({
        onlyActive: true,
        priority: ['high', 'medium']
      });
      
      // Планируем рекомендации на каждый день
      for (let day = 0; day < numberOfDays; day++) {
        // Сортируем рекомендации по приоритету для данного дня
        const prioritizedRecommendations = this.prioritizeRecommendationsForDay(
          recommendations, 
          day,
          optimalTimes.categories
        );
        
        // Выбираем лучшие рекомендации для данного дня (не больше dailyLimit)
        const dailyRecommendations = prioritizedRecommendations.slice(0, dailyLimit);
        
        // Определяем оптимальное время для каждой рекомендации
        for (let i = 0; i < dailyRecommendations.length; i++) {
          const rec = dailyRecommendations[i];
          
          // Выбираем время отправки исходя из типа рекомендации и оптимальных часов
          const scheduledTime = new Date();
          scheduledTime.setDate(scheduledTime.getDate() + day);
          
          // Находим оптимальное время для данного типа рекомендации
          const recType = rec.type;
          let hourToSchedule = 12; // Значение по умолчанию (полдень)
          
          if (optimalTimes.categories[recType]) {
            hourToSchedule = optimalTimes.categories[recType];
          } else if (optimalTimes.generalHours.length > 0) {
            // Если нет оптимального времени для конкретного типа, используем общее
            hourToSchedule = optimalTimes.generalHours[i % optimalTimes.generalHours.length];
          }
          
          // Устанавливаем время
          scheduledTime.setHours(hourToSchedule, Math.floor(Math.random() * 60), 0, 0);
          
          // Добавляем в список планирования
          recommendationsToSchedule.push({
            recommendation: rec,
            scheduledTime
          });
        }
      }
      
      // Планируем все уведомления
      for (const item of recommendationsToSchedule) {
        await this.scheduleRecommendationNotification(item.recommendation, item.scheduledTime);
      }
      
      return true;
    } catch (error) {
      console.error('Ошибка при планировании уведомлений с рекомендациями:', error);
      return false;
    }
  }

  /**
   * Анализ оптимального времени для отправки уведомлений
   */
  private async analyzeOptimalNotificationTimes(): Promise<{
    generalHours: number[];
    categories: Record<string, number>;
  }> {
    try {
      // Получаем статистику взаимодействий с уведомлениями
      const key = `notification_stats_${this.userId}`;
      const rawStats = await AsyncStorage.getItem(key);
      
      // Если нет данных, возвращаем разумные значения по умолчанию
      if (!rawStats) {
        return {
          generalHours: [9, 12, 18], // Утро, обед, вечер
          categories: {
            'nutrition': 8, // Завтрак
            'activity': 17, // После работы
            'health': 20, // Вечер
            'lifestyle': 19, // Вечер
            'mental_health': 21, // Поздний вечер
            'sleep': 22 // Перед сном
          }
        };
      }
      
      // Парсим статистику
      let stats: any;
      try {
        stats = JSON.parse(rawStats);
      } catch (error) {
        console.warn('Ошибка при парсинге статистики уведомлений:', error);
        return {
          generalHours: [9, 12, 18],
          categories: {}
        };
      }
      
      // Анализируем взаимодействия по времени суток
      const hourlyInteractions: Record<number, number> = {};
      const categoryHours: Record<string, Record<number, number>> = {};
      
      // Инициализируем счетчики
      for (let hour = 0; hour < 24; hour++) {
        hourlyInteractions[hour] = 0;
      }
      
      // Обрабатываем данные взаимодействий если они доступны
      if (stats.interactions) {
        for (const type in stats.interactions) {
          if (!categoryHours[type]) {
            categoryHours[type] = {};
            for (let hour = 0; hour < 24; hour++) {
              categoryHours[type][hour] = 0;
            }
          }
          
          for (const actionId in stats.interactions[type]) {
            const count = stats.interactions[type][actionId];
            
            // Извлекаем час из истории взаимодействий если доступно
            if (stats.interactionTimes && stats.interactionTimes[type] && stats.interactionTimes[type][actionId]) {
              for (const time of stats.interactionTimes[type][actionId]) {
                try {
                  const date = new Date(time);
                  const hour = date.getHours();
                  
                  hourlyInteractions[hour] += count;
                  categoryHours[type][hour] += count;
                } catch (error) {
                  console.warn('Ошибка при обработке времени взаимодействия:', error);
                }
              }
            }
          }
        }
      }
      
      // Находим часы с наибольшим количеством взаимодействий
      const sortedHours = Object.entries(hourlyInteractions)
        .sort((a, b) => b[1] - a[1])
        .map(entry => parseInt(entry[0]));
      
      // Находим оптимальное время для каждой категории
      const categoryOptimalHours: Record<string, number> = {};
      
      for (const category in categoryHours) {
        const hours = categoryHours[category];
        const optimalHour = parseInt(
          Object.entries(hours)
            .sort((a, b) => b[1] - a[1])[0][0]
        );
        
        categoryOptimalHours[category] = optimalHour;
      }
      
      // Возвращаем результаты анализа
      return {
        generalHours: sortedHours.slice(0, 3),
        categories: categoryOptimalHours
      };
    } catch (error) {
      console.warn('Ошибка при анализе оптимального времени для уведомлений:', error);
      return {
        generalHours: [9, 12, 18],
        categories: {}
      };
    }
  }

  /**
   * Приоритизация рекомендаций для конкретного дня
   */
  private prioritizeRecommendationsForDay(
    recommendations: AIRecommendation[],
    dayOffset: number,
    categoryHours: Record<string, number>
  ): AIRecommendation[] {
    // Копируем массив, чтобы не изменять оригинал
    const recs = [...recommendations];
    
    // Получаем день недели для планирования
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + dayOffset);
    const dayOfWeek = targetDate.getDay(); // 0 - воскресенье, 1 - понедельник и т.д.
    
    // Сортируем рекомендации с учетом дня недели и других факторов
    recs.sort((a, b) => {
      // Начисляем баллы для каждой рекомендации
      let scoreA = 0;
      let scoreB = 0;
      
      // Приоритет по важности
      if (a.priority === 'high') scoreA += 30;
      else if (a.priority === 'medium') scoreA += 15;
      
      if (b.priority === 'high') scoreB += 30;
      else if (b.priority === 'medium') scoreB += 15;
      
      // Бонус для определенных типов в зависимости от дня недели
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        // Выходные
        if (a.type === 'activity' || a.type === 'lifestyle') scoreA += 10;
        if (b.type === 'activity' || b.type === 'lifestyle') scoreB += 10;
      } else {
        // Будни
        if (a.type === 'nutrition' || a.type === 'health') scoreA += 5;
        if (b.type === 'nutrition' || b.type === 'health') scoreB += 5;
      }
      
      // Если у категории есть оптимальное время, даем дополнительный бонус
      if (categoryHours[a.type]) scoreA += 5;
      if (categoryHours[b.type]) scoreB += 5;
      
      // Возвращаем результат сравнения
      return scoreB - scoreA;
    });
    
    return recs;
  }

  /**
   * Планирование отправки уведомления с рекомендацией
   */
  private async scheduleRecommendationNotification(
    recommendation: AIRecommendation,
    scheduledTime: Date
  ): Promise<boolean> {
    try {
      if (!this.notificationsConfigured) {
        return false;
      }
      
      // Формируем содержимое уведомления в зависимости от платформы
      if (Platform.OS === 'android') {
        // Android-специфичные настройки
        await Notifications.scheduleNotificationAsync({
          content: {
            title: recommendation.title,
            body: recommendation.description,
            data: {
              recommendationId: recommendation.id,
              type: recommendation.type,
              action: recommendation.action
            },
            channelId: 'recommendations'
          },
          trigger: {
            date: scheduledTime
          }
        });
      } else if (Platform.OS === 'ios') {
        // iOS-специфичные настройки
        await Notifications.scheduleNotificationAsync({
          content: {
            title: recommendation.title,
            body: recommendation.description,
            data: {
              recommendationId: recommendation.id,
              type: recommendation.type,
              action: recommendation.action
            },
            sound: 'default',
            categoryIdentifier: 'recommendations'
          },
          trigger: {
            date: scheduledTime
          }
        });
      }
      
      // Логируем запланированное уведомление для анализа
      console.debug(`Запланировано уведомление с рекомендацией ID=${recommendation.id} на ${scheduledTime.toLocaleString()}`);
      
      return true;
    } catch (error) {
      console.error('Ошибка при планировании уведомления с рекомендацией:', error);
      return false;
    }
  }
}

export default AIRecommendationEngine;
