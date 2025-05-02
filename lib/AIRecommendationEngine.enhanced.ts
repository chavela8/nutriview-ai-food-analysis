/**
 * Обновленный класс AIRecommendationEngine со всеми улучшениями
 * Этот файл демонстрирует структуру класса после интеграции всех улучшений.
 */

// Импортируем типы и мок-модули для решения проблем с зависимостями
import { Platform, Dimensions, StatusBar, NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

// Импортируем мок-модули вместо реальных (чтобы избежать ошибок)
import { Crypto, NetInfo, Device, Constants } from './mockModules';
// Импортируем модуль уведомлений с другим именем, чтобы избежать конфликта
import { Notifications as NotificationsModule } from './mockModules';
import { Build } from './mockModules';

// Создаем объект Notifications на основе типа для обратной совместимости
const Notifications = NotificationsModule;

// Импорт модулей с дополнительной функциональностью
import { 
  recordSecurityEvent, 
  sendSecurityNotification, 
  saveSecurityEventToFile, 
  getSecurityEvents, 
  loadSecurityEventsFromFiles 
} from './SecurityMethods';

import { 
  analyzeRecommendationEffectiveness, 
  generateSuggestedImprovements, 
  recordRecommendationInteraction,
  analyzeOptimalNotificationTimes
} from './EffectivenessAnalysis';

// Импорт адаптера безопасности для альтернативного подхода
// import { SecurityManager } from './SecurityMethodsAdapter';

// Импорт типов из нового файла типов
import { 
  AIRecommendation, 
  AIRecommendationOptions, 
  AIRecommendationType,
  DeviceInfo,
  SecurityEvent,
  RecommendationInteraction,
  NetInfoState,
  EffectivenessAnalysisResult
} from '../types/AppTypes';

/**
 * AIRecommendationEngine - движок для генерации персонализированных рекомендаций
 * на основе данных о здоровье пользователя с использованием ИИ.
 */
export class AIRecommendationEngine {
  private userId: string | null = null;
  private isInitialized: boolean = false;
  private deviceInfo: DeviceInfo | null = null;
  private networkStatus: NetInfoState | null = null;
  private securityKey: string | null = null;
  private directoryUri: string | null = null;
  private networkQueue: Array<() => Promise<void>> = [];
  private networkUnsubscribe: (() => void) | null = null;
  private notificationsConfigured: boolean = false;
  private notificationSubscriptions: {
    foreground: { remove: () => void } | null;
    response: { remove: () => void } | null;
  } = {
    foreground: null,
    response: null
  };
  private securityEvents: SecurityEvent[] = [];
  private interactionCache: Map<string, RecommendationInteraction[]> = new Map();
  
  // Для альтернативного подхода с SecurityManager
  // private securityManager: SecurityManager;

  /**
   * Создает экземпляр AIRecommendationEngine
   */
  constructor() {
    // Для альтернативного подхода с SecurityManager
    /*
    this.securityManager = new SecurityManager(
      () => this.getDeviceInfo(),
      () => this.initializeDirectory(),
      (eventType, data) => this.sendAnalyticsEvent(eventType, data),
      () => this.configureNotifications(),
      () => this.networkStatus
    );
    */
    
    this.initializeEngine();
  }

  /**
   * Установка ID пользователя и инициализация движка
   */
  public async setUserId(userId: string): Promise<boolean> {
    if (!userId || userId.trim() === '') {
      console.error('Недопустимый ID пользователя');
      return false;
    }

    this.userId = userId;
    
    try {
      await this.recordSecurityEvent(
        'user_management',
        `Установлен ID пользователя: ${userId.substring(0, 3)}...`,
        'low'
      );
      return true;
    } catch (error) {
      console.error('Ошибка при установке ID пользователя:', error);
      return false;
    }
  }

  /**
   * Инициализация движка AI
   */
  private async initializeEngine() {
    try {
      await this.initializeDirectory();
      await this.initializeSecurityKeys();
      this.setupNetworkListener();
      await this.getDeviceInfo();
      await this.configureNotifications();
      await this.loadSecurityEventsFromFiles(7); // Загрузка событий за последние 7 дней
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
   * Генерация рекомендаций для пользователя
   */
  public async generateRecommendations(
    options: AIRecommendationOptions = {}
  ): Promise<AIRecommendation[]> {
    if (!this.userId || !this.isInitialized) {
      console.warn('AIRecommendationEngine не готов для генерации рекомендаций');
      return [];
    }

    try {
      // Загрузка данных о здоровье пользователя
      const healthData = await this.getUserHealthData();
      
      // Использование алгоритмов машинного обучения для генерации рекомендаций
      const recommendations = await this.processHealthDataWithML(healthData, options);
      
      // Фильтрация и сортировка рекомендаций
      const filteredRecommendations = this.filterAndSortRecommendations(
        recommendations,
        options
      );
      
      // Сохранение рекомендаций для последующего анализа
      await this.saveRecommendationsToStorage(filteredRecommendations);
      
      return filteredRecommendations;
    } catch (error) {
      console.error('Ошибка при генерации рекомендаций:', error);
      
      // Запись события безопасности при ошибке
      await this.recordSecurityEvent(
        'data_tampering',
        `Ошибка при генерации рекомендаций: ${error.message}`,
        'medium'
      );
      
      // Возвращаем пустой массив в случае ошибки
      return [];
    }
  }

  /**
   * Планирование уведомлений с рекомендациями
   */
  public async scheduleRecommendationNotifications(
    numberOfDays: number = 7,
    dailyLimit: number = 3
  ): Promise<boolean> {
    try {
      if (!this.userId || !this.isInitialized) {
        console.warn('AIRecommendationEngine не готов для планирования уведомлений');
        return false;
      }
      
      // Анализируем оптимальное время для отправки уведомлений
      const optimalTimes = await this.analyzeOptimalNotificationTimes();
      const { generalHours, categories } = optimalTimes;
      
      // Получаем активные рекомендации
      const recommendations = await this.getRecommendations({ onlyActive: true });
      
      if (recommendations.length === 0) {
        console.debug('Нет активных рекомендаций для планирования уведомлений');
        return false;
      }
      
      // Отменяем все существующие уведомления
      await Notifications.cancelAllScheduledNotificationsAsync();
      
      // Планируем уведомления для каждого дня
      const now = new Date();
      let scheduledCount = 0;
      
      for (let day = 0; day < numberOfDays; day++) {
        // Выбираем рекомендации для этого дня
        const dayRecommendations = this.prioritizeRecommendationsForDay(
          recommendations,
          day,
          categories
        );
        
        // Ограничиваем количество уведомлений в день
        const dayRecsCount = Math.min(dayRecommendations.length, dailyLimit);
        
        for (let i = 0; i < dayRecsCount; i++) {
          const recommendation = dayRecommendations[i];
          
          // Выбираем время для уведомления
          // Используем категорию-специфичное время или общее время
          let hourToUse = generalHours[i % generalHours.length];
          
          if (categories[recommendation.type]) {
            hourToUse = categories[recommendation.type];
          }
          
          // Создаем время для уведомления
          const scheduledTime = new Date(now);
          scheduledTime.setDate(now.getDate() + day);
          scheduledTime.setHours(hourToUse, Math.floor(Math.random() * 59), 0);
          
          // Если время в прошлом, переносим на следующий день
          if (scheduledTime <= new Date()) {
            scheduledTime.setDate(scheduledTime.getDate() + 1);
          }
          
          // Планируем уведомление
          const scheduled = await this.scheduleRecommendationNotification(
            recommendation,
            scheduledTime
          );
          
          if (scheduled) {
            scheduledCount++;
          }
        }
      }
      
      console.log(`Запланировано ${scheduledCount} уведомлений с рекомендациями на ${numberOfDays} дней`);
      return scheduledCount > 0;
    } catch (error) {
      console.error('Ошибка при планировании уведомлений:', error);
      return false;
    }
  }

  /**
   * Настройка уведомлений для разных платформ
   */
  private configureNotifications(): void {
    try {
      // Настройка уведомлений в зависимости от платформы
      if (Platform.OS === 'ios') {
        this.configureiOSNotifications().catch(err => {
          console.error('Ошибка при настройке iOS уведомлений:', err instanceof Error ? err.message : String(err));
        });
      } else if (Platform.OS === 'android') {
        this.configureAndroidNotifications().catch(err => {
          console.error('Ошибка при настройке Android уведомлений:', err instanceof Error ? err.message : String(err));
        });
      }
      
      // Общая настройка обработчиков уведомлений
      NotificationsModule.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });
      
      // Настройка слушателей уведомлений
      this.setupNotificationListeners();
      
      this.notificationsConfigured = true;
      console.log('Уведомления успешно настроены');
    } catch (error) {
      console.error('Ошибка при настройке уведомлений:', error instanceof Error ? error.message : String(error));
      this.notificationsConfigured = false;
    }
  }

  /**
   * Настройка уведомлений для iOS
   */
  private async configureiOSNotifications(): Promise<void> {
    // Проверяем, что платформа - iOS
    if (Platform.OS !== 'ios') return;
    
    try {
      // Запрашиваем разрешения на уведомления
      const { status: existingStatus } = await NotificationsModule.getPermissionsAsync();
      
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await NotificationsModule.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
            allowAnnouncements: true,
          },
        });
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.warn('Разрешения на уведомления не получены!');
        return;
      }
      
      // Настраиваем категории уведомлений для iOS
      await NotificationsModule.setNotificationCategoryAsync('recommendations', [
        {
          identifier: 'view',
          buttonTitle: 'Посмотреть',
          options: {
            isDestructive: false,
            isAuthenticationRequired: false,
            opensAppToForeground: true,
          },
        },
        {
          identifier: 'dismiss',
          buttonTitle: 'Скрыть',
          options: {
            isDestructive: true,
            isAuthenticationRequired: false,
            opensAppToForeground: false,
          },
        },
      ]);
      
      await NotificationsModule.setNotificationCategoryAsync('security', [
        {
          identifier: 'details',
          buttonTitle: 'Подробнее',
          options: {
            isDestructive: false,
            isAuthenticationRequired: false,
            opensAppToForeground: true,
          },
        },
      ]);
      
      // Получаем и сохраняем токен для Push-уведомлений
      try {
        const token = await NotificationsModule.getExpoPushTokenAsync();
        this.savePushToken(token);
      } catch (tokenError) {
        console.warn('Не удалось получить Push токен:', tokenError instanceof Error ? tokenError.message : String(tokenError));
      }
      
      console.log('iOS уведомления настроены успешно');
    } catch (error) {
      console.error('Ошибка при настройке iOS уведомлений:', error instanceof Error ? error.message : String(error));
      throw error; // Пробрасываем ошибку для обработки в вызывающем методе
    }
  }

  /**
   * Настройка уведомлений для Android
   */
  private async configureAndroidNotifications(): Promise<void> {
    // Проверяем, что платформа - Android
    if (Platform.OS !== 'android') return;
    
    try {
      // Настраиваем группы уведомлений
      await this.setupAndroidNotificationGroups();
      
      // Определяем константы важности и видимости
      const importance = {
        MIN: NotificationsModule.AndroidImportance.MIN,
        LOW: NotificationsModule.AndroidImportance.LOW,
        DEFAULT: NotificationsModule.AndroidImportance.DEFAULT,
        HIGH: NotificationsModule.AndroidImportance.HIGH
      };
      
      const visibility = {
        PRIVATE: NotificationsModule.AndroidNotificationVisibility.PRIVATE,
        PUBLIC: NotificationsModule.AndroidNotificationVisibility.PUBLIC,
        SECRET: NotificationsModule.AndroidNotificationVisibility.SECRET
      };
      
      // Создаем каналы уведомлений
      const channels = [
        {
          name: 'recommendations',
          displayName: 'Рекомендации',
          description: 'Уведомления с персонализированными рекомендациями',
          importance: importance.DEFAULT,
          lightColor: '#2196F3',
          lockscreenVisibility: visibility.PUBLIC,
          sound: true,
          vibrate: true,
          groupId: 'recommendations_group'
        },
        {
          name: 'security',
          displayName: 'Безопасность',
          description: 'Важные уведомления о безопасности',
          importance: importance.HIGH,
          lightColor: '#FF5722',
          lockscreenVisibility: visibility.PRIVATE,
          sound: true,
          vibrate: [0, 250, 250, 250],
          groupId: 'security_group'
        },
        {
          name: 'health_alerts',
          displayName: 'Оповещения о здоровье',
          description: 'Срочные оповещения о показателях здоровья',
          importance: importance.HIGH,
          lightColor: '#F44336',
          lockscreenVisibility: visibility.PRIVATE,
          sound: true,
          vibrate: [0, 500, 200, 500],
          groupId: 'health_group'
        },
        {
          name: 'reminders',
          displayName: 'Напоминания',
          description: 'Напоминания о приеме пищи и физической активности',
          importance: importance.DEFAULT,
          lightColor: '#4CAF50',
          lockscreenVisibility: visibility.PUBLIC,
          sound: true,
          vibrate: true,
          groupId: 'health_group'
        },
        {
          name: 'achievements',
          displayName: 'Достижения',
          description: 'Уведомления о ваших достижениях',
          importance: importance.LOW,
          lightColor: '#FFEB3B',
          lockscreenVisibility: visibility.PUBLIC,
          sound: true,
          vibrate: false,
          groupId: 'health_group'
        },
        {
          name: 'updates',
          displayName: 'Обновления',
          description: 'Системные обновления и новости',
          importance: importance.LOW,
          lightColor: '#9C27B0',
          lockscreenVisibility: visibility.PUBLIC,
          sound: false,
          vibrate: false,
          groupId: 'system_group'
        }
      ];
      
      // Создаем каждый канал
      for (const channel of channels) {
        try {
          await NotificationsModule.setNotificationChannelAsync(channel.name, {
            name: channel.displayName,
            description: channel.description,
            importance: channel.importance,
            lightColor: channel.lightColor,
            lockscreenVisibility: channel.lockscreenVisibility,
            sound: channel.sound,
            vibrationPattern: channel.vibrate === true ? undefined : channel.vibrate,
            enableVibrate: Boolean(channel.vibrate),
            groupId: channel.groupId
          });
        } catch (channelError) {
          console.warn(`Не удалось создать канал ${channel.name}:`, channelError instanceof Error ? channelError.message : String(channelError));
        }
      }
      
      // Получаем и сохраняем токен для Firebase Push-уведомлений
      try {
        const token = await NotificationsModule.getDevicePushTokenAsync();
        this.savePushToken(token);
      } catch (tokenError) {
        console.warn('Не удалось получить Firebase Push токен:', tokenError instanceof Error ? tokenError.message : String(tokenError));
      }
      
      console.log('Android уведомления настроены успешно');
    } catch (error) {
      console.error('Ошибка при настройке Android уведомлений:', error instanceof Error ? error.message : String(error));
      throw error; // Пробрасываем ошибку для обработки в вызывающем методе
    }
  }

  /**
   * Настройка групп уведомлений для Android
   */
  private async setupAndroidNotificationGroups(): Promise<void> {
    if (Platform.OS !== 'android') return;
    
    try {
      // Определяем группы уведомлений (только для Android 7.0+)
      const groups = [
        {
          identifier: 'recommendations_group',
          name: 'Рекомендации',
          description: 'Все рекомендации по питанию и здоровью'
        },
        {
          identifier: 'security_group',
          name: 'Безопасность',
          description: 'Уведомления о безопасности'
        },
        {
          identifier: 'health_group',
          name: 'Здоровье',
          description: 'Уведомления о здоровье'
        },
        {
          identifier: 'system_group',
          name: 'Система',
          description: 'Системные уведомления'
        }
      ];
      
      // Создаем функцию setNotificationChannelGroupAsync, если она отсутствует
      const setNotificationChannelGroupAsync = 
        NotificationsModule.setNotificationChannelGroupAsync || 
        (async (groupId: string, options: {name: string, description?: string}) => {
          console.log(`[MOCK] Создание группы каналов уведомлений "${groupId}":`, options);
          return true;
        });
      
      // Создаем каждую группу
      for (const group of groups) {
        try {
          await setNotificationChannelGroupAsync(
            group.identifier,
            {
              name: group.name,
              description: group.description
            }
          );
        } catch (err) {
          console.warn(`Не удалось создать группу ${group.name}:`, err instanceof Error ? err.message : String(err));
        }
      }
    } catch (error) {
      console.warn('Ошибка при настройке групп уведомлений для Android:', error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Настройка слушателей уведомлений
   */
  private setupNotificationListeners(): void {
    try {
      // Отписываемся от предыдущих подписок, если они существуют
      this.cleanupNotificationListeners();
      
      // Слушатель для уведомлений, полученных, когда приложение открыто
      this.notificationSubscriptions.foreground = NotificationsModule.addNotificationReceivedListener(
        notification => {
          try {
            console.log('Получено уведомление в фоне:', notification);
            
            // Логируем получение уведомления
            const notificationType = notification.request?.content?.data?.source || 'unknown';
            this.logNotificationReceived(notificationType);
            
            // Сохраняем уведомление в истории
            const notificationData = {
              id: notification.request.identifier,
              title: notification.request.content.title,
              body: notification.request.content.body,
              data: notification.request.content.data,
              date: new Date().toISOString(),
              read: false,
              responded: false
            };
            
            this.storeNotificationHistory(notificationData).catch(err => {
              console.warn('Ошибка при сохранении истории уведомлений:', err instanceof Error ? err.message : String(err));
            });
          } catch (listenerError) {
            console.error('Ошибка в слушателе уведомлений:', listenerError instanceof Error ? listenerError.message : String(listenerError));
          }
        }
      );
      
      // Слушатель для ответов на уведомления (клики по уведомлению)
      this.notificationSubscriptions.response = NotificationsModule.addNotificationResponseReceivedListener(
        response => {
          try {
            console.log('Получен ответ на уведомление:', response);
            
            const { notification, actionIdentifier } = response;
            const notificationType = notification.request?.content?.data?.source || 'unknown';
            
            // Обновляем историю уведомлений
            this.updateNotificationHistory(
              notification.request.identifier,
              { 
                read: true, 
                responded: true,
                responseAction: actionIdentifier,
                responseDate: new Date().toISOString()
              }
            ).catch(err => {
              console.warn('Ошибка при обновлении истории уведомлений:', err instanceof Error ? err.message : String(err));
            });
            
            // Логируем взаимодействие с уведомлением
            this.logNotificationInteraction(notificationType, actionIdentifier);
            
            // Обрабатываем действие уведомления
            this.handleNotificationAction(notification.request?.content?.data, actionIdentifier);
          } catch (listenerError) {
            console.error('Ошибка в слушателе ответов на уведомления:', listenerError instanceof Error ? listenerError.message : String(listenerError));
          }
        }
      );
      
      console.log('Слушатели уведомлений настроены');
    } catch (error) {
      console.error('Ошибка при настройке слушателей уведомлений:', error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Очистка слушателей уведомлений
   */
  private cleanupNotificationListeners(): void {
    try {
      // Отписываемся от слушателя уведомлений
      if (this.notificationSubscriptions.foreground) {
        NotificationsModule.removeNotificationSubscription(this.notificationSubscriptions.foreground);
        this.notificationSubscriptions.foreground = null;
      }
      
      // Отписываемся от слушателя ответов на уведомления
      if (this.notificationSubscriptions.response) {
        NotificationsModule.removeNotificationSubscription(this.notificationSubscriptions.response);
        this.notificationSubscriptions.response = null;
      }
    } catch (error) {
      console.error('Ошибка при очистке слушателей уведомлений:', error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Логирование получения уведомления
   */
  private logNotificationReceived(type: string): void {
    try {
      this.sendAnalyticsEvent('notification_received', {
        type,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.warn('Ошибка при логировании получения уведомления:', error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Логирование отправки уведомления
   */
  private logNotificationSent(type: string, subtype?: string): void {
    try {
      this.sendAnalyticsEvent('notification_sent', {
        type,
        subtype: subtype || 'general',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.warn('Ошибка при логировании отправки уведомления:', error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Логирование взаимодействия с уведомлением
   */
  private logNotificationInteraction(type: string, action: string): void {
    try {
      this.sendAnalyticsEvent('notification_interaction', {
        type,
        action,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.warn('Ошибка при логировании взаимодействия с уведомлением:', error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Обработка действия уведомления
   */
  private handleNotificationAction(data: any, actionIdentifier: string): void {
    try {
      // В реальном приложении: обработка различных действий
      console.log('Обработка действия уведомления:', { data, actionIdentifier });
      
      // Пример обработки действий для рекомендаций
      if (data?.source === 'recommendation') {
        if (actionIdentifier === 'view') {
          // Открыть экран с рекомендацией
          this.recordRecommendationInteraction(
            data.recommendationId || 'unknown',
            data.recommendationType || 'nutrition',
            'view'
          ).catch(err => {
            console.warn('Ошибка при записи взаимодействия с рекомендацией:', err instanceof Error ? err.message : String(err));
          });
        } else if (actionIdentifier === 'dismiss') {
          // Отклонить рекомендацию
          this.recordRecommendationInteraction(
            data.recommendationId || 'unknown',
            data.recommendationType || 'nutrition',
            'dismiss'
          ).catch(err => {
            console.warn('Ошибка при записи взаимодействия с рекомендацией:', err instanceof Error ? err.message : String(err));
          });
        }
      }
      
      // Пример обработки действий для событий безопасности
      if (data?.source === 'security') {
        if (actionIdentifier === 'details') {
          // Открыть экран с деталями события безопасности
          console.log('Открываем детали события безопасности');
        }
      }
    } catch (error) {
      console.error('Ошибка при обработке действия уведомления:', error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Сохранение уведомления в историю
   */
  private async storeNotificationHistory(notification: any): Promise<void> {
    try {
      const historyKey = 'NUTRIVIEW_NOTIFICATION_HISTORY';
      
      // Получаем существующую историю
      let history = [];
      const savedHistory = await AsyncStorage.getItem(historyKey);
      
      if (savedHistory) {
        history = JSON.parse(savedHistory);
      }
      
      // Добавляем новое уведомление
      history.push(notification);
      
      // Ограничиваем размер истории
      if (history.length > 100) {
        history = history.slice(-100);
      }
      
      // Сохраняем обновленную историю
      await AsyncStorage.setItem(historyKey, JSON.stringify(history));
    } catch (error) {
      console.warn('Ошибка при сохранении истории уведомлений:', error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Обновление информации о уведомлении в истории
   */
  private async updateNotificationHistory(id: string, update: any): Promise<void> {
    try {
      const historyKey = 'NUTRIVIEW_NOTIFICATION_HISTORY';
      
      // Получаем существующую историю
      let history = [];
      const savedHistory = await AsyncStorage.getItem(historyKey);
      
      if (savedHistory) {
        history = JSON.parse(savedHistory);
      }
      
      // Находим и обновляем уведомление
      const updatedHistory = history.map((item: any) => {
        if (item.id === id) {
          return { ...item, ...update };
        }
        return item;
      });
      
      // Сохраняем обновленную историю
      await AsyncStorage.setItem(historyKey, JSON.stringify(updatedHistory));
    } catch (error) {
      console.warn('Ошибка при обновлении истории уведомлений:', error instanceof Error ? error.message : String(error));
    }
  }

  // БАЗОВЫЕ ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
  
  /**
   * Инициализация каталога для хранения данных
   */
  private async initializeDirectory(): Promise<void> {
    try {
      // Базовая директория в зависимости от платформы
      let baseDir = FileSystem.documentDirectory;
      
      // Для iOS и Android существуют разные предпочтительные места для хранения данных
      if (Platform.OS === 'ios') {
        // На iOS используем документы приложения, которые включаются в бэкапы iCloud
        baseDir = FileSystem.documentDirectory;
      } else if (Platform.OS === 'android') {
        // На Android используем внутреннее хранилище, недоступное другим приложениям
        baseDir = FileSystem.cacheDirectory;
      }
      
      // Создаем основную директорию для AIRecommendationEngine
      const aiDirectory = `${baseDir}NutriView/AI/`;
      
      // Проверяем, существует ли директория
      const dirInfo = await FileSystem.getInfoAsync(aiDirectory);
      
      if (!dirInfo.exists) {
        // Создаем директорию, если она не существует
        await FileSystem.makeDirectoryAsync(aiDirectory, { intermediates: true });
      }
      
      // Создаем поддиректории для разных типов данных
      const subDirs = [
        'recommendations', 
        'security', 
        'analytics', 
        'cache',
        'interactions'
      ];
      
      // Создаем все поддиректории
      for (const dir of subDirs) {
        const fullPath = `${aiDirectory}${dir}/`;
        const subDirInfo = await FileSystem.getInfoAsync(fullPath);
        
        if (!subDirInfo.exists) {
          await FileSystem.makeDirectoryAsync(fullPath, { intermediates: true });
        }
      }
      
      // Сохраняем базовый путь для использования в других методах
      this.directoryUri = aiDirectory;
      
      // Создаем файл с информацией о инициализации
      const initInfoFile = `${aiDirectory}init_info.json`;
      const initInfo = {
        timestamp: new Date().toISOString(),
        appVersion: this.deviceInfo?.appVersion || 'unknown',
        platform: Platform.OS,
        osVersion: Platform.Version.toString(),
        userId: this.userId || 'not_set'
      };
      
      // Записываем информацию в файл
      await FileSystem.writeAsStringAsync(
        initInfoFile,
        JSON.stringify(initInfo, null, 2),
        { encoding: FileSystem.EncodingType.UTF8 }
      );
      
      console.log('Директория AI данных успешно инициализирована:', this.directoryUri);
      return;
    } catch (error) {
      console.error('Ошибка при инициализации директории:', error);
      throw new Error(`Не удалось инициализировать директорию: ${error.message}`);
    }
  }
  
  /**
   * Инициализация ключей безопасности
   */
  private async initializeSecurityKeys(): Promise<void> {
    try {
      // Попытка импортировать модули шифрования
      let secureStore;
      try {
        secureStore = require('expo-secure-store');
      } catch (err) {
        console.warn('Модуль expo-secure-store недоступен, будет использоваться AsyncStorage с шифрованием');
        secureStore = null;
      }
      
      // Проверяем наличие ключей в защищенном хранилище
      const securityKeyName = 'ai_recommendation_security_key';
      const dataKeyName = 'ai_recommendation_data_key';
      
      // Генерация и сохранение ключей
      if (secureStore && await secureStore.isAvailableAsync()) {
        // Получаем существующий ключ безопасности или генерируем новый
        let securityKey = await secureStore.getItemAsync(securityKeyName);
        
        if (!securityKey) {
          // Генерируем новый ключ безопасности
          securityKey = await this.generateSecureKey(32);
          await secureStore.setItemAsync(securityKeyName, securityKey);
          console.log('Сгенерирован новый ключ безопасности');
        }
        
        // Получаем существующий ключ данных или генерируем новый
        let dataKey = await secureStore.getItemAsync(dataKeyName);
        
        if (!dataKey) {
          // Генерируем новый ключ данных
          dataKey = await this.generateSecureKey(32);
          await secureStore.setItemAsync(dataKeyName, dataKey);
          console.log('Сгенерирован новый ключ данных');
        }
        
        // Сохраняем ключи в память для использования
        this.securityKey = securityKey;
      } else {
        // Используем AsyncStorage с дополнительным шифрованием для хранения ключей
        const encryptionKeyPrefix = 'AIEngine_';
        
        // Получаем идентификатор устройства для дополнительной безопасности
        const deviceId = await this.getUniqueDeviceId();
        
        // Получаем существующий ключ безопасности или генерируем новый
        let securityKey = await AsyncStorage.getItem(`${encryptionKeyPrefix}${securityKeyName}`);
        
        if (!securityKey) {
          // Генерируем новый ключ безопасности
          securityKey = await this.generateSecureKey(32);
          
          // Шифруем ключ с использованием идентификатора устройства
          const encryptedKey = await this.encryptWithDeviceId(securityKey, deviceId);
          
          // Сохраняем зашифрованный ключ
          await AsyncStorage.setItem(`${encryptionKeyPrefix}${securityKeyName}`, encryptedKey);
          console.log('Сгенерирован новый ключ безопасности (AsyncStorage)');
        } else {
          // Расшифровываем ключ
          securityKey = await this.decryptWithDeviceId(securityKey, deviceId);
        }
        
        // Сохраняем ключи в память для использования
        this.securityKey = securityKey;
      }
      
      console.log('Ключи безопасности успешно инициализированы');
    } catch (error) {
      console.error('Ошибка при инициализации ключей безопасности:', error);
      throw new Error(`Не удалось инициализировать ключи безопасности: ${error.message}`);
    }
  }
  
  /**
   * Генерация криптографически надежного ключа
   */
  private async generateSecureKey(length: number): Promise<string> {
    try {
      // Пытаемся использовать crypto для генерации ключа
      const randomBytes = await Crypto.getRandomBytesAsync(length);
      return Array.from(new Uint8Array(randomBytes))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    } catch (error) {
      console.warn('Ошибка при генерации ключа через Crypto, используем запасной метод:', error);
      
      // Запасной вариант (менее безопасный, но работает)
      let result = '';
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      const charactersLength = characters.length;
      
      for (let i = 0; i < length * 2; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
      }
      
      return result;
    }
  }
  
  /**
   * Получение уникального идентификатора устройства
   */
  private async getUniqueDeviceId(): Promise<string> {
    try {
      if (this.deviceInfo && this.deviceInfo.deviceId) {
        return this.deviceInfo.deviceId;
      }
      
      // Пытаемся получить идентификатор из устройства
      let deviceId: string | null = null;
      
      // Проверяем, сохранен ли идентификатор устройства
      deviceId = await AsyncStorage.getItem('NUTRIVIEW_DEVICE_ID');
      
      if (!deviceId) {
        // Генерируем новый идентификатор
        const randomBytes = await Crypto.getRandomBytesAsync(16);
        deviceId = Array.from(new Uint8Array(randomBytes))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
        
        // Сохраняем идентификатор
        await AsyncStorage.setItem('NUTRIVIEW_DEVICE_ID', deviceId);
      }
      
      return deviceId;
    } catch (error) {
      console.error('Ошибка при получении идентификатора устройства:', error);
      
      // Возвращаем временный идентификатор в случае ошибки
      return `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }
  }
  
  /**
   * Шифрование данных с использованием идентификатора устройства
   */
  private async encryptWithDeviceId(data: string, deviceId: string): Promise<string> {
    try {
      const key = await Crypto.digestStringAsync('SHA-256', deviceId);
      // Простое XOR шифрование (для демонстрации, не использовать в продакшн)
      const result = Array.from(data).map((char, index) => {
        const keyChar = key[index % key.length];
        return String.fromCharCode(char.charCodeAt(0) ^ keyChar.charCodeAt(0));
      }).join('');
      
      return Buffer.from(result).toString('base64');
    } catch (error) {
      console.error('Ошибка при шифровании с использованием deviceId:', error);
      // В случае ошибки возвращаем исходные данные
      return data;
    }
  }
  
  /**
   * Расшифровка данных с использованием идентификатора устройства
   */
  private async decryptWithDeviceId(encryptedData: string, deviceId: string): Promise<string> {
    try {
      const key = await Crypto.digestStringAsync('SHA-256', deviceId);
      const data = Buffer.from(encryptedData, 'base64').toString();
      
      // Простое XOR шифрование (для демонстрации, не использовать в продакшн)
      const result = Array.from(data).map((char, index) => {
        const keyChar = key[index % key.length];
        return String.fromCharCode(char.charCodeAt(0) ^ keyChar.charCodeAt(0));
      }).join('');
      
      return result;
    } catch (error) {
      console.error('Ошибка при расшифровке с использованием deviceId:', error);
      // В случае ошибки возвращаем исходные данные
      return encryptedData;
    }
  }
  
  /**
   * Настройка слушателя сетевого соединения
   */
  private setupNetworkListener(): void {
    try {
      // Отписываемся от предыдущего слушателя, если он существует
      this.cleanupNetworkListener();
      
      // Устанавливаем слушатель изменения состояния сети
      this.networkUnsubscribe = NetInfo.addEventListener(state => {
        try {
          const oldStatus = this.networkStatus;
          this.networkStatus = state;
          
          console.log('Изменение состояния сети:', {
            type: state.type,
            isConnected: state.isConnected,
            isInternetReachable: state.isInternetReachable
          });
          
          // Отправляем событие аналитики при изменении состояния сети
          if (oldStatus?.isConnected !== state.isConnected) {
            this.sendAnalyticsEvent('network_status_changed', {
              isConnected: state.isConnected,
              connectionType: state.type
            }).catch(error => {
              console.warn('Ошибка при отправке события изменения сети:', error instanceof Error ? error.message : String(error));
            });
          }
          
          // Обрабатываем очередь при восстановлении соединения
          if (!oldStatus?.isConnected && state.isConnected) {
            console.log('Соединение восстановлено. Обработка отложенных задач.');
            this.processNetworkQueue().catch(error => {
              console.error('Ошибка при обработке сетевой очереди:', error instanceof Error ? error.message : String(error));
            });
          }
        } catch (handlerError) {
          console.error('Ошибка в обработчике сетевого события:', handlerError instanceof Error ? handlerError.message : String(handlerError));
        }
      });
      
      // Получаем начальное состояние сети
      NetInfo.fetch().then(state => {
        this.networkStatus = state;
        console.log('Начальное состояние сети:', {
          type: state.type,
          isConnected: state.isConnected,
          isInternetReachable: state.isInternetReachable
        });
      }).catch(error => {
        console.warn('Ошибка при получении начального состояния сети:', error instanceof Error ? error.message : String(error));
      });
    } catch (error) {
      console.error('Ошибка при настройке слушателя сети:', error instanceof Error ? error.message : String(error));
    }
  }
  
  /**
   * Очистка слушателя сетевого соединения
   */
  private cleanupNetworkListener(): void {
    if (this.networkUnsubscribe) {
      try {
        this.networkUnsubscribe();
        this.networkUnsubscribe = null;
      } catch (error) {
        console.error('Ошибка при очистке слушателя сети:', error instanceof Error ? error.message : String(error));
      }
    }
  }
  
  /**
   * Обработка очереди сетевых задач
   */
  private async processNetworkQueue(): Promise<void> {
    if (this.networkQueue.length === 0) {
      console.log('Сетевая очередь пуста');
      return;
    }
    
    if (!this.networkStatus?.isConnected) {
      console.log('Нет подключения к сети. Обработка очереди отложена.');
      return;
    }
    
    console.log(`Обработка сетевой очереди (${this.networkQueue.length} задач)`);
    
    // Создаем копию очереди и очищаем основную очередь
    const tasksToProcess = [...this.networkQueue];
    this.networkQueue = [];
    
    // Обрабатываем каждую задачу
    let successCount = 0;
    let failCount = 0;
    
    for (const task of tasksToProcess) {
      try {
        await task();
        successCount++;
      } catch (error) {
        failCount++;
        // Возвращаем задачу в очередь при ошибке
        this.networkQueue.push(task);
        console.warn('Ошибка при выполнении задачи из очереди:', error instanceof Error ? error.message : String(error));
      }
    }
    
    console.log(`Обработка сетевой очереди завершена: ${successCount} успешно, ${failCount} с ошибками`);
  }
  
  /**
   * Добавление задачи в сетевую очередь
   */
  private addToNetworkQueue(task: () => Promise<void>): void {
    this.networkQueue.push(task);
    
    // Если есть соединение, пробуем обработать очередь сразу
    if (this.networkStatus?.isConnected) {
      this.processNetworkQueue().catch(error => {
        console.warn('Ошибка при обработке сетевой очереди:', error instanceof Error ? error.message : String(error));
      });
    } else {
      console.log('Задача добавлена в сетевую очередь. Ожидание подключения к сети.');
    }
  }
  
  /**
   * Получение информации об устройстве
   */
  private async getDeviceInfo(): Promise<DeviceInfo | null> {
    try {
      if (this.deviceInfo) {
        return this.deviceInfo;
      }
      
      // Получаем уникальный идентификатор устройства
      const deviceId = await this.getUniqueDeviceId();
      
      // Получаем информацию о платформе
      const osName = Platform.OS;
      const osVersion = Platform.Version.toString();
      
      // Получаем размеры экрана
      const { width, height, scale } = Dimensions.get('window');
      
      // Пытаемся получить информацию о версии приложения
      let appVersion = 'unknown';
      let appBuildNumber = 'unknown';
      let appName = 'NutriView AI';
      
      try {
        const Constants = require('expo-constants');
        if (Constants && Constants.default) {
          const { manifest } = Constants.default;
          if (manifest) {
            appVersion = manifest.version || 'unknown';
            appBuildNumber = Platform.OS === 'ios' 
              ? manifest.ios?.buildNumber || 'unknown'
              : manifest.android?.versionCode?.toString() || 'unknown';
            appName = manifest.name || 'NutriView AI';
          }
        }
      } catch (err) {
        console.warn('Ошибка при получении информации о приложении:', err);
      }
      
      // Проверяем, является ли устройство эмулятором
      let isEmulator = false;
      try {
        if (Platform.OS === 'android') {
          isEmulator = !!(
            (await Device.getDeviceTypeAsync()) === 'unknown' ||
            osVersion.includes('sdk') ||
            Build.FINGERPRINT.includes('generic') ||
            Build.MANUFACTURER.includes('Genymotion') ||
            Build.MODEL.includes('google_sdk') ||
            Build.MODEL.includes('Emulator') ||
            Build.MODEL.includes('Android SDK')
          );
        } else if (Platform.OS === 'ios') {
          isEmulator = !Device.isDevice;
        }
      } catch (err) {
        console.warn('Ошибка при определении статуса эмулятора:', err);
      }
      
      // Проверяем, является ли устройство планшетом
      let isTablet = false;
      try {
        if (Platform.OS === 'android') {
          isTablet = width / scale > 600;
        } else if (Platform.OS === 'ios') {
          isTablet = Platform.isPad;
        }
      } catch (err) {
        console.warn('Ошибка при определении типа устройства:', err);
      }
      
      // Проверяем наличие "notch" (выемки)
      let hasNotch = false;
      try {
        if (Platform.OS === 'ios') {
          hasNotch = !Platform.isPad && !Platform.isTVOS && (Dimensions.get('window').height >= 812 || Dimensions.get('window').width >= 812);
        } else if (Platform.OS === 'android') {
          // На Android сложнее определить наличие notch, используем приблизительный метод
          hasNotch = (StatusBar.currentHeight || 0) > 24;
        }
      } catch (err) {
        console.warn('Ошибка при определении наличия notch:', err);
      }
      
      // Определяем локаль и часовой пояс устройства
      let deviceLocale = 'unknown';
      let deviceCountry = 'unknown';
      let deviceTimeZone = 'unknown';
      
      try {
        const NativeModules = require('react-native').NativeModules;
        const locale = NativeModules?.SettingsManager?.settings?.AppleLocale || 
                      NativeModules?.SettingsManager?.settings?.AppleLanguages?.[0] || 
                      NativeModules?.I18nManager?.localeIdentifier || 
                      'unknown';
        
        deviceLocale = locale;
        
        if (locale.includes('_')) {
          deviceCountry = locale.split('_')[1];
        }
        
        deviceTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown';
      } catch (err) {
        console.warn('Ошибка при определении локали устройства:', err);
      }
      
      // Проверяем, имеет ли устройство root-доступ (для Android) или jailbreak (для iOS)
      let isRooted = false;
      try {
        isRooted = await Device.isRootedExperimentalAsync();
      } catch (err) {
        console.warn('Ошибка при определении root-статуса:', err);
      }
      
      // Определяем модель устройства
      let deviceBrand = 'unknown';
      let deviceModel = 'unknown';
      let deviceType = isTablet ? 'tablet' : 'phone';
      let deviceName = 'unknown';
      
      try {
        deviceBrand = Device.brand || 'unknown';
        deviceModel = Device.modelName || 'unknown';
        deviceName = Device.deviceName || 'unknown';
      } catch (err) {
        console.warn('Ошибка при получении информации о модели устройства:', err);
      }
      
      // Проверяем наличие аномальных настроек безопасности
      let hasAbnormalSettings = false;
      try {
        // Проверка для Android
        if (Platform.OS === 'android') {
          // Попытка обнаружить разработческие настройки
          const devSettingsEnabled = await this.checkDeveloperOptionsEnabled();
          // Проверка установки из неизвестных источников
          const unknownSourcesEnabled = await this.checkUnknownSourcesEnabled();
          
          hasAbnormalSettings = isRooted || devSettingsEnabled || unknownSourcesEnabled;
        } 
        // Проверка для iOS
        else if (Platform.OS === 'ios') {
          hasAbnormalSettings = isRooted;
        }
      } catch (err) {
        console.warn('Ошибка при проверке настроек безопасности:', err);
      }
      
      // Формируем и сохраняем информацию об устройстве
      this.deviceInfo = {
        deviceId,
        deviceName,
        deviceType,
        deviceBrand,
        deviceModel,
        osName,
        osVersion,
        appName,
        appVersion,
        appBuildNumber,
        isEmulator,
        isTablet,
        hasNotch,
        screenWidth: width,
        screenHeight: height,
        screenScale: scale,
        deviceLocale,
        deviceCountry,
        deviceTimeZone,
        isRooted,
        hasAbnormalSettings
      };
      
      return this.deviceInfo;
    } catch (error) {
      console.error('Ошибка при получении информации об устройстве:', error);
      return null;
    }
  }
  
  /**
   * Проверка включенных опций разработчика (для Android)
   */
  private async checkDeveloperOptionsEnabled(): Promise<boolean> {
    if (Platform.OS !== 'android') return false;
    
    try {
      const { NativeModules } = require('react-native');
      if (NativeModules.DevSettings && NativeModules.DevSettings.isDevModeEnabled) {
        return await NativeModules.DevSettings.isDevModeEnabled();
      }
      return false;
    } catch (error) {
      console.warn('Ошибка при проверке опций разработчика:', error);
      return false;
    }
  }
  
  /**
   * Проверка разрешения установки из неизвестных источников (для Android)
   */
  private async checkUnknownSourcesEnabled(): Promise<boolean> {
    if (Platform.OS !== 'android') return false;
    
    try {
      const { NativeModules } = require('react-native');
      if (NativeModules.SecuritySettings && NativeModules.SecuritySettings.isUnknownSourcesEnabled) {
        return await NativeModules.SecuritySettings.isUnknownSourcesEnabled();
      }
      return false;
    } catch (error) {
      console.warn('Ошибка при проверке неизвестных источников:', error);
      return false;
    }
  }
  
  /**
   * Получение данных о здоровье пользователя
   */
  private async getUserHealthData(): Promise<any> {
    // Реализация получения данных о здоровье
    return {};
  }
  
  /**
   * Обработка данных о здоровье с использованием ML
   */
  private async processHealthDataWithML(
    healthData: any,
    options: AIRecommendationOptions
  ): Promise<AIRecommendation[]> {
    // Реализация обработки данных
    return [];
  }
  
  /**
   * Фильтрация и сортировка рекомендаций
   */
  private filterAndSortRecommendations(
    recommendations: AIRecommendation[],
    options: AIRecommendationOptions
  ): AIRecommendation[] {
    // Реализация фильтрации и сортировки
    return [];
  }
  
  /**
   * Сохранение рекомендаций в хранилище
   */
  private async saveRecommendationsToStorage(
    recommendations: AIRecommendation[]
  ): Promise<void> {
    // Реализация сохранения рекомендаций
  }
  
  /**
   * Получение сохраненных рекомендаций
   */
  private async getRecommendations(
    options: { onlyActive?: boolean } = {}
  ): Promise<AIRecommendation[]> {
    // Реализация получения рекомендаций
    return [];
  }
  
  /**
   * Приоритизация рекомендаций для определенного дня
   */
  private prioritizeRecommendationsForDay(
    recommendations: AIRecommendation[],
    day: number,
    categories: Record<string, number>
  ): AIRecommendation[] {
    // Реализация приоритизации рекомендаций
    return [];
  }
  
  /**
   * Планирование уведомления для рекомендации
   */
  private async scheduleRecommendationNotification(
    recommendation: AIRecommendation,
    scheduledTime: Date
  ): Promise<boolean> {
    // Реализация планирования уведомления
    return false;
  }
  
  /**
   * Получение сохраненных событий безопасности
   */
  public getSecurityEvents(options?: { 
    type?: string, 
    startDate?: Date, 
    endDate?: Date,
    severity?: 'low' | 'medium' | 'high'
  }): Array<SecurityEvent> {
    try {
      // Если нет событий безопасности, возвращаем пустой массив
      if (!this.securityEvents || this.securityEvents.length === 0) {
        return [];
      }
      
      // Если нет опций фильтрации, возвращаем все события
      if (!options) {
        return [...this.securityEvents];
      }
      
      // Фильтруем события
      return this.securityEvents.filter(event => {
        // Фильтр по типу
        if (options.type && event.type !== options.type) {
          return false;
        }
        
        // Фильтр по серьезности
        if (options.severity && event.severity !== options.severity) {
          return false;
        }
        
        // Фильтр по дате начала
        if (options.startDate && new Date(event.timestamp) < options.startDate) {
          return false;
        }
        
        // Фильтр по дате окончания
        if (options.endDate && new Date(event.timestamp) > options.endDate) {
          return false;
        }
        
        // Прошло все фильтры
        return true;
      });
    } catch (error) {
      console.error('Ошибка при получении событий безопасности:', error);
      return [];
    }
  }

  /**
   * Записывает событие безопасности в журнал
   * @param eventType Тип события безопасности
   * @param details Подробности события
   * @param severity Уровень серьезности события
   */
  public recordSecurityEvent(eventType: string, details: any, severity: 'low' | 'medium' | 'high' = 'medium'): void {
    try {
      // Генерируем уникальный ID и метку времени для события
      const eventId = `sec_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      const timestamp = new Date().toISOString();
      
      // Базовая информация об устройстве
      const deviceBasicInfo = {
        deviceId: this.deviceInfo?.deviceId || 'unknown',
        platform: Platform.OS,
        osVersion: Platform.Version.toString(),
        appVersion: Constants.default.manifest.version,
        isEmulator: !(Device.isDevice),
        appBuildNumber: Platform.OS === 'ios' 
          ? Constants.default.platform.ios.buildNumber 
          : Constants.default.platform.android.versionCode.toString()
      };
      
      // Создаем объект события безопасности
      const securityEvent: SecurityEvent = {
        timestamp,
        type: eventType as any,  // Приведение типа, т.к. мы не можем гарантировать точное соответствие
        details: typeof details === 'string' ? details : JSON.stringify(details),
        deviceInfo: deviceBasicInfo,
        severity: severity === 'high' ? 'high' : severity === 'medium' ? 'medium' : 'low'
      };
      
      // Добавляем событие в массив
      this.securityEvents.push(securityEvent);
      
      // Журналируем события высокой серьезности
      if (severity === 'high') {
        console.error(`[SECURITY EVENT] ${eventType}: ${securityEvent.details}`);
        
        // Отправляем уведомление, если это событие требует внимания
        if (['data_tampering', 'unauthorized_access', 'suspicious_activity', 'brute_force'].includes(eventType)) {
          this.sendSecurityNotification(eventType, details).catch(err => {
            console.error('Ошибка при отправке уведомления безопасности:', err instanceof Error ? err.message : String(err));
          });
        }
        
        // Немедленно сохраняем событие в файл
        this.saveSecurityEventToFile().catch(err => {
          console.error('Ошибка при сохранении события безопасности:', err instanceof Error ? err.message : String(err));
        });
      } else {
        console.log(`[SECURITY EVENT] ${eventType}: ${securityEvent.details}`);
        
        // Периодически сохраняем события, чтобы не вызывать слишком часто
        if (this.securityEvents.length >= 10) {
          this.saveSecurityEventToFile().catch(err => {
            console.error('Ошибка при сохранении событий безопасности:', err instanceof Error ? err.message : String(err));
          });
        }
      }
    } catch (error) {
      // Даже если произошла ошибка, мы хотим знать об этом, но не прерывать работу
      console.error('Критическая ошибка при записи события безопасности:', error instanceof Error ? error.message : String(error));
    }
  }
  
  /**
   * Асинхронно загружает события безопасности из файлов за последние дни
   * @param days Количество дней для загрузки
   */
  public async loadSecurityEventsFromFiles(days: number = 7): Promise<void> {
    try {
      // Проверяем инициализацию директории
      if (!this.directoryUri) {
        await this.initializeDirectory();
      }
      
      // Проверяем существование директории безопасности
      const securityDir = `${this.directoryUri}/security`;
      const dirInfo = await FileSystem.getInfoAsync(securityDir);
      
      if (!dirInfo.exists) {
        // Если директории нет, создаем ее
        await FileSystem.makeDirectoryAsync(securityDir, { intermediates: true });
        return; // Нет файлов для загрузки
      }
      
      // Получаем список файлов в директории
      const files = await FileSystem.readDirectoryAsync(securityDir);
      
      // Фильтруем только файлы с событиями безопасности и за последние дни
      const securityFiles = files
        .filter(file => file.startsWith('security_') && file.endsWith('.json'))
        .filter(file => {
          // Извлекаем дату из имени файла: security_YYYY-MM-DD.json
          const dateMatch = file.match(/security_(\d{4}-\d{2}-\d{2})\.json/);
          if (!dateMatch) return false;
          
          const fileDate = new Date(dateMatch[1]);
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - days);
          
          return fileDate >= cutoffDate;
        });
      
      // Если нет файлов, выходим
      if (securityFiles.length === 0) return;
      
      // Очищаем существующие события перед загрузкой
      this.securityEvents = [];
      
      // Загружаем события из каждого файла
      for (const file of securityFiles) {
        try {
          const filePath = `${securityDir}/${file}`;
          const content = await FileSystem.readAsStringAsync(filePath);
          const events = JSON.parse(content) as SecurityEvent[];
          
          // Добавляем события в общий массив
          this.securityEvents.push(...events);
        } catch (fileError) {
          console.warn(`Не удалось загрузить события из файла ${file}:`, fileError instanceof Error ? fileError.message : String(fileError));
        }
      }
      
      // Сортируем события по времени (от новых к старым)
      this.securityEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      // Ограничиваем количество событий в памяти
      if (this.securityEvents.length > 100) {
        this.securityEvents = this.securityEvents.slice(0, 100);
      }
      
      console.log(`Загружено ${this.securityEvents.length} событий безопасности за последние ${days} дней`);
    } catch (error) {
      console.error('Ошибка при загрузке событий безопасности:', error instanceof Error ? error.message : String(error));
      // Не выбрасываем ошибку дальше, чтобы не прерывать инициализацию
    }
  }
  
  /**
   * Сохраняет события безопасности в файл
   */
  private async saveSecurityEventToFile(): Promise<void> {
    try {
      // Проверяем инициализацию директории
      if (!this.directoryUri) {
        await this.initializeDirectory();
      }
      
      // Создаем директорию для событий безопасности, если она не существует
      const securityDir = `${this.directoryUri}/security`;
      const dirInfo = await FileSystem.getInfoAsync(securityDir);
      
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(securityDir, { intermediates: true });
      }
      
      // Группируем события по дням для хранения
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const filePath = `${securityDir}/security_${today}.json`;
      
      // Проверяем существование файла
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      
      let existingEvents: SecurityEvent[] = [];
      
      // Если файл существует, читаем его содержимое
      if (fileInfo.exists) {
        try {
          const content = await FileSystem.readAsStringAsync(filePath);
          existingEvents = JSON.parse(content);
        } catch (parseError) {
          console.warn('Ошибка при чтении файла событий безопасности:', parseError instanceof Error ? parseError.message : String(parseError));
          // Если файл поврежден, создаем новый
        }
      }
      
      // Объединяем существующие события с новыми
      const updatedEvents = [...existingEvents, ...this.securityEvents]
        // Удаляем дубликаты по timestamp (использует последнее появление события)
        .filter((event, index, self) => 
          index === self.findIndex(e => e.timestamp === event.timestamp)
        );
      
      // Сохраняем события в файл
      await FileSystem.writeAsStringAsync(filePath, JSON.stringify(updatedEvents, null, 2));
      
      // Очищаем события в памяти, оставляя только последние события
      if (this.securityEvents.length > 50) {
        this.securityEvents = this.securityEvents.slice(-50);
      }
      
      console.log(`Сохранено ${updatedEvents.length} событий безопасности в файл`);
    } catch (error) {
      console.error('Ошибка при сохранении событий безопасности в файл:', error instanceof Error ? error.message : String(error));
      // Не выбрасываем ошибку дальше, чтобы не прерывать работу
    }
  }
  
  /**
   * Отправляет уведомление безопасности
   * @param eventType Тип события безопасности
   * @param details Подробности события
   */
  private async sendSecurityNotification(eventType: string, details: any): Promise<void> {
    try {
      // Проверяем настройку уведомлений
      if (!this.notificationsConfigured) {
        await this.configureNotifications();
      }
      
      // Определяем заголовок и тело уведомления в зависимости от типа события
      let title = 'Предупреждение безопасности';
      let body = 'Обнаружена проблема безопасности в приложении.';
      
      switch (eventType) {
        case 'data_tampering':
          title = 'Обнаружено изменение данных';
          body = 'Возможно, произошло несанкционированное изменение данных. Проверьте ваш аккаунт.';
          break;
        case 'unauthorized_access':
          title = 'Несанкционированный доступ';
          body = 'Обнаружена попытка несанкционированного доступа к вашему аккаунту.';
          break;
        case 'suspicious_activity':
          title = 'Подозрительная активность';
          body = 'В вашем аккаунте обнаружена подозрительная активность.';
          break;
        case 'brute_force':
          title = 'Попытка подбора пароля';
          body = 'Обнаружена попытка подбора пароля к вашему аккаунту.';
          break;
        case 'user_management':
          title = 'Изменение учетной записи';
          body = 'Обнаружено изменение данных учетной записи.';
          break;
      }
      
      // Если есть детали, добавляем их
      if (details && typeof details === 'string' && details.length < 100) {
        body += ` ${details}`;
      }
      
      // Отправляем уведомление
      await NotificationsModule.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: {
            source: 'security',
            eventType,
            timestamp: new Date().toISOString()
          },
          sound: true,
          priority: 'high',
        },
        trigger: null, // Немедленное уведомление
      });
      
      // Логируем отправку уведомления
      this.logNotificationSent('security', eventType);
    } catch (error) {
      console.error('Ошибка при отправке уведомления безопасности:', error instanceof Error ? error.message : String(error));
      // Не выбрасываем ошибку дальше, чтобы не прерывать работу
    }
  }

  /**
   * Сохранение Push токена
   */
  private async savePushToken(token: any): Promise<void> {
    try {
      // Сохраняем токен локально
      await AsyncStorage.setItem('NUTRIVIEW_PUSH_TOKEN', JSON.stringify(token));
      
      console.log('Push токен сохранен успешно');
    } catch (error) {
      console.error('Ошибка при сохранении Push токена:', error);
    }
  }

  /**
   * Отправляет событие аналитики
   * @param eventType Тип события
   * @param eventData Данные события
   */
  private async sendAnalyticsEvent(eventType: string, eventData: any): Promise<void> {
    try {
      // Формируем данные события
      const eventFormData = {
        eventType,
        timestamp: new Date().toISOString(),
        userId: this.userId || 'anonymous',
        sessionId: await this.getSessionId(),
        deviceInfo: this.deviceInfo ? {
          deviceId: this.deviceInfo.deviceId,
          platform: Platform.OS,
          osVersion: Platform.Version.toString(),
          deviceModel: this.deviceInfo.deviceModel || 'unknown'
        } : undefined,
        ...eventData
      };
      
      // Сохраняем событие локально
      await this.storeAnalyticsEvent(eventFormData);
      
      // Отправляем на сервер, если есть соединение
      if (this.networkStatus?.isConnected) {
        // Добавляем в очередь для отправки
        this.addToNetworkQueue(() => this.sendAnalyticsToServer(eventFormData));
      } else {
        console.log('Нет подключения к сети. Событие аналитики сохранено локально.');
      }
    } catch (error) {
      console.error('Ошибка при отправке события аналитики:', error instanceof Error ? error.message : String(error));
    }
  }
  
  /**
   * Сохраняет событие аналитики локально
   * @param eventData Данные события
   */
  private async storeAnalyticsEvent(eventData: any): Promise<void> {
    try {
      const analyticsKey = 'NUTRIVIEW_ANALYTICS_EVENTS';
      
      // Получаем существующие события
      let events = [];
      const savedEvents = await AsyncStorage.getItem(analyticsKey);
      
      if (savedEvents) {
        events = JSON.parse(savedEvents);
      }
      
      // Добавляем новое событие
      events.push(eventData);
      
      // Ограничиваем количество хранимых событий
      if (events.length > 1000) {
        events = events.slice(-1000);
      }
      
      // Сохраняем обновленные события
      await AsyncStorage.setItem(analyticsKey, JSON.stringify(events));
    } catch (error) {
      console.error('Ошибка при сохранении события аналитики:', error instanceof Error ? error.message : String(error));
    }
  }
  
  /**
   * Отправляет событие аналитики на сервер
   * @param eventData Данные события
   */
  private async sendAnalyticsToServer(eventData: any): Promise<void> {
    try {
      console.log('Отправка события аналитики на сервер:', eventData);
      
      // В реальном приложении здесь был бы запрос к серверу
      // Имитируем запрос с задержкой
      await new Promise<void>((resolve, reject) => {
        setTimeout(() => {
          // Проверяем наличие сети перед "отправкой"
          if (this.networkStatus?.isConnected) {
            console.log('Событие аналитики успешно отправлено');
            resolve();
          } else {
            reject(new Error('Нет подключения к сети'));
          }
        }, 500);
      });
    } catch (error) {
      console.error('Ошибка при отправке события аналитики на сервер:', error instanceof Error ? error.message : String(error));
      
      // Если ошибка связана с сетью, добавляем событие обратно в очередь
      if (error instanceof Error && 
          (error.message.includes('network') || 
           error.message.includes('соединени') || 
           error.message.includes('подключени'))) {
        console.log('Повторная попытка отправки будет выполнена позже');
        this.addToNetworkQueue(() => this.sendAnalyticsToServer(eventData));
      }
    }
  }
  
  /**
   * Получает или создает ID сессии
   */
  private async getSessionId(): Promise<string> {
    try {
      const sessionKey = 'NUTRIVIEW_CURRENT_SESSION';
      
      // Пытаемся получить существующий ID сессии
      const savedSession = await AsyncStorage.getItem(sessionKey);
      
      if (savedSession) {
        const session = JSON.parse(savedSession);
        const sessionTime = new Date(session.timestamp);
        const now = new Date();
        
        // Проверяем, не устарела ли сессия (30 минут)
        if (now.getTime() - sessionTime.getTime() < 30 * 60 * 1000) {
          // Сессия все еще действительна, обновляем её timestamp
          session.timestamp = now.toISOString();
          await AsyncStorage.setItem(sessionKey, JSON.stringify(session));
          return session.id;
        }
      }
      
      // Создаем новый ID сессии
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      const sessionData = {
        id: sessionId,
        timestamp: new Date().toISOString(),
        userId: this.userId || 'anonymous',
        deviceId: this.deviceInfo?.deviceId || 'unknown'
      };
      
      // Сохраняем новую сессию
      await AsyncStorage.setItem(sessionKey, JSON.stringify(sessionData));
      
      // Отправляем событие о начале новой сессии
      this.sendAnalyticsEvent('session_start', {
        previousSessionId: savedSession ? JSON.parse(savedSession).id : null
      }).catch(err => {
        console.warn('Ошибка при отправке события о начале сессии:', err instanceof Error ? err.message : String(err));
      });
      
      return sessionId;
    } catch (error) {
      console.error('Ошибка при получении ID сессии:', error instanceof Error ? error.message : String(error));
      
      // Возвращаем резервный ID сессии в случае ошибки
      return `fallback_session_${Date.now()}`;
    }
  }
  
  /**
   * Сохраняет Push-токен для уведомлений
   */
  private async savePushToken(token: any): Promise<void> {
    try {
      if (!token || !token.data) {
        console.warn('Попытка сохранить недействительный Push-токен');
        return;
      }
      
      // Сохраняем токен локально
      await AsyncStorage.setItem('NUTRIVIEW_PUSH_TOKEN', JSON.stringify({
        token: token.data,
        type: token.type,
        timestamp: new Date().toISOString(),
        deviceId: this.deviceInfo?.deviceId || 'unknown',
        userId: this.userId || 'anonymous'
      }));
      
      // В реальном приложении здесь был бы запрос для сохранения токена на сервере
      console.log(`Push-токен успешно сохранен: ${token.data} (тип: ${token.type})`);
      
      // Отправляем событие о регистрации токена
      if (this.networkStatus?.isConnected) {
        this.sendAnalyticsEvent('push_token_registered', {
          tokenType: token.type
        }).catch(err => {
          console.warn('Ошибка при отправке события о регистрации токена:', err instanceof Error ? err.message : String(err));
        });
      }
    } catch (error) {
      console.error('Ошибка при сохранении Push-токена:', error instanceof Error ? error.message : String(error));
    }
  }
} 