import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { ChevronLeft, Camera, Plus, X, Check, Clock, Users } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';

type Ingredient = {
  id: string;
  name: string;
  amount: string;
  unit: string;
};

type Step = {
  id: string;
  description: string;
};

export default function CreateRecipeScreen() {
  const { theme } = useTheme();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [cookingTime, setCookingTime] = useState('');
  const [servings, setServings] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { id: '1', name: '', amount: '', unit: 'г' }
  ]);
  const [steps, setSteps] = useState<Step[]>([
    { id: '1', description: '' }
  ]);
  const [saving, setSaving] = useState(false);

  const pickImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Ошибка', 'Для загрузки изображений необходим доступ к медиатеке');
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Ошибка', 'Для съемки фото необходим доступ к камере');
      return;
    }
    
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const addIngredient = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newId = (ingredients.length + 1).toString();
    setIngredients([...ingredients, { id: newId, name: '', amount: '', unit: 'г' }]);
  };

  const updateIngredient = (id: string, field: keyof Ingredient, value: string) => {
    const updated = ingredients.map(ingredient => 
      ingredient.id === id ? { ...ingredient, [field]: value } : ingredient
    );
    setIngredients(updated);
  };

  const removeIngredient = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter(ingredient => ingredient.id !== id));
    }
  };

  const addStep = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newId = (steps.length + 1).toString();
    setSteps([...steps, { id: newId, description: '' }]);
  };

  const updateStep = (id: string, description: string) => {
    const updated = steps.map(step => 
      step.id === id ? { ...step, description } : step
    );
    setSteps(updated);
  };

  const removeStep = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (steps.length > 1) {
      setSteps(steps.filter(step => step.id !== id));
    }
  };

  const validateForm = (): boolean => {
    if (!name.trim()) {
      Alert.alert('Ошибка', 'Название рецепта не может быть пустым');
      return false;
    }
    
    if (!cookingTime.trim() || isNaN(Number(cookingTime))) {
      Alert.alert('Ошибка', 'Укажите корректное время приготовления');
      return false;
    }
    
    if (!servings.trim() || isNaN(Number(servings))) {
      Alert.alert('Ошибка', 'Укажите корректное количество порций');
      return false;
    }
    
    // Проверка ингредиентов
    const emptyIngredient = ingredients.find(i => !i.name.trim() || !i.amount.trim());
    if (emptyIngredient) {
      Alert.alert('Ошибка', 'Заполните все поля ингредиентов');
      return false;
    }
    
    // Проверка шагов
    const emptyStep = steps.find(s => !s.description.trim());
    if (emptyStep) {
      Alert.alert('Ошибка', 'Заполните все шаги приготовления');
      return false;
    }
    
    return true;
  };

  const saveRecipe = async () => {
    if (!validateForm()) return;
    
    try {
      setSaving(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // В реальном приложении здесь был бы код для загрузки изображения и сохранения рецепта
      // например, с использованием Supabase:
      /*
      // Загрузка изображения
      let imageUrl = null;
      if (image) {
        const file = {
          uri: image,
          type: 'image/jpeg',
          name: `recipe-${Date.now()}.jpg`,
        };
        
        const { data, error } = await supabase.storage
          .from('recipe-images')
          .upload(`public/${file.name}`, file);
          
        if (error) throw error;
        
        imageUrl = `https://your-project.supabase.co/storage/v1/object/public/recipe-images/public/${file.name}`;
      }
      
      // Создание рецепта
      const { data: recipeData, error: recipeError } = await supabase
        .from('recipes')
        .insert({
          name,
          description,
          cooking_time: parseInt(cookingTime),
          servings: parseInt(servings),
          image_url: imageUrl,
          created_at: new Date(),
          user_id: currentUser.id
        })
        .select('id')
        .single();
        
      if (recipeError) throw recipeError;
      
      const recipeId = recipeData.id;
      
      // Сохранение ингредиентов
      const ingredientsToInsert = ingredients.map((ingredient, index) => ({
        recipe_id: recipeId,
        name: ingredient.name,
        amount: parseFloat(ingredient.amount),
        unit: ingredient.unit,
        order_number: index + 1
      }));
      
      const { error: ingredientsError } = await supabase
        .from('recipe_ingredients')
        .insert(ingredientsToInsert);
        
      if (ingredientsError) throw ingredientsError;
      
      // Сохранение шагов
      const stepsToInsert = steps.map((step, index) => ({
        recipe_id: recipeId,
        description: step.description,
        order_number: index + 1
      }));
      
      const { error: stepsError } = await supabase
        .from('recipe_steps')
        .insert(stepsToInsert);
        
      if (stepsError) throw stepsError;
      */
      
      // Имитация задержки для демо
      setTimeout(() => {
        setSaving(false);
        Alert.alert(
          'Успех!', 
          'Рецепт успешно сохранен', 
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }, 1500);
      
    } catch (error) {
      console.error('Error saving recipe:', error);
      setSaving(false);
      Alert.alert('Ошибка', 'Не удалось сохранить рецепт');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Новый рецепт
        </Text>
        
        <TouchableOpacity 
          style={[
            styles.saveButton, 
            { backgroundColor: theme.colors.primary },
            saving && { opacity: 0.7 }
          ]}
          onPress={saveRecipe}
          disabled={saving}
        >
          {saving ? (
            <Text style={styles.saveButtonText}>Сохраняем...</Text>
          ) : (
            <>
              <Check size={18} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Сохранить</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Изображение рецепта */}
          <TouchableOpacity 
            style={[styles.imageContainer, { backgroundColor: theme.colors.cardSecondary }]}
            onPress={pickImage}
          >
            {image ? (
              <Image source={{ uri: image }} style={styles.recipeImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Camera size={48} color={theme.colors.textSecondary} />
                <Text style={[styles.imagePlaceholderText, { color: theme.colors.textSecondary }]}>
                  Нажмите, чтобы добавить фото
                </Text>
                <View style={styles.imageButtonsContainer}>
                  <TouchableOpacity 
                    style={[styles.imageButton, { backgroundColor: theme.colors.primary }]}
                    onPress={pickImage}
                  >
                    <Text style={styles.imageButtonText}>Из галереи</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.imageButton, { backgroundColor: theme.colors.primary }]}
                    onPress={takePhoto}
                  >
                    <Text style={styles.imageButtonText}>Камера</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </TouchableOpacity>
          
          {/* Основная информация */}
          <View style={styles.formSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Основная информация
            </Text>
            
            <View style={[styles.inputContainer, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
                Название рецепта
              </Text>
              <TextInput 
                style={[styles.input, { color: theme.colors.text }]}
                placeholder="Например: Картофельный суп с грибами"
                placeholderTextColor={theme.colors.textTertiary}
                value={name}
                onChangeText={setName}
              />
            </View>
            
            <View style={[styles.inputContainer, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
                Описание
              </Text>
              <TextInput 
                style={[styles.input, styles.textArea, { color: theme.colors.text }]}
                placeholder="Краткое описание рецепта..."
                placeholderTextColor={theme.colors.textTertiary}
                multiline
                value={description}
                onChangeText={setDescription}
              />
            </View>
            
            <View style={styles.formRow}>
              <View style={[styles.inputContainer, styles.halfWidth, { backgroundColor: theme.colors.card }]}>
                <View style={styles.inputWithIcon}>
                  <Clock size={18} color={theme.colors.textSecondary} />
                  <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
                    Время (мин)
                  </Text>
                </View>
                <TextInput 
                  style={[styles.input, { color: theme.colors.text }]}
                  placeholder="30"
                  placeholderTextColor={theme.colors.textTertiary}
                  keyboardType="number-pad"
                  value={cookingTime}
                  onChangeText={setCookingTime}
                />
              </View>
              
              <View style={[styles.inputContainer, styles.halfWidth, { backgroundColor: theme.colors.card }]}>
                <View style={styles.inputWithIcon}>
                  <Users size={18} color={theme.colors.textSecondary} />
                  <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
                    Порций
                  </Text>
                </View>
                <TextInput 
                  style={[styles.input, { color: theme.colors.text }]}
                  placeholder="4"
                  placeholderTextColor={theme.colors.textTertiary}
                  keyboardType="number-pad"
                  value={servings}
                  onChangeText={setServings}
                />
              </View>
            </View>
          </View>
          
          {/* Ингредиенты */}
          <View style={styles.formSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Ингредиенты
              </Text>
              <TouchableOpacity 
                style={[styles.addButton, { backgroundColor: theme.colors.primaryLight }]}
                onPress={addIngredient}
              >
                <Plus size={18} color={theme.colors.primary} />
                <Text style={[styles.addButtonText, { color: theme.colors.primary }]}>
                  Добавить
                </Text>
              </TouchableOpacity>
            </View>
            
            {ingredients.map((ingredient, index) => (
              <View key={ingredient.id} style={[styles.ingredientRow, { backgroundColor: theme.colors.card }]}>
                <View style={styles.ingredientIndex}>
                  <Text style={[styles.ingredientNumber, { color: theme.colors.text }]}>
                    {index + 1}
                  </Text>
                </View>
                
                <View style={styles.ingredientNameContainer}>
                  <TextInput 
                    style={[styles.ingredientNameInput, { color: theme.colors.text }]}
                    placeholder="Название ингредиента"
                    placeholderTextColor={theme.colors.textTertiary}
                    value={ingredient.name}
                    onChangeText={(value) => updateIngredient(ingredient.id, 'name', value)}
                  />
                </View>
                
                <View style={styles.ingredientAmountContainer}>
                  <TextInput 
                    style={[styles.ingredientAmountInput, { color: theme.colors.text }]}
                    placeholder="Кол-во"
                    placeholderTextColor={theme.colors.textTertiary}
                    keyboardType="decimal-pad"
                    value={ingredient.amount}
                    onChangeText={(value) => updateIngredient(ingredient.id, 'amount', value)}
                  />
                </View>
                
                <View style={styles.ingredientUnitContainer}>
                  <TextInput 
                    style={[styles.ingredientUnitInput, { color: theme.colors.text }]}
                    placeholder="ед."
                    placeholderTextColor={theme.colors.textTertiary}
                    value={ingredient.unit}
                    onChangeText={(value) => updateIngredient(ingredient.id, 'unit', value)}
                  />
                </View>
                
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={() => removeIngredient(ingredient.id)}
                >
                  <X size={18} color={theme.colors.danger} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
          
          {/* Шаги приготовления */}
          <View style={styles.formSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Шаги приготовления
              </Text>
              <TouchableOpacity 
                style={[styles.addButton, { backgroundColor: theme.colors.primaryLight }]}
                onPress={addStep}
              >
                <Plus size={18} color={theme.colors.primary} />
                <Text style={[styles.addButtonText, { color: theme.colors.primary }]}>
                  Добавить
                </Text>
              </TouchableOpacity>
            </View>
            
            {steps.map((step, index) => (
              <View key={step.id} style={[styles.stepContainer, { backgroundColor: theme.colors.card }]}>
                <View style={[styles.stepNumber, { backgroundColor: theme.colors.primaryLight }]}>
                  <Text style={[styles.stepNumberText, { color: theme.colors.primary }]}>
                    {index + 1}
                  </Text>
                </View>
                
                <View style={styles.stepContent}>
                  <TextInput 
                    style={[styles.stepInput, { color: theme.colors.text }]}
                    placeholder="Описание шага..."
                    placeholderTextColor={theme.colors.textTertiary}
                    multiline
                    value={step.description}
                    onChangeText={(value) => updateStep(step.id, value)}
                  />
                </View>
                
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={() => removeStep(step.id)}
                >
                  <X size={18} color={theme.colors.danger} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    padding: 4,
  },
  title: {
    fontFamily: 'Nunito-Bold',
    fontSize: 20,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  saveButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
  },
  recipeImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    marginTop: 8,
    marginBottom: 12,
  },
  imageButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  imageButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  imageButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#FFFFFF',
  },
  formSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Nunito-Bold',
    fontSize: 18,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 6,
  },
  addButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  inputContainer: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  inputLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    marginBottom: 6,
  },
  input: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    padding: 0,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  ingredientIndex: {
    width: 24,
    alignItems: 'center',
    marginRight: 8,
  },
  ingredientNumber: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  ingredientNameContainer: {
    flex: 3,
    marginRight: 8,
  },
  ingredientNameInput: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
  },
  ingredientAmountContainer: {
    flex: 1,
    marginRight: 8,
  },
  ingredientAmountInput: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    textAlign: 'center',
  },
  ingredientUnitContainer: {
    flex: 1,
    marginRight: 8,
  },
  ingredientUnitInput: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    textAlign: 'center',
  },
  removeButton: {
    padding: 4,
  },
  stepContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
  },
  stepContent: {
    flex: 1,
  },
  stepInput: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    textAlignVertical: 'top',
    minHeight: 60,
  },
});