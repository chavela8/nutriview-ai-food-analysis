import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator, 
  Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  ArrowLeft, 
  Camera as CameraIcon, 
  Image as ImageIcon, 
  X, 
  Zap, 
  Circle
} from 'lucide-react-native';

// Типы данных для распознанной еды
interface RecognizedFood {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  portion: string;
  confidence: number;
}

export default function CameraFoodRecognitionScreen() {
  const { theme } = useTheme();
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [recognizedFoods, setRecognizedFoods] = useState<RecognizedFood[]>([]);
  const [activeCamera, setActiveCamera] = useState(false);
  const [flashMode, setFlashMode] = useState(Camera.Constants.FlashMode.off);
  const cameraRef = useRef<Camera>(null);

  // Запрос разрешений при загрузке компонента
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermission(status === 'granted');
    })();
  }, []);

  // Сделать снимок
  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        setImage(photo.uri);
        setActiveCamera(false);
        analyzeImage(photo.uri);
      } catch (error) {
        console.error('Ошибка при съемке фото:', error);
        Alert.alert('Ошибка', 'Не удалось сделать фото. Пожалуйста, попробуйте еще раз.');
      }
    }
  };

  // Выбрать изображение из галереи
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImage(result.assets[0].uri);
      analyzeImage(result.assets[0].uri);
    }
  };

  // Анализ изображения
  const analyzeImage = async (imageUri: string) => {
    setAnalyzing(true);
    
    // Здесь должен быть вызов реального API для анализа изображения
    // Пример: const result = await uploadAndAnalyzeImage(imageUri);
    
    // Имитация задержки анализа
    setTimeout(() => {
      // Демо-данные (в реальном приложении это должно приходить от API)
      const demoResults: RecognizedFood[] = [
        {
          name: 'Салат Цезарь',
          calories: 350,
          protein: 15,
          carbs: 12,
          fat: 28,
          portion: '250 г',
          confidence: 0.92
        },
        {
          name: 'Куриная грудка',
          calories: 165,
          protein: 31,
          carbs: 0,
          fat: 3.6,
          portion: '100 г',
          confidence: 0.85
        }
      ];
      
      setRecognizedFoods(demoResults);
      setAnalyzing(false);
    }, 2000);
  };

  // Переключить вспышку
  const toggleFlash = () => {
    setFlashMode(
      flashMode === Camera.Constants.FlashMode.off 
        ? Camera.Constants.FlashMode.on 
        : Camera.Constants.FlashMode.off
    );
  };

  // Добавить продукт в дневник питания
  const addFoodToDiary = (food: RecognizedFood) => {
    // Здесь должен быть код для добавления еды в дневник питания
    // Например: saveToFoodDiary(food);
    
    // Перенаправление на страницу подтверждения
    router.push({
      pathname: '/food-diary/add',
      params: {
        name: food.name,
        calories: food.calories.toString(),
        protein: food.protein.toString(),
        carbs: food.carbs.toString(),
        fat: food.fat.toString(),
        portion: food.portion
      }
    });
  };

  // Добавить все распознанные продукты
  const addAllFoods = () => {
    // В реальном приложении сюда можно добавить логику для сохранения всех продуктов
    Alert.alert(
      'Добавить все продукты',
      'Все распознанные продукты будут добавлены в дневник питания',
      [
        {
          text: 'Отмена',
          style: 'cancel'
        },
        {
          text: 'Добавить',
          onPress: () => {
            // Логика добавления всех продуктов
            router.push('/food-diary');
          }
        }
      ]
    );
  };

  // Начать заново
  const restart = () => {
    setImage(null);
    setRecognizedFoods([]);
    setActiveCamera(true);
  };

  // Вернуться назад
  const goBack = () => {
    router.back();
  };

  if (hasCameraPermission === null) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.text }}>Запрос доступа к камере...</Text>
      </View>
    );
  }

  if (hasCameraPermission === false) {
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
          Распознавание еды
        </Text>
        <View style={styles.placeholderRight} />
      </View>
      
      {activeCamera ? (
        // Камера
        <View style={styles.cameraContainer}>
          <Camera
            ref={cameraRef}
            style={styles.camera}
            flashMode={flashMode}
            ratio="4:3"
          >
            <View style={styles.cameraOverlay}>
              {/* Наложение на камеру с подсказками */}
              <View style={styles.guideBox}>
                <Text style={styles.guideText}>
                  Расположите еду в центре кадра
                </Text>
              </View>
            </View>
          </Camera>
          
          <View style={styles.cameraControls}>
            <TouchableOpacity 
              style={styles.cameraButton} 
              onPress={pickImage}
            >
              <ImageIcon size={24} color="white" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.captureButtom} 
              onPress={takePicture}
            >
              <Circle size={70} color="white" fill="transparent" strokeWidth={2} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.cameraButton}
              onPress={toggleFlash}
            >
              <Zap 
                size={24} 
                color="white" 
                fill={flashMode === Camera.Constants.FlashMode.on ? "white" : "transparent"}
              />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        // Показ результатов анализа
        <View style={styles.resultContainer}>
          {image && (
            <View style={styles.imageContainer}>
              <Image source={{ uri: image }} style={styles.previewImage} />
              <TouchableOpacity 
                style={styles.restartButton} 
                onPress={restart}
              >
                <X size={20} color="white" />
              </TouchableOpacity>
            </View>
          )}
          
          {analyzing ? (
            <View style={styles.analyzingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={[styles.analyzingText, { color: theme.colors.text }]}>
                Анализируем вашу еду...
              </Text>
              <Text style={[styles.analyzingSubtext, { color: theme.colors.textSecondary }]}>
                Это может занять несколько секунд
              </Text>
            </View>
          ) : recognizedFoods.length > 0 ? (
            <View style={styles.recognizedFoodsContainer}>
              <Text style={[styles.resultsTitle, { color: theme.colors.text }]}>
                Распознанные продукты
              </Text>
              
              {recognizedFoods.map((food, index) => (
                <View 
                  key={index} 
                  style={[styles.foodItem, { backgroundColor: theme.colors.card }]}
                >
                  <View style={styles.foodItemInfo}>
                    <Text style={[styles.foodName, { color: theme.colors.text }]}>
                      {food.name}
                    </Text>
                    <Text style={[styles.foodPortion, { color: theme.colors.textSecondary }]}>
                      {food.portion} · {Math.round(food.confidence * 100)}% уверенность
                    </Text>
                    <View style={styles.foodNutrition}>
                      <Text style={[styles.calories, { color: theme.colors.text }]}>
                        {food.calories} ккал
                      </Text>
                      <Text style={[styles.macros, { color: theme.colors.textSecondary }]}>
                        Б: {food.protein}г · У: {food.carbs}г · Ж: {food.fat}г
                      </Text>
                    </View>
                  </View>
                  
                  <TouchableOpacity 
                    style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
                    onPress={() => addFoodToDiary(food)}
                  >
                    <Text style={styles.addButtonText}>Добавить</Text>
                  </TouchableOpacity>
                </View>
              ))}
              
              {recognizedFoods.length > 1 && (
                <TouchableOpacity 
                  style={[styles.addAllButton, { borderColor: theme.colors.primary }]}
                  onPress={addAllFoods}
                >
                  <Text style={[styles.addAllButtonText, { color: theme.colors.primary }]}>
                    Добавить все ({recognizedFoods.length})
                  </Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={styles.newPhotoButton}
                onPress={restart}
              >
                <CameraIcon size={20} color={theme.colors.primary} style={styles.newPhotoIcon} />
                <Text style={[styles.newPhotoText, { color: theme.colors.primary }]}>
                  Сделать новое фото
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.noResultsContainer}>
              <Text style={[styles.noResultsText, { color: theme.colors.text }]}>
                Не удалось распознать еду
              </Text>
              <TouchableOpacity 
                style={[styles.tryAgainButton, { backgroundColor: theme.colors.primary }]}
                onPress={restart}
              >
                <Text style={styles.tryAgainButtonText}>Попробовать снова</Text>
              </TouchableOpacity>
            </View>
          )}
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
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideBox: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: 'white',
    borderRadius: 8,
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: 16,
  },
  guideText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
    borderRadius: 4,
  },
  cameraControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: 'black',
  },
  cameraButton: {
    padding: 12,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  captureButtom: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultContainer: {
    flex: 1,
  },
  imageContainer: {
    height: 250,
    width: '100%',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  restartButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyzingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  analyzingText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  analyzingSubtext: {
    fontSize: 14,
    marginTop: 8,
  },
  recognizedFoodsContainer: {
    flex: 1,
    padding: 16,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  foodItemInfo: {
    flex: 1,
    marginRight: 10,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  foodPortion: {
    fontSize: 14,
    marginBottom: 8,
  },
  foodNutrition: {
    flexDirection: 'column',
  },
  calories: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  macros: {
    fontSize: 13,
  },
  addButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  addAllButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  addAllButtonText: {
    fontWeight: '600',
    fontSize: 15,
  },
  newPhotoButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  newPhotoIcon: {
    marginRight: 8,
  },
  newPhotoText: {
    fontSize: 15,
    fontWeight: '500',
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noResultsText: {
    fontSize: 18,
    marginBottom: 16,
  },
  tryAgainButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  tryAgainButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
}); 