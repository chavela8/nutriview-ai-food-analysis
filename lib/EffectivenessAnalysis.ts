/**
 * Расширенные методы анализа эффективности рекомендаций для AIRecommendationEngine
 * 
 * Эти методы добавляют расширенную функциональность для анализа эффективности 
 * персонализированных рекомендаций в приложении.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AIRecommendationType } from './AIRecommendationEngine';

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
 * Расширенный анализ эффективности рекомендаций с детальной сегментацией
 */
export async function analyzeRecommendationEffectiveness(
  this: any
): Promise<EffectivenessAnalysisResult> {
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
        overallEffectiveness: 'low',
        suggestedImprovements: ['Начните использовать персонализированные рекомендации для анализа их эффективности']
      };
    }
    
    let feedbackData: Array<{
      recommendationType: string;
      interacted: boolean;
      feedback?: 'helpful' | 'not_helpful';
      timestamp?: string;
      timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
      dayOfWeek?: number;
    }>;
    
    try {
      feedbackData = JSON.parse(rawFeedback);
    } catch (error) {
      console.warn('Ошибка при парсинге данных обратной связи:', error);
      return {
        effectiveTypes: [],
        ineffectiveTypes: [],
        interactionRate: 0,
        overallEffectiveness: 'low',
        suggestedImprovements: ['Исправьте ошибку в формате данных обратной связи по рекомендациям']
      };
    }
    
    // Обогащаем данные временными метками, если их нет
    feedbackData = feedbackData.map(entry => {
      if (!entry.timestamp) {
        return { ...entry, timestamp: new Date().toISOString() };
      }
      
      const timestamp = new Date(entry.timestamp);
      
      // Добавляем время суток
      if (!entry.timeOfDay) {
        const hour = timestamp.getHours();
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
        
        entry.timeOfDay = timeOfDay;
      }
      
      // Добавляем день недели (0 - воскресенье, 6 - суббота)
      if (!entry.dayOfWeek) {
        entry.dayOfWeek = timestamp.getDay();
      }
      
      return entry;
    });
    
    // Анализируем эффективность по типам рекомендаций
    const typeStats: Record<string, { 
      shown: number; 
      interacted: number; 
      helpful: number;
      notHelpful: number;
    }> = {};
    
    // Анализ по времени суток
    const timeOfDayStats: Record<string, {
      shown: number;
      interacted: number;
      helpful: number;
      notHelpful: number;
    }> = {
      morning: { shown: 0, interacted: 0, helpful: 0, notHelpful: 0 },
      afternoon: { shown: 0, interacted: 0, helpful: 0, notHelpful: 0 },
      evening: { shown: 0, interacted: 0, helpful: 0, notHelpful: 0 },
      night: { shown: 0, interacted: 0, helpful: 0, notHelpful: 0 }
    };
    
    // Анализ по дням недели
    const dayOfWeekStats: Record<string, {
      shown: number;
      interacted: number;
      helpful: number;
      notHelpful: number;
    }> = {
      '0': { shown: 0, interacted: 0, helpful: 0, notHelpful: 0 }, // Воскресенье
      '1': { shown: 0, interacted: 0, helpful: 0, notHelpful: 0 }, // Понедельник
      '2': { shown: 0, interacted: 0, helpful: 0, notHelpful: 0 }, // Вторник
      '3': { shown: 0, interacted: 0, helpful: 0, notHelpful: 0 }, // Среда
      '4': { shown: 0, interacted: 0, helpful: 0, notHelpful: 0 }, // Четверг
      '5': { shown: 0, interacted: 0, helpful: 0, notHelpful: 0 }, // Пятница
      '6': { shown: 0, interacted: 0, helpful: 0, notHelpful: 0 }  // Суббота
    };
    
    // Инициализируем статистику
    for (const entry of feedbackData) {
      const type = entry.recommendationType;
      const timeOfDay = entry.timeOfDay || 'afternoon';
      const dayOfWeek = String(entry.dayOfWeek || 0);
      
      // Статистика по типу
      if (!typeStats[type]) {
        typeStats[type] = { shown: 0, interacted: 0, helpful: 0, notHelpful: 0 };
      }
      
      typeStats[type].shown++;
      timeOfDayStats[timeOfDay].shown++;
      dayOfWeekStats[dayOfWeek].shown++;
      
      if (entry.interacted) {
        typeStats[type].interacted++;
        timeOfDayStats[timeOfDay].interacted++;
        dayOfWeekStats[dayOfWeek].interacted++;
      }
      
      if (entry.feedback === 'helpful') {
        typeStats[type].helpful++;
        timeOfDayStats[timeOfDay].helpful++;
        dayOfWeekStats[dayOfWeek].helpful++;
      } else if (entry.feedback === 'not_helpful') {
        typeStats[type].notHelpful++;
        timeOfDayStats[timeOfDay].notHelpful++;
        dayOfWeekStats[dayOfWeek].notHelpful++;
      }
    }
    
    // Определяем эффективные и неэффективные типы
    const effectiveTypes: string[] = [];
    const ineffectiveTypes: string[] = [];
    let totalShown = 0;
    let totalInteracted = 0;
    
    // Детальный анализ по типам
    const detailedByType: Record<string, {
      shown: number;
      interacted: number;
      helpful: number;
      notHelpful: number;
      interactionRate: number;
      helpfulnessRate: number;
      effectiveness: 'low' | 'medium' | 'high';
    }> = {};
    
    for (const [type, stats] of Object.entries(typeStats)) {
      totalShown += stats.shown;
      totalInteracted += stats.interacted;
      
      // Рассчитываем метрики
      const interactionRate = stats.shown > 0 ? stats.interacted / stats.shown : 0;
      const helpfulnessRate = stats.interacted > 0 ? stats.helpful / stats.interacted : 0;
      
      // Определяем эффективность типа
      let effectiveness: 'low' | 'medium' | 'high' = 'medium';
      
      if (helpfulnessRate >= 0.6) {
        effectiveness = 'high';
        effectiveTypes.push(type);
      } else if (helpfulnessRate <= 0.3 || (stats.shown > 10 && interactionRate < 0.1)) {
        effectiveness = 'low';
        ineffectiveTypes.push(type);
      }
      
      // Добавляем в детальный анализ
      detailedByType[type] = {
        shown: stats.shown,
        interacted: stats.interacted,
        helpful: stats.helpful,
        notHelpful: stats.notHelpful,
        interactionRate,
        helpfulnessRate,
        effectiveness
      };
    }
    
    // Создаем анализ по времени суток
    const byTimeOfDay: Record<string, {
      interactionRate: number;
      helpfulnessRate: number;
    }> = {};
    
    for (const [timeOfDay, stats] of Object.entries(timeOfDayStats)) {
      byTimeOfDay[timeOfDay] = {
        interactionRate: stats.shown > 0 ? stats.interacted / stats.shown : 0,
        helpfulnessRate: stats.interacted > 0 ? stats.helpful / stats.interacted : 0
      };
    }
    
    // Создаем анализ по дням недели
    const byDayOfWeek: Record<string, {
      interactionRate: number;
      helpfulnessRate: number;
    }> = {};
    
    const dayNames = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    
    for (const [dayNum, stats] of Object.entries(dayOfWeekStats)) {
      const dayName = dayNames[parseInt(dayNum)];
      byDayOfWeek[dayName] = {
        interactionRate: stats.shown > 0 ? stats.interacted / stats.shown : 0,
        helpfulnessRate: stats.interacted > 0 ? stats.helpful / stats.interacted : 0
      };
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
    
    // Генерируем рекомендации по улучшению
    const suggestedImprovements = generateSuggestedImprovements.call(
      this,
      detailedByType,
      effectiveTypes,
      ineffectiveTypes,
      byTimeOfDay,
      byDayOfWeek
    );
    
    return {
      effectiveTypes,
      ineffectiveTypes,
      interactionRate,
      overallEffectiveness,
      detailedAnalysis: {
        byType: detailedByType,
        byTimeOfDay,
        byDayOfWeek
      },
      suggestedImprovements
    };
  } catch (error) {
    console.error('Ошибка при анализе эффективности рекомендаций:', error);
    await this.recordSecurityEvent(
      'suspicious_activity',
      `Ошибка при анализе эффективности рекомендаций: ${error}`,
      'low'
    );
    return {
      effectiveTypes: [],
      ineffectiveTypes: [],
      interactionRate: 0,
      overallEffectiveness: 'low',
      suggestedImprovements: ['Произошла ошибка при анализе данных. Пожалуйста, повторите попытку позже.']
    };
  }
}

