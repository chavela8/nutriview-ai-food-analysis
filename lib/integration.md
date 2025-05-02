# Итоговый план интеграции для улучшенного AIRecommendationEngine

В рамках улучшения класса `AIRecommendationEngine` мы разработали несколько дополнительных модулей и фичей, которые необходимо интегрировать в основной класс. Данный документ содержит подробные инструкции по внедрению этих улучшений.

## Структура улучшений

Мы создали следующие файлы:

1. **SecurityMethods.ts** - Методы для обеспечения безопасности
2. **EffectivenessAnalysis.ts** - Анализ эффективности рекомендаций
3. **SecurityMethodsAdapter.ts** - Адаптер для интеграции безопасности (альтернативный подход)
4. **AppTypes.ts** - Дополнительные типы данных для приложения
5. **mockModules.ts** - Мок-модули для разработки и тестирования
6. **AIRecommendationEngine.enhanced.ts** - Пример обновленного класса

## Шаги интеграции

### 1. Интеграция безопасности

#### 1.1 Добавьте импорты в AIRecommendationEngine.ts

```typescript
// Импорт методов безопасности
import { 
  recordSecurityEvent, 
  sendSecurityNotification, 
  saveSecurityEventToFile, 
  getSecurityEvents, 
  loadSecurityEventsFromFiles 
} from './SecurityMethods';
```

#### 1.2 Добавьте методы безопасности в класс AIRecommendationEngine

```typescript
/**
 * Запись событий безопасности в лог и отправка критичных уведомлений
 */
async recordSecurityEvent(
  type: 'data_tampering' | 'unauthorized_access' | 'suspicious_activity' | 'brute_force' | 'user_management',
  details: string,
  severity: 'low' | 'medium' | 'high' | 'critical'
): Promise<boolean> {
  return recordSecurityEvent.call(this, type, details, severity);
}

/**
 * Сохранение события безопасности в файл
 */
private async saveSecurityEventToFile(event: SecurityEvent): Promise<void> {
  return saveSecurityEventToFile.call(this, event);
}

/**
 * Отправка уведомления о событии безопасности
 */
private async sendSecurityNotification(title: string, body: string): Promise<boolean> {
  return sendSecurityNotification.call(this, title, body);
}

/**
 * Получение истории событий безопасности
 */
async getSecurityEvents(
  limit: number = 50,
  severity?: 'low' | 'medium' | 'high' | 'critical',
  type?: 'data_tampering' | 'unauthorized_access' | 'suspicious_activity' | 'brute_force' | 'user_management'
): Promise<SecurityEvent[]> {
  return getSecurityEvents.call(this, limit, severity, type);
}

/**
 * Загрузка событий безопасности из файлов
 */
private async loadSecurityEventsFromFiles(days: number = 7): Promise<SecurityEvent[]> {
  return loadSecurityEventsFromFiles.call(this, days);
}
```

#### 1.3 Обновите метод initializeEngine() для загрузки событий безопасности

```typescript
private async initializeEngine() {
  try {
    await this.initializeDirectory();
    await this.initializeSecurityKeys();
    this.setupNetworkListener();
    await this.getDeviceInfo();
    this.configureNotifications();
    
    // Загружаем события безопасности за последние 7 дней
    await this.loadSecurityEventsFromFiles(7);
    
    this.isInitialized = true;
    console.log('AIRecommendationEngine инициализирован успешно');
  } catch (error) {
    console.error('Ошибка при инициализации AIRecommendationEngine:', error);
    
    // Попытка восстановления в случае ошибки
    setTimeout(() => this.initializeEngine(), 5000);
  }
}
```

### 2. Интеграция анализа эффективности

#### 2.1 Добавьте импорты в AIRecommendationEngine.ts

```typescript
import { 
  analyzeRecommendationEffectiveness, 
  generateSuggestedImprovements, 
  recordRecommendationInteraction,
  analyzeOptimalNotificationTimes
} from './EffectivenessAnalysis';
```

#### 2.2 Добавьте методы анализа эффективности в класс AIRecommendationEngine

