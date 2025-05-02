/**
 * Мок-модули для замены внешних зависимостей
 * Используются для разработки и тестирования без реальных модулей
 */

import { MockExports, NetInfoState } from '../types/AppTypes';

/**
 * Мок для модуля expo-crypto
 */
export const Crypto: MockExports['Crypto'] = {
  getRandomBytesAsync: async (size: number): Promise<Uint8Array> => {
    // Создаем случайный массив байтов заданного размера
    const array = new Uint8Array(size);
    for (let i = 0; i < size; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  },
  
  digestStringAsync: async (algorithm: string, data: string): Promise<string> => {
    // Простая имитация хеширования
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      hash = ((hash << 5) - hash) + data.charCodeAt(i);
      hash |= 0; // Преобразуем в 32-битное целое
    }
    
    // Преобразуем число в шестнадцатеричную строку
    const hexHash = Math.abs(hash).toString(16).padStart(8, '0');
    return `${algorithm}:${hexHash}`;
  }
};

/**
 * Мок для модуля @react-native-community/netinfo
 */
export const NetInfo: MockExports['NetInfo'] = {
  addEventListener: (callback: (state: NetInfoState) => void) => {
    // Имитируем состояние сети
    const mockState: NetInfoState = {
      type: 'wifi',
      isConnected: true,
      isInternetReachable: true,
      details: {
        isConnectionExpensive: false,
        cellularGeneration: '4g'
      }
    };
    
    // Вызываем callback с мок-данными
    setTimeout(() => callback(mockState), 0);
    
    // Возвращаем функцию для отписки
    return () => {
      // Ничего не делаем при отписке
    };
  },
  
  fetch: async (): Promise<NetInfoState> => {
    // Возвращаем фиксированное состояние сети
    return {
      type: 'wifi',
      isConnected: true,
      isInternetReachable: true,
      details: {
        isConnectionExpensive: false,
        cellularGeneration: '4g'
      }
    };
  }
};

/**
 * Мок для модуля expo-device
 */
export const Device: MockExports['Device'] = {
  isDevice: true,
  brand: 'Mock',
  manufacturer: 'MockCompany',
  modelName: 'MockPhone',
  modelId: 'MP-2023',
  designName: 'mockdesign',
  productName: 'mockproduct',
  deviceYearClass: 2023,
  totalMemory: 4096, // 4GB
  supportedCpuArchitectures: ['arm64'],
  osName: 'MockOS',
  osVersion: '16.0.0',
  osBuildId: 'Mock2023A',
  osInternalBuildId: '20A123',
  osBuildFingerprint: 'mock/MP-2023/MockPhone:16.0.0/20A123/mock:user/release-keys',
  platformApiLevel: 33,
  deviceName: 'MockPhone',
  
  getDeviceTypeAsync: async (): Promise<string> => {
    return 'PHONE';
  },
  
  isRootedExperimentalAsync: async (): Promise<boolean> => {
    return false;
  }
};

/**
 * Мок для модуля expo-notifications
 */
