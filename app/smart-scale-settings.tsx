import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  ArrowLeft, 
  Bluetooth, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Scale,
  Plus,
  Trash,
  Settings,
  Zap
} from 'lucide-react-native';
import { SmartScaleIntegration, ScaleDevice } from '../../lib/SmartScaleIntegration';

export default function SmartScaleSettingsScreen() {
  const { theme } = useTheme();
  const [scanning, setScanning] = useState(false);
  const [discoveredDevices, setDiscoveredDevices] = useState<ScaleDevice[]>([]);
  const [pairedDevices, setPairedDevices] = useState<ScaleDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoSync, setAutoSync] = useState(true);
  const [scaleIntegration, setScaleIntegration] = useState<SmartScaleIntegration | null>(null);

  // Инициализация
  useEffect(() => {
    const initializeScale = async () => {
      try {
        const integration = new SmartScaleIntegration();
        await integration.initialize();
        setScaleIntegration(integration);
        loadPairedDevices();
      } catch (error) {
        console.error('Failed to initialize smart scale integration:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeScale();
    
    return () => {
      if (scaleIntegration) {
        scaleIntegration.stopScan();
      }
    };
  }, []);

  // Загрузка сохраненных устройств
  const loadPairedDevices = async () => {
    try {
      // В реальном приложении здесь был бы код для загрузки сохраненных устройств
      // Имитация задержки загрузки
      setLoading(true);
      setTimeout(() => {
        // Демо-данные
        const demoDevices: ScaleDevice[] = [
          {
            id: '11:22:33:44:55:66',
            name: 'Xiaomi Mi Scale 2',
            connected: false,
            lastSync: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        ];
        
        setPairedDevices(demoDevices);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to load paired devices:', error);
      setLoading(false);
    }
  };

  // Начать сканирование весов
  const startScan = () => {
    if (!scaleIntegration) return;
    
    setScanning(true);
    setDiscoveredDevices([]);
    
    try {
      scaleIntegration.startScan((device) => {
        // Проверяем, не добавлено ли уже это устройство
        setDiscoveredDevices(prev => {
          if (prev.some(d => d.id === device.id)) {
            return prev;
          }
          return [...prev, device];
        });
      });
      
      // Остановить сканирование через 10 секунд
      setTimeout(() => {
        stopScan();
      }, 10000);
    } catch (error) {
      console.error('Failed to start scan:', error);
      setScanning(false);
      Alert.alert('Ошибка', 'Не удалось начать сканирование устройств. Проверьте, что Bluetooth включен.');
    }
  };

  // Остановить сканирование
  const stopScan = () => {
    if (!scaleIntegration) return;
    scaleIntegration.stopScan();
    setScanning(false);
  };

  // Подключиться к весам
  const connectToDevice = async (device: ScaleDevice) => {
    if (!scaleIntegration) return;
    
    try {
      setLoading(true);
      await scaleIntegration.connectToDevice(device.id);
      
      // Имитация успешного подключения
      setPairedDevices(prev => {
        // Если устройство уже сопряжено, обновляем его статус
        const exists = prev.some(d => d.id === device.id);
        if (exists) {
          return prev.map(d => d.id === device.id ? { ...d, connected: true } : d);
        }
        // Иначе добавляем новое устройство
        return [...prev, { ...device, connected: true }];
      });
      
      // Очищаем список найденных устройств
      setDiscoveredDevices([]);
      Alert.alert('Успешно', `Устройство "${device.name}" успешно подключено.`);
    } catch (error) {
      console.error('Failed to connect to device:', error);
      Alert.alert('Ошибка подключения', 'Не удалось подключиться к устройству. Попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };

  // Отключиться от весов
  const disconnectDevice = async (device: ScaleDevice) => {
    if (!scaleIntegration) return;
    
    try {
      setLoading(true);
      await scaleIntegration.disconnectDevice(device.id);
      
      // Обновляем статус устройства
      setPairedDevices(prev => 
        prev.map(d => d.id === device.id ? { ...d, connected: false } : d)
      );
      
      Alert.alert('Отключено', `Устройство "${device.name}" было отключено.`);
    } catch (error) {
      console.error('Failed to disconnect device:', error);
      Alert.alert('Ошибка', 'Не удалось отключить устройство. Попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };

  // Удалить сопряженное устройство
  const removeDevice = (device: ScaleDevice) => {
    Alert.alert(
      'Удаление устройства',
      `Вы уверены, что хотите удалить "${device.name}"?`,
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: 'Удалить', 
          onPress: async () => {
            if (!scaleIntegration) return;
            
            try {
              setLoading(true);
              if (device.connected) {
                await scaleIntegration.disconnectDevice(device.id);
              }
              
              // Удаляем устройство из списка
              setPairedDevices(prev => prev.filter(d => d.id !== device.id));
              Alert.alert('Удалено', `Устройство "${device.name}" было удалено.`);
            } catch (error) {
              console.error('Failed to remove device:', error);
              Alert.alert('Ошибка', 'Не удалось удалить устройство. Попробуйте еще раз.');
            } finally {
              setLoading(false);
            }
          },
          style: 'destructive'
        }
      ]
    );
  };

  // Форматировать дату последней синхронизации
  const formatLastSync = (date: Date | null) => {
    if (!date) return 'Никогда';
    
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Менее часа назад';
    } else if (diffInHours < 24) {
      return `${diffInHours} ${pluralize(diffInHours, 'час', 'часа', 'часов')} назад`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} ${pluralize(diffInDays, 'день', 'дня', 'дней')} назад`;
    }
  };

  // Вспомогательная функция для правильного склонения слов
  const pluralize = (count: number, one: string, few: string, many: string) => {
    if (count % 10 === 1 && count % 100 !== 11) {
      return one;
    } else if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) {
      return few;
    } else {
      return many;
    }
  };

  // Вернуться назад
  const goBack = () => {
    router.back();
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
          Умные весы
        </Text>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView style={styles.content}>
        {/* Секция статуса Bluetooth */}
        <View style={[styles.statusContainer, { backgroundColor: theme.colors.card }]}>
          <View style={styles.statusIconContainer}>
            <Bluetooth 
              size={24} 
              color={scaleIntegration ? theme.colors.primary : theme.colors.textSecondary} 
            />
          </View>
          <View style={styles.statusTextContainer}>
            <Text style={[styles.statusTitle, { color: theme.colors.text }]}>
              {scaleIntegration ? 'Bluetooth активен' : 'Bluetooth отключен'}
            </Text>
            <Text style={[styles.statusDescription, { color: theme.colors.textSecondary }]}>
              {scaleIntegration 
                ? 'Готов к подключению умных весов' 
                : 'Включите Bluetooth для поиска весов'}
            </Text>
          </View>
        </View>
        
        {/* Подключенные устройства */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Сопряженные устройства
          </Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
          ) : pairedDevices.length === 0 ? (
            <View style={[styles.emptyContainer, { backgroundColor: theme.colors.card }]}>
              <Scale size={24} color={theme.colors.textSecondary} style={styles.emptyIcon} />
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                Нет сопряженных весов
              </Text>
              <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
                Нажмите кнопку "Найти весы" ниже
              </Text>
            </View>
          ) : (
            pairedDevices.map(device => (
              <View 
                key={device.id} 
                style={[styles.deviceCard, { backgroundColor: theme.colors.card }]}
              >
                <View style={styles.deviceInfo}>
                  <View style={styles.deviceHeader}>
                    <Scale size={18} color={
                      device.connected ? theme.colors.primary : theme.colors.textSecondary
                    } style={styles.deviceIcon} />
                    <Text style={[styles.deviceName, { color: theme.colors.text }]}>
                      {device.name}
                    </Text>
                  </View>
                  
                  <View style={styles.deviceStatus}>
                    {device.connected ? (
                      <View style={styles.statusBadge}>
                        <CheckCircle size={14} color={theme.colors.success} style={styles.statusIcon} />
                        <Text style={[styles.statusText, { color: theme.colors.success }]}>
                          Подключено
                        </Text>
                      </View>
                    ) : (
                      <Text style={[styles.lastSync, { color: theme.colors.textSecondary }]}>
                        Последняя синхронизация: {formatLastSync(device.lastSync)}
                      </Text>
                    )}
                  </View>
                </View>
                
                <View style={styles.deviceActions}>
                  {device.connected ? (
                    <TouchableOpacity 
                      style={[styles.deviceAction, { borderColor: theme.colors.border }]} 
                      onPress={() => disconnectDevice(device)}
                    >
                      <Text style={[styles.actionText, { color: theme.colors.text }]}>
                        Отключить
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity 
                      style={[styles.deviceAction, { borderColor: theme.colors.border }]} 
                      onPress={() => connectToDevice(device)}
                    >
                      <Text style={[styles.actionText, { color: theme.colors.text }]}>
                        Подключить
                      </Text>
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity 
                    style={styles.removeButton} 
                    onPress={() => removeDevice(device)}
                  >
                    <Trash size={18} color={theme.colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
        
        {/* Поиск новых устройств */}
        {scanning ? (
          <View style={[styles.scanningContainer, { backgroundColor: theme.colors.card }]}>
            <View style={styles.scanningAnimation}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
            <Text style={[styles.scanningTitle, { color: theme.colors.text }]}>
              Поиск устройств...
            </Text>
            <Text style={[styles.scanningSubtext, { color: theme.colors.textSecondary }]}>
              Убедитесь, что ваши весы включены и находятся рядом
            </Text>
            <TouchableOpacity 
              style={[styles.button, styles.secondaryButton, { borderColor: theme.colors.border }]} 
              onPress={stopScan}
            >
              <Text style={[styles.buttonText, { color: theme.colors.text }]}>
                Остановить поиск
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: theme.colors.primary }]} 
            onPress={startScan}
            disabled={!scaleIntegration}
          >
            <Bluetooth size={18} color="white" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>
              Найти весы
            </Text>
          </TouchableOpacity>
        )}
        
        {/* Найденные устройства */}
        {discoveredDevices.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Найденные устройства
            </Text>
            
            {discoveredDevices.map(device => (
              <TouchableOpacity 
                key={device.id} 
                style={[styles.discoveredDeviceCard, { backgroundColor: theme.colors.card }]}
                onPress={() => connectToDevice(device)}
              >
                <View style={styles.deviceHeader}>
                  <Scale size={18} color={theme.colors.text} style={styles.deviceIcon} />
                  <Text style={[styles.deviceName, { color: theme.colors.text }]}>
                    {device.name || `Неизвестное устройство (${device.id})`}
                  </Text>
                </View>
                <Plus size={18} color={theme.colors.primary} />
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        {/* Настройки синхронизации */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Настройки синхронизации
          </Text>
          
          <View style={[styles.settingCard, { backgroundColor: theme.colors.card }]}>
            <View style={styles.settingContent}>
              <View style={styles.settingHeader}>
                <Zap size={18} color={theme.colors.primary} style={styles.settingIcon} />
                <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                  Автоматическая синхронизация
                </Text>
              </View>
              <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                Автоматически синхронизировать данные при обнаружении весов
              </Text>
            </View>
            <Switch
              value={autoSync}
              onValueChange={setAutoSync}
              trackColor={{ 
                false: theme.colors.border, 
                true: theme.colors.primary + '70' 
              }}
              thumbColor={autoSync ? theme.colors.primary : '#f4f3f4'}
            />
          </View>
          
          <TouchableOpacity 
            style={[styles.settingCard, { backgroundColor: theme.colors.card }]}
          >
            <View style={styles.settingContent}>
              <View style={styles.settingHeader}>
                <Settings size={18} color={theme.colors.primary} style={styles.settingIcon} />
                <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                  Дополнительные настройки
                </Text>
              </View>
              <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                Настройки измерений, единицы измерения и т.д.
              </Text>
            </View>
          </TouchableOpacity>
        </View>
        
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
            Поддерживаемые модели: Xiaomi Mi Scale, Xiaomi Mi Scale 2, Huawei Scale 3
          </Text>
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
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  statusIconContainer: {
    marginRight: 16,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusDescription: {
    fontSize: 14,
  },
  sectionContainer: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  emptyContainer: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  deviceCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  deviceInfo: {
    marginBottom: 12,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  deviceIcon: {
    marginRight: 8,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '500',
  },
  deviceStatus: {
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  lastSync: {
    fontSize: 14,
  },
  deviceActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceAction: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  removeButton: {
    padding: 8,
  },
  scanningContainer: {
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  scanningAnimation: {
    marginBottom: 16,
  },
  scanningTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  scanningSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 24,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  discoveredDeviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  settingContent: {
    flex: 1,
    marginRight: 16,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  settingIcon: {
    marginRight: 8,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 14,
  },
  footer: {
    marginHorizontal: 16,
    marginBottom: 30,
    alignItems: 'center',
    paddingTop: 8,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
  },
}); 