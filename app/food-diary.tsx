import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Modal,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Calendar } from 'react-native-calendars';
import { 
  ArrowLeft, 
  Plus, 
  ChevronDown, 
  Edit, 
  Trash2, 
  Camera, 
  BarChart2 
} from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';

// Типы для записей дневника
interface FoodEntry {
  id: string;
  name: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  portion: string;
  time: string;
  imageUrl?: string;
}

interface DailySummary {
  calories: { consumed: number; goal: number };
  protein: { consumed: number; goal: number };
  carbs: { consumed: number; goal: number };
  fat: { consumed: number; goal: number };
  water: { consumed: number; goal: number };
}

const FoodDiaryScreen = () => {
  const { theme } = useTheme();
  const router = useRouter();
  
  // Состояния
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyEntries, setDailyEntries] = useState<FoodEntry[]>([]);
  const [dailySummary, setDailySummary] = useState<DailySummary>({
    calories: { consumed: 0, goal: 2000 },
    protein: { consumed: 0, goal: 120 },
    carbs: { consumed: 0, goal: 200 },
    fat: { consumed: 0, goal: 65 },
    water: { consumed: 0, goal: 2000 },
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  
  // Загрузка данных за выбранную дату
  useEffect(() => {
    loadDiaryData();
  }, [selectedDate]);
  
  // Функция загрузки данных
  const loadDiaryData = async () => {
    setIsLoading(true);
    
    // Симуляция загрузки данных из API
    setTimeout(() => {
      // Демо-данные для дневника
      const demoEntries: FoodEntry[] = [
        {
          id: '1',
          name: 'Овсянка с ягодами',
          mealType: 'breakfast',
          calories: 320,
          protein: 12,
          carbs: 45,
          fat: 8,
          portion: '1 чашка (250г)',
          time: '08:30',
          imageUrl: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fG9hdG1lYWx8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=60'
        },
        {
          id: '2',
          name: 'Греческий салат',
          mealType: 'lunch',
          calories: 380,
          protein: 15,
          carbs: 20,
          fat: 25,
          portion: '1 порция (300г)',
          time: '13:15',
          imageUrl: 'https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Z3JlZWslMjBzYWxhZHxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=500&q=60'
        },
        {
          id: '3',
          name: 'Запеченная курица с овощами',
          mealType: 'dinner',
          calories: 450,
          protein: 35,
          carbs: 25,
          fat: 18,
          portion: '1 порция (350г)',
          time: '19:00',
          imageUrl: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cm9hc3RlZCUyMGNoaWNrZW58ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=60'
        },
        {
          id: '4',
          name: 'Протеиновый коктейль',
          mealType: 'snack',
          calories: 180,
          protein: 25,
          carbs: 10,
          fat: 3,
          portion: '1 стакан (300мл)',
          time: '16:30',
          imageUrl: 'https://images.unsplash.com/photo-1594020931497-1e4b5c2e7f98?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8cHJvdGVpbiUyMHNoYWtlfGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60'
        }
      ];
      
      // Рассчет ежедневного итога
      const calculatedSummary = demoEntries.reduce((acc, entry) => {
        return {
          calories: { ...acc.calories, consumed: acc.calories.consumed + entry.calories },
          protein: { ...acc.protein, consumed: acc.protein.consumed + entry.protein },
          carbs: { ...acc.carbs, consumed: acc.carbs.consumed + entry.carbs },
          fat: { ...acc.fat, consumed: acc.fat.consumed + entry.fat },
          water: { ...acc.water, consumed: 1500 },
        };
      }, {
        calories: { consumed: 0, goal: 2000 },
        protein: { consumed: 0, goal: 120 },
        carbs: { consumed: 0, goal: 200 },
        fat: { consumed: 0, goal: 65 },
        water: { consumed: 0, goal: 2000 },
      });
      
      setDailyEntries(demoEntries);
      setDailySummary(calculatedSummary);
      setIsLoading(false);
    }, 1000);
  };
  
  // Удаление записи
  const deleteEntry = (id: string) => {
    const updatedEntries = dailyEntries.filter(entry => entry.id !== id);
    setDailyEntries(updatedEntries);
    
    // Перерасчет итогов
    const updatedSummary = updatedEntries.reduce((acc, entry) => {
      return {
        calories: { ...acc.calories, consumed: acc.calories.consumed + entry.calories },
        protein: { ...acc.protein, consumed: acc.protein.consumed + entry.protein },
        carbs: { ...acc.carbs, consumed: acc.carbs.consumed + entry.carbs },
        fat: { ...acc.fat, consumed: acc.fat.consumed + entry.fat },
        water: { ...acc.water },
      };
    }, {
      calories: { consumed: 0, goal: dailySummary.calories.goal },
      protein: { consumed: 0, goal: dailySummary.protein.goal },
      carbs: { consumed: 0, goal: dailySummary.carbs.goal },
      fat: { consumed: 0, goal: dailySummary.fat.goal },
      water: { consumed: dailySummary.water.consumed, goal: dailySummary.water.goal },
    });
    
    setDailySummary(updatedSummary);
  };
  
  // Форматирование даты
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    };
    return new Date(dateString).toLocaleDateString('ru-RU', options);
  };
  
  // Группировка записей по типу приема пищи
  const getEntriesByMealType = (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
    return dailyEntries.filter(entry => entry.mealType === mealType);
  };
  
  // Прогресс полоска
  const ProgressBar = ({ current, total, color }: { current: number, total: number, color: string }) => {
    const percentage = Math.min(Math.round((current / total) * 100), 100);
    
    return (
      <View style={[styles.progressBarContainer, { backgroundColor: theme.colors.background }]}>
        <View 
          style={[
            styles.progressBarFill, 
            { 
              width: `${percentage}%`, 
              backgroundColor: color 
            }
          ]} 
        />
      </View>
    );
  };
  
  // Компонент для записи о еде
  const FoodEntryItem = ({ entry }: { entry: FoodEntry }) => (
    <View style={[styles.foodEntryItem, { backgroundColor: theme.colors.card }]}>
      {entry.imageUrl && (
        <Image 
          source={{ uri: entry.imageUrl }} 
          style={styles.foodImage} 
        />
      )}
      <View style={styles.foodEntryContent}>
        <View>
          <Text style={[styles.foodName, { color: theme.colors.text }]}>{entry.name}</Text>
          <Text style={[styles.foodDetails, { color: theme.colors.textLight }]}>
            {entry.portion} • {entry.time}
          </Text>
        </View>
        <View style={styles.foodEntryNutrition}>
          <Text style={[styles.caloriesText, { color: theme.colors.primary }]}>
            {entry.calories} ккал
          </Text>
          <View style={styles.macrosContainer}>
            <Text style={[styles.macroText, { color: theme.colors.textLight }]}>
              Б: {entry.protein}г
            </Text>
            <Text style={[styles.macroText, { color: theme.colors.textLight }]}>
              У: {entry.carbs}г
            </Text>
            <Text style={[styles.macroText, { color: theme.colors.textLight }]}>
              Ж: {entry.fat}г
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.foodEntryActions}>
        <TouchableOpacity 
          onPress={() => console.log('Edit', entry.id)}
          style={styles.actionButton}
        >
          <Edit size={18} color={theme.colors.text} />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => deleteEntry(entry.id)}
          style={styles.actionButton}
        >
          <Trash2 size={18} color={theme.colors.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );
  
  // Компонент для секции приема пищи
  const MealSection = ({ 
    title, 
    mealType, 
    iconName 
  }: { 
    title: string, 
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack',
    iconName: JSX.Element
  }) => {
    const entries = getEntriesByMealType(mealType);
    
    return (
      <View style={styles.mealSection}>
        <View style={styles.mealSectionHeader}>
          <View style={styles.mealSectionTitle}>
            {iconName}
            <Text style={[styles.mealTypeText, { color: theme.colors.text }]}>
              {title}
            </Text>
          </View>
          <TouchableOpacity 
            onPress={() => router.push('/add-food?mealType=' + mealType)}
            style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
          >
            <Plus size={18} color="#fff" />
          </TouchableOpacity>
        </View>
        
        {entries.length > 0 ? (
          entries.map(entry => (
            <FoodEntryItem key={entry.id} entry={entry} />
          ))
        ) : (
          <View style={[styles.emptyMealContainer, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.emptyMealText, { color: theme.colors.textLight }]}>
              Нет записей для этого приема пищи
            </Text>
            <TouchableOpacity 
              onPress={() => router.push('/add-food?mealType=' + mealType)}
              style={[styles.emptyMealButton, { borderColor: theme.colors.primary }]}
            >
              <Text style={[styles.emptyMealButtonText, { color: theme.colors.primary }]}>
                Добавить еду
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen 
        options={{ 
          headerShown: false 
        }} 
      />
      
      {/* Заголовок */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Дневник питания
        </Text>
        <TouchableOpacity onPress={() => router.push('/nutrition-stats')}>
          <BarChart2 size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>
      
      {/* Выбор даты */}
      <TouchableOpacity 
        style={styles.dateSelector} 
        onPress={() => setShowCalendar(!showCalendar)}
      >
        <Text style={[styles.dateText, { color: theme.colors.text }]}>
          {formatDate(selectedDate)}
        </Text>
        <ChevronDown size={20} color={theme.colors.text} />
      </TouchableOpacity>
      
      {/* Календарь */}
      <Modal
        visible={showCalendar}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCalendar(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCalendar(false)}
        >
          <View 
            style={[styles.calendarContainer, { backgroundColor: theme.colors.card }]}
            onStartShouldSetResponder={() => true}
          >
            <Calendar
              onDayPress={(day) => {
                setSelectedDate(day.dateString);
                setShowCalendar(false);
              }}
              markedDates={{
                [selectedDate]: { selected: true, selectedColor: theme.colors.primary }
              }}
              theme={{
                calendarBackground: theme.colors.card,
                textSectionTitleColor: theme.colors.text,
                selectedDayBackgroundColor: theme.colors.primary,
                selectedDayTextColor: '#ffffff',
                todayTextColor: theme.colors.primary,
                dayTextColor: theme.colors.text,
                textDisabledColor: theme.colors.textLight,
                monthTextColor: theme.colors.text,
                arrowColor: theme.colors.primary,
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {/* Сводка по дню */}
          <View style={[styles.summaryCard, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.summaryTitle, { color: theme.colors.text }]}>
              Итого за день
            </Text>
            
            <View style={styles.nutrientSummary}>
              <Text style={[styles.nutrientLabel, { color: theme.colors.textLight }]}>
                Калории
              </Text>
              <View style={styles.nutrientValueContainer}>
                <Text style={[styles.nutrientValue, { color: theme.colors.text }]}>
                  {dailySummary.calories.consumed}
                </Text>
                <Text style={[styles.nutrientGoal, { color: theme.colors.textLight }]}>
                  / {dailySummary.calories.goal} ккал
                </Text>
              </View>
              <ProgressBar 
                current={dailySummary.calories.consumed} 
                total={dailySummary.calories.goal} 
                color="#FF6B6B" 
              />
            </View>
            
            <View style={styles.nutrientSummary}>
              <Text style={[styles.nutrientLabel, { color: theme.colors.textLight }]}>
                Белки
              </Text>
              <View style={styles.nutrientValueContainer}>
                <Text style={[styles.nutrientValue, { color: theme.colors.text }]}>
                  {dailySummary.protein.consumed}
                </Text>
                <Text style={[styles.nutrientGoal, { color: theme.colors.textLight }]}>
                  / {dailySummary.protein.goal} г
                </Text>
              </View>
              <ProgressBar 
                current={dailySummary.protein.consumed} 
                total={dailySummary.protein.goal} 
                color="#4ECDC4" 
              />
            </View>
            
            <View style={styles.nutrientSummary}>
              <Text style={[styles.nutrientLabel, { color: theme.colors.textLight }]}>
                Углеводы
              </Text>
              <View style={styles.nutrientValueContainer}>
                <Text style={[styles.nutrientValue, { color: theme.colors.text }]}>
                  {dailySummary.carbs.consumed}
                </Text>
                <Text style={[styles.nutrientGoal, { color: theme.colors.textLight }]}>
                  / {dailySummary.carbs.goal} г
                </Text>
              </View>
              <ProgressBar 
                current={dailySummary.carbs.consumed} 
                total={dailySummary.carbs.goal} 
                color="#FFD166" 
              />
            </View>
            
            <View style={styles.nutrientSummary}>
              <Text style={[styles.nutrientLabel, { color: theme.colors.textLight }]}>
                Жиры
              </Text>
              <View style={styles.nutrientValueContainer}>
                <Text style={[styles.nutrientValue, { color: theme.colors.text }]}>
                  {dailySummary.fat.consumed}
                </Text>
                <Text style={[styles.nutrientGoal, { color: theme.colors.textLight }]}>
                  / {dailySummary.fat.goal} г
                </Text>
              </View>
              <ProgressBar 
                current={dailySummary.fat.consumed} 
                total={dailySummary.fat.goal} 
                color="#6A0572" 
              />
            </View>
            
            <View style={styles.nutrientSummary}>
              <Text style={[styles.nutrientLabel, { color: theme.colors.textLight }]}>
                Вода
              </Text>
              <View style={styles.nutrientValueContainer}>
                <Text style={[styles.nutrientValue, { color: theme.colors.text }]}>
                  {dailySummary.water.consumed}
                </Text>
                <Text style={[styles.nutrientGoal, { color: theme.colors.textLight }]}>
                  / {dailySummary.water.goal} мл
                </Text>
              </View>
              <ProgressBar 
                current={dailySummary.water.consumed} 
                total={dailySummary.water.goal} 
                color="#118AB2" 
              />
            </View>
          </View>
          
          {/* Плавающая кнопка для быстрого добавления еды через камеру */}
          <TouchableOpacity 
            style={[styles.fabButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => router.push('/camera-food-scan')}
          >
            <Camera size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          {/* Секции приемов пищи */}
          <MealSection 
            title="Завтрак" 
            mealType="breakfast" 
            iconName={<Text style={styles.mealIcon}>🍳</Text>} 
          />
          
          <MealSection 
            title="Обед" 
            mealType="lunch" 
            iconName={<Text style={styles.mealIcon}>🍲</Text>} 
          />
          
          <MealSection 
            title="Ужин" 
            mealType="dinner" 
            iconName={<Text style={styles.mealIcon}>🍽️</Text>} 
          />
          
          <MealSection 
            title="Перекусы" 
            mealType="snack" 
            iconName={<Text style={styles.mealIcon}>🥪</Text>} 
          />
          
          {/* Пространство внизу для скролла */}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarContainer: {
    width: '90%',
    borderRadius: 12,
    overflow: 'hidden',
    padding: 16,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryCard: {
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  nutrientSummary: {
    marginBottom: 12,
  },
  nutrientLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  nutrientValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  nutrientValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  nutrientGoal: {
    fontSize: 14,
    marginLeft: 4,
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
  },
  mealSection: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  mealSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  mealSectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  mealTypeText: {
    fontSize: 18,
    fontWeight: '600',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  foodEntryItem: {
    flexDirection: 'row',
    borderRadius: 12,
    marginBottom: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  foodImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  foodEntryContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  foodName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  foodDetails: {
    fontSize: 14,
  },
  foodEntryNutrition: {
    marginTop: 6,
  },
  caloriesText: {
    fontSize: 15,
    fontWeight: '600',
  },
  macrosContainer: {
    flexDirection: 'row',
    marginTop: 2,
  },
  macroText: {
    fontSize: 13,
    marginRight: 8,
  },
  foodEntryActions: {
    justifyContent: 'space-between',
    paddingLeft: 8,
  },
  actionButton: {
    padding: 6,
  },
  emptyMealContainer: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyMealText: {
    fontSize: 14,
    marginBottom: 12,
  },
  emptyMealButton: {
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  emptyMealButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  fabButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1000,
  },
  bottomSpacer: {
    height: 100,
  },
});

export default FoodDiaryScreen; 