export const Notifications = {
  AndroidImportance: {
    MIN: 1,
    LOW: 2,
    DEFAULT: 3,
    HIGH: 4,
    MAX: 5
  },
  
  AndroidNotificationVisibility: {
    PRIVATE: 0,
    PUBLIC: 1,
    SECRET: -1
  },
  
  setNotificationHandler: (handler: any) => {
    console.log('Установлен обработчик уведомлений', handler);
  },
  
  scheduleNotificationAsync: async (options: any): Promise<string> => {
    console.log('Запланировано уведомление:', options);
    return `notification-${Date.now()}`;
  },
  
  cancelScheduledNotificationAsync: async (identifier: string): Promise<void> => {
    console.log('Отменено запланированное уведомление:', identifier);
  },
  
  cancelAllScheduledNotificationsAsync: async (): Promise<void> => {
    console.log('Отменены все запланированные уведомления');
  },
  
  getPermissionsAsync: async (): Promise<{ status: string, ios?: any, android?: any }> => {
    return { status: 'granted' };
  },
  
  requestPermissionsAsync: async (options?: any): Promise<{ status: string, ios?: any, android?: any }> => {
    console.log('Запрошены разрешения для уведомлений:', options);
    return { status: 'granted' };
  },
  
  getExpoPushTokenAsync: async (options?: any): Promise<{ data: string, type: string }> => {
    const token = `ExponentPushToken[${Math.random().toString(36).substring(2, 15)}]`;
    return { data: token, type: 'expo' };
  },
  
  getDevicePushTokenAsync: async (options?: any): Promise<{ data: string, type: string }> => {
    const token = Math.random().toString(36).substring(2, 15);
    return { data: token, type: 'fcm' };
  },
  
  addNotificationReceivedListener: (listener: (notification: any) => void): { remove: () => void } => {
    console.log('Добавлен слушатель получения уведомлений');
    
    // Имитация получения уведомления через 5 секунд
    setTimeout(() => {
      try {
        const mockNotification = {
          date: new Date().getTime(),
          request: {
            identifier: `test-notification-${Date.now()}`,
            content: {
              title: 'Тестовое уведомление',
              body: 'Это тестовое уведомление от мок-модуля',
              data: {
                source: 'test',
                id: `test-${Date.now()}`
              },
              sound: true,
              badge: 1
            },
            trigger: {
              type: 'push',
              remoteMessage: {
                from: 'test-sender'
              }
            }
          }
        };
        
        listener(mockNotification);
      } catch (e) {
        console.error('Ошибка при эмуляции получения уведомления', e);
      }
    }, 5000);
    
    return {
      remove: () => {
        console.log('Удален слушатель получения уведомлений');
      }
    };
  },
  
  addNotificationResponseReceivedListener: (listener: (response: any) => void): { remove: () => void } => {
    console.log('Добавлен слушатель ответов на уведомления');
    
    // Имитация ответа на уведомление через 10 секунд
    setTimeout(() => {
      try {
        const mockResponse = {
          notification: {
            date: new Date().getTime(),
            request: {
              identifier: `test-notification-response-${Date.now()}`,
              content: {
                title: 'Тестовое уведомление для ответа',
                body: 'Это тестовое уведомление, на которое пользователь ответил',
                data: {
                  source: 'recommendation',
                  recommendationId: `rec-${Date.now()}`,
                  recommendationType: 'nutrition'
                },
                sound: true,
                badge: 1
              },
              trigger: {
                type: 'push'
              }
            }
          },
          actionIdentifier: 'view',
          userText: null,
          userInfo: {}
        };
        
        listener(mockResponse);
      } catch (e) {
        console.error('Ошибка при эмуляции ответа на уведомление', e);
      }
    }, 10000);
    
    return {
      remove: () => {
        console.log('Удален слушатель ответов на уведомления');
      }
    };
  },
  
  removeNotificationSubscription: (subscription: { remove: () => void }): void => {
    if (subscription && subscription.remove) {
      subscription.remove();
    }
  },
  
  setNotificationChannelAsync: async (channelId: string, channel: any): Promise<boolean> => {
    console.log(`Установлен канал уведомлений '${channelId}':`, channel);
    return true;
  },
  
  setNotificationChannelGroupAsync: async (groupId: string, group: any): Promise<boolean> => {
    console.log(`Установлена группа каналов уведомлений '${groupId}':`, group);
    return true;
  },
  
  setNotificationCategoryAsync: async (categoryId: string, actions: any[]): Promise<boolean> => {
    console.log(`Установлена категория уведомлений '${categoryId}':`, actions);
    return true;
  },
  
  // Дополнительные методы, которые могут быть нужны
  getBadgeCountAsync: async (): Promise<number> => {
    return 0;
  },
  
  setBadgeCountAsync: async (count: number): Promise<boolean> => {
    console.log(`Установлен счетчик значка: ${count}`);
    return true;
  },
  
  dismissAllNotificationsAsync: async (): Promise<void> => {
    console.log('Все уведомления закрыты');
  },
  
  dismissNotificationAsync: async (identifier: string): Promise<void> => {
    console.log(`Уведомление ${identifier} закрыто`);
  },
  
  getAllScheduledNotificationsAsync: async (): Promise<any[]> => {
    return []; // Возвращаем пустой массив запланированных уведомлений
  }
};

/**
 * Мок для модуля react-native Build (для Android)
 */
export const Build = {
  FINGERPRINT: 'mock/MP-2023/MockPhone:16.0.0/20A123/mock:user/release-keys',
  MANUFACTURER: 'MockCompany',
  MODEL: 'MockPhone',
  VERSION: {
    SDK_INT: 33,
    RELEASE: '13.0',
    CODENAME: 'REL'
  },
  BRAND: 'Mock',
  DEVICE: 'mockdevice',
  PRODUCT: 'mockproduct',
  HARDWARE: 'mockvm',
  ID: 'MOCK.123456.789',
  TYPE: 'user',
  TAGS: 'release-keys',
  USER: 'mock'
};

/**
 * Мок для модуля expo-constants
 */
