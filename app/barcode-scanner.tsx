import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator, 
  Alert,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  ArrowLeft, 
  Scan,
  Check,
  X
} from 'lucide-react-native';

// Типы данных для сканированного продукта
interface ScannedProduct {
  barcode: string;
  name: string;
  brand: string;
  imageUrl: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
  ingredients: string;
  allergens: string[];
}

export default function BarcodeScannerScreen() {
  const { theme } = useTheme();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<ScannedProduct | null>(null);

  // Запрос разрешений при загрузке компонента
  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  // Обработка сканированного штрих-кода
  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scanning) {
      setScanned(true);
      setScanning(false);
      setLoading(true);
      
      // Имитация получения данных о продукте
      // В реальном приложении здесь должен быть запрос к API с базой продуктов
      setTimeout(() => {
        if (data === '4607063750155') { // Демо-штрих-код для примера
          setProduct({
            barcode: data,
            name: 'Мюсли Fitness с фруктами',
            brand: 'Nestle',
            imageUrl: 'https://cdn.shopify.com/s/files/1/0273/0102/4559/products/41lhYZ3SZQL_72789154-7fe7-4c80-a70c-e9eb4d12b3e9_800x.jpg',
            calories: 365,
            protein: 7.5,
            carbs: 67.4,
            fat: 7.7,
            servingSize: '100 г',
            ingredients: 'Цельнозерновые хлопья (овес, пшеница), сахар, изюм, кусочки абрикоса, обжаренные хлопья (рис, кукуруза, пшеница), кусочки яблока...',
            allergens: ['Глютен', 'Может содержать следы орехов и молока']
          });
        } else {
          // Для примера создаем произвольный продукт по штрих-коду
          setProduct({
            barcode: data,
            name: 'Продукт ' + data.substring(data.length - 4),
            brand: 'Бренд',
            imageUrl: 'https://via.placeholder.com/150',
            calories: Math.floor(Math.random() * 400) + 100,
            protein: Math.round((Math.random() * 25 + 5) * 10) / 10,
            carbs: Math.round((Math.random() * 50 + 10) * 10) / 10,
            fat: Math.round((Math.random() * 20 + 2) * 10) / 10,
            servingSize: '100 г',
            ingredients: 'Информация отсутствует',
            allergens: []
          });
        }
        setLoading(false);
      }, 1500);
    }
  };

  // Повторное сканирование
  const scanAgain = () => {
    setScanned(false);
    setScanning(true);
    setProduct(null);
  };

  // Добавить продукт в дневник питания
  const addToDiary = () => {
    if (product) {
      // Здесь должна быть логика добавления в дневник питания
      // Перенаправление на страницу подтверждения добавления
      router.push({
        pathname: '/food-diary/add',
        params: {
          name: product.name,
          calories: product.calories.toString(),
          protein: product.protein.toString(),
          carbs: product.carbs.toString(),
          fat: product.fat.toString(),
          portion: product.servingSize,
          brand: product.brand
        }
      });
    }
  };

  // Вернуться назад
  const goBack = () => {
    router.back();
  };

  if (hasPermission === null) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.text }}>Запрос доступа к камере...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.text }}>
          Нет доступа к камере. Пожалуйста, разрешите доступ в настройках.
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      
      {/* Заголовок */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Сканирование штрих-кода
        </Text>
        <View style={styles.placeholderRight} />
      </View>
      
      {scanning ? (
        <View style={styles.scannerContainer}>
          <BarCodeScanner
            onBarCodeScanned={handleBarCodeScanned}
            style={styles.scanner}
          >
            <View style={styles.scannerOverlay}>
              <View style={styles.scannerTarget} />
              <Text style={styles.scannerText}>
                Наведите камеру на штрих-код продукта
              </Text>
            </View>
          </BarCodeScanner>
        </View>
      ) : (
        <View style={styles.resultContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={[styles.loadingText, { color: theme.colors.text }]}>
                Поиск информации о продукте...
              </Text>
            </View>
          ) : product ? (
            <ScrollView 
              contentContainerStyle={styles.productInfoScrollContent}
              style={styles.productInfoScroll}
            >
              <View style={styles.productInfoContainer}>
                <View style={styles.productImageContainer}>
                  <Image 
                    source={{ uri: product.imageUrl }} 
                    style={styles.productImage} 
                    resizeMode="contain"
                  />
                </View>
                
                <View style={styles.productDetails}>
                  <Text style={[styles.productName, { color: theme.colors.text }]}>
                    {product.name}
                  </Text>
                  <Text style={[styles.productBrand, { color: theme.colors.textSecondary }]}>
                    {product.brand}
                  </Text>
                  <Text style={[styles.barcodeText, { color: theme.colors.textSecondary }]}>
                    Штрих-код: {product.barcode}
                  </Text>
                </View>
                
                <View style={[styles.nutritionContainer, { backgroundColor: theme.colors.card }]}>
                  <Text style={[styles.nutritionTitle, { color: theme.colors.text }]}>
                    Пищевая ценность
                  </Text>
                  <Text style={[styles.servingSize, { color: theme.colors.textSecondary }]}>
                    на {product.servingSize}
                  </Text>
                  
                  <View style={styles.nutritionInfo}>
                    <View style={styles.nutritionItem}>
                      <Text style={[styles.nutritionValue, { color: theme.colors.text }]}>
                        {product.calories}
                      </Text>
                      <Text style={[styles.nutritionLabel, { color: theme.colors.textSecondary }]}>
                        ккал
                      </Text>
                    </View>
                    
                    <View style={styles.nutritionItem}>
                      <Text style={[styles.nutritionValue, { color: theme.colors.text }]}>
                        {product.protein}г
                      </Text>
                      <Text style={[styles.nutritionLabel, { color: theme.colors.textSecondary }]}>
                        белки
                      </Text>
                    </View>
                    
                    <View style={styles.nutritionItem}>
                      <Text style={[styles.nutritionValue, { color: theme.colors.text }]}>
                        {product.carbs}г
                      </Text>
                      <Text style={[styles.nutritionLabel, { color: theme.colors.textSecondary }]}>
                        углеводы
                      </Text>
                    </View>
                    
                    <View style={styles.nutritionItem}>
                      <Text style={[styles.nutritionValue, { color: theme.colors.text }]}>
                        {product.fat}г
                      </Text>
                      <Text style={[styles.nutritionLabel, { color: theme.colors.textSecondary }]}>
                        жиры
                      </Text>
                    </View>
                  </View>
                </View>
                
                <View style={[styles.ingredientsContainer, { backgroundColor: theme.colors.card }]}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                    Состав
                  </Text>
                  <Text style={[styles.ingredientsText, { color: theme.colors.textSecondary }]}>
                    {product.ingredients}
                  </Text>
                </View>
                
                {product.allergens.length > 0 && (
                  <View style={[styles.allergensContainer, { backgroundColor: theme.colors.card }]}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                      Аллергены
                    </Text>
                    <View style={styles.allergensList}>
                      {product.allergens.map((allergen, index) => (
                        <View 
                          key={index} 
                          style={[styles.allergenItem, { backgroundColor: theme.colors.primary + '20' }]}
                        >
                          <Text style={[styles.allergenText, { color: theme.colors.primary }]}>
                            {allergen}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            </ScrollView>
          ) : (
            <View style={styles.errorContainer}>
              <X size={50} color={theme.colors.error} style={styles.errorIcon} />
              <Text style={[styles.errorText, { color: theme.colors.text }]}>
                Не удалось получить информацию о продукте
              </Text>
              <Text style={[styles.errorSubtext, { color: theme.colors.textSecondary }]}>
                Попробуйте отсканировать штрих-код еще раз или добавьте продукт вручную
              </Text>
            </View>
          )}
          
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]} 
              onPress={scanAgain}
            >
              <Scan size={20} color={theme.colors.text} style={styles.actionButtonIcon} />
              <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>
                Сканировать еще
              </Text>
            </TouchableOpacity>
            
            {product && !loading && (
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: theme.colors.primary }]} 
                onPress={addToDiary}
              >
                <Check size={20} color="white" style={styles.actionButtonIcon} />
                <Text style={styles.addButtonText}>
                  Добавить в дневник
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholderRight: {
    width: 40,
  },
  scannerContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  scanner: {
    flex: 1,
  },
  scannerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerTarget: {
    width: 250,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'white',
    marginBottom: 20,
  },
  scannerText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 12,
    borderRadius: 8,
    maxWidth: 300,
  },
  resultContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  productInfoScroll: {
    flex: 1,
  },
  productInfoScrollContent: {
    padding: 16,
  },
  productInfoContainer: {
    flex: 1,
  },
  productImageContainer: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productDetails: {
    marginBottom: 24,
  },
  productName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  productBrand: {
    fontSize: 16,
    marginBottom: 8,
  },
  barcodeText: {
    fontSize: 14,
  },
  nutritionContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  nutritionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  servingSize: {
    fontSize: 14,
    marginBottom: 16,
  },
  nutritionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  nutritionLabel: {
    fontSize: 14,
  },
  ingredientsContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  ingredientsText: {
    fontSize: 14,
    lineHeight: 20,
  },
  allergensContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  allergensList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  allergenItem: {
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  allergenText: {
    fontSize: 14,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorIcon: {
    marginBottom: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    marginHorizontal: 8,
  },
  actionButtonIcon: {
    marginRight: 8,
  },
  actionButtonText: {
    fontWeight: '600',
    fontSize: 15,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
  },
});