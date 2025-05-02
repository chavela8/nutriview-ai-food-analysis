/**
 * Типы данных для работы с информацией о здоровье пользователя
 * Используются в APIRecommendationEngine и других классах для обработки
 * и анализа медицинских показателей
 */

/**
 * Типы данных о здоровье, доступные для считывания и анализа
 */
export enum HealthDataType {
  // Активность
  STEPS = 'steps',
  DISTANCE = 'distance',
  ACTIVE_ENERGY_BURNED = 'activeEnergyBurned',
  FLIGHTS_CLIMBED = 'flightsClimbed',
  EXERCISE_TIME = 'exerciseTime',
  STAND_TIME = 'standTime',
  ACTIVITY_SUMMARY = 'activitySummary',
  
  // Жизненные показатели
  HEART_RATE = 'heartRate',
  RESTING_HEART_RATE = 'restingHeartRate',
  HEART_RATE_VARIABILITY = 'heartRateVariability',
  BLOOD_PRESSURE_SYSTOLIC = 'bloodPressureSystolic',
  BLOOD_PRESSURE_DIASTOLIC = 'bloodPressureDiastolic',
  RESPIRATORY_RATE = 'respiratoryRate',
  BODY_TEMPERATURE = 'bodyTemperature',
  BLOOD_OXYGEN = 'bloodOxygen',
  
  // Состав тела
  BODY_MASS = 'bodyMass',
  BODY_FAT_PERCENTAGE = 'bodyFatPercentage',
  LEAN_BODY_MASS = 'leanBodyMass',
  HEIGHT = 'height',
  BMI = 'bmi',
  WAIST_CIRCUMFERENCE = 'waistCircumference',
  
  // Сон
  SLEEP_ANALYSIS = 'sleepAnalysis',
  SLEEP_DURATION = 'sleepDuration',
  SLEEP_QUALITY = 'sleepQuality',
  
  // Питание
  DIETARY_ENERGY = 'dietaryEnergy',
  DIETARY_PROTEIN = 'dietaryProtein',
  DIETARY_FAT = 'dietaryFat',
  DIETARY_CARBOHYDRATES = 'dietaryCarbohydrates',
  DIETARY_FIBER = 'dietaryFiber',
  DIETARY_SUGAR = 'dietarySugar',
  DIETARY_WATER = 'dietaryWater',
  DIETARY_VITAMINS = 'dietaryVitamins',
  DIETARY_MINERALS = 'dietaryMinerals',
  
  // Метаболические
  BLOOD_GLUCOSE = 'bloodGlucose',
  INSULIN_DELIVERY = 'insulinDelivery',
  
  // Психологические
  MINDFUL_MINUTES = 'mindfulMinutes',
  STRESS_LEVEL = 'stressLevel',
  MOOD = 'mood',
  
  // Репродуктивное здоровье
  MENSTRUAL_FLOW = 'menstrualFlow',
  OVULATION_TEST_RESULT = 'ovulationTestResult',
  CERVICAL_MUCUS_QUALITY = 'cervicalMucusQuality',
  SEXUAL_ACTIVITY = 'sexualActivity',
  
  // Медицинские записи
  ALLERGIES = 'allergies',
  MEDICATIONS = 'medications',
  IMMUNIZATIONS = 'immunizations',
  MEDICAL_CONDITIONS = 'medicalConditions',
  CLINICAL_RECORDS = 'clinicalRecords'
}

/**
 * Интерфейс для периода времени
 */
export interface TimeRange {
  startDate: Date | string;
  endDate: Date | string;
}

/**
 * Опции для запроса данных о здоровье
 */
export interface HealthDataOptions {
  types: HealthDataType[];
  timeRange: TimeRange;
  limit?: number;
  ascending?: boolean;
  includeManuallyLogged?: boolean;
}

/**
 * Результат запроса данных о здоровье
 */
export interface HealthDataResult {
  type: HealthDataType;
  data: any[];
  success: boolean;
  error?: string;
}

/**
 * Интерфейс для обобщенных результатов анализа здоровья
 */
export interface HealthAnalysisResult {
  score: number; // 0-100
  insights: HealthInsight[];
  recommendations: string[];
  warnings: HealthWarning[];
  metadata: Record<string, any>;
}

/**
 * Интерфейс для медицинского предупреждения
 */
export interface HealthWarning {
  type: HealthDataType | string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  suggestedAction?: string;
  timestamp: string;
}

/**
 * Интерфейс для инсайта о здоровье
 */
export interface HealthInsight {
  type: HealthDataType | string;
  title: string;
  description: string;
  trend?: 'improving' | 'stable' | 'worsening';
  confidence: 'low' | 'medium' | 'high';
  actionable: boolean;
  suggestedAction?: string;
}

/**
 * Интерфейс для доступа к данным о здоровье с разных платформ
 */
export interface HealthPlatformAccess {
  readonly platform: 'apple_health' | 'google_fit' | 'samsung_health' | 'fitbit' | 'garmin' | 'custom';
  readonly isAvailable: boolean;
  readonly isAuthorized: boolean;
  readonly connectedDevices?: string[];
}

/**
 * Тип для уровня доступа к данным о здоровье
 */
export type HealthPermissionStatus = 'not_determined' | 'denied' | 'authorized' | 'restricted' | 'limited';

/**
 * Интерфейс для разрешений на доступ к данным о здоровье
 */
export interface HealthPermission {
  type: HealthDataType;
  access: 'read' | 'write' | 'readWrite';
  status: HealthPermissionStatus;
}

/**
 * Интерфейс для интеграции с платформами здоровья
 */
export interface HealthIntegration {
  initialize(): Promise<boolean>;
  requestPermissions(types: HealthDataType[], access: 'read' | 'write' | 'readWrite'): Promise<HealthPermission[]>;
  queryData(options: HealthDataOptions): Promise<HealthDataResult[]>;
  writeData(type: HealthDataType, data: any): Promise<boolean>;
  getAvailablePlatforms(): Promise<HealthPlatformAccess[]>;
  isAuthorizedFor(types: HealthDataType[]): Promise<boolean>;
} 