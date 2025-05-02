import React, { useState, useEffect, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  Platform,
  Switch,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { 
  ArrowLeft, 
  Activity, 
  Apple, 
  AreaChart, 
  Clock, 
  Droplets, 
  Heart, 
  Scale, 
  Utensils, 
  CheckCircle2,
  XCircle,
  Info,
  RefreshCw
} from 'lucide-react-native';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../contexts/ThemeContext';
import HealthKitIntegration, { 
  HealthDataType, 
  getTimeRangeForScope, 
  TimeScope,
  HealthDataPoint,
  NutritionData
} from '../../lib/HealthKitIntegration';
import BackgroundSync from '../../lib/BackgroundSync';
import { formatDate, formatTime } from '../../utils/helpers';

interface HealthPermission {
  type: HealthDataType;
  title: string;
  description: string;
  icon: React.ReactNode;
  status?: 'authorized' | 'denied' | 'notDetermined';
  enabled: boolean;
}

interface SyncSetting {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
}

interface HealthSyncSettings {
  autoSync: boolean;
  syncFrequency: 'hourly' | 'daily' | 'manual';
  lastSyncDate: string | null;
  syncSteps: boolean;
  syncActivity: boolean;
  syncWeight: boolean;
  syncWater: boolean;
  syncNutrition: boolean;
  syncSleep: boolean;
}

interface SyncSummary {
  dataType: string;
  count: number;
  dateRange: string;
}

export default function HealthSyncScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncDate, setLastSyncDate] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState('permissions');
  const [permissions, setPermissions] = useState<HealthPermission[]>([
    {
      type: 'steps',
      title: 'Steps',
      description: 'Read your daily step count',
      icon: <Activity size={24} color={theme.colors.primary} />,
      enabled: true
    },
    {
      type: 'distance',
      title: 'Distance',
      description: 'Read your walking and running distance',
      icon: <Activity size={24} color={theme.colors.primary} />,
      enabled: true
    },
    {
      type: 'calories',
      title: 'Active Energy',
      description: 'Read your active energy burned',
      icon: <AreaChart size={24} color={theme.colors.primary} />,
      enabled: true
    },
    {
      type: 'weight',
      title: 'Weight',
      description: 'Read your weight measurements',
      icon: <Scale size={24} color={theme.colors.primary} />,
      enabled: true
    },
    {
      type: 'height',
      title: 'Height',
      description: 'Read your height measurements',
      icon: <Activity size={24} color={theme.colors.primary} />,
      enabled: false
    },
    {
      type: 'heartRate',
      title: 'Heart Rate',
      description: 'Read your heart rate measurements',
      icon: <Heart size={24} color={theme.colors.primary} />,
      enabled: true
    },
    {
      type: 'sleepAnalysis',
      title: 'Sleep',
      description: 'Read your sleep analysis data',
      icon: <Clock size={24} color={theme.colors.primary} />,
      enabled: true
    },
    {
      type: 'waterIntake',
      title: 'Water',
      description: 'Read and write water intake data',
      icon: <Droplets size={24} color={theme.colors.primary} />,
      enabled: true
    },
    {
      type: 'nutrition.calories',
      title: 'Nutrition',
      description: 'Read and write nutrition data (calories, macros)',
      icon: <Utensils size={24} color={theme.colors.primary} />,
      enabled: true
    },
    {
      type: 'workout',
      title: 'Workouts',
      description: 'Read your workout data',
      icon: <Activity size={24} color={theme.colors.primary} />,
      enabled: true
    }
  ]);
  
  const [syncSettings, setSyncSettings] = useState<SyncSetting[]>([
    {
      id: 'importHealth',
      title: 'Import from Health App',
      description: 'Import your health data into NutriView AI',
      enabled: true
    },
    {
      id: 'exportFood',
      title: 'Export Food Data',
      description: 'Export your food logs to Health App',
      enabled: true
    },
    {
      id: 'exportWater',
      title: 'Export Water Data',
      description: 'Export your water intake to Health App',
      enabled: true
    },
    {
      id: 'autoSync',
      title: 'Auto Sync',
      description: 'Automatically sync data daily',
      enabled: true
    }
  ]);
  
  const [syncStats, setSyncStats] = useState({
    steps: 0,
    calories: 0,
    nutrition: 0,
    water: 0,
    workouts: 0,
    sleep: 0
  });

  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [permissionsStatus, setPermissionsStatus] = useState<{[key in HealthDataType]?: string}>({});
  const [settings, setSettings] = useState<HealthSyncSettings>({
    autoSync: false,
    syncFrequency: 'daily',
    lastSyncDate: null,
    syncSteps: true,
    syncActivity: true,
    syncWeight: true,
    syncWater: true,
    syncNutrition: true,
    syncSleep: true
  });
  const [lastSyncSummary, setLastSyncSummary] = useState<SyncSummary[]>([]);

  useEffect(() => {
    checkHealthKitAvailability();
  }, []);

  const checkHealthKitAvailability = async () => {
    try {
      setIsLoading(true);
      const available = await HealthKitIntegration.isAvailable();
      setIsAvailable(available);
      
      if (available) {
        // Get current authorization status
        const dataTypes = permissions.map(p => p.type);
        const statuses = await HealthKitIntegration.getAuthorizationStatus(dataTypes);
        
        // Update permissions with current status
        setPermissions(prev => 
          prev.map(p => ({
            ...p,
            status: statuses[p.type]
          }))
        );
        
        // Mock last sync date
        setLastSyncDate(new Date(Date.now() - Math.random() * 86400000 * 3)); // Random time in last 3 days
        
        // Mock sync stats
        setSyncStats({
          steps: Math.floor(Math.random() * 20),
          calories: Math.floor(Math.random() * 15),
          nutrition: Math.floor(Math.random() * 30),
          water: Math.floor(Math.random() * 10),
          workouts: Math.floor(Math.random() * 5),
          sleep: Math.floor(Math.random() * 7)
        });
      }
    } catch (error) {
      console.error('Error checking health integration availability:', error);
      Alert.alert('Error', 'Failed to check health integration availability');
    } finally {
      setIsLoading(false);
    }
  };

  const requestPermissions = async () => {
    try {
      setIsLoading(true);
      
      // Only request permissions for enabled items
      const enabledTypes = permissions
        .filter(p => p.enabled)
        .map(p => p.type);
      
      if (enabledTypes.length === 0) {
        Alert.alert('No Permissions Selected', 'Please enable at least one permission to continue.');
        setIsLoading(false);
        return;
      }
      
      const success = await HealthKitIntegration.requestAuthorization(enabledTypes);
      
      if (success) {
        // Get updated authorization status
        const statuses = await HealthKitIntegration.getAuthorizationStatus(enabledTypes);
        
        // Update permissions with current status
        setPermissions(prev => 
          prev.map(p => ({
            ...p,
            status: statuses[p.type] || p.status
          }))
        );
        
        Alert.alert('Success', 'Health permissions updated successfully');
      } else {
        Alert.alert('Permission Error', 'Failed to request health permissions');
      }
    } catch (error) {
      console.error('Error requesting health permissions:', error);
      Alert.alert('Error', 'Failed to request health permissions');
    } finally {
      setIsLoading(false);
    }
  };

  const syncHealthData = async () => {
    try {
      setIsSyncing(true);
      
      // Get time range for last week
      const { startDate, endDate } = getTimeRangeForScope('week');
      
      // Get enabled data types
      const enabledTypes = permissions
        .filter(p => p.enabled && p.status === 'authorized')
        .map(p => p.type);
      
      if (enabledTypes.length === 0) {
        Alert.alert('No Authorized Permissions', 'Please authorize at least one data type to sync.');
        setIsSyncing(false);
        return;
      }
      
      // Process each data type in sequence
      for (const dataType of enabledTypes) {
        const result = await HealthKitIntegration.queryHealthData(dataType, startDate, endDate);
        
        if (result.success && result.data) {
          console.log(`Synced ${result.data.length} records for ${dataType}`);
          
          // In a real app, you'd store this data in your app's database
          // For demo, we just update the sync stats
          setSyncStats(prev => {
            const updatedStats = { ...prev };
            
            if (dataType === 'steps') updatedStats.steps = result.data.length;
            else if (dataType === 'calories') updatedStats.calories = result.data.length;
            else if (dataType.startsWith('nutrition')) updatedStats.nutrition = result.data.length;
            else if (dataType === 'waterIntake') updatedStats.water = result.data.length;
            else if (dataType === 'workout') updatedStats.workouts = result.data.length;
            else if (dataType === 'sleepAnalysis') updatedStats.sleep = result.data.length;
            
            return updatedStats;
          });
        } else {
          console.error(`Failed to sync ${dataType}:`, result.error);
        }
      }
      
      // Update last sync date
      setLastSyncDate(new Date());
      
      Alert.alert('Sync Complete', 'Health data has been successfully synchronized');
    } catch (error) {
      console.error('Error syncing health data:', error);
      Alert.alert('Sync Error', 'Failed to sync health data');
    } finally {
      setIsSyncing(false);
    }
  };

  const togglePermission = (index: number) => {
    setPermissions(prev => 
      prev.map((p, i) => 
        i === index ? { ...p, enabled: !p.enabled } : p
      )
    );
  };

  const toggleSyncSetting = (id: string) => {
    setSyncSettings(prev => 
      prev.map(s => 
        s.id === id ? { ...p, enabled: !s.enabled } : s
      )
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await checkHealthKitAvailability();
    setRefreshing(false);
  };

  if (isLoading && isAvailable === null) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Checking health integration availability...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isAvailable === false) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Health Sync</Text>
          <View style={styles.placeholderRight} />
        </View>
        
        <View style={styles.notAvailableContainer}>
          <XCircle size={64} color={theme.colors.error} style={styles.notAvailableIcon} />
          <Text style={[styles.notAvailableTitle, { color: theme.colors.text }]}>
            Health Integration Not Available
          </Text>
          <Text style={[styles.notAvailableText, { color: theme.colors.textSecondary }]}>
            {Platform.OS === 'ios' 
              ? 'HealthKit is not available on this device.'
              : Platform.OS === 'android'
                ? 'Google Fit is not available on this device.'
                : 'Health integration is not supported on this platform.'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Health Sync</Text>
        
        {Platform.OS === 'ios' ? (
          <Apple size={24} color={theme.colors.text} />
        ) : (
          <View style={styles.placeholderRight} />
        )}
      </View>
      
      {/* Last sync info */}
      <View style={[styles.syncInfoContainer, { backgroundColor: theme.colors.card }]}>
        <View style={styles.syncInfoContent}>
          <Text style={[styles.syncInfoTitle, { color: theme.colors.text }]}>
            Last Synced
          </Text>
          <Text style={[styles.syncInfoDate, { color: theme.colors.textSecondary }]}>
            {lastSyncDate 
              ? lastSyncDate.toLocaleString()
              : 'Never synced'}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={[styles.syncButton, { backgroundColor: theme.colors.primary }]}
          onPress={syncHealthData}
          disabled={isSyncing || isLoading}
        >
          {isSyncing ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <RefreshCw size={16} color="white" style={styles.syncButtonIcon} />
              <Text style={styles.syncButtonText}>Sync Now</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      
      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[
            styles.tabButton, 
            activeTab === 'permissions' && [styles.activeTabButton, { borderBottomColor: theme.colors.primary }]
          ]}
          onPress={() => setActiveTab('permissions')}
        >
          <Text 
            style={[
              styles.tabButtonText, 
              { color: activeTab === 'permissions' ? theme.colors.primary : theme.colors.textSecondary }
            ]}
          >
            Permissions
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.tabButton, 
            activeTab === 'settings' && [styles.activeTabButton, { borderBottomColor: theme.colors.primary }]
          ]}
          onPress={() => setActiveTab('settings')}
        >
          <Text 
            style={[
              styles.tabButtonText, 
              { color: activeTab === 'settings' ? theme.colors.primary : theme.colors.textSecondary }
            ]}
          >
            Settings
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.tabButton, 
            activeTab === 'stats' && [styles.activeTabButton, { borderBottomColor: theme.colors.primary }]
          ]}
          onPress={() => setActiveTab('stats')}
        >
          <Text 
            style={[
              styles.tabButtonText, 
              { color: activeTab === 'stats' ? theme.colors.primary : theme.colors.textSecondary }
            ]}
          >
            Stats
          </Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {activeTab === 'permissions' && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Health Data Access</Text>
            <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>
              Control which health data NutriView AI can access from your {Platform.OS === 'ios' ? 'Apple Health' : 'Google Fit'}.
            </Text>
            
            {permissions.map((permission, index) => (
              <View 
                key={permission.type}
                style={[styles.permissionItem, { backgroundColor: theme.colors.card }]}
              >
                <View style={styles.permissionInfo}>
                  <View style={styles.permissionIcon}>
                    {permission.icon}
                  </View>
                  <View style={styles.permissionTextContainer}>
                    <Text style={[styles.permissionTitle, { color: theme.colors.text }]}>
                      {permission.title}
                    </Text>
                    <Text style={[styles.permissionDescription, { color: theme.colors.textSecondary }]}>
                      {permission.description}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.permissionStatus}>
                  {permission.status === 'authorized' && (
                    <CheckCircle2 size={16} color={theme.colors.success} style={styles.statusIcon} />
                  )}
                  
                  {permission.status === 'denied' && (
                    <XCircle size={16} color={theme.colors.error} style={styles.statusIcon} />
                  )}
                  
                  <Switch
                    trackColor={{ false: theme.colors.border, true: theme.colors.primaryLight }}
                    thumbColor={permission.enabled ? theme.colors.primary : theme.colors.textSecondary}
                    onValueChange={() => togglePermission(index)}
                    value={permission.enabled}
                  />
                </View>
              </View>
            ))}
            
            <TouchableOpacity 
              style={[
                styles.requestPermissionsButton, 
                { backgroundColor: theme.colors.primary },
                (isLoading) && { opacity: 0.7 }
              ]}
              onPress={requestPermissions}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.requestPermissionsButtonText}>
                  Update Permissions
                </Text>
              )}
            </TouchableOpacity>
          </>
        )}
        
        {activeTab === 'settings' && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Sync Settings</Text>
            <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>
              Configure how NutriView AI syncs with {Platform.OS === 'ios' ? 'Apple Health' : 'Google Fit'}.
            </Text>
            
            {syncSettings.map((setting) => (
              <View 
                key={setting.id}
                style={[styles.permissionItem, { backgroundColor: theme.colors.card }]}
              >
                <View style={styles.permissionInfo}>
                  <View style={styles.permissionTextContainer}>
                    <Text style={[styles.permissionTitle, { color: theme.colors.text }]}>
                      {setting.title}
                    </Text>
                    <Text style={[styles.permissionDescription, { color: theme.colors.textSecondary }]}>
                      {setting.description}
                    </Text>
                  </View>
                </View>
                
                <Switch
                  trackColor={{ false: theme.colors.border, true: theme.colors.primaryLight }}
                  thumbColor={setting.enabled ? theme.colors.primary : theme.colors.textSecondary}
                  onValueChange={() => toggleSyncSetting(setting.id)}
                  value={setting.enabled}
                />
              </View>
            ))}
            
            <View style={[styles.infoCard, { backgroundColor: theme.colors.primaryLight }]}>
              <Info size={20} color={theme.colors.primary} style={styles.infoIcon} />
              <Text style={[styles.infoText, { color: theme.colors.primary }]}>
                Synchronized data is stored securely and used only to provide personalized nutrition recommendations.
              </Text>
            </View>
          </>
        )}
        
        {activeTab === 'stats' && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Sync Statistics</Text>
            <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>
              Overview of synchronized health data.
            </Text>
            
            <View style={[styles.statsCard, { backgroundColor: theme.colors.card }]}>
              <View style={styles.statRow}>
                <View style={styles.statItem}>
                  <Activity size={24} color={theme.colors.primary} style={styles.statIcon} />
                  <View style={styles.statTextContainer}>
                    <Text style={[styles.statValue, { color: theme.colors.text }]}>{syncStats.steps}</Text>
                    <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Step Entries</Text>
                  </View>
                </View>
                
                <View style={styles.statItem}>
                  <AreaChart size={24} color={theme.colors.primary} style={styles.statIcon} />
                  <View style={styles.statTextContainer}>
                    <Text style={[styles.statValue, { color: theme.colors.text }]}>{syncStats.calories}</Text>
                    <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Calorie Entries</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statRow}>
                <View style={styles.statItem}>
                  <Utensils size={24} color={theme.colors.primary} style={styles.statIcon} />
                  <View style={styles.statTextContainer}>
                    <Text style={[styles.statValue, { color: theme.colors.text }]}>{syncStats.nutrition}</Text>
                    <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Nutrition Entries</Text>
                  </View>
                </View>
                
                <View style={styles.statItem}>
                  <Droplets size={24} color={theme.colors.primary} style={styles.statIcon} />
                  <View style={styles.statTextContainer}>
                    <Text style={[styles.statValue, { color: theme.colors.text }]}>{syncStats.water}</Text>
                    <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Water Entries</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statRow}>
                <View style={styles.statItem}>
                  <Activity size={24} color={theme.colors.primary} style={styles.statIcon} />
                  <View style={styles.statTextContainer}>
                    <Text style={[styles.statValue, { color: theme.colors.text }]}>{syncStats.workouts}</Text>
                    <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Workout Entries</Text>
                  </View>
                </View>
                
                <View style={styles.statItem}>
                  <Clock size={24} color={theme.colors.primary} style={styles.statIcon} />
                  <View style={styles.statTextContainer}>
                    <Text style={[styles.statValue, { color: theme.colors.text }]}>{syncStats.sleep}</Text>
                    <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Sleep Entries</Text>
                  </View>
                </View>
              </View>
            </View>
            
            <View style={[styles.infoCard, { backgroundColor: theme.colors.card }]}>
              <Info size={20} color={theme.colors.primary} style={styles.infoIcon} />
              <Text style={[styles.infoText, { color: theme.colors.text }]}>
                Data is synced from the past 7 days by default. You can change this in settings.
              </Text>
            </View>
          </>
        )}
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
  placeholderRight: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  notAvailableContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  notAvailableIcon: {
    marginBottom: 16,
  },
  notAvailableTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  notAvailableText: {
    fontSize: 16,
    textAlign: 'center',
  },
  syncInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 16,
    borderRadius: 12,
  },
  syncInfoContent: {
    flex: 1,
  },
  syncInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  syncInfoDate: {
    fontSize: 14,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  syncButtonIcon: {
    marginRight: 6,
  },
  syncButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 14,
  },
  tabContainer: {
    flexDirection: 'row',
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTabButton: {
    borderBottomWidth: 2,
  },
  tabButtonText: {
    fontWeight: '500',
    fontSize: 15,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingTop: 16,
    paddingBottom: 32,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  permissionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  permissionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  permissionIcon: {
    marginRight: 12,
  },
  permissionTextContainer: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  permissionDescription: {
    fontSize: 14,
  },
  permissionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    marginRight: 8,
  },
  requestPermissionsButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  requestPermissionsButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  infoIcon: {
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
  },
  statsCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  statIcon: {
    marginRight: 12,
  },
  statTextContainer: {
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 14,
  },
  statDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 12,
  },
}); 