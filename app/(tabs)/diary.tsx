import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Calendar, PlusCircle, AlertTriangle, ChevronRight, Award, TrendingUp, InfoCircle, Plus, BarChart2, Utensils, Coffee, Sun, Moon, ArrowUp, ArrowDown, Settings } from 'lucide-react-native';
import { NutritionSummary } from '@/components/NutritionSummary';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { getNutritionRecommendations } from '@/lib/api';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const screenWidth = Dimensions.get('window').width;

// Компонент для визуализации прогресса
const ProgressBar = ({ progress, color, height = 8, backgroundColor = 'rgba(0,0,0,0.05)' }) => {
  return (
    <View style={[styles.progressContainer, { height, backgroundColor }]}>
      <View 
        style={[
          styles.progressFill, 
          { 
            width: `${Math.min(progress, 100)}%`,
            backgroundColor: color,
            height
          }
        ]} 
      />
    </View>
  );
};

// Компонент для отображения макронутриентов
const MacroItem = ({ title, current, target, color, unit = 'г', theme }) => {
  const percentage = Math.min((current / target) * 100, 100).toFixed(0);
  
  return (
    <View style={styles.macroItem}>
      <View style={styles.macroHeader}>
        <Text style={[styles.macroTitle, { color: theme.colors.text }]}>{title}</Text>
        <Text style={[styles.macroPercentage, { color }]}>{percentage}%</Text>
      </View>
      
      <ProgressBar progress={percentage} color={color} />
      
      <View style={styles.macroValues}>
        <Text style={[styles.macroCurrentValue, { color: theme.colors.text }]}>
          {current}{unit}
        </Text>
        <Text style={[styles.macroTargetValue, { color: theme.colors.textSecondary }]}>
          из {target}{unit}
        </Text>
      </View>
    </View>
  );
};