```typescript
/**
 * Расширенный анализ эффективности рекомендаций с детальной сегментацией
 */
public async analyzeRecommendationEffectiveness(): Promise<EffectivenessAnalysisResult> {
  return analyzeRecommendationEffectiveness.call(this);
}

/**
 * Генерация рекомендаций по улучшению на основе анализа данных
 */
private generateSuggestedImprovements(
  typeAnalysis: Record<string, any>,
  effectiveTypes: string[],
  ineffectiveTypes: string[],
  timeOfDayAnalysis: Record<string, any>,
  dayOfWeekAnalysis: Record<string, any>
): string[] {
  return generateSuggestedImprovements.call(this, typeAnalysis, effectiveTypes, ineffectiveTypes, timeOfDayAnalysis, dayOfWeekAnalysis);
}

/**
 * Запись статистики взаимодействия с рекомендацией
 */
public async recordRecommendationInteraction(
  recommendationId: string,
  recommendationType: AIRecommendationType,
  action: 'view' | 'click' | 'dismiss' | 'helpful' | 'not_helpful'
): Promise<boolean> {
  return recordRecommendationInteraction.call(this, recommendationId, recommendationType, action);
}

/**
 * Получение оптимального времени для отправки уведомлений
 */
private async analyzeOptimalNotificationTimes(): Promise<{
  generalHours: number[];
  categories: Record<string, number>;
}> {
  return analyzeOptimalNotificationTimes.call(this);
}
```

#### 2.3 Обновите метод scheduleRecommendationNotifications()

```typescript
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
```

### 3. Альтернативный подход с SecurityManager

Вместо прямой интеграции методов безопасности, можно использовать класс `SecurityManager` для более модульного подхода:

```typescript
// Импортируем класс SecurityManager
import { SecurityManager } from './SecurityMethodsAdapter';

class AIRecommendationEngine {
  // Добавляем поле для SecurityManager
  private securityManager: SecurityManager;
  
  constructor() {
    // Инициализируем SecurityManager в конструкторе
    this.securityManager = new SecurityManager(
      () => this.getDeviceInfo(),
      () => this.initializeDirectory(),
      (eventType, data) => this.sendAnalyticsEvent(eventType, data),
      () => this.configureNotifications(),
      () => this.networkStatus
    );
    
    this.initializeEngine();
  }
  
  // Делегируем вызовы методов безопасности в SecurityManager
  async recordSecurityEvent(
    type: 'data_tampering' | 'unauthorized_access' | 'suspicious_activity' | 'brute_force' | 'user_management',
    details: string,
    severity: 'low' | 'medium' | 'high' | 'critical'
  ): Promise<boolean> {
    return this.securityManager.recordSecurityEvent(type, details, severity);
  }
  
  async getSecurityEvents(
    limit?: number,
    severity?: 'low' | 'medium' | 'high' | 'critical',
    type?: 'data_tampering' | 'unauthorized_access' | 'suspicious_activity' | 'brute_force' | 'user_management'
  ): Promise<SecurityEvent[]> {
    return this.securityManager.getSecurityEvents(limit, severity, type);
  }
}
```

### 4. Финальные шаги интеграции

1. **Импортируйте новые типы данных из AppTypes.ts** вместо объявления их в основном файле
2. **Обновите существующие методы**, чтобы они использовали новую функциональность
3. **Обновите API-документацию** для отражения новых возможностей
4. **Добавьте тесты** для новых методов
5. **Отладьте и устраните возможные проблемы совместимости**

## Пример использования обновленного AIRecommendationEngine

```typescript
// Пример использования обновленного движка рекомендаций

// Инициализация
const recommendationEngine = new AIRecommendationEngine();
await recommendationEngine.setUserId('user123');

// Генерация рекомендаций
const recommendations = await recommendationEngine.generateRecommendations({
  includeTypes: ['nutrition', 'activity'],
  minPriority: 'medium'
});

// Запись взаимодействия пользователя с рекомендацией
await recommendationEngine.recordRecommendationInteraction(
  recommendations[0].id,
  recommendations[0].type,
  'helpful'
);

// Анализ эффективности рекомендаций
const effectivenessAnalysis = await recommendationEngine.analyzeRecommendationEffectiveness();
console.log('Эффективные типы рекомендаций:', effectivenessAnalysis.effectiveTypes);
console.log('Показатель взаимодействия:', effectivenessAnalysis.interactionRate);

// Планирование уведомлений с рекомендациями
await recommendationEngine.scheduleRecommendationNotifications(7, 2);

// Проверка событий безопасности
const securityEvents = await recommendationEngine.getSecurityEvents(10, 'high');
console.log('Последние события безопасности высокой важности:', securityEvents);
```

## Дополнительные материалы

Для полной документации и примеров обратитесь к:

- **AppTypes.ts** - содержит все необходимые типы данных
- **AIRecommendationEngine.enhanced.ts** - пример полной реализации
- **README.md** - общая документация по проекту с обзором всех улучшений 