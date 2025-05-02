/**
 * Методы безопасности для AIRecommendationEngine
 * 
 * Этот файл содержит методы, которые должны быть добавлены в класс AIRecommendationEngine
 * для обеспечения полной функциональности системы безопасности
 */

import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Используем тип SecurityEvent из AppTypes
import { SecurityEvent } from '../types/AppTypes';

/**
 * Записывает событие безопасности, сохраняет его в журнал и отправляет уведомления
 * при высоком уровне критичности
 */
export async function recordSecurityEvent(
  this: any,
  type: 'data_tampering' | 'unauthorized_access' | 'suspicious_activity' | 'brute_force' | 'user_management',
  details: string,
  severity: 'low' | 'medium' | 'high' | 'critical'
): Promise<boolean> {
  try {
    // Создаем запись события безопасности
    const event: SecurityEvent = {
      timestamp: new Date().toISOString(),
      type,
      details,
      severity,
      deviceInfo: await this.getDeviceInfo() || {
        deviceId: 'unknown',
        platform: Platform.OS,
        osVersion: Platform.Version.toString(),
        appVersion: '1.0.0',
        isEmulator: false
      }
    };

    // Сохраняем событие в памяти
    if (!this.securityEvents) {
      this.securityEvents = [];
    }
    this.securityEvents.push(event);

    // Ограничиваем размер кэша событий в памяти
    if (this.securityEvents.length > 100) {
      this.securityEvents = this.securityEvents.slice(-100);
    }

    // Сохраняем событие в файл
    await this.saveSecurityEventToFile(event);

    // Отправляем уведомление для критических и высоких уровней угрозы
    if (severity === 'critical' || severity === 'high') {
      const title = `${severity === 'critical' ? '⚠️ Критическая угроза' : '⚠️ Высокий риск'} безопасности`;
      const body = this.formatSecurityMessage(type, details);
      await this.sendSecurityNotification(title, body);
    }

    // Отправляем на сервер аналитики, если соединение доступно
    if (this.networkStatus && this.networkStatus.isConnected) {
      try {
        await this.sendAnalyticsEvent('security_event', { 
          type, 
          severity, 
          timestamp: event.timestamp,
          appVersion: event.deviceInfo.appVersion,
          platform: event.deviceInfo.platform
        });
      } catch (error) {
        console.warn('Не удалось отправить событие безопасности на сервер', error);
      }
    }

    // Журналируем в консоль
    if (severity === 'critical' || severity === 'high') {
      console.error(`[БЕЗОПАСНОСТЬ] ${severity.toUpperCase()}: ${type} - ${details}`);
    } else {
      console.warn(`[БЕЗОПАСНОСТЬ] ${severity.toUpperCase()}: ${type} - ${details}`);
    }

    return true;
  } catch (error) {
    console.error('Ошибка при записи события безопасности:', error);
    return false;
  }
}

/**
 * Сохранение события безопасности в файл
 */
export async function saveSecurityEventToFile(
  this: any,
  event: SecurityEvent
): Promise<void> {
  try {
    if (!this.dataDirectory) {
      await this.initializeDirectory();
    }
    
    // Путь к директории для событий безопасности
    const securityDir = `${this.dataDirectory}security/`;
    
    // Проверяем, существует ли директория
    const dirInfo = await FileSystem.getInfoAsync(securityDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(securityDir, { intermediates: true });
    }
    
    // Создаем имя файла на основе даты
    const date = new Date();
    const fileName = `security_log_${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}.log`;
    
    // Путь к файлу журнала
    const filePath = `${securityDir}${fileName}`;
    
    // Форматируем событие для записи
    const logEntry = `[${event.timestamp}] [${event.severity.toUpperCase()}] [${event.type}] ${event.details} | Device: ${event.deviceInfo.deviceId} (${event.deviceInfo.platform} ${event.deviceInfo.osVersion})\n`;
    
    // Проверяем, существует ли файл
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    
    if (fileInfo.exists) {
      // Если файл существует, сначала читаем его содержимое
      const existingContent = await FileSystem.readAsStringAsync(filePath);
      // Добавляем новую запись и записываем обратно
      await FileSystem.writeAsStringAsync(filePath, existingContent + logEntry, { encoding: FileSystem.EncodingType.UTF8 });
    } else {
      // Если файл не существует, создаем его
      await FileSystem.writeAsStringAsync(filePath, logEntry, { encoding: FileSystem.EncodingType.UTF8 });
    }
    
    // Для особо важных событий создаем отдельный файл с полной информацией
    if (event.severity === 'critical') {
      const criticalFilePath = `${securityDir}critical_${Date.now()}_${event.type}.json`;
      await FileSystem.writeAsStringAsync(
        criticalFilePath,
        JSON.stringify(event, null, 2),
        { encoding: FileSystem.EncodingType.UTF8 }
      );
    }
  } catch (error) {
    console.error('Ошибка при сохранении события безопасности в файл:', error);
  }
}

/**
 * Отправка уведомления о событии безопасности
 */
export async function sendSecurityNotification(
  this: any,
  title: string,
  body: string
): Promise<boolean> {
  try {
    // Проверяем, настроены ли уведомления
    if (!this.notificationsConfigured) {
      await this.configureNotifications();
    }
    
    // Запрашиваем разрешения, если еще не запрашивали
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      if (newStatus !== 'granted') {
        console.warn('Не удалось получить разрешение на отправку уведомлений.');
        return false;
      }
    }
    
    // Настройки уведомления
    const notificationContent = {
      title: title,
      body: body,
      data: {
        type: 'security',
        timestamp: new Date().toISOString()
      },
      ios: {
        sound: true,
        categoryId: 'security'
      },
      android: {
        channelId: 'security',
        color: '#FF0000',
        vibrate: true,
        priority: 'high'
      }
    };
    
    // Отправляем немедленное уведомление
    await Notifications.scheduleNotificationAsync({
      content: notificationContent,
      trigger: null // null trigger означает немедленную отправку
    });
    
    return true;
  } catch (error) {
    console.error('Ошибка при отправке уведомления о безопасности:', error);
    return false;
  }
}