export default function DiaryScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('meals');
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [nutritionTrends, setNutritionTrends] = useState({
    calories: [1800, 2100, 1950, 2200, 1850, 2050, 1900],
    protein: [95, 110, 87, 105, 92, 99, 88],
    carbs: [220, 245, 210, 260, 230, 240, 215],
    fat: [55, 68, 62, 72, 58, 64, 60],
  });
  const [showNutrientInfo, setShowNutrientInfo] = useState<string | null>(null);
  const [diaryData, setDiaryData] = useState(null);

  useEffect(() => {
    loadRecommendations();
    loadDiaryData();
  }, []);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      const data = await getNutritionRecommendations();
      setRecommendations(data);
    } catch (error) {
      console.error('Ошибка при загрузке рекомендаций:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDiaryData = () => {
    setLoading(true);
    
    // Имитация загрузки данных с сервера
    setTimeout(() => {
      // Демо-данные для дневника питания
      const mockData = {
        date: selectedDate,
        summary: {
          calories: {
            consumed: 1840,
            target: 2200,
            remaining: 360
          },
          macros: {
            protein: {
              consumed: 95,
              target: 120
            },
            carbs: {
              consumed: 160,
              target: 220
            },
            fat: {
              consumed: 68,
              target: 73
            },
            fiber: {
              consumed: 18,
              target: 25
            }
          },
          water: {
            consumed: 1250,
            target: 2000
          }
        },
        meals: [
          {
            type: 'breakfast',
            name: 'Завтрак',
            time: '08:30',
            icon: Coffee,
            items: [
              {
                id: 1,
                name: 'Овсянка с ягодами',
                calories: 320,
                protein: 12,
                carbs: 52,
                fat: 8,
                portion: '250г',
                imageUrl: 'https://images.unsplash.com/photo-1517673400267-0251440c45dc'
              },
              {
                id: 2,
                name: 'Кофе с молоком',
                calories: 80,
                protein: 4,
                carbs: 6,
                fat: 4,
                portion: '200мл',
                imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93'
              }
            ]
          },
          {
            type: 'lunch',
            name: 'Обед',
            time: '13:15',
            icon: Sun,
            items: [
              {
                id: 3,
                name: 'Куриный суп с лапшой',
                calories: 350,
                protein: 25,
                carbs: 30,
                fat: 12,
                portion: '300г',
                imageUrl: 'https://images.unsplash.com/photo-1584949602350-7191bca7a8a0'
              },
              {
                id: 4,
                name: 'Хлеб цельнозерновой',
                calories: 120,
                protein: 4,
                carbs: 22,
                fat: 1,
                portion: '50г',
                imageUrl: 'https://images.unsplash.com/photo-1534620808146-d33bb39128b2'
              }
            ]
          },
          {
            type: 'dinner',
            name: 'Ужин',
            time: '19:00',
            icon: Moon,
            items: [
              {
                id: 5,
                name: 'Лосось на гриле',
                calories: 320,
                protein: 34,
                carbs: 0,
                fat: 18,
                portion: '180г',
                imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2'
              },
              {
                id: 6,
                name: 'Овощной салат',
                calories: 150,
                protein: 3,
                carbs: 12,
                fat: 10,
                portion: '200г',
                imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd'
              }
            ]
          },
          {
            type: 'snack',
            name: 'Перекусы',
            time: 'В течение дня',
            icon: Utensils,
            items: [
              {
                id: 7,
                name: 'Яблоко',
                calories: 80,
                protein: 0,
                carbs: 20,
                fat: 0,
                portion: '1 шт',
                imageUrl: 'https://images.unsplash.com/photo-1570913149827-d2ac84ab3f9a'
              },
              {
                id: 8,
                name: 'Греческий йогурт',
                calories: 120,
                protein: 15,
                carbs: 8,
                fat: 2,
                portion: '150г',
                imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777'
              },
              {
                id: 9,
                name: 'Орехи ассорти',
                calories: 180,
                protein: 6,
                carbs: 6,
                fat: 16,
                portion: '30г',
                imageUrl: 'https://images.unsplash.com/photo-1563215369-7e3820fa16f9'
              }
            ]
          }
        ],
        trends: {
          calories: [1950, 1880, 1790, 1920, 1840, 1840, 0],
          weight: [76.2, 76.1, 76.0, 75.9, 75.8, 75.7, 0]
        }
      };
      
      setDiaryData(mockData);
      setLoading(false);
    }, 1000);
  };

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      weekday: 'long'
    };
    return date.toLocaleDateString('ru-RU', options);
  };

  const nutritionData = {
    consumed: {
      calories: 1650,
      protein: 82,
      carbs: 185,
      fat: 55,
      fiber: 22,
      water: 1200,
      vitamins: {
        'A': '65%',
        'C': '120%',
        'D': '35%',
        'E': '85%',
        'B12': '90%'
      },
      minerals: {
        'Ca': '45%',
        'Fe': '70%',
        'Mg': '80%',
        'Zn': '60%',
        'K': '75%'
      }
    },
    target: {
      calories: 2200,
      protein: 110,
      carbs: 275,
      fat: 70,
      fiber: 30,
      water: 2500
    }
  };

  const weeklyCaloriesData = {
    labels: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
    datasets: [
      {
        data: nutritionTrends.calories,
        color: () => theme.colors.primary,
        strokeWidth: 2,
      },
    ],
    legend: ['Калории']
  };

  const weeklyNutrientsData = {
    labels: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
    datasets: [
      {
        data: nutritionTrends.protein,
        color: () => theme.colors.secondary,
        strokeWidth: 2,
      },
      {
        data: nutritionTrends.carbs,
        color: () => theme.colors.tertiary,
        strokeWidth: 2,
      },
      {
        data: nutritionTrends.fat,
        color: () => theme.colors.accent,
        strokeWidth: 2,
      },
    ],
    legend: ['Белки', 'Углеводы', 'Жиры']
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const nutrientInfoTexts = {
    protein: 'Белки — строительный материал для мышц, органов и тканей. Норма: 0.8-1.6г на кг веса в зависимости от активности.',
    carbs: 'Углеводы — основной источник энергии. Рекомендуемое потребление: 45-65% от общего числа калорий.',
    fat: 'Жиры необходимы для усвоения жирорастворимых витаминов и гормонального баланса. Норма: 20-35% от общего числа калорий.',
    fiber: 'Клетчатка улучшает пищеварение и контролирует уровень сахара. Рекомендация: 25-30г в день.',
    vitamins: 'Витамины участвуют в обмене веществ, иммунитете и других важных процессах. Разнообразное питание обеспечивает необходимыми витаминами.',
    minerals: 'Минералы поддерживают здоровье костей, нервной системы и обмен веществ. Важны кальций, железо, магний, цинк и калий.'
  };

  const toggleNutrientInfo = (nutrient: string) => {
    setShowNutrientInfo(showNutrientInfo === nutrient ? null : nutrient);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const meals = [
    {
      id: 1,
      type: 'breakfast',
      name: 'Овсянка с ягодами',
      time: '08:30',
          calories: 320,
          protein: 12,
          carbs: 45,
          fat: 8,
    },
    {
      id: 2,
      type: 'lunch',
      name: 'Куриный салат',
      time: '13:15',
      calories: 420,
          protein: 35,
      carbs: 25,
      fat: 18,
    },
    {
      id: 3,
      type: 'snack',
      name: 'Яблоко и греческий йогурт',
      time: '16:00',
      calories: 180,
      protein: 10,
      carbs: 25,
      fat: 3,
    },
    {
      id: 4,
      type: 'dinner',
      name: 'Лосось с овощами',
      time: '19:30',
      calories: 530,
      protein: 35,
      carbs: 30,
      fat: 28,
    },
  ];

  const mealTypeLabels = {
    breakfast: 'Завтрак',
    lunch: 'Обед',
    snack: 'Перекус',
    dinner: 'Ужин'
  };

  const renderMealsTab = () => {
    return (
      <View style={styles.tabContent}>
        <NutritionSummary 
          consumed={nutritionData.consumed}
          target={nutritionData.target}
          theme={theme}
          onInfoPress={toggleNutrientInfo}
        />
        
        {showNutrientInfo && (
          <View style={[styles.infoCard, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.infoTitle, { color: theme.colors.text }]}>
              {showNutrientInfo.charAt(0).toUpperCase() + showNutrientInfo.slice(1)}
            </Text>
            <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
              {nutrientInfoTexts[showNutrientInfo as keyof typeof nutrientInfoTexts]}
            </Text>
          </View>
        )}

        <View style={styles.mealsContainer}>
          <View style={styles.mealsSectionHeader}>
            <Text style={[styles.mealsTitle, { color: theme.colors.text }]}>Приемы пищи</Text>
            <TouchableOpacity style={styles.addMealButton}>
              <PlusCircle size={22} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
          
          {meals.map((meal) => (
            <TouchableOpacity 
              key={meal.id}
              style={[styles.mealCard, { backgroundColor: theme.colors.card }]}
            >
              <View style={styles.mealHeader}>
                <Text style={[styles.mealType, { color: theme.colors.textSecondary }]}>
                  {mealTypeLabels[meal.type as keyof typeof mealTypeLabels]} • {meal.time}
                </Text>
                <Text style={[styles.mealCalories, { color: theme.colors.textSecondary }]}>
                  {meal.calories} ккал
                </Text>
              </View>
              
              <Text style={[styles.mealName, { color: theme.colors.text }]}>
                {meal.name}
              </Text>
              
              <View style={styles.macroContainer}>
                <View style={styles.macroItem}>
                  <Text style={[styles.macroValue, { color: theme.colors.secondary }]}>
                    {meal.protein}г
                  </Text>
                  <Text style={[styles.macroLabel, { color: theme.colors.textSecondary }]}>
                    Белки
                  </Text>
                </View>
                
                <View style={styles.macroItem}>
                  <Text style={[styles.macroValue, { color: theme.colors.tertiary }]}>
                    {meal.carbs}г
                  </Text>
                  <Text style={[styles.macroLabel, { color: theme.colors.textSecondary }]}>
                    Углеводы
                  </Text>
                </View>
                
                <View style={styles.macroItem}>
                  <Text style={[styles.macroValue, { color: theme.colors.accent }]}>
                    {meal.fat}г
                  </Text>
                  <Text style={[styles.macroLabel, { color: theme.colors.textSecondary }]}>
                    Жиры
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderAnalyticsTab = () => {
    return (
      <View style={styles.tabContent}>
        <View style={[styles.chartCard, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.chartTitle, { color: theme.colors.text }]}>
            Калории за неделю
          </Text>
          <LineChart
            data={weeklyCaloriesData}
            width={screenWidth - 48}
            height={180}
            chartConfig={{
              backgroundColor: theme.colors.card,
              backgroundGradientFrom: theme.colors.card,
              backgroundGradientTo: theme.colors.card,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(102, 212, 176, ${opacity})`,
              labelColor: (opacity = 1) => theme.colors.textSecondary,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '5',
                strokeWidth: '1',
                stroke: theme.colors.primaryDark,
              },
            }}
            bezier
            style={styles.chart}
          />
          
          <View style={styles.avgContainer}>
            <Text style={[styles.avgLabel, { color: theme.colors.textSecondary }]}>
              Среднее:
            </Text>
            <Text style={[styles.avgValue, { color: theme.colors.text }]}>
              {Math.round(nutritionTrends.calories.reduce((a, b) => a + b, 0) / nutritionTrends.calories.length)} ккал/день
            </Text>
          </View>
        </View>

        <View style={[styles.chartCard, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.chartTitle, { color: theme.colors.text }]}>
            БЖУ за неделю
          </Text>
          <LineChart
            data={weeklyNutrientsData}
            width={screenWidth - 48}
            height={200}
            chartConfig={{
              backgroundColor: theme.colors.card,
              backgroundGradientFrom: theme.colors.card,
              backgroundGradientTo: theme.colors.card,
              decimalPlaces: 0,
              color: (opacity = 1, index) => {
                const colors = [
                  `rgba(139, 92, 246, ${opacity})`, // Белки - фиолетовый
                  `rgba(249, 115, 22, ${opacity})`, // Углеводы - оранжевый
                  `rgba(14, 165, 233, ${opacity})`, // Жиры - синий
                ];
                return colors[index ?? 0];
              },
              labelColor: (opacity = 1) => theme.colors.textSecondary,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '4',
                strokeWidth: '1',
              },
            }}
            segments={5}
            fromZero
            withDots
            withShadow={false}
            withVerticalLines
            withHorizontalLines
            bezier
            withInnerLines
            withOuterLines
            style={styles.chart}
            renderDotContent={({ x, y, index, indexData }) => {
              // Отображаем значение только для последней точки каждой линии
              if (index === weeklyNutrientsData.labels.length - 1) {
                return (
                  <Text
                    key={index}
                    style={{
                      position: 'absolute',
                      top: y - 20,
                      left: x - 10,
                      color: theme.colors.textSecondary,
                      fontSize: 12,
                      fontFamily: 'Inter-Medium',
                    }}
                  >
                    {indexData}
                  </Text>
                );
              }
              return null;
            }}
            legend={weeklyNutrientsData.legend}
          />
        </View>

        <View style={[styles.insightsCard, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.insightsTitle, { color: theme.colors.text }]}>
            Тенденции и рекомендации
          </Text>
          
          <View style={styles.insightItem}>
            <View style={[styles.insightIcon, { backgroundColor: theme.colors.primaryLight }]}>
              <TrendingUp size={18} color={theme.colors.primary} />
            </View>
            <View style={styles.insightContent}>
              <Text style={[styles.insightText, { color: theme.colors.text }]}>
                Потребление белка стабильно выше рекомендуемой нормы в 85г
              </Text>
            </View>
          </View>
          
          <View style={styles.insightItem}>
            <View style={[styles.insightIcon, { backgroundColor: theme.colors.warningLight }]}>
              <AlertTriangle size={18} color={theme.colors.warning} />
            </View>
            <View style={styles.insightContent}>
              <Text style={[styles.insightText, { color: theme.colors.text }]}>
                Потребление клетчатки ниже рекомендуемой нормы (22г из 30г)
              </Text>
              <Text style={[styles.insightSubtext, { color: theme.colors.textSecondary }]}>
                Включите больше овощей, фруктов и цельнозерновых продуктов
              </Text>
            </View>
          </View>
          
          <View style={styles.insightItem}>
            <View style={[styles.insightIcon, { backgroundColor: theme.colors.successLight }]}>
              <Award size={18} color={theme.colors.success} />
            </View>
            <View style={styles.insightContent}>
              <Text style={[styles.insightText, { color: theme.colors.text }]}>
                Потребление витамина C на 120% превышает рекомендуемую норму
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderRecommendationsTab = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Генерируем рекомендации...
          </Text>
        </View>
      );
    }

    // Демо-рекомендации (в реальном приложении они должны приходить с сервера)
    const demoRecommendations = recommendations || {
      suggestions: [
        {
          type: 'macro_balance',
          title: 'Баланс макронутриентов',
          description: 'Увеличьте потребление белка для достижения целей по наращиванию мышечной массы',
          tips: [
            'Добавьте больше нежирного мяса, рыбы и растительных источников белка',
            'Используйте протеиновые коктейли как дополнение к основному рациону',
            'Распределите потребление белка равномерно в течение дня'
          ]
        },
        {
          type: 'nutrient_deficiency',
          title: 'Недостаток питательных веществ',
          description: 'Ваш рацион недостаточно богат клетчаткой и кальцием',
          tips: [
            'Увеличьте потребление овощей, фруктов и цельнозерновых продуктов',
            'Включите в рацион больше молочных продуктов или их растительных аналогов',
            'Рассмотрите возможность употребления орехов и семян как источников кальция'
          ]
        },
        {
          type: 'meal_timing',
          title: 'Режим питания',
          description: 'Слишком длинные промежутки между приемами пищи могут снижать метаболизм',
          tips: [
            'Старайтесь есть каждые 3-4 часа для поддержания стабильного уровня сахара в крови',
            'Добавьте небольшие здоровые перекусы между основными приемами пищи',
            'Не пропускайте завтрак — это важно для запуска метаболизма'
          ]
        }
      ],
      foodRecommendations: [
        { name: 'Лосось', reason: 'Богат белком и омега-3 жирными кислотами' },
        { name: 'Киноа', reason: 'Содержит белок и много клетчатки' },
        { name: 'Чечевица', reason: 'Источник растительного белка и железа' },
        { name: 'Брокколи', reason: 'Богата витамином C и клетчаткой' },
        { name: 'Миндаль', reason: 'Содержит кальций и полезные жиры' }
      ],
      mealIdeas: [
        { 
          type: 'breakfast', 
          name: 'Омлет с овощами и авокадо', 
          description: 'Богат белком, полезными жирами и витаминами' 
        },
        { 
          type: 'lunch', 
          name: 'Киноа с запеченными овощами и тофу', 
          description: 'Сбалансированный обед с растительным белком' 
        },
        { 
          type: 'dinner', 
          name: 'Запеченный лосось с брокколи и сладким картофелем', 
          description: 'Питательный ужин, богатый омега-3 и клетчаткой' 
        }
      ]
    };

    return (
      <View style={styles.tabContent}>
        {demoRecommendations.suggestions.map((suggestion, index) => (
          <View 
            key={index}
            style={[styles.recommendationCard, { backgroundColor: theme.colors.card }]}
          >
            <Text style={[styles.recommendationTitle, { color: theme.colors.text }]}>
              {suggestion.title}
            </Text>
            <Text style={[styles.recommendationDescription, { color: theme.colors.textSecondary }]}>
              {suggestion.description}
            </Text>
            
            <View style={styles.tipsContainer}>
              {suggestion.tips.map((tip, tipIndex) => (
                <View key={tipIndex} style={styles.tipItem}>
                  <Text style={[styles.tipNumber, { color: theme.colors.primary }]}>
                    {tipIndex + 1}.
                  </Text>
                  <Text style={[styles.tipText, { color: theme.colors.text }]}>
                    {tip}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ))}
        
        <View style={[styles.recommendationCard, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.recommendationTitle, { color: theme.colors.text }]}>
            Рекомендуемые продукты
          </Text>
          
          <View style={styles.foodRecommendations}>
            {demoRecommendations.foodRecommendations.map((food, index) => (
              <View key={index} style={styles.foodRecommendation}>
                <Text style={[styles.foodName, { color: theme.colors.text }]}>
                  {food.name}
                </Text>
                <Text style={[styles.foodReason, { color: theme.colors.textSecondary }]}>
                  {food.reason}
                </Text>
              </View>
            ))}
          </View>
        </View>
        
        <View style={[styles.recommendationCard, { backgroundColor: theme.colors.card }]}>
          <View style={styles.recommendationHeader}>
            <Text style={[styles.recommendationTitle, { color: theme.colors.text }]}>
              Идеи для меню
            </Text>
            <TouchableOpacity style={styles.seeAllButton}>
              <Text style={[styles.seeAllText, { color: theme.colors.primary }]}>
                Все идеи
              </Text>
              <ChevronRight size={16} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.mealIdeas}>
            {demoRecommendations.mealIdeas.map((meal, index) => (
              <TouchableOpacity 
                key={index} 
                style={[styles.mealIdeaCard, { backgroundColor: theme.colors.backgroundSecondary }]}
              >
                <Text style={[styles.mealIdeaType, { color: theme.colors.primary }]}>
                  {mealTypeLabels[meal.type as keyof typeof mealTypeLabels]}
                </Text>
                <Text style={[styles.mealIdeaName, { color: theme.colors.text }]}>
                  {meal.name}
                </Text>
                <Text style={[styles.mealIdeaDescription, { color: theme.colors.textSecondary }]}>
                  {meal.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      
      <View style={styles.header}>
        <View style={styles.dateSelector}>
          <TouchableOpacity onPress={() => changeDate(-1)}>
            <Text style={[styles.dateArrow, { color: theme.colors.text }]}>←</Text>
          </TouchableOpacity>
          
          <View style={styles.dateContainer}>
            <Text style={[styles.date, { color: theme.colors.text }]}>
              {formatDate(selectedDate)}
            </Text>
            <View style={styles.dateIconContainer}>
              <Calendar size={16} color={theme.colors.textSecondary} />
            </View>
          </View>
          
          <TouchableOpacity onPress={() => changeDate(1)}>
            <Text style={[styles.dateArrow, { color: theme.colors.text }]}>→</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[
            styles.tabButton, 
            activeTab === 'meals' && styles.activeTabButton,
            activeTab === 'meals' && { borderBottomColor: theme.colors.primary }
          ]}
          onPress={() => setActiveTab('meals')}
        >
          <Text style={[
            styles.tabButtonText, 
            { color: activeTab === 'meals' ? theme.colors.primary : theme.colors.textSecondary }
          ]}>
            Приемы пищи
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.tabButton, 
            activeTab === 'analytics' && styles.activeTabButton,
            activeTab === 'analytics' && { borderBottomColor: theme.colors.primary }
          ]}
          onPress={() => setActiveTab('analytics')}
        >
          <Text style={[
            styles.tabButtonText, 
            { color: activeTab === 'analytics' ? theme.colors.primary : theme.colors.textSecondary }
          ]}>
            Аналитика
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.tabButton, 
            activeTab === 'recommendations' && styles.activeTabButton,
            activeTab === 'recommendations' && { borderBottomColor: theme.colors.primary }
          ]}
          onPress={() => setActiveTab('recommendations')}
        >
          <Text style={[
            styles.tabButtonText, 
            { color: activeTab === 'recommendations' ? theme.colors.primary : theme.colors.textSecondary }
          ]}>
            Рекомендации
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {activeTab === 'meals' && renderMealsTab()}
        {activeTab === 'analytics' && renderAnalyticsTab()}
        {activeTab === 'recommendations' && renderRecommendationsTab()}
      </ScrollView>
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
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    fontFamily: 'Nunito-Bold',
    fontSize: 18,
    marginRight: 8,
  },
  dateIconContainer: {
    justifyContent: 'center',
  },
  dateArrow: {
    fontSize: 24,
    paddingHorizontal: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  tabButton: {
    paddingVertical: 12,
    marginRight: 24,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomWidth: 2,
  },
  tabButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  tabContent: {
    padding: 24,
  },
  mealsContainer: {
    marginTop: 24,
  },
  mealsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  mealsTitle: {
    fontFamily: 'Nunito-Bold',
    fontSize: 18,
  },
  addMealButton: {
    padding: 4,
  },
  mealCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  mealType: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  mealCalories: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  mealName: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 16,
    marginBottom: 12,
  },
  macroContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroItem: {
    alignItems: 'center',
  },
  macroValue: {
    fontFamily: 'Nunito-Bold',
    fontSize: 16,
  },
  macroLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    marginTop: 4,
  },
  chartCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartTitle: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 16,
    marginBottom: 8,
  },
  avgContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  avgLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginRight: 4,
  },
  avgValue: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  insightsCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  insightsTitle: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 16,
    marginBottom: 16,
  },
  insightItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  insightIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  insightContent: {
    flex: 1,
  },
  insightText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    marginBottom: 4,
  },
  insightSubtext: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    marginTop: 16,
  },
  recommendationCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  recommendationTitle: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 16,
    marginBottom: 8,
  },
  recommendationDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginBottom: 16,
  },
  tipsContainer: {
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
  },
  tipNumber: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    marginRight: 8,
    width: 20,
  },
  tipText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    flex: 1,
  },
  foodRecommendations: {
    gap: 12,
  },
  foodRecommendation: {
    marginBottom: 8,
  },
  foodName: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    marginBottom: 2,
  },
  foodReason: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    marginRight: 4,
  },
  mealIdeas: {
    gap: 12,
  },
  mealIdeaCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  mealIdeaType: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    marginBottom: 4,
  },
  mealIdeaName: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 16,
    marginBottom: 4,
  },
  mealIdeaDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  infoTitle: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 16,
    marginBottom: 8,
  },
  infoText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  progressContainer: {
    width: '100%',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 4,
  },
});
