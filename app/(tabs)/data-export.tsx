import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import DataExportService, { ExportOptions } from '../../lib/DataExportService';
import { formatDate } from '../../utils/helpers';

const DataExportScreen: React.FC = () => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<Date>(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)); // 30 дней назад
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState<boolean>(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState<boolean>(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx' | 'json'>('csv');
  const [options, setOptions] = useState({
    includeNutrition: true,
    includeActivity: true,
    includeWeight: true,
    includeWater: true,
    includeFoodDiary: true
  });
  
  // Обновление отдельного параметра
  const updateOption = (key: keyof typeof options, value: boolean) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };
  
  // Обработчик изменения начальной даты
  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
    }
  };
  
  // Обработчик изменения конечной даты
  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };
  
  // Установка предопределенного периода
  const setDateRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    
    setStartDate(start);
    setEndDate(end);
  };
  
  // Экспорт данных
  const exportData = async () => {
    // Проверка, что есть хотя бы один выбранный тип данных
    if (!options.includeNutrition && 
        !options.includeActivity && 
        !options.includeWeight && 
        !options.includeWater && 
        !options.includeFoodDiary) {
      Alert.alert(
        'Ошибка',
        'Пожалуйста, выберите хотя бы один тип данных для экспорта.'
      );
      return;
    }
    
    // Проверка правильности дат
    if (startDate > endDate) {
      Alert.alert(
        'Ошибка',
        'Начальная дата не может быть позже конечной даты.'
      );
      return;
    }
    
    setLoading(true);
    
    try {
      const exportOptions: ExportOptions = {
        startDate,
        endDate,
        ...options,
        format: exportFormat
      };
      
      const result = await DataExportService.exportData(exportOptions);
      
      if (result.success) {
        Alert.alert(
          'Успех',
          'Данные успешно экспортированы и готовы для сохранения или отправки.'
        );
      } else {
        Alert.alert('Ошибка', result.error || 'Ошибка при экспорте данных.');
      }
    } catch (error) {
      console.error('Ошибка при экспорте данных:', error);
      Alert.alert(
        'Ошибка',
        'Произошла неожиданная ошибка при экспорте данных. Пожалуйста, попробуйте позже.'
      );
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Экспорт данных...
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Заголовок */}
          <View style={styles.header}>
            <MaterialCommunityIcons 
              name="export" 
              size={24} 
              color={theme.colors.primary} 
            />
            <Text style={[styles.headerText, { color: theme.colors.text }]}>
              Экспорт данных
            </Text>
          </View>
          
          {/* Дата экспорта */}
          <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
              Период экспорта
            </Text>
            
            <View style={styles.dateRangeButtonsContainer}>
              <TouchableOpacity
                style={[styles.dateRangeButton, { borderColor: theme.colors.border }]}
                onPress={() => setDateRange(7)}
              >
                <Text style={[styles.dateRangeButtonText, { color: theme.colors.text }]}>
                  7 дней
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.dateRangeButton, { borderColor: theme.colors.border }]}
                onPress={() => setDateRange(30)}
              >
                <Text style={[styles.dateRangeButtonText, { color: theme.colors.text }]}>
                  30 дней
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.dateRangeButton, { borderColor: theme.colors.border }]}
                onPress={() => setDateRange(90)}
              >
                <Text style={[styles.dateRangeButtonText, { color: theme.colors.text }]}>
                  90 дней
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.dateContainer}>
              <View style={styles.dateField}>
                <Text style={[styles.dateLabel, { color: theme.colors.textSecondary }]}>
                  Начало:
                </Text>
                <TouchableOpacity
                  style={[styles.dateButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <FontAwesome name="calendar" size={16} color={theme.colors.primary} style={styles.dateIcon} />
                  <Text style={[styles.dateButtonText, { color: theme.colors.text }]}>
                    {formatDate(startDate)}
                  </Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.dateField}>
                <Text style={[styles.dateLabel, { color: theme.colors.textSecondary }]}>
                  Конец:
                </Text>
                <TouchableOpacity
                  style={[styles.dateButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
                  onPress={() => setShowEndDatePicker(true)}
                >
                  <FontAwesome name="calendar" size={16} color={theme.colors.primary} style={styles.dateIcon} />
                  <Text style={[styles.dateButtonText, { color: theme.colors.text }]}>
                    {formatDate(endDate)}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Мы убираем компоненты DateTimePicker, так как они вызывают ошибки.
                В реальном приложении здесь должны быть модальные окна выбора даты */}
          </View>
          
          {/* Типы данных для экспорта */}
          <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
              Типы данных для экспорта
            </Text>
            
            <View style={styles.optionRow}>
              <View style={styles.optionLabelContainer}>
                <MaterialCommunityIcons 
                  name="food-apple" 
                  size={20} 
                  color={theme.colors.primary} 
                  style={styles.optionIcon} 
                />
                <Text style={[styles.optionLabel, { color: theme.colors.text }]}>
                  Питание и нутриенты
                </Text>
              </View>
              <Switch
                value={options.includeNutrition}
                onValueChange={(value) => updateOption('includeNutrition', value)}
                trackColor={{ false: theme.colors.border, true: theme.colors.primaryLight }}
                thumbColor={options.includeNutrition ? theme.colors.primary : '#f4f3f4'}
              />
            </View>
            
            <View style={styles.optionRow}>
              <View style={styles.optionLabelContainer}>
                <MaterialCommunityIcons 
                  name="run" 
                  size={20} 
                  color={theme.colors.primary} 
                  style={styles.optionIcon} 
                />
                <Text style={[styles.optionLabel, { color: theme.colors.text }]}>
                  Активность и калории
                </Text>
              </View>
              <Switch
                value={options.includeActivity}
                onValueChange={(value) => updateOption('includeActivity', value)}
                trackColor={{ false: theme.colors.border, true: theme.colors.primaryLight }}
                thumbColor={options.includeActivity ? theme.colors.primary : '#f4f3f4'}
              />
            </View>
            
            <View style={styles.optionRow}>
              <View style={styles.optionLabelContainer}>
                <MaterialCommunityIcons 
                  name="scale-bathroom" 
                  size={20} 
                  color={theme.colors.primary} 
                  style={styles.optionIcon} 
                />
                <Text style={[styles.optionLabel, { color: theme.colors.text }]}>
                  Вес и рост
                </Text>
              </View>
              <Switch
                value={options.includeWeight}
                onValueChange={(value) => updateOption('includeWeight', value)}
                trackColor={{ false: theme.colors.border, true: theme.colors.primaryLight }}
                thumbColor={options.includeWeight ? theme.colors.primary : '#f4f3f4'}
              />
            </View>
            
            <View style={styles.optionRow}>
              <View style={styles.optionLabelContainer}>
                <MaterialCommunityIcons 
                  name="cup-water" 
                  size={20} 
                  color={theme.colors.primary} 
                  style={styles.optionIcon} 
                />
                <Text style={[styles.optionLabel, { color: theme.colors.text }]}>
                  Потребление воды
                </Text>
              </View>
              <Switch
                value={options.includeWater}
                onValueChange={(value) => updateOption('includeWater', value)}
                trackColor={{ false: theme.colors.border, true: theme.colors.primaryLight }}
                thumbColor={options.includeWater ? theme.colors.primary : '#f4f3f4'}
              />
            </View>
            
            <View style={styles.optionRow}>
              <View style={styles.optionLabelContainer}>
                <MaterialCommunityIcons 
                  name="notebook" 
                  size={20} 
                  color={theme.colors.primary} 
                  style={styles.optionIcon} 
                />
                <Text style={[styles.optionLabel, { color: theme.colors.text }]}>
                  Пищевой дневник
                </Text>
              </View>
              <Switch
                value={options.includeFoodDiary}
                onValueChange={(value) => updateOption('includeFoodDiary', value)}
                trackColor={{ false: theme.colors.border, true: theme.colors.primaryLight }}
                thumbColor={options.includeFoodDiary ? theme.colors.primary : '#f4f3f4'}
              />
            </View>
          </View>
          
          {/* Формат экспорта */}
          <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
              Формат экспорта
            </Text>
            
            <View style={styles.formatButtonsContainer}>
              <TouchableOpacity
                style={[
                  styles.formatButton,
                  exportFormat === 'csv' && { backgroundColor: theme.colors.primary },
                  exportFormat !== 'csv' && { backgroundColor: theme.colors.card, borderColor: theme.colors.border }
                ]}
                onPress={() => setExportFormat('csv')}
              >
                <Text 
                  style={[
                    styles.formatButtonText, 
                    { color: exportFormat === 'csv' ? '#fff' : theme.colors.text }
                  ]}
                >
                  CSV
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.formatButton,
                  exportFormat === 'xlsx' && { backgroundColor: theme.colors.primary },
                  exportFormat !== 'xlsx' && { backgroundColor: theme.colors.card, borderColor: theme.colors.border }
                ]}
                onPress={() => setExportFormat('xlsx')}
              >
                <Text 
                  style={[
                    styles.formatButtonText, 
                    { color: exportFormat === 'xlsx' ? '#fff' : theme.colors.text }
                  ]}
                >
                  XLSX
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.formatButton,
                  exportFormat === 'json' && { backgroundColor: theme.colors.primary },
                  exportFormat !== 'json' && { backgroundColor: theme.colors.card, borderColor: theme.colors.border }
                ]}
                onPress={() => setExportFormat('json')}
              >
                <Text 
                  style={[
                    styles.formatButtonText, 
                    { color: exportFormat === 'json' ? '#fff' : theme.colors.text }
                  ]}
                >
                  JSON
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.formatInfoContainer}>
              <MaterialCommunityIcons 
                name="information-outline" 
                size={20} 
                color={theme.colors.textSecondary} 
                style={styles.infoIcon} 
              />
              <Text style={[styles.formatInfoText, { color: theme.colors.textSecondary }]}>
                {exportFormat === 'csv' && 'CSV-формат подходит для импорта в большинство программ обработки данных и электронных таблиц.'}
                {exportFormat === 'xlsx' && 'XLSX-формат оптимизирован для Microsoft Excel и других современных табличных процессоров.'}
                {exportFormat === 'json' && 'JSON-формат удобен для программной обработки и интеграции с другими приложениями.'}
              </Text>
            </View>
          </View>
          
          {/* Кнопки быстрого доступа */}
          <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
              Быстрый экспорт
            </Text>
            
            <View style={styles.quickExportContainer}>
              <TouchableOpacity
                style={[styles.quickExportButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => {
                  setDateRange(30);
                  setExportFormat('csv');
                  setOptions({
                    includeNutrition: true,
                    includeActivity: true,
                    includeWeight: true,
                    includeWater: true,
                    includeFoodDiary: true
                  });
                  setTimeout(exportData, 300);
                }}
              >
                <MaterialCommunityIcons 
                  name="file-export" 
                  size={24} 
                  color="#fff" 
                  style={styles.quickExportIcon} 
                />
                <Text style={styles.quickExportText}>
                  Экспорт всех данных
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.quickExportButton, { backgroundColor: theme.colors.secondary }]}
                onPress={() => {
                  setDateRange(30);
                  setExportFormat('csv');
                  setOptions({
                    includeNutrition: true,
                    includeActivity: false,
                    includeWeight: false,
                    includeWater: false,
                    includeFoodDiary: true
                  });
                  setTimeout(exportData, 300);
                }}
              >
                <MaterialCommunityIcons 
                  name="food-apple" 
                  size={24} 
                  color="#fff" 
                  style={styles.quickExportIcon} 
                />
                <Text style={styles.quickExportText}>
                  Только питание
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Кнопка экспорта */}
          <TouchableOpacity
            style={[styles.exportButton, { backgroundColor: theme.colors.primary }]}
            onPress={exportData}
          >
            <MaterialCommunityIcons 
              name="export" 
              size={24} 
              color="#fff" 
              style={styles.exportButtonIcon} 
            />
            <Text style={styles.exportButtonText}>
              Экспортировать данные
            </Text>
          </TouchableOpacity>
          
          <Text style={[styles.disclaimer, { color: theme.colors.textSecondary }]}>
            Экспортированные данные не содержат личной информации и могут быть использованы только в образовательных и исследовательских целях.
          </Text>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  dateRangeButtonsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  dateRangeButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    marginRight: 8,
  },
  dateRangeButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dateContainer: {
    flexDirection: 'column',
  },
  dateField: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateLabel: {
    fontSize: 16,
    width: 70,
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  dateButtonText: {
    fontSize: 16,
  },
  dateIcon: {
    marginRight: 8,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  optionLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    marginRight: 12,
  },
  optionLabel: {
    fontSize: 16,
  },
  formatButtonsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  formatButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
  },
  formatButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  formatInfoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  formatInfoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  quickExportContainer: {
    flexDirection: 'row',
  },
  quickExportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  quickExportIcon: {
    marginRight: 8,
  },
  quickExportText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  exportButtonIcon: {
    marginRight: 8,
  },
  exportButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  disclaimer: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
});

export default DataExportScreen;
