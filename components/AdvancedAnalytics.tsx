import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { ChevronLeft, ChevronRight, Calendar, BarChart2, LineChart as LineChartIcon } from 'lucide-react-native';

// Типы представлений аналитики
type AnalyticsView = 'weekly' | 'monthly';
type ChartType = 'line' | 'bar';

// Типы данных для аналитики
interface NutritionData {
  calories: number;
  protein: number; // в граммах
  carbs: number; // в граммах
  fat: number; // в граммах
  date: string; // ISO формат даты
}

// Пропсы компонента
interface AdvancedAnalyticsProps {
  data: NutritionData[];
  loading?: boolean;
  theme: any; // Тема оформления
  initialView?: AnalyticsView;
  onPeriodChange?: (startDate: string, endDate: string) => void;
}

const AdvancedAnalytics: React.FC<AdvancedAnalyticsProps> = ({
  data,
  loading = false,
  theme,
  initialView = 'weekly',
  onPeriodChange,
}) => {
  const [view, setView] = useState<AnalyticsView>(initialView);
  const [chartType, setChartType] = useState<ChartType>('line');
  const [currentPeriodStart, setCurrentPeriodStart] = useState<Date>(new Date());
  const [processedData, setProcessedData] = useState<{
    labels: string[];
    datasets: {
      data: number[];
      color?: (opacity: number) => string;
    }[];
    legend: string[];
  }>({ labels: [], datasets: [], legend: [] });

  // Ширина экрана для графиков
  const screenWidth = Dimensions.get('window').width - 32;

  // Обрабатываем данные при изменении view, currentPeriodStart или самих данных
  useEffect(() => {
    if (loading || !data.length) return;
    
    const { labels, datasets, legend } = processDataForChart(data, view, currentPeriodStart);
    setProcessedData({ labels, datasets, legend });
    
    // Если передан колбэк для изменения периода
    if (onPeriodChange) {
      const endDate = getEndDate(currentPeriodStart, view);
      onPeriodChange(formatDateForAPI(currentPeriodStart), formatDateForAPI(endDate));
    }
  }, [data, view, currentPeriodStart, loading]);

  // Переключение на предыдущий период
  const goToPreviousPeriod = () => {
    const newDate = new Date(currentPeriodStart);
    if (view === 'weekly') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentPeriodStart(newDate);
  };

  // Переключение на следующий период
  const goToNextPeriod = () => {
    const newDate = new Date(currentPeriodStart);
    if (view === 'weekly') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    
    // Не позволяем переключиться на будущие периоды
    if (newDate > new Date()) return;
    
    setCurrentPeriodStart(newDate);
  };

  // Форматирование даты для заголовка периода
  const formatPeriodHeader = (): string => {
    if (view === 'weekly') {
      const endDate = getEndDate(currentPeriodStart, 'weekly');
      return `${formatDate(currentPeriodStart)} - ${formatDate(endDate)}`;
    } else {
      return new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(currentPeriodStart);
    }
  };

  // Получение конечной даты периода
  const getEndDate = (startDate: Date, viewType: AnalyticsView): Date => {
    const endDate = new Date(startDate);
    if (viewType === 'weekly') {
      endDate.setDate(endDate.getDate() + 6);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0); // Последний день месяца
    }
    return endDate;
  };

  // Форматирование даты в читаемый вид
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'numeric' });
  };

  // Форматирование даты для API
  const formatDateForAPI = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  // Обработка данных для графика
  const processDataForChart = (
    nutritionData: NutritionData[],
    viewType: AnalyticsView,
    startDate: Date
  ) => {
    let labels: string[] = [];
    let caloriesData: number[] = [];
    let proteinData: number[] = [];
    let carbsData: number[] = [];
    let fatData: number[] = [];
    
    const endDate = getEndDate(startDate, viewType);
    
    if (viewType === 'weekly') {
      // Создаем массив дат для недели
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        labels.push(date.toLocaleDateString('ru-RU', { day: 'numeric' }));
        
        // Ищем данные для этой даты
        const dateStr = formatDateForAPI(date);
        const dayData = nutritionData.find(d => d.date === dateStr);
        
        caloriesData.push(dayData?.calories || 0);
        proteinData.push(dayData?.protein || 0);
        carbsData.push(dayData?.carbs || 0);
        fatData.push(dayData?.fat || 0);
      }
    } else {
      // Создаем массив недель для месяца
      const daysInMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate();
      const weeks: { [key: string]: NutritionData } = {};
      
      for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(startDate.getFullYear(), startDate.getMonth(), i);
        const weekNum = Math.ceil(i / 7);
        const weekLabel = `Неделя ${weekNum}`;
        
        if (!labels.includes(weekLabel)) {
          labels.push(weekLabel);
          weeks[weekLabel] = {
            calories: 0, protein: 0, carbs: 0, fat: 0, date: ''
          };
        }
        
        // Ищем данные для этой даты
        const dateStr = formatDateForAPI(date);
        const dayData = nutritionData.find(d => d.date === dateStr);
        
        if (dayData) {
          weeks[weekLabel].calories += dayData.calories;
          weeks[weekLabel].protein += dayData.protein;
          weeks[weekLabel].carbs += dayData.carbs;
          weeks[weekLabel].fat += dayData.fat;
        }
      }
      
      // Преобразуем объект недель в массивы для графиков
      labels.forEach(weekLabel => {
        caloriesData.push(weeks[weekLabel].calories);
        proteinData.push(weeks[weekLabel].protein);
        carbsData.push(weeks[weekLabel].carbs);
        fatData.push(weeks[weekLabel].fat);
      });
    }
    
    // Формируем данные для графика
    return {
      labels,
      datasets: [
        {
          data: caloriesData,
          color: (opacity = 1) => `rgba(255, 99, 71, ${opacity})`,
        },
        {
          data: proteinData,
          color: (opacity = 1) => `rgba(54, 162, 235, ${opacity})`,
        },
        {
          data: carbsData,
          color: (opacity = 1) => `rgba(75, 192, 192, ${opacity})`,
        },
        {
          data: fatData,
          color: (opacity = 1) => `rgba(255, 206, 86, ${opacity})`,
        }
      ],
      legend: ['Калории (x10)', 'Белки (г)', 'Углеводы (г)', 'Жиры (г)']
    };
  };

  // Конфигурация для графиков
  const chartConfig = {
    backgroundGradientFrom: theme.colors.card,
    backgroundGradientTo: theme.colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => theme.dark 
      ? `rgba(255, 255, 255, ${opacity})` 
      : `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => theme.dark 
      ? `rgba(255, 255, 255, ${opacity})` 
      : `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '5',
      strokeWidth: '2',
    },
  };

  return (
    <View style={styles.container}>
      {/* Переключатель периодов */}
      <View style={styles.periodSelector}>
        <TouchableOpacity 
          style={styles.periodNavigationButton}
          onPress={goToPreviousPeriod}
        >
          <ChevronLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        
        <View style={styles.periodHeaderContainer}>
          <Calendar size={16} color={theme.colors.primary} style={styles.periodIcon} />
          <Text style={[styles.periodHeader, { color: theme.colors.text }]}>
            {formatPeriodHeader()}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.periodNavigationButton}
          onPress={goToNextPeriod}
          disabled={
            view === 'weekly' 
              ? addDays(currentPeriodStart, 7) > new Date() 
              : addMonths(currentPeriodStart, 1) > new Date()
          }
        >
          <ChevronRight size={24} color={
            (view === 'weekly' && addDays(currentPeriodStart, 7) > new Date()) ||
            (view === 'monthly' && addMonths(currentPeriodStart, 1) > new Date())
              ? theme.colors.textSecondary + '50'
              : theme.colors.text
          } />
        </TouchableOpacity>
      </View>
      
      {/* Переключатель представления (неделя/месяц) */}
      <View style={styles.viewSelector}>
        <TouchableOpacity 
          style={[
            styles.viewButton, 
            view === 'weekly' && { 
              backgroundColor: theme.colors.primary + '20',
              borderColor: theme.colors.primary 
            }
          ]}
          onPress={() => setView('weekly')}
        >
          <Text style={[
            styles.viewButtonText, 
            { color: view === 'weekly' ? theme.colors.primary : theme.colors.text }
          ]}>
            Неделя
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.viewButton, 
            view === 'monthly' && { 
              backgroundColor: theme.colors.primary + '20',
              borderColor: theme.colors.primary  
            }
          ]}
          onPress={() => setView('monthly')}
        >
          <Text style={[
            styles.viewButtonText, 
            { color: view === 'monthly' ? theme.colors.primary : theme.colors.text }
          ]}>
            Месяц
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Переключатель типа графика */}
      <View style={styles.chartTypeSelector}>
        <TouchableOpacity 
          style={[
            styles.chartTypeButton, 
            chartType === 'line' && { 
              backgroundColor: theme.colors.primary + '20',
              borderColor: theme.colors.primary  
            }
          ]}
          onPress={() => setChartType('line')}
        >
          <LineChartIcon 
            size={18} 
            color={chartType === 'line' ? theme.colors.primary : theme.colors.text} 
            style={styles.chartTypeIcon} 
          />
          <Text style={[
            styles.chartTypeText, 
            { color: chartType === 'line' ? theme.colors.primary : theme.colors.text }
          ]}>
            Линейный
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.chartTypeButton, 
            chartType === 'bar' && { 
              backgroundColor: theme.colors.primary + '20',
              borderColor: theme.colors.primary  
            }
          ]}
          onPress={() => setChartType('bar')}
        >
          <BarChart2 
            size={18} 
            color={chartType === 'bar' ? theme.colors.primary : theme.colors.text} 
            style={styles.chartTypeIcon} 
          />
          <Text style={[
            styles.chartTypeText, 
            { color: chartType === 'bar' ? theme.colors.primary : theme.colors.text }
          ]}>
            Столбчатый
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* График */}
      <View style={[styles.chartContainer, { backgroundColor: theme.colors.card }]}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
              Загрузка данных...
            </Text>
          </View>
        ) : processedData.labels.length === 0 ? (
          <View style={styles.emptyDataContainer}>
            <Text style={[styles.emptyDataText, { color: theme.colors.textSecondary }]}>
              Нет данных для отображения
            </Text>
          </View>
        ) : chartType === 'line' ? (
          <>
            <LineChart
              data={{
                labels: processedData.labels,
                datasets: processedData.datasets,
                legend: processedData.legend
              }}
              width={screenWidth}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
              formatYLabel={(value) => {
                // Normalize calories by dividing by 10 for better visualization
                return value;
              }}
            />
            <View style={styles.legend}>
              {processedData.legend.map((item, index) => (
                <View key={index} style={styles.legendItem}>
                  <View 
                    style={[
                      styles.legendColor, 
                      { backgroundColor: processedData.datasets[index].color?.(1) || '#000' }
                    ]} 
                  />
                  <Text style={[styles.legendText, { color: theme.colors.text }]}>
                    {item}
                  </Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          <>
            <BarChart
              data={{
                labels: processedData.labels,
                datasets: processedData.datasets,
                legend: processedData.legend
              }}
              width={screenWidth}
              height={220}
              chartConfig={chartConfig}
              style={styles.chart}
              yAxisLabel=""
              yAxisSuffix=""
              fromZero
              showValuesOnTopOfBars
            />
            <View style={styles.legend}>
              {processedData.legend.map((item, index) => (
                <View key={index} style={styles.legendItem}>
                  <View 
                    style={[
                      styles.legendColor, 
                      { backgroundColor: processedData.datasets[index].color?.(1) || '#000' }
                    ]} 
                  />
                  <Text style={[styles.legendText, { color: theme.colors.text }]}>
                    {item}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}
      </View>
      
      {/* Сводная статистика */}
      <View style={[styles.summaryContainer, { backgroundColor: theme.colors.card }]}>
        <Text style={[styles.summaryTitle, { color: theme.colors.text }]}>
          Средние показатели за {view === 'weekly' ? 'неделю' : 'месяц'}
        </Text>
        
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
              {Math.round(processedData.datasets[0].data.reduce((a, b) => a + b, 0) / 
                (processedData.datasets[0].data.filter(v => v > 0).length || 1))}
            </Text>
            <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
              ккал/день
            </Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
              {Math.round(processedData.datasets[1].data.reduce((a, b) => a + b, 0) / 
                (processedData.datasets[1].data.filter(v => v > 0).length || 1))}
            </Text>
            <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
              белков (г)
            </Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
              {Math.round(processedData.datasets[2].data.reduce((a, b) => a + b, 0) / 
                (processedData.datasets[2].data.filter(v => v > 0).length || 1))}
            </Text>
            <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
              углев. (г)
            </Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
              {Math.round(processedData.datasets[3].data.reduce((a, b) => a + b, 0) / 
                (processedData.datasets[3].data.filter(v => v > 0).length || 1))}
            </Text>
            <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
              жиров (г)
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

// Вспомогательные функции для работы с датами
const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const addMonths = (date: Date, months: number): Date => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  periodSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  periodNavigationButton: {
    padding: 8,
  },
  periodHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  periodIcon: {
    marginRight: 8,
  },
  periodHeader: {
    fontSize: 16,
    fontWeight: '500',
  },
  viewSelector: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  viewButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  chartTypeSelector: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  chartTypeButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chartTypeIcon: {
    marginRight: 6,
  },
  chartTypeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  chartContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  loadingContainer: {
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  emptyDataContainer: {
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyDataText: {
    fontSize: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 12,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
  },
  summaryContainer: {
    borderRadius: 12,
    padding: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  summaryLabel: {
    fontSize: 14,
    marginTop: 4,
  },
});

export default AdvancedAnalytics; 