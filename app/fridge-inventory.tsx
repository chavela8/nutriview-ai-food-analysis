import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Modal, ActivityIndicator, Image, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import * as Haptics from 'expo-haptics';
import { Plus, Camera, Search, Edit2, Trash2, RefreshCw, Filter, Tag, Calendar, AlertCircle, ArrowLeft, ShoppingBag, SortDesc } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';

// Тип для продукта в холодильнике
interface FridgeItem {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  category: string;
  expiryDate: string;
  daysUntilExpiry: number;
  imageUrl?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  addedDate: Date;
}

// Категории продуктов
const categories = [
  'Все',
  'Молочные',
  'Мясо',
  'Овощи',
  'Фрукты',
  'Напитки',
  'Готовые блюда',
  'Замороженные',
  'Другое'
];

// Типы для фильтров
interface Filters {
  category: string | null;
  expiryStatus: 'all' | 'expired' | 'expiring' | 'good';
  sortBy: 'name' | 'expiry' | 'category' | 'dateAdded';
}

const FridgeInventoryScreen = () => {
  const [items, setItems] = useState<FridgeItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<FridgeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Все');
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    quantity: '',
    unit: 'шт',
    category: 'Другое',
    expiryDate: new Date().toISOString().slice(0, 10)
  });
  const [sortOption, setSortOption] = useState('expiryDate'); // 'name', 'expiryDate', 'category'
  const [filters, setFilters] = useState<Filters>({
    category: null,
    expiryStatus: 'all',
    sortBy: 'name'
  });
  
  const { theme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    filterItems();
  }, [items, searchQuery, selectedCategory]);

  const loadItems = async () => {
    setIsLoading(true);
    try {
      const data = await fetchFridgeItems();
      setItems(data);
      setFilteredItems(data);
    } catch (error) {
      console.error('Ошибка загрузки продуктов:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить список продуктов');
    } finally {
      setIsLoading(false);
    }
  };

  const filterItems = () => {
    let filtered = [...items];
    
    // Фильтрация по поисковому запросу
    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Фильтрация по категории
    if (selectedCategory !== 'Все') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }
    
    // Сортировка
    filtered.sort((a, b) => {
      if (sortOption === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortOption === 'expiryDate') {
        return a.daysUntilExpiry - b.daysUntilExpiry;
      } else if (sortOption === 'category') {
        return a.category.localeCompare(b.category);
      }
      return 0;
    });
    
    setFilteredItems(filtered);
  };

  const addItem = () => {
    if (!newItem.name || !newItem.quantity) {
      Alert.alert('Ошибка', 'Пожалуйста, заполните название и количество');
      return;
    }
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // В реальном приложении здесь будет вызов API для добавления в базу данных
    const id = (items.length + 1).toString();
    const today = new Date();
    const expiryDate = new Date(newItem.expiryDate);
    const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
    
    const newFridgeItem: FridgeItem = {
      id,
      name: newItem.name,
      quantity: newItem.quantity,
      unit: newItem.unit,
      category: newItem.category,
      expiryDate: newItem.expiryDate,
      daysUntilExpiry,
      imageUrl: 'https://example.com/generic-food.jpg', // заглушка для демо
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      addedDate: new Date()
    };
    
    setItems([...items, newFridgeItem]);
    
    // Сброс формы
    setNewItem({
      name: '',
      quantity: '',
      unit: 'шт',
      category: 'Другое',
      expiryDate: new Date().toISOString().slice(0, 10)
    });
    
    setIsAddModalVisible(false);
  };

  const deleteItem = (id: string) => {
    Alert.alert(
      'Подтверждение',
      'Вы уверены, что хотите удалить этот продукт?',
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: 'Удалить', 
          style: 'destructive',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setItems(items.filter(item => item.id !== id));
          }
        }
      ]
    );
  };

  const scanBarcode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/barcode-scanner');
  };

  const useIngredient = (item: FridgeItem) => {
    Alert.alert(
      'Использовать продукт',
      `Добавить ${item.name} в рецепт или в дневник питания?`,
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'В рецепт', onPress: () => router.push('/recipes/create') },
        { text: 'В дневник', onPress: () => router.push('/diary') }
      ]
    );
  };

  const renderExpiryStatus = (daysUntilExpiry: number) => {
    if (daysUntilExpiry < 0) {
      return (
        <View style={[styles.expiryBadge, { backgroundColor: '#FF3B30' }]}>
          <Text style={styles.expiryText}>Просрочено</Text>
        </View>
      );
    } else if (daysUntilExpiry <= 2) {
      return (
        <View style={[styles.expiryBadge, { backgroundColor: '#FF9500' }]}>
          <Text style={styles.expiryText}>Скоро истечет</Text>
        </View>
      );
    } else {
      return (
        <View style={[styles.expiryBadge, { backgroundColor: '#34C759' }]}>
          <Text style={styles.expiryText}>
            {daysUntilExpiry} {daysUntilExpiry === 1 ? 'день' : daysUntilExpiry < 5 ? 'дня' : 'дней'}
          </Text>
        </View>
      );
    }
  };

  const renderItem = ({ item }: { item: FridgeItem }) => (
    <TouchableOpacity 
      style={[styles.itemCard, { backgroundColor: theme.colors.card }]}
      onPress={() => useIngredient(item)}
      activeOpacity={0.7}
    >
      <View style={styles.itemHeader}>
        <Text style={[styles.itemName, { color: theme.colors.text }]}>
          {item.name}
        </Text>
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.colors.background }]}
            onPress={() => Alert.alert('Редактирование', 'Функция будет доступна в следующем обновлении')}
          >
            <Edit2 size={16} color={theme.colors.text} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.colors.background }]}
            onPress={() => deleteItem(item.id)}
          >
            <Trash2 size={16} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.itemDetails}>
        <View style={styles.quantityContainer}>
          <Text style={[styles.quantityText, { color: theme.colors.text }]}>
            {item.quantity} {item.unit}
          </Text>
          <Text style={[styles.categoryText, { color: theme.colors.text }]}>
            {item.category}
          </Text>
        </View>
        
        <View style={styles.expiryContainer}>
          <Text style={[styles.expiryDateText, { color: theme.colors.text }]}>
            До: {new Date(item.expiryDate).toLocaleDateString('ru-RU')}
          </Text>
          {renderExpiryStatus(item.daysUntilExpiry)}
        </View>
      </View>
    </TouchableOpacity>
  );

  const getFilteredItems = () => {
    let filteredItems = [...items];
    
    // Поиск по тексту
    if (searchQuery) {
      filteredItems = filteredItems.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Фильтрация по категории
    if (filters.category) {
      filteredItems = filteredItems.filter(item => 
        item.category === filters.category
      );
    }
    
    // Фильтрация по сроку годности
    if (filters.expiryStatus !== 'all') {
      filteredItems = filteredItems.filter(item => 
        getExpiryStatus(item.daysUntilExpiry) === filters.expiryStatus
      );
    }
    
    // Сортировка
    filteredItems.sort((a, b) => {
      switch (filters.sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'expiry':
          return a.daysUntilExpiry - b.daysUntilExpiry;
        case 'category':
          return a.category.localeCompare(b.category);
        case 'dateAdded':
          return b.addedDate.getTime() - a.addedDate.getTime();
        default:
          return 0;
      }
    });
    
    return filteredItems;
  };

  const getExpiryStatus = (daysUntilExpiry: number): 'expired' | 'expiring' | 'good' => {
    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= 3) return 'expiring';
    return 'good';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Инвентаризация холодильника',
          headerStyle: { backgroundColor: theme.colors.card },
          headerTintColor: theme.colors.text,
        }} 
      />

      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: theme.colors.card }]}>
          <Search size={20} color={theme.colors.text} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text }]}
            placeholder="Поиск продуктов..."
            placeholderTextColor={theme.dark ? '#888' : '#999'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={{ color: theme.colors.primary }}>Очистить</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
        >
          {categories.map((category, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.categoryButton,
                selectedCategory === category && 
                [styles.activeCategoryButton, { backgroundColor: theme.colors.primary }]
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedCategory(category);
              }}
            >
              <Text 
                style={[
                  styles.categoryButtonText,
                  { color: selectedCategory === category ? '#fff' : theme.colors.text }
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.sortContainer}>
          <Text style={[styles.sortLabel, { color: theme.colors.text }]}>Сортировать по:</Text>
          <TouchableOpacity
            style={[styles.sortButton, { backgroundColor: theme.colors.card }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              const options = ['По названию', 'По сроку годности', 'По категории'];
              const currentIndex = sortOption === 'name' ? 0 : sortOption === 'expiryDate' ? 1 : 2;
              
              Alert.alert(
                'Сортировка',
                'Выберите порядок сортировки',
                [
                  ...options.map((option, index) => ({
                    text: option,
                    onPress: () => {
                      setSortOption(
                        index === 0 ? 'name' : index === 1 ? 'expiryDate' : 'category'
                      );
                      filterItems();
                    },
                    style: index === currentIndex ? 'default' : 'default'
                  })),
                  { text: 'Отмена', style: 'cancel' }
                ]
              );
            }}
          >
            <Text style={{ color: theme.colors.text }}>
              {sortOption === 'name' 
                ? 'По названию' 
                : sortOption === 'expiryDate' 
                  ? 'По сроку годности' 
                  : 'По категории'}
            </Text>
            <Filter size={16} color={theme.colors.text} style={{ marginLeft: 5 }} />
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Загрузка продуктов...
          </Text>
        </View>
      ) : filteredItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <AlertCircle size={48} color={theme.colors.text} style={{ opacity: 0.5 }} />
          <Text style={[styles.emptyText, { color: theme.colors.text }]}>
            Продукты не найдены
          </Text>
          <Text style={[styles.emptySubtext, { color: theme.colors.text }]}>
            Добавьте продукты в ваш холодильник или измените параметры поиска
          </Text>
        </View>
      ) : (
        <FlatList
          data={getFilteredItems()}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity 
          style={[styles.floatingButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setIsAddModalVisible(true);
          }}
        >
          <Plus size={24} color="#fff" />
          <Text style={styles.floatingButtonText}>Добавить</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.floatingButton, { backgroundColor: theme.colors.card }]}
          onPress={scanBarcode}
        >
          <Camera size={24} color={theme.colors.text} />
          <Text style={[styles.floatingButtonText, { color: theme.colors.text }]}>Сканировать</Text>
        </TouchableOpacity>
      </View>

      {/* Модальное окно добавления продукта */}
      <Modal
        visible={isAddModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              Добавить продукт
            </Text>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Название</Text>
              <TextInput
                style={[styles.input, { color: theme.colors.text, backgroundColor: theme.colors.background }]}
                placeholder="Введите название продукта"
                placeholderTextColor={theme.dark ? '#888' : '#999'}
                value={newItem.name}
                onChangeText={(text) => setNewItem({...newItem, name: text})}
              />
            </View>
            
            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 2, marginRight: 10 }]}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Количество</Text>
                <TextInput
                  style={[styles.input, { color: theme.colors.text, backgroundColor: theme.colors.background }]}
                  placeholder="Кол-во"
                  placeholderTextColor={theme.dark ? '#888' : '#999'}
                  value={newItem.quantity}
                  onChangeText={(text) => setNewItem({...newItem, quantity: text})}
                  keyboardType="numeric"
                />
              </View>
              
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Единица</Text>
                <TouchableOpacity
                  style={[styles.input, { backgroundColor: theme.colors.background }]}
                  onPress={() => {
                    Alert.alert(
                      'Выберите единицу измерения',
                      '',
                      [
                        { text: 'шт', onPress: () => setNewItem({...newItem, unit: 'шт'}) },
                        { text: 'г', onPress: () => setNewItem({...newItem, unit: 'г'}) },
                        { text: 'кг', onPress: () => setNewItem({...newItem, unit: 'кг'}) },
                        { text: 'мл', onPress: () => setNewItem({...newItem, unit: 'мл'}) },
                        { text: 'л', onPress: () => setNewItem({...newItem, unit: 'л'}) },
                        { text: 'Отмена', style: 'cancel' }
                      ]
                    );
                  }}
                >
                  <Text style={{ color: theme.colors.text }}>{newItem.unit}</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Категория</Text>
              <TouchableOpacity
                style={[styles.input, { backgroundColor: theme.colors.background }]}
                onPress={() => {
                  Alert.alert(
                    'Выберите категорию',
                    '',
                    [
                      ...categories.filter(category => category !== 'Все').map(category => ({
                        text: category,
                        onPress: () => setNewItem({...newItem, category})
                      })),
                      { text: 'Отмена', style: 'cancel' }
                    ]
                  );
                }}
              >
                <View style={styles.categorySelector}>
                  <Text style={{ color: theme.colors.text }}>{newItem.category}</Text>
                  <Tag size={16} color={theme.colors.text} />
                </View>
              </TouchableOpacity>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Срок годности</Text>
              <TouchableOpacity
                style={[styles.input, { backgroundColor: theme.colors.background }]}
                onPress={() => {
                  // В реальном приложении здесь будет DatePicker
                  Alert.alert('Выбор даты', 'В полной версии здесь будет выбор даты из календаря');
                }}
              >
                <View style={styles.categorySelector}>
                  <Text style={{ color: theme.colors.text }}>{newItem.expiryDate}</Text>
                  <Calendar size={16} color={theme.colors.text} />
                </View>
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: theme.colors.background }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setIsAddModalVisible(false);
                }}
              >
                <Text style={{ color: theme.colors.text }}>Отмена</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
                onPress={addItem}
              >
                <Text style={{ color: '#fff' }}>Добавить</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    padding: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    borderRadius: 10,
    height: 46,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
  },
  filtersContainer: {
    marginBottom: 10,
  },
  categoriesContainer: {
    paddingHorizontal: 10,
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  activeCategoryButton: {
    borderRadius: 20,
  },
  categoryButtonText: {
    fontWeight: '500',
    fontSize: 14,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 15,
    marginTop: 10,
  },
  sortLabel: {
    marginRight: 10,
    fontSize: 14,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtext: {
    textAlign: 'center',
    lineHeight: 20,
    opacity: 0.7,
  },
  listContent: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  itemCard: {
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionsContainer: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityContainer: {
    flexDirection: 'column',
  },
  quantityText: {
    fontSize: 14,
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 12,
    opacity: 0.7,
  },
  expiryContainer: {
    alignItems: 'flex-end',
  },
  expiryDateText: {
    fontSize: 12,
    marginBottom: 5,
  },
  expiryBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  expiryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
  },
  floatingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    flex: 1,
    marginHorizontal: 5,
  },
  floatingButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: '60%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    height: 45,
    borderRadius: 8,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  rowInputs: {
    flexDirection: 'row',
  },
  categorySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
});

export default FridgeInventoryScreen;