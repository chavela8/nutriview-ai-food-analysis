import { Platform, PermissionsAndroid } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import XLSX from 'xlsx';
import RealHealthIntegration, { HealthDataType, getTimeRangeForScope } from './RealHealthIntegration';

export interface ExportOptions {
  startDate: Date;
  endDate: Date;
  includeNutrition: boolean;
  includeActivity: boolean;
  includeWeight: boolean;
  includeWater: boolean;
  includeFoodDiary: boolean;
  format: 'csv' | 'xlsx' | 'json';
}

class DataExportService {
  // Получение разрешения на запись файлов (для Android)
  private async requestStoragePermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return true;
    }
    
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: 'Разрешение на сохранение файлов',
          message: 'NutriView AI требуется разрешение на сохранение файлов на ваше устройство.',
          buttonNeutral: 'Спросить позже',
          buttonNegative: 'Отмена',
          buttonPositive: 'OK'
        }
      );
      
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (error) {
      console.error('Ошибка при запросе разрешения:', error);
      return false;
    }
  }
  
  // Экспорт данных о здоровье и питании
  async exportData(options: ExportOptions): Promise<{success: boolean, filePath?: string, error?: string}> {
    // Запрашиваем разрешение для Android
    if (Platform.OS === 'android') {
      const hasPermission = await this.requestStoragePermission();
      if (!hasPermission) {
        return {
          success: false,
          error: 'Нет разрешения на сохранение файлов. Пожалуйста, предоставьте разрешение в настройках приложения.'
        };
      }
    }
    
    try {
      // Собираем все нужные данные
      const healthData: any = {};
      
      // Получение данных о питании
      if (options.includeNutrition) {
        const nutritionTypes: HealthDataType[] = [
          'nutrition.calories',
          'nutrition.protein',
          'nutrition.carbs',
          'nutrition.fat'
        ];
        
        for (const dataType of nutritionTypes) {
          const result = await RealHealthIntegration.queryHealthData(
            dataType, 
            options.startDate, 
            options.endDate
          );
          
          if (result.success && result.data) {
            healthData[dataType] = result.data;
          }
        }
      }
      
      // Получение данных об активности
      if (options.includeActivity) {
        const activityTypes: HealthDataType[] = [
          'steps',
          'distance',
          'activeEnergy',
          'workout'
        ];
        
        for (const dataType of activityTypes) {
          const result = await RealHealthIntegration.queryHealthData(
            dataType, 
            options.startDate, 
            options.endDate
          );
          
          if (result.success && result.data) {
            healthData[dataType] = result.data;
          }
        }
      }
      
      // Получение данных о весе
      if (options.includeWeight) {
        const result = await RealHealthIntegration.queryHealthData(
          'weight', 
          options.startDate, 
          options.endDate
        );
        
        if (result.success && result.data) {
          healthData.weight = result.data;
        }
      }
      
      // Получение данных о потреблении воды
      if (options.includeWater) {
        const result = await RealHealthIntegration.queryHealthData(
          'waterIntake', 
          options.startDate, 
          options.endDate
        );
        
        if (result.success && result.data) {
          healthData.waterIntake = result.data;
        }
      }
      
      // Получение данных из дневника питания
      if (options.includeFoodDiary) {
        const foodDiaryStr = await AsyncStorage.getItem('food_diary_entries');
        if (foodDiaryStr) {
          const allEntries = JSON.parse(foodDiaryStr);
          
          // Фильтрация по дате
          const startTimestamp = options.startDate.getTime();
          const endTimestamp = options.endDate.getTime();
          
          const filteredEntries = allEntries.filter((entry: any) => {
            const entryDate = new Date(entry.date).getTime();
            return entryDate >= startTimestamp && entryDate <= endTimestamp;
          });
          
          healthData.foodDiary = filteredEntries;
        }
      }
      
      // Генерация файла в зависимости от выбранного формата
      let fileContent: string;
      let fileName: string;
      let mimeType: string;
      
      const dateStr = new Date().toISOString().split('T')[0];
      
      if (options.format === 'json') {
        fileContent = JSON.stringify(healthData, null, 2);
        fileName = `nutriview_export_${dateStr}.json`;
        mimeType = 'application/json';
      } else if (options.format === 'csv') {
        fileContent = this.convertToCSV(healthData);
        fileName = `nutriview_export_${dateStr}.csv`;
        mimeType = 'text/csv';
      } else if (options.format === 'xlsx') {
        // Для XLSX нужно сначала создать временный файл
        const workbook = this.convertToXLSX(healthData);
        const tempFilePath = `${FileSystem.cacheDirectory}temp_export.xlsx`;
        
        // Конвертация рабочей книги в двоичный формат
        const wbout = XLSX.write(workbook, { type: 'binary', bookType: 'xlsx' });
        
        // Конвертация двоичного формата в строку base64
        const base64 = this.s2ab(wbout);
        
        // Сохранение во временный файл
        await FileSystem.writeAsStringAsync(tempFilePath, base64, { encoding: FileSystem.EncodingType.Base64 });
        
        // Публичное имя файла при экспорте
        fileName = `nutriview_export_${dateStr}.xlsx`;
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        
        // Теперь поделимся этим файлом
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(tempFilePath, {
            mimeType,
            dialogTitle: 'Экспорт данных NutriView AI',
            UTI: 'com.microsoft.excel.xlsx'
          });
          
          return {
            success: true,
            filePath: tempFilePath
          };
        } else {
          return {
            success: false,
            error: 'Функция обмена недоступна на этом устройстве'
          };
        }
      } else {
        return {
          success: false,
          error: 'Недопустимый формат экспорта'
        };
      }
      
      // Для JSON и CSV сохраняем файл и делимся им
      const filePath = `${FileSystem.cacheDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(filePath, fileContent);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType,
          dialogTitle: 'Экспорт данных NutriView AI',
          UTI: options.format === 'json' ? 'public.json' : 'public.comma-separated-values-text'
        });
        
        return {
          success: true,
          filePath
        };
      } else {
        return {
          success: false,
          error: 'Функция обмена недоступна на этом устройстве'
        };
      }
      
    } catch (error) {
      console.error('Ошибка при экспорте данных:', error);
      return {
        success: false,
        error: `Произошла ошибка при экспорте данных: ${error}`
      };
    }
  }
  
  // Конвертация данных в формат CSV
  private convertToCSV(data: any): string {
    let csvContent = '';
    
    // Обработка каждого типа данных отдельно
    for (const dataType in data) {
      csvContent += `# ${dataType}\n`;
      
      const entries = data[dataType];
      if (!entries || entries.length === 0) continue;
      
      // Получение заголовков CSV из ключей первого объекта
      const headers = Object.keys(entries[0]);
      csvContent += headers.join(',') + '\n';
      
      // Добавление строк данных
      for (const entry of entries) {
        const row = headers.map(header => {
          const value = entry[header];
          
          // Корректная обработка строк, чисел и объектов
          if (value === undefined || value === null) {
            return '';
          } else if (typeof value === 'string') {
            // Экранирование кавычек и заключение в кавычки, если строка содержит запятую
            return value.includes(',') ? `"${value.replace(/"/g, '""')}"` : value;
          } else if (typeof value === 'object') {
            // Конвертация объекта в JSON строку и заключение в кавычки
            return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
          } else {
            return String(value);
          }
        });
        
        csvContent += row.join(',') + '\n';
      }
      
      // Добавление пустой строки между разделами
      csvContent += '\n';
    }
    
    return csvContent;
  }
  
  // Конвертация данных в формат XLSX
  private convertToXLSX(data: any): any {
    // Создание новой рабочей книги
    const workbook = XLSX.utils.book_new();
    
    // Обработка каждого типа данных на отдельном листе
    for (const dataType in data) {
      const entries = data[dataType];
      if (!entries || entries.length === 0) continue;
      
      // Преобразование массива объектов в формат для XLSX
      const worksheet = XLSX.utils.json_to_sheet(entries);
      
      // Добавление листа в рабочую книгу
      // Для имени листа заменяем точки, т.к. они не допускаются в имени листа Excel
      const sheetName = dataType.replace(/\./g, '_').slice(0, 31); // Excel ограничивает имя листа 31 символом
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    }
    
    return workbook;
  }
  
  // Преобразование строки в ArrayBuffer для сохранения в формате XLSX
  private s2ab(s: string): string {
    const buf = new ArrayBuffer(s.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < s.length; i++) {
      view[i] = s.charCodeAt(i) & 0xFF;
    }
    
    // Конвертация ArrayBuffer в строку base64
    const binary = String.fromCharCode.apply(null, Array.from(new Uint8Array(buf)));
    return btoa(binary);
  }
}

export default new DataExportService();
