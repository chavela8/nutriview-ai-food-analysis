import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Image, Modal } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { User, Settings, Moon, Bell, Languages, LogOut, Heart, Lock, ArrowRight, CircleHelp as HelpCircle, AlertTriangle, Activity, Weight, Wheat, Baby, Scale, Brain, CalendarDays, MessageSquare, Droplets, MoonStar, Sparkles, ChevronRight, Refrigerator, Share2 } from 'lucide-react-native';
import { LanguageSelector } from '@/components/LanguageSelector';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Stack } from 'expo-router';

export default function ProfileScreen() {
  const { theme, toggleTheme } = useTheme();
  const [showLanguages, setShowLanguages] = useState(false);
  const [showDietModal, setShowDietModal] = useState(false);
  const [showAllergensModal, setShowAllergensModal] = useState(false);
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [darkMode, setDarkMode] = useState(theme.dark);
  const [notifications, setNotifications] = useState(true);
  
  // Персональные данные пользователя
  const [userData, setUserData] = useState({
    name: 'Александр',
    email: 'alex@example.com',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    streak: 12,
    premium: false
  });

  const dietModes = [
    { id: 'standard', name: 'Стандартный', description: 'Сбалансированный рацион для поддержания здоровья' },
    { id: 'athlete', name: 'Спортивный', description: 'Повышенное потребление белка и углеводов для спортсменов' },
    { id: 'diabetic', name: 'Диабетический', description: 'Контроль углеводов для стабильного уровня сахара в крови' },
    { id: 'vegan', name: 'Веганский', description: 'Полностью растительный рацион без продуктов животного происхождения' },
    { id: 'keto', name: 'Кетогенный', description: 'Минимум углеводов, много жиров для кетоза' },
    { id: 'paleo', name: 'Палео', description: 'Питание, основанное на продуктах, доступных в эпоху палеолита' },
    { id: 'gluten_free', name: 'Без глютена', description: 'Исключение продуктов, содержащих глютен' },
    { id: 'pregnancy', name: 'Для беременных', description: 'Питание для поддержки здоровья матери и ребенка' },
    { id: 'child', name: 'Детский', description: 'Сбалансированное питание для растущего организма' },
    { id: 'elderly', name: 'Для пожилых', description: 'Питание с учетом возрастных особенностей' }
  ];

  const allergensList = [
    { id: 'nuts', name: 'Орехи' },
    { id: 'peanuts', name: 'Арахис' },
    { id: 'dairy', name: 'Молочные продукты' },
    { id: 'eggs', name: 'Яйца' },
    { id: 'wheat', name: 'Пшеница' },
    { id: 'soy', name: 'Соя' },
    { id: 'fish', name: 'Рыба' },
    { id: 'shellfish', name: 'Моллюски и ракообразные' },
    { id: 'sesame', name: 'Кунжут' },
    { id: 'gluten', name: 'Глютен' }
  ];

  const healthConditions = [
    { id: 'pregnancy', name: 'Беременность', icon: Baby },
    { id: 'diabetes', name: 'Диабет', icon: Activity },
    { id: 'hypertension', name: 'Гипертония', icon: Activity },
    { id: 'heart_disease', name: 'Сердечно-сосудистые заболевания', icon: Heart },
    { id: 'celiac', name: 'Целиакия', icon: Wheat }
  ];

  // Обновить тему при изменении переключателя
  useEffect(() => {
    if (darkMode !== theme.dark) {
      toggleTheme();
    }
  }, [darkMode]);

  // Функция переключения диетического режима
  const toggleDietMode = (dietId) => {
    setUserData(prev => ({
      ...prev,
      dietMode: dietId
    }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  // Функция переключения аллергена
  const toggleAllergen = (allergenId) => {
    setUserData(prev => {
      const updatedAllergens = prev.allergens.includes(allergenId)
        ? prev.allergens.filter(id => id !== allergenId)
        : [...prev.allergens, allergenId];
      
      return {
        ...prev,
        allergens: updatedAllergens
      };
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Функция переключения состояния здоровья
  const toggleHealthCondition = (conditionId) => {
    setUserData(prev => {
      const updatedConditions = prev.healthConditions.includes(conditionId)
        ? prev.healthConditions.filter(id => id !== conditionId)
        : [...prev.healthConditions, conditionId];
      
      return {
        ...prev,
        healthConditions: updatedConditions
      };
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  
  // Toggle between showing profile and language selector
  const toggleLanguages = () => {
    setShowLanguages(!showLanguages);
  };

  // Получение названия текущего режима питания
  const getCurrentDietName = () => {
    const diet = dietModes.find(d => d.id === userData.dietMode);
    return diet ? diet.name : 'Стандартный';
  };

  // Получение списка аллергенов в текстовом формате
  const getAllergensText = () => {
    if (userData.allergens.length === 0) return 'Не указаны';
    
    const allergensNames = userData.allergens.map(id => {
      const allergen = allergensList.find(a => a.id === id);
      return allergen ? allergen.name : '';
    }).filter(Boolean);
    
    return allergensNames.length > 2 
      ? `${allergensNames.slice(0, 2).join(', ')} и ещё ${allergensNames.length - 2}`
      : allergensNames.join(', ');
  };

  // Модальное окно выбора режима питания
  const renderDietModal = () => (
    <Modal
      visible={showDietModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowDietModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              Режим питания
            </Text>
            <TouchableOpacity onPress={() => setShowDietModal(false)}>
              <Text style={[styles.modalClose, { color: theme.colors.primary }]}>
                Закрыть
              </Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalScroll}>
            {dietModes.map((diet) => (
              <TouchableOpacity 
                key={diet.id}
                style={[
                  styles.dietOption,
                  userData.dietMode === diet.id && styles.selectedOption,
                  userData.dietMode === diet.id && { borderColor: theme.colors.primary }
                ]}
                onPress={() => toggleDietMode(diet.id)}
              >
                <View style={styles.dietOptionContent}>
                  <Text style={[styles.dietName, { color: theme.colors.text }]}>
                    {diet.name}
                  </Text>
                  <Text style={[styles.dietDescription, { color: theme.colors.textSecondary }]}>
                    {diet.description}
                  </Text>
                </View>
                
                {userData.dietMode === diet.id && (
                  <View style={[styles.checkIndicator, { backgroundColor: theme.colors.primary }]}>
                    <Text style={styles.checkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // Модальное окно выбора аллергенов
  const renderAllergensModal = () => (
    <Modal
      visible={showAllergensModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowAllergensModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              Аллергены
            </Text>
            <TouchableOpacity onPress={() => setShowAllergensModal(false)}>
              <Text style={[styles.modalClose, { color: theme.colors.primary }]}>
                Закрыть
              </Text>
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.modalSubtitle, { color: theme.colors.textSecondary }]}>
            Отметьте продукты, на которые у вас есть аллергия
          </Text>
          
          <ScrollView style={styles.modalScroll}>
            {allergensList.map((allergen) => (
              <TouchableOpacity 
                key={allergen.id}
                style={[
                  styles.allergenOption,
                  userData.allergens.includes(allergen.id) && styles.selectedOption,
                  userData.allergens.includes(allergen.id) && { borderColor: theme.colors.warning }
                ]}
                onPress={() => toggleAllergen(allergen.id)}
              >
                <View style={styles.allergenOptionContent}>
                  <View style={styles.allergenIconContainer}>
                    <AlertTriangle 
                      size={16} 
                      color={userData.allergens.includes(allergen.id) ? theme.colors.warning : theme.colors.textTertiary} 
                    />
                  </View>
                  <Text style={[styles.allergenName, { color: theme.colors.text }]}>
                    {allergen.name}
                  </Text>
                </View>
                
                {userData.allergens.includes(allergen.id) && (
                  <View style={[styles.checkIndicator, { backgroundColor: theme.colors.warning }]}>
                    <Text style={styles.checkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // Модальное окно выбора состояний здоровья
  const renderHealthModal = () => (
    <Modal
      visible={showHealthModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowHealthModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              Состояние здоровья
            </Text>
            <TouchableOpacity onPress={() => setShowHealthModal(false)}>
              <Text style={[styles.modalClose, { color: theme.colors.primary }]}>
                Закрыть
              </Text>
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.modalSubtitle, { color: theme.colors.textSecondary }]}>
            Выберите состояния, которые влияют на ваш рацион
          </Text>
          
          <ScrollView style={styles.modalScroll}>
            {healthConditions.map((condition) => {
              const IconComponent = condition.icon;
  return (
                <TouchableOpacity 
                  key={condition.id}
                  style={[
                    styles.healthOption,
                    userData.healthConditions.includes(condition.id) && styles.selectedOption,
                    userData.healthConditions.includes(condition.id) && { borderColor: theme.colors.secondary }
                  ]}
                  onPress={() => toggleHealthCondition(condition.id)}
                >
                  <View style={styles.healthOptionContent}>
                    <View style={[
                      styles.healthIconContainer, 
                      { 
                        backgroundColor: userData.healthConditions.includes(condition.id) 
                          ? theme.colors.secondaryLight 
                          : theme.colors.backgroundSecondary 
                      }
                    ]}>
                      <IconComponent 
                        size={18} 
                        color={userData.healthConditions.includes(condition.id) 
                          ? theme.colors.secondary 
                          : theme.colors.textTertiary} 
                      />
                    </View>
                    <Text style={[styles.healthName, { color: theme.colors.text }]}>
                      {condition.name}
                    </Text>
                  </View>
                  
                  {userData.healthConditions.includes(condition.id) && (
                    <View style={[styles.checkIndicator, { backgroundColor: theme.colors.secondary }]}>
                      <Text style={styles.checkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // Открыть страницу премиум
  const openPremium = () => {
    router.push('/premium');
  };

  // Открыть страницу AI-нутрициолога
  const openAINutritionist = () => {
    router.push('/ai-nutritionist');
  };

  // Открыть трекер воды
  const openWaterTracker = () => {
    router.push('/water-tracker');
  };

  // Открыть страницу с диетическими предпочтениями
  const openDietaryPreferences = () => {
    router.push('/dietary-preferences');
  };

  // Открыть настройки умных весов
  const openSmartScaleSettings = () => {
    router.push('/smart-scale-settings');
  };

  // Открыть инвентаризацию холодильника
  const openFridgeInventory = () => {
    router.push('/fridge-inventory');
  };

  // Открыть настройки уведомлений
  const openNotificationSettings = () => {
    // В будущей реализации
    alert('Настройки уведомлений будут доступны скоро');
  };

  // Открыть настройки профиля
  const openProfileSettings = () => {
    // В будущей реализации
    alert('Настройки профиля будут доступны скоро');
  };

  // Поделиться приложением
  const shareApp = () => {
    // В будущей реализации
    alert('Функция "Поделиться приложением" будет доступна скоро');
  };

  // Выйти из аккаунта
  const logout = () => {
    // В будущей реализации
    alert('Функция выхода из аккаунта будет доступна скоро');
  };

  // Render profile screen
  const renderProfile = () => (
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      {/* User Info Section */}
      <View style={[styles.userInfoContainer, { backgroundColor: theme.colors.card }]}>
        <View style={styles.userImageContainer}>
          <Image
            source={{ uri: userData.avatar }}
            style={styles.userImage}
          />
        </View>
        
        <View style={styles.userTextInfo}>
          <Text style={[styles.userName, { color: theme.colors.text }]}>
            {userData.name}
          </Text>
          <Text style={[styles.userEmail, { color: theme.colors.textSecondary }]}>
            {userData.email}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={[
            styles.premiumBadge, 
            { 
              backgroundColor: userData.premium 
                ? theme.colors.primary + '20' 
                : theme.colors.card 
            }
          ]}
          onPress={openPremium}
        >
          <Sparkles 
            size={16} 
            color={userData.premium ? theme.colors.primary : theme.colors.textSecondary} 
            style={styles.premiumIcon} 
          />
          <Text 
            style={[
              styles.premiumText, 
              { 
                color: userData.premium 
                  ? theme.colors.primary 
                  : theme.colors.textSecondary 
              }
            ]}
          >
            {userData.premium ? 'Premium' : 'Получить Premium'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Features Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Полезные функции
        </Text>
        
        <View style={[styles.menuContainer, { backgroundColor: theme.colors.card }]}>
          <TouchableOpacity style={styles.menuItem} onPress={openAINutritionist}>
            <View style={styles.menuItemLeft}>
              <View 
                style={[
                  styles.menuItemIcon, 
                  { backgroundColor: theme.colors.primary + '10' }
                ]}
              >
                <MessageSquare size={20} color={theme.colors.primary} />
              </View>
              <Text style={[styles.menuItemText, { color: theme.colors.text }]}>
                AI-нутрициолог
              </Text>
            </View>
            <ChevronRight size={18} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem} onPress={openWaterTracker}>
            <View style={styles.menuItemLeft}>
              <View 
                style={[
                  styles.menuItemIcon, 
                  { backgroundColor: '#1E88E5' + '10' }
                ]}
              >
                <Droplets size={20} color='#1E88E5' />
              </View>
              <Text style={[styles.menuItemText, { color: theme.colors.text }]}>
                Трекер воды
              </Text>
            </View>
            <ChevronRight size={18} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem} onPress={openDietaryPreferences}>
            <View style={styles.menuItemLeft}>
              <View 
                style={[
                  styles.menuItemIcon, 
                  { backgroundColor: '#E53935' + '10' }
                ]}
              >
                <Heart size={20} color='#E53935' />
              </View>
              <Text style={[styles.menuItemText, { color: theme.colors.text }]}>
                Диетические предпочтения
              </Text>
            </View>
            <ChevronRight size={18} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem} onPress={openSmartScaleSettings}>
            <View style={styles.menuItemLeft}>
              <View 
                style={[
                  styles.menuItemIcon, 
                  { backgroundColor: '#43A047' + '10' }
                ]}
              >
                <Scale size={20} color='#43A047' />
              </View>
              <Text style={[styles.menuItemText, { color: theme.colors.text }]}>
                Умные весы
              </Text>
            </View>
            <ChevronRight size={18} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem} onPress={openFridgeInventory}>
            <View style={styles.menuItemLeft}>
              <View 
                style={[
                  styles.menuItemIcon, 
                  { backgroundColor: '#7E57C2' + '10' }
                ]}
              >
                <Refrigerator size={20} color='#7E57C2' />
              </View>
              <Text style={[styles.menuItemText, { color: theme.colors.text }]}>
                Инвентаризация холодильника
              </Text>
            </View>
            <ChevronRight size={18} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Health & Diet Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Здоровье и питание
        </Text>
        
        <View style={[styles.menuContainer, { backgroundColor: theme.colors.card }]}>
          {/* Режим питания */}
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowDietModal(true);
            }}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconContainer, { backgroundColor: `${theme.colors.primary}20` }]}>
                <Heart size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={[styles.menuItemText, { color: theme.colors.text }]}>
                  Режим питания
                </Text>
                <Text style={[styles.menuItemSubtext, { color: theme.colors.textSecondary }]}>
                  {getCurrentDietName()}
                </Text>
              </View>
            </View>
            <ArrowRight size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          
          {/* Аллергены */}
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowAllergensModal(true);
            }}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconContainer, { backgroundColor: `${theme.colors.primary}20` }]}>
                <AlertTriangle size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={[styles.menuItemText, { color: theme.colors.text }]}>
                  Аллергены
                </Text>
                <Text style={[styles.menuItemSubtext, { color: theme.colors.textSecondary }]}>
                  {getAllergensText()}
                </Text>
              </View>
            </View>
            <ArrowRight size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          
          {/* Состояние здоровья */}
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowHealthModal(true);
            }}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconContainer, { backgroundColor: `${theme.colors.primary}20` }]}>
                <Activity size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={[styles.menuItemText, { color: theme.colors.text }]}>
                  Состояние здоровья
                </Text>
                <Text style={[styles.menuItemSubtext, { color: theme.colors.textSecondary }]}>
                  {userData.healthConditions.length > 0 
                    ? userData.healthConditions.length + ' указано' 
                    : 'Не указано'}
                </Text>
              </View>
            </View>
            <ArrowRight size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Rest of the sections... */}

      {showLanguages ? (
        <LanguageSelector onClose={toggleLanguages} theme={theme} />
      ) : (
        <>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Профиль</Text>
          </View>

          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.contentContainer}
          >
            {renderProfile()}
            
            <View style={styles.statsContainer}>
              <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
                <Text style={[styles.statValue, { color: theme.colors.primary }]}>24</Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Дней активности</Text>
              </View>
              
              <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
                <Text style={[styles.statValue, { color: theme.colors.primary }]}>12.4K</Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Ккал отслежено</Text>
              </View>
              
              <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
                <Text style={[styles.statValue, { color: theme.colors.primary }]}>86</Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Блюд просканировано</Text>
              </View>
            </View>
            
            <View style={styles.nutrientGoalsSection}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Цели и режимы питания</Text>
              
              <View style={[styles.settingsCard, { backgroundColor: theme.colors.card }]}>
                <TouchableOpacity style={styles.settingItem} onPress={() => setShowDietModal(true)}>
                  <View style={styles.settingLeft}>
                    <View style={[styles.settingIcon, { backgroundColor: theme.colors.primaryLight }]}>
                      <User size={18} color={theme.colors.primary} />
                    </View>
                    <Text style={[styles.settingText, { color: theme.colors.text }]}>Режим питания</Text>
                  </View>
                  <View style={styles.settingRight}>
                    <Text style={[styles.settingValue, { color: theme.colors.textSecondary }]}>
                      {getCurrentDietName()}
                    </Text>
                    <ArrowRight size={16} color={theme.colors.textSecondary} style={{ marginLeft: 8 }} />
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.settingItem} onPress={() => setShowAllergensModal(true)}>
                  <View style={styles.settingLeft}>
                    <View style={[styles.settingIcon, { backgroundColor: theme.colors.warningLight }]}>
                      <AlertTriangle size={18} color={theme.colors.warning} />
                    </View>
                    <Text style={[styles.settingText, { color: theme.colors.text }]}>Аллергены</Text>
                  </View>
                  <View style={styles.settingRight}>
                    <Text style={[styles.settingValue, { color: theme.colors.textSecondary }]}>
                      {getAllergensText()}
                    </Text>
                    <ArrowRight size={16} color={theme.colors.textSecondary} style={{ marginLeft: 8 }} />
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.settingItem} onPress={() => setShowHealthModal(true)}>
                  <View style={styles.settingLeft}>
                    <View style={[styles.settingIcon, { backgroundColor: theme.colors.secondaryLight }]}>
                      <Activity size={18} color={theme.colors.secondary} />
                    </View>
                    <Text style={[styles.settingText, { color: theme.colors.text }]}>Состояние здоровья</Text>
                  </View>
                  <View style={styles.settingRight}>
                    <Text style={[styles.settingValue, { color: theme.colors.textSecondary }]}>
                      {userData.healthConditions.length === 0 ? 'Не указано' : `${userData.healthConditions.length} указано`}
                    </Text>
                    <ArrowRight size={16} color={theme.colors.textSecondary} style={{ marginLeft: 8 }} />
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.settingItem}>
                  <View style={styles.settingLeft}>
                    <View style={[styles.settingIcon, { backgroundColor: theme.colors.primaryLight }]}>
                      <Weight size={18} color={theme.colors.primary} />
                    </View>
                    <Text style={[styles.settingText, { color: theme.colors.text }]}>Целевой вес</Text>
                  </View>
                  <View style={styles.settingRight}>
                    <Text style={[styles.settingValue, { color: theme.colors.textSecondary }]}>
                      {userData.goalWeight} кг
                    </Text>
                    <ArrowRight size={16} color={theme.colors.textSecondary} style={{ marginLeft: 8 }} />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.settingsSection}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Настройки</Text>
              
              <View style={[styles.settingsCard, { backgroundColor: theme.colors.card }]}>
                <View style={styles.toggleItem}>
                  <View style={styles.menuItemLeft}>
                    <View 
                      style={[
                        styles.menuItemIcon, 
                        { backgroundColor: '#FB8C00' + '10' }
                      ]}
                    >
                      <MoonStar size={20} color='#FB8C00' />
                    </View>
                    <Text style={[styles.menuItemText, { color: theme.colors.text }]}>
                      Темная тема
                    </Text>
                  </View>
                  <Switch
                    value={darkMode}
                    onValueChange={setDarkMode}
                    trackColor={{ 
                      false: theme.colors.border, 
                      true: theme.colors.primary + '70' 
                    }}
                    thumbColor={darkMode ? theme.colors.primary : '#f4f3f4'}
                  />
                </View>
                
                <View style={styles.toggleItem}>
                  <View style={styles.menuItemLeft}>
                    <View 
                      style={[
                        styles.menuItemIcon, 
                        { backgroundColor: '#F4511E' + '10' }
                      ]}
                    >
                      <Bell size={20} color='#F4511E' />
                    </View>
                    <Text style={[styles.menuItemText, { color: theme.colors.text }]}>
                      Уведомления
                    </Text>
                  </View>
                  <Switch
                    value={notifications}
                    onValueChange={setNotifications}
                    trackColor={{ 
                      false: theme.colors.border, 
                      true: theme.colors.primary + '70' 
                    }}
                    thumbColor={notifications ? theme.colors.primary : '#f4f3f4'}
                  />
                </View>
                
                <TouchableOpacity style={styles.settingItem} onPress={openProfileSettings}>
                  <View style={styles.menuItemLeft}>
                    <View 
                      style={[
                        styles.menuItemIcon, 
                        { backgroundColor: '#26A69A' + '10' }
                      ]}
                    >
                      <User size={20} color='#26A69A' />
                    </View>
                    <Text style={[styles.menuItemText, { color: theme.colors.text }]}>
                      Настройки профиля
                    </Text>
                  </View>
                  <ChevronRight size={18} color={theme.colors.textSecondary} />
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.settingItem} onPress={shareApp}>
                  <View style={styles.menuItemLeft}>
                    <View 
                      style={[
                        styles.menuItemIcon, 
                        { backgroundColor: '#5C6BC0' + '10' }
                      ]}
                    >
                      <Share2 size={20} color='#5C6BC0' />
                    </View>
                    <Text style={[styles.menuItemText, { color: theme.colors.text }]}>
                      Поделиться приложением
                    </Text>
                  </View>
                  <ChevronRight size={18} color={theme.colors.textSecondary} />
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.settingItem} onPress={logout}>
                  <View style={styles.menuItemLeft}>
                    <View 
                      style={[
                        styles.menuItemIcon, 
                        { backgroundColor: theme.colors.error + '10' }
                      ]}
                    >
                      <LogOut size={20} color={theme.colors.error} />
                    </View>
                    <Text style={[styles.menuItemText, { color: theme.colors.error }]}>
                      Выйти
                    </Text>
                  </View>
                  <ChevronRight size={18} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.supportSection}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Поддержка</Text>
              
              <View style={[styles.settingsCard, { backgroundColor: theme.colors.card }]}>
                <TouchableOpacity style={styles.settingItem}>
                  <View style={styles.settingLeft}>
                    <View style={[styles.settingIcon, { backgroundColor: theme.colors.secondaryLight }]}>
                      <Heart size={18} color={theme.colors.secondary} />
                    </View>
                    <Text style={[styles.settingText, { color: theme.colors.text }]}>Премиум подписка</Text>
                  </View>
                  <ArrowRight size={16} color={theme.colors.textSecondary} />
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.settingItem}>
                  <View style={styles.settingLeft}>
                    <View style={[styles.settingIcon, { backgroundColor: theme.colors.secondaryLight }]}>
                      <HelpCircle size={18} color={theme.colors.secondary} />
                    </View>
                    <Text style={[styles.settingText, { color: theme.colors.text }]}>Центр помощи</Text>
                  </View>
                  <ArrowRight size={16} color={theme.colors.textSecondary} />
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.settingItem}>
                  <View style={styles.settingLeft}>
                    <View style={[styles.settingIcon, { backgroundColor: theme.colors.secondaryLight }]}>
                      <Lock size={18} color={theme.colors.secondary} />
                    </View>
                    <Text style={[styles.settingText, { color: theme.colors.text }]}>Политика конфиденциальности</Text>
                  </View>
                  <ArrowRight size={16} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </>
      )}
    </ScrollView>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      {renderDietModal()}
      {renderAllergensModal()}
      {renderHealthModal()}

      {renderProfile()}
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
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Nunito-Bold',
    fontSize: 28,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontFamily: 'Nunito-Bold',
    fontSize: 18,
  },
  profileEmail: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginTop: 4,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  statCard: {
    width: '31%',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: 'Nunito-Bold',
    fontSize: 20,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    textAlign: 'center',
  },
  nutrientGoalsSection: {
    marginBottom: 32,
  },
  settingsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontFamily: 'Nunito-Bold',
    fontSize: 18,
    marginBottom: 16,
  },
  settingsCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValue: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  supportSection: {
    marginBottom: 24,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 24,
    marginBottom: 24,
  },
  logoutText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
  },
  versionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: 'Nunito-Bold',
    fontSize: 20,
  },
  modalClose: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
  },
  modalSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginBottom: 16,
  },
  modalScroll: {
    maxHeight: '80%',
  },
  dietOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 12,
    marginBottom: 12,
  },
  dietOptionContent: {
    flex: 1,
  },
  dietName: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    marginBottom: 4,
  },
  dietDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
  },
  selectedOption: {
    borderWidth: 2,
  },
  checkIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  checkText: {
    color: 'white',
    fontFamily: 'Inter-Bold',
    fontSize: 14,
  },
  allergenOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 12,
    marginBottom: 8,
  },
  allergenOptionContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  allergenIconContainer: {
    marginRight: 12,
  },
  allergenName: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
  },
  healthOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 12,
    marginBottom: 8,
  },
  healthOptionContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  healthIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  healthName: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  userImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  userImage: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  userTextInfo: {
    flex: 1,
  },
  userName: {
    fontFamily: 'Nunito-Bold',
    fontSize: 18,
  },
  userEmail: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginTop: 4,
  },
  section: {
    marginBottom: 32,
  },
  menuContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuItemText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
  },
  menuItemSubtext: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  premiumIcon: {
    marginRight: 4,
  },
  premiumText: {
    fontSize: 12,
    fontWeight: '500',
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  menuItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  footer: {
    marginTop: 40,
    marginBottom: 100,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
  },
});