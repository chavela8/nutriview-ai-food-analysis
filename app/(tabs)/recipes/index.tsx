import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Plus, ChefHat, Clock, Users } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

type Recipe = {
  id: string;
  name: string;
  description: string;
  servings: number;
  cooking_time: number;
  image_url: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
};

export default function RecipesScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecipes();
  }, []);

  async function loadRecipes() {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select(`
          id,
          name,
          description,
          servings,
          cooking_time,
          image_url,
          recipe_ingredients (
            amount,
            unit,
            food_items (
              calories,
              protein,
              carbs,
              fat
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Рассчитываем общую пищевую ценность для каждого рецепта
      const recipesWithNutrition = data.map(recipe => {
        let totalCalories = 0;
        let totalProtein = 0;
        let totalCarbs = 0;
        let totalFat = 0;

        recipe.recipe_ingredients?.forEach(ingredient => {
          const { amount } = ingredient;
          const { calories, protein, carbs, fat } = ingredient.food_items;
          
          totalCalories += calories * amount;
          totalProtein += protein * amount;
          totalCarbs += carbs * amount;
          totalFat += fat * amount;
        });

        return {
          ...recipe,
          total_calories: Math.round(totalCalories),
          total_protein: Math.round(totalProtein),
          total_carbs: Math.round(totalCarbs),
          total_fat: Math.round(totalFat),
        };
      });

      setRecipes(recipesWithNutrition);
    } catch (error) {
      console.error('Error loading recipes:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Рецепты</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => router.push('/recipes/create')}
        >
          <Plus size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {recipes.map((recipe) => (
          <TouchableOpacity
            key={recipe.id}
            style={[styles.recipeCard, { backgroundColor: theme.colors.card }]}
            onPress={() => router.push(`/recipes/${recipe.id}`)}
          >
            <Image
              source={{ uri: recipe.image_url || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg' }}
              style={styles.recipeImage}
            />
            
            <View style={styles.recipeContent}>
              <Text style={[styles.recipeName, { color: theme.colors.text }]}>
                {recipe.name}
              </Text>
              
              <Text 
                style={[styles.recipeDescription, { color: theme.colors.textSecondary }]}
                numberOfLines={2}
              >
                {recipe.description}
              </Text>
              
              <View style={styles.recipeInfo}>
                <View style={styles.infoItem}>
                  <ChefHat size={16} color={theme.colors.primary} />
                  <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                    {recipe.total_calories} ккал
                  </Text>
                </View>
                
                <View style={styles.infoItem}>
                  <Clock size={16} color={theme.colors.primary} />
                  <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                    {recipe.cooking_time} мин
                  </Text>
                </View>
                
                <View style={styles.infoItem}>
                  <Users size={16} color={theme.colors.primary} />
                  <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                    {recipe.servings} порц.
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
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
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Nunito-Bold',
    fontSize: 28,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    gap: 16,
  },
  recipeCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  recipeImage: {
    width: '100%',
    height: 200,
  },
  recipeContent: {
    padding: 16,
  },
  recipeName: {
    fontFamily: 'Nunito-Bold',
    fontSize: 18,
    marginBottom: 8,
  },
  recipeDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  recipeInfo: {
    flexDirection: 'row',
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
});