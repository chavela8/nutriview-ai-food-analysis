import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Calendar, Clock, X, Check, ChefHat, Coffee, Utensils, Moon } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

interface MealTime {
  hour: number;
  minute: number;
}

interface MealOption {
  id: string;
  type: MealType;
  name: string;
  icon: typeof Coffee;
  defaultTime: MealTime;
}

export default function AddMealScreen() {
  const { theme } = useTheme();
  const params = useLocalSearchParams();
  const recipeId = params.recipeId as string;
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<MealType | null>(null);
  const [selectedTime, setSelectedTime] = useState<Date>(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [servings, setServings] = useState('1');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [recipeName, setRecipeName] = useState('');
  
  // Опции приема пищи
  const mealOptions: MealOption[] = [
    { 
      id: 'breakfast', 
      type: 'breakfast', 
      name: 'Завтрак', 
      icon: Coffee,
      defaultTime: { hour: 8, minute: 0 } 
    },
    { 
      id: 'lunch', 
      type: 'lunch', 
      name: 'Обед', 
      icon: Utensils,
      defaultTime: { hour: 13, minute: 0 } 
    },
    { 
      id: 'dinner', 
      type: 'dinner', 
      name: 'Ужин', 
      icon: ChefHat,
      defaultTime: { hour: 19, minute: 0 } 
    },
    { 
      id: 'snack', 
      type: 'snack', 
      name: 'Перекус', 
      icon: Moon,
      defaultTime: { hour: 16, minute: 0 } 
    }
  ];
  
  useEffect(() => {
    // В реальном приложении здесь был бы запрос для получения информации о рецепте
    // Для демонстрации используем временные данные
    const loadRecipe = () => {
      if (recipeId) {
        setRecipeName('Киноа с запечёнными овощами');
      }
    };
    
    loadRecipe();
  }, [recipeId]);
  
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setSelectedDate(selectedDate);
    }
  };
  
  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setSelectedTime(selectedTime);
    }
  };
  
  const selectMealType = (type: MealType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedMealType(type);
    
    // Установить время по умолчанию для выбранного типа приема пищи
    const mealOption = mealOptions.find(option => option.type === type);
    if (mealOption) {
      const newTime = new Date();
      newTime.setHours(mealOption.defaultTime.hour);
      newTime.setMinutes(mealOption.defaultTime.minute);
      setSelectedTime(newTime);
    }
  };
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const getMealTypeName = (type: MealType | null): string => {
    if (!type) return 'Не выбрано';
    const option = mealOptions.find(opt => opt.type === type);
    return option ? option.name : 'Не выбрано';
  };
  
  const saveMeal = async () => {
    if (!selectedMealType) {
      Alert.alert('Ошибка', 'Пожалуйста, выберите тип приема пищи');
      return;
    }
    
    if (!servings || isNaN(Number(servings)) || Number(servings) <= 0) {
      Alert.alert('Ошибка', 'Пожалуйста, укажите корректное количество порций');
      return;
    }
    
    try {
      setSaving(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Создаем объединенную дату и время
      const mealDateTime = new Date(selectedDate);
      mealDateTime.setHours(selectedTime.getHours());
      mealDateTime.setMinutes(selectedTime.getMinutes());
      
      // В реальном приложении здесь был бы запрос к API для сохранения
      /*
      const { data, error } = await supabase
        .from('planned_meals')
        .insert({
          meal_plan_id: activePlanId,
          recipe_id: recipeId,
          meal_type: selectedMealType,
          planned_for: mealDateTime.toISOString(),
          servings: parseInt(servings),
          notes: notes || null,
          created_at: new Date()
        });
        
      if (error) throw error;
      */
      
      // Имитация задержки для демо
      setTimeout(() => {
        setSaving(false);
        Alert.alert(
          'Успех!', 
          'Блюдо добавлено в план питания', 
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }, 1000);
      
    } catch (error) {
      console.error('Error saving meal:', error);
      setSaving(false);
      Alert.alert('Ошибка', 'Не удалось сохранить прием пищи');
    }
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Добавить в план
        </Text>
        
        <TouchableOpacity 
          style={[
            styles.saveButton, 
            { backgroundColor: theme.colors.primary },
            (!selectedMealType || saving) && { opacity: 0.7 }
          ]}
          onPress={saveMeal}
          disabled={!selectedMealType || saving}
        >
          {saving ? (
            <Text style={styles.saveButtonText}>Сохраняем...</Text>
          ) : (
            <>
              <Check size={18} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Сохранить</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Информация о рецепте */}
        <View style={[styles.recipeCard, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.recipeLabel, { color: theme.colors.textSecondary }]}>
            Рецепт
          </Text>
          <Text style={[styles.recipeName, { color: theme.colors.text }]}>
            {recipeName || 'Загрузка...'}
          </Text>
        </View>
        
        {/* Выбор даты */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Дата
          </Text>
          
          <TouchableOpacity 
            style={[styles.dateButton, { backgroundColor: theme.colors.card }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Calendar size={20} color={theme.colors.primary} />
            <Text style={[styles.dateText, { color: theme.colors.text }]}>
              {formatDate(selectedDate)}
            </Text>
          </TouchableOpacity>
          
          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="default"
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}
        </View>
        
        {/* Выбор типа приема пищи */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Прием пищи
          </Text>
          
          <View style={styles.mealTypeContainer}>
            {mealOptions.map((option) => {
              const MealIcon = option.icon;
              const isSelected = selectedMealType === option.type;
              
              return (
                <TouchableOpacity 
                  key={option.id}
                  style={[
                    styles.mealTypeButton,
                    { backgroundColor: theme.colors.card },
                    isSelected && { 
                      borderColor: theme.colors.primary,
                      borderWidth: 2
                    }
                  ]}
                  onPress={() => selectMealType(option.type)}
                >
                  <View style={[
                    styles.mealIconContainer, 
                    { 
                      backgroundColor: isSelected 
                        ? theme.colors.primaryLight 
                        : `${theme.colors.primary}20` 
                    }
                  ]}>
                    <MealIcon 
                      size={24} 
                      color={theme.colors.primary} 
                    />
                  </View>
                  
                  <Text style={[
                    styles.mealTypeName,
                    { color: theme.colors.text }
                  ]}>
                    {option.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        
        {/* Выбор времени */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Время
          </Text>
          
          <TouchableOpacity 
            style={[styles.timeButton, { backgroundColor: theme.colors.card }]}
            onPress={() => setShowTimePicker(true)}
          >
            <Clock size={20} color={theme.colors.primary} />
            <Text style={[styles.timeText, { color: theme.colors.text }]}>
              {formatTime(selectedTime)}
            </Text>
          </TouchableOpacity>
          
          {showTimePicker && (
            <DateTimePicker
              value={selectedTime}
              mode="time"
              display="default"
              onChange={handleTimeChange}
              is24Hour={true}
            />
          )}
        </View>
        
        {/* Количество порций */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Количество порций
          </Text>
          
          <View style={[styles.servingsContainer, { backgroundColor: theme.colors.card }]}>
            <TouchableOpacity 
              style={[
                styles.servingsButton, 
                { borderColor: theme.colors.border }
              ]}
              onPress={() => {
                const newVal = Math.max(1, parseInt(servings) - 1);
                setServings(newVal.toString());
              }}
            >
              <Text style={[styles.servingsButtonText, { color: theme.colors.text }]}>-</Text>
            </TouchableOpacity>
            
            <TextInput
              style={[styles.servingsInput, { color: theme.colors.text }]}
              keyboardType="number-pad"
              value={servings}
              onChangeText={(text) => {
                const num = parseInt(text);
                if (!isNaN(num) && num > 0) {
                  setServings(text);
                } else if (text === '') {
                  setServings('');
                }
              }}
            />
            
            <TouchableOpacity 
              style={[
                styles.servingsButton, 
                { borderColor: theme.colors.border }
              ]}
              onPress={() => {
                const newVal = parseInt(servings) + 1;
                setServings(newVal.toString());
              }}
            >
              <Text style={[styles.servingsButtonText, { color: theme.colors.text }]}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Заметки */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Заметки (опционально)
          </Text>
          
          <TextInput
            style={[
              styles.notesInput, 
              { 
                backgroundColor: theme.colors.card,
                color: theme.colors.text,
                borderColor: theme.colors.border
              }
            ]}
            placeholder="Добавьте заметки к блюду..."
            placeholderTextColor={theme.colors.textTertiary}
            multiline
            value={notes}
            onChangeText={setNotes}
          />
        </View>
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
    padding: 4,
  },
  title: {
    fontFamily: 'Nunito-Bold',
    fontSize: 20,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  saveButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  recipeCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  recipeLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginBottom: 4,
  },
  recipeName: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    marginBottom: 12,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 12,
  },
  dateText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
  },
  mealTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  mealTypeButton: {
    width: '48%',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  mealIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealTypeName: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 12,
  },
  timeText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
  },
  servingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    overflow: 'hidden',
    height: 48,
  },
  servingsButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  servingsButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  servingsInput: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Inter-Medium',
    fontSize: 18,
  },
  notesInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  }
});