export const Constants = {
  default: {
    manifest: {
      name: "NutriView AI",
      version: "1.0.0",
      sdkVersion: "45.0.0",
      ios: {
        buildNumber: "1",
        supportsTablet: true
      },
      android: {
        versionCode: 1,
        adaptiveIcon: {
          foregroundImage: "./assets/adaptive-icon.png",
          backgroundColor: "#FFFFFF"
        }
      }
    },
    platform: {
      ios: {
        buildNumber: "1",
      },
      android: {
        versionCode: 1
      }
    },
    sessionId: `session-${Date.now()}`,
    statusBarHeight: 20,
    deviceName: "Mock Device",
    deviceYearClass: 2023,
    isDevice: true,
    systemFonts: ["Roboto", "Arial", "Helvetica"],
    expoVersion: "45.0.0"
  },
  
  // Добавляем методы и свойства, которые могут использоваться напрямую
  manifest: {
    name: "NutriView AI",
    version: "1.0.0",
    sdkVersion: "45.0.0",
    ios: {
      buildNumber: "1",
      supportsTablet: true
    },
    android: {
      versionCode: 1,
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#FFFFFF"
      }
    }
  },
  platform: {
    ios: {
      buildNumber: "1",
    },
    android: {
      versionCode: 1
    }
  },
  sessionId: `session-${Date.now()}`,
  statusBarHeight: 20,
  deviceName: "Mock Device",
  deviceYearClass: 2023,
  isDevice: true,
  systemFonts: ["Roboto", "Arial", "Helvetica"],
  expoVersion: "45.0.0"
};

/**
 * Мок для модуля expo-file-system
 */
export const FileSystem = {
  documentDirectory: 'file:///mock/documents/',
  cacheDirectory: 'file:///mock/cache/',
  
  getInfoAsync: async (fileUri: string): Promise<{ exists: boolean, isDirectory?: boolean, size?: number, modificationTime?: number, uri?: string }> => {
    // Моделируем некоторые пути как существующие для тестирования
    if (fileUri.includes('documents') || fileUri.includes('cache')) {
      return { exists: true, isDirectory: fileUri.endsWith('/'), size: 1024, modificationTime: Date.now(), uri: fileUri };
    }
    return { exists: false };
  },
  
  readDirectoryAsync: async (dirUri: string): Promise<string[]> => {
    // Возвращаем мок-файлы для тестирования
    if (dirUri.includes('security')) {
      return ['security_2023-01-01.json', 'security_2023-01-02.json', 'security_2023-01-03.json'];
    } else if (dirUri.includes('recommendations')) {
      return ['recommendations_2023-01.json', 'user_feedback.json'];
    } else if (dirUri.includes('analytics')) {
      return ['analytics_events.json', 'session_data.json'];
    }
    return [];
  },
  
  makeDirectoryAsync: async (dirUri: string, options?: { intermediates?: boolean }): Promise<void> => {
    console.log(`Создана директория: ${dirUri}`, options);
  },
  
  readAsStringAsync: async (fileUri: string): Promise<string> => {
    // Возвращаем разные данные в зависимости от URI файла
    if (fileUri.includes('security')) {
      return JSON.stringify([
        {
          timestamp: new Date().toISOString(),
          type: 'data_tampering',
          details: 'Тестовое событие безопасности',
          deviceInfo: {
            deviceId: 'mock-device-123',
            platform: 'android',
            osVersion: '13.0',
            appVersion: '1.0.0',
            isEmulator: true
          },
          severity: 'medium'
        }
      ]);
    } else if (fileUri.includes('recommendations')) {
      return JSON.stringify([
        {
          id: 'rec-123',
          type: 'nutrition',
          title: 'Тестовая рекомендация',
          description: 'Описание тестовой рекомендации',
          priority: 'medium',
          created: new Date().toISOString()
        }
      ]);
    } else if (fileUri.includes('analytics')) {
      return JSON.stringify([
        {
          eventType: 'app_open',
          timestamp: new Date().toISOString(),
          userId: 'test-user',
          sessionId: 'test-session'
        }
      ]);
    }
    return '{}';
  },
  
  writeAsStringAsync: async (fileUri: string, contents: string): Promise<void> => {
    console.log(`Записан файл: ${fileUri}`, contents.substring(0, 50) + (contents.length > 50 ? '...' : ''));
  },
  
  deleteAsync: async (fileUri: string, options?: { idempotent?: boolean }): Promise<void> => {
    console.log(`Удален файл: ${fileUri}`, options);
  },
  
  copyAsync: async (options: { from: string, to: string }): Promise<void> => {
    console.log(`Копирование файла из ${options.from} в ${options.to}`);
  },
  
  moveAsync: async (options: { from: string, to: string }): Promise<void> => {
    console.log(`Перемещение файла из ${options.from} в ${options.to}`);
  },
  
  downloadAsync: async (uri: string, fileUri: string, options?: any): Promise<{ uri: string, status: number, headers?: any, md5?: string }> => {
    console.log(`Скачивание файла с ${uri} в ${fileUri}`, options);
    return { uri: fileUri, status: 200 };
  }
};

// Общий экспорт всех моков
export default {
  Crypto,
  NetInfo,
  Device,
  Notifications,
  Build,
  Constants,
  FileSystem
}; 