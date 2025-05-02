import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { Calendar, Plus, ChevronDown, ChevronUp, Calendar as CalendarIcon, TrendingUp } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

// Имитация функции для получения данных о питании
const getFoodData = async (date) => {
  // В реальном приложении здесь будет запрос к базе данных
  return new Promise((resolve) => {
    setTimeout(() => {
      // Имитация данных питания
      resolve({
        date: date,
        dailyGoal: 2000,
        consumed: 1750,
        remaining: 250,
        caloriesBurned: 320,
        waterIntake: 1500, // мл
        meals: [
          {
            id: '1',
            time: '08:30',
            name: 'Завтрак',
            foods: [
              { id: '1', name: 'Овсянка', quantity: '200г', calories: 150, protein: 5, fat: 3, carbs: 27 },
              { id: '2', name: 'Банан', quantity: '1 средний', calories: 105, protein: 1, fat: 0, carbs: 27 },
              { id: '3', name: 'Грецкие орехи', quantity: '15г', calories: 98, protein: 2, fat: 10, carbs: 2 }
            ],
            totalCalories: 353,
            totalProtein: 8,
            totalFat: 13,
            totalCarbs: 56
          },
          {
            id: '2',
            time: '13:00',
            name: 'Обед',
            foods: [
              { id: '4', name: 'Куриная грудка', quantity: '150г', calories: 165, protein: 31, fat: 4, carbs: 0 },
              { id: '5', name: 'Рис бурый', quantity: '100г', calories: 111, protein: 2, fat: 1, carbs: 23 },
              { id: '6', name: 'Овощной салат', quantity: '150г', calories: 75, protein: 2, fat: 5, carbs: 8 }
            ],
            totalCalories: 351,
            totalProtein: 35,
            totalFat: 10,
            totalCarbs: 31
          },
          {
            id: '3',
            time: '16:30',
            name: 'Перекус',
            foods: [
              { id: '7', name: 'Йогурт греческий', quantity: '150г', calories: 150, protein: 11, fat: 8, carbs: 6 },
              { id: '8', name: 'Яблоко', quantity: '1 среднее', calories: 80, protein: 0, fat: 0, carbs: 21 }
            ],
            totalCalories: 230,
            totalProtein: 11,
            totalFat: 8,
            totalCarbs: 27
          },
          {
            id: '4',
            time: '19:30',
            name: 'Ужин',
            foods: [
              { id: '9', name: 'Лосось', quantity: '120г', calories: 206, protein: 22, fat: 13, carbs: 0 },
              { id: '10', name: 'Картофель запеченный', quantity: '150г', calories: 110, protein: 3, fat: 0, carbs: 26 },
              { id: '11', name: 'Брокколи', quantity: '100г', calories: 55, protein: 4, fat: 0, carbs: 11 }
            ],
            totalCalories: 371,
            totalProtein: 29,
            totalFat: 13,
            totalCarbs: 37
          }
        ],
        totals: {
          protein: 83,
          fat: 44,
          carbs: 151
        },
        weeklyData: {
          calories: [1800, 1920, 1750, 2100, 1850, 1700, 1750],
          protein: [75, 82, 83, 90, 78, 80, 83],
          carbs: [180, 200, 151, 220, 190, 150, 151],
          fat: [40, 45, 44, 50, 48, 42, 44]
        }
      });
    }, 1000);
  });
};