/**
 * Получение истории событий безопасности
 */
export async function getSecurityEvents(
  this: any,
  limit: number = 50,
  severity?: 'low' | 'medium' | 'high' | 'critical',
  type?: 'data_tampering' | 'unauthorized_access' | 'suspicious_activity' | 'brute_force'
): Promise<SecurityEvent[]> {
  try {
    // Фильтруем события по параметрам
    let filteredEvents = [...this.securityEvents];
    
    if (severity) {
      filteredEvents = filteredEvents.filter(event => event.severity === severity);
    }
    
    if (type) {
      filteredEvents = filteredEvents.filter(event => event.type === type);
    }
    
    // Сортируем по времени (сначала новые)
    filteredEvents.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    // Применяем лимит
    return filteredEvents.slice(0, limit);
  } catch (error) {
    console.error('Ошибка при получении истории событий безопасности:', error);
    return [];
  }
}

/**
 * Загрузка событий безопасности из файлов
 */
export async function loadSecurityEventsFromFiles(
  this: any,
  days: number = 7
): Promise<SecurityEvent[]> {
  try {
    if (!this.dataDirectory) {
      await this.initializeDirectory();
    }
    
    // Путь к директории для событий безопасности
    const securityDir = `${this.dataDirectory}security/`;
    
    // Проверяем, существует ли директория
    const dirInfo = await FileSystem.getInfoAsync(securityDir);
    if (!dirInfo.exists) {
      return [];
    }
    
    // Получаем список файлов в директории
    const files = await FileSystem.readDirectoryAsync(securityDir);
    
    // Фильтруем файлы журналов безопасности
    const logFiles = files.filter(file => file.startsWith('security_log_'));
    
    // Определяем дату, с которой начинаем чтение
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const events: SecurityEvent[] = [];
    
    // Обрабатываем каждый файл журнала
    for (const file of logFiles) {
      try {
        // Извлекаем дату из имени файла
        const dateParts = file.replace('security_log_', '').replace('.log', '').split('-');
        const fileDate = new Date(
          parseInt(dateParts[0]),
          parseInt(dateParts[1]) - 1,
          parseInt(dateParts[2])
        );
        
        // Проверяем, входит ли дата файла в запрошенный период
        if (fileDate >= startDate) {
          // Читаем содержимое файла
          const content = await FileSystem.readAsStringAsync(`${securityDir}${file}`);
          
          // Разбиваем на строки и парсим события
          const lines = content.split('\n').filter(line => line.trim().length > 0);
          
          for (const line of lines) {
            try {
              // Парсим строку журнала
              // Формат: [timestamp] [SEVERITY] [type] details | Device: deviceId (platform version)
              const timestampMatch = line.match(/\[(.*?)\]/);
              const severityMatch = line.match(/\]\s*\[(.*?)\]/);
              const typeMatch = line.match(/\]\s*\[(.*?)\]\s*\[(.*?)\]/);
              
              if (timestampMatch && severityMatch && typeMatch) {
                const timestamp = timestampMatch[1];
                const severity = severityMatch[1].toLowerCase() as 'low' | 'medium' | 'high' | 'critical';
                const type = typeMatch[2] as 'data_tampering' | 'unauthorized_access' | 'suspicious_activity' | 'brute_force';
                
                // Извлекаем детали и информацию об устройстве
                const remainingText = line.replace(/\[.*?\]\s*\[.*?\]\s*\[.*?\]\s*/, '');
                const [details, deviceInfo] = remainingText.split(' | Device: ');
                
                // Создаем объект события
                const event: SecurityEvent = {
                  timestamp,
                  type,
                  details,
                  severity,
                  deviceInfo: {
                    deviceId: 'unknown',
                    platform: Platform.OS,
                    osVersion: 'unknown',
                    appVersion: 'unknown',
                    isEmulator: false
                  }
                };
                
                // Парсим информацию об устройстве, если она есть
                if (deviceInfo) {
                  const deviceIdMatch = deviceInfo.match(/(.*?)\s*\(/);
                  const platformVersionMatch = deviceInfo.match(/\((.*?)\s+(.*?)\)/);
                  
                  if (deviceIdMatch) {
                    event.deviceInfo.deviceId = deviceIdMatch[1];
                  }
                  
                  if (platformVersionMatch) {
                    event.deviceInfo.platform = platformVersionMatch[1];
                    event.deviceInfo.osVersion = platformVersionMatch[2];
                  }
                }
                
                events.push(event);
              }
            } catch (lineError) {
              console.warn('Ошибка при парсинге строки журнала безопасности:', lineError);
            }
          }
        }
      } catch (fileError) {
        console.warn(`Ошибка при обработке файла журнала безопасности ${file}:`, fileError);
      }
    }
    
    // Сортируем события по времени (сначала новые)
    events.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    // Обновляем локальный массив событий
    this.securityEvents = [...events, ...this.securityEvents]
      // Удаляем дубликаты по timestamp
      .filter((event, index, self) => 
        index === self.findIndex((e) => e.timestamp === event.timestamp)
      )
      // Берем только последние 100 событий
      .slice(0, 100);
    
    return events;
  } catch (error) {
    console.error('Ошибка при загрузке событий безопасности из файлов:', error);
    return [];
  }
} 