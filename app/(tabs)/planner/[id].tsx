import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Plus, Calendar, Clock, ChevronLeft } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

type MealPlan = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
};

type PlannedMeal = {
  id: string;
  meal_type: string;
  planned_for: string;
  servings: number;
  notes: string;
  recipe?: {
    name: string;
    cooking_time: number;
  };
  food_item?: {
    name: string;
    calories: number;
  };
};

export default function PlanDetailsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { id } = useLocalSearchParams();
  const [plan, setPlan] = useState<MealPlan | null>(null);
  const [meals, setMeals] = useState<PlannedMeal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlanDetails();
  }, [id]);

  async function loadPlanDetails() {
    try {
      // Загружаем информацию о плане
      const { data: planData, error: planError } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('id', id)
        .single();

      if (planError) throw planError;
      setPlan(planData);

      // Загружаем запланированные приемы пищи
      const { data: mealsData, error: mealsError } = await supabase
        .from('planned_meals')
        .select(`
          id,
          meal_type,
          planned_for,
          servings,
          notes,
          recipe:recipe_id (
            name,
            cooking_time
          ),
          food_item:food_item_id (
            name,
            calories
          )
        `)
        .eq('meal_plan_id', id)
        .order('planned_for', { ascending: true });

      if (mealsError) throw mealsError;
      setMeals(mealsData);
    } catch (error) {
      console.error('Error loading plan details:', error);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long'
    });
  }

  function formatTime(dateString: string) {
    return new Date(dateString).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  if (!plan) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar style={theme.dark ? 'light' : 'dark'} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ChevronLeft size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.colors.text }]}>План питания</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            {loading ? 'Загрузка...' : 'План не найден'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>{plan.name}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={[styles.dateRange, { backgroundColor: theme.colors.card }]}>
        <Calendar size={20} color={theme.colors.primary} />
        <Text style={[styles.dateText, { color: theme.colors.text }]}>
          {formatDate(plan.start_date)} - {formatDate(plan.end_date)}
        </Text>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {meals.map((meal) => (
          <TouchableOpacity
            key={meal.id}
            style={[styles.mealCard, { backgroundColor: theme.colors.card }]}
            onPress={() => router.push({
              pathname: '/planner/edit-meal',
              params: { id: meal.id }
            })}
          >
            <View style={styles.mealHeader}>
              <Text style={[styles.mealType, { color: theme.colors.text }]}>
                {meal.meal_type}
              </Text>
              <View style={styles.timeContainer}>
                <Clock size={16} color={theme.colors.primary} />
                <Text style={[styles.timeText, { color: theme.colors.textSecondary }]}>
                  {formatTime(meal.planned_for)}
                </Text>
              </View>
            </View>

            <Text style={[styles.mealName, { color: theme.colors.text }]}>
              {meal.recipe?.name || meal.food_item?.name}
            </Text>

            {meal.notes && (
              <Text style={[styles.notes, { color: theme.colors.textSecondary }]}>
                {meal.notes}
              </Text>
            )}

            <View style={styles.mealFooter}>
              <Text style={[styles.servings, { color: theme.colors.textSecondary }]}>
                {meal.servings} порц.
              </Text>
              {meal.food_item?.calories && (
                <Text style={[styles.calories, { color: theme.colors.textSecondary }]}>
                  {meal.food_item.calories * meal.servings} ккал
                </Text>
              )}
            </View>
          </TouchableOpacity>
        ))}

        {meals.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
              В этом плане пока нет приемов пищи
            </Text>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
        onPress={() => router.push({
          pathname: '/planner/add-meal',
          params: { planId: id }
        })}
      >
        <Plus size={24} color="#FFF" />
      </TouchableOpacity>
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
  dateRange: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    padding: 12,
    borderRadius: 12,
    marginBottom: 24,
  },
  dateText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    marginLeft: 8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    gap: 16,
  },
  mealCard: {
    borderRadius: 16,
    padding: 16,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  mealType: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    textTransform: 'capitalize',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  mealName: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    marginBottom: 8,
  },
  notes: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginBottom: 12,
  },
  mealFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  servings: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  calories: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  addButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyStateText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    textAlign: 'center',
  },
});