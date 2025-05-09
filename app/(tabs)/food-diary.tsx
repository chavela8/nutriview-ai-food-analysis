import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeColor } from '../../contexts/ThemeContext';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Plus, ChevronLeft, ChevronRight, Search, BarChart3, Camera } from 'lucide-react-native';
import { Stack } from 'expo-router';

// Демо данные для питания
const DEMO_DAILY_NUTRITION = {
  calories: {
    consumed: 1850,
    goal: 2200
  },
  protein: {
    consumed: 95,
    goal: 120
  },
  carbs: {
    consumed: 210,
    goal: 250
  },
  fat: {
    consumed: 60,
    goal: 70
  }
};

// Демо данные для еды
const DEMO_MEALS = [
  {
    id: '1',
    type: 'breakfast',
    name: 'Овсянка с ягодами',
    time: '08:30',
    items: [
      { name: 'Овсянка', quantity: '50г', calories: 180, imageUrl: 'https://www.example.com/oatmeal.jpg' },
      { name: 'Черника', quantity: '30г', calories: 20, imageUrl: 'https://www.example.com/blueberries.jpg' },
      { name: 'Мед', quantity: '10г', calories: 30, imageUrl: 'https://www.example.com/honey.jpg' }
    ],
    totalCalories: 230,
    protein: 6,
    carbs: 40,
    fat: 4
  },
  {
    id: '2',
    type: 'lunch',
    name: 'Куриный салат',
    time: '13:00',
    items: [
      { name: 'Куриное филе', quantity: '150г', calories: 250, imageUrl: 'https://www.example.com/chicken.jpg' },
      { name: 'Микс-салат', quantity: '100г', calories: 25, imageUrl: 'https://www.example.com/salad.jpg' },
      { name: 'Оливковое масло', quantity: '10г', calories: 90, imageUrl: 'https://www.example.com/oil.jpg' }
    ],
    totalCalories: 365,
    protein: 38,
    carbs: 5,
    fat: 18
  },
  {
    id: '3',
    type: 'snack',
    name: 'Греческий йогурт с орехами',
    time: '16:30',
    items: [
      { name: 'Греческий йогурт', quantity: '150г', calories: 135, imageUrl: 'https://www.example.com/yogurt.jpg' },
      { name: 'Грецкие орехи', quantity: '15г', calories: 98, imageUrl: 'https://www.example.com/walnuts.jpg' }
    ],
    totalCalories: 233,
    protein: 14,
    carbs: 10,
    fat: 15
  },
  {
    id: '4',
    type: 'dinner',
    name: 'Лосось с киноа',
    time: '19:30',
    items: [
      { name: 'Лосось', quantity: '150г', calories: 280, imageUrl: 'https://www.example.com/salmon.jpg' },
      { name: 'Киноа', quantity: '80г', calories: 120, imageUrl: 'https://www.example.com/quinoa.jpg' },
      { name: 'Брокколи', quantity: '100г', calories: 34, imageUrl: 'https://www.example.com/broccoli.jpg' }
    ],
    totalCalories: 434,
    protein: 37,
    carbs: 30,
    fat: 20
  }
];

// Демо данные для графика по дням
const DEMO_WEEKLY_DATA = {
  labels: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
  datasets: [
    {
      data: [1950, 2100, 1850, 2050, 1800, 2300, 1850],
      color: (opacity = 1) => `rgba(71, 136, 255, ${opacity})`, // синий
    },
    {
      data: [2200, 2200, 2200, 2200, 2200, 2200, 2200], // цель
      color: (opacity = 1) => `rgba(135, 135, 135, ${opacity})`, // серый
      withDots: false
    }
  ],
  legend: ['Употреблено', 'Цель']
};

// Демо данные для графика макронутриентов
const DEMO_MACROS_DATA = {
  labels: ['Белки', 'Жиры', 'Углеводы'],
  data: [
    (DEMO_DAILY_NUTRITION.protein.consumed / DEMO_DAILY_NUTRITION.protein.goal),
    (DEMO_DAILY_NUTRITION.fat.consumed / DEMO_DAILY_NUTRITION.fat.goal),
    (DEMO_DAILY_NUTRITION.carbs.consumed / DEMO_DAILY_NUTRITION.carbs.goal)
  ]
};