/**
 * Генерация рекомендаций по улучшению на основе анализа данных
 */
export function generateSuggestedImprovements(
  this: any,
  typeAnalysis: Record<string, any>,
  effectiveTypes: string[],
  ineffectiveTypes: string[],
  timeOfDayAnalysis: Record<string, any>,
  dayOfWeekAnalysis: Record<string, any>
): string[] {
  const suggestions: string[] = [];
  
  // Если есть неэффективные типы, предлагаем их улучшить
  if (ineffectiveTypes.length > 0) {
    suggestions.push(`Улучшите рекомендации типа: ${ineffectiveTypes.join(', ')}`);
  }
  
  // Если есть эффективные типы, предлагаем увеличить их количество
  if (effectiveTypes.length > 0) {
    suggestions.push(`Увеличьте количество рекомендаций типа: ${effectiveTypes.join(', ')}`);
  }
  
  // Анализируем типы с низким уровнем взаимодействия
  const lowInteractionTypes = Object.entries(typeAnalysis)
    .filter(([_, stats]) => stats.interactionRate < 0.2)
    .map(([type, _]) => type);
    
  if (lowInteractionTypes.length > 0) {
    suggestions.push(`Сделайте более привлекательными рекомендации типа: ${lowInteractionTypes.join(', ')}`);
  }
  
  // Анализируем типы с низкой полезностью
  const lowHelpfulnessTypes = Object.entries(typeAnalysis)
    .filter(([_, stats]) => stats.interacted > 5 && stats.helpfulnessRate < 0.3)
    .map(([type, _]) => type);
    
  if (lowHelpfulnessTypes.length > 0) {
    suggestions.push(`Повысьте качество и релевантность рекомендаций типа: ${lowHelpfulnessTypes.join(', ')}`);
  }
  
  // Анализируем время суток с наивысшей эффективностью
  if (timeOfDayAnalysis) {
    const bestTimeOfDay = Object.entries(timeOfDayAnalysis)
      .sort(([_, a], [__, b]) => b.helpfulnessRate - a.helpfulnessRate)
      .filter(([_, stats]) => stats.interacted > 5)
      .map(([time, _]) => time)[0];
      
    if (bestTimeOfDay) {
      suggestions.push(`Оптимизируйте отправку рекомендаций для времени суток: ${bestTimeOfDay}`);
    }
  }
  
  // Анализируем дни недели с наивысшей эффективностью
  if (dayOfWeekAnalysis) {
    const bestDayOfWeek = Object.entries(dayOfWeekAnalysis)
      .sort(([_, a], [__, b]) => b.helpfulnessRate - a.helpfulnessRate)
      .filter(([_, stats]) => stats.interacted > 5)
      .map(([day, _]) => day)[0];
      
    if (bestDayOfWeek) {
      suggestions.push(`Увеличьте количество рекомендаций в день недели: ${bestDayOfWeek}`);
    }
  }
  
  // Общие рекомендации, если конкретных мало
  if (suggestions.length < 2) {
    suggestions.push('Собирайте больше данных о взаимодействиях пользователя с рекомендациями для более точного анализа');
    suggestions.push('Экспериментируйте с разными типами и форматами рекомендаций для определения наиболее эффективных');
  }
  
  return suggestions;
}

