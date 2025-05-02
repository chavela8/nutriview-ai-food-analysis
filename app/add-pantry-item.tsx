import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useThemeColor } from '../contexts/ThemeContext';

// Категории продуктов
const CATEGORIES = [
  { id: '2', name: 'Холодильник', icon: 'snow-outline' },
  { id: '3', name: 'Морозилка', icon: 'snow' },
  { id: '4', name: 'Сухие продукты', icon: 'briefcase-outline' },
  { id: '5', name: 'Овощи и фрукты', icon: 'nutrition-outline' },
  { id: '6', name: 'Напитки', icon: 'wine-outline' },
  { id: '7', name: 'Соусы и специи', icon: 'flask-outline' },
];

// Общие единицы измерения
const UNITS = [
  'шт', 'г', 'кг', 'мл', 'л', 'ст.л', 'ч.л', 'пачка', 'бут', 'банка'
];

export default function AddPantryItemScreen() {
  const router = useRouter();
  const { colors, isDark } = useThemeColor();
  
  // Состояния для формы
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('шт');
  const [category, setCategory] = useState<string | null>(null);
  const [expirationDate, setExpirationDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [scanningBarcode, setScanningBarcode] = useState(false);
  const [showUnitSelector, setShowUnitSelector] = useState(false);
  
  // Функция для открытия библиотеки изображений
  const pickImage = async () => {
    const result = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (result.granted) {
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!pickerResult.canceled) {
        setImage(pickerResult.assets[0].uri);
      }
    } else {
      Alert.alert('Необходим доступ к галерее', 'Пожалуйста, разрешите доступ к галерее в настройках');
    }
  };
  
  // Функция для съемки фото
  const takePhoto = async () => {
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    
    if (cameraPermission.granted) {
      const pickerResult = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!pickerResult.canceled) {
        setImage(pickerResult.assets[0].uri);
      }
    } else {
      Alert.alert('Необходим доступ к камере', 'Пожалуйста, разрешите доступ к камере в настройках');
    }
  };
  
  // Функция для имитации сканирования штрих-кода
  const scanBarcode = () => {
    setScanningBarcode(true);
    // Имитация процесса сканирования
    setTimeout(() => {
      setScanningBarcode(false);
      // Заполним данные, как будто нашли продукт
      setName('Молоко ультрапастеризованное 3.2%');
      setQuantity('1');
      setUnit('л');
      setCategory('Холодильник');
      setImage('https://img.health-diet.ru/milk.jpg');
      
      // Установим срок годности на 7 дней вперед
      const newDate = new Date();
      newDate.setDate(newDate.getDate() + 7);
      setExpirationDate(newDate);
      
      Alert.alert('Продукт найден', 'Информация о продукте загружена из базы данных');
    }, 2000);
  };
  
  // Функция для сохранения продукта
  const saveItem = () => {
    // Проверка обязательных полей
    if (!name) {
      Alert.alert('Ошибка', 'Пожалуйста, введите название продукта');
      return;
    }
    
    if (!category) {
      Alert.alert('Ошибка', 'Пожалуйста, выберите категорию продукта');
      return;
    }
    
    // Проверка, что количество - число
    if (isNaN(parseFloat(quantity)) || parseFloat(quantity) <= 0) {
      Alert.alert('Ошибка', 'Пожалуйста, введите корректное количество');
      return;
    }
    
    // Имитация сохранения с задержкой
    setTimeout(() => {
      // Здесь был бы код для сохранения в базу данных
      
      // Возвращаемся на предыдущий экран
      router.back();
      
      // Пример вызова уведомления об успешном добавлении
      // Alert.alert('Успех', 'Продукт успешно добавлен в инвентарь');
    }, 500);
  };
  
  // Обработчик изменения даты
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setExpirationDate(selectedDate);
    }
  };
  
  // Форматирование даты для отображения
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };
  
  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Добавить продукт',
          headerRight: () => (
            <TouchableOpacity onPress={saveItem} style={{marginRight: 15}}>
              <Text style={{color: colors.primary, fontSize: 16, fontWeight: '600'}}>Сохранить</Text>
            </TouchableOpacity>
          )
        }}
      />
      
      <SafeAreaView edges={['bottom']} style={{flex: 1}}>
        <ScrollView style={[styles.container, {backgroundColor: colors.background}]}>
          {/* Изображение продукта */}
          <View style={styles.imageSection}>
            {image ? (
              <View style={styles.imageContainer}>
                <Image source={{ uri: image }} style={styles.productImage} />
                <TouchableOpacity 
                  style={[styles.removeImageButton, {backgroundColor: colors.error}]}
                  onPress={() => setImage(null)}
                >
                  <Ionicons name="close" size={20} color="white" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[styles.imagePlaceholder, {backgroundColor: colors.card}]}>
                <Ionicons name="image-outline" size={50} color={colors.textSecondary} />
                <Text style={[styles.imagePlaceholderText, {color: colors.textSecondary}]}>
                  Добавьте фото
                </Text>
              </View>
            )}
            
            <View style={styles.imageButtonsContainer}>
              <TouchableOpacity 
                style={[styles.imageButton, {backgroundColor: colors.card}]}
                onPress={takePhoto}
              >
                <Ionicons name="camera" size={20} color={colors.text} />
                <Text style={[styles.imageButtonText, {color: colors.text}]}>Камера</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.imageButton, {backgroundColor: colors.card}]}
                onPress={pickImage}
              >
                <Ionicons name="images" size={20} color={colors.text} />
                <Text style={[styles.imageButtonText, {color: colors.text}]}>Галерея</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.imageButton, {backgroundColor: colors.card}]}
                onPress={scanBarcode}
                disabled={scanningBarcode}
              >
                <Ionicons name="barcode" size={20} color={colors.text} />
                <Text style={[styles.imageButtonText, {color: colors.text}]}>
                  {scanningBarcode ? 'Сканирование...' : 'Штрих-код'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Основная информация */}
          <View style={[styles.formSection, {backgroundColor: colors.card}]}>
            <Text style={[styles.sectionTitle, {color: colors.text}]}>Информация о продукте</Text>
            
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, {color: colors.textSecondary}]}>Название</Text>
              <TextInput
                style={[styles.input, {color: colors.text, borderColor: colors.border}]}
                value={name}
                onChangeText={setName}
                placeholder="Введите название продукта"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
            
            <View style={styles.rowContainer}>
              <View style={[styles.inputContainer, {flex: 0.6}]}>
                <Text style={[styles.inputLabel, {color: colors.textSecondary}]}>Количество</Text>
                <TextInput
                  style={[styles.input, {color: colors.text, borderColor: colors.border}]}
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="decimal-pad"
                  placeholder="1"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              
              <View style={[styles.inputContainer, {flex: 0.4}]}>
                <Text style={[styles.inputLabel, {color: colors.textSecondary}]}>Единица</Text>
                <TouchableOpacity
                  style={[styles.unitSelector, {borderColor: colors.border}]}
                  onPress={() => setShowUnitSelector(!showUnitSelector)}
                >
                  <Text style={{color: colors.text}}>{unit}</Text>
                  <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
                
                {showUnitSelector && (
                  <View style={[styles.unitDropdown, {backgroundColor: colors.card, borderColor: colors.border}]}>
                    {UNITS.map((u) => (
                      <TouchableOpacity
                        key={u}
                        style={styles.unitOption}
                        onPress={() => {
                          setUnit(u);
                          setShowUnitSelector(false);
                        }}
                      >
                        <Text style={[
                          styles.unitOptionText,
                          {color: unit === u ? colors.primary : colors.text}
                        ]}>
                          {u}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, {color: colors.textSecondary}]}>Срок годности</Text>
              <TouchableOpacity
                style={[styles.dateInput, {borderColor: colors.border}]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={{color: colors.text}}>{formatDate(expirationDate)}</Text>
                <Ionicons name="calendar" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
              
              {showDatePicker && (
                <DateTimePicker
                  value={expirationDate}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                />
              )}
            </View>
          </View>
          
          {/* Выбор категории */}
          <View style={[styles.formSection, {backgroundColor: colors.card}]}>
            <Text style={[styles.sectionTitle, {color: colors.text}]}>Категория</Text>
            <View style={styles.categoriesContainer}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryButton,
                    {
                      backgroundColor: category === cat.name ? colors.primary : colors.backgroundDarker,
                      borderColor: category === cat.name ? colors.primary : colors.border,
                    }
                  ]}
                  onPress={() => setCategory(cat.name)}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={24}
                    color={category === cat.name ? 'white' : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.categoryButtonText,
                      {color: category === cat.name ? 'white' : colors.text}
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          {/* Дополнительные заметки */}
          <View style={[styles.formSection, {backgroundColor: colors.card}]}>
            <Text style={[styles.sectionTitle, {color: colors.text}]}>Заметки (необязательно)</Text>
            <TextInput
              style={[
                styles.notesInput,
                {color: colors.text, borderColor: colors.border, backgroundColor: colors.backgroundDarker}
              ]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Введите дополнительную информацию о продукте..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
          
          {/* Кнопка сохранения (внизу экрана) */}
          <TouchableOpacity
            style={[styles.saveButton, {backgroundColor: colors.primary}]}
            onPress={saveItem}
          >
            <Text style={styles.saveButtonText}>Сохранить продукт</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
  },
  imageSection: {
    marginBottom: 20,
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
    width: 150,
    height: 150,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 15,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  imagePlaceholderText: {
    marginTop: 10,
    fontSize: 14,
  },
  imageButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 5,
  },
  imageButtonText: {
    marginLeft: 6,
    fontSize: 14,
  },
  formSection: {
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  inputContainer: {
    marginBottom: 15,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    height: 45,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  dateInput: {
    height: 45,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  unitSelector: {
    height: 45,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  unitDropdown: {
    position: 'absolute',
    top: 73,
    right: 0,
    width: '100%',
    borderWidth: 1,
    borderRadius: 8,
    maxHeight: 200,
    zIndex: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  unitOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  unitOptionText: {
    fontSize: 14,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    margin: 5,
    borderWidth: 1,
    width: '47%',
  },
  categoryButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    minHeight: 100,
  },
  saveButton: {
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 