const DiaryScreen = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [foodData, setFoodData] = useState(null);
  const [expandedMeal, setExpandedMeal] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [activeTab, setActiveTab] = useState('сегодня'); // сегодня, неделя, месяц
  const { theme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    loadFoodData();
  }, [currentDate]);

  const loadFoodData = async () => {
    setIsLoading(true);
    try {
      // Форматирование даты для запроса
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
      const data = await getFoodData(dateStr);
      setFoodData(data);
    } catch (error) {
      console.error("Ошибка загрузки данных:", error);
      Alert.alert("Ошибка", "Не удалось загрузить данные питания");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMeal = (mealId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedMeal(expandedMeal === mealId ? null : mealId);
  };

  const toggleCalendar = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowCalendar(!showCalendar);
  };

  const addMeal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Навигация на экран добавления продукта
    router.push('/camera-scan');
  };

  const changeDate = (days) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentDate(newDate);
  };

  const formatDate = (date) => {
    const today = new Date();
    
    if (date.toDateString() === today.toDateString()) {
      return 'Сегодня';
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Вчера';
    }
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'Завтра';
    }
    
    const options = { day: 'numeric', month: 'long', weekday: 'long' };
    return date.toLocaleDateString('ru-RU', options);
  };

  const setTab = (tab) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
  };

  // Данные для графиков
  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  
  const caloriesData = {
    labels: weekDays,
    datasets: [
      {
        data: foodData?.weeklyData?.calories || [0, 0, 0, 0, 0, 0, 0],
        color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
        strokeWidth: 2
      }
    ]
  };
  
  const macroData = {
    labels: weekDays,
    datasets: [
      {
        data: foodData?.weeklyData?.protein || [0, 0, 0, 0, 0, 0, 0],
        color: (opacity = 1) => `rgba(66, 133, 244, ${opacity})`,
        strokeWidth: 2
      },
      {
        data: foodData?.weeklyData?.carbs || [0, 0, 0, 0, 0, 0, 0],
        color: (opacity = 1) => `rgba(52, 168, 83, ${opacity})`,
        strokeWidth: 2
      },
      {
        data: foodData?.weeklyData?.fat || [0, 0, 0, 0, 0, 0, 0],
        color: (opacity = 1) => `rgba(251, 188, 5, ${opacity})`,
        strokeWidth: 2
      }
    ]
  };

  const chartConfig = {
    backgroundGradientFrom: theme.dark ? '#333' : '#fff',
    backgroundGradientTo: theme.dark ? '#333' : '#fff',
    decimalPlaces: 0,
    color: (opacity = 1) => theme.dark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => theme.dark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16
    },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Дневник питания',
          headerStyle: { backgroundColor: theme.colors.card },
          headerTintColor: theme.colors.text,
        }} 
      />

      <View style={styles.dateSelector}>
        <TouchableOpacity onPress={() => changeDate(-1)}>
          <Text style={[styles.dateArrow, { color: theme.colors.text }]}>◀</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.dateButton} onPress={toggleCalendar}>
          <Text style={[styles.dateText, { color: theme.colors.text }]}>
            {formatDate(currentDate)}
          </Text>
          <CalendarIcon size={16} color={theme.colors.text} style={{ marginLeft: 6 }} />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => changeDate(1)}>
          <Text style={[styles.dateArrow, { color: theme.colors.text }]}>▶</Text>
        </TouchableOpacity>
      </View>

      {showCalendar && (
        <View style={[styles.calendarContainer, { backgroundColor: theme.colors.card }]}>
          {/* Здесь в реальном приложении будет компонент календаря */}
          <Text style={[styles.calendarText, { color: theme.colors.text }]}>
            Компонент календаря будет здесь
          </Text>
        </View>
      )}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Загрузка данных...
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView}>
          {/* Сводка по дню */}
          <View style={[styles.summaryCard, { backgroundColor: theme.colors.card }]}>
            <View style={styles.summaryHeader}>
              <Text style={[styles.summaryTitle, { color: theme.colors.text }]}>
                Сводка за день
              </Text>
            </View>
            
            <View style={styles.summaryContent}>
              <View style={styles.calsContainer}>
                <View style={styles.calsItem}>
                  <Text style={[styles.calsValue, { color: theme.colors.text }]}>
                    {foodData?.dailyGoal || 0}
                  </Text>
                  <Text style={[styles.calsLabel, { color: theme.colors.text }]}>
                    Цель (ккал)
                  </Text>
                </View>
                
                <View style={styles.calsItem}>
                  <Text style={[styles.calsValue, { color: theme.colors.primary }]}>
                    {foodData?.consumed || 0}
                  </Text>
                  <Text style={[styles.calsLabel, { color: theme.colors.text }]}>
                    Потреблено
                  </Text>
                </View>
                
                <View style={styles.calsItem}>
                  <Text style={[styles.calsValue, { color: theme.colors.text }]}>
                    {foodData?.remaining || 0}
                  </Text>
                  <Text style={[styles.calsLabel, { color: theme.colors.text }]}>
                    Осталось
                  </Text>
                </View>
              </View>
              
              <View style={styles.macrosContainer}>
                <View style={styles.macroItem}>
                  <View style={[styles.macroIcon, { backgroundColor: '#4285F4' }]} />
                  <Text style={[styles.macroLabel, { color: theme.colors.text }]}>
                    Белки: {foodData?.totals?.protein || 0}г
                  </Text>
                </View>
                
                <View style={styles.macroItem}>
                  <View style={[styles.macroIcon, { backgroundColor: '#FBBC05' }]} />
                  <Text style={[styles.macroLabel, { color: theme.colors.text }]}>
                    Жиры: {foodData?.totals?.fat || 0}г
                  </Text>
                </View>
                
                <View style={styles.macroItem}>
                  <View style={[styles.macroIcon, { backgroundColor: '#34A853' }]} />
                  <Text style={[styles.macroLabel, { color: theme.colors.text }]}>
                    Углеводы: {foodData?.totals?.carbs || 0}г
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Список приемов пищи */}
          <View style={styles.mealsSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Приемы пищи
            </Text>
            
            {foodData?.meals.map((meal) => (
              <View 
                key={meal.id} 
                style={[styles.mealCard, { backgroundColor: theme.colors.card }]}
              >
                <TouchableOpacity 
                  style={styles.mealHeader} 
                  onPress={() => toggleMeal(meal.id)}
                >
                  <View style={styles.mealInfo}>
                    <Text style={[styles.mealTime, { color: theme.colors.text }]}>
                      {meal.time}
                    </Text>
                    <Text style={[styles.mealName, { color: theme.colors.text }]}>
                      {meal.name}
                    </Text>
                  </View>
                  
                  <View style={styles.mealSummary}>
                    <Text style={[styles.mealCalories, { color: theme.colors.text }]}>
                      {meal.totalCalories} ккал
                    </Text>
                    <View style={styles.expandIcon}>
                      {expandedMeal === meal.id ? 
                        <ChevronUp size={18} color={theme.colors.text} /> : 
                        <ChevronDown size={18} color={theme.colors.text} />
                      }
                    </View>
                  </View>
                </TouchableOpacity>
                
                {expandedMeal === meal.id && (
                  <View style={styles.mealDetails}>
                    <View style={styles.mealMacros}>
                      <Text style={[styles.macroText, { color: theme.colors.text }]}>
                        Б: {meal.totalProtein}г
                      </Text>
                      <Text style={[styles.macroText, { color: theme.colors.text }]}>
                        Ж: {meal.totalFat}г
                      </Text>
                      <Text style={[styles.macroText, { color: theme.colors.text }]}>
                        У: {meal.totalCarbs}г
                      </Text>
                    </View>
                    
                    <View style={styles.foodList}>
                      {meal.foods.map((food) => (
                        <View key={food.id} style={styles.foodItem}>
                          <View style={styles.foodInfo}>
                            <Text style={[styles.foodName, { color: theme.colors.text }]}>
                              {food.name}
                            </Text>
                            <Text style={[styles.foodQuantity, { color: theme.colors.text }]}>
                              {food.quantity}
                            </Text>
                          </View>
                          <Text style={[styles.foodCalories, { color: theme.colors.text }]}>
                            {food.calories} ккал
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            ))}
            
            <TouchableOpacity 
              style={[styles.addMealButton, { backgroundColor: theme.colors.primary }]}
              onPress={addMeal}
            >
              <Plus size={20} color="#fff" />
              <Text style={styles.addMealText}>Добавить прием пищи</Text>
            </TouchableOpacity>
          </View>

          {/* Графики */}
          <View style={styles.chartsSection}>
            <View style={styles.chartsTabs}>
              <TouchableOpacity 
                style={[
                  styles.chartTab, 
                  activeTab === 'сегодня' && 
                  [styles.activeTab, { borderColor: theme.colors.primary }]
                ]}
                onPress={() => setTab('сегодня')}
              >
                <Text 
                  style={[
                    styles.chartTabText, 
                    { color: activeTab === 'сегодня' ? theme.colors.primary : theme.colors.text }
                  ]}
                >
                  Сегодня
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.chartTab, 
                  activeTab === 'неделя' && 
                  [styles.activeTab, { borderColor: theme.colors.primary }]
                ]}
                onPress={() => setTab('неделя')}
              >
                <Text 
                  style={[
                    styles.chartTabText, 
                    { color: activeTab === 'неделя' ? theme.colors.primary : theme.colors.text }
                  ]}
                >
                  Неделя
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.chartTab, 
                  activeTab === 'месяц' && 
                  [styles.activeTab, { borderColor: theme.colors.primary }]
                ]}
                onPress={() => setTab('месяц')}
              >
                <Text 
                  style={[
                    styles.chartTabText, 
                    { color: activeTab === 'месяц' ? theme.colors.primary : theme.colors.text }
                  ]}
                >
                  Месяц
                </Text>
              </TouchableOpacity>
            </View>
            
            {activeTab === 'сегодня' ? (
              <View style={[styles.chartCard, { backgroundColor: theme.colors.card }]}>
                <Text style={[styles.chartTitle, { color: theme.colors.text }]}>
                  Распределение калорий по приемам пищи
                </Text>
                
                <BarChart
                  data={{
                    labels: foodData?.meals.map(meal => meal.name) || [],
                    datasets: [
                      {
                        data: foodData?.meals.map(meal => meal.totalCalories) || []
                      }
                    ]
                  }}
                  width={screenWidth - 40}
                  height={220}
                  chartConfig={chartConfig}
                  style={styles.chart}
                  yAxisLabel=""
                  yAxisSuffix=" ккал"
                  fromZero
                />
              </View>
            ) : activeTab === 'неделя' ? (
              <View>
                <View style={[styles.chartCard, { backgroundColor: theme.colors.card }]}>
                  <Text style={[styles.chartTitle, { color: theme.colors.text }]}>
                    Калории за неделю
                  </Text>
                  
                  <LineChart
                    data={caloriesData}
                    width={screenWidth - 40}
                    height={220}
                    chartConfig={chartConfig}
                    bezier
                    style={styles.chart}
                    yAxisLabel=""
                    yAxisSuffix=" ккал"
                    fromZero
                  />
                </View>
                
                <View style={[styles.chartCard, { backgroundColor: theme.colors.card }]}>
                  <Text style={[styles.chartTitle, { color: theme.colors.text }]}>
                    Макронутриенты за неделю
                  </Text>
                  
                  <View style={styles.chartLegend}>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: '#4285F4' }]} />
                      <Text style={{ color: theme.colors.text }}>Белки</Text>
                    </View>
                    
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: '#34A853' }]} />
                      <Text style={{ color: theme.colors.text }}>Углеводы</Text>
                    </View>
                    
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: '#FBBC05' }]} />
                      <Text style={{ color: theme.colors.text }}>Жиры</Text>
                    </View>
                  </View>
                  
                  <LineChart
                    data={macroData}
                    width={screenWidth - 40}
                    height={220}
                    chartConfig={chartConfig}
                    bezier
                    style={styles.chart}
                    yAxisLabel=""
                    yAxisSuffix="г"
                    fromZero
                  />
                </View>
              </View>
            ) : (
              <View style={[styles.chartCard, { backgroundColor: theme.colors.card }]}>
                <Text style={[styles.chartTitle, { color: theme.colors.text }]}>
                  Данные за месяц
                </Text>
                <Text style={{ color: theme.colors.text, textAlign: 'center', marginVertical: 20 }}>
                  Статистика за месяц будет доступна в ближайшем обновлении
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dateSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  dateArrow: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  calendarContainer: {
    padding: 15,
    margin: 10,
    borderRadius: 10,
  },
  calendarText: {
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
    padding: 10,
  },
  summaryCard: {
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  summaryHeader: {
    marginBottom: 15,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  summaryContent: {},
  calsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  calsItem: {
    alignItems: 'center',
  },
  calsValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  calsLabel: {
    fontSize: 12,
    marginTop: 5,
  },
  macrosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  macroIcon: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 5,
  },
  macroLabel: {
    fontSize: 14,
  },
  mealsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  mealCard: {
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  mealInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealTime: {
    fontSize: 14,
    marginRight: 10,
  },
  mealName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  mealSummary: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealCalories: {
    fontSize: 14,
    marginRight: 10,
  },
  expandIcon: {},
  mealDetails: {
    padding: 15,
    paddingTop: 0,
  },
  mealMacros: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    marginBottom: 10,
  },
  macroText: {
    fontSize: 14,
  },
  foodList: {},
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  foodInfo: {},
  foodName: {
    fontSize: 14,
    marginBottom: 2,
  },
  foodQuantity: {
    fontSize: 12,
    opacity: 0.7,
  },
  foodCalories: {
    fontSize: 14,
  },
  addMealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
  },
  addMealText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  chartsSection: {
    marginBottom: 30,
  },
  chartsTabs: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  chartTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  chartTabText: {
    fontWeight: '500',
  },
  chartCard: {
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 15,
    alignSelf: 'flex-start',
  },
  chart: {
    borderRadius: 12,
    marginVertical: 8,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 5,
  },
});

export default DiaryScreen; 