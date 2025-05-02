import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Droplets, Plus, Minus, BarChart2, Settings, Clock, RefreshCw, CheckCircle, Medal } from 'lucide-react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';

export default function WaterTrackingScreen() {
  const { theme } = useTheme();
  const [dailyGoal, setDailyGoal] = useState(2000); // мл
  const [currentIntake, setCurrentIntake] = useState(0);
  const [recentEntries, setRecentEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customAmount, setCustomAmount] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [weekStats, setWeekStats] = useState([]);
  
  // Анимированное значение для прогресса
  const progressValue = useSharedValue(0);
  
  useEffect(() => {
    // Имитируем загрузку данных
    const loadData = setTimeout(() => {
      const mockEntries = [
        { id: 1, amount: 250, time: '09:15', timestamp: new Date(new Date().setHours(9, 15, 0, 0)) },
        { id: 2, amount: 200, time: '11:30', timestamp: new Date(new Date().setHours(11, 30, 0, 0)) },
        { id: 3, amount: 300, time: '14:45', timestamp: new Date(new Date().setHours(14, 45, 0, 0)) },
      ];
      
      const mockWeekStats = [
        { day: 'Пн', percentage: 85, value: 1700 },
        { day: 'Вт', percentage: 95, value: 1900 },
        { day: 'Ср', percentage: 70, value: 1400 },
        { day: 'Чт', percentage: 100, value: 2000 },
        { day: 'Пт', percentage: 65, value: 1300 },
        { day: 'Сб', percentage: 80, value: 1600 },
        { day: 'Вс', percentage: 0, value: 0 },
      ];
      
      setRecentEntries(mockEntries);
      setWeekStats(mockWeekStats);
      
      // Установим текущее потребление на основе записей
      const total = mockEntries.reduce((sum, entry) => sum + entry.amount, 0);
      setCurrentIntake(total);
      
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(loadData);
  }, []);
  
  // Обновляем анимированное значение при изменении прогресса
  useEffect(() => {
    progressValue.value = withSpring(Math.min(currentIntake / dailyGoal, 1));
  }, [currentIntake, dailyGoal]);
  
  // Стили для прогресс-кольца
  const animatedCircleStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${progressValue.value * 360}deg` }],
    };
  });
  
  const handleAddWater = (amount) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const newAmount = currentIntake + amount;
    setCurrentIntake(newAmount);
    
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const newEntry = {
      id: Date.now(),
      amount: amount,
      time: timeString,
      timestamp: now
    };
    
    setRecentEntries([newEntry, ...recentEntries]);
  };
  
  const handleRemoveEntry = (id) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const entryToRemove = recentEntries.find(entry => entry.id === id);
    const updatedEntries = recentEntries.filter(entry => entry.id !== id);
    
    setRecentEntries(updatedEntries);
    setCurrentIntake(currentIntake - entryToRemove.amount);
  };
  
  const handleCustomAmountSubmit = () => {
    const amount = parseInt(customAmount);
    if (!isNaN(amount) && amount > 0) {
      handleAddWater(amount);
      setCustomAmount('');
      setShowCustomInput(false);
    }
  };
  
  const calculateProgress = () => {
    return Math.min((currentIntake / dailyGoal) * 100, 100);
  };
  
  const renderProgressRing = () => {
    const size = 220;
    const strokeWidth = 15;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const progress = calculateProgress() / 100;
    const strokeDashoffset = circumference * (1 - progress);
    
    return (
      <View style={styles.progressRingContainer}>
        <Svg width={size} height={size}>
          {/* Фоновый круг */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={theme.colors.border}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          
          {/* Прогресс */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={theme.colors.primary}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            transform={`rotate(-90, ${size / 2}, ${size / 2})`}
          />
        </Svg>
        
        <View style={styles.progressContent}>
          <Droplets size={32} color={theme.colors.primary} style={styles.waterIcon} />
          <Text style={[styles.currentIntakeText, { color: theme.colors.text }]}>
            {currentIntake} мл
          </Text>
          <Text style={[styles.goalText, { color: theme.colors.textSecondary }]}>
            из {dailyGoal} мл
          </Text>
          <View style={styles.percentageContainer}>
            <Text style={[styles.percentageText, { color: theme.colors.success }]}>
              {Math.round(calculateProgress())}%
            </Text>
          </View>
        </View>
      </View>
    );
  };
  
  const renderQuickAddButtons = () => {
    const amounts = [100, 200, 300, 500];
    
    return (
      <View style={styles.quickAddContainer}>
        <Text style={[styles.quickAddTitle, { color: theme.colors.text }]}>
          Быстрое добавление
        </Text>
        
        <View style={styles.quickAddButtons}>
          {amounts.map((amount) => (
            <TouchableOpacity
              key={amount}
              style={[styles.quickAddButton, { backgroundColor: theme.colors.primaryLight }]}
              onPress={() => handleAddWater(amount)}
            >
              <Text style={[styles.quickAddButtonText, { color: theme.colors.primary }]}>
                {amount} мл
              </Text>
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity
            style={[styles.quickAddButton, { backgroundColor: theme.colors.card }]}
            onPress={() => setShowCustomInput(!showCustomInput)}
          >
            <Text style={[styles.quickAddButtonText, { color: theme.colors.text }]}>
              Другое
            </Text>
          </TouchableOpacity>
        </View>
        
        {showCustomInput && (
          <View style={styles.customInputContainer}>
            <TextInput
              style={[styles.customInput, { 
                backgroundColor: theme.colors.card,
                color: theme.colors.text,
                borderColor: theme.colors.border,
              }]}
              value={customAmount}
              onChangeText={setCustomAmount}
              placeholder="Введите количество (мл)"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="number-pad"
            />
            
            <TouchableOpacity
              style={[styles.customInputButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleCustomAmountSubmit}
            >
              <Text style={styles.customInputButtonText}>Добавить</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };
  
  const renderWeeklyProgress = () => {
    const maxBarHeight = 100;
    
    return (
      <View style={styles.weeklyContainer}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Недельная статистика
          </Text>
          <TouchableOpacity style={styles.refreshButton}>
            <RefreshCw size={16} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.chartsContainer}>
          {weekStats.map((day, index) => (
            <View key={index} style={styles.chartColumn}>
              <View style={styles.barContainer}>
                <View 
                  style={[
                    styles.barBackground, 
                    { backgroundColor: theme.colors.border, height: maxBarHeight }
                  ]}
                />
                <View 
                  style={[
                    styles.barFill, 
                    { 
                      backgroundColor: day.percentage >= 100 ? theme.colors.success : theme.colors.primary,
                      height: (day.percentage / 100) * maxBarHeight,
                      opacity: day.value === 0 ? 0.3 : 1,
                    }
                  ]}
                />
                {day.percentage >= 100 && (
                  <View style={styles.achievementBadge}>
                    <CheckCircle size={12} color="#FFFFFF" />
                  </View>
                )}
              </View>
              <Text style={[styles.dayLabel, { color: theme.colors.textSecondary }]}>
                {day.day}
              </Text>
              <Text style={[styles.dayValue, { color: theme.colors.text }]}>
                {day.value > 0 ? `${day.value}` : '-'}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };
  
  const renderRecentEntries = () => {
    if (recentEntries.length === 0) {
      return (
        <View style={styles.emptyEntriesContainer}>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            Нет записей о потреблении воды
          </Text>
        </View>
      );
    }
    
    return (
      <View style={styles.entriesContainer}>
        {recentEntries.map((entry) => (
          <View 
            key={entry.id} 
            style={[styles.entryItem, { backgroundColor: theme.colors.card }]}
          >
            <View style={styles.entryContent}>
              <View style={[styles.entryIcon, { backgroundColor: theme.colors.primaryLight }]}>
                <Droplets size={20} color={theme.colors.primary} />
              </View>
              
              <View style={styles.entryDetails}>
                <Text style={[styles.entryAmount, { color: theme.colors.text }]}>
                  {entry.amount} мл воды
                </Text>
                <View style={styles.entryTime}>
                  <Clock size={14} color={theme.colors.textSecondary} style={{ marginRight: 4 }} />
                  <Text style={[styles.entryTimeText, { color: theme.colors.textSecondary }]}>
                    {entry.time}
                  </Text>
                </View>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.removeButton}
              onPress={() => handleRemoveEntry(entry.id)}
            >
              <Minus size={18} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    );
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Водный баланс</Text>
        
        <TouchableOpacity 
          style={[styles.settingsButton, { backgroundColor: theme.colors.card }]}
        >
          <Settings size={20} color={theme.colors.text} />
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Загружаем данные...
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.contentContainer}>
            {renderProgressRing()}
            
            {renderQuickAddButtons()}
            
            {renderWeeklyProgress()}
            
            <View style={styles.recentSection}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Сегодняшние записи
              </Text>
              
              {renderRecentEntries()}
            </View>
            
            <View style={styles.tipsContainer}>
              <LinearGradient
                colors={[theme.colors.primaryLight, theme.colors.backgroundSecondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.tipCard}
              >
                <View style={styles.tipIconContainer}>
                  <Medal size={24} color={theme.colors.primary} />
                </View>
                
                <View style={styles.tipContent}>
                  <Text style={[styles.tipTitle, { color: theme.colors.text }]}>
                    Совет дня
                  </Text>
                  <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
                    Увеличивайте потребление воды на 500 мл в жаркие дни или при повышенной физической активности.
                  </Text>
                </View>
              </LinearGradient>
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontFamily: 'Nunito-Bold',
    fontSize: 28,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    marginTop: 16,
  },
  contentContainer: {
    padding: 24,
  },
  progressRingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  progressContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waterIcon: {
    marginBottom: 8,
  },
  currentIntakeText: {
    fontFamily: 'Nunito-Bold',
    fontSize: 32,
  },
  goalText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    marginTop: 4,
  },
  percentageContainer: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  percentageText: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
  },
  quickAddContainer: {
    marginBottom: 32,
  },
  quickAddTitle: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 18,
    marginBottom: 16,
  },
  quickAddButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickAddButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minWidth: '22%',
  },
  quickAddButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
  },
  customInputContainer: {
    flexDirection: 'row',
    marginTop: 16,
    alignItems: 'center',
  },
  customInput: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginRight: 12,
  },
  customInputButton: {
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customInputButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  weeklyContainer: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 18,
  },
  refreshButton: {
    padding: 6,
  },
  chartsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 160,
  },
  chartColumn: {
    alignItems: 'center',
    flex: 1,
  },
  barContainer: {
    width: 12,
    height: 100,
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  barBackground: {
    position: 'absolute',
    width: '100%',
    borderRadius: 6,
    bottom: 0,
  },
  barFill: {
    position: 'absolute',
    width: '100%',
    borderRadius: 6,
    bottom: 0,
  },
  achievementBadge: {
    position: 'absolute',
    top: -6,
    left: '50%',
    marginLeft: -8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    marginTop: 8,
  },
  dayValue: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    marginTop: 4,
  },
  recentSection: {
    marginBottom: 32,
  },
  entriesContainer: {
    marginTop: 16,
  },
  entryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  entryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  entryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  entryDetails: {
    // Стили для деталей записи
  },
  entryAmount: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    marginBottom: 4,
  },
  entryTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  entryTimeText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
  },
  removeButton: {
    padding: 8,
  },
  emptyEntriesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  tipsContainer: {
    marginBottom: 24,
  },
  tipCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
  },
  tipIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 16,
    marginBottom: 4,
  },
  tipText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 20,
  }
});