export default function FoodDiaryScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('summary'); // summary, meals, trends
  const [nutrition, setNutrition] = useState(DEMO_DAILY_NUTRITION);
  const [meals, setMeals] = useState(DEMO_MEALS);
  
  const screenWidth = Dimensions.get('window').width;
  const router = useRouter();
  const { colors, isDark } = useThemeColor();
  
  useEffect(() => {
    // В реальном приложении здесь будет запрос к API или локальной базе данных
    // для получения данных по выбранной дате
  }, [selectedDate]);
  
  const showDatePicker = () => {
    DateTimePickerAndroid.open({
      value: selectedDate,
      onChange: (event, date) => {
        if (date) setSelectedDate(date);
      },
      mode: 'date',
      is24Hour: true,
    });
  };
  
  const formatDate = (date) => {
    const day = date.getDate();
    const monthNames = [
      'Января', 'Февраля', 'Марта', 'Апреля', 'Мая', 'Июня',
      'Июля', 'Августа', 'Сентября', 'Октября', 'Ноября', 'Декабря'
    ];
    const month = monthNames[date.getMonth()];
    return `${day} ${month}`;
  };
  
  const getMealIcon = (type) => {
    switch(type) {
      case 'breakfast':
        return <MaterialCommunityIcons name="food-croissant" size={24} color={colors.primary} />;
      case 'lunch':
        return <Ionicons name="restaurant-outline" size={24} color={colors.primary} />;
      case 'dinner':
        return <MaterialCommunityIcons name="food-turkey" size={24} color={colors.primary} />;
      case 'snack':
        return <MaterialCommunityIcons name="food-apple" size={24} color={colors.primary} />;
      default:
        return <Ionicons name="fast-food-outline" size={24} color={colors.primary} />;
    }
  };
  
  const getMealTitle = (type) => {
    switch(type) {
      case 'breakfast': return 'Завтрак';
      case 'lunch': return 'Обед';
      case 'dinner': return 'Ужин';
      case 'snack': return 'Перекус';
      default: return 'Прием пищи';
    }
  };
  
  const navigateToAddFood = () => {
    // Навигация к экрану добавления еды
    router.push('/food-scanner');
  };
  
  const navigateToMealDetails = (mealId) => {
    // Навигация к экрану с деталями приема пищи
    router.push(`/meal-details/${mealId}`);
  };
  
  const renderSummaryTab = () => {
    return (
      <View style={styles.tabContent}>
        <View style={[styles.nutritionSummaryCard, {backgroundColor: colors.card}]}>
          <Text style={[styles.sectionTitle, {color: colors.text}]}>Калории</Text>
          <View style={styles.calorieCircle}>
            <View style={styles.calorieInnerCircle}>
              <Text style={[styles.calorieConsumed, {color: colors.text}]}>
                {nutrition.calories.consumed}
              </Text>
              <Text style={[styles.calorieUnit, {color: colors.textSecondary}]}>ккал</Text>
            </View>
            <View style={styles.calorieInfo}>
              <Text style={[styles.goalText, {color: colors.textSecondary}]}>
                Цель: {nutrition.calories.goal} ккал
              </Text>
              <Text style={[styles.remainingText, {color: colors.primary}]}>
                Осталось: {nutrition.calories.goal - nutrition.calories.consumed} ккал
              </Text>
            </View>
          </View>
          
          <Text style={[styles.sectionTitle, {color: colors.text, marginTop: 15}]}>Макронутриенты</Text>
          <View style={styles.macroRow}>
            <View style={styles.macroItem}>
              <Text style={[styles.macroTitle, {color: colors.textSecondary}]}>Белки</Text>
              <Text style={[styles.macroValue, {color: colors.text}]}>
                {nutrition.protein.consumed}г / {nutrition.protein.goal}г
              </Text>
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBar, 
                    {width: `${Math.min(100, (nutrition.protein.consumed / nutrition.protein.goal) * 100)}%`, backgroundColor: '#5C6BC0'}
                  ]} 
                />
              </View>
            </View>
            
            <View style={styles.macroItem}>
              <Text style={[styles.macroTitle, {color: colors.textSecondary}]}>Жиры</Text>
              <Text style={[styles.macroValue, {color: colors.text}]}>
                {nutrition.fat.consumed}г / {nutrition.fat.goal}г
              </Text>
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBar, 
                    {width: `${Math.min(100, (nutrition.fat.consumed / nutrition.fat.goal) * 100)}%`, backgroundColor: '#FFA726'}
                  ]} 
                />
              </View>
            </View>
            
            <View style={styles.macroItem}>
              <Text style={[styles.macroTitle, {color: colors.textSecondary}]}>Углеводы</Text>
              <Text style={[styles.macroValue, {color: colors.text}]}>
                {nutrition.carbs.consumed}г / {nutrition.carbs.goal}г
              </Text>
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBar, 
                    {width: `${Math.min(100, (nutrition.carbs.consumed / nutrition.carbs.goal) * 100)}%`, backgroundColor: '#66BB6A'}
                  ]} 
                />
              </View>
            </View>
          </View>
        </View>
        
        <View style={[styles.mealsContainer, {backgroundColor: colors.card, marginTop: 20}]}>
          <View style={styles.mealHeader}>
            <Text style={[styles.sectionTitle, {color: colors.text}]}>Приемы пищи</Text>
            <TouchableOpacity onPress={navigateToAddFood}>
              <Ionicons name="add-circle" size={30} color={colors.primary} />
            </TouchableOpacity>
          </View>
          
          {meals.length > 0 ? (
            meals.map((meal) => (
              <TouchableOpacity 
                key={meal.id} 
                style={[styles.mealItem, {borderBottomColor: colors.border}]}
                onPress={() => navigateToMealDetails(meal.id)}
              >
                <View style={styles.mealDetails}>
                  <View style={styles.mealIconContainer}>
                    {getMealIcon(meal.type)}
                  </View>
                  <View style={styles.mealInfo}>
                    <Text style={[styles.mealTitle, {color: colors.text}]}>
                      {getMealTitle(meal.type)} - {meal.time}
                    </Text>
                    <Text style={[styles.mealName, {color: colors.text}]}>{meal.name}</Text>
                    <Text style={[styles.itemsPreview, {color: colors.textSecondary}]}>
                      {meal.items.map(item => item.name).join(', ')}
                    </Text>
                  </View>
                </View>
                <View style={styles.mealNutrition}>
                  <Text style={[styles.mealCalories, {color: colors.text}]}>{meal.totalCalories} ккал</Text>
                  <Text style={[styles.mealMacros, {color: colors.textSecondary}]}>
                    Б: {meal.protein}г • Ж: {meal.fat}г • У: {meal.carbs}г
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyStateText, {color: colors.textSecondary}]}>
                Нет записей питания за этот день
              </Text>
              <TouchableOpacity 
                style={[styles.addButton, {backgroundColor: colors.primary}]}
                onPress={navigateToAddFood}
              >
                <Text style={styles.addButtonText}>Добавить прием пищи</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };
  
  const renderMealsTab = () => {
    return (
      <View style={styles.tabContent}>
        <View style={styles.mealTypeContainer}>
          <FlatList
            data={[
              {id: 'all', title: 'Все', icon: 'fast-food-outline'},
              {id: 'breakfast', title: 'Завтрак', icon: 'food-croissant'},
              {id: 'lunch', title: 'Обед', icon: 'restaurant-outline'},
              {id: 'dinner', title: 'Ужин', icon: 'food-turkey'},
              {id: 'snack', title: 'Перекус', icon: 'food-apple'}
            ]}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({item}) => (
              <TouchableOpacity 
                style={[
                  styles.mealTypeButton, 
                  {backgroundColor: colors.card}
                ]}
              >
                {item.id === 'breakfast' || item.id === 'snack' ? (
                  <MaterialCommunityIcons name={item.icon} size={20} color={colors.primary} />
                ) : item.id === 'all' ? (
                  <Ionicons name={item.icon} size={20} color={colors.primary} />
                ) : item.id === 'lunch' ? (
                  <Ionicons name={item.icon} size={20} color={colors.primary} />
                ) : (
                  <MaterialCommunityIcons name={item.icon} size={20} color={colors.primary} />
                )}
                <Text style={[styles.mealTypeText, {color: colors.text}]}>{item.title}</Text>
              </TouchableOpacity>
            )}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.mealTypeList}
          />
        </View>
        
        <View style={[styles.mealsContainer, {backgroundColor: colors.card}]}>
          {meals.map((meal) => (
            <TouchableOpacity 
              key={meal.id}
              style={[styles.detailedMealItem, {backgroundColor: colors.card, borderBottomColor: colors.border}]}
              onPress={() => navigateToMealDetails(meal.id)}
            >
              <View style={styles.mealHeader}>
                <View style={styles.mealTitleContainer}>
                  {getMealIcon(meal.type)}
                  <Text style={[styles.detailedMealTitle, {color: colors.text}]}>
                    {getMealTitle(meal.type)} - {meal.time}
                  </Text>
                </View>
                <Text style={[styles.detailedMealCalories, {color: colors.text}]}>
                  {meal.totalCalories} ккал
                </Text>
              </View>
              
              <Text style={[styles.detailedMealName, {color: colors.text}]}>{meal.name}</Text>
              
              {meal.items.map((item, index) => (
                <View 
                  key={index} 
                  style={[styles.foodItem, index < meal.items.length - 1 && {borderBottomColor: colors.border, borderBottomWidth: 0.5}]}
                >
                  <View style={styles.foodInfo}>
                    <View style={styles.foodImagePlaceholder} />
                    <View>
                      <Text style={[styles.foodName, {color: colors.text}]}>{item.name}</Text>
                      <Text style={[styles.foodQuantity, {color: colors.textSecondary}]}>{item.quantity}</Text>
                    </View>
                  </View>
                  <Text style={[styles.foodCalories, {color: colors.text}]}>{item.calories} ккал</Text>
                </View>
              ))}
              
              <View style={styles.mealFooter}>
                <Text style={[styles.mealMacros, {color: colors.textSecondary}]}>
                  Б: {meal.protein}г • Ж: {meal.fat}г • У: {meal.carbs}г
                </Text>
                <TouchableOpacity>
                  <MaterialIcons name="edit" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };
  
  const renderTrendsTab = () => {
    const chartConfig = {
      backgroundColor: colors.card,
      backgroundGradientFrom: colors.card,
      backgroundGradientTo: colors.card,
      decimalPlaces: 0,
      color: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
      labelColor: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
      style: {
        borderRadius: 16
      },
      propsForDots: {
        r: "6",
        strokeWidth: "2",
        stroke: "#ffa726"
      }
    };
    
    return (
      <View style={styles.tabContent}>
        <View style={[styles.chartCard, {backgroundColor: colors.card}]}>
          <Text style={[styles.chartTitle, {color: colors.text}]}>Калории за неделю</Text>
          <LineChart
            data={DEMO_WEEKLY_DATA}
            width={screenWidth - 40}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 16
            }}
            withInnerLines={false}
            withOuterLines={false}
            withShadow={false}
            withDots={true}
            withVerticalLabels={true}
            withHorizontalLabels={true}
            yAxisLabel=""
            yAxisSuffix=""
          />
        </View>
        
        <View style={[styles.statsContainer, {backgroundColor: colors.card}]}>
          <Text style={[styles.statsTitle, {color: colors.text}]}>Статистика питания</Text>
          
          <View style={styles.statsRow}>
            <View style={[styles.statCard, {backgroundColor: isDark ? '#2c3e50' : '#ecf0f1'}]}>
              <Text style={[styles.statValue, {color: colors.text}]}>
                {DEMO_DAILY_NUTRITION.calories.consumed}
              </Text>
              <Text style={[styles.statLabel, {color: colors.textSecondary}]}>
                Среднее ккал/день
              </Text>
            </View>
            
            <View style={[styles.statCard, {backgroundColor: isDark ? '#2c3e50' : '#ecf0f1'}]}>
              <Text style={[styles.statValue, {color: colors.text}]}>5/7</Text>
              <Text style={[styles.statLabel, {color: colors.textSecondary}]}>
                Дней в рамках цели
              </Text>
            </View>
          </View>
          
          <View style={styles.statsRow}>
            <View style={[styles.statCard, {backgroundColor: isDark ? '#2c3e50' : '#ecf0f1'}]}>
              <Text style={[styles.statValue, {color: colors.text}]}>79%</Text>
              <Text style={[styles.statLabel, {color: colors.textSecondary}]}>
                Соответствие цели по белкам
              </Text>
            </View>
            
            <View style={[styles.statCard, {backgroundColor: isDark ? '#2c3e50' : '#ecf0f1'}]}>
              <Text style={[styles.statValue, {color: colors.text}]}>84%</Text>
              <Text style={[styles.statLabel, {color: colors.textSecondary}]}>
                Соответствие цели по калориям
              </Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={[styles.reportButton, {backgroundColor: colors.primary}]}
            onPress={() => router.push('/nutrition-report')}
          >
            <Text style={styles.reportButtonText}>Полный отчет</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  
  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={[styles.dateSelector, {backgroundColor: colors.card}]} 
          onPress={showDatePicker}
        >
          <Ionicons name="calendar-outline" size={20} color={colors.primary} />
          <Text style={[styles.dateText, {color: colors.text}]}>{formatDate(selectedDate)}</Text>
          <MaterialIcons name="arrow-drop-down" size={24} color={colors.primary} />
        </TouchableOpacity>
        
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.headerButton} onPress={navigateToAddFood}>
            <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={() => router.push('/barcode-scanner')}>
            <Ionicons name="barcode-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'summary' && [styles.activeTab, {borderBottomColor: colors.primary}]]} 
          onPress={() => setActiveTab('summary')}
        >
          <Text 
            style={[
              styles.tabText, 
              {color: activeTab === 'summary' ? colors.primary : colors.textSecondary}
            ]}
          >
            Сводка
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'meals' && [styles.activeTab, {borderBottomColor: colors.primary}]]} 
          onPress={() => setActiveTab('meals')}
        >
          <Text 
            style={[
              styles.tabText, 
              {color: activeTab === 'meals' ? colors.primary : colors.textSecondary}
            ]}
          >
            Приемы пищи
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'trends' && [styles.activeTab, {borderBottomColor: colors.primary}]]} 
          onPress={() => setActiveTab('trends')}
        >
          <Text 
            style={[
              styles.tabText, 
              {color: activeTab === 'trends' ? colors.primary : colors.textSecondary}
            ]}
          >
            Тренды
          </Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        {activeTab === 'summary' && renderSummaryTab()}
        {activeTab === 'meals' && renderMealsTab()}
        {activeTab === 'trends' && renderTrendsTab()}
      </ScrollView>
      
      <TouchableOpacity 
        style={[styles.floatingButton, {backgroundColor: colors.primary}]}
        onPress={navigateToAddFood}
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '500',
    marginHorizontal: 8,
  },
  headerButtons: {
    flexDirection: 'row',
  },
  headerButton: {
    paddingHorizontal: 8,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 20,
  },
  nutritionSummaryCard: {
    padding: 20,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  calorieCircle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  calorieInnerCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 8,
    borderColor: '#4788FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calorieConsumed: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  calorieUnit: {
    fontSize: 14,
  },
  calorieInfo: {
    flex: 1,
    marginLeft: 20,
  },
  goalText: {
    fontSize: 16,
    marginBottom: 8,
  },
  remainingText: {
    fontSize: 18,
    fontWeight: '600',
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  macroItem: {
    flex: 1,
    marginRight: 8,
  },
  macroTitle: {
    fontSize: 14,
    marginBottom: 4,
  },
  macroValue: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  mealsContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  mealItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
  },
  mealDetails: {
    flexDirection: 'row',
    flex: 1,
  },
  mealIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(71, 136, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  mealInfo: {
    flex: 1,
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  mealName: {
    fontSize: 14,
    marginVertical: 4,
  },
  itemsPreview: {
    fontSize: 12,
  },
  mealNutrition: {
    alignItems: 'flex-end',
  },
  mealCalories: {
    fontSize: 16,
    fontWeight: '600',
  },
  mealMacros: {
    fontSize: 12,
    marginTop: 4,
  },
  emptyState: {
    padding: 30,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  addButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  mealTypeContainer: {
    marginBottom: 15,
  },
  mealTypeList: {
    paddingVertical: 8,
  },
  mealTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  mealTypeText: {
    marginLeft: 6,
  },
  detailedMealItem: {
    padding: 15,
    borderBottomWidth: 1,
  },
  mealTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailedMealTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 10,
  },
  detailedMealCalories: {
    fontSize: 16,
    fontWeight: '600',
  },
  detailedMealName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  foodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  foodImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
    marginRight: 12,
  },
  foodName: {
    fontSize: 16,
  },
  foodQuantity: {
    fontSize: 14,
  },
  foodCalories: {
    fontSize: 14,
    fontWeight: '500',
  },
  mealFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  chartCard: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  statsContainer: {
    padding: 15,
    borderRadius: 12,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  reportButton: {
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 15,
  },
  reportButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  floatingButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
}); 