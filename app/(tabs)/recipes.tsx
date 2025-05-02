import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Search, Filter, ChevronRight, Clock, ThumbsUp, BarChart2, Users, ChefHat, BookOpen } from 'lucide-react-native';
import { Link } from 'expo-router';
import * as Haptics from 'expo-haptics';

export default function RecipesScreen() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  
  useEffect(() => {
    // Имитация загрузки данных
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  
  const categories = [
    { id: 'all', name: 'Все' },
    { id: 'breakfast', name: 'Завтраки' },
    { id: 'lunch', name: 'Обеды' },
    { id: 'dinner', name: 'Ужины' },
    { id: 'snacks', name: 'Перекусы' },
    { id: 'desserts', name: 'Десерты' }
  ];
  
  const recommendedRecipes = [
    {
      id: 1,
      name: 'Киноа с запечёнными овощами',
      image: 'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
      prepTime: '30 мин',
      calories: 380,
      protein: 12,
      carbs: 45,
      fat: 15,
      matchScore: 92
    },
    {
      id: 2,
      name: 'Греческий салат с курицей',
      image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
      prepTime: '25 мин',
      calories: 320,
      protein: 28,
      carbs: 12,
      fat: 18,
      matchScore: 85
    },
    {
      id: 3,
      name: 'Лосось с брокколи',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
      prepTime: '35 мин',
      calories: 450,
      protein: 38,
      carbs: 8,
      fat: 30,
      matchScore: 94
    }
  ];
  
  const collections = [
    {
      id: 1,
      name: 'Высокобелковые блюда',
      image: 'https://images.unsplash.com/photo-1547592180-85f173990554?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
      count: 18
    },
    {
      id: 2,
      name: 'Низкоуглеводные рецепты',
      image: 'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
      count: 24
    },
    {
      id: 3,
      name: 'Веганские блюда',
      image: 'https://images.unsplash.com/photo-1473093226795-af9932fe5856?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
      count: 15
    }
  ];
  
  const mealPlans = [
    {
      id: 1,
      name: 'План похудения',
      description: 'Сбалансированный рацион на 1800 ккал для снижения веса',
      days: 7
    },
    {
      id: 2,
      name: 'Спортивное питание',
      description: 'Высокобелковый рацион для набора мышечной массы',
      days: 14
    },
    {
      id: 3,
      name: 'Здоровое сердце',
      description: 'Диета с низким содержанием натрия и насыщенных жиров',
      days: 28
    }
  ];
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Рецепты</Text>
        
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={[styles.iconButton, { backgroundColor: theme.colors.card }]}
          >
            <Search size={20} color={theme.colors.text} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.iconButton, { backgroundColor: theme.colors.card }]}
          >
            <Filter size={20} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.categoriesContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContent}
        >
          {categories.map((category) => (
            <TouchableOpacity 
              key={category.id} 
              style={[
                styles.categoryButton, 
                activeCategory === category.id && styles.activeCategoryButton,
                { 
                  backgroundColor: activeCategory === category.id 
                    ? theme.colors.primary 
                    : theme.colors.card 
                }
              ]}
              onPress={() => handleCategoryChange(category.id)}
            >
              <Text 
                style={[
                  styles.categoryText, 
                  { 
                    color: activeCategory === category.id 
                      ? '#FFFFFF' 
                      : theme.colors.text 
                  }
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Загружаем рецепты...
          </Text>
        </View>
      ) : (
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Рекомендуемые для вас
              </Text>
              <TouchableOpacity style={styles.seeAllButton}>
                <Text style={[styles.seeAllText, { color: theme.colors.primary }]}>Все</Text>
                <ChevronRight size={16} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recipesContainer}
            >
              {recommendedRecipes.map((recipe) => (
                <TouchableOpacity 
                  key={recipe.id}
                  style={[styles.recipeCard, { backgroundColor: theme.colors.card }]}
                >
                  <Image 
                    source={{ uri: recipe.image }} 
                    style={styles.recipeImage} 
                  />
                  
                  <View style={styles.recipeContent}>
                    <View style={styles.recipeHeader}>
                      <Text style={[styles.recipeName, { color: theme.colors.text }]}>
                        {recipe.name}
                      </Text>
                      <View style={[styles.matchBadge, { backgroundColor: theme.colors.successLight }]}>
                        <Text style={[styles.matchText, { color: theme.colors.success }]}>
                          {recipe.matchScore}% совпадение
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.recipeMetaContainer}>
                      <View style={styles.recipeMeta}>
                        <Clock size={14} color={theme.colors.textSecondary} style={styles.recipeMetaIcon} />
                        <Text style={[styles.recipeMetaText, { color: theme.colors.textSecondary }]}>
                          {recipe.prepTime}
                        </Text>
                      </View>
                      
                      <View style={styles.recipeMeta}>
                        <BarChart2 size={14} color={theme.colors.textSecondary} style={styles.recipeMetaIcon} />
                        <Text style={[styles.recipeMetaText, { color: theme.colors.textSecondary }]}>
                          {recipe.calories} ккал
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.macrosContainer}>
                      <View style={styles.macroItem}>
                        <Text style={[styles.macroValue, { color: theme.colors.secondary }]}>
                          {recipe.protein}г
                        </Text>
                        <Text style={[styles.macroLabel, { color: theme.colors.textSecondary }]}>
                          Белки
                        </Text>
                      </View>
                      
                      <View style={styles.macroItem}>
                        <Text style={[styles.macroValue, { color: theme.colors.tertiary }]}>
                          {recipe.carbs}г
                        </Text>
                        <Text style={[styles.macroLabel, { color: theme.colors.textSecondary }]}>
                          Углеводы
                        </Text>
                      </View>
                      
                      <View style={styles.macroItem}>
                        <Text style={[styles.macroValue, { color: theme.colors.accent }]}>
                          {recipe.fat}г
                        </Text>
                        <Text style={[styles.macroLabel, { color: theme.colors.textSecondary }]}>
                          Жиры
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Коллекции рецептов
              </Text>
              <TouchableOpacity style={styles.seeAllButton}>
                <Text style={[styles.seeAllText, { color: theme.colors.primary }]}>Все</Text>
                <ChevronRight size={16} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.collectionsContainer}
            >
              {collections.map((collection) => (
                <TouchableOpacity 
                  key={collection.id}
                  style={styles.collectionCard}
                >
                  <Image 
                    source={{ uri: collection.image }} 
                    style={styles.collectionImage} 
                  />
                  
                  <View style={styles.collectionOverlay}>
                    <Text style={styles.collectionName}>
                      {collection.name}
                    </Text>
                    <Text style={styles.collectionCount}>
                      {collection.count} рецептов
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Планы питания
              </Text>
              <TouchableOpacity style={styles.seeAllButton}>
                <Text style={[styles.seeAllText, { color: theme.colors.primary }]}>Все</Text>
                <ChevronRight size={16} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
            
            {mealPlans.map((plan) => (
              <TouchableOpacity 
                key={plan.id}
                style={[styles.planCard, { backgroundColor: theme.colors.card }]}
              >
                <View style={[styles.planIcon, { backgroundColor: theme.colors.primaryLight }]}>
                  <ChefHat size={24} color={theme.colors.primary} />
                </View>
                
                <View style={styles.planContent}>
                  <Text style={[styles.planName, { color: theme.colors.text }]}>
                    {plan.name}
                  </Text>
                  <Text style={[styles.planDescription, { color: theme.colors.textSecondary }]}>
                    {plan.description}
                  </Text>
                  <Text style={[styles.planDuration, { color: theme.colors.primary }]}>
                    {plan.days} дней
                  </Text>
                </View>
                
                <ChevronRight size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={styles.createRecipeContainer}>
            <TouchableOpacity 
              style={[styles.createRecipeButton, { backgroundColor: theme.colors.card }]}
            >
              <View style={[styles.createRecipeIcon, { backgroundColor: theme.colors.primaryLight }]}>
                <BookOpen size={24} color={theme.colors.primary} />
              </View>
              
              <View style={styles.createRecipeContent}>
                <Text style={[styles.createRecipeTitle, { color: theme.colors.text }]}>
                  Создать свой рецепт
                </Text>
                <Text style={[styles.createRecipeDescription, { color: theme.colors.textSecondary }]}>
                  Добавьте свой собственный рецепт в библиотеку
                </Text>
              </View>
              
              <ChevronRight size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
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
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoriesContainer: {
    paddingTop: 8,
    paddingBottom: 16,
  },
  categoriesContent: {
    paddingHorizontal: 24,
    gap: 12,
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 100,
  },
  activeCategoryButton: {
    // Стили для активной категории
  },
  categoryText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
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
  scrollContent: {
    paddingBottom: 100,
  },
  sectionContainer: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  sectionTitle: {
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
  recipesContainer: {
    paddingLeft: 24,
    paddingRight: 8,
    gap: 16,
  },
  recipeCard: {
    width: 280,
    borderRadius: 16,
    overflow: 'hidden',
  },
  recipeImage: {
    width: '100%',
    height: 160,
  },
  recipeContent: {
    padding: 16,
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  recipeName: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 16,
    flex: 1,
    marginRight: 8,
  },
  matchBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  matchText: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
  },
  recipeMetaContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 16,
  },
  recipeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recipeMetaIcon: {
    marginRight: 4,
  },
  recipeMetaText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
  },
  macrosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroItem: {
    alignItems: 'center',
  },
  macroValue: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 14,
  },
  macroLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    marginTop: 2,
  },
  collectionsContainer: {
    paddingLeft: 24,
    paddingRight: 8,
    gap: 16,
  },
  collectionCard: {
    width: 200,
    height: 120,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  collectionImage: {
    width: '100%',
    height: '100%',
  },
  collectionOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  collectionName: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  collectionCount: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 24,
    marginBottom: 12,
    borderRadius: 16,
  },
  planIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  planContent: {
    flex: 1,
  },
  planName: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 16,
    marginBottom: 4,
  },
  planDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    marginBottom: 4,
  },
  planDuration: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
  },
  createRecipeContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  createRecipeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
  },
  createRecipeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  createRecipeContent: {
    flex: 1,
  },
  createRecipeTitle: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 16,
    marginBottom: 4,
  },
  createRecipeDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
  },
}); 