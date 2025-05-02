import React, { useState, useEffect } from 'react';
import { View, TextInput, FlatList, Text, ActivityIndicator, StyleSheet } from 'react-native';
import FoodDatabaseAPI, { FoodProduct } from '../lib/FoodDatabaseAPI';

interface FoodSearchProps {
  onSelectFood: (food: FoodProduct) => void;
}

const FoodSearch: React.FC<FoodSearchProps> = ({ onSelectFood }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<FoodProduct[]>([]);
  
  // Функция поиска продуктов с задержкой
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.length >= 2) {
        searchFoods();
      }
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [query]);
  
  const searchFoods = async () => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    
    setLoading(true);
    
    try {
      // Проверяем, является ли запрос штрих-кодом (только цифры)
      const isBarcode = /^\d+$/.test(query) && query.length > 8;
      
      if (isBarcode) {
        const product = await FoodDatabaseAPI.searchByBarcode(query);
        setResults(product ? [product] : []);
      } else {
        const products = await FoodDatabaseAPI.searchByName(query);
        setResults(products);
      }
    } catch (error) {
      console.error('Ошибка при поиске продуктов:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const renderFoodItem = ({ item }: { item: FoodProduct }) => (
    <TouchableOpacity 
      style={styles.resultItem} 
      onPress={() => onSelectFood(item)}
    >
      <Text style={styles.foodName}>{item.name}</Text>
      {item.brand && <Text style={styles.brandName}>{item.brand}</Text>}
      <Text style={styles.nutritionInfo}>
        {item.calories} ккал | Б: {item.protein}г | Ж: {item.fat}г | У: {item.carbs}г
      </Text>
      <Text style={styles.sourceTag}>
        {item.source === 'USDA' ? 'USDA' : 
         item.source === 'OpenFoodFacts' ? 'Open Food Facts' : 
         'Пользовательский'}
      </Text>
    </TouchableOpacity>
  );
  
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Введите название продукта или штрих-код"
        value={query}
        onChangeText={setQuery}
      />
      
      {loading ? (
        <ActivityIndicator size="large" style={styles.loader} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => `${item.source}_${item.id}`}
          renderItem={renderFoodItem}
          ListEmptyComponent={
            query.length > 0 ? (
              <Text style={styles.emptyResult}>Ничего не найдено</Text>
            ) : null
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchInput: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  loader: {
    marginTop: 20,
  },
  resultItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  foodName: {
    fontSize: 16,
    fontWeight: '600',
  },
  brandName: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  nutritionInfo: {
    fontSize: 14,
    marginTop: 4,
  },
  sourceTag: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  emptyResult: {
    padding: 16,
    textAlign: 'center',
    color: '#666',
  },
});

export default FoodSearch;
