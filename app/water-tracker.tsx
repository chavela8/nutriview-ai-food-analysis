import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  ArrowLeft, 
  Plus, 
  Minus,
  Droplet,
  Edit,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Settings
} from 'lucide-react-native';
import WaterTracker from '../../components/WaterTracker';
import WaterIntakeLog from '../../components/WaterIntakeLog';

// Типы данных для записей о потреблении воды
interface WaterEntry {
  id: string;
  amount: number; // в мл
  timestamp: Date;
  type: 'water' | 'coffee' | 'tea' | 'juice' | 'other';
}

// Типы дневных данных
interface DailyWaterData {
  date: string;
  goal: number; // в мл
  consumed: number; // в мл
  entries: WaterEntry[];
}

export default function WaterTrackerScreen() {
  const { theme } = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dailyData, setDailyData] = useState<DailyWaterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [waterAmount, setWaterAmount] = useState(250); // мл

  // Форматировать дату
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('ru-RU', { 
      day: 'numeric', 
      month: 'long'
    });
  };

  // Загрузить данные для текущего дня
  const loadDailyData = () => {
    setLoading(true);

    // В реальном приложении здесь был бы запрос к API или базе данных
    // Но сейчас симулируем данные
    setTimeout(() => {
      const dateKey = currentDate.toISOString().split('T')[0];
      
      // Демонстрационные данные
      const demoData: DailyWaterData = {
        date: dateKey,
        goal: 2500,
        consumed: 1600,
        entries: [
          {
            id: '1',
            amount: 250,
            timestamp: new Date(currentDate.getTime() - 8 * 60 * 60 * 1000),
            type: 'water'
          },
          {
            id: '2',
            amount: 350,
            timestamp: new Date(currentDate.getTime() - 6 * 60 * 60 * 1000),
            type: 'water'
          },
          {
            id: '3',
            amount: 200,
            timestamp: new Date(currentDate.getTime() - 4 * 60 * 60 * 1000),
            type: 'tea'
          },
          {
            id: '4',
            amount: 300,
            timestamp: new Date(currentDate.getTime() - 2 * 60 * 60 * 1000),
            type: 'water'
          },
          {
            id: '5',
            amount: 500,
            timestamp: new Date(currentDate.getTime() - 1 * 60 * 60 * 1000),
            type: 'water'
          }
        ]
      };
      
      setDailyData(demoData);
      setLoading(false);
    }, 500);
  };

  // Загрузить данные при изменении даты
  useEffect(() => {
    loadDailyData();
  }, [currentDate]);

  // Навигация по дням
  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  // Добавить запись о воде
  const addWaterEntry = () => {
    if (!dailyData) return;

    // В реальном приложении здесь был бы API-запрос для сохранения
    // Обновляем состояние локально для демонстрации
    const newEntry: WaterEntry = {
      id: Date.now().toString(),
      amount: waterAmount,
      timestamp: new Date(),
      type: 'water'
    };

    const updatedEntries = [...dailyData.entries, newEntry];
    const newConsumed = dailyData.consumed + waterAmount;

    setDailyData({
      ...dailyData,
      consumed: newConsumed,
      entries: updatedEntries
    });

    // Показываем уведомление
    Alert.alert(
      'Вода добавлена',
      `${waterAmount} мл воды добавлено в ваш дневник`,
      [{ text: 'OK' }]
    );
  };

  // Настройка целей по воде
  const openWaterGoalSettings = () => {
    Alert.alert(
      'Настройка цели по воде',
      `Текущая цель: ${dailyData?.goal} мл`,
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: '2000 мл',
          onPress: () => {
            if (dailyData) {
              setDailyData({...dailyData, goal: 2000});
            }
          }
        },
        { 
          text: '2500 мл',
          onPress: () => {
            if (dailyData) {
              setDailyData({...dailyData, goal: 2500});
            }
          }
        },
        { 
          text: '3000 мл',
          onPress: () => {
            if (dailyData) {
              setDailyData({...dailyData, goal: 3000});
            }
          }
        }
      ]
    );
  };

  // Изменить количество воды
  const changeWaterAmount = (amount: number) => {
    const newAmount = waterAmount + amount;
    if (newAmount >= 50 && newAmount <= 1000) {
      setWaterAmount(newAmount);
    }
  };

  // Выбрать предопределенное количество воды
  const selectWaterAmount = (amount: number) => {
    setWaterAmount(amount);
  };

  // Вернуться назад
  const goBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      
      {/* Заголовок */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Трекер воды
        </Text>
        <TouchableOpacity style={styles.settingsButton} onPress={openWaterGoalSettings}>
          <Settings size={22} color={theme.colors.text} />
        </TouchableOpacity>
      </View>
      
      {/* Навигация по дням */}
      <View style={styles.dateNavigator}>
        <TouchableOpacity 
          style={styles.dateNavButton} 
          onPress={() => navigateDay('prev')}
        >
          <ChevronLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.dateDisplay}>
          <CalendarDays size={16} color={theme.colors.primary} style={styles.dateIcon} />
          <Text style={[styles.dateText, { color: theme.colors.text }]}>
            {formatDate(currentDate)}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.dateNavButton} 
          onPress={() => navigateDay('next')}
        >
          <ChevronRight size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {dailyData && (
          <>
            {/* Визуализация прогресса */}
            <View style={styles.trackerContainer}>
              <WaterTracker 
                consumed={dailyData.consumed} 
                goal={dailyData.goal}
                theme={theme}
              />
              <View style={styles.goalInfo}>
                <Text style={[styles.goalInfoText, { color: theme.colors.textSecondary }]}>
                  Цель: {dailyData.goal} мл
                </Text>
                <TouchableOpacity onPress={openWaterGoalSettings}>
                  <Edit size={16} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Инструменты добавления воды */}
            <View style={[styles.addWaterContainer, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.addWaterTitle, { color: theme.colors.text }]}>
                Добавить воду
              </Text>
              
              <View style={styles.amountSelector}>
                <TouchableOpacity 
                  style={[styles.amountButton, { borderColor: theme.colors.border }]} 
                  onPress={() => changeWaterAmount(-50)}
                >
                  <Minus size={20} color={theme.colors.text} />
                </TouchableOpacity>
                
                <View style={styles.amountDisplay}>
                  <Droplet size={20} color={theme.colors.primary} style={styles.amountIcon} />
                  <Text style={[styles.amountText, { color: theme.colors.text }]}>
                    {waterAmount} мл
                  </Text>
                </View>
                
                <TouchableOpacity 
                  style={[styles.amountButton, { borderColor: theme.colors.border }]} 
                  onPress={() => changeWaterAmount(50)}
                >
                  <Plus size={20} color={theme.colors.text} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.presetAmounts}>
                <TouchableOpacity 
                  style={[
                    styles.presetButton, 
                    waterAmount === 100 ? { backgroundColor: theme.colors.primary + '20' } : null
                  ]} 
                  onPress={() => selectWaterAmount(100)}
                >
                  <Text style={[
                    styles.presetText, 
                    { color: waterAmount === 100 ? theme.colors.primary : theme.colors.text }
                  ]}>
                    100 мл
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.presetButton, 
                    waterAmount === 250 ? { backgroundColor: theme.colors.primary + '20' } : null
                  ]} 
                  onPress={() => selectWaterAmount(250)}
                >
                  <Text style={[
                    styles.presetText, 
                    { color: waterAmount === 250 ? theme.colors.primary : theme.colors.text }
                  ]}>
                    250 мл
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.presetButton, 
                    waterAmount === 500 ? { backgroundColor: theme.colors.primary + '20' } : null
                  ]} 
                  onPress={() => selectWaterAmount(500)}
                >
                  <Text style={[
                    styles.presetText, 
                    { color: waterAmount === 500 ? theme.colors.primary : theme.colors.text }
                  ]}>
                    500 мл
                  </Text>
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity 
                style={[styles.addButton, { backgroundColor: theme.colors.primary }]} 
                onPress={addWaterEntry}
              >
                <Droplet size={18} color="white" style={styles.addButtonIcon} />
                <Text style={styles.addButtonText}>
                  Добавить
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* История потребления воды */}
            <View style={styles.historyContainer}>
              <Text style={[styles.historyTitle, { color: theme.colors.text }]}>
                История
              </Text>
              
              <WaterIntakeLog 
                entries={dailyData.entries} 
                theme={theme}
              />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

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
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  settingsButton: {
    padding: 8,
  },
  dateNavigator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  dateNavButton: {
    padding: 8,
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  dateIcon: {
    marginRight: 6,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  trackerContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  goalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  goalInfoText: {
    fontSize: 14,
    marginRight: 8,
  },
  addWaterContainer: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  addWaterTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  amountSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  amountButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountIcon: {
    marginRight: 8,
  },
  amountText: {
    fontSize: 18,
    fontWeight: '600',
  },
  presetAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  presetButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  presetText: {
    fontSize: 14,
    fontWeight: '500',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  addButtonIcon: {
    marginRight: 8,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  historyContainer: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
}); 