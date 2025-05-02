import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Switch, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { 
  ArrowLeft, 
  Activity, 
  Heart, 
  Droplets, 
  Moon, 
  Scale, 
  Apple, 
  RefreshCw,
  ChevronRight, 
  Coffee 
} from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { healthIntegration, defaultHealthConfig, HealthData } from '../lib/HealthIntegration';

// Основные типы данных для синхронизации
interface SyncOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
}

// Компонент экрана подключения к сервисам здоровья
export default function HealthConnectScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncOptions, setSyncOptions] = useState<SyncOption[]>([
    {
      id: 'steps',
      title: 'Шаги',
      description: 'Синхронизировать данные о шагах',
      icon: <Activity size={24} color={theme.colors.primaryText} />,
      enabled: true,
    },
    {
      id: 'activity',
      title: 'Активность',
      description: 'Синхронизировать данные о тренировках',
      icon: <Heart size={24} color={theme.colors.primaryText} />,
      enabled: true,
    },
    {
      id: 'water',
      title: 'Вода',
      description: 'Синхронизировать данные о потреблении воды',
      icon: <Droplets size={24} color={theme.colors.primaryText} />,
      enabled: true,
    },
    {
      id: 'sleep',
      title: 'Сон',
      description: 'Синхронизировать данные о сне',
      icon: <Moon size={24} color={theme.colors.primaryText} />,
      enabled: false,
    },
    {
      id: 'weight',
      title: 'Вес',
      description: 'Синхронизировать данные о весе',
      icon: <Scale size={24} color={theme.colors.primaryText} />,
      enabled: true,
    },
    {
      id: 'nutrition',
      title: 'Питание',
      description: 'Экспортировать данные о питании',
      icon: <Coffee size={24} color={theme.colors.primaryText} />,
      enabled: true,
    },
  ]);

  // Инициализация при загрузке компонента
  useEffect(() => {
    initializeHealthConnect();
  }, []);

  // Функция инициализации подключения
  const initializeHealthConnect = async () => {
    setIsLoading(true);
    try {
      // Инициализируем с базовыми настройками
      const initialized = await healthIntegration.initialize(defaultHealthConfig);
      setIsInitialized(initialized);
      setIsConnected(initialized);
      
      if (initialized) {
        // Получаем данные за последние 7 дней
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        
        const data = await healthIntegration.getHealthSummary(startDate, endDate);
        setHealthData(data);
        setLastSync(new Date());
      }
    } catch (error) {
      console.error('Failed to initialize health connection:', error);
      Alert.alert(
        'Ошибка подключения',
        'Не удалось подключиться к сервисам здоровья. Пожалуйста, проверьте настройки устройства.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Функция выполнения синхронизации
  const handleSync = async () => {
    setIsLoading(true);
    try {
      // Синхронизируем данные за последние 7 дней
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      
      const data = await healthIntegration.getHealthSummary(startDate, endDate);
      setHealthData(data);
      setLastSync(new Date());
      
      Alert.alert(
        'Синхронизация завершена',
        'Данные успешно синхронизированы с сервисами здоровья.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Failed to sync health data:', error);
      Alert.alert(
        'Ошибка синхронизации',
        'Не удалось синхронизировать данные. Пожалуйста, попробуйте позже.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Переключение опций синхронизации
  const toggleSyncOption = (id: string) => {
    setSyncOptions(
      syncOptions.map((option) =>
        option.id === id ? { ...option, enabled: !option.enabled } : option
      )
    );
  };

  // Функция подключения к сервисам здоровья
  const handleConnect = async () => {
    setIsLoading(true);
    try {
      const success = await healthIntegration.initialize(defaultHealthConfig);
      setIsConnected(success);
      
      if (success) {
        setLastSync(new Date());
        Alert.alert(
          'Подключено',
          'Подключение к сервисам здоровья установлено успешно.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Ошибка подключения',
          'Не удалось подключиться к сервисам здоровья. Пожалуйста, проверьте настройки и разрешения.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Connection error:', error);
      Alert.alert(
        'Ошибка',
        'Произошла ошибка при подключении.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Отключение от сервисов здоровья
  const handleDisconnect = () => {
    Alert.alert(
      'Отключение',
      'Вы уверены, что хотите отключиться от сервисов здоровья?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Отключить',
          style: 'destructive',
          onPress: () => {
            // В реальном приложении здесь должен быть код отключения
            setIsConnected(false);
            setHealthData(null);
            setLastSync(null);
          },
        },
      ]
    );
  };

  // Рендер элемента опции синхронизации
  const renderSyncOption = (option: SyncOption) => (
    <View key={option.id} style={styles.optionItem}>
      <View style={styles.optionIcon}>{option.icon}</View>
      <View style={styles.optionInfo}>
        <Text style={[styles.optionTitle, { color: theme.colors.primaryText }]}>
          {option.title}
        </Text>
        <Text style={[styles.optionDescription, { color: theme.colors.secondaryText }]}>
          {option.description}
        </Text>
      </View>
      <Switch
        value={option.enabled}
        onValueChange={() => toggleSyncOption(option.id)}
        trackColor={{ false: theme.colors.gray, true: theme.colors.primary }}
        thumbColor={theme.colors.surface}
        disabled={!isConnected}
      />
    </View>
  );

  // Рендер информации о здоровье
  const renderHealthData = () => {
    if (!healthData) return null;
    
    return (
      <View style={styles.healthDataContainer}>
        <View style={[styles.healthDataItem, { backgroundColor: theme.colors.card }]}>
          <Activity size={24} color={theme.colors.primary} />
          <Text style={[styles.healthDataValue, { color: theme.colors.primaryText }]}>
            {healthData.steps}
          </Text>
          <Text style={[styles.healthDataLabel, { color: theme.colors.secondaryText }]}>
            шагов
          </Text>
        </View>
        
        <View style={[styles.healthDataItem, { backgroundColor: theme.colors.card }]}>
          <Heart size={24} color={theme.colors.primary} />
          <Text style={[styles.healthDataValue, { color: theme.colors.primaryText }]}>
            {healthData.activeEnergyBurned}
          </Text>
          <Text style={[styles.healthDataLabel, { color: theme.colors.secondaryText }]}>
            ккал
          </Text>
        </View>
        
        <View style={[styles.healthDataItem, { backgroundColor: theme.colors.card }]}>
          <Droplets size={24} color={theme.colors.primary} />
          <Text style={[styles.healthDataValue, { color: theme.colors.primaryText }]}>
            {healthData.waterIntake || 0}
          </Text>
          <Text style={[styles.healthDataLabel, { color: theme.colors.secondaryText }]}>
            мл
          </Text>
        </View>
        
        {healthData.weight && (
          <View style={[styles.healthDataItem, { backgroundColor: theme.colors.card }]}>
            <Scale size={24} color={theme.colors.primary} />
            <Text style={[styles.healthDataValue, { color: theme.colors.primaryText }]}>
              {healthData.weight}
            </Text>
            <Text style={[styles.healthDataLabel, { color: theme.colors.secondaryText }]}>
              кг
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      
      {/* Заголовок */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.colors.primaryText} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.primaryText }]}>
          Интеграция со здоровьем
        </Text>
      </View>
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Индикатор загрузки */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.secondaryText }]}>
              Загрузка данных...
            </Text>
          </View>
        )}
        
        {!isLoading && (
          <>
            {/* Карточка статуса подключения */}
            <View style={[styles.connectionCard, { backgroundColor: theme.colors.card }]}>
              <View style={styles.connectionHeader}>
                {isConnected ? (
                  <Apple size={32} color={theme.colors.primary} />
                ) : (
                  <Apple size={32} color={theme.colors.error} />
                )}
                <View style={styles.connectionInfo}>
                  <Text style={[styles.connectionTitle, { color: theme.colors.primaryText }]}>
                    {isConnected ? 'Подключено' : 'Не подключено'}
                  </Text>
                  <Text style={[styles.connectionDetails, { color: theme.colors.secondaryText }]}>
                    {isConnected
                      ? `Последняя синхронизация: ${
                          lastSync ? formatDate(lastSync) : 'никогда'
                        }`
                      : 'Нажмите кнопку "Подключить" для интеграции'}
                  </Text>
                </View>
              </View>
              
              {isConnected ? (
                <View style={styles.connectionActions}>
                  <TouchableOpacity
                    style={[styles.syncButton, { backgroundColor: theme.colors.primary }]}
                    onPress={handleSync}
                  >
                    <RefreshCw size={18} color={theme.colors.buttonText} />
                    <Text style={[styles.buttonText, { color: theme.colors.buttonText }]}>
                      Синхронизировать
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.disconnectButton, { borderColor: theme.colors.error }]}
                    onPress={handleDisconnect}
                  >
                    <Text style={[styles.disconnectText, { color: theme.colors.error }]}>
                      Отключить
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.connectButton, { backgroundColor: theme.colors.primary }]}
                  onPress={handleConnect}
                >
                  <Text style={[styles.buttonText, { color: theme.colors.buttonText }]}>
                    Подключить
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            
            {/* Данные о здоровье */}
            {isConnected && renderHealthData()}
            
            {/* Настройки синхронизации */}
            {isConnected && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.primaryText }]}>
                  Настройки синхронизации
                </Text>
                <View style={[styles.optionsContainer, { backgroundColor: theme.colors.card }]}>
                  {syncOptions.map(renderSyncOption)}
                </View>
                
                <Text style={[styles.disclaimer, { color: theme.colors.secondaryText }]}>
                  Все данные синхронизируются в соответствии с настройками конфиденциальности, установленными в приложении "Здоровье" вашего устройства.
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Вспомогательные функции
function formatDate(date: Date): string {
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Стили
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 16,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  connectionCard: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  connectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  connectionInfo: {
    flex: 1,
    marginLeft: 16,
  },
  connectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  connectionDetails: {
    fontSize: 14,
  },
  connectionActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginRight: 12,
  },
  disconnectButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  connectButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontWeight: '500',
    fontSize: 16,
    marginLeft: 8,
  },
  disconnectText: {
    fontWeight: '500',
    fontSize: 16,
  },
  healthDataContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
    justifyContent: 'space-between',
  },
  healthDataItem: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  healthDataValue: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 4,
  },
  healthDataLabel: {
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  optionsContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  optionIcon: {
    marginRight: 16,
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 14,
  },
  disclaimer: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 16,
  },
}); 