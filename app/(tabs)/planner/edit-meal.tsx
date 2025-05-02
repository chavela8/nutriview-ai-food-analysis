import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, Clock, Coffee, Sun, Moon, UtensilsCrossed, ChevronRight, Trash2 } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

const mealTypes = [
  { id: 'breakfast', name: 'Завтрак', icon: Coffee },
  { id: 'lunch', name: 'Обед', icon: Sun },
  { id: 'dinner', name: 'Ужин', icon: Moon },
  { id: 'snack', name: 'Перекус', icon: UtensilsCrossed },
];

type PlannedMeal = {
  id: string;
  meal_type: string;
  planned_for: string;
  servings: number;
  notes: string;
  recipe_id?: string;
  food_item_id?: string;
  recipe?: {
    name: string;
    cooking_time: number;
  };
  food_item?: {
    name: string;
    calories: number;
  };
};

export default function EditMealScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [meal, setMeal] = useState<PlannedMeal | null>(null);
  const [mealType, setMealType] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [servings, setServings] = useState('1');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadMealDetails();
  }, [id]);

  async function loadMealDetails() {
    try {
      const { data, error } = await supabase
        .from('planned_meals')
        .select(`
          *,
          recipe:recipe_id (
            name,
            cooking_time
          ),
          food_item:food_item_id (
            name,
            calories
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      setMeal(data);
      setMealType(data.meal_type);
      const plannedDate = new Date(data.planned_for);
      setDate(plannedDate.toISOString().split('T')[0]);
      setTime(plannedDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }));
      setServings(data.servings.toString());
      setNotes(data.notes || '');
    } catch (error) {
      console.error('Error loading meal details:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateMeal() {
    try {
      setSaving(true);
      const plannedFor = new Date(`${date}T${time}`);

      const { error } = await supabase
        .from('planned_meals')
        .update({
          meal_type: mealType,
          planned_for: plannedFor.toISOString(),
          servings: parseFloat(servings),
          notes,
        })
        .eq('id', id);

      if (error) throw error;

      router.back();
    } catch (error) {
      console.error('Error updating meal:', error);
    } finally {
      setSaving(false);
    }
  }

  async function deleteMeal() {
    try {
      setDeleting(true);

      const { error } = await supabase
        .from('planned_meals')
        .delete()
        .eq('id', id);

      if (error) throw error;

      router.back();
    } catch (error) {
      console.error('Error deleting meal:', error);
    } finally {
      setDeleting(false);
    }
  }

  if (loading || !meal) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar style={theme.dark ? 'light' : 'dark'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <X size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>Редактировать прием пищи</Text>
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
          onPress={updateMeal}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Сохранение...' : 'Сохранить'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Тип приема пищи</Text>
          
          {mealTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = mealType === type.id;
            
            return (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.typeOption,
                  isSelected && { backgroundColor: theme.colors.primaryLight }
                ]}
                onPress={() => setMealType(type.id)}
              >
                <View style={styles.typeIcon}>
                  <Icon size={20} color={isSelected ? theme.colors.primary : theme.colors.textSecondary} />
                </View>
                <Text style={[
                  styles.typeName,
                  { color: isSelected ? theme.colors.primary : theme.colors.text }
                ]}>
                  {type.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Дата и время</Text>
          
          <View style={styles.dateTimeInputs}>
            <TextInput
              style={[styles.input, { color: theme.colors.text }]}
              placeholder="Дата"
              placeholderTextColor={theme.colors.textTertiary}
              value={date}
              onChangeText={setDate}
            />
            <TextInput
              style={[styles.input, { color: theme.colors.text }]}
              placeholder="Время"
              placeholderTextColor={theme.colors.textTertiary}
              value={time}
              onChangeText={setTime}
            />
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <View style={styles.rowHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Блюдо</Text>
            <ChevronRight size={20} color={theme.colors.textSecondary} />
          </View>
          <Text style={[styles.foodName, { color: theme.colors.text }]}>
            {meal.recipe?.name || meal.food_item?.name}
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Порции</Text>
          <TextInput
            style={[styles.input, { color: theme.colors.text }]}
            placeholder="Количество порций"
            placeholderTextColor={theme.colors.textTertiary}
            value={servings}
            onChangeText={setServings}
            keyboardType="numeric"
          />
        </View>

        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Заметки</Text>
          <TextInput
            style={[styles.input, styles.notesInput, { color: theme.colors.text }]}
            placeholder="Добавьте заметки к приему пищи"
            placeholderTextColor={theme.colors.textTertiary}
            value={notes}
            onChangeText={setNotes}
            multiline
          />
        </View>

        <TouchableOpacity
          style={[styles.deleteButton, { borderColor: theme.colors.danger }]}
          onPress={deleteMeal}
          disabled={deleting}
        >
          <Trash2 size={20} color={theme.colors.danger} />
          <Text style={[styles.deleteButtonText, { color: theme.colors.danger }]}>
            {deleting ? 'Удаление...' : 'Удалить прием пищи'}
          </Text>
        </TouchableOpacity>
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
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  title: {
    fontFamily: 'Nunito-Bold',
    fontSize: 20,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#FFF',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    gap: 16,
  },
  section: {
    borderRadius: 16,
    padding: 16,
  },
  sectionTitle: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 16,
    marginBottom: 12,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  typeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  typeName: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
  },
  dateTimeInputs: {
    flexDirection: 'row',
    gap: 16,
  },
  input: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  foodName: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    marginTop: 8,
  },
  notesInput: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  deleteButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});