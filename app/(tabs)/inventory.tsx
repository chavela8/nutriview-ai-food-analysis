import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Image, Alert, ActivityIndicator } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Search, Plus, AlertCircle, Refrigerator, Package, Filter, Trash2, Edit, ShoppingBag, ArrowRight, ChefHat, CheckCircle, Bookmark, PlusCircle, Clock, Calendar } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';

// Компонент категорий продуктов
const CategoryButton = ({ category, isActive, onPress, theme }) => {
  return (
    <TouchableOpacity
      style={[
        styles.categoryButton,
        isActive ? { backgroundColor: theme.colors.primary } : { backgroundColor: theme.colors.card }
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.categoryButtonText,
          isActive ? { color: '#FFFFFF' } : { color: theme.colors.text }
        ]}
      >
        {category.name}
      </Text>
    </TouchableOpacity>
  );
};

// Компонент продукта в инвентаре
const InventoryItem = ({ item, onEdit, onDelete, theme }) => {
  // Расчет дней до окончания срока годности
  const calculateDaysLeft = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };
  
  const daysLeft = calculateDaysLeft(item.expiryDate);
  
  // Определение цвета статуса в зависимости от оставшихся дней
  const getStatusColor = () => {
    if (daysLeft < 0) return theme.colors.danger;
    if (daysLeft <= 3) return theme.colors.warning;
    return theme.colors.success;
  };
  
  // Получение текста статуса
  const getStatusText = () => {
    if (daysLeft < 0) return 'Просрочено';
    if (daysLeft === 0) return 'Истекает сегодня';
    if (daysLeft === 1) return 'Истекает завтра';
    return `${daysLeft} дн. до истечения срока`;
  };
  
  return (
    <View style={[styles.inventoryItem, { backgroundColor: theme.colors.card }]}>
      <View style={styles.itemImageContainer}>
        <Image 
          source={{ uri: item.imageUrl }}
          style={styles.itemImage}
          defaultSource={require('../../assets/images/placeholder-food.png')}
        />
        
        {item.quantity <= item.lowStockThreshold && (
          <View style={[styles.lowStockBadge, { backgroundColor: theme.colors.warning }]}>
            <Text style={styles.lowStockText}>Мало</Text>
          </View>
        )}
      </View>
      
      <View style={styles.itemDetails}>
        <Text style={[styles.itemName, { color: theme.colors.text }]}>{item.name}</Text>
        
        <View style={styles.itemInfo}>
          <View style={styles.itemQuantity}>
            <Text style={[styles.quantityText, { color: theme.colors.textSecondary }]}>
              {item.quantity} {item.unit}
            </Text>
          </View>
          
          <View style={[styles.itemStatus, { backgroundColor: getStatusColor() + '20' }]}>
            <Clock size={12} color={getStatusColor()} style={{ marginRight: 4 }} />
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {getStatusText()}
            </Text>
          </View>
        </View>
        
        <View style={styles.itemDate}>
          <Calendar size={12} color={theme.colors.textSecondary} style={{ marginRight: 4 }} />
          <Text style={[styles.dateText, { color: theme.colors.textSecondary }]}>
            До {new Date(item.expiryDate).toLocaleDateString('ru-RU')}
          </Text>
        </View>
      </View>
      
      <View style={styles.itemActions}>
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: theme.colors.backgroundSecondary }]}
          onPress={() => onEdit(item)}
        >
          <Edit size={16} color={theme.colors.text} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: theme.colors.dangerLight }]}
          onPress={() => onDelete(item)}
        >
          <Trash2 size={16} color={theme.colors.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Компонент рецепта
const RecipeCard = ({ recipe, theme }) => {
  return (
    <TouchableOpacity style={[styles.recipeCard, { backgroundColor: theme.colors.card }]}>
      <Image 
        source={{ uri: recipe.imageUrl }}
        style={styles.recipeImage}
        defaultSource={require('../../assets/images/placeholder-food.png')}
      />
      
      <View style={styles.recipeInfo}>
        <View style={styles.recipeHeader}>
          <Text style={[styles.recipeName, { color: theme.colors.text }]}>{recipe.name}</Text>
          
          <TouchableOpacity style={styles.bookmarkButton}>
            <Bookmark size={16} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.recipeDetails}>
          <View style={styles.recipeDetail}>
            <Clock size={14} color={theme.colors.textSecondary} style={{ marginRight: 4 }} />
            <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
              {recipe.time} мин
            </Text>
          </View>
          
          <View style={styles.recipeDetail}>
            <Package size={14} color={theme.colors.textSecondary} style={{ marginRight: 4 }} />
            <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
              {recipe.ingredients.length} ингредиентов
            </Text>
          </View>
        </View>
        
        <View style={styles.matchContainer}>
          <View style={[
            styles.matchPercentage, 
            { 
              width: `${recipe.matchPercentage}%`,
              backgroundColor: recipe.matchPercentage > 70 ? theme.colors.success : theme.colors.warning
            }
          ]} />
          
          <Text style={[styles.matchText, { color: theme.colors.text }]}>
            Совпадение {recipe.matchPercentage}%
          </Text>
        </View>
        
        <View style={styles.missingIngredientsContainer}>
          {recipe.missingIngredients.map((ingredient, index) => (
            <View key={index} style={styles.missingIngredient}>
              <Text style={[styles.missingIngredientText, { color: theme.colors.textSecondary }]}>
                • {ingredient}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function InventoryScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadInventoryData();
  }, []);

  useEffect(() => {
    // Фильтруем рецепты в зависимости от имеющихся продуктов
    updateRecipeRecommendations();
  }, [inventoryItems]);
  
  const loadInventoryData = () => {
    setLoading(true);
    
    // Имитация загрузки данных с сервера
    setTimeout(() => {
      // Демо-данные для категорий продуктов
      const mockCategories = [
        { id: 'all', name: 'Все' },
        { id: 'dairy', name: 'Молочные' },
        { id: 'meat', name: 'Мясо' },
        { id: 'vegetables', name: 'Овощи' },
        { id: 'fruits', name: 'Фрукты' },
        { id: 'grains', name: 'Крупы' },
        { id: 'snacks', name: 'Снеки' }
      ];
      
      // Демо-данные для продуктов в инвентаре
      const mockInventoryItems = [
        {
          id: 1,
          name: 'Молоко',
          category: 'dairy',
          quantity: 1,
          unit: 'л',
          expiryDate: '2023-12-10',
          imageUrl: 'https://images.unsplash.com/photo-1563636619-e9143da7973b',
          lowStockThreshold: 1
        },
        {
          id: 2,
          name: 'Куриное филе',
          category: 'meat',
          quantity: 0.5,
          unit: 'кг',
          expiryDate: '2023-12-08',
          imageUrl: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791',
          lowStockThreshold: 0.5
        },
        {
          id: 3,
          name: 'Помидоры',
          category: 'vegetables',
          quantity: 4,
          unit: 'шт',
          expiryDate: '2023-12-05',
          imageUrl: 'https://images.unsplash.com/photo-1607305387299-a3d9611cd469',
          lowStockThreshold: 2
        },
        {
          id: 4,
          name: 'Яблоки',
          category: 'fruits',
          quantity: 6,
          unit: 'шт',
          expiryDate: '2023-12-15',
          imageUrl: 'https://images.unsplash.com/photo-1570913149827-d2ac84ab3f9a',
          lowStockThreshold: 3
        },
        {
          id: 5,
          name: 'Гречка',
          category: 'grains',
          quantity: 0.9,
          unit: 'кг',
          expiryDate: '2024-05-20',
          imageUrl: 'https://images.unsplash.com/photo-1615485500704-8e990f9900d1',
          lowStockThreshold: 0.3
        },
        {
          id: 6,
          name: 'Огурцы',
          category: 'vegetables',
          quantity: 3,
          unit: 'шт',
          expiryDate: '2023-12-04',
          imageUrl: 'https://images.unsplash.com/photo-1449175334484-59579fe313c0',
          lowStockThreshold: 2
        },
        {
          id: 7,
          name: 'Сыр',
          category: 'dairy',
          quantity: 0.2,
          unit: 'кг',
          expiryDate: '2023-12-09',
          imageUrl: 'https://images.unsplash.com/photo-1589881133595-a3c085cb731d',
          lowStockThreshold: 0.1
        }
      ];
      
      setCategories(mockCategories);
      setInventoryItems(mockInventoryItems);
      updateRecipeRecommendations(mockInventoryItems);
      setLoading(false);
    }, 1000);
  };
  
  const updateRecipeRecommendations = (items = inventoryItems) => {
    // Демо-данные для рекомендуемых рецептов
    const mockRecipes = [
      {
        id: 1,
        name: 'Греческий салат',
        imageUrl: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe',
        time: 15,
        ingredients: ['Помидоры', 'Огурцы', 'Оливки', 'Сыр фета', 'Лук красный', 'Оливковое масло'],
        matchPercentage: 85,
        missingIngredients: ['Оливки', 'Сыр фета']
      },
      {
        id: 2,
        name: 'Куриное фрикасе',
        imageUrl: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2',
        time: 40,
        ingredients: ['Куриное филе', 'Сливки', 'Грибы', 'Лук', 'Морковь', 'Специи', 'Масло растительное'],
        matchPercentage: 65,
        missingIngredients: ['Сливки', 'Грибы', 'Морковь']
      },
      {
        id: 3,
        name: 'Яблочный десерт',
        imageUrl: 'https://images.unsplash.com/photo-1568571780765-9276a706ab5d',
        time: 25,
        ingredients: ['Яблоки', 'Сахар', 'Корица', 'Сливочное масло', 'Мука'],
        matchPercentage: 50,
        missingIngredients: ['Корица', 'Сливочное масло', 'Мука']
      }
    ];
    
    // В реальном приложении здесь бы был алгоритм, который анализирует имеющиеся продукты
    // и подбирает рецепты с наибольшим процентом совпадения ингредиентов
    setRecipes(mockRecipes);
  };
  
  const handleCategoryPress = (categoryId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveCategory(categoryId);
  };
  
  const handleAddItem = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // В реальном приложении здесь бы был переход на экран добавления продукта
    Alert.alert(
      'Добавление продукта',
      'Здесь будет форма добавления нового продукта в инвентарь.',
      [{ text: 'OK' }]
    );
  };
  
  const handleEditItem = (item) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // В реальном приложении здесь бы был переход на экран редактирования продукта
    Alert.alert(
      'Редактирование продукта',
      `Здесь будет форма редактирования продукта "${item.name}".`,
      [{ text: 'OK' }]
    );
  };
  
  const handleDeleteItem = (item) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    Alert.alert(
      'Удаление продукта',
      `Вы уверены, что хотите удалить "${item.name}" из инвентаря?`,
      [
        { 
          text: 'Отмена',
          style: 'cancel'
        },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: () => {
            // Удаляем продукт из списка
            const updatedItems = inventoryItems.filter(i => i.id !== item.id);
            setInventoryItems(updatedItems);
            // Обновляем рекомендации рецептов
            updateRecipeRecommendations(updatedItems);
          }
        }
      ]
    );
  };
  
  const handleSearch = (query) => {
    setSearchQuery(query);
  };
  
  const getFilteredItems = () => {
    let filtered = inventoryItems;
    
    // Фильтрация по категории
    if (activeCategory !== 'all') {
      filtered = filtered.filter(item => item.category === activeCategory);
    }
    
    // Фильтрация по поисковому запросу
    if (searchQuery) {
      filtered = filtered.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
    }
    
    return filtered;
  };
  
  const renderCategories = () => {
    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScrollView}
        contentContainerStyle={styles.categoriesContainer}
      >
        {categories.map(category => (
          <CategoryButton
            key={category.id}
            category={category}
            isActive={activeCategory === category.id}
            onPress={() => handleCategoryPress(category.id)}
            theme={theme}
          />
        ))}
      </ScrollView>
    );
  };
  
  const renderInventory = () => {
    const filteredItems = getFilteredItems();
    
    if (filteredItems.length === 0) {
      return (
        <View style={styles.emptyStateContainer}>
          <Package size={64} color={theme.colors.textTertiary} />
          <Text style={[styles.emptyStateTitle, { color: theme.colors.text }]}>
            Продукты не найдены
          </Text>
          <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
            {searchQuery ? 
              'Попробуйте изменить запрос или категорию' : 
              'Добавьте продукты в ваш инвентарь'
            }
          </Text>
          
          <TouchableOpacity 
            style={[styles.emptyStateButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleAddItem}
          >
            <Plus size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.emptyStateButtonText}>
              Добавить продукт
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return (
      <View style={styles.inventoryList}>
        {filteredItems.map(item => (
          <InventoryItem
            key={item.id}
            item={item}
            onEdit={handleEditItem}
            onDelete={handleDeleteItem}
            theme={theme}
          />
        ))}
      </View>
    );
  };
  
  const renderRecipes = () => {
    if (recipes.length === 0) {
      return (
        <View style={styles.emptyRecipesContainer}>
          <ChefHat size={48} color={theme.colors.textTertiary} />
          <Text style={[styles.emptyRecipesText, { color: theme.colors.textSecondary }]}>
            Нет доступных рецептов для ваших продуктов
          </Text>
        </View>
      );
    }
    
    return (
      <View style={styles.recipesContainer}>
        <View style={styles.recipesHeader}>
          <Text style={[styles.recipesTitle, { color: theme.colors.text }]}>
            Что можно приготовить
          </Text>
          
          <TouchableOpacity style={styles.seeAllRecipes}>
            <Text style={[styles.seeAllText, { color: theme.colors.primary }]}>
              Смотреть все
            </Text>
            <ArrowRight size={16} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
        
        {recipes.map(recipe => (
          <RecipeCard key={recipe.id} recipe={recipe} theme={theme} />
        ))}
      </View>
    );
  };
  
  const renderShoppingListButton = () => {
    return (
      <BlurView
        tint={theme.dark ? 'dark' : 'light'}
        intensity={80}
        style={[styles.shoppingListButton, { 
          backgroundColor: theme.dark ? 'rgba(20, 20, 20, 0.7)' : 'rgba(255, 255, 255, 0.7)',
        }]}
      >
        <TouchableOpacity 
          style={[styles.shoppingListContent, { backgroundColor: theme.colors.primary }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            // Переход к списку покупок
          }}
        >
          <ShoppingBag size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.shoppingListText}>Список покупок</Text>
        </TouchableOpacity>
      </BlurView>
    );
  };
  
  const renderExpiringItems = () => {
    // Находим продукты, которые скоро истекут (в течение 3 дней)
    const expiringItems = inventoryItems.filter(item => {
      const today = new Date();
      const expiry = new Date(item.expiryDate);
      const diffTime = expiry - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 3;
    });
    
    if (expiringItems.length === 0) return null;
    
    return (
      <View style={[styles.expiringContainer, { backgroundColor: theme.colors.warningLight }]}>
        <AlertCircle size={20} color={theme.colors.warning} style={{ marginRight: 8 }} />
        <Text style={[styles.expiringText, { color: theme.colors.warning }]}>
          У {expiringItems.length} продуктов истекает срок годности
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Мой инвентарь</Text>
        
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.colors.primaryLight }]}
          onPress={handleAddItem}
        >
          <Plus size={20} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: theme.colors.card }]}>
          <Search size={20} color={theme.colors.textSecondary} style={{ marginRight: 8 }} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text }]}
          placeholder="Поиск продуктов"
          placeholderTextColor={theme.colors.textTertiary}
          value={searchQuery}
            onChangeText={handleSearch}
        />
      </View>

        <TouchableOpacity style={[styles.filterButton, { backgroundColor: theme.colors.card }]}>
          <Filter size={20} color={theme.colors.text} />
        </TouchableOpacity>
                  </View>

      {renderExpiringItems()}
      
      {renderCategories()}
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Загружаем инвентарь...
                    </Text>
                  </View>
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.contentContainer}>
            {renderInventory()}
            {renderRecipes()}
          </View>
        </ScrollView>
      )}
      
      {renderShoppingListButton()}
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
    paddingBottom: 16,
  },
  title: {
    fontFamily: 'Nunito-Bold',
    fontSize: 28,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoriesScrollView: {
    marginBottom: 16,
  },
  categoriesContainer: {
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    marginTop: 16,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 120,
  },
  inventoryList: {
    marginBottom: 32,
  },
  inventoryItem: {
    flexDirection: 'row',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  itemImageContainer: {
    width: 80,
    height: 80,
    position: 'relative',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  lowStockBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  lowStockText: {
    fontFamily: 'Inter-Medium',
    fontSize: 10,
    color: '#FFFFFF',
  },
  itemDetails: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  itemName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    marginBottom: 6,
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  itemQuantity: {
    marginRight: 8,
  },
  quantityText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  itemStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
  },
  itemDate: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
  },
  itemActions: {
    justifyContent: 'center',
    paddingRight: 12,
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginVertical: 40,
  },
  emptyStateTitle: {
    fontFamily: 'Nunito-Bold',
    fontSize: 20,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  emptyStateButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  expiringContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
  },
  expiringText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    flex: 1,
  },
  recipesContainer: {
    marginBottom: 24,
  },
  recipesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  recipesTitle: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 18,
  },
  seeAllRecipes: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    marginRight: 4,
  },
  emptyRecipesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginVertical: 20,
  },
  emptyRecipesText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  recipeCard: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  recipeImage: {
    width: '100%',
    height: 160,
  },
  recipeInfo: {
    padding: 16,
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  recipeName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    flex: 1,
    marginRight: 8,
  },
  bookmarkButton: {
    padding: 4,
  },
  recipeDetails: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  recipeDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  detailText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  matchContainer: {
    height: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 10,
    marginBottom: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  matchPercentage: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
  },
  matchText: {
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    lineHeight: 20,
  },
  missingIngredientsContainer: {
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 8,
    padding: 12,
  },
  missingIngredient: {
    marginBottom: 4,
  },
  missingIngredientText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  shoppingListButton: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    borderRadius: 30,
    overflow: 'hidden',
  },
  shoppingListContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  shoppingListText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  }
});