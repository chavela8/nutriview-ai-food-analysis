import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useThemeColor } from '../contexts/ThemeContext';

// Типы для распознанной еды
interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
}

interface FoodDetection {
  name: string;
  probability: number;
  nutrition: NutritionInfo;
  portion: string;
  weight: number; // в граммах
}

export default function FoodScannerScreen() {
  const router = useRouter();
  const { colors, isDark } = useThemeColor();
  const cameraRef = useRef<Camera>(null);
  
  // Состояния
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraType, setCameraType] = useState(Camera.Constants.Type.back);
  const [flashMode, setFlashMode] = useState(Camera.Constants.FlashMode.off);
  const [imageCapture, setImageCapture] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<FoodDetection[] | null>(null);
  const [selectedFood, setSelectedFood] = useState<FoodDetection | null>(null);
  
  // Запрос разрешений при загрузке компонента
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);
  
  // Функция для выбора изображения из галереи
  const pickImage = async () => {
    const result = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (result.granted) {
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!pickerResult.canceled) {
        setImageCapture(pickerResult.assets[0].uri);
        analyzeImage(pickerResult.assets[0].uri);
      }
    } else {
      Alert.alert('Необходим доступ к галерее', 'Пожалуйста, разрешите доступ к галерее в настройках');
    }
  };
  
  // Функция для съемки фото
  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          skipProcessing: false,
        });
        setImageCapture(photo.uri);
        analyzeImage(photo.uri);
      } catch (error) {
        console.error('Ошибка при съемке фото:', error);
        Alert.alert('Ошибка', 'Не удалось сделать фото. Пожалуйста, попробуйте снова.');
      }
    }
  };
  
  // Переключение фронтальной/задней камеры
  const toggleCameraType = () => {
    setCameraType(
      cameraType === Camera.Constants.Type.back
        ? Camera.Constants.Type.front
        : Camera.Constants.Type.back
    );
  };
  
  // Переключение вспышки
  const toggleFlash = () => {
    setFlashMode(
      flashMode === Camera.Constants.FlashMode.off
        ? Camera.Constants.FlashMode.on
        : Camera.Constants.FlashMode.off
    );
  };
  
  // Функция для анализа изображения (имитация AI-анализа)
  const analyzeImage = (imageUri: string) => {
    setAnalyzing(true);
    setAnalysisResults(null);
    
    // Имитация задержки для анализа AI
    setTimeout(() => {
      // Демо-данные результатов распознавания
      const results: FoodDetection[] = [
        {
          name: 'Гречневая каша с овощами',
          probability: 0.92,
          nutrition: {
            calories: 240,
            protein: 8.5,
            carbs: 43.2,
            fat: 3.7,
            fiber: 7.2,
            sugar: 1.5
          },
          portion: 'средняя тарелка',
          weight: 250
        },
        {
          name: 'Салат из свежих овощей',
          probability: 0.85,
          nutrition: {
            calories: 120,
            protein: 3.2,
            carbs: 12.5,
            fat: 7.8,
            fiber: 4.1,
            sugar: 6.2
          },
          portion: 'средняя порция',
          weight: 180
        },
        {
          name: 'Куриная грудка',
          probability: 0.78,
          nutrition: {
            calories: 165,
            protein: 31,
            carbs: 0,
            fat: 3.6,
            fiber: 0,
            sugar: 0
          },
          portion: 'кусок среднего размера',
          weight: 100
        }
      ];
      
      setAnalysisResults(results);
      setAnalyzing(false);
      
      // Автоматически выбираем блюдо с наивысшей вероятностью
      if (results.length > 0) {
        setSelectedFood(results[0]);
      }
    }, 2000);
  };
  
  // Функция добавления блюда в дневник питания
  const addToFoodLog = () => {
    if (selectedFood) {
      // Здесь был бы код для сохранения в базу данных
      
      // Сбрасываем состояние и показываем уведомление
      Alert.alert(
        'Успешно добавлено',
        `Блюдо "${selectedFood.name}" добавлено в дневник питания`,
        [
          { 
            text: 'Вернуться к сканеру', 
            onPress: () => {
              setImageCapture(null);
              setAnalysisResults(null);
              setSelectedFood(null);
            }
          },
          { 
            text: 'Перейти в дневник', 
            onPress: () => router.push('/food-diary') 
          }
        ]
      );
    }
  };
  
  // Если разрешения не получены
  if (hasPermission === null) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background, justifyContent: 'center'}]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  
  if (hasPermission === false) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center'}]}>
        <Ionicons name="camera-off" size={60} color={colors.error} />
        <Text style={[styles.errorText, {color: colors.text}]}>
          Нет доступа к камере
        </Text>
        <Text style={[styles.errorSubtext, {color: colors.textSecondary}]}>
          Для работы функции распознавания еды требуется доступ к камере устройства
        </Text>
        <TouchableOpacity 
          style={[styles.permissionButton, {backgroundColor: colors.primary}]}
          onPress={async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
          }}
        >
          <Text style={styles.permissionButtonText}>Предоставить доступ</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Сканировать еду',
          headerRight: () => (
            <TouchableOpacity onPress={pickImage} style={{marginRight: 15}}>
              <Ionicons name="images" size={24} color={colors.primary} />
            </TouchableOpacity>
          )
        }}
      />
      
      <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
        {imageCapture ? (
          // Режим анализа
          <View style={styles.analysisContainer}>
            <View style={styles.imageContainer}>
              <Image source={{ uri: imageCapture }} style={styles.capturedImage} />
            </View>
            
            {analyzing ? (
              // Индикатор загрузки во время анализа
              <View style={[styles.loadingContainer, {backgroundColor: colors.card}]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, {color: colors.text}]}>
                  Анализируем изображение...
                </Text>
                <Text style={[styles.loadingSubtext, {color: colors.textSecondary}]}>
                  Наш AI определяет блюдо и его состав
                </Text>
              </View>
            ) : analysisResults ? (
              // Результаты анализа
              <ScrollView style={styles.resultsContainer}>
                <Text style={[styles.resultTitle, {color: colors.text}]}>
                  Результаты анализа:
                </Text>
                
                {analysisResults.map((food, index) => (
                  <TouchableOpacity
                    key={`food-${index}`}
                    style={[
                      styles.foodResultCard,
                      {
                        backgroundColor: colors.card,
                        borderColor: selectedFood?.name === food.name ? colors.primary : colors.border,
                        borderWidth: selectedFood?.name === food.name ? 2 : 1,
                      }
                    ]}
                    onPress={() => setSelectedFood(food)}
                  >
                    <View style={styles.foodResultHeader}>
                      <Text style={[styles.foodResultName, {color: colors.text}]}>
                        {food.name}
                      </Text>
                      <View style={styles.confidenceTag}>
                        <Text style={styles.confidenceText}>
                          {Math.round(food.probability * 100)}%
                        </Text>
                      </View>
                    </View>
                    
                    <Text style={[styles.portionText, {color: colors.textSecondary}]}>
                      {food.portion} ({food.weight}г)
                    </Text>
                    
                    <View style={styles.nutritionRow}>
                      <View style={styles.nutritionItem}>
                        <Text style={[styles.nutritionValue, {color: colors.text}]}>
                          {food.nutrition.calories}
                        </Text>
                        <Text style={[styles.nutritionLabel, {color: colors.textSecondary}]}>
                          ккал
                        </Text>
                      </View>
                      
                      <View style={styles.nutritionItem}>
                        <Text style={[styles.nutritionValue, {color: colors.text}]}>
                          {food.nutrition.protein}г
                        </Text>
                        <Text style={[styles.nutritionLabel, {color: colors.textSecondary}]}>
                          белки
                        </Text>
                      </View>
                      
                      <View style={styles.nutritionItem}>
                        <Text style={[styles.nutritionValue, {color: colors.text}]}>
                          {food.nutrition.carbs}г
                        </Text>
                        <Text style={[styles.nutritionLabel, {color: colors.textSecondary}]}>
                          углеводы
                        </Text>
                      </View>
                      
                      <View style={styles.nutritionItem}>
                        <Text style={[styles.nutritionValue, {color: colors.text}]}>
                          {food.nutrition.fat}г
                        </Text>
                        <Text style={[styles.nutritionLabel, {color: colors.textSecondary}]}>
                          жиры
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
                
                {selectedFood && (
                  <View style={styles.actionButtonsContainer}>
                    <TouchableOpacity
                      style={[styles.actionButton, {backgroundColor: colors.primary}]}
                      onPress={addToFoodLog}
                    >
                      <Ionicons name="add-circle" size={20} color="white" />
                      <Text style={styles.actionButtonText}>Добавить в дневник</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.actionButton, {backgroundColor: colors.card}]}
                      onPress={() => {
                        setImageCapture(null);
                        setAnalysisResults(null);
                        setSelectedFood(null);
                      }}
                    >
                      <Ionicons name="refresh" size={20} color={colors.text} />
                      <Text style={[styles.actionButtonTextSecondary, {color: colors.text}]}>
                        Сделать новое фото
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            ) : null}
          </View>
        ) : (
          // Режим камеры
          <>
            <Camera
              ref={cameraRef}
              style={styles.camera}
              type={cameraType}
              flashMode={flashMode}
            >
              <View style={styles.overlay}>
                <View style={styles.guideBox} />
                <Text style={styles.guideText}>
                  Расположите блюдо в центре кадра
                </Text>
              </View>
            </Camera>
            
            <View style={styles.controls}>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={toggleFlash}
              >
                <Ionicons
                  name={flashMode === Camera.Constants.FlashMode.on ? 'flash' : 'flash-off'}
                  size={28}
                  color="white"
                />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.captureButton}
                onPress={takePicture}
              >
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.controlButton}
                onPress={toggleCameraType}
              >
                <Ionicons name="camera-reverse" size={28} color="white" />
              </TouchableOpacity>
            </View>
          </>
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideBox: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 10,
    borderStyle: 'dashed',
  },
  guideText: {
    color: 'white',
    fontSize: 16,
    marginTop: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  controls: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  analysisContainer: {
    flex: 1,
  },
  imageContainer: {
    height: '40%',
    width: '100%',
    backgroundColor: 'black',
  },
  capturedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  loadingContainer: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
  },
  loadingSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 30,
  },
  resultsContainer: {
    flex: 1,
    padding: 15,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  foodResultCard: {
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
  },
  foodResultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  foodResultName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  confidenceTag: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  portionText: {
    fontSize: 14,
    marginBottom: 10,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  nutritionLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  actionButtonsContainer: {
    marginVertical: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  actionButtonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  errorText: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
  },
  errorSubtext: {
    fontSize: 16,
    textAlign: 'center',
    marginHorizontal: 30,
    marginBottom: 30,
  },
  permissionButton: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 