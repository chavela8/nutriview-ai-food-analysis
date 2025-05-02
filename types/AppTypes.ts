/**
 * Дополнительные типы данных для приложения NutriView AI
 * Включает типы для работы с ИИ-рекомендациями, безопасностью и устройствами
 */

import { HealthDataType } from './HealthTypes';

/**
 * Типы ИИ-рекомендаций поддерживаемые системой
 */
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

/**
 * Интерфейс ИИ-рекомендации
 */
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

/**
 * Опции для генерации ИИ-рекомендаций
 */
export interface AIRecommendationOptions {
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

/**
 * Информация об устройстве пользователя
 */
export interface DeviceInfo {
  deviceId: string;
  deviceName?: string;
  deviceType?: string;
  deviceBrand?: string;
  deviceModel?: string;
  osName: string;
  osVersion: string;
  appName: string;
  appVersion: string;
  appBuildNumber?: string;
  isEmulator: boolean;
  isTablet?: boolean;
  hasNotch?: boolean;
  screenWidth?: number;
  screenHeight?: number;
  screenScale?: number;
  deviceLocale?: string;
  deviceCountry?: string;
  deviceTimeZone?: string;
  isRooted?: boolean;
  hasAbnormalSettings?: boolean;
}

/**
 * Событие безопасности
 */
export interface SecurityEvent {
  timestamp: string;
  type: 'data_tampering' | 'unauthorized_access' | 'suspicious_activity' | 'brute_force' | 'user_management';
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

/**
 * Интерфейс взаимодействия с рекомендацией
 */
export interface RecommendationInteraction {
  id: string;
  recommendationId: string;
  recommendationType: AIRecommendationType;
  timestamp: string;
  action: 'view' | 'click' | 'dismiss' | 'helpful' | 'not_helpful';
  interacted: boolean;
  feedback?: {
    helpful?: boolean;
    comment?: string;
  };
  contextData?: {
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
    dayOfWeek?: number;
    notificationId?: string;
  };
}

/**
 * Результат анализа эффективности рекомендаций
 */
export interface EffectivenessAnalysisResult {
  effectiveTypes: string[];
  ineffectiveTypes: string[];
  interactionRate: number;
  overallEffectiveness: 'low' | 'medium' | 'high';
  detailedAnalysis?: {
    byType: Record<string, {
      shown: number;
      interacted: number;
      helpful: number;
      notHelpful: number;
      interactionRate: number;
      helpfulnessRate: number;
      effectiveness: 'low' | 'medium' | 'high';
    }>;
    byTimeOfDay?: Record<string, {
      interactionRate: number;
      helpfulnessRate: number;
    }>;
    byDayOfWeek?: Record<string, {
      interactionRate: number;
      helpfulnessRate: number;
    }>;
  };
  suggestedImprovements?: string[];
}

/**
 * Параметры для мокирования expo-notifications
 */
export interface ExpoNotifications {
  setNotificationHandler: (handler: {
    handleNotification: () => Promise<{
      shouldShowAlert: boolean;
      shouldPlaySound: boolean;
      shouldSetBadge: boolean;
    }>;
  }) => void;
  cancelAllScheduledNotificationsAsync: () => Promise<void>;
  Notification: any;
  Notifications: {
    setNotificationHandler: (handler: any) => void;
    cancelAllScheduledNotificationsAsync: () => Promise<void>;
  };
}

/**
 * Параметры для мокирования netinfo
 */
export interface NetInfoState {
  type: string | null;
  isConnected: boolean;
  isInternetReachable?: boolean;
  details?: any;
}

/**
 * Параметры для экспорта в mockModules.ts
 */
export interface MockExports {
  Crypto: {
    getRandomBytesAsync: (size: number) => Promise<Uint8Array>;
    digestStringAsync: (algorithm: string, data: string) => Promise<string>;
  };
  NetInfo: {
    addEventListener: (callback: (state: NetInfoState) => void) => () => void;
    fetch: () => Promise<NetInfoState>;
  };
  Device: {
    isDevice: boolean;
    brand: string;
    manufacturer: string;
    modelName: string;
    modelId: string;
    designName: string;
    productName: string;
    deviceYearClass: number;
    totalMemory: number;
    supportedCpuArchitectures: string[];
    osName: string;
    osVersion: string;
    osBuildId: string;
    osInternalBuildId: string;
    osBuildFingerprint: string;
    platformApiLevel: number;
    deviceName: string;
    getDeviceTypeAsync: () => Promise<string>;
    isRootedExperimentalAsync: () => Promise<boolean>;
  };
} 