import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Image, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Camera, RotateCcw, Zap, Barcode, Circle as XCircle, CircleCheck as CheckCircle, CameraOff, Utensils, Scale, Info, PlusCircle, RefreshCcw, BookOpen, AlertTriangle, ShieldAlert, ChevronRight, Image as ImageIcon } from 'lucide-react-native';
import { CameraView, useCameraPermissions, CameraType } from 'expo-camera';
import { FoodAnalysis } from '@/components/FoodAnalysis';
import { analyzeFoodImage, saveFoodItem, addMealLog } from '@/lib/api';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useIsFocused } from '@react-navigation/native';

export default function ScanScreen() {
  const { theme } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [detectMultiple, setDetectMultiple] = useState(false);
  const [detectedFoods, setDetectedFoods] = useState<any[]>([]);
  const [showTips, setShowTips] = useState(false);
  const [estimatingPortion, setEstimatingPortion] = useState(false);
  const [portionEstimate, setPortionEstimate] = useState<{weight: number, unit: string} | null>(null);
  const cameraRef = useRef(null);
  const isFocused = useIsFocused();

  // Переключение камеры
  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  // Переключение режима множественного обнаружения
  const toggleMultipleDetection = () => {
    setDetectMultiple(!detectMultiple);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  // Оценка порции
  const estimatePortion = async () => {
    if (!result) return;
    
    setEstimatingPortion(true);
    try {
      // В реальном приложении здесь был бы вызов API для оценки размера порции
      // Имитируем процесс для демонстрации
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Предполагаемый ответ от API
      const estimatedWeight = Math.floor(Math.random() * 300) + 50; // 50-350г
      const unit = 'г';
      
      setPortionEstimate({ weight: estimatedWeight, unit });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Обновляем данные о питательной ценности с учетом порции
      if (result.nutrition) {
        const portionRatio = estimatedWeight / 100; // Предполагаем, что исходные данные на 100г
        const updatedResult = {
          ...result,
          nutrition: {
            calories: Math.round(result.nutrition.calories * portionRatio),
            protein: Math.round(result.nutrition.protein * portionRatio * 10) / 10,
            carbs: Math.round(result.nutrition.carbs * portionRatio * 10) / 10,
            fat: Math.round(result.nutrition.fat * portionRatio * 10) / 10,
            portionWeight: estimatedWeight,
            portionUnit: unit
          }
        };
        setResult(updatedResult);
      }
    } catch (err) {
      Alert.alert('Ошибка', 'Не удалось оценить размер порции');
    } finally {
      setEstimatingPortion(false);
    }
  };

  // Советы по улучшению фото
  const photoTips = [
    'Расположите еду в центре кадра для лучшего распознавания',
    'Убедитесь, что освещение достаточное',
    'Избегайте бликов и теней на еде',
    'Сделайте фото сверху для лучшей оценки размера порции',
    'При множественных блюдах старайтесь, чтобы они не перекрывали друг друга'
  ];

  // Сделать фото и проанализировать
  const takePicture = async () => {
    if (!cameraRef.current || loading) return;

    try {
      setLoading(true);
      setError(null);
      setDetectedFoods([]);
      setPortionEstimate(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.7,
      });

      if (detectMultiple) {
        // Режим обнаружения нескольких продуктов
        const analysisResults = await analyzeFoodImage(photo.base64, true);
        setDetectedFoods(analysisResults.foods || []);
        
        if (analysisResults.foods && analysisResults.foods.length > 0) {
          // Выбираем первый продукт как основной результат
          setResult(analysisResults.foods[0]);
        } else {
          throw new Error('Не удалось распознать продукты на изображении');
        }
      } else {
        // Стандартный режим одного продукта
      const analysis = await analyzeFoodImage(photo.base64);
      setResult(analysis);

      // Сохраняем результат в базу данных
      const foodItem = await saveFoodItem({
        name: analysis.name,
        calories: analysis.nutrition.calories,
        protein: analysis.nutrition.protein,
        carbs: analysis.nutrition.carbs,
        fat: analysis.nutrition.fat,
        image_url: photo.uri,
      });

      // Добавляем запись в дневник питания
      await addMealLog(foodItem.id, 'snack');
      }
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка при анализе');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setShowTips(true); // Показываем советы при ошибке
    } finally {
      setLoading(false);
    }
  };

  // Выбор еды из списка обнаруженных
  const selectFood = (food) => {
    setResult(food);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Сброс результатов
  const resetScan = () => {
    setResult(null);
    setError(null);
    setDetectedFoods([]);
    setShowTips(false);
    setPortionEstimate(null);
  };

  // Запуск камеры
  const startCamera = () => {
    setIsCameraActive(true);
  };

  // Закрытие камеры
  const closeCamera = () => {
    setIsCameraActive(false);
    setResult(null);
    setError(null);
    setDetectedFoods([]);
    setShowTips(false);
    setPortionEstimate(null);
  };

  const handleScanFood = async () => {
    if (loading) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    setError(null);
    setDetectedFoods([]);
    setPortionEstimate(null);
    
    try {
      // В реальном приложении здесь мы бы получили изображение с камеры
      // Для демо используем плейсхолдер
      const imageUri = 'https://images.unsplash.com/photo-1561043433-aaf687c4cf04';
      
      // Отправляем изображение на анализ
      const analysisResults = await analyzeFoodImage(imageUri);
      setDetectedFoods(analysisResults);
      
      // Выбираем результат с наивысшей уверенностью
      if (analysisResults.length > 0) {
        setResult(analysisResults[0]);
        
        // Обновляем статистику
        setScanStats(prev => ({
          ...prev,
          totalScans: prev.totalScans + 1,
          successfulScans: prev.successfulScans + 1
        }));
      }
    } catch (error) {
      Alert.alert(
        'Ошибка анализа',
        'Не удалось распознать блюдо. Пожалуйста, попробуйте ещё раз.'
      );
    } finally {
      setLoading(false);
    }
  };
  
  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert(
        'Необходим доступ к галерее',
        'Для выбора изображения требуется разрешение на доступ к фотогалерее'
      );
      return;
    }
    
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    
    if (!pickerResult.canceled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setLoading(true);
      setError(null);
      setDetectedFoods([]);
      setPortionEstimate(null);
      
      try {
        // В реальном приложении отправляем выбранное изображение
        const analysisResults = await analyzeFoodImage(pickerResult.assets[0].uri);
        setDetectedFoods(analysisResults);
        
        if (analysisResults.length > 0) {
          setResult(analysisResults[0]);
          
          setScanStats(prev => ({
            ...prev,
            totalScans: prev.totalScans + 1,
            successfulScans: prev.successfulScans + 1
          }));
        }
      } catch (error) {
        Alert.alert(
          'Ошибка анализа',
          'Не удалось распознать блюдо на изображении.'
        );
      } finally {
        setLoading(false);
      }
    }
  };
  
  const selectAlternativeResult = (result) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setResult(result);
  };
  
  const addToMealDiary = () => {
    if (!result) return;
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    Alert.alert(
      'Добавление в дневник',
      'Выберите прием пищи:',
      [
        { text: 'Завтрак', onPress: () => handleAddToMeal('breakfast') },
        { text: 'Обед', onPress: () => handleAddToMeal('lunch') },
        { text: 'Ужин', onPress: () => handleAddToMeal('dinner') },
        { text: 'Перекус', onPress: () => handleAddToMeal('snack') },
        { text: 'Отмена', style: 'cancel' }
      ]
    );
  };
  
  const handleAddToMeal = (mealType) => {
    // В реальном приложении здесь был бы код для добавления в базу данных
    Alert.alert(
      'Успешно добавлено',
      `${result.name} добавлен(а) в ${mealType === 'breakfast' ? 'завтрак' : 
                                             mealType === 'lunch' ? 'обед' : 
                                             mealType === 'dinner' ? 'ужин' : 'перекус'}`
    );
    
    // Сбрасываем сканирование после добавления
    setTimeout(resetScan, 1000);
  };
  
  const renderNutritionInfo = () => {
    if (!result) return null;
    
    const { nutrition, calories, healthScore, allergies } = result;
    
    return (
      <View style={styles.nutritionContainer}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Пищевая ценность
        </Text>
        
        <View style={styles.macrosContainer}>
          <View style={[styles.macroItem, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.macroValue, { color: theme.colors.primary }]}>
              {calories}
            </Text>
            <Text style={[styles.macroLabel, { color: theme.colors.textSecondary }]}>
              ккал
            </Text>
          </View>
          
          <View style={[styles.macroItem, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.macroValue, { color: theme.colors.primary }]}>
              {nutrition.protein}г
            </Text>
            <Text style={[styles.macroLabel, { color: theme.colors.textSecondary }]}>
              Белки
            </Text>
          </View>
          
          <View style={[styles.macroItem, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.macroValue, { color: theme.colors.primary }]}>
              {nutrition.fat}г
            </Text>
            <Text style={[styles.macroLabel, { color: theme.colors.textSecondary }]}>
              Жиры
            </Text>
          </View>
          
          <View style={[styles.macroItem, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.macroValue, { color: theme.colors.primary }]}>
              {nutrition.carbs}г
            </Text>
            <Text style={[styles.macroLabel, { color: theme.colors.textSecondary }]}>
              Углеводы
            </Text>
          </View>
        </View>
        
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
              Порция:
            </Text>
            <Text style={[styles.detailValue, { color: theme.colors.text }]}>
              {result.portion}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
              Клетчатка:
            </Text>
            <Text style={[styles.detailValue, { color: theme.colors.text }]}>
              {nutrition.fiber}г
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
              Сахар:
            </Text>
            <Text style={[styles.detailValue, { color: theme.colors.text }]}>
              {nutrition.sugar}г
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
              Показатель здоровья:
            </Text>
            <View style={styles.healthScoreContainer}>
              <LinearGradient
                colors={healthScore > 80 ? ['#4CAF50', '#8BC34A'] : 
                        healthScore > 60 ? ['#FFEB3B', '#FFC107'] : 
                        ['#FF9800', '#F44336']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.healthScoreBadge, { width: `${healthScore}%` }]}
              />
              <Text style={styles.healthScoreText}>
                {healthScore}/100
          </Text>
            </View>
          </View>
          
          {allergies && allergies.length > 0 && (
            <View style={[styles.allergensContainer, { backgroundColor: theme.colors.warningLight }]}>
              <ShieldAlert size={18} color={theme.colors.warning} style={{ marginRight: 8 }} />
              <Text style={[styles.allergensText, { color: theme.colors.warning }]}>
                Содержит аллергены: {allergies.join(', ')}
              </Text>
            </View>
          )}
        </View>
        
        <Text style={[styles.ingredientsTitle, { color: theme.colors.text }]}>
          Состав:
        </Text>
        
        <Text style={[styles.ingredientsText, { color: theme.colors.textSecondary }]}>
          {result.ingredients.join(', ')}
        </Text>
      </View>
    );
  };
  
  const renderAlternatives = () => {
    if (detectedFoods.length <= 1) return null;
    
    const alternatives = detectedFoods.filter(r => r.id !== result?.id);
    
    return (
      <View style={styles.alternativesContainer}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Альтернативные варианты
        </Text>
        
        {alternatives.map(food => (
            <TouchableOpacity 
            key={food.id}
            style={[styles.alternativeItem, { backgroundColor: theme.colors.card }]}
            onPress={() => selectAlternativeResult(food)}
          >
            <View style={styles.alternativeContent}>
              <Text style={[styles.alternativeName, { color: theme.colors.text }]}>
                {food.name}
              </Text>
              <View style={styles.alternativeDetails}>
                <Text style={[styles.alternativeCalories, { color: theme.colors.textSecondary }]}>
                  {food.calories} ккал, {food.portion}
                </Text>
                <Text style={[styles.alternativeConfidence, { color: theme.colors.primary }]}>
                  Точность: {(food.confidence * 100).toFixed(0)}%
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        ))}
      </View>
    );
  };
  
  const renderResultsScreen = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Анализируем изображение...
          </Text>
          <Text style={[styles.loadingSubText, { color: theme.colors.textSecondary }]}>
            Наш AI определяет блюдо и рассчитывает питательную ценность
          </Text>
        </View>
      );
    }
    
    if (!result) {
      return (
        <View style={styles.errorContainer}>
          <AlertTriangle size={64} color={theme.colors.danger} />
          <Text style={[styles.errorTitle, { color: theme.colors.text }]}>
            Блюдо не распознано
          </Text>
          <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>
            Попробуйте сделать снимок при лучшем освещении или с другого ракурса
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
            onPress={resetScan}
          >
            <RefreshCcw size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.retryButtonText}>Повторить сканирование</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return (
      <ScrollView 
        style={styles.resultScrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.resultContainer}>
          <View style={styles.resultHeader}>
            <View style={styles.confidenceContainer}>
              <Text style={[styles.confidenceText, { color: theme.colors.textSecondary }]}>
                Уверенность AI: {(result.confidence * 100).toFixed(0)}%
              </Text>
              <LinearGradient
                colors={[theme.colors.primary, theme.colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.confidenceBar, { width: `${result.confidence * 100}%` }]}
              />
            </View>
            
            <Text style={[styles.resultTitle, { color: theme.colors.text }]}>
              {result.name}
            </Text>
          </View>
          
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: result.imageUri || 'https://images.unsplash.com/photo-1561043433-aaf687c4cf04' }}
              style={styles.foodImage}
              resizeMode="cover"
            />
          </View>
          
          {renderNutritionInfo()}
          {renderAlternatives()}
          
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
              onPress={addToMealDiary}
            >
              <PlusCircle size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.addButtonText}>Добавить в дневник</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.resetButton, { borderColor: theme.colors.border }]}
              onPress={resetScan}
            >
              <RefreshCcw size={20} color={theme.colors.text} style={{ marginRight: 8 }} />
              <Text style={[styles.resetButtonText, { color: theme.colors.text }]}>
                Новое сканирование
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  };
  
  const renderCameraScreen = () => {
    if (!permission?.granted) {
      return (
        <View style={styles.permissionContainer}>
          <Camera size={64} color={theme.colors.textSecondary} />
              <Text style={[styles.permissionTitle, { color: theme.colors.text }]}>
                Требуется доступ к камере
              </Text>
              <Text style={[styles.permissionText, { color: theme.colors.textSecondary }]}>
            Для сканирования еды нам нужен доступ к камере устройства
              </Text>
              <TouchableOpacity 
                style={[styles.permissionButton, { backgroundColor: theme.colors.primary }]}
                onPress={requestPermission}
              >
                <Text style={styles.permissionButtonText}>Предоставить доступ</Text>
              </TouchableOpacity>
            </View>
      );
    }
    
    return (
      <View style={styles.cameraContainer}>
        {isFocused && isCameraActive && (
          <CameraView
            style={styles.camera}
            ref={cameraRef}
          >
            <View style={styles.cameraOverlay}>
              <View style={styles.scanFrame}>
                <View style={styles.scanFrameCorner} />
                <View style={[styles.scanFrameCorner, styles.topRight]} />
                <View style={[styles.scanFrameCorner, styles.bottomLeft]} />
                <View style={[styles.scanFrameCorner, styles.bottomRight]} />
              </View>
              
              <View style={styles.cameraControls}>
                <BlurView
                  tint={theme.dark ? 'dark' : 'light'}
                  intensity={30}
                  style={styles.cameraInstructions}
                >
                  <Text style={styles.cameraInstructionsText}>
                    Наведите камеру на блюдо для анализа
                  </Text>
                </BlurView>
                
                <View style={styles.cameraButtons}>
                  <TouchableOpacity
                    style={[styles.scanButton, { backgroundColor: theme.colors.primary }]}
                    onPress={handleScanFood}
                  >
                    <Zap size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.galleryButton, { backgroundColor: 'rgba(255,255,255,0.3)' }]}
                    onPress={handlePickImage}
                  >
                    <ImageIcon size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </CameraView>
        )}
        
        <View style={styles.statsStrip}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>
              {scanStats.totalScans}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Сканирований
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>
              {scanStats.successfulScans}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Распознано
            </Text>
          </View>
          
          <TouchableOpacity style={styles.statItem}>
            <Info size={18} color={theme.colors.primary} />
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Подробнее
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {result ? 'Результаты анализа' : 'Сканер еды'}
        </Text>
      </View>
      
      <View style={styles.content}>
        {result ? renderResultsScreen() : renderCameraScreen()}
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
  content: {
    flex: 1,
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 24,
  },
  scanFrame: {
    alignSelf: 'center',
    width: 250,
    height: 250,
    marginTop: 50,
    position: 'relative',
  },
  scanFrameCorner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#FFFFFF',
    borderTopWidth: 4,
    borderLeftWidth: 4,
    top: 0,
    left: 0,
  },
  topRight: {
    right: 0,
    left: undefined,
    borderLeftWidth: 0,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    top: undefined,
    borderTopWidth: 0,
    borderBottomWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    top: undefined,
    left: undefined,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  cameraControls: {
    alignItems: 'center',
    marginBottom: 40,
  },
  cameraInstructions: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 30,
  },
  cameraInstructionsText: {
    color: '#FFFFFF',
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    textAlign: 'center',
  },
  cameraButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scanButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 15,
  },
  galleryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 15,
  },
  statsStrip: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontFamily: 'Nunito-Bold',
    fontSize: 18,
  },
  statLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    marginTop: 4,
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  permissionTitle: {
    fontFamily: 'Nunito-Bold',
    fontSize: 20,
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 24,
  },
  permissionButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  permissionButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    fontFamily: 'Nunito-Bold',
    fontSize: 20,
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  loadingSubText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 40,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  errorTitle: {
    fontFamily: 'Nunito-Bold',
    fontSize: 20,
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  retryButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  resultScrollView: {
    flex: 1,
  },
  resultContainer: {
    padding: 24,
    paddingBottom: 100,
  },
  resultHeader: {
    marginBottom: 16,
  },
  confidenceContainer: {
    marginBottom: 8,
  },
  confidenceText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    marginBottom: 4,
  },
  confidenceBar: {
    height: 4,
    borderRadius: 2,
  },
  resultTitle: {
    fontFamily: 'Nunito-Bold',
    fontSize: 24,
    marginTop: 8,
  },
  imageContainer: {
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  foodImage: {
    width: '100%',
    height: '100%',
  },
  nutritionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 18,
    marginBottom: 16,
  },
  macrosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  macroItem: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  macroValue: {
    fontFamily: 'Nunito-Bold',
    fontSize: 18,
  },
  macroLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    marginTop: 4,
  },
  detailsContainer: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  detailLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  detailValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
  },
  healthScoreContainer: {
    width: 100,
    height: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  healthScoreBadge: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 10,
  },
  healthScoreText: {
    position: 'absolute',
    alignSelf: 'center',
    top: 2,
    fontFamily: 'Inter-Bold',
    fontSize: 12,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  allergensContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  allergensText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    flex: 1,
  },
  ingredientsTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    marginBottom: 8,
  },
  ingredientsText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  alternativesContainer: {
    marginBottom: 24,
  },
  alternativeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  alternativeContent: {
    flex: 1,
  },
  alternativeName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    marginBottom: 4,
  },
  alternativeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alternativeCalories: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
  },
  alternativeConfidence: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
  },
  actionButtons: {
    marginTop: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  addButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  resetButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  }
});