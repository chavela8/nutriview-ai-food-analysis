import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, FlatList, Image, ActivityIndicator, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import * as Haptics from 'expo-haptics';
import { Search, ShoppingCart, Plus, Minus, ChevronRight, Check, Store, MapPin, ExternalLink, Clock } from 'lucide-react-native';

// Интерфейсы для типизации данных
interface Product {
  id: string;
  name: string;
  price: number;
  oldPrice?: number;
  weight: string;
  imageUrl: string;
  store: string;
  inStock: boolean;
}

interface ShoppingListItem {
  id: string;
  name: string;
  quantity: number;
  checked: boolean;
  category: string;
}

interface Store {
  id: string;
  name: string;
  logo: string;
  distance: string;
  deliveryTime: string;
  deliveryFee: string;
  minOrder: number;
  rating: number;
}

// Демо-данные для магазинов
const stores: Store[] = [
  {
    id: '1',
    name: 'Перекресток',
    logo: 'https://example.com/perekrestok.png',
    distance: '1.2 км',
    deliveryTime: '30-45 мин',
    deliveryFee: '149 ₽',
    minOrder: 1000,
    rating: 4.7
  },
  {
    id: '2',
    name: 'Лента',
    logo: 'https://example.com/lenta.png',
    distance: '2.5 км',
    deliveryTime: '45-60 мин',
    deliveryFee: '199 ₽',
    minOrder: 1500,
    rating: 4.5
  },
  {
    id: '3',
    name: 'ВкусВилл',
    logo: 'https://example.com/vkusvill.png',
    distance: '0.8 км',
    deliveryTime: '20-35 мин',
    deliveryFee: '99 ₽',
    minOrder: 800,
    rating: 4.9
  }
];

// Демо-данные для продуктов
const demoProducts: Product[] = [
  {
    id: '1',
    name: 'Куриная грудка охлажденная',
    price: 259,
    oldPrice: 299,
    weight: '500 г',
    imageUrl: 'https://example.com/chicken.jpg',
    store: 'Перекресток',
    inStock: true
  },
  {
    id: '2',
    name: 'Гречневая крупа',
    price: 89,
    weight: '900 г',
    imageUrl: 'https://example.com/buckwheat.jpg',
    store: 'Лента',
    inStock: true
  },
  {
    id: '3',
    name: 'Молоко 3.2%',
    price: 89,
    oldPrice: 109,
    weight: '1 л',
    imageUrl: 'https://example.com/milk.jpg',
    store: 'ВкусВилл',
    inStock: true
  },
  {
    id: '4',
    name: 'Йогурт натуральный',
    price: 75,
    weight: '350 г',
    imageUrl: 'https://example.com/yogurt.jpg',
    store: 'ВкусВилл',
    inStock: false
  },
  {
    id: '5',
    name: 'Овсянка быстрого приготовления',
    price: 119,
    weight: '450 г',
    imageUrl: 'https://example.com/oatmeal.jpg',
    store: 'Перекресток',
    inStock: true
  }
];

// Демо-данные для списка покупок
const initialShoppingList: ShoppingListItem[] = [
  { id: '1', name: 'Молоко', quantity: 2, checked: false, category: 'Молочные продукты' },
  { id: '2', name: 'Яблоки', quantity: 6, checked: false, category: 'Фрукты' },
  { id: '3', name: 'Куриная грудка', quantity: 1, checked: false, category: 'Мясо' },
  { id: '4', name: 'Рис', quantity: 1, checked: false, category: 'Крупы' }
];

const GroceryShoppingScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('shopping-list'); // 'shopping-list', 'search', 'stores'
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>(initialShoppingList);
  const [newItem, setNewItem] = useState('');
  
  const { theme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    if (selectedTab === 'search' && searchQuery.length > 0) {
      searchProducts();
    }
  }, [searchQuery, selectedTab]);

  const searchProducts = () => {
    if (searchQuery.trim() === '') return;
    
    setIsLoading(true);
    
    // Имитация запроса к API
    setTimeout(() => {
      // Фильтруем демо-продукты по поисковому запросу
      const filtered = demoProducts.filter(
        product => product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setProducts(filtered);
      setIsLoading(false);
    }, 1000);
  };

  const addToShoppingList = (product: Product) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Проверяем, есть ли уже такой товар в списке
    const existingItem = shoppingList.find(item => item.name.toLowerCase() === product.name.toLowerCase());
    
    if (existingItem) {
      // Увеличиваем количество
      const updatedList = shoppingList.map(item => 
        item.id === existingItem.id ? { ...item, quantity: item.quantity + 1 } : item
      );
      setShoppingList(updatedList);
      Alert.alert('Добавлено', `${product.name} (${product.weight}) добавлен в список покупок`);
    } else {
      // Добавляем новый товар
      const newItem: ShoppingListItem = {
        id: Date.now().toString(),
        name: product.name,
        quantity: 1,
        checked: false,
        category: 'Другое' // В реальном приложении категория будет определяться автоматически
      };
      setShoppingList([...shoppingList, newItem]);
      Alert.alert('Добавлено', `${product.name} (${product.weight}) добавлен в список покупок`);
    }
  };

  const addNewItem = () => {
    if (newItem.trim() === '') return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const newShoppingItem: ShoppingListItem = {
      id: Date.now().toString(),
      name: newItem.trim(),
      quantity: 1,
      checked: false,
      category: 'Другое'
    };
    
    setShoppingList([...shoppingList, newShoppingItem]);
    setNewItem('');
  };

  const removeItem = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    Alert.alert(
      'Удаление',
      'Вы уверены, что хотите удалить этот товар из списка?',
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: 'Удалить', 
          style: 'destructive',
          onPress: () => {
            const updatedList = shoppingList.filter(item => item.id !== id);
            setShoppingList(updatedList);
          }
        }
      ]
    );
  };

  const updateItemQuantity = (id: string, increment: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const updatedList = shoppingList.map(item => {
      if (item.id === id) {
        const newQuantity = increment ? item.quantity + 1 : Math.max(1, item.quantity - 1);
        return { ...item, quantity: newQuantity };
      }
      return item;
    });
    
    setShoppingList(updatedList);
  };

  const toggleItemChecked = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const updatedList = shoppingList.map(item => {
      if (item.id === id) {
        return { ...item, checked: !item.checked };
      }
      return item;
    });
    
    setShoppingList(updatedList);
  };

  const clearShoppingList = () => {
    Alert.alert(
      'Очистить список',
      'Вы уверены, что хотите очистить весь список покупок?',
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: 'Очистить', 
          style: 'destructive',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setShoppingList([]);
          }
        }
      ]
    );
  };

  const navigateToStore = (store: Store) => {
    // В реальном приложении здесь будет навигация на страницу магазина
    Alert.alert(
      store.name,
      `Минимальный заказ: ${store.minOrder} ₽\nВремя доставки: ${store.deliveryTime}\nСтоимость доставки: ${store.deliveryFee}`
    );
  };

  const findBestDeals = () => {
    // В реальном приложении здесь будет алгоритм поиска лучших предложений
    Alert.alert(
      'Лучшие предложения',
      'На основе вашего списка покупок, лучше всего сделать заказ во ВкусВилл. Вы сэкономите примерно 230 ₽.'
    );
  };

  // Рендер элемента списка покупок
  const renderShoppingListItem = ({ item }: { item: ShoppingListItem }) => (
    <View style={[styles.shoppingListItem, { backgroundColor: theme.colors.card }]}>
      <TouchableOpacity 
        style={styles.checkboxContainer}
        onPress={() => toggleItemChecked(item.id)}
      >
        <View style={[
          styles.checkbox, 
          item.checked ? { backgroundColor: theme.colors.primary } : { borderColor: theme.colors.border }
        ]}>
          {item.checked && <Check size={14} color="#fff" />}
        </View>
      </TouchableOpacity>
      
      <View style={styles.itemInfo}>
        <Text 
          style={[
            styles.itemName, 
            { color: theme.colors.text, textDecorationLine: item.checked ? 'line-through' : 'none' }
          ]}
        >
          {item.name}
        </Text>
        <Text style={[styles.itemCategory, { color: theme.colors.text, opacity: 0.6 }]}>
          {item.category}
        </Text>
      </View>
      
      <View style={styles.quantityControls}>
        <TouchableOpacity 
          style={[styles.quantityButton, { backgroundColor: theme.colors.background }]}
          onPress={() => updateItemQuantity(item.id, false)}
        >
          <Minus size={16} color={theme.colors.text} />
        </TouchableOpacity>
        
        <Text style={[styles.quantityText, { color: theme.colors.text }]}>
          {item.quantity}
        </Text>
        
        <TouchableOpacity 
          style={[styles.quantityButton, { backgroundColor: theme.colors.background }]}
          onPress={() => updateItemQuantity(item.id, true)}
        >
          <Plus size={16} color={theme.colors.text} />
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity 
        style={styles.removeButton}
        onPress={() => removeItem(item.id)}
      >
        <Text style={{ color: 'red' }}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  // Рендер элемента найденного продукта
  const renderProductItem = ({ item }: { item: Product }) => (
    <View style={[styles.productCard, { backgroundColor: theme.colors.card }]}>
      <View style={styles.productImageContainer}>
        <View style={styles.productImagePlaceholder} />
        {/* В реальном приложении здесь будет изображение
        <Image source={{ uri: item.imageUrl }} style={styles.productImage} /> */}
      </View>
      
      <View style={styles.productInfo}>
        <Text style={[styles.productName, { color: theme.colors.text }]}>
          {item.name}
        </Text>
        
        <Text style={[styles.productStore, { color: theme.colors.text, opacity: 0.7 }]}>
          {item.store}
        </Text>
        
        <Text style={[styles.productWeight, { color: theme.colors.text, opacity: 0.7 }]}>
          {item.weight}
        </Text>
        
        <View style={styles.productPriceContainer}>
          <Text style={[styles.productPrice, { color: theme.colors.text }]}>
            {item.price} ₽
          </Text>
          
          {item.oldPrice && (
            <Text style={styles.productOldPrice}>
              {item.oldPrice} ₽
            </Text>
          )}
        </View>
      </View>
      
      <TouchableOpacity 
        style={[
          styles.addToCartButton, 
          { backgroundColor: item.inStock ? theme.colors.primary : '#ccc' }
        ]}
        onPress={() => addToShoppingList(item)}
        disabled={!item.inStock}
      >
        {item.inStock ? (
          <ShoppingCart size={20} color="#fff" />
        ) : (
          <Text style={styles.outOfStockText}>Нет в наличии</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  // Рендер элемента магазина
  const renderStoreItem = ({ item }: { item: Store }) => (
    <TouchableOpacity 
      style={[styles.storeCard, { backgroundColor: theme.colors.card }]}
      onPress={() => navigateToStore(item)}
    >
      <View style={styles.storeLogoContainer}>
        <View style={styles.storeLogoPlaceholder}>
          <Store size={24} color={theme.colors.text} />
        </View>
        {/* В реальном приложении здесь будет логотип
        <Image source={{ uri: item.logo }} style={styles.storeLogo} /> */}
      </View>
      
      <View style={styles.storeInfo}>
        <Text style={[styles.storeName, { color: theme.colors.text }]}>
          {item.name}
        </Text>
        
        <View style={styles.storeDetailsRow}>
          <MapPin size={14} color={theme.colors.text} style={{ opacity: 0.7 }} />
          <Text style={[styles.storeDetailText, { color: theme.colors.text, opacity: 0.7 }]}>
            {item.distance}
          </Text>
        </View>
        
        <View style={styles.storeDetailsRow}>
          <Clock size={14} color={theme.colors.text} style={{ opacity: 0.7 }} />
          <Text style={[styles.storeDetailText, { color: theme.colors.text, opacity: 0.7 }]}>
            {item.deliveryTime}
          </Text>
        </View>
        
        <View style={styles.storeDetailsRow}>
          <Text style={[styles.storeDeliveryFee, { color: theme.colors.text }]}>
            Доставка: {item.deliveryFee}
          </Text>
        </View>
      </View>
      
      <View style={styles.storeAction}>
        <ChevronRight size={20} color={theme.colors.text} style={{ opacity: 0.5 }} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Покупки продуктов',
          headerStyle: { backgroundColor: theme.colors.card },
          headerTintColor: theme.colors.text,
        }} 
      />

      <View style={styles.searchBarContainer}>
        <View style={[styles.searchBar, { backgroundColor: theme.colors.card }]}>
          <Search size={20} color={theme.colors.text} style={{ opacity: 0.6, marginRight: 8 }} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text }]}
            placeholder="Поиск продуктов, магазинов..."
            placeholderTextColor={theme.colors.text + '80'}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={searchProducts}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={{ color: theme.colors.primary }}>Очистить</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'shopping-list' && [styles.activeTab, { borderColor: theme.colors.primary }]
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setSelectedTab('shopping-list');
          }}
        >
          <Text 
            style={[
              styles.tabText, 
              { color: selectedTab === 'shopping-list' ? theme.colors.primary : theme.colors.text }
            ]}
          >
            Список покупок
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'search' && [styles.activeTab, { borderColor: theme.colors.primary }]
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setSelectedTab('search');
          }}
        >
          <Text 
            style={[
              styles.tabText, 
              { color: selectedTab === 'search' ? theme.colors.primary : theme.colors.text }
            ]}
          >
            Поиск
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'stores' && [styles.activeTab, { borderColor: theme.colors.primary }]
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setSelectedTab('stores');
          }}
        >
          <Text 
            style={[
              styles.tabText, 
              { color: selectedTab === 'stores' ? theme.colors.primary : theme.colors.text }
            ]}
          >
            Магазины
          </Text>
        </TouchableOpacity>
      </View>

      {selectedTab === 'shopping-list' && (
        <View style={styles.tabContent}>
          <View style={styles.addItemContainer}>
            <TextInput
              style={[styles.addItemInput, { backgroundColor: theme.colors.card, color: theme.colors.text }]}
              placeholder="Добавить товар..."
              placeholderTextColor={theme.colors.text + '80'}
              value={newItem}
              onChangeText={setNewItem}
              onSubmitEditing={addNewItem}
            />
            <TouchableOpacity 
              style={[styles.addItemButton, { backgroundColor: theme.colors.primary }]}
              onPress={addNewItem}
              disabled={newItem.trim() === ''}
            >
              <Plus size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          
          {shoppingList.length > 0 ? (
            <>
              <FlatList
                data={shoppingList}
                renderItem={renderShoppingListItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.shoppingListContainer}
              />
              
              <View style={styles.shoppingListActions}>
                <TouchableOpacity 
                  style={[styles.listActionButton, { backgroundColor: theme.colors.card }]}
                  onPress={clearShoppingList}
                >
                  <Text style={{ color: 'red' }}>Очистить список</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.listActionButton, { backgroundColor: theme.colors.primary }]}
                  onPress={findBestDeals}
                >
                  <Text style={{ color: '#fff' }}>Найти лучшие цены</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.emptyListContainer}>
              <ShoppingCart size={48} color={theme.colors.text} style={{ opacity: 0.5 }} />
              <Text style={[styles.emptyListText, { color: theme.colors.text }]}>
                Ваш список покупок пуст
              </Text>
              <Text style={[styles.emptyListSubtext, { color: theme.colors.text, opacity: 0.7 }]}>
                Добавьте товары с помощью строки поиска или выберите их из каталога
              </Text>
            </View>
          )}
        </View>
      )}

      {selectedTab === 'search' && (
        <View style={styles.tabContent}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={[styles.loadingText, { color: theme.colors.text }]}>
                Поиск продуктов...
              </Text>
            </View>
          ) : searchQuery.length === 0 ? (
            <View style={styles.searchPromptContainer}>
              <Search size={48} color={theme.colors.text} style={{ opacity: 0.5 }} />
              <Text style={[styles.searchPromptText, { color: theme.colors.text }]}>
                Введите название продукта для поиска
              </Text>
            </View>
          ) : products.length === 0 ? (
            <View style={styles.noResultsContainer}>
              <Text style={[styles.noResultsText, { color: theme.colors.text }]}>
                По запросу "{searchQuery}" ничего не найдено
              </Text>
              <Text style={[styles.noResultsSubtext, { color: theme.colors.text, opacity: 0.7 }]}>
                Попробуйте изменить запрос или выбрать другую категорию
              </Text>
            </View>
          ) : (
            <FlatList
              data={products}
              renderItem={renderProductItem}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.productsContainer}
            />
          )}
        </View>
      )}

      {selectedTab === 'stores' && (
        <View style={styles.tabContent}>
          <FlatList
            data={stores}
            renderItem={renderStoreItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.storesContainer}
          />
          
          <View style={styles.storesInfo}>
            <Text style={[styles.storesInfoText, { color: theme.colors.text, opacity: 0.7 }]}>
              * Время доставки и стоимость указаны приблизительно и могут меняться в зависимости от загрузки службы доставки
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBarContainer: {
    padding: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    height: 46,
    borderRadius: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontWeight: '500',
  },
  tabContent: {
    flex: 1,
  },
  addItemContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  addItemInput: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginRight: 10,
  },
  addItemButton: {
    width: 46,
    height: 46,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shoppingListContainer: {
    padding: 10,
  },
  shoppingListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  checkboxContainer: {
    marginRight: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  itemCategory: {
    fontSize: 12,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    marginHorizontal: 8,
    fontWeight: '500',
    fontSize: 16,
  },
  removeButton: {
    padding: 8,
  },
  shoppingListActions: {
    flexDirection: 'row',
    padding: 10,
    marginTop: 'auto',
  },
  listActionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyListText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyListSubtext: {
    textAlign: 'center',
    lineHeight: 20,
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
  searchPromptContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  searchPromptText: {
    fontSize: 18,
    fontWeight: '500',
    marginTop: 20,
    textAlign: 'center',
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  noResultsSubtext: {
    textAlign: 'center',
    lineHeight: 20,
  },
  productsContainer: {
    padding: 10,
  },
  productCard: {
    flexDirection: 'row',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  productImageContainer: {
    marginRight: 15,
  },
  productImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#e1e1e1',
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  productStore: {
    fontSize: 12,
    marginBottom: 4,
  },
  productWeight: {
    fontSize: 12,
    marginBottom: 8,
  },
  productPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 6,
  },
  productOldPrice: {
    fontSize: 14,
    textDecorationLine: 'line-through',
    color: '#999',
  },
  addToCartButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginLeft: 10,
  },
  outOfStockText: {
    fontSize: 10,
    color: '#fff',
    textAlign: 'center',
  },
  storesContainer: {
    padding: 10,
  },
  storeCard: {
    flexDirection: 'row',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  storeLogoContainer: {
    marginRight: 15,
  },
  storeLogoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e1e1e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storeLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  storeDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  storeDetailText: {
    fontSize: 14,
    marginLeft: 6,
  },
  storeDeliveryFee: {
    fontSize: 14,
    fontWeight: '500',
  },
  storeAction: {
    justifyContent: 'center',
  },
  storesInfo: {
    padding: 15,
  },
  storesInfoText: {
    fontSize: 12,
    lineHeight: 18,
  },
});

export default GroceryShoppingScreen; 