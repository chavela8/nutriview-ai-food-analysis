import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, Share, Alert } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, router } from 'expo-router';
import { ChevronLeft, Clock, Users, Heart, BarChart2, Share as ShareIcon, 
  Plus, Award, Flame, Droplet, MessageCircle, PanelTop } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';

type Ingredient = {
  id: string;
  name: string;
  amount: number;
  unit: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

type Step = {
  id: string;
  order_number: number;
  description: string;
  image_url?: string;
  time_minutes?: number;
}

type RecipeDetails = {
  id: string;
  name: string;
  description: string;
  image_url: string;
  cooking_time: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  ingredients: Ingredient[];
  steps: Step[];
  is_favorite?: boolean;
}

export default function RecipeDetailsScreen() {
  const { theme } = useTheme();
  const { id } = useLocalSearchParams();
  const [recipe, setRecipe] = useState<RecipeDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState<'ingredients' | 'steps'>('ingredients');

  useEffect(() => {
    loadRecipeDetails();
  }, [id]);

  const loadRecipeDetails = async () => {
    try {
      setLoading(true);
      
      // В реальном приложении здесь был бы запрос к API или базе данных
      // Имитируем загрузку данных
      setTimeout(() => {
        // Демо-данные для примера
        const recipeData: RecipeDetails = {
          id: id as string,
          name: 'Киноа с запечёнными овощами и тофу',
          description: 'Питательное и полезное блюдо с богатым содержанием белка и клетчатки. Идеально подходит для вегетарианской диеты и любителей здорового питания.',
          image_url: 'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?auto=format&fit=crop&w=800&q=80',
          cooking_time: 45,
          servings: 4,
          difficulty: 'medium',
          total_calories: 380,
          total_protein: 12,
          total_carbs: 45,
          total_fat: 15,
          ingredients: [
            { id: '1', name: 'Киноа', amount: 200, unit: 'г', calories: 120, protein: 4, carbs: 21, fat: 2 },
            { id: '2', name: 'Брокколи', amount: 150, unit: 'г', calories: 45, protein: 4, carbs: 8, fat: 0.5 },
            { id: '3', name: 'Сладкий перец', amount: 1, unit: 'шт', calories: 30, protein: 1, carbs: 6, fat: 0.3 },
            { id: '4', name: 'Морковь', amount: 2, unit: 'шт', calories: 50, protein: 1, carbs: 12, fat: 0.2 },
            { id: '5', name: 'Тофу', amount: 200, unit: 'г', calories: 80, protein: 10, carbs: 1, fat: 4 },
            { id: '6', name: 'Оливковое масло', amount: 2, unit: 'ст.л.', calories: 80, protein: 0, carbs: 0, fat: 9 },
            { id: '7', name: 'Соевый соус', amount: 1, unit: 'ст.л.', calories: 10, protein: 1, carbs: 1, fat: 0 },
            { id: '8', name: 'Чеснок', amount: 2, unit: 'зуб.', calories: 8, protein: 0.4, carbs: 1.8, fat: 0 },
            { id: '9', name: 'Лимонный сок', amount: 1, unit: 'ст.л.', calories: 5, protein: 0, carbs: 1.5, fat: 0 },
          ],
          steps: [
            { id: '1', order_number: 1, description: 'Промойте киноа в холодной воде. Варите в 2 стаканах воды на среднем огне 15-20 минут до готовности.' },
            { id: '2', order_number: 2, description: 'Нарежьте брокколи на соцветия, морковь и перец — кубиками, тофу — брусочками.' },
            { id: '3', order_number: 3, description: 'Разогрейте духовку до 200°C. Выложите овощи и тофу на противень, сбрызните оливковым маслом и посолите.' },
            { id: '4', order_number: 4, description: 'Запекайте овощи и тофу 20-25 минут до золотистой корочки, периодически помешивая.' },
            { id: '5', order_number: 5, description: 'Смешайте соевый соус, измельченный чеснок и лимонный сок для заправки.' },
            { id: '6', order_number: 6, description: 'Соедините готовую киноа с запеченными овощами и тофу, полейте заправкой и перемешайте.' },
          ],
          is_favorite: false
        };
        
        setRecipe(recipeData);
        setIsFavorite(!!recipeData.is_favorite);
        setLoading(false);
      }, 1000);
      
      // В реальном приложении код будет примерно такой:
      /*
      const { data, error } = await supabase
        .from('recipes')
        .select(`
          id,
          name,
          description,
          image_url,
          cooking_time,
          servings,
          difficulty,
          total_calories,
          total_protein,
          total_carbs,
          total_fat,
          ingredients:recipe_ingredients(
            id,
            amount,
            unit,
            food_items(
              id,
              name,
              calories,
              protein,
              carbs,
              fat
            )
          ),
          steps:recipe_steps(
            id,
            order_number,
            description,
            image_url,
            time_minutes
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      
      // Проверка избранного
      const { data: favoriteData } = await supabase
        .from('user_favorites')
        .select('id')
        .eq('recipe_id', id)
        .eq('user_id', currentUser.id)
        .single();
        
      setIsFavorite(!!favoriteData);
      setRecipe(data);
      */
      
    } catch (error) {
      console.error('Error loading recipe details:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить детали рецепта');
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsFavorite(!isFavorite);
    
    // В реальном приложении здесь был бы запрос к API или базе данных
    // для добавления/удаления из избранного
    /*
    try {
      if (isFavorite) {
        // Удаление из избранного
        await supabase
          .from('user_favorites')
          .delete()
          .eq('recipe_id', id)
          .eq('user_id', currentUser.id);
      } else {
        // Добавление в избранное
        await supabase
          .from('user_favorites')
          .insert({
            recipe_id: id,
            user_id: currentUser.id,
            created_at: new Date()
          });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      // Откатываем состояние в случае ошибки
      setIsFavorite(!isFavorite);
      Alert.alert('Ошибка', 'Не удалось обновить избранное');
    }
    */
  };

  const shareRecipe = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!recipe) return;
    
    try {
      await Share.share({
        message: `Попробуй рецепт "${recipe.name}" в приложении NutriView AI!`,
        // В реальном приложении здесь был бы URL для глубоких ссылок
        url: `https://nutriview.app/recipes/${recipe.id}`
      });
    } catch (error) {
      console.error('Error sharing recipe:', error);
    }
  };

  const addToPlan = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // В реальном приложении здесь был бы переход на экран добавления в план питания
    // с передачей ID рецепта
    router.push({
      pathname: '/(tabs)/planner/add-meal',
      params: { recipeId: recipe?.id }
    });
  };

  const handleTabChange = (tab: 'ingredients' | 'steps') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
  };

  const renderDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'Легко';
      case 'medium':
        return 'Средне';
      case 'hard':
        return 'Сложно';
      default:
        return difficulty;
    }
  };

  const renderDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return theme.colors.success;
      case 'medium':
        return theme.colors.primary;
      case 'hard':
        return theme.colors.warning;
      default:
        return theme.colors.primary;
    }
  };

  const renderNutrientBar = (
    value: number, 
    maxValue: number, 
    color: string,
    backgroundColor: string
  ) => {
    const percentage = Math.min((value / maxValue) * 100, 100);
    
    return (
      <View style={[styles.nutrientBarContainer, { backgroundColor }]}>
        <View 
          style={[
            styles.nutrientBar, 
            { width: `${percentage}%`, backgroundColor: color }
          ]} 
        />
      </View>
    );
  };

  const renderIngredientsList = () => {
    if (!recipe) return null;
    
    return (
      <View style={styles.ingredientsContainer}>
        {recipe.ingredients.map((ingredient) => (
          <View key={ingredient.id} style={styles.ingredientItem}>
            <View style={styles.ingredientInfo}>
              <Text style={[styles.ingredientName, { color: theme.colors.text }]}>
                {ingredient.name}
              </Text>
              <Text style={[styles.ingredientAmount, { color: theme.colors.textSecondary }]}>
                {ingredient.amount} {ingredient.unit}
              </Text>
            </View>
            <Text style={[styles.ingredientCalories, { color: theme.colors.textSecondary }]}>
              {ingredient.calories} ккал
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderStepsList = () => {
    if (!recipe) return null;
    
    return (
      <View style={styles.stepsContainer}>
        {recipe.steps.map((step) => (
          <View key={step.id} style={styles.stepItem}>
            <View style={[styles.stepNumber, { backgroundColor: theme.colors.primaryLight }]}>
              <Text style={[styles.stepNumberText, { color: theme.colors.primary }]}>
                {step.order_number}
              </Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepDescription, { color: theme.colors.text }]}>
                {step.description}
              </Text>
              {step.time_minutes && (
                <View style={styles.stepTimeContainer}>
                  <Clock size={14} color={theme.colors.textSecondary} />
                  <Text style={[styles.stepTime, { color: theme.colors.textSecondary }]}>
                    {step.time_minutes} мин
                  </Text>
                </View>
              )}
              {step.image_url && (
                <Image 
                  source={{ uri: step.image_url }} 
                  style={styles.stepImage}
                  defaultSource={require('@/assets/images/placeholder-food.png')}
                />
              )}
            </View>
          </View>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar style={theme.dark ? 'light' : 'dark'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Загружаем рецепт...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!recipe) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar style={theme.dark ? 'light' : 'dark'} />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.text }]}>
            Рецепт не найден
          </Text>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Назад</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Изображение рецепта с навигацией и действиями */}
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: recipe.image_url }} 
            style={styles.recipeImage}
            defaultSource={require('@/assets/images/placeholder-food.png')}
          />
          
          <View style={styles.imageOverlay}>
            {/* Верхняя панель */}
            <View style={styles.topBar}>
              <TouchableOpacity 
                style={[styles.iconButton, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}
                onPress={() => router.back()}
              >
                <ChevronLeft size={24} color="#FFFFFF" />
              </TouchableOpacity>
              
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={[styles.iconButton, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}
                  onPress={toggleFavorite}
                >
                  <Heart 
                    size={24} 
                    color="#FFFFFF" 
                    fill={isFavorite ? "#FFFFFF" : "none"}
                  />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.iconButton, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}
                  onPress={shareRecipe}
                >
                  <ShareIcon size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Нижняя информационная панель */}
            <View style={styles.imageInfoBar}>
              <View style={styles.infoPill}>
                <Clock size={16} color="#FFFFFF" />
                <Text style={styles.infoPillText}>{recipe.cooking_time} мин</Text>
              </View>
              
              <View style={styles.infoPill}>
                <Users size={16} color="#FFFFFF" />
                <Text style={styles.infoPillText}>{recipe.servings} порц.</Text>
              </View>
              
              <View 
                style={[
                  styles.infoPill, 
                  { backgroundColor: renderDifficultyColor(recipe.difficulty) }
                ]}
              >
                <Award size={16} color="#FFFFFF" />
                <Text style={styles.infoPillText}>
                  {renderDifficultyLabel(recipe.difficulty)}
                </Text>
              </View>
            </View>
          </View>
        </View>
        
        {/* Основная информация */}
        <View style={styles.recipeInfoContainer}>
          <Text style={[styles.recipeName, { color: theme.colors.text }]}>
            {recipe.name}
          </Text>
          
          <Text style={[styles.recipeDescription, { color: theme.colors.textSecondary }]}>
            {recipe.description}
          </Text>
          
          {/* Пищевая ценность */}
          <View style={[styles.nutritionCard, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.nutritionTitle, { color: theme.colors.text }]}>
              Пищевая ценность
            </Text>
            
            <View style={styles.nutritionRow}>
              <View style={styles.nutrientContainer}>
                <Flame size={18} color={theme.colors.danger} style={styles.nutrientIcon} />
                <Text style={[styles.nutrientLabel, { color: theme.colors.textSecondary }]}>
                  Калории
                </Text>
                <Text style={[styles.nutrientValue, { color: theme.colors.text }]}>
                  {recipe.total_calories} ккал
                </Text>
                {renderNutrientBar(recipe.total_calories, 800, theme.colors.danger, `${theme.colors.danger}20`)}
              </View>
              
              <View style={styles.nutrientContainer}>
                <View style={[styles.proteinIcon, { backgroundColor: theme.colors.primary }]} />
                <Text style={[styles.nutrientLabel, { color: theme.colors.textSecondary }]}>
                  Белки
                </Text>
                <Text style={[styles.nutrientValue, { color: theme.colors.text }]}>
                  {recipe.total_protein}г
                </Text>
                {renderNutrientBar(recipe.total_protein, 50, theme.colors.primary, `${theme.colors.primary}20`)}
              </View>
              
              <View style={styles.nutrientContainer}>
                <View style={[styles.carbsIcon, { backgroundColor: theme.colors.warning }]} />
                <Text style={[styles.nutrientLabel, { color: theme.colors.textSecondary }]}>
                  Углеводы
                </Text>
                <Text style={[styles.nutrientValue, { color: theme.colors.text }]}>
                  {recipe.total_carbs}г
                </Text>
                {renderNutrientBar(recipe.total_carbs, 100, theme.colors.warning, `${theme.colors.warning}20`)}
              </View>
              
              <View style={styles.nutrientContainer}>
                <Droplet size={18} color={theme.colors.secondary} style={styles.nutrientIcon} />
                <Text style={[styles.nutrientLabel, { color: theme.colors.textSecondary }]}>
                  Жиры
                </Text>
                <Text style={[styles.nutrientValue, { color: theme.colors.text }]}>
                  {recipe.total_fat}г
                </Text>
                {renderNutrientBar(recipe.total_fat, 70, theme.colors.secondary, `${theme.colors.secondary}20`)}
              </View>
            </View>
          </View>
          
          {/* Табы для переключения между ингредиентами и шагами */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity 
              style={[
                styles.tab, 
                activeTab === 'ingredients' && { 
                  borderBottomColor: theme.colors.primary,
                  borderBottomWidth: 2 
                }
              ]}
              onPress={() => handleTabChange('ingredients')}
            >
              <Text 
                style={[
                  styles.tabText, 
                  { 
                    color: activeTab === 'ingredients' 
                      ? theme.colors.primary 
                      : theme.colors.textSecondary 
                  }
                ]}
              >
                Ингредиенты
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.tab, 
                activeTab === 'steps' && { 
                  borderBottomColor: theme.colors.primary,
                  borderBottomWidth: 2 
                }
              ]}
              onPress={() => handleTabChange('steps')}
            >
              <Text 
                style={[
                  styles.tabText, 
                  { 
                    color: activeTab === 'steps' 
                      ? theme.colors.primary 
                      : theme.colors.textSecondary 
                  }
                ]}
              >
                Приготовление
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Содержимое активного таба */}
          {activeTab === 'ingredients' ? renderIngredientsList() : renderStepsList()}
        </View>
      </ScrollView>
      
      {/* Нижняя кнопка для добавления в план питания */}
      <View style={[styles.bottomBar, { backgroundColor: theme.colors.background }]}>
        <TouchableOpacity 
          style={[styles.addToPlanButton, { backgroundColor: theme.colors.primary }]}
          onPress={addToPlan}
        >
          <Plus size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.addToPlanButtonText}>Добавить в план питания</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontFamily: 'Inter-Medium',
    fontSize: 18,
    marginBottom: 16,
    textAlign: 'center',
  },
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  backButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#FFFFFF',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 300,
  },
  recipeImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageInfoBar: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    padding: 16,
    gap: 12,
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 100,
    gap: 6,
  },
  infoPillText: {
    color: '#FFFFFF',
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  recipeInfoContainer: {
    padding: 24,
  },
  recipeName: {
    fontFamily: 'Nunito-Bold',
    fontSize: 24,
    marginBottom: 12,
  },
  recipeDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  nutritionCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  nutritionTitle: {
    fontFamily: 'Nunito-Bold',
    fontSize: 18,
    marginBottom: 16,
  },
  nutritionRow: {
    gap: 16,
  },
  nutrientContainer: {
    marginBottom: 12,
  },
  nutrientIcon: {
    marginBottom: 4,
  },
  proteinIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginBottom: 4,
  },
  carbsIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginBottom: 4,
  },
  nutrientLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginBottom: 4,
  },
  nutrientValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    marginBottom: 8,
  },
  nutrientBarContainer: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  nutrientBar: {
    height: '100%',
    borderRadius: 3,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
  },
  ingredientsContainer: {
    marginBottom: 24,
  },
  ingredientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    marginBottom: 2,
  },
  ingredientAmount: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  ingredientCalories: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  stepsContainer: {
    marginBottom: 24,
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    marginTop: 4,
  },
  stepNumberText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
  },
  stepContent: {
    flex: 1,
  },
  stepDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
  },
  stepTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  stepTime: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  stepImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginTop: 8,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  addToPlanButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  addToPlanButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#FFFFFF',
  },
});