import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { CameraView } from 'expo-camera';
import { BarCodeScanner, BarCodeScannerResult } from 'expo-barcode-scanner';
import { useIsFocused } from '@react-navigation/native';
import { useCameraPermissions } from 'expo-camera';
import { getFoodByBarcode, saveFoodItem, addMealLog } from '@/lib/api';
import { FoodAnalysis } from '@/components/FoodAnalysis';
import { XCircle, AlertTriangle, SearchIcon, DatabaseIcon, CameraOff } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

export default function BarcodeScreen() {
  const { theme } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [hasScanned, setHasScanned] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [statsData, setStatsData] = useState({
    totalScans: 0,
    uniqueProducts: 0,
    lastScan: null
  });
  
  const cameraRef = useRef(null);
  const isFocused = useIsFocused();

  // При открытии экрана загружаем статистику сканирований
  useEffect(() => {
    loadScanStats();
  }, []);

  // Загрузка статистики сканирований (демо-данные)
  const loadScanStats = () => {
    // В реальном приложении эти данные были бы загружены из Supabase
    setStatsData({
      totalScans: 84,
      uniqueProducts: 62,
      lastScan: 'Вчера'
    });
  };

  // Обработка отсканированного штрих-кода
  const handleBarCodeScanned = async ({ type, data }: BarCodeScannerResult) => {
    if (hasScanned) return;
    
    setHasScanned(true);
    setScannedBarcode(data);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    try {
      setLoading(true);
      setError(null);
      
      // Поиск продукта по штрих-коду через API
      const foodData = await getFoodByBarcode(data);
      setResult(foodData);
      
      // Обновляем статистику
      setStatsData(prev => ({
        ...prev,
        totalScans: prev.totalScans + 1,
        lastScan: 'Только что'
      }));
      
      // Сохраняем в базу данных
      if (foodData) {
        const savedItem = await saveFoodItem({
          name: foodData.name,
          calories: foodData.nutrition.calories,
          protein: foodData.nutrition.protein,
          carbs: foodData.nutrition.carbs,
          fat: foodData.nutrition.fat,
          fiber: foodData.nutrition.fiber,
          sugar: foodData.nutrition.sugar,
          glycemic_index: foodData.glycemicIndex,
          image_url: foodData.image_url
        });
        
        // Можно автоматически добавить в дневник или спросить пользователя
        // await addMealLog(savedItem.id, 'snack');
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось найти информацию о продукте');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  // Сброс сканирования
  const resetScan = () => {
    setHasScanned(false);
    setScannedBarcode(null);
    setResult(null);
    setError(null);
  };

  // Добавление продукта в дневник питания
  const addToMealLog = async (mealType: string) => {
    if (!result) return;
    
    try {
      setLoading(true);
      
      // Сохраняем в базу данных, если еще не сохранили
      const foodItem = await saveFoodItem({
        name: result.name,
        calories: result.nutrition.calories,
        protein: result.nutrition.protein,
        carbs: result.nutrition.carbs,
        fat: result.nutrition.fat,
        fiber: result.nutrition.fiber,
        sugar: result.nutrition.sugar,
        glycemic_index: result.glycemicIndex,
        image_url: result.image_url
      });
      
      // Добавляем в дневник питания
      await addMealLog(foodItem.id, mealType);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Успешно', 'Продукт добавлен в дневник питания');
      
      // Сбрасываем состояние для нового сканирования
      setTimeout(resetScan, 1000);
      
    } catch (err) {
      Alert.alert('Ошибка', 'Не удалось добавить продукт в дневник питания');
    } finally {
      setLoading(false);
    }
  };

  // Выбор типа приема пищи
  const showMealTypeOptions = () => {
    if (!result) return;
    
    Alert.alert(
      'Добавить в дневник',
      'Выберите прием пищи:',
      [
        { text: 'Завтрак', onPress: () => addToMealLog('breakfast') },
        { text: 'Обед', onPress: () => addToMealLog('lunch') },
        { text: 'Ужин', onPress: () => addToMealLog('dinner') },
        { text: 'Перекус', onPress: () => addToMealLog('snack') },
        { text: 'Отмена', style: 'cancel' }
      ]
    );
  };

  // Ручной ввод штрих-кода
  const promptForBarcode = () => {
    Alert.prompt(
      'Ручной ввод',
      'Введите штрих-код продукта:',
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: 'Поиск', 
          onPress: (code) => {
            if (code && code.trim()) {
              setScannedBarcode(code.trim());
              handleBarCodeScanned({ type: 'manual', data: code.trim() });
            }
          }
        }
      ],
      'plain-text'
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Сканер штрих-кодов</Text>
      </View>
      
      <View style={styles.statsContainer}>
        <View style={[styles.statsCard, { backgroundColor: theme.colors.card }]}>
          <View style={styles.statsItem}>
            <Text style={[styles.statsValue, { color: theme.colors.primary }]}>{statsData.totalScans}</Text>
            <Text style={[styles.statsLabel, { color: theme.colors.textSecondary }]}>Всего сканирований</Text>
          </View>
          
          <View style={styles.statsItem}>
            <Text style={[styles.statsValue, { color: theme.colors.primary }]}>{statsData.uniqueProducts}</Text>
            <Text style={[styles.statsLabel, { color: theme.colors.textSecondary }]}>Уникальных продуктов</Text>
          </View>
          
          <View style={styles.statsItem}>
            <Text style={[styles.statsValue, { color: theme.colors.primary }]}>{statsData.lastScan || '-'}</Text>
            <Text style={[styles.statsLabel, { color: theme.colors.textSecondary }]}>Последнее сканирование</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.cameraContainer}>
        {permission?.granted ? (
          <>
            {isFocused && !hasScanned && (
              <CameraView 
                style={styles.camera}
                barCodeScannerSettings={{
                  barCodeTypes: [
                    BarCodeScanner.Constants.BarCodeType.ean8,
                    BarCodeScanner.Constants.BarCodeType.ean13,
                    BarCodeScanner.Constants.BarCodeType.upc_e,
                    BarCodeScanner.Constants.BarCodeType.upc_a
                  ]
                }}
                onBarCodeScanned={handleBarCodeScanned}
                ref={cameraRef}
              >
                <View style={styles.scanFrame}>
                  <View style={styles.scanCorner} />
                  <View style={[styles.scanCorner, styles.topRight]} />
                  <View style={[styles.scanCorner, styles.bottomLeft]} />
                  <View style={[styles.scanCorner, styles.bottomRight]} />
                </View>
                
                <Text style={[styles.scanInstructions, { color: '#FFFFFF' }]}>
                  Наведите камеру на штрих-код продукта
                </Text>
              </CameraView>
            )}
            
            {(hasScanned || !isFocused) && (
              <View style={[styles.resultContainer, { backgroundColor: theme.colors.backgroundSecondary }]}>
                {(scannedBarcode || loading || error) && (
                  <View style={styles.barcodeResult}>
                    {scannedBarcode && (
                      <View style={styles.barcodeInfo}>
                        <Text style={[styles.barcodeLabel, { color: theme.colors.textSecondary }]}>
                          Штрих-код:
                        </Text>
                        <Text style={[styles.barcodeValue, { color: theme.colors.text }]}>
                          {scannedBarcode}
                        </Text>
                      </View>
                    )}
                    
                    {loading && (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
                          Ищем информацию о продукте...
                        </Text>
                      </View>
                    )}
                    
                    {error && (
                      <View style={styles.errorContainer}>
                        <View style={[styles.errorIcon, { backgroundColor: theme.colors.dangerLight }]}>
                          <AlertTriangle size={24} color={theme.colors.danger} />
                        </View>
                        <Text style={[styles.errorTitle, { color: theme.colors.danger }]}>
                          Продукт не найден
                        </Text>
                        <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>
                          {error}
                        </Text>
                        <TouchableOpacity 
                          style={[styles.manualAddButton, { backgroundColor: theme.colors.primaryLight }]}
                        >
                          <DatabaseIcon size={16} color={theme.colors.primary} style={{ marginRight: 8 }} />
                          <Text style={[styles.manualAddText, { color: theme.colors.primary }]}>
                            Добавить вручную
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    
                    {result && (
                      <View style={styles.foodResult}>
                        <FoodAnalysis 
                          result={result}
                          theme={theme}
                          loading={false}
                        />
                        
                        <View style={styles.actionButtons}>
                          <TouchableOpacity 
                            style={[styles.addToDiaryButton, { backgroundColor: theme.colors.primary }]}
                            onPress={showMealTypeOptions}
                          >
                            <Text style={styles.addToDiaryText}>
                              Добавить в дневник
                            </Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity 
                            style={[styles.scanMoreButton, { backgroundColor: theme.colors.secondaryLight }]}
                            onPress={resetScan}
                          >
                            <Text style={[styles.scanMoreText, { color: theme.colors.secondary }]}>
                              Сканировать ещё
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}
          </>
        ) : (
          <View style={[styles.permissionContainer, { backgroundColor: theme.colors.card }]}>
            <CameraOff size={64} color={theme.colors.textSecondary} />
            <Text style={[styles.permissionTitle, { color: theme.colors.text }]}>
              Требуется доступ к камере
            </Text>
            <Text style={[styles.permissionText, { color: theme.colors.textSecondary }]}>
              Для сканирования штрих-кодов нам нужен доступ к камере
            </Text>
            <TouchableOpacity 
              style={[styles.permissionButton, { backgroundColor: theme.colors.primary }]}
              onPress={requestPermission}
            >
              <Text style={styles.permissionButtonText}>Предоставить доступ</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      <View style={styles.bottomButtons}>
        <TouchableOpacity 
          style={[styles.manualButton, { backgroundColor: theme.colors.card }]}
          onPress={promptForBarcode}
        >
          <SearchIcon size={20} color={theme.colors.primary} style={{ marginRight: 8 }} />
          <Text style={[styles.manualButtonText, { color: theme.colors.text }]}>
            Ввести вручную
          </Text>
        </TouchableOpacity>
        
        {hasScanned && (
          <TouchableOpacity 
            style={[styles.cancelButton, { backgroundColor: theme.colors.card }]}
            onPress={resetScan}
          >
            <XCircle size={20} color={theme.colors.danger} style={{ marginRight: 8 }} />
            <Text style={[styles.cancelButtonText, { color: theme.colors.text }]}>
              Отменить
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  title: {
    fontFamily: 'Nunito-Bold',
    fontSize: 28,
  },
  statsContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  statsCard: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statsItem: {
    alignItems: 'center',
  },
  statsValue: {
    fontFamily: 'Nunito-Bold',
    fontSize: 20,
  },
  statsLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  cameraContainer: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: 24,
    marginBottom: 16,
  },
  camera: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderRadius: 16,
    position: 'relative',
  },
  scanCorner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#FFFFFF',
    borderTopWidth: 3,
    borderLeftWidth: 3,
    top: 0,
    left: 0,
  },
  topRight: {
    right: 0,
    top: 0,
    left: undefined,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderLeftWidth: 0,
    transform: [{ rotate: '90deg' }],
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    top: undefined,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderTopWidth: 0,
    transform: [{ rotate: '-90deg' }],
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    left: undefined,
    top: undefined,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    transform: [{ rotate: '180deg' }],
  },
  scanInstructions: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  resultContainer: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
  },
  barcodeResult: {
    flex: 1,
  },
  barcodeInfo: {
    marginBottom: 16,
  },
  barcodeLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginBottom: 4,
  },
  barcodeValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    fontFamily: 'Nunito-Bold',
    fontSize: 18,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  manualAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  manualAddText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  foodResult: {
    flex: 1,
  },
  actionButtons: {
    gap: 12,
    marginTop: 16,
  },
  addToDiaryButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  addToDiaryText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  scanMoreButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  scanMoreText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  bottomButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 12,
  },
  manualButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  manualButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  cancelButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    borderRadius: 16,
  },
  permissionTitle: {
    fontFamily: 'Nunito-Bold',
    fontSize: 18,
    marginTop: 16,
    marginBottom: 8,
  },
  permissionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  permissionButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#FFFFFF',
  },
}); 