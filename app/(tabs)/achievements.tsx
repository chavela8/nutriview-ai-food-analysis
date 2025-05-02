import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Award, Trophy, Star, Target, Calendar, Clock, Zap, Heart, Utensils, Shield, Flame, ChevronDown, ChevronUp, Lock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

// Types for achievements
interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  progress: number;
  total: number;
  completed: boolean;
  lockedUntil?: string;
  dateCompleted?: string;
  points: number;
  category: 'nutrition' | 'activity' | 'consistency' | 'special';
}

// Component for award badges
const AchievementBadge = ({ achievement, theme }) => {
  const isCompleted = achievement.completed;
  const isLocked = achievement.lockedUntil && !achievement.completed;
  const progressPercentage = (achievement.progress / achievement.total) * 100;

  return (
    <TouchableOpacity 
      style={[
        styles.achievementCard, 
        { 
          backgroundColor: theme.colors.card,
          opacity: isLocked ? 0.7 : 1 
        }
      ]}
      onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
      activeOpacity={0.7}
    >
      <View style={[
        styles.iconContainer, 
        { 
          backgroundColor: isCompleted 
            ? theme.colors.successLight
            : isLocked 
              ? theme.colors.disabledLight 
              : theme.colors.primaryLight 
        }
      ]}>
        {isLocked ? <Lock size={24} color={theme.colors.disabled} /> : achievement.icon}
        {isCompleted && (
          <View style={styles.completedBadge}>
            <Check size={10} color="#FFFFFF" />
          </View>
        )}
      </View>
      
      <View style={styles.achievementDetails}>
        <View style={styles.achievementHeader}>
          <Text style={[styles.achievementTitle, { color: theme.colors.text }]}>
            {achievement.title}
          </Text>
          <Text style={[styles.achievementPoints, { color: theme.colors.primary }]}>
            {achievement.points} баллов
          </Text>
        </View>
        
        <Text style={[styles.achievementDescription, { color: theme.colors.textSecondary }]}>
          {isLocked 
            ? `Разблокируется: ${achievement.lockedUntil}`
            : achievement.description
          }
        </Text>
        
        {!isLocked && !isCompleted && (
          <View style={styles.progressContainer}>
            <View 
              style={[
                styles.progressBackground, 
                { backgroundColor: theme.colors.border }
              ]}
            >
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${progressPercentage}%`, 
                    backgroundColor: theme.colors.primary
                  }
                ]} 
              />
            </View>
            <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
              {achievement.progress}/{achievement.total}
            </Text>
          </View>
        )}
        
        {isCompleted && achievement.dateCompleted && (
          <Text style={[styles.completedDate, { color: theme.colors.success }]}>
            Выполнено: {achievement.dateCompleted}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

// Component for displaying user level and progress
const UserLevel = ({ level, experience, nextLevelExperience, theme }) => {
  const progressPercentage = (experience / nextLevelExperience) * 100;
  
  return (
    <View style={[styles.userLevelCard, { backgroundColor: theme.colors.card }]}>
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.levelBadge}
      >
        <Text style={styles.levelNumber}>{level}</Text>
      </LinearGradient>
      
      <View style={styles.levelInfo}>
        <Text style={[styles.levelTitle, { color: theme.colors.text }]}>
          Уровень {level}
        </Text>
        
        <View style={styles.levelProgressContainer}>
          <View 
            style={[
              styles.levelProgressBackground, 
              { backgroundColor: theme.colors.border }
            ]}
          >
            <View 
              style={[
                styles.levelProgressFill, 
                { 
                  width: `${progressPercentage}%`, 
                  backgroundColor: theme.colors.primary
                }
              ]} 
            />
          </View>
          <Text style={[styles.levelProgressText, { color: theme.colors.textSecondary }]}>
            {experience}/{nextLevelExperience} XP
          </Text>
        </View>
      </View>
    </View>
  );
};

// Main achievement screen component
export default function AchievementsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userStats, setUserStats] = useState({
    level: 5,
    experience: 750,
    nextLevelExperience: 1000,
    totalPoints: 1250,
    completedAchievements: 8
  });
  const [expandedCategories, setExpandedCategories] = useState({
    nutrition: true,
    activity: true,
    consistency: true,
    special: true
  });
  
  useEffect(() => {
    // Simulate loading achievements
    const loadAchievements = async () => {
      // In a real app, fetch achievements from API
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Demo achievement data
      const demoAchievements: Achievement[] = [
        {
          id: '1',
          title: 'Первые шаги',
          description: 'Запишите свой первый приём пищи',
          icon: <Utensils size={24} color={theme.colors.primary} />,
          progress: 1,
          total: 1,
          completed: true,
          dateCompleted: '12 мая 2023',
          points: 50,
          category: 'nutrition'
        },
        {
          id: '2',
          title: 'На пути к успеху',
          description: 'Запишите 10 приёмов пищи',
          icon: <Utensils size={24} color={theme.colors.primary} />,
          progress: 8,
          total: 10,
          completed: false,
          points: 100,
          category: 'nutrition'
        },
        {
          id: '3',
          title: 'Гидратация',
          description: 'Достигните дневной цели по воде 5 дней подряд',
          icon: <Heart size={24} color={theme.colors.primary} />,
          progress: 3,
          total: 5,
          completed: false,
          points: 150,
          category: 'nutrition'
        },
        {
          id: '4',
          title: 'Недельная серия',
          description: 'Используйте приложение 7 дней подряд',
          icon: <Calendar size={24} color={theme.colors.success} />,
          progress: 7,
          total: 7,
          completed: true,
          dateCompleted: '10 мая 2023',
          points: 200,
          category: 'consistency'
        },
        {
          id: '5',
          title: 'Белковый король',
          description: 'Достигните своей дневной цели по белку 10 дней',
          icon: <Target size={24} color={theme.colors.accent} />,
          progress: 6,
          total: 10,
          completed: false,
          points: 200,
          category: 'nutrition'
        },
        {
          id: '6',
          title: 'Фитнес-энтузиаст',
          description: 'Запишите 5 тренировок за неделю',
          icon: <Zap size={24} color={theme.colors.tertiary} />,
          progress: 2,
          total: 5,
          completed: false,
          points: 250,
          category: 'activity'
        },
        {
          id: '7',
          title: 'Месячная серия',
          description: 'Используйте приложение 30 дней подряд',
          icon: <Star size={24} color={theme.colors.warning} />,
          progress: 12,
          total: 30,
          completed: false,
          points: 500,
          category: 'consistency'
        },
        {
          id: '8',
          title: 'Эксперт по питанию',
          description: 'Завершите 3 неделю питания по плану',
          icon: <Award size={24} color={theme.colors.primary} />,
          progress: 0,
          total: 3,
          completed: false,
          lockedUntil: 'Завершите 10 приёмов пищи',
          points: 300,
          category: 'special'
        },
        {
          id: '9',
          title: 'Марафонец',
          description: 'Пройдите 100 000 шагов за неделю',
          icon: <Flame size={24} color={theme.colors.error} />,
          progress: 65000,
          total: 100000,
          completed: false,
          points: 400,
          category: 'activity'
        },
        {
          id: '10',
          title: 'Повелитель воды',
          description: 'Пейте рекомендуемое количество воды 14 дней подряд',
          icon: <Heart size={24} color={theme.colors.info} />,
          progress: 14,
          total: 14,
          completed: true,
          dateCompleted: '2 мая 2023',
          points: 300,
          category: 'nutrition'
        },
        {
          id: '11',
          title: 'Сбалансированное питание',
          description: 'Достигните целей по всем макронутриентам 7 дней подряд',
          icon: <Shield size={24} color={theme.colors.success} />,
          progress: 3,
          total: 7,
          completed: false,
          points: 350,
          category: 'nutrition'
        },
        {
          id: '12',
          title: 'Вечный стремящийся',
          description: 'Достигните 100-дневной серии использования приложения',
          icon: <Trophy size={24} color={theme.colors.warning} />,
          progress: 18,
          total: 100,
          completed: false,
          points: 1000,
          category: 'consistency'
        }
      ];
      
      setAchievements(demoAchievements);
      setLoading(false);
    };
    
    loadAchievements();
  }, [theme.colors]);
  
  const toggleCategory = (category) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedCategories({
      ...expandedCategories,
      [category]: !expandedCategories[category]
    });
  };
  
  // Filter achievements by category
  const getAchievementsByCategory = (category) => {
    return achievements.filter(achievement => achievement.category === category);
  };
  
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar style={theme.dark ? 'light' : 'dark'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Загрузка достижений...
          </Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Достижения</Text>
        </View>
        
        {/* User Level */}
        <UserLevel 
          level={userStats.level} 
          experience={userStats.experience} 
          nextLevelExperience={userStats.nextLevelExperience} 
          theme={theme} 
        />
        
        {/* Statistics */}
        <View style={[styles.statsCard, { backgroundColor: theme.colors.card }]}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {userStats.totalPoints}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Баллы
              </Text>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {userStats.completedAchievements}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Выполнено
              </Text>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {achievements.length - userStats.completedAchievements}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Осталось
              </Text>
            </View>
          </View>
        </View>
        
        {/* Nutrition Category */}
        <View style={styles.categorySection}>
          <TouchableOpacity 
            style={styles.categoryHeader}
            onPress={() => toggleCategory('nutrition')}
          >
            <View style={styles.categoryTitleContainer}>
              <Utensils size={18} color={theme.colors.primary} style={styles.categoryIcon} />
              <Text style={[styles.categoryTitle, { color: theme.colors.text }]}>
                Питание
              </Text>
            </View>
            {expandedCategories.nutrition ? 
              <ChevronUp size={20} color={theme.colors.textSecondary} /> : 
              <ChevronDown size={20} color={theme.colors.textSecondary} />
            }
          </TouchableOpacity>
          
          {expandedCategories.nutrition && (
            <View style={styles.achievementsList}>
              {getAchievementsByCategory('nutrition').map(achievement => (
                <AchievementBadge 
                  key={achievement.id} 
                  achievement={achievement} 
                  theme={theme} 
                />
              ))}
            </View>
          )}
        </View>
        
        {/* Activity Category */}
        <View style={styles.categorySection}>
          <TouchableOpacity 
            style={styles.categoryHeader}
            onPress={() => toggleCategory('activity')}
          >
            <View style={styles.categoryTitleContainer}>
              <Zap size={18} color={theme.colors.tertiary} style={styles.categoryIcon} />
              <Text style={[styles.categoryTitle, { color: theme.colors.text }]}>
                Активность
              </Text>
            </View>
            {expandedCategories.activity ? 
              <ChevronUp size={20} color={theme.colors.textSecondary} /> : 
              <ChevronDown size={20} color={theme.colors.textSecondary} />
            }
          </TouchableOpacity>
          
          {expandedCategories.activity && (
            <View style={styles.achievementsList}>
              {getAchievementsByCategory('activity').map(achievement => (
                <AchievementBadge 
                  key={achievement.id} 
                  achievement={achievement} 
                  theme={theme} 
                />
              ))}
            </View>
          )}
        </View>
        
        {/* Consistency Category */}
        <View style={styles.categorySection}>
          <TouchableOpacity 
            style={styles.categoryHeader}
            onPress={() => toggleCategory('consistency')}
          >
            <View style={styles.categoryTitleContainer}>
              <Calendar size={18} color={theme.colors.success} style={styles.categoryIcon} />
              <Text style={[styles.categoryTitle, { color: theme.colors.text }]}>
                Последовательность
              </Text>
            </View>
            {expandedCategories.consistency ? 
              <ChevronUp size={20} color={theme.colors.textSecondary} /> : 
              <ChevronDown size={20} color={theme.colors.textSecondary} />
            }
          </TouchableOpacity>
          
          {expandedCategories.consistency && (
            <View style={styles.achievementsList}>
              {getAchievementsByCategory('consistency').map(achievement => (
                <AchievementBadge 
                  key={achievement.id} 
                  achievement={achievement} 
                  theme={theme} 
                />
              ))}
            </View>
          )}
        </View>
        
        {/* Special Category */}
        <View style={[styles.categorySection, { marginBottom: 40 }]}>
          <TouchableOpacity 
            style={styles.categoryHeader}
            onPress={() => toggleCategory('special')}
          >
            <View style={styles.categoryTitleContainer}>
              <Star size={18} color={theme.colors.warning} style={styles.categoryIcon} />
              <Text style={[styles.categoryTitle, { color: theme.colors.text }]}>
                Особые
              </Text>
            </View>
            {expandedCategories.special ? 
              <ChevronUp size={20} color={theme.colors.textSecondary} /> : 
              <ChevronDown size={20} color={theme.colors.textSecondary} />
            }
          </TouchableOpacity>
          
          {expandedCategories.special && (
            <View style={styles.achievementsList}>
              {getAchievementsByCategory('special').map(achievement => (
                <AchievementBadge 
                  key={achievement.id} 
                  achievement={achievement} 
                  theme={theme} 
                />
              ))}
            </View>
          )}
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
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  title: {
    fontFamily: 'Nunito-Bold',
    fontSize: 28,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    marginTop: 16,
  },
  userLevelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 24,
    borderRadius: 16,
    marginBottom: 16,
  },
  levelBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  levelNumber: {
    fontFamily: 'Nunito-Bold',
    fontSize: 20,
    color: '#FFFFFF',
  },
  levelInfo: {
    flex: 1,
  },
  levelTitle: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 18,
    marginBottom: 8,
  },
  levelProgressContainer: {
    marginTop: 4,
  },
  levelProgressBackground: {
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  levelProgressFill: {
    height: 8,
    borderRadius: 4,
  },
  levelProgressText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
  },
  statsCard: {
    marginHorizontal: 24,
    borderRadius: 16,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontFamily: 'Nunito-Bold',
    fontSize: 24,
  },
  statLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  categorySection: {
    marginHorizontal: 24,
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    marginRight: 8,
  },
  categoryTitle: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 18,
  },
  achievementsList: {
    gap: 12,
  },
  achievementCard: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    position: 'relative',
  },
  completedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#4CAF50',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementDetails: {
    flex: 1,
  },
  achievementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  achievementTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    flex: 1,
  },
  achievementPoints: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  achievementDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginBottom: 8,
  },
  progressContainer: {
    marginTop: 4,
  },
  progressBackground: {
    height: 6,
    borderRadius: 3,
    marginBottom: 4,
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  progressText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
  },
  completedDate: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    marginTop: 4,
  },
});

// Fix for missing Check icon (needs to be imported)
import { Check } from 'lucide-react-native'; 