/**
 * Запись статистики взаимодействия с рекомендацией
 */
export async function recordRecommendationInteraction(
  this: any,
  recommendationId: string,
  recommendationType: AIRecommendationType,
  action: 'view' | 'click' | 'dismiss' | 'helpful' | 'not_helpful'
): Promise<boolean> {
  try {
    if (!this.userId) {
      console.warn('Невозможно записать взаимодействие: отсутствует ID пользователя');
      return false;
    }
    
    const timestamp = new Date().toISOString();
    const feedbackKey = `recommendation_feedback_${this.userId}`;
    
    // Получаем текущие данные обратной связи
    let feedbackData: Array<{
      id: string;
      recommendationType: string;
      interacted: boolean;
      feedback?: 'helpful' | 'not_helpful';
      timestamp: string;
      action: string;
    }> = [];
    
    try {
      const rawFeedback = await AsyncStorage.getItem(feedbackKey);
      if (rawFeedback) {
        feedbackData = JSON.parse(rawFeedback);
      }
    } catch (error) {
      console.warn('Ошибка при чтении данных обратной связи:', error);
    }
    
    // Находим существующую запись или создаем новую
    let existingEntry = feedbackData.find(entry => entry.id === recommendationId);
    
    if (existingEntry) {
      // Обновляем существующую запись
      existingEntry.timestamp = timestamp;
      existingEntry.action = action;
      
      if (action === 'click') {
        existingEntry.interacted = true;
      } else if (action === 'helpful' || action === 'not_helpful') {
        existingEntry.interacted = true;
        existingEntry.feedback = action;
      }
    } else {
      // Создаем новую запись с типизированными полями
      const newEntry: {
        id: string;
        recommendationType: AIRecommendationType;
        interacted: boolean;
        timestamp: string;
        action: string;
        feedback?: 'helpful' | 'not_helpful';
      } = {
        id: recommendationId,
        recommendationType,
        interacted: action === 'click' || action === 'helpful' || action === 'not_helpful',
        timestamp,
        action,
      };
      
      if (action === 'helpful' || action === 'not_helpful') {
        newEntry.feedback = action;
      }
      
      feedbackData.push(newEntry);
    }
    
    // Сохраняем обновленные данные
    await AsyncStorage.setItem(feedbackKey, JSON.stringify(feedbackData));
    
    // Отправляем аналитику, если доступно сетевое соединение
    if (this.networkStatus.isConnected) {
      this.dataProcessingQueue.push(async () => {
        await this.sendAnalyticsEvent('recommendation_interaction', {
          recommendationId,
          recommendationType,
          action,
          timestamp
        });
      });
    }
    
    return true;
  } catch (error) {
    console.error('Ошибка при записи взаимодействия с рекомендацией:', error);
    return false;
  }
}

/**
 * Получение оптимального времени для отправки уведомлений
 */
export async function analyzeOptimalNotificationTimes(
  this: any
): Promise<{
  generalHours: number[];
  categories: Record<string, number>;
}> {
  try {
    if (!this.userId) {
      return {
        generalHours: [9, 12, 18],
        categories: {}
      };
    }
    
    // Получаем данные обратной связи по рекомендациям
    const feedbackKey = `recommendation_feedback_${this.userId}`;
    const rawFeedback = await AsyncStorage.getItem(feedbackKey);
    
    if (!rawFeedback) {
      // Если данных нет, возвращаем стандартные значения
      return {
        generalHours: [9, 12, 18],
        categories: {}
      };
    }
    
    let feedbackData;
    try {
      feedbackData = JSON.parse(rawFeedback);
    } catch (error) {
      console.warn('Ошибка при парсинге данных обратной связи:', error);
      return {
        generalHours: [9, 12, 18],
        categories: {}
      };
    }
    
    // Получаем историю взаимодействий с уведомлениями
    const notificationHistoryKey = `notification_history_${this.userId}`;
    const rawHistory = await AsyncStorage.getItem(notificationHistoryKey);
    
    let notificationHistory = [];
    if (rawHistory) {
      try {
        notificationHistory = JSON.parse(rawHistory);
      } catch (error) {
        console.warn('Ошибка при парсинге истории уведомлений:', error);
      }
    }
    
    // Анализируем время взаимодействий
    const hourInteractions: Record<number, {
      count: number;
      helpful: number;
      total: number;
    }> = {};
    
    // Инициализируем счетчики для всех часов
    for (let i = 0; i < 24; i++) {
      hourInteractions[i] = { count: 0, helpful: 0, total: 0 };
    }
    
    // Счетчики по категориям
    const categoryHours: Record<string, Record<number, number>> = {};
    
    // Анализируем обратную связь
    for (const entry of feedbackData) {
      if (entry.interacted && entry.timestamp) {
        const date = new Date(entry.timestamp);
        const hour = date.getHours();
        
        // Увеличиваем счетчик для часа
        hourInteractions[hour].count++;
        
        // Если пользователь дал положительную обратную связь
        if (entry.feedback === 'helpful') {
          hourInteractions[hour].helpful++;
        }
        
        // Увеличиваем счетчик для категории
        const type = entry.recommendationType;
        if (!categoryHours[type]) {
          categoryHours[type] = {};
          for (let i = 0; i < 24; i++) {
            categoryHours[type][i] = 0;
          }
        }
        
        categoryHours[type][hour]++;
      }
    }
    
    // Анализируем историю уведомлений
    for (const notification of notificationHistory) {
      if (notification.receivedAt) {
        const date = new Date(notification.receivedAt);
        const hour = date.getHours();
        
        // Увеличиваем общее количество для часа
        hourInteractions[hour].total++;
        
        // Если статус "clicked", считаем взаимодействием
        if (notification.status === 'clicked') {
          hourInteractions[hour].count++;
        }
      }
    }
    
    // Определяем лучшие часы на основе частоты взаимодействий
    // и отношения полезных взаимодействий к общему количеству
    const hourScores: Array<[number, number]> = Object.entries(hourInteractions)
      .map(([hour, data]) => {
        // Рассчитываем score на основе количества взаимодействий и их эффективности
        const interactionRate = data.total > 0 ? data.count / data.total : 0;
        const helpfulnessRate = data.count > 0 ? data.helpful / data.count : 0;
        
        // Комбинированный скор (0-100)
        const score = (interactionRate * 50) + (helpfulnessRate * 50);
        
        return [parseInt(hour), score] as [number, number];
      })
      .sort((a, b) => b[1] - a[1]); // Сортируем по убыванию скора
    
    // Выбираем три лучших часа, но исключаем ночное время (0-6)
    const bestHours = hourScores
      .filter(([hour, _]) => hour >= 7 || hour <= 22)
      .slice(0, 3)
      .map(([hour, _]) => hour);
    
    // Если не удалось определить лучшие часы, используем стандартные
    if (bestHours.length < 3) {
      while (bestHours.length < 3) {
        const defaultHours = [9, 12, 18];
        for (const hour of defaultHours) {
          if (!bestHours.includes(hour)) {
            bestHours.push(hour);
            break;
          }
        }
      }
    }
    
    // Определяем лучший час для каждой категории
    const bestCategoryHours: Record<string, number> = {};
    
    for (const [category, hours] of Object.entries(categoryHours)) {
      const categorySorted = Object.entries(hours)
        .map(([hour, count]) => [parseInt(hour), count] as [number, number])
        .sort((a, b) => b[1] - a[1]); // Сортируем по убыванию количества
      
      if (categorySorted.length > 0 && categorySorted[0][1] > 0) {
        // Используем лучший час для категории
        bestCategoryHours[category] = categorySorted[0][0];
      } else {
        // Если нет данных, используем лучший общий час
        bestCategoryHours[category] = bestHours[0];
      }
    }
    
    return {
      generalHours: bestHours,
      categories: bestCategoryHours
    };
  } catch (error) {
    console.error('Ошибка при анализе оптимального времени для уведомлений:', error);
    return {
      generalHours: [9, 12, 18],
      categories: {}
    };
  }
}