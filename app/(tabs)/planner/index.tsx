import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList, Image, ActivityIndicator } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Calendar, ChefHat, Plus, Calendar as CalendarIcon, ChevronRight, Clock, Utensils, Star, FlameIcon } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

// Types
interface MealPlan {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  duration: number; // days
  totalRecipes: number;
  rating: number;
  caloriesPerDay: number;
  tags: string[];
}

interface DailyPlan {
  id: string;
  day: number;
  date: Date;
  meals: {
    id: string;
    name: string;
    type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    imageUrl: string;
    prepTime: number;
    calories: number;
  }[];
}

export default function PlannerScreen() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [activePlan, setActivePlan] = useState<MealPlan | null>(null);
  const [weeklyPlan, setWeeklyPlan] = useState<DailyPlan[]>([]);
  const [recommendedPlans, setRecommendedPlans] = useState<MealPlan[]>([]);
  
  useEffect(() => {
    // Simulate API call to fetch data
    setTimeout(() => {
      // Sample data
      setActivePlan({
        id: 'plan1',
        name: 'Сбалансированное питание',
        description: 'План питания с разнообразными блюдами, балансом белков, жиров и углеводов',
        imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
        duration: 7,
        totalRecipes: 21,
        rating: 4.7,
        caloriesPerDay: 1800,
        tags: ['balanced', 'diverse', 'easy']
      });
      
      // Generate weekly plan
      const today = new Date();
      const week = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        
        return {
          id: `day${i+1}`,
          day: i + 1,
          date: date,
          meals: [
            {
              id: `breakfast${i+1}`,
              name: i % 7 === 0 ? 'Омлет с овощами' : 
                    i % 7 === 1 ? 'Овсянка с ягодами' : 
                    i % 7 === 2 ? 'Творог с фруктами' : 
                    i % 7 === 3 ? 'Гречневая каша с молоком' : 
                    i % 7 === 4 ? 'Йогурт с гранолой' : 
                    i % 7 === 5 ? 'Тосты с авокадо' : 'Смузи боул',
              type: 'breakfast',
              imageUrl: `https://images.unsplash.com/photo-15${i}6069901-ba9599a7e63c`,
              prepTime: 15,
              calories: 350
            },
            {
              id: `lunch${i+1}`,
              name: i % 5 === 0 ? 'Куриный суп с лапшой' : 
                    i % 5 === 1 ? 'Греческий салат с курицей' : 
                    i % 5 === 2 ? 'Рыба с овощами на пару' : 
                    i % 5 === 3 ? 'Киноа с овощами и тофу' : 'Паста с морепродуктами',
              type: 'lunch',
              imageUrl: `https://images.unsplash.com/photo-15${i+1}6069901-ba9599a7e63c`,
              prepTime: 30,
              calories: 450
            },
            {
              id: `dinner${i+1}`,
              name: i % 4 === 0 ? 'Запеченная курица с овощами' : 
                    i % 4 === 1 ? 'Лосось с зеленым салатом' : 
                    i % 4 === 2 ? 'Овощное рагу с киноа' : 'Стейк с овощами гриль',
              type: 'dinner',
              imageUrl: `https://images.unsplash.com/photo-15${i+2}6069901-ba9599a7e63c`,
              prepTime: 40,
              calories: 550
            },
            {
              id: `snack${i+1}`,
              name: i % 3 === 0 ? 'Яблоко и орехи' : 
                    i % 3 === 1 ? 'Протеиновый смузи' : 'Йогурт с ягодами',
              type: 'snack',
              imageUrl: `https://images.unsplash.com/photo-15${i+3}6069901-ba9599a7e63c`,
              prepTime: 5,
              calories: 150
            }
          ]
        };
      });
      
      setWeeklyPlan(week);
      
      // Sample recommended plans
      setRecommendedPlans([
        {
          id: 'plan2',
          name: 'Высокобелковая диета',
          description: 'Идеально для набора мышечной массы и восстановления',
          imageUrl: 'https://images.unsplash.com/photo-1547592180-85f173990888',
          duration: 14,
          totalRecipes: 35,
          rating: 4.9,
          caloriesPerDay: 2200,
          tags: ['high-protein', 'fitness', 'muscle']
        },
        {
          id: 'plan3',
          name: 'Низкоуглеводное питание',
          description: 'Помогает снизить вес и контролировать уровень сахара',
          imageUrl: 'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2',
          duration: 21,
          totalRecipes: 42,
          rating: 4.5,
          caloriesPerDay: 1600,
          tags: ['low-carb', 'weight-loss', 'keto']
        },
        {
          id: 'plan4',
          name: 'Вегетарианское меню',
          description: 'Разнообразные вегетарианские блюда для здорового образа жизни',
          imageUrl: 'https://images.unsplash.com/photo-1561043433-aaf687c4cf04',
          duration: 7,
          totalRecipes: 21,
          rating: 4.8,
          caloriesPerDay: 1700,
          tags: ['vegetarian', 'plant-based', 'healthy']
        }
      ]);
      
      setLoading(false);
    }, 1500);
  }, []);
  
  // Format the day name
  const formatDayName = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Сегодня';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Завтра';
    } else {
      return date.toLocaleDateString('ru-RU', { weekday: 'long' });
    }
  };
  
  // Format the date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };
  
  const renderDayPlan = ({ item }: { item: DailyPlan }) => {
    return (
      <TouchableOpacity 
        style={[styles.dayCard, { backgroundColor: theme.colors.card }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push(`/planner/meal-plan?day=${item.day}`);
        }}
      >
        <View style={styles.dayHeader}>
          <View>
            <Text style={[styles.dayName, { color: theme.colors.text }]}>
              {formatDayName(item.date)}
            </Text>
            <Text style={[styles.dayDate, { color: theme.colors.textSecondary }]}>
              {formatDate(item.date)}
            </Text>
          </View>
          
          <ChevronRight size={20} color={theme.colors.textSecondary} />
        </View>
        
        <View style={styles.mealsPreview}>
          {item.meals.map((meal) => (
            <View key={meal.id} style={styles.mealPreviewItem}>
              <Image 
                source={{ uri: meal.imageUrl.replace(/15\d6069901-ba9599a7e63c/, '546069901-ba9599a7e63c') }} 
                style={styles.mealPreviewImage}
                defaultSource={require('@/assets/images/placeholder-food.png')}
              />
              
              <Text style={[styles.mealType, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                {meal.type === 'breakfast' ? 'Завтрак' : 
                 meal.type === 'lunch' ? 'Обед' : 
                 meal.type === 'dinner' ? 'Ужин' : 'Перекус'}
              </Text>
            </View>
          ))}
        </View>
      </TouchableOpacity>
    );
  };
  
  const renderMealPlan = ({ item }: { item: MealPlan }) => {
    return (
      <TouchableOpacity 
        style={[styles.planCard, { backgroundColor: theme.colors.card }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          alert(`Plan: ${item.name}`);
        }}
      >
        <Image 
          source={{ uri: item.imageUrl }} 
          style={styles.planImage}
        />
        
        <View style={styles.planInfo}>
          <Text style={[styles.planName, { color: theme.colors.text }]}>
            {item.name}
          </Text>
          
          <Text style={[styles.planDescription, { color: theme.colors.textSecondary }]} numberOfLines={2}>
            {item.description}
          </Text>
          
          <View style={styles.planMeta}>
            <View style={styles.planMetaItem}>
              <CalendarIcon size={14} color={theme.colors.textSecondary} />
              <Text style={[styles.planMetaText, { color: theme.colors.textSecondary }]}>
                {item.duration} дней
              </Text>
            </View>
            
            <View style={styles.planMetaItem}>
              <Star size={14} color={theme.colors.textSecondary} />
              <Text style={[styles.planMetaText, { color: theme.colors.textSecondary }]}>
                {item.rating.toFixed(1)}
              </Text>
            </View>
            
            <View style={styles.planMetaItem}>
              <FlameIcon size={14} color={theme.colors.textSecondary} />
              <Text style={[styles.planMetaText, { color: theme.colors.textSecondary }]}>
                {item.caloriesPerDay} ккал
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar style={theme.dark ? 'light' : 'dark'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Загрузка плана питания...
          </Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Планировщик питания
        </Text>
        
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/planner/create');
          }}
        >
          <Plus size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {activePlan && (
          <View style={styles.activePlanContainer}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Calendar size={18} color={theme.colors.primary} />
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  Текущий план питания
                </Text>
              </View>
              
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  alert('View all meals');
                }}
              >
                <Text style={[styles.viewAllText, { color: theme.colors.primary }]}>
                  Все блюда
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={[styles.activePlanCard, { backgroundColor: theme.colors.card }]}>
              <Image 
                source={{ uri: activePlan.imageUrl }} 
                style={styles.activePlanImage}
              />
              
              <View style={styles.activePlanInfo}>
                <Text style={[styles.activePlanName, { color: theme.colors.text }]}>
                  {activePlan.name}
                </Text>
                
                <View style={styles.activePlanMeta}>
                  <View style={styles.metaItem}>
                    <Utensils size={14} color={theme.colors.textSecondary} />
                    <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
                      {activePlan.totalRecipes} блюд
                    </Text>
                  </View>
                  
                  <View style={styles.metaItem}>
                    <CalendarIcon size={14} color={theme.colors.textSecondary} />
                    <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
                      {activePlan.duration} дней
                    </Text>
                  </View>
                  
                  <View style={styles.metaItem}>
                    <FlameIcon size={14} color={theme.colors.textSecondary} />
                    <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
                      {activePlan.caloriesPerDay} ккал/день
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}
        
        <View style={styles.weeklyPlanContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <CalendarIcon size={18} color={theme.colors.primary} />
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                План на неделю
              </Text>
            </View>
          </View>
          
          <FlatList
            data={weeklyPlan}
            renderItem={renderDayPlan}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.weeklyPlanList}
          />
        </View>
        
        <View style={styles.recommendedPlansContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <ChefHat size={18} color={theme.colors.primary} />
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Рекомендуемые планы
              </Text>
            </View>
            
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                alert('View all plans');
              }}
            >
              <Text style={[styles.viewAllText, { color: theme.colors.primary }]}>
                Все планы
              </Text>
            </TouchableOpacity>
          </View>
          
          {recommendedPlans.map((plan) => renderMealPlan({ item: plan }))}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontFamily: 'Nunito-Bold',
    fontSize: 24,
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  loadingText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontFamily: 'Nunito-Bold',
    fontSize: 18,
    marginLeft: 8,
  },
  viewAllText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  activePlanContainer: {
    marginBottom: 24,
  },
  activePlanCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  activePlanImage: {
    width: '100%',
    height: 150,
  },
  activePlanInfo: {
    padding: 16,
  },
  activePlanName: {
    fontFamily: 'Nunito-Bold',
    fontSize: 18,
    marginBottom: 8,
  },
  activePlanMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  metaText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    marginLeft: 4,
  },
  weeklyPlanContainer: {
    marginBottom: 24,
  },
  weeklyPlanList: {
    paddingBottom: 8,
  },
  dayCard: {
    width: 280,
    borderRadius: 16,
    marginRight: 12,
    padding: 16,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayName: {
    fontFamily: 'Nunito-Bold',
    fontSize: 16,
  },
  dayDate: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
  },
  mealsPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mealPreviewItem: {
    alignItems: 'center',
    width: '23%',
  },
  mealPreviewImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 4,
  },
  mealType: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    textAlign: 'center',
  },
  recommendedPlansContainer: {
    marginBottom: 24,
  },
  planCard: {
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  planImage: {
    width: 100,
    height: 100,
  },
  planInfo: {
    flex: 1,
    padding: 12,
  },
  planName: {
    fontFamily: 'Nunito-Bold',
    fontSize: 16,
    marginBottom: 4,
  },
  planDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    marginBottom: 8,
  },
  planMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  planMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  planMetaText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    marginLeft: 4,
  },
});