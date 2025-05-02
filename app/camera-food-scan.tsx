import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Dimensions,
  Modal,
  TextInput,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '../contexts/ThemeContext';
import * as Haptics from 'expo-haptics';
import { 
  ArrowLeft, 
  X, 
  Camera as CameraIcon, 
  Image as ImageIcon,
  CheckCircle2, 
  Info,
  RotateCcw
} from 'lucide-react-native';

// Размеры экрана
const { width, height } = Dimensions.get('window');

// Типы данных
interface FoodRecognitionResult {
  id: string;
  name: string;
  confidence: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving: string;
  quantity: number;
  imageUrl: string;
  alternatives: {
    id: string;
    name: string;
    confidence: number;
  }[];
  portion: string;
  possibleAlternatives: string[];
}

// Демо данные для распознавания еды
const demoFoodRecognitions: { [key: string]: FoodRecognitionResult } = {
  'apple': {
    id: '1',
    name: 'Яблоко',
    confidence: 0.93,
    calories: 52,
    protein: 0.3,
    carbs: 13.8,
    fat: 0.2,
    serving: '1 среднее яблоко',
    quantity: 1,
    imageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6',
    alternatives: [
      { id: '2', name: 'Красное яблоко', confidence: 0.89 },
      { id: '3', name: 'Зеленое яблоко', confidence: 0.72 }
    ],
    portion: '1 среднее яблоко',
    possibleAlternatives: ['Яблоко', 'Красное яблоко', 'Зеленое яблоко']
  },
  'salad': {
    id: '4',
    name: 'Салат овощной',
    confidence: 0.87,
    calories: 120,
    protein: 2.5,
    carbs: 8.4,
    fat: 9.1,
    serving: '200 г салата',
    quantity: 1,
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd',
    alternatives: [
      { id: '5', name: 'Греческий салат', confidence: 0.76 },
      { id: '6', name: 'Салат Цезарь', confidence: 0.68 }
    ],
    portion: '200 г салата',
    possibleAlternatives: ['Греческий салат', 'Салат Цезарь']
  },
  'pasta': {
    id: '7',
    name: 'Паста с соусом болоньезе',
    confidence: 0.91,
    calories: 385,
    protein: 15.2,
    carbs: 52.6,
    fat: 12.3,
    serving: '250 г пасты',
    quantity: 1,
    imageUrl: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601',
    alternatives: [
      { id: '8', name: 'Спагетти с томатным соусом', confidence: 0.84 },
      { id: '9', name: 'Паста карбонара', confidence: 0.79 }
    ],
    portion: '250 г пасты',
    possibleAlternatives: ['Спагетти с томатным соусом', 'Паста карбонара']
  },
  'pizza': {
    id: '10',
    name: 'Пицца Маргарита',
    confidence: 0.95,
    calories: 266,
    protein: 11.0,
    carbs: 33.0,
    fat: 10.4,
    serving: '1 кусок (100г)',
    quantity: 1,
    imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591',
    alternatives: [
      { id: '11', name: 'Пицца Пепперони', confidence: 0.88 },
      { id: '12', name: 'Пицца с овощами', confidence: 0.77 }
    ],
    portion: '1 кусок (100г)',
    possibleAlternatives: ['Пицца Пепперони', 'Пицца с овощами']
  },
  'burger': {
    id: '13',
    name: 'Бургер',
    confidence: 0.92,
    calories: 540,
    protein: 25.0,
    carbs: 40.0,
    fat: 29.0,
    serving: '1 бургер (180г)',
    quantity: 1,
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd',
    alternatives: [
      { id: '14', name: 'Чизбургер', confidence: 0.87 },
      { id: '15', name: 'Вегетарианский бургер', confidence: 0.65 }
    ],
    portion: '1 бургер (180г)',
    possibleAlternatives: ['Чизбургер', 'Вегетарианский бургер']
  },
  'cake': {
    id: '16',
    name: 'Шоколадный торт',
    confidence: 0.89,
    calories: 370,
    protein: 5.0,
    carbs: 45.0,
    fat: 18.0,
    serving: '1 кусок (100г)',
    quantity: 1,
    imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587',
    alternatives: [
      { id: '17', name: 'Чизкейк', confidence: 0.83 },
      { id: '18', name: 'Морковный торт', confidence: 0.72 }
    ],
    portion: '1 кусок (100г)',
    possibleAlternatives: ['Чизкейк', 'Морковный торт']
  },
  'soup': {
    id: '19',
    name: 'Куриный суп',
    confidence: 0.86,
    calories: 150,
    protein: 12.0,
    carbs: 11.0,
    fat: 6.0,
    serving: '250 мл',
    quantity: 1,
    imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd',
    alternatives: [
      { id: '20', name: 'Борщ', confidence: 0.75 },
      { id: '21', name: 'Томатный суп', confidence: 0.70 }
    ],
    portion: '250 мл',
    possibleAlternatives: ['Борщ', 'Томатный суп']
  }
};

export default function CameraFoodScan() {
  const router = useRouter();
  const cameraRef = useRef<Camera | null>(null);
  const { colors, isDark } = useThemeColor();
  
  // Состояния
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [type, setType] = useState(Camera.Constants.Type.back);
  const [flash, setFlash] = useState(Camera.Constants.FlashMode.off);
  const [processing, setProcessing] = useState(false);
  const [recognizedFood, setRecognizedFood] = useState<FoodRecognitionResult | null>(null);
  const [selectedAlternative, setSelectedAlternative] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showPortionModal, setShowPortionModal] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [customPortion, setCustomPortion] = useState('');
  
  // Запрос разрешения на использование камеры
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);
  
  // Функция для обработки снятия фотографии
  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const photo = await cameraRef.current.takePictureAsync();
        await processImage(photo.uri);
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Ошибка', 'Не удалось сделать снимок');
      }
    }
  };
  
  // Функция для обработки выбора изображения из галереи
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        await processImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Ошибка', 'Не удалось выбрать изображение');
    }
  };
  
  // Функция для обработки и распознавания изображения
  const processImage = async (imageUri: string) => {
    setProcessing(true);
    
    try {
      // Симуляция загрузки и обработки изображения
      setTimeout(() => {
        const keys = Object.keys(demoFoodRecognitions);
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        const result = demoFoodRecognitions[randomKey];
        
        setRecognizedFood(result);
        setProcessing(false);
      }, 2000);
      
      // В реальном приложении здесь был бы код для загрузки изображения и получения распознавания
      // через API машинного обучения или внутреннего ML модуля
    } catch (error) {
      console.error('Error processing image:', error);
      Alert.alert('Ошибка', 'Не удалось распознать пищу на изображении');
      setProcessing(false);
    }
  };
  
  // Функция выбора альтернативы распознанной еды
  const selectAlternative = (id: string) => {
    if (!recognizedFood) return;
    
    const alternative = recognizedFood.alternatives.find(alt => alt.id === id);
    if (alternative) {
      setSelectedAlternative(id);
      // В реальном приложении здесь бы обновилась информация о выбранной еде
    }
  };
  
  // Функция изменения количества порций
  const changeQuantity = (delta: number) => {
    const newQuantity = Math.max(0.25, quantity + delta);
    setQuantity(newQuantity);
  };
  
  // Обработка добавления еды в дневник питания
  const addFoodToDiary = () => {
    if (!recognizedFood) return;
    
    const foodName = selectedAlternative 
      ? recognizedFood.alternatives.find(alt => alt.id === selectedAlternative)?.name || recognizedFood.name 
      : recognizedFood.name;
    
    // Имитация добавления в дневник питания
    Alert.alert(
      'Пища добавлена',
      `${foodName} (${quantity} ${quantity === 1 ? 'порция' : 'порции'}) добавлена в ваш дневник питания`,
      [{ text: 'OK', onPress: () => router.push('/food-diary') }]
    );
  };
  
  // Функция очистки и повторного сканирования
  const resetScan = () => {
    setRecognizedFood(null);
    setSelectedAlternative(null);
    setQuantity(1);
  };
  
  // Проверка разрешения на использование камеры
  if (hasPermission === null) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.permissionContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.permissionText, { color: colors.text }]}>
            Запрос доступа к камере...
          </Text>
        </View>
      </SafeAreaView>
    );
  }
  
  if (hasPermission === false) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-off" size={64} color={colors.primary} />
          <Text style={[styles.permissionTitle, { color: colors.text }]}>
            Доступ к камере отклонен
          </Text>
          <Text style={[styles.permissionText, { color: colors.textSecondary }]}>
            Для распознавания еды необходим доступ к камере устройства. Пожалуйста, предоставьте разрешение в настройках.
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
          >
            <Text style={styles.buttonText}>Вернуться назад</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Сканирование еды',
          headerShown: !recognizedFood,
        }}
      />
      
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {!recognizedFood ? (
          <View style={styles.cameraContainer}>
            <Camera
              ref={cameraRef}
              style={styles.camera}
              type={type}
              flashMode={flash}
            >
              <View style={styles.cameraControls}>
                <TouchableOpacity
                  style={styles.flipButton}
                  onPress={() => {
                    setType(
                      type === Camera.Constants.Type.back
                        ? Camera.Constants.Type.front
                        : Camera.Constants.Type.back
                    );
                  }}
                >
                  <Ionicons name="camera-reverse" size={24} color="#fff" />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.flashButton}
                  onPress={() => {
                    setFlash(
                      flash === Camera.Constants.FlashMode.off
                        ? Camera.Constants.FlashMode.on
                        : Camera.Constants.FlashMode.off
                    );
                  }}
                >
                  <Ionicons
                    name={flash === Camera.Constants.FlashMode.off ? "flash-off" : "flash"}
                    size={24}
                    color="#fff"
                  />
                </TouchableOpacity>
              </View>
              
              <View style={styles.cameraGuide}>
                <View style={styles.guideCircle} />
                <Text style={styles.guideText}>
                  Расположите еду в центре кадра
                </Text>
              </View>
            </Camera>
            
            <View style={styles.bottomControls}>
              <TouchableOpacity
                style={styles.galleryButton}
                onPress={pickImage}
              >
                <Ionicons name="images" size={28} color={colors.text} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.captureButton}
                onPress={takePicture}
              >
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => router.back()}
              >
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        ) : processing ? (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.processingText, { color: colors.text }]}>
              Распознаем еду на фото...
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.resultContainer}>
            <View style={styles.resultHeader}>
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={resetScan}
              >
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </TouchableOpacity>
              
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                Результат сканирования
              </Text>
              
              <TouchableOpacity 
                style={styles.saveButton} 
                onPress={addFoodToDiary}
              >
                <Text style={[styles.saveButtonText, { color: colors.primary }]}>
                  Сохранить
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={[styles.recognizedFoodCard, { backgroundColor: colors.card }]}>
              <View style={styles.confidenceBar}>
                <View 
                  style={[
                    styles.confidenceFill, 
                    { 
                      width: `${recognizedFood.confidence * 100}%`,
                      backgroundColor: getConfidenceColor(recognizedFood.confidence)
                    }
                  ]} 
                />
                <Text style={styles.confidenceText}>
                  Точность: {Math.round(recognizedFood.confidence * 100)}%
                </Text>
              </View>
              
              <Text style={[styles.foodName, { color: colors.text }]}>
                {selectedAlternative 
                  ? recognizedFood.alternatives.find(alt => alt.id === selectedAlternative)?.name 
                  : recognizedFood.name}
              </Text>
              
              <View style={styles.nutritionRow}>
                <View style={styles.nutritionItem}>
                  <Text style={[styles.nutritionValue, { color: colors.text }]}>
                    {Math.round(recognizedFood.calories * quantity)}
                  </Text>
                  <Text style={[styles.nutritionLabel, { color: colors.textSecondary }]}>
                    ккал
                  </Text>
                </View>
                
                <View style={styles.nutritionItem}>
                  <Text style={[styles.nutritionValue, { color: colors.text }]}>
                    {(recognizedFood.protein * quantity).toFixed(1)}г
                  </Text>
                  <Text style={[styles.nutritionLabel, { color: colors.textSecondary }]}>
                    белки
                  </Text>
                </View>
                
                <View style={styles.nutritionItem}>
                  <Text style={[styles.nutritionValue, { color: colors.text }]}>
                    {(recognizedFood.carbs * quantity).toFixed(1)}г
                  </Text>
                  <Text style={[styles.nutritionLabel, { color: colors.textSecondary }]}>
                    углеводы
                  </Text>
                </View>
                
                <View style={styles.nutritionItem}>
                  <Text style={[styles.nutritionValue, { color: colors.text }]}>
                    {(recognizedFood.fat * quantity).toFixed(1)}г
                  </Text>
                  <Text style={[styles.nutritionLabel, { color: colors.textSecondary }]}>
                    жиры
                  </Text>
                </View>
              </View>
              
              <TouchableOpacity 
                style={[styles.portionButton, { backgroundColor: colors.border }]} 
                onPress={() => setShowPortionModal(true)}
              >
                <Ionicons name="restaurant-outline" size={18} color={colors.text} />
                <Text style={[styles.portionText, { color: colors.text }]}>
                  {quantity.toFixed(quantity % 1 === 0 ? 0 : 2)} порция {recognizedFood.serving && `(${recognizedFood.serving})`}
                </Text>
                <Ionicons name="chevron-down" size={18} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            {recognizedFood.alternatives.length > 0 && (
              <View style={styles.alternativesSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Возможно, это:
                </Text>
                
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.alternativesScroll}
                >
                  <TouchableOpacity
                    style={[
                      styles.alternativeCard,
                      { backgroundColor: !selectedAlternative ? colors.primary : colors.card }
                    ]}
                    onPress={() => setSelectedAlternative(null)}
                  >
                    <Text style={[
                      styles.alternativeName,
                      { color: !selectedAlternative ? '#fff' : colors.text }
                    ]}>
                      {recognizedFood.name}
                    </Text>
                    <Text style={[
                      styles.alternativeConfidence,
                      { color: !selectedAlternative ? 'rgba(255,255,255,0.7)' : colors.textSecondary }
                    ]}>
                      {Math.round(recognizedFood.confidence * 100)}%
                    </Text>
                  </TouchableOpacity>
                  
                  {recognizedFood.alternatives.map((alt) => (
                    <TouchableOpacity
                      key={alt.id}
                      style={[
                        styles.alternativeCard,
                        { backgroundColor: selectedAlternative === alt.id ? colors.primary : colors.card }
                      ]}
                      onPress={() => selectAlternative(alt.id)}
                    >
                      <Text style={[
                        styles.alternativeName,
                        { color: selectedAlternative === alt.id ? '#fff' : colors.text }
                      ]}>
                        {alt.name}
                      </Text>
                      <Text style={[
                        styles.alternativeConfidence,
                        { color: selectedAlternative === alt.id ? 'rgba(255,255,255,0.7)' : colors.textSecondary }
                      ]}>
                        {Math.round(alt.confidence * 100)}%
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
            
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.border }]}
                onPress={resetScan}
              >
                <Ionicons name="refresh" size={20} color={colors.text} />
                <Text style={[styles.actionButtonText, { color: colors.text }]}>
                  Сканировать снова
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={addFoodToDiary}
              >
                <Ionicons name="add-circle" size={20} color="#fff" />
                <Text style={[styles.actionButtonText, { color: "#fff" }]}>
                  Добавить в дневник
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
        
        {/* Модальное окно выбора порции */}
        <Modal
          visible={showPortionModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowPortionModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Размер порции
                </Text>
                <TouchableOpacity
                  onPress={() => setShowPortionModal(false)}
                >
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.portionControls}>
                <TouchableOpacity
                  style={[styles.portionControl, { backgroundColor: colors.border }]}
                  onPress={() => changeQuantity(-0.25)}
                >
                  <Ionicons name="remove" size={24} color={colors.text} />
                </TouchableOpacity>
                
                <View style={styles.portionValueContainer}>
                  <Text style={[styles.portionValue, { color: colors.text }]}>
                    {quantity.toFixed(quantity % 1 === 0 ? 0 : 2)}
                  </Text>
                  <Text style={[styles.portionUnit, { color: colors.textSecondary }]}>
                    порция
                  </Text>
                </View>
                
                <TouchableOpacity
                  style={[styles.portionControl, { backgroundColor: colors.border }]}
                  onPress={() => changeQuantity(0.25)}
                >
                  <Ionicons name="add" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.presetPortions}>
                {[0.25, 0.5, 0.75, 1, 1.5, 2].map((value) => (
                  <TouchableOpacity
                    key={value.toString()}
                    style={[
                      styles.presetButton,
                      quantity === value && { 
                        backgroundColor: colors.primary,
                        borderColor: colors.primary
                      },
                      { borderColor: colors.border }
                    ]}
                    onPress={() => setQuantity(value)}
                  >
                    <Text
                      style={[
                        styles.presetText,
                        { color: quantity === value ? '#fff' : colors.text }
                      ]}
                    >
                      {value}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <TouchableOpacity
                style={[styles.confirmButton, { backgroundColor: colors.primary }]}
                onPress={() => setShowPortionModal(false)}
              >
                <Text style={styles.confirmButtonText}>
                  Подтвердить
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </>
  );
}

// Вспомогательная функция для получения цвета на основе уверенности распознавания
function getConfidenceColor(confidence: number): string {
  if (confidence > 0.9) return '#4CAF50';
  if (confidence > 0.7) return '#8BC34A';
  if (confidence > 0.5) return '#FFEB3B';
  if (confidence > 0.3) return '#FFC107';
  return '#FF5722';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  flipButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flashButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraGuide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideCircle: {
    width: 250,
    height: 250,
    borderRadius: 125,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderStyle: 'dashed',
  },
  guideText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 20,
  },
  galleryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
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
    backgroundColor: '#fff',
  },
  closeButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  processingText: {
    fontSize: 16,
    marginTop: 15,
  },
  resultContainer: {
    flex: 1,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    padding: 5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  recognizedFoodCard: {
    marginHorizontal: 15,
    borderRadius: 16,
    overflow: 'hidden',
  },
  confidenceBar: {
    height: 30,
    position: 'relative',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  confidenceFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
  },
  confidenceText: {
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    lineHeight: 30,
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  foodName: {
    fontSize: 24,
    fontWeight: 'bold',
    margin: 15,
    textAlign: 'center',
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  nutritionLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  portionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 15,
    marginBottom: 15,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  portionText: {
    fontSize: 14,
    marginHorizontal: 8,
  },
  alternativesSection: {
    marginTop: 20,
    paddingHorizontal: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  alternativesScroll: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  alternativeCard: {
    marginRight: 10,
    padding: 10,
    borderRadius: 8,
    minWidth: 120,
  },
  alternativeName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  alternativeConfidence: {
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    marginBottom: 30,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  portionControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  portionControl: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  portionValueContainer: {
    alignItems: 'center',
  },
  portionValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  portionUnit: {
    fontSize: 14,
  },
  presetPortions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  presetButton: {
    width: '30%',
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  presetText: {
    fontSize: 16,
    fontWeight: '500',
  },
  confirmButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 