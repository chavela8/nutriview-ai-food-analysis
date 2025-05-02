import BackgroundFetch from 'react-native-background-fetch';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RealHealthIntegration, { HealthDataType } from './RealHealthIntegration';

class BackgroundSync {
  async configure() {
    try {
      // Настройка фоновой задачи
      const status = await BackgroundFetch.configure({
        minimumFetchInterval: 15, // Минимальный интервал в минутах
        stopOnTerminate: false,
        enableHeadless: true,
        startOnBoot: true,
        requiredNetworkType: BackgroundFetch.NETWORK_TYPE_ANY
      }, this.onBackgroundFetch, this.onTimeout);
      
      console.log('[BackgroundSync] Статус конфигурации:', status);
      
      // Регистрация задачи синхронизации здоровья
      BackgroundFetch.scheduleTask({
        taskId: 'health-sync',
        delay: 1000, // Задержка в мс
        periodic: true
      });
    } catch (error) {
      console.error('[BackgroundSync] Ошибка конфигурации:', error);
    }
  }

  async onBackgroundFetch() {
    console.log('[BackgroundSync] Запуск фоновой синхронизации');
    
    try {
      // Проверка настроек синхронизации
      const syncSettingsStr = await AsyncStorage.getItem('health_sync_settings');
      if (!syncSettingsStr) {
        console.log('[BackgroundSync] Настройки синхронизации не найдены');
        BackgroundFetch.finish(BackgroundFetch.FETCH_RESULT_NO_DATA);
        return;
      }
      
      const syncSettings = JSON.parse(syncSettingsStr);
      if (!syncSettings.autoSync) {
        console.log('[BackgroundSync] Автосинхронизация отключена в настройках');
        BackgroundFetch.finish(BackgroundFetch.FETCH_RESULT_NO_DATA);
        return;
      }
      
      // Получение диапазона времени для синхронизации
      const lastSyncDateStr = await AsyncStorage.getItem('last_health_sync_date');
      let startDate: Date;
      
      if (lastSyncDateStr) {
        startDate = new Date(lastSyncDateStr);
      } else {
        // Если синхронизация ранее не выполнялась, используем последние 24 часа
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 1);
      }
      
      const endDate = new Date();
      
      console.log(`[BackgroundSync] Синхронизация данных с ${startDate.toISOString()} по ${endDate.toISOString()}`);
      
      // Определение типов данных для синхронизации
      const enabledDataTypes: HealthDataType[] = [];
      
      if (syncSettings.syncSteps) enabledDataTypes.push('steps');
      if (syncSettings.syncActivity) enabledDataTypes.push('activeEnergy');
      if (syncSettings.syncWeight) enabledDataTypes.push('weight');
      if (syncSettings.syncWater) enabledDataTypes.push('waterIntake');
      if (syncSettings.syncNutrition) {
        enabledDataTypes.push('nutrition.calories');
        enabledDataTypes.push('nutrition.protein');
        enabledDataTypes.push('nutrition.carbs');
        enabledDataTypes.push('nutrition.fat');
      }
      
      // Получение данных для каждого типа
      for (const dataType of enabledDataTypes) {
        const result = await RealHealthIntegration.queryHealthData(dataType, startDate, endDate);
        
        if (result.success && result.data) {
          // Здесь можно сохранить полученные данные в локальную базу данных
          console.log(`[BackgroundSync] Получено ${result.data.length} записей для ${dataType}`);
          
          // Пример сохранения в AsyncStorage (для продакшн лучше использовать SQLite)
          const key = `health_data_${dataType}`;
          const existingDataStr = await AsyncStorage.getItem(key);
          let existingData = existingDataStr ? JSON.parse(existingDataStr) : [];
          
          // Объединение существующих и новых данных
          const newData = [...existingData, ...result.data];
          
          // Сохранение данных
          await AsyncStorage.setItem(key, JSON.stringify(newData));
        } else {
          console.error(`[BackgroundSync] Ошибка получения данных для ${dataType}:`, result.error);
        }
      }
      
      // Обновление времени последней синхронизации
      await AsyncStorage.setItem('last_health_sync_date', endDate.toISOString());
      
      // Сигнал о успешном завершении
      BackgroundFetch.finish(BackgroundFetch.FETCH_RESULT_NEW_DATA);
    } catch (error) {
      console.error('[BackgroundSync] Ошибка синхронизации:', error);
      BackgroundFetch.finish(BackgroundFetch.FETCH_RESULT_FAILED);
    }
  }

  onTimeout() {
    console.warn('[BackgroundSync] Таймаут фоновой синхронизации');
    BackgroundFetch.finish(BackgroundFetch.FETCH_RESULT_TIMEOUT);
  }
}

export default new BackgroundSync();
