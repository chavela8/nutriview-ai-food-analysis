import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Switch,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  ArrowLeft, 
  Save,
  Check,
  X,
  AlertCircle,
  Heart, 
  Weight,
  Dumbbell,
  Droplet,
  Info
} from 'lucide-react-native';

// Типы диетических ограничений
type DietaryRestriction = 
  'gluten_free' | 
  'dairy_free' | 
  'vegetarian' | 
  'vegan' | 
  'keto' | 
  'paleo' | 
  'low_carb' | 
  'low_fat' | 
  'low_sodium' | 
  'diabetic' | 
  'high_protein';

// Типы аллергий
type Allergy = 
  'nuts' | 
  'peanuts' | 
  'shellfish' | 
  'fish' | 
  'eggs' | 
  'soy' | 
  'wheat' | 
  'milk';

// Тип оздоровительных целей
type HealthGoal = 
  'weight_loss' | 
  'weight_gain' | 
  'maintain_weight' | 
  'muscle_gain' | 
  'improve_energy' | 
  'heart_health' | 
  'gut_health' | 
  'better_sleep';

// Интерфейс для настроек питания пользователя
interface DietaryPreferences {
  restrictions: DietaryRestriction[];
  allergies: Allergy[];
  healthGoals: HealthGoal[];
  calorieTarget: number;
  macroTargets: {
    protein: number; // percentage
    carbs: number; // percentage
    fat: number; // percentage
  };
  waterTarget: number; // in ml
}

export default function DietaryPreferencesScreen() {
  const { theme } = useTheme();
  const [preferences, setPreferences] = useState<DietaryPreferences>({
    restrictions: [],
    allergies: [],
    healthGoals: [],
    calorieTarget: 2000,
    macroTargets: {
      protein: 30,
      carbs: 40,
      fat: 30
    },
    waterTarget: 2500
  });
  
  const [loading, setLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState<'restrictions' | 'allergies' | 'goals'>('restrictions');

  // Загрузить данные пользователя
  useEffect(() => {
    loadUserPreferences();
  }, []);

  // Мониторить изменения для кнопки сохранения
  useEffect(() => {
    if (!loading) {
      setHasChanges(true);
    }
  }, [preferences]);

  // Загрузка предпочтений пользователя
  const loadUserPreferences = () => {
    setLoading(true);
    
    // В реальном приложении здесь был бы запрос API
    // Но сейчас симулируем загрузку данных
    setTimeout(() => {
      // Демо-данные
      const demoPreferences: DietaryPreferences = {
        restrictions: ['gluten_free', 'low_carb'],
        allergies: ['nuts', 'shellfish'],
        healthGoals: ['weight_loss', 'heart_health'],
        calorieTarget: 1800,
        macroTargets: {
          protein: 35,
          carbs: 30,
          fat: 35
        },
        waterTarget: 2500
      };
      
      setPreferences(demoPreferences);
      setLoading(false);
    }, 500);
  };

  // Сохранить настройки
  const savePreferences = () => {
    setLoading(true);
    
    // В реальном приложении здесь был бы API-запрос для сохранения
    setTimeout(() => {
      setLoading(false);
      setHasChanges(false);
      
      Alert.alert(
        'Успешно сохранено',
        'Ваши диетические предпочтения были обновлены'
      );
    }, 1000);
  };

  // Переключить диетическое ограничение
  const toggleRestriction = (restriction: DietaryRestriction) => {
    setPreferences(prev => {
      const newRestrictions = prev.restrictions.includes(restriction)
        ? prev.restrictions.filter(r => r !== restriction)
        : [...prev.restrictions, restriction];
        
      return {
        ...prev,
        restrictions: newRestrictions
      };
    });
  };

  // Переключить аллергию
  const toggleAllergy = (allergy: Allergy) => {
    setPreferences(prev => {
      const newAllergies = prev.allergies.includes(allergy)
        ? prev.allergies.filter(a => a !== allergy)
        : [...prev.allergies, allergy];
        
      return {
        ...prev,
        allergies: newAllergies
      };
    });
  };

  // Переключить оздоровительную цель
  const toggleHealthGoal = (goal: HealthGoal) => {
    setPreferences(prev => {
      const newGoals = prev.healthGoals.includes(goal)
        ? prev.healthGoals.filter(g => g !== goal)
        : [...prev.healthGoals, goal];
        
      return {
        ...prev,
        healthGoals: newGoals
      };
    });
  };

  // Получить название диетического ограничения
  const getRestrictionName = (restriction: DietaryRestriction): string => {
    const names: Record<DietaryRestriction, string> = {
      gluten_free: 'Без глютена',
      dairy_free: 'Без лактозы',
      vegetarian: 'Вегетарианство',
      vegan: 'Веганство',
      keto: 'Кето',
      paleo: 'Палео',
      low_carb: 'Низкоуглеводная',
      low_fat: 'Низкожировая',
      low_sodium: 'Низкосолевая',
      diabetic: 'Диабетическая',
      high_protein: 'Высокобелковая'
    };
    
    return names[restriction];
  };

  // Получить название аллергии
  const getAllergyName = (allergy: Allergy): string => {
    const names: Record<Allergy, string> = {
      nuts: 'Орехи',
      peanuts: 'Арахис',
      shellfish: 'Моллюски',
      fish: 'Рыба',
      eggs: 'Яйца',
      soy: 'Соя',
      wheat: 'Пшеница',
      milk: 'Молоко'
    };
    
    return names[allergy];
  };

  // Получить название оздоровительной цели
  const getHealthGoalName = (goal: HealthGoal): string => {
    const names: Record<HealthGoal, string> = {
      weight_loss: 'Снижение веса',
      weight_gain: 'Набор веса',
      maintain_weight: 'Поддержание веса',
      muscle_gain: 'Набор мышечной массы',
      improve_energy: 'Повышение энергии',
      heart_health: 'Здоровье сердца',
      gut_health: 'Здоровье ЖКТ',
      better_sleep: 'Улучшение сна'
    };
    
    return names[goal];
  };

  // Получить описание диетического ограничения
  const getRestrictionDescription = (restriction: DietaryRestriction): string => {
    const descriptions: Record<DietaryRestriction, string> = {
      gluten_free: 'Исключает пшеницу, ячмень, рожь и другие источники глютена',
      dairy_free: 'Исключает молоко и молочные продукты',
      vegetarian: 'Исключает мясо и рыбу, но разрешает яйца и молочное',
      vegan: 'Исключает все продукты животного происхождения',
      keto: 'Высокожировая, очень низкоуглеводная',
      paleo: 'Имитирует питание эпохи палеолита (мясо, орехи, ягоды, овощи)',
      low_carb: 'Ограничивает потребление углеводов',
      low_fat: 'Ограничивает потребление жиров',
      low_sodium: 'Ограничивает потребление соли',
      diabetic: 'Ограничивает потребление простых углеводов и сахара',
      high_protein: 'Высокое содержание белка для роста мышц'
    };
    
    return descriptions[restriction];
  };

  // Вернуться назад
  const goBack = () => {
    if (hasChanges) {
      Alert.alert(
        'Несохраненные изменения',
        'У вас есть несохраненные изменения. Вы уверены, что хотите выйти?',
        [
          { text: 'Остаться', style: 'cancel' },
          { text: 'Выйти', onPress: () => router.back() }
        ]
      );
    } else {
      router.back();
    }
  };

  // Отрендерить список диетических ограничений
  const renderRestrictions = () => {
    const restrictionOptions: DietaryRestriction[] = [
      'gluten_free', 'dairy_free', 'vegetarian', 'vegan', 'keto', 
      'paleo', 'low_carb', 'low_fat', 'low_sodium', 'diabetic', 
      'high_protein'
    ];
    
    return (
      <View style={styles.optionsContainer}>
        {restrictionOptions.map((restriction) => (
          <TouchableOpacity
            key={restriction}
            style={[
              styles.optionCard,
              { backgroundColor: theme.colors.card },
              preferences.restrictions.includes(restriction) 
                ? { borderColor: theme.colors.primary, borderWidth: 2 } 
                : null
            ]}
            onPress={() => toggleRestriction(restriction)}
          >
            <View style={styles.optionHeader}>
              <Text style={[styles.optionTitle, { color: theme.colors.text }]}>
                {getRestrictionName(restriction)}
              </Text>
              {preferences.restrictions.includes(restriction) && (
                <Check size={16} color={theme.colors.primary} />
              )}
            </View>
            <Text 
              style={[styles.optionDescription, { color: theme.colors.textSecondary }]}
              numberOfLines={2}
            >
              {getRestrictionDescription(restriction)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Отрендерить список аллергий
  const renderAllergies = () => {
    const allergyOptions: Allergy[] = [
      'nuts', 'peanuts', 'shellfish', 'fish', 'eggs', 'soy', 'wheat', 'milk'
    ];
    
    return (
      <View style={styles.optionsContainer}>
        {allergyOptions.map((allergy) => (
          <TouchableOpacity
            key={allergy}
            style={[
              styles.allergyCard,
              { backgroundColor: theme.colors.card },
              preferences.allergies.includes(allergy) 
                ? { backgroundColor: theme.colors.error + '20' } 
                : null
            ]}
            onPress={() => toggleAllergy(allergy)}
          >
            <View style={styles.optionHeader}>
              <Text 
                style={[
                  styles.optionTitle, 
                  { 
                    color: preferences.allergies.includes(allergy) 
                      ? theme.colors.error 
                      : theme.colors.text 
                  }
                ]}
              >
                {getAllergyName(allergy)}
              </Text>
              {preferences.allergies.includes(allergy) && (
                <AlertCircle size={16} color={theme.colors.error} />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Отрендерить список оздоровительных целей
  const renderHealthGoals = () => {
    const goalOptions: HealthGoal[] = [
      'weight_loss', 'weight_gain', 'maintain_weight', 'muscle_gain', 
      'improve_energy', 'heart_health', 'gut_health', 'better_sleep'
    ];
    
    return (
      <View style={styles.optionsContainer}>
        {goalOptions.map((goal) => (
          <TouchableOpacity
            key={goal}
            style={[
              styles.goalCard,
              { backgroundColor: theme.colors.card },
              preferences.healthGoals.includes(goal) 
                ? { backgroundColor: theme.colors.primary + '20' } 
                : null
            ]}
            onPress={() => toggleHealthGoal(goal)}
          >
            <View style={styles.optionHeader}>
              <Text 
                style={[
                  styles.optionTitle, 
                  { 
                    color: preferences.healthGoals.includes(goal) 
                      ? theme.colors.primary 
                      : theme.colors.text 
                  }
                ]}
              >
                {getHealthGoalName(goal)}
              </Text>
              {preferences.healthGoals.includes(goal) && (
                <Check size={16} color={theme.colors.primary} />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Отрендерить активную вкладку
  const renderActiveTab = () => {
    switch (activeTab) {
      case 'restrictions':
        return renderRestrictions();
      case 'allergies':
        return renderAllergies();
      case 'goals':
        return renderHealthGoals();
      default:
        return null;
    }
  };

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
          Диетические предпочтения
        </Text>
        <TouchableOpacity 
          style={[
            styles.saveButton, 
            hasChanges ? { opacity: 1 } : { opacity: 0.5 }
          ]}
          onPress={hasChanges ? savePreferences : undefined}
          disabled={!hasChanges}
        >
          <Save size={20} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>
      
      {/* Информация */}
      <View style={[styles.infoCard, { backgroundColor: theme.colors.card }]}>
        <View style={styles.infoHeader}>
          <Info size={18} color={theme.colors.primary} style={styles.infoIcon} />
          <Text style={[styles.infoTitle, { color: theme.colors.text }]}>
            Персонализация питания
          </Text>
        </View>
        <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
          Выберите предпочтения, аллергии и цели, чтобы получать более подходящие рекомендации по питанию.
        </Text>
      </View>
      
      {/* Табы */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'restrictions' 
              ? [styles.activeTab, { borderBottomColor: theme.colors.primary }]
              : null
          ]}
          onPress={() => setActiveTab('restrictions')}
        >
          <Text 
            style={[
              styles.tabText, 
              { 
                color: activeTab === 'restrictions' 
                  ? theme.colors.primary 
                  : theme.colors.textSecondary 
              }
            ]}
          >
            Диеты
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'allergies' 
              ? [styles.activeTab, { borderBottomColor: theme.colors.primary }]
              : null
          ]}
          onPress={() => setActiveTab('allergies')}
        >
          <Text 
            style={[
              styles.tabText, 
              { 
                color: activeTab === 'allergies' 
                  ? theme.colors.primary 
                  : theme.colors.textSecondary 
              }
            ]}
          >
            Аллергии
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'goals' 
              ? [styles.activeTab, { borderBottomColor: theme.colors.primary }]
              : null
          ]}
          onPress={() => setActiveTab('goals')}
        >
          <Text 
            style={[
              styles.tabText, 
              { 
                color: activeTab === 'goals' 
                  ? theme.colors.primary 
                  : theme.colors.textSecondary 
              }
            ]}
          >
            Цели
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Содержимое активной вкладки */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderActiveTab()}
        
        {/* Макронутриенты и калории */}
        <View style={[styles.sectionContainer, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Целевые показатели
          </Text>
          
          <View style={styles.targetItem}>
            <View style={styles.targetHeader}>
              <View style={styles.targetTitleContainer}>
                <Weight size={16} color={theme.colors.primary} style={styles.targetIcon} />
                <Text style={[styles.targetTitle, { color: theme.colors.text }]}>
                  Калории
                </Text>
              </View>
              <Text style={[styles.targetValue, { color: theme.colors.text }]}>
                {preferences.calorieTarget} ккал
              </Text>
            </View>
          </View>
          
          <View style={styles.targetItem}>
            <View style={styles.targetHeader}>
              <View style={styles.targetTitleContainer}>
                <Dumbbell size={16} color={theme.colors.primary} style={styles.targetIcon} />
                <Text style={[styles.targetTitle, { color: theme.colors.text }]}>
                  Макронутриенты
                </Text>
              </View>
            </View>
            <View style={styles.macroDistribution}>
              <View style={styles.macroItem}>
                <Text style={[styles.macroValue, { color: theme.colors.text }]}>
                  {preferences.macroTargets.protein}%
                </Text>
                <Text style={[styles.macroLabel, { color: theme.colors.textSecondary }]}>
                  Белки
                </Text>
              </View>
              
              <View style={styles.macroItem}>
                <Text style={[styles.macroValue, { color: theme.colors.text }]}>
                  {preferences.macroTargets.carbs}%
                </Text>
                <Text style={[styles.macroLabel, { color: theme.colors.textSecondary }]}>
                  Углеводы
                </Text>
              </View>
              
              <View style={styles.macroItem}>
                <Text style={[styles.macroValue, { color: theme.colors.text }]}>
                  {preferences.macroTargets.fat}%
                </Text>
                <Text style={[styles.macroLabel, { color: theme.colors.textSecondary }]}>
                  Жиры
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.targetItem}>
            <View style={styles.targetHeader}>
              <View style={styles.targetTitleContainer}>
                <Droplet size={16} color={theme.colors.primary} style={styles.targetIcon} />
                <Text style={[styles.targetTitle, { color: theme.colors.text }]}>
                  Вода
                </Text>
              </View>
              <Text style={[styles.targetValue, { color: theme.colors.text }]}>
                {preferences.waterTarget} мл
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
  saveButton: {
    padding: 8,
  },
  infoCard: {
    margin: 16,
    padding: 12,
    borderRadius: 10,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoIcon: {
    marginRight: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.3)',
  },
  tab: {
    paddingVertical: 12,
    marginRight: 24,
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  optionsContainer: {
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  optionCard: {
    width: '48%',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  allergyCard: {
    width: '48%',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  goalCard: {
    width: '48%',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  optionDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  sectionContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  targetItem: {
    marginBottom: 20,
  },
  targetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  targetTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  targetIcon: {
    marginRight: 8,
  },
  targetTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  targetValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  macroDistribution: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  macroItem: {
    alignItems: 'center',
    flex: 1,
  },
  macroValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  macroLabel: {
    fontSize: 14,
  },
}); 