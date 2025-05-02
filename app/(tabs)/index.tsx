import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Platform } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { getGreeting } from '@/utils/helpers';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { CircleCheck as CheckCircle, Award, Coffee, ChevronRight, TrendingUp, Droplets } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { NutritionProgress } from '@/components/NutritionProgress';
import { DailyGoal } from '@/components/DailyGoal';

const screenWidth = Dimensions.get('window').width;

export default function HomeScreen() {
  const { theme } = useTheme();
  const [greeting, setGreeting] = useState('');
  
  useEffect(() => {
    setGreeting(getGreeting());
  }, []);

  // Sample data for demonstration
  const weeklyCaloriesData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        data: [1800, 2100, 1950, 2200, 1850, 2050, 1900],
        color: () => theme.colors.primary,
        strokeWidth: 2,
      },
    ],
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: theme.colors.text }]}>{greeting}</Text>
            <Text style={[styles.name, { color: theme.colors.text }]}>Alex</Text>
          </View>
          <TouchableOpacity style={[styles.streakContainer, { backgroundColor: theme.colors.primaryLight }]}>
            <Award size={18} color={theme.colors.primary} />
            <Text style={[styles.streakText, { color: theme.colors.primary }]}>7 day streak!</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.summaryTitle, { color: theme.colors.text }]}>Today's Summary</Text>
          
          <View style={styles.nutritionContainer}>
            <NutritionProgress 
              value={1250} 
              total={2000} 
              title="Calories" 
              color={theme.colors.primary} 
            />
            <NutritionProgress 
              value={45} 
              total={130} 
              title="Protein" 
              color={theme.colors.secondary} 
              unit="g"
            />
            <NutritionProgress 
              value={65} 
              total={70} 
              title="Carbs" 
              color={theme.colors.tertiary} 
              unit="g"
            />
            <NutritionProgress 
              value={28} 
              total={65} 
              title="Fat" 
              color={theme.colors.accent} 
              unit="g"
            />
          </View>

          <View style={styles.mealProgress}>
            <Text style={[styles.mealProgressTitle, { color: theme.colors.text }]}>Today's Meals</Text>
            <View style={styles.mealItems}>
              <View style={[styles.mealItem, { borderColor: theme.colors.border }]}>
                <View style={styles.mealIcon}>
                  <Coffee size={18} color={theme.colors.primary} />
                </View>
                <View style={styles.mealInfo}>
                  <Text style={[styles.mealName, { color: theme.colors.text }]}>Breakfast</Text>
                  <Text style={[styles.mealCalories, { color: theme.colors.textSecondary }]}>320 calories</Text>
                </View>
                <CheckCircle size={20} color={theme.colors.success} />
              </View>
              <TouchableOpacity 
                style={[styles.addMealButton, { backgroundColor: theme.colors.primaryLight }]}
              >
                <Text style={[styles.addMealText, { color: theme.colors.primary }]}>+ Add Lunch</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={[styles.weeklyStatsCard, { backgroundColor: theme.colors.card }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Weekly Calories</Text>
            <TouchableOpacity style={styles.seeAllButton}>
              <Text style={[styles.seeAllText, { color: theme.colors.primary }]}>See Details</Text>
              <ChevronRight size={16} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
          <LineChart
            data={weeklyCaloriesData}
            width={screenWidth - 48}
            height={180}
            chartConfig={{
              backgroundColor: theme.colors.card,
              backgroundGradientFrom: theme.colors.card,
              backgroundGradientTo: theme.colors.card,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(102, 212, 176, ${opacity})`,
              labelColor: (opacity = 1) => theme.colors.textSecondary,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: theme.colors.primaryDark,
              },
            }}
            bezier
            style={styles.chart}
          />
        </View>

        <View style={styles.goalsContainer}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Daily Goals</Text>
          <View style={styles.goals}>
            <DailyGoal 
              icon={<TrendingUp size={18} color={theme.colors.primary} />}
              title="Steps"
              current={6540}
              target={10000}
              unit="steps"
              color={theme.colors.primary}
              theme={theme}
            />
            <DailyGoal 
              icon={<Droplets size={18} color={theme.colors.secondary} />}
              title="Water"
              current={4}
              target={8}
              unit="glasses"
              color={theme.colors.secondary}
              theme={theme}
            />
          </View>
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
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  greeting: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
  name: {
    fontFamily: 'Nunito-Bold',
    fontSize: 22,
    marginTop: 4,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  streakText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    marginLeft: 4,
  },
  summaryCard: {
    marginHorizontal: 24,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryTitle: {
    fontFamily: 'Nunito-Bold',
    fontSize: 18,
    marginBottom: 16,
  },
  nutritionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  mealProgress: {
    marginTop: 24,
  },
  mealProgressTitle: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 16,
    marginBottom: 12,
  },
  mealItems: {
    gap: 12,
  },
  mealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 12,
  },
  mealIcon: {
    height: 36,
    width: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(102, 212, 176, 0.15)',
  },
  mealInfo: {
    flex: 1,
    marginLeft: 12,
  },
  mealName: {
    fontFamily: 'Inter-Medium',
    fontSize: 15,
  },
  mealCalories: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    marginTop: 2,
  },
  addMealButton: {
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  addMealText: {
    fontFamily: 'Inter-Medium',
    fontSize: 15,
  },
  weeklyStatsCard: {
    marginHorizontal: 24,
    marginTop: 24,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontFamily: 'Nunito-Bold',
    fontSize: 18,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    marginRight: 4,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  goalsContainer: {
    paddingHorizontal: 24,
    marginTop: 24,
    marginBottom: 100,
  },
  sectionTitle: {
    fontFamily: 'Nunito-Bold',
    fontSize: 18,
    marginBottom: 16,
  },
  goals: {
    gap: 16,
  },
});