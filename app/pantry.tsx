import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Image, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '../contexts/ThemeContext';
import Swipeable from 'react-native-gesture-handler/Swipeable';

// Типы для данных инвентаря
interface PantryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  imageUrl: string;
  expirationDate: string;
  addedDate: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
}

// Демо данные
const DEMO_CATEGORIES: Category[] = [
  { id: '1', name: 'Все', icon: 'grid-outline' },
  { id: '2', name: 'Холодильник', icon: 'snow-outline' },
  { id: '3', name: 'Морозилка', icon: 'snow' },
  { id: '4', name: 'Сухие продукты', icon: 'briefcase-outline' },
  { id: '5', name: 'Овощи и фрукты', icon: 'nutrition-outline' },
  { id: '6', name: 'Напитки', icon: 'wine-outline' },
  { id: '7', name: 'Соусы и специи', icon: 'flask-outline' },
];

const DEMO_ITEMS: PantryItem[] = [
  {
    id: '1',
    name: 'Молоко',
    quantity: 1,
    unit: 'л',
    category: 'Холодильник',
    imageUrl: 'https://img.health-diet.ru/milk.jpg',
    expirationDate: '2023-10-25',
    addedDate: '2023-10-20',
  },
  {
    id: '2',
    name: 'Яблоки',
    quantity: 5,
    unit: 'шт',
    category: 'Овощи и фрукты',
    imageUrl: 'https://img.health-diet.ru/apples.jpg',
    expirationDate: '2023-10-28',
    addedDate: '2023-10-18',
  },
  {
    id: '3',
    name: 'Куриное филе',
    quantity: 0.5,
    unit: 'кг',
    category: 'Холодильник',
    imageUrl: 'https://img.health-diet.ru/chicken_breast.jpg',
    expirationDate: '2023-10-24',
    addedDate: '2023-10-21',
  },
  {
    id: '4',
    name: 'Хлеб цельнозерновой',
    quantity: 1,
    unit: 'шт',
    category: 'Сухие продукты',
    imageUrl: 'https://img.health-diet.ru/bread.jpg',
    expirationDate: '2023-10-26',
    addedDate: '2023-10-21',
  },
  {
    id: '5',
    name: 'Замороженные ягоды',
    quantity: 400,
    unit: 'г',
    category: 'Морозилка',
    imageUrl: 'https://img.health-diet.ru/frozen_berries.jpg',
    expirationDate: '2024-01-15',
    addedDate: '2023-10-10',
  },
  {
    id: '6',
    name: 'Оливковое масло',
    quantity: 0.5,
    unit: 'л',
    category: 'Соусы и специи',
    imageUrl: 'https://img.health-diet.ru/olive_oil.jpg',
    expirationDate: '2024-05-20',
    addedDate: '2023-09-15',
  },
  {
    id: '7',
    name: 'Гречка',
    quantity: 900,
    unit: 'г',
    category: 'Сухие продукты',
    imageUrl: 'https://img.health-diet.ru/buckwheat.jpg',
    expirationDate: '2024-04-10',
    addedDate: '2023-08-25',
  },
  {
    id: '8',
    name: 'Минеральная вода',
    quantity: 6,
    unit: 'бут',
    category: 'Напитки',
    imageUrl: 'https://img.health-diet.ru/water.jpg',
    expirationDate: '2024-06-30',
    addedDate: '2023-10-05',
  },
];

export default function PantryScreen() {
  const [items, setItems] = useState<PantryItem[]>(DEMO_ITEMS);
  const [searchText, setSearchText] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('Все');
  const [expiringItems, setExpiringItems] = useState<PantryItem[]>([]);
  const [sortBy, setSortBy] = useState<string>('name');
  
  const router = useRouter();
  const { colors, isDark } = useThemeColor();
  
  // Фильтрация элементов по категории и поиску
  const filteredItems = items
    .filter(item => 
      activeCategory === 'Все' || item.category === activeCategory
    )
    .filter(item => 
      item.name.toLowerCase().includes(searchText.toLowerCase())
    );
  
  // Сортировка элементов
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    } else if (sortBy === 'expiration') {
      return new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime();
    } else if (sortBy === 'recent') {
      return new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime();
    }
    return 0;
  });
  
  // Расчет скоро истекающих продуктов
  useEffect(() => {
    const now = new Date();
    const threeDaysLater = new Date();
    threeDaysLater.setDate(now.getDate() + 3);
    
    const expiring = items.filter(item => {
      const expDate = new Date(item.expirationDate);
      return expDate > now && expDate <= threeDaysLater;
    });
    
    setExpiringItems(expiring);
  }, [items]);
  
  // Форматирование даты в читаемый вид
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };
  
  // Расчёт состояния продукта на основе срока годности
  const getExpirationStatus = (dateString: string) => {
    const now = new Date();
    const expDate = new Date(dateString);
    const diffTime = expDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return 'expired';
    } else if (diffDays <= 3) {
      return 'expiring';
    } else {
      return 'good';
    }
  };
  
  // Функция для создания нового продукта
  const handleAddItem = () => {
    router.push('/add-pantry-item');
  };
  
  // Функция для удаления продукта
  const handleDeleteItem = (id: string) => {
    Alert.alert(
      "Удаление продукта",
      "Вы уверены, что хотите удалить этот продукт?",
      [
        {
          text: "Отмена",
          style: "cancel"
        },
        { 
          text: "Удалить", 
          onPress: () => {
            setItems(items.filter(item => item.id !== id));
          },
          style: 'destructive'
        }
      ]
    );
  };
  
  // Функция для изменения количества продукта
  const handleChangeQuantity = (id: string, change: number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const newQuantity = item.quantity + change;
        if (newQuantity <= 0) {
          // Если количество стало 0, предложить удалить
          Alert.alert(
            "Продукт закончился",
            "Продукт закончился. Удалить из списка?",
            [
              {
                text: "Нет",
                onPress: () => {
                  // Оставить как есть, с минимальным количеством
                  return {...item, quantity: 0.1};
                }
              },
              { 
                text: "Да", 
                onPress: () => {
                  // Удалить продукт позже
                  setTimeout(() => handleDeleteItem(id), 300);
                  return item;
                }
              }
            ]
          );
          return {...item, quantity: 0.1};
        }
        return {...item, quantity: newQuantity};
      }
      return item;
    }));
  };
  
  // Рендер элемента для свайпа
  const renderRightActions = (id: string) => {
    return (
      <TouchableOpacity 
        style={[styles.deleteButton, {backgroundColor: colors.error}]}
        onPress={() => handleDeleteItem(id)}
      >
        <Ionicons name="trash-outline" size={24} color="white" />
      </TouchableOpacity>
    );
  };
  
  // Рендер элемента списка
  const renderItem = ({ item }: { item: PantryItem }) => {
    const expirationStatus = getExpirationStatus(item.expirationDate);
    let statusColor = colors.text;
    if (expirationStatus === 'expired') {
      statusColor = colors.error;
    } else if (expirationStatus === 'expiring') {
      statusColor = '#FFA500'; // Orange for soon expiring
    }
    
    return (
      <Swipeable
        renderRightActions={() => renderRightActions(item.id)}
        overshootRight={false}
      >
        <View style={[styles.itemCard, {backgroundColor: colors.card}]}>
          <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
          
          <View style={styles.itemContent}>
            <Text style={[styles.itemName, {color: colors.text}]}>{item.name}</Text>
            <Text style={[styles.itemCategory, {color: colors.textSecondary}]}>{item.category}</Text>
            
            <View style={styles.itemQuantityRow}>
              <View style={[styles.quantityContainer, {backgroundColor: colors.backgroundDarker}]}>
                <TouchableOpacity onPress={() => handleChangeQuantity(item.id, -1)}>
                  <Ionicons name="remove" size={20} color={colors.primary} />
                </TouchableOpacity>
                
                <Text style={[styles.quantityText, {color: colors.text}]}>
                  {item.quantity} {item.unit}
                </Text>
                
                <TouchableOpacity onPress={() => handleChangeQuantity(item.id, 1)}>
                  <Ionicons name="add" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
          
          <View style={styles.itemExpirationContainer}>
            <Text style={[styles.expirationLabel, {color: colors.textSecondary}]}>
              Годен до:
            </Text>
            <Text style={[styles.expirationDate, {color: statusColor}]}>
              {formatDate(item.expirationDate)}
            </Text>
          </View>
        </View>
      </Swipeable>
    );
  };
  
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Мои продукты',
          headerRight: () => (
            <TouchableOpacity onPress={handleAddItem} style={{marginRight: 15}}>
              <Ionicons name="add" size={24} color={colors.primary} />
            </TouchableOpacity>
          )
        }}
      />
      
      <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
        <View style={styles.searchBarContainer}>
          <View style={[styles.searchBar, {backgroundColor: colors.card}]}>
            <Ionicons name="search" size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, {color: colors.text}]}
              placeholder="Поиск продуктов..."
              placeholderTextColor={colors.textSecondary}
              value={searchText}
              onChangeText={setSearchText}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText('')}>
                <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity 
            style={[styles.sortButton, {backgroundColor: colors.card}]}
            onPress={() => {
              Alert.alert(
                "Сортировка",
                "Выберите способ сортировки",
                [
                  {
                    text: "По названию",
                    onPress: () => setSortBy('name')
                  },
                  {
                    text: "По сроку годности",
                    onPress: () => setSortBy('expiration')
                  },
                  {
                    text: "По дате добавления",
                    onPress: () => setSortBy('recent')
                  },
                  {
                    text: "Отмена",
                    style: "cancel"
                  }
                ]
              );
            }}
          >
            <Ionicons name="options-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        
        {/* Категории продуктов */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          {DEMO_CATEGORIES.map(category => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                {
                  backgroundColor: activeCategory === category.name 
                    ? colors.primary 
                    : colors.card
                }
              ]}
              onPress={() => setActiveCategory(category.name)}
            >
              <Ionicons 
                name={category.icon as any} 
                size={20} 
                color={activeCategory === category.name 
                  ? 'white' 
                  : colors.textSecondary
                } 
              />
              <Text 
                style={[
                  styles.categoryText,
                  {
                    color: activeCategory === category.name 
                      ? 'white' 
                      : colors.text
                  }
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        {/* Предупреждение о сроке годности */}
        {expiringItems.length > 0 && (
          <View style={[styles.expiringWarning, {backgroundColor: '#FFA50033'}]}>
            <Ionicons name="alert-circle" size={24} color="#FFA500" />
            <Text style={[styles.expiringWarningText, {color: colors.text}]}>
              У {expiringItems.length} продуктов скоро истекает срок годности
            </Text>
          </View>
        )}
        
        {/* Списки продуктов */}
        {sortedItems.length > 0 ? (
          <FlatList
            data={sortedItems}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="basket-outline" size={80} color={colors.textSecondary} />
            <Text style={[styles.emptyText, {color: colors.text}]}>
              {searchText.length > 0 
                ? 'Ничего не найдено' 
                : 'В этой категории нет продуктов'}
            </Text>
            <TouchableOpacity 
              style={[styles.addButton, {backgroundColor: colors.primary}]}
              onPress={handleAddItem}
            >
              <Text style={styles.addButtonText}>Добавить продукт</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Кнопка добавления */}
        {sortedItems.length > 0 && (
          <TouchableOpacity 
            style={[styles.fabButton, {backgroundColor: colors.primary}]}
            onPress={handleAddItem}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBarContainer: {
    flexDirection: 'row',
    padding: 15,
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    height: 45,
    borderRadius: 10,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  sortButton: {
    width: 45,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  categoriesContainer: {
    maxHeight: 50,
    marginBottom: 15,
  },
  categoriesContent: {
    paddingHorizontal: 10,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 5,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  expiringWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 10,
    borderRadius: 10,
  },
  expiringWarningText: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    padding: 15,
    paddingBottom: 80, // Для кнопки добавления внизу
  },
  itemCard: {
    flexDirection: 'row',
    borderRadius: 10,
    marginBottom: 15,
    overflow: 'hidden',
  },
  itemImage: {
    width: 80,
    height: 80,
  },
  itemContent: {
    flex: 1,
    padding: 10,
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
  },
  itemCategory: {
    fontSize: 14,
    marginTop: 2,
  },
  itemQuantityRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 15,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  quantityText: {
    marginHorizontal: 10,
    fontSize: 14,
    fontWeight: '500',
  },
  itemExpirationContainer: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expirationLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  expirationDate: {
    fontSize: 12,
    fontWeight: '500',
  },
  deleteButton: {
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  addButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 20,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  fabButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
}); 