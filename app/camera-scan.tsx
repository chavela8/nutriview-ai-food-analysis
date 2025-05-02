import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { Scan, ImagePlus, Image as ImageIcon, ChevronDown, Info, Zap } from 'lucide-react-native';

// Имитация компонента AI-модели для анализа изображений
const analyzeImage = async (imageUri) => {
  // В реальном приложении здесь будет интеграция с TensorFlow Lite/Core ML
  // Имитация задержки анализа изображения
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        foods: [
          {
            name: 'Греческий салат',
            confidence: 0.92,
            calories: 320,
            protein: 12,
            fat: 24,
            carbs: 18,
            portionSize: '250г',
            foodItems: ['огурец', 'помидор', 'сыр фета', 'оливки', 'лук красный', 'оливковое масло']
          }
        ]
      });
    }, 2000);
  });
};

const CameraScanScreen = () => {
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [cameraType, setCameraType] = useState(Camera.Constants.Type.back);
  const [flashMode, setFlashMode] = useState(Camera.Constants.FlashMode.off);
  const cameraRef = useRef(null);
  const router = useRouter();
  const { theme } = useTheme();

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const takePicture = async () => {
    if (cameraRef.current && cameraReady) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      try {
        const photo = await cameraRef.current.takePictureAsync();
        setCapturedImage(photo.uri);
        await analyzeImageHandler(photo.uri);
      } catch (e) {
        console.error('Error taking picture:', e);
        Alert.alert('Ошибка', 'Не удалось сделать снимок. Пожалуйста, попробуйте снова.');
      }
    }
  };

  const pickImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setCapturedImage(result.assets[0].uri);
      await analyzeImageHandler(result.assets[0].uri);
    }
  };

  const analyzeImageHandler = async (imageUri) => {
    setAnalyzing(true);
    try {
      const result = await analyzeImage(imageUri);
      setResults(result);
    } catch (error) {
      Alert.alert('Ошибка анализа', 'Не удалось распознать продукты на изображении.');
      console.error(error);
    } finally {
      setAnalyzing(false);
    }
  };

  const resetCamera = () => {
    setCapturedImage(null);
    setResults(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const saveToJournal = () => {
    // В реальном приложении здесь будет код для сохранения результатов в дневник питания
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Сохранено', 'Продукты добавлены в ваш дневник питания');
    resetCamera();
  };

  if (hasPermission === null) {
    return <View style={styles.container}><Text>Запрос разрешения на камеру...</Text></View>;
  }
  if (hasPermission === false) {
    return <View style={styles.container}><Text>Нет доступа к камере</Text></View>;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Сканирование продуктов',
          headerStyle: { backgroundColor: theme.colors.card },
          headerTintColor: theme.colors.text,
        }} 
      />

      {!capturedImage ? (
        <View style={styles.cameraContainer}>
          <Camera
            ref={cameraRef}
            style={styles.camera}
            type={cameraType}
            flashMode={flashMode}
            onCameraReady={() => setCameraReady(true)}
          >
            <View style={styles.overlay}>
              <View style={styles.scanFrame} />
            </View>
            <View style={styles.helpTextContainer}>
              <Text style={[styles.helpText, { color: theme.colors.text }]}>
                Расположите еду в рамке для анализа
              </Text>
            </View>
          </Camera>
          
          <View style={styles.cameraControls}>
            <TouchableOpacity 
              style={[styles.cameraButton, { backgroundColor: theme.colors.card }]}
              onPress={() => pickImage()}
            >
              <ImagePlus size={24} color={theme.colors.text} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.captureButton, { borderColor: theme.colors.primary }]}
              onPress={takePicture}
              disabled={!cameraReady}
            >
              <View style={[styles.captureButtonInner, { backgroundColor: theme.colors.primary }]} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.cameraButton, { backgroundColor: theme.colors.card }]}
              onPress={() => setCameraType(
                cameraType === Camera.Constants.Type.back
                  ? Camera.Constants.Type.front
                  : Camera.Constants.Type.back
              )}
            >
              <Scan size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <ScrollView style={{ flex: 1, width: '100%' }}>
          <View style={styles.resultContainer}>
            <Image source={{ uri: capturedImage }} style={styles.capturedImage} />
            
            {analyzing ? (
              <View style={styles.analyzingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={[styles.analyzingText, { color: theme.colors.text }]}>
                  Анализ изображения...
                </Text>
              </View>
            ) : results ? (
              <View style={styles.resultsContent}>
                <Text style={[styles.resultsTitle, { color: theme.colors.text }]}>
                  Распознанные продукты
                </Text>
                
                {results.foods.map((food, index) => (
                  <View 
                    key={index}
                    style={[styles.foodCard, { backgroundColor: theme.colors.card }]}
                  >
                    <View style={styles.foodHeader}>
                      <Text style={[styles.foodName, { color: theme.colors.text }]}>
                        {food.name}
                      </Text>
                      <Text style={[styles.confidenceText, { color: theme.colors.text }]}>
                        {Math.round(food.confidence * 100)}% уверенность
                      </Text>
                    </View>
                    
                    <View style={styles.portionContainer}>
                      <Text style={{ color: theme.colors.text }}>Порция: {food.portionSize}</Text>
                      <TouchableOpacity>
                        <ChevronDown size={16} color={theme.colors.text} />
                      </TouchableOpacity>
                    </View>
                    
                    <View style={styles.nutritionContainer}>
                      <View style={styles.nutritionItem}>
                        <Text style={[styles.nutritionValue, { color: theme.colors.text }]}>
                          {food.calories}
                        </Text>
                        <Text style={[styles.nutritionLabel, { color: theme.colors.text }]}>ккал</Text>
                      </View>
                      
                      <View style={styles.nutritionItem}>
                        <Text style={[styles.nutritionValue, { color: theme.colors.text }]}>
                          {food.protein}г
                        </Text>
                        <Text style={[styles.nutritionLabel, { color: theme.colors.text }]}>белки</Text>
                      </View>
                      
                      <View style={styles.nutritionItem}>
                        <Text style={[styles.nutritionValue, { color: theme.colors.text }]}>
                          {food.fat}г
                        </Text>
                        <Text style={[styles.nutritionLabel, { color: theme.colors.text }]}>жиры</Text>
                      </View>
                      
                      <View style={styles.nutritionItem}>
                        <Text style={[styles.nutritionValue, { color: theme.colors.text }]}>
                          {food.carbs}г
                        </Text>
                        <Text style={[styles.nutritionLabel, { color: theme.colors.text }]}>углеводы</Text>
                      </View>
                    </View>
                    
                    <View style={styles.ingredientsContainer}>
                      <Text style={[styles.ingredientsTitle, { color: theme.colors.text }]}>
                        Распознанные ингредиенты:
                      </Text>
                      <Text style={[styles.ingredientsList, { color: theme.colors.text }]}>
                        {food.foodItems.join(', ')}
                      </Text>
                    </View>
                  </View>
                ))}
                
                <View style={styles.actionButtons}>
                  <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: theme.colors.card }]}
                    onPress={resetCamera}
                  >
                    <Text style={{ color: theme.colors.text }}>Сканировать заново</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
                    onPress={saveToJournal}
                  >
                    <Text style={{ color: '#fff' }}>Добавить в дневник</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.errorContainer}>
                <Text style={[styles.errorText, { color: theme.colors.text }]}>
                  Не удалось проанализировать изображение. Пожалуйста, попробуйте снова.
                </Text>
                <TouchableOpacity 
                  style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
                  onPress={resetCamera}
                >
                  <Text style={{ color: '#fff' }}>Повторить попытку</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  cameraContainer: {
    flex: 1,
    width: '100%',
  },
  camera: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#3498db',
    borderRadius: 20,
  },
  helpTextContainer: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  helpText: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    color: 'white',
    padding: 8,
    borderRadius: 4,
    fontSize: 14,
  },
  cameraControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  cameraButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  captureButtonInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  resultContainer: {
    width: '100%',
    padding: 15,
  },
  capturedImage: {
    width: '100%',
    height: 300,
    borderRadius: 15,
    marginBottom: 15,
  },
  analyzingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  analyzingText: {
    marginTop: 10,
    fontSize: 16,
  },
  resultsContent: {
    width: '100%',
  },
  resultsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  foodCard: {
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  foodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  foodName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  confidenceText: {
    fontSize: 12,
    opacity: 0.7,
  },
  portionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    marginBottom: 10,
  },
  nutritionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  nutritionLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  ingredientsContainer: {
    marginTop: 5,
  },
  ingredientsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  ingredientsList: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  errorContainer: {
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginBottom: 15,
    textAlign: 'center',
  },
  retryButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
  },
});

export default CameraScanScreen; 