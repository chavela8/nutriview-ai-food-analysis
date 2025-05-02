import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Image, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import * as Haptics from 'expo-haptics';
import { Heart, AlertCircle, Star, Lock, ArrowRight, ChevronRight, User, Bookmark, Settings } from 'lucide-react-native';

// Интерфейсы для типизации данных
interface DietMode {
  id: string;
  name: string;
  description: string;
  icon: string;
  isPremium: boolean;
  isRecommended?: boolean;
  restrictions: string[];
  benefits: string[];
  dailyCalories?: number;
  macroRatio?: {
    protein: number;
    fat: number;
    carbs: number;
  };
}

// Предопределенные диетические режимы
const dietModes: DietMode[] = [
  {
    id: 'balanced',
    name: 'Сбалансированное питание',
    description: 'Оптимальное соотношение белков, жиров и углеводов для поддержания здорового образа жизни.',
    icon: 'heart',
    isPremium: false,
    isRecommended: true,
    restrictions: [],
    benefits: ['Поддержание здорового веса', 'Стабильный уровень энергии', 'Улучшение общего самочувствия'],
    dailyCalories: 2000,
    macroRatio: {
      protein: 30,
      fat: 30,
      carbs: 40
    }
  },
  {
    id: 'keto',
    name: 'Кетогенная диета',
    description: 'Низкоуглеводная диета с высоким содержанием жиров для перевода организма в состояние кетоза.',
    icon: 'flame',
    isPremium: true,
    restrictions: ['Хлеб и зерновые', 'Фрукты', 'Крахмалистые овощи', 'Сахар'],
    benefits: ['Быстрая потеря веса', 'Снижение аппетита', 'Повышение уровня энергии', 'Улучшение концентрации'],
    dailyCalories: 1800,
    macroRatio: {
      protein: 20,
      fat: 75,
      carbs: 5
    }
  },
  {
    id: 'vegetarian',
    name: 'Вегетарианство',
    description: 'Диета, исключающая мясо, но допускающая некоторые продукты животного происхождения, такие как яйца и молочные продукты.',
    icon: 'leaf',
    isPremium: false,
    restrictions: ['Мясо', 'Птица', 'Рыба и морепродукты'],
    benefits: ['Снижение риска сердечно-сосудистых заболеваний', 'Снижение риска некоторых видов рака', 'Поддержание здорового веса'],
    dailyCalories: 1900,
    macroRatio: {
      protein: 15,
      fat: 30,
      carbs: 55
    }
  },
  {
    id: 'vegan',
    name: 'Веганство',
    description: 'Строгая форма вегетарианства, исключающая все продукты животного происхождения.',
    icon: 'plant',
    isPremium: false,
    restrictions: ['Мясо', 'Птица', 'Рыба и морепродукты', 'Яйца', 'Молочные продукты', 'Мёд'],
    benefits: ['Снижение уровня холестерина', 'Поддержание здорового веса', 'Уменьшение воздействия на окружающую среду'],
    dailyCalories: 1800,
    macroRatio: {
      protein: 15,
      fat: 30,
      carbs: 55
    }
  },
  {
    id: 'paleo',
    name: 'Палеодиета',
    description: 'Питание, основанное на предполагаемой диете наших предков эпохи палеолита, с акцентом на цельные продукты.',
    icon: 'bone',
    isPremium: true,
    restrictions: ['Зерновые', 'Бобовые', 'Молочные продукты', 'Рафинированный сахар', 'Обработанные продукты'],
    benefits: ['Снижение веса', 'Улучшение чувствительности к инсулину', 'Улучшение здоровья кишечника'],
    dailyCalories: 2100,
    macroRatio: {
      protein: 35,
      fat: 40,
      carbs: 25
    }
  },
  {
    id: 'lowcarb',
    name: 'Низкоуглеводная диета',
    description: 'Ограничение потребления углеводов с акцентом на белки и жиры для снижения веса и улучшения метаболизма.',
    icon: 'droplet',
    isPremium: false,
    restrictions: ['Сахар', 'Хлеб и зерновые', 'Крахмалистые овощи', 'Фрукты с высоким содержанием сахара'],
    benefits: ['Снижение веса', 'Контроль уровня сахара в крови', 'Улучшение липидного профиля'],
    dailyCalories: 1800,
    macroRatio: {
      protein: 35,
      fat: 45,
      carbs: 20
    }
  },
  {
    id: 'mediterranean',
    name: 'Средиземноморская диета',
    description: 'Питание, основанное на традиционных продуктах стран Средиземноморья, с акцентом на растительную пищу и оливковое масло.',
    icon: 'sun',
    isPremium: true,
    restrictions: ['Красное мясо', 'Сахар', 'Обработанные продукты'],
    benefits: ['Улучшение здоровья сердца', 'Снижение риска некоторых видов рака', 'Поддержание когнитивных функций'],
    dailyCalories: 2000,
    macroRatio: {
      protein: 20,
      fat: 40,
      carbs: 40
    }
  },
  {
    id: 'glutenfree',
    name: 'Безглютеновая диета',
    description: 'Исключение продуктов, содержащих глютен, для людей с целиакией или чувствительностью к глютену.',
    icon: 'ban',
    isPremium: false,
    restrictions: ['Пшеница', 'Рожь', 'Ячмень', 'Продукты, содержащие глютен'],
    benefits: ['Улучшение пищеварения', 'Уменьшение воспаления', 'Повышение уровня энергии'],
    dailyCalories: 2000,
    macroRatio: {
      protein: 25,
      fat: 30,
      carbs: 45
    }
  },
  {
    id: 'diabetic',
    name: 'Диета для диабетиков',
    description: 'Сбалансированное питание с контролем углеводов для поддержания стабильного уровня сахара в крови.',
    icon: 'activity',
    isPremium: true,
    restrictions: ['Сахар', 'Белый хлеб', 'Сладкие напитки', 'Продукты с высоким гликемическим индексом'],
    benefits: ['Стабилизация уровня сахара в крови', 'Снижение риска осложнений диабета', 'Поддержание здорового веса'],
    dailyCalories: 1800,
    macroRatio: {
      protein: 30,
      fat: 35,
      carbs: 35
    }
  }
];

const DietModesScreen = () => {
  const [selectedDiet, setSelectedDiet] = useState<string | null>(null);
  const [userPreferences, setUserPreferences] = useState({
    allergies: {
      nuts: false,
      dairy: false,
      gluten: false,
      shellfish: false,
      eggs: false,
    },
    goals: {
      weightLoss: true,
      muscleGain: false,
      healthyEating: false,
      energyBoost: false,
    },
    restrictions: {
      vegetarian: false,
      vegan: false,
      halal: false,
      kosher: false,
    }
  });
  
  const { theme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    // Имитация загрузки пользовательских настроек
    // В реальном приложении здесь будет запрос к API или локальному хранилищу
    setTimeout(() => {
      setSelectedDiet('balanced');
    }, 500);
  }, []);

  const handleDietSelection = (dietId: string) => {
    const diet = dietModes.find(diet => diet.id === dietId);
    
    if (diet && diet.isPremium) {
      // Проверка на премиум (в демо-версии показываем предупреждение)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(
        'Премиум-режим',
        'Для доступа к этому режиму питания требуется премиум-подписка. Хотите узнать о преимуществах подписки?',
        [
          { text: 'Отмена', style: 'cancel' },
          { text: 'Подробнее', onPress: () => router.push('/premium') }
        ]
      );
    } else {
      // Выбор диеты
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSelectedDiet(dietId);
      
      // В реальном приложении здесь будет сохранение выбора пользователя
      Alert.alert(
        'Режим питания выбран',
        `${diet?.name} будет использоваться для персонализации рекомендаций по питанию.`
      );
    }
  };

  const toggleAllergy = (allergyKey: keyof typeof userPreferences.allergies) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setUserPreferences({
      ...userPreferences,
      allergies: {
        ...userPreferences.allergies,
        [allergyKey]: !userPreferences.allergies[allergyKey]
      }
    });
  };

  const toggleGoal = (goalKey: keyof typeof userPreferences.goals) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Логика переключения целей (только одна активная)
    const updatedGoals = Object.keys(userPreferences.goals).reduce((acc, key) => {
      acc[key as keyof typeof userPreferences.goals] = key === goalKey;
      return acc;
    }, {} as typeof userPreferences.goals);
    
    setUserPreferences({
      ...userPreferences,
      goals: updatedGoals
    });
  };

  const toggleRestriction = (restrictionKey: keyof typeof userPreferences.restrictions) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // При выборе веганства автоматически включаем вегетарианство
    let updatedRestrictions = {
      ...userPreferences.restrictions,
      [restrictionKey]: !userPreferences.restrictions[restrictionKey]
    };
    
    if (restrictionKey === 'vegan' && !userPreferences.restrictions.vegan) {
      updatedRestrictions.vegetarian = true;
    }
    
    setUserPreferences({
      ...userPreferences,
      restrictions: updatedRestrictions
    });
  };

  const renderDietCard = (diet: DietMode) => {
    const isSelected = selectedDiet === diet.id;
    
    return (
      <TouchableOpacity
        key={diet.id}
        style={[
          styles.dietCard,
          { backgroundColor: theme.colors.card },
          isSelected && { borderColor: theme.colors.primary, borderWidth: 2 }
        ]}
        onPress={() => handleDietSelection(diet.id)}
        activeOpacity={0.7}
      >
        <View style={styles.dietCardContent}>
          <View style={styles.dietCardHeader}>
            <View style={styles.dietIconContainer}>
              {diet.icon === 'heart' && <Heart size={24} color={theme.colors.primary} />}
              {diet.icon === 'flame' && <Star size={24} color="#FF9500" />}
              {diet.icon === 'leaf' && <Bookmark size={24} color="#34C759" />}
              {diet.icon === 'plant' && <Bookmark size={24} color="#34C759" />}
              {diet.icon === 'bone' && <AlertCircle size={24} color="#FF9500" />}
              {diet.icon === 'droplet' && <AlertCircle size={24} color="#007AFF" />}
              {diet.icon === 'sun' && <Star size={24} color="#FF9500" />}
              {diet.icon === 'ban' && <AlertCircle size={24} color="#FF3B30" />}
              {diet.icon === 'activity' && <AlertCircle size={24} color="#5856D6" />}
            </View>
            
            <View style={styles.dietCardTitleContainer}>
              <Text style={[styles.dietTitle, { color: theme.colors.text }]}>
                {diet.name}
              </Text>
              
              {diet.isPremium && (
                <View style={styles.premiumBadge}>
                  <Lock size={12} color="#FFD700" />
                  <Text style={styles.premiumText}>Premium</Text>
                </View>
              )}
              
              {diet.isRecommended && (
                <View style={styles.recommendedBadge}>
                  <Star size={12} color="#fff" />
                  <Text style={styles.recommendedText}>Рекомендуется</Text>
                </View>
              )}
            </View>
          </View>
          
          <Text style={[styles.dietDescription, { color: theme.colors.text }]}>
            {diet.description}
          </Text>
          
          {isSelected && (
            <View style={styles.dietDetails}>
              <View style={styles.macroContainer}>
                <Text style={[styles.macroTitle, { color: theme.colors.text }]}>
                  Соотношение макронутриентов:
                </Text>
                
                <View style={styles.macroRatio}>
                  <View style={styles.macroItem}>
                    <View style={[styles.macroBar, { width: `${diet.macroRatio?.protein}%`, backgroundColor: '#4285F4' }]} />
                    <Text style={[styles.macroText, { color: theme.colors.text }]}>
                      Белки: {diet.macroRatio?.protein}%
                    </Text>
                  </View>
                  
                  <View style={styles.macroItem}>
                    <View style={[styles.macroBar, { width: `${diet.macroRatio?.fat}%`, backgroundColor: '#FBBC05' }]} />
                    <Text style={[styles.macroText, { color: theme.colors.text }]}>
                      Жиры: {diet.macroRatio?.fat}%
                    </Text>
                  </View>
                  
                  <View style={styles.macroItem}>
                    <View style={[styles.macroBar, { width: `${diet.macroRatio?.carbs}%`, backgroundColor: '#34A853' }]} />
                    <Text style={[styles.macroText, { color: theme.colors.text }]}>
                      Углеводы: {diet.macroRatio?.carbs}%
                    </Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.caloriesContainer}>
                <Text style={[styles.caloriesText, { color: theme.colors.text }]}>
                  Рекомендуемое потребление калорий: {diet.dailyCalories} ккал/день
                </Text>
                <Text style={[styles.caloriesNote, { color: theme.colors.text }]}>
                  * Значение может быть скорректировано в соответствии с вашими индивидуальными параметрами
                </Text>
              </View>
              
              <View style={styles.restrictionsContainer}>
                <Text style={[styles.restrictionsTitle, { color: theme.colors.text }]}>
                  Ограничения:
                </Text>
                
                {diet.restrictions.length > 0 ? (
                  <View style={styles.restrictionsList}>
                    {diet.restrictions.map((restriction, index) => (
                      <View key={index} style={styles.restrictionItem}>
                        <AlertCircle size={14} color="#FF3B30" />
                        <Text style={[styles.restrictionText, { color: theme.colors.text }]}>
                          {restriction}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={[styles.noRestrictionsText, { color: theme.colors.text }]}>
                    Нет строгих ограничений. Рекомендуется разнообразное питание.
                  </Text>
                )}
              </View>
              
              <View style={styles.benefitsContainer}>
                <Text style={[styles.benefitsTitle, { color: theme.colors.text }]}>
                  Преимущества:
                </Text>
                
                <View style={styles.benefitsList}>
                  {diet.benefits.map((benefit, index) => (
                    <View key={index} style={styles.benefitItem}>
                      <View style={styles.benefitDot} />
                      <Text style={[styles.benefitText, { color: theme.colors.text }]}>
                        {benefit}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Режимы питания',
          headerStyle: { backgroundColor: theme.colors.card },
          headerTintColor: theme.colors.text,
        }} 
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Выберите режим питания
          </Text>
          <Text style={[styles.sectionDescription, { color: theme.colors.text }]}>
            Рекомендации по питанию будут адаптированы под выбранный режим. Вы можете изменить его в любое время.
          </Text>
          
          <View style={styles.dietsList}>
            {dietModes.map(diet => renderDietCard(diet))}
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Персональные настройки
          </Text>
          <Text style={[styles.sectionDescription, { color: theme.colors.text }]}>
            Укажите ваши аллергии, цели и пищевые ограничения для более точных рекомендаций.
          </Text>
          
          <View style={[styles.preferencesCard, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.preferenceGroupTitle, { color: theme.colors.text }]}>
              Аллергии и непереносимость
            </Text>
            
            <View style={styles.preferenceGroup}>
              <View style={styles.preferenceItem}>
                <Text style={[styles.preferenceText, { color: theme.colors.text }]}>Орехи</Text>
                <Switch
                  value={userPreferences.allergies.nuts}
                  onValueChange={() => toggleAllergy('nuts')}
                  trackColor={{ false: '#e0e0e0', true: theme.colors.primary }}
                  thumbColor="#fff"
                />
              </View>
              
              <View style={styles.preferenceItem}>
                <Text style={[styles.preferenceText, { color: theme.colors.text }]}>Молочные продукты</Text>
                <Switch
                  value={userPreferences.allergies.dairy}
                  onValueChange={() => toggleAllergy('dairy')}
                  trackColor={{ false: '#e0e0e0', true: theme.colors.primary }}
                  thumbColor="#fff"
                />
              </View>
              
              <View style={styles.preferenceItem}>
                <Text style={[styles.preferenceText, { color: theme.colors.text }]}>Глютен</Text>
                <Switch
                  value={userPreferences.allergies.gluten}
                  onValueChange={() => toggleAllergy('gluten')}
                  trackColor={{ false: '#e0e0e0', true: theme.colors.primary }}
                  thumbColor="#fff"
                />
              </View>
              
              <View style={styles.preferenceItem}>
                <Text style={[styles.preferenceText, { color: theme.colors.text }]}>Морепродукты</Text>
                <Switch
                  value={userPreferences.allergies.shellfish}
                  onValueChange={() => toggleAllergy('shellfish')}
                  trackColor={{ false: '#e0e0e0', true: theme.colors.primary }}
                  thumbColor="#fff"
                />
              </View>
              
              <View style={styles.preferenceItem}>
                <Text style={[styles.preferenceText, { color: theme.colors.text }]}>Яйца</Text>
                <Switch
                  value={userPreferences.allergies.eggs}
                  onValueChange={() => toggleAllergy('eggs')}
                  trackColor={{ false: '#e0e0e0', true: theme.colors.primary }}
                  thumbColor="#fff"
                />
              </View>
            </View>
            
            <Text style={[styles.preferenceGroupTitle, { color: theme.colors.text, marginTop: 20 }]}>
              Цели питания
            </Text>
            
            <View style={styles.preferenceGroup}>
              <View style={styles.preferenceItem}>
                <Text style={[styles.preferenceText, { color: theme.colors.text }]}>Снижение веса</Text>
                <Switch
                  value={userPreferences.goals.weightLoss}
                  onValueChange={() => toggleGoal('weightLoss')}
                  trackColor={{ false: '#e0e0e0', true: theme.colors.primary }}
                  thumbColor="#fff"
                />
              </View>
              
              <View style={styles.preferenceItem}>
                <Text style={[styles.preferenceText, { color: theme.colors.text }]}>Набор мышечной массы</Text>
                <Switch
                  value={userPreferences.goals.muscleGain}
                  onValueChange={() => toggleGoal('muscleGain')}
                  trackColor={{ false: '#e0e0e0', true: theme.colors.primary }}
                  thumbColor="#fff"
                />
              </View>
              
              <View style={styles.preferenceItem}>
                <Text style={[styles.preferenceText, { color: theme.colors.text }]}>Здоровое питание</Text>
                <Switch
                  value={userPreferences.goals.healthyEating}
                  onValueChange={() => toggleGoal('healthyEating')}
                  trackColor={{ false: '#e0e0e0', true: theme.colors.primary }}
                  thumbColor="#fff"
                />
              </View>
              
              <View style={styles.preferenceItem}>
                <Text style={[styles.preferenceText, { color: theme.colors.text }]}>Повышение энергии</Text>
                <Switch
                  value={userPreferences.goals.energyBoost}
                  onValueChange={() => toggleGoal('energyBoost')}
                  trackColor={{ false: '#e0e0e0', true: theme.colors.primary }}
                  thumbColor="#fff"
                />
              </View>
            </View>
            
            <Text style={[styles.preferenceGroupTitle, { color: theme.colors.text, marginTop: 20 }]}>
              Пищевые ограничения
            </Text>
            
            <View style={styles.preferenceGroup}>
              <View style={styles.preferenceItem}>
                <Text style={[styles.preferenceText, { color: theme.colors.text }]}>Вегетарианство</Text>
                <Switch
                  value={userPreferences.restrictions.vegetarian}
                  onValueChange={() => toggleRestriction('vegetarian')}
                  trackColor={{ false: '#e0e0e0', true: theme.colors.primary }}
                  thumbColor="#fff"
                />
              </View>
              
              <View style={styles.preferenceItem}>
                <Text style={[styles.preferenceText, { color: theme.colors.text }]}>Веганство</Text>
                <Switch
                  value={userPreferences.restrictions.vegan}
                  onValueChange={() => toggleRestriction('vegan')}
                  trackColor={{ false: '#e0e0e0', true: theme.colors.primary }}
                  thumbColor="#fff"
                />
              </View>
              
              <View style={styles.preferenceItem}>
                <Text style={[styles.preferenceText, { color: theme.colors.text }]}>Халяль</Text>
                <Switch
                  value={userPreferences.restrictions.halal}
                  onValueChange={() => toggleRestriction('halal')}
                  trackColor={{ false: '#e0e0e0', true: theme.colors.primary }}
                  thumbColor="#fff"
                />
              </View>
              
              <View style={styles.preferenceItem}>
                <Text style={[styles.preferenceText, { color: theme.colors.text }]}>Кошерное питание</Text>
                <Switch
                  value={userPreferences.restrictions.kosher}
                  onValueChange={() => toggleRestriction('kosher')}
                  trackColor={{ false: '#e0e0e0', true: theme.colors.primary }}
                  thumbColor="#fff"
                />
              </View>
            </View>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Дополнительные возможности
          </Text>
          
          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: theme.colors.card }]}
            onPress={() => router.push('/profile')}
          >
            <View style={styles.actionIconContainer}>
              <User size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, { color: theme.colors.text }]}>
                Персональный профиль
              </Text>
              <Text style={[styles.actionDescription, { color: theme.colors.text }]}>
                Обновите свои физические параметры для более точных рекомендаций
              </Text>
            </View>
            <ChevronRight size={20} color={theme.colors.text} style={{ opacity: 0.5 }} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: theme.colors.card }]}
            onPress={() => router.push('/ai-nutritionist')}
          >
            <View style={styles.actionIconContainer}>
              <Settings size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, { color: theme.colors.text }]}>
                Консультация с AI-нутрициологом
              </Text>
              <Text style={[styles.actionDescription, { color: theme.colors.text }]}>
                Получите персональные рекомендации от искусственного интеллекта
              </Text>
            </View>
            <ChevronRight size={20} color={theme.colors.text} style={{ opacity: 0.5 }} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 25,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
    opacity: 0.7,
  },
  dietsList: {
    marginTop: 10,
  },
  dietCard: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dietCardContent: {
    padding: 16,
  },
  dietCardHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  dietIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    marginRight: 12,
  },
  dietCardTitleContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  dietTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  premiumText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  recommendedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  recommendedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  dietDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  dietDetails: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  macroContainer: {
    marginBottom: 15,
  },
  macroTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  macroRatio: {},
  macroItem: {
    marginBottom: 8,
  },
  macroBar: {
    height: 10,
    borderRadius: 5,
    marginBottom: 4,
  },
  macroText: {
    fontSize: 12,
  },
  caloriesContainer: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  caloriesText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  caloriesNote: {
    fontSize: 12,
    fontStyle: 'italic',
    opacity: 0.7,
  },
  restrictionsContainer: {
    marginBottom: 15,
  },
  restrictionsTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  restrictionsList: {},
  restrictionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  restrictionText: {
    fontSize: 14,
    marginLeft: 8,
  },
  noRestrictionsText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  benefitsContainer: {},
  benefitsTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  benefitsList: {},
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  benefitDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 8,
  },
  benefitText: {
    fontSize: 14,
  },
  preferencesCard: {
    borderRadius: 12,
    padding: 16,
  },
  preferenceGroupTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  preferenceGroup: {},
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  preferenceText: {
    fontSize: 14,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 12,
    opacity: 0.7,
  },
});

export default DietModesScreen; 