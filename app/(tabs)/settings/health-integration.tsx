import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Heart, Activity, Droplets, Apple, Info, CheckCircle2, AlertTriangle } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import healthIntegration from '../../../lib/HealthIntegration';
import { useTheme } from '../../../contexts/ThemeContext';

// Define data type to sync settings
interface SyncSettings {
  syncNutrition: boolean;
  syncActivity: boolean;
  syncWater: boolean;
  syncWeight: boolean;
  autoSync: boolean;
  syncFrequency: 'realtime' | 'daily' | 'manual';
  lastSyncDate: string | null;
}

export default function HealthIntegrationScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [syncSettings, setSyncSettings] = useState<SyncSettings>({
    syncNutrition: true,
    syncActivity: true,
    syncWater: true,
    syncWeight: true,
    autoSync: true,
    syncFrequency: 'daily',
    lastSyncDate: null,
  });

  useEffect(() => {
    // Check if HealthKit is available on this device
    const checkAvailability = async () => {
      try {
        setLoading(true);
        const isReady = healthIntegration.isReady();
        setAuthorized(isReady);
        setIsAvailable(true); // Update this based on actual platform detection
        setLoading(false);
      } catch (error) {
        console.error('Error checking health integration availability:', error);
        setLoading(false);
      }
    };

    checkAvailability();
  }, []);

  const requestHealthAccess = async () => {
    try {
      setLoading(true);
      const success = await healthIntegration.requestAuthorization();
      setAuthorized(success);
      
      if (success) {
        Alert.alert(
          'Success',
          'Health data access granted. You can now sync your health data with the app.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Access Denied',
          'We couldn\'t get access to your health data. Please check your privacy settings and try again.',
          [{ text: 'OK' }]
        );
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error requesting health access:', error);
      setLoading(false);
      Alert.alert(
        'Error',
        'There was an error connecting to health services. Please try again later.',
        [{ text: 'OK' }]
      );
    }
  };

  const syncData = async () => {
    try {
      setLoading(true);
      
      // Get today's date and 30 days ago for demo
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);
      
      const startDate = thirtyDaysAgo.toISOString();
      const endDate = today.toISOString();
      
      // Sync nutrition data if enabled
      if (syncSettings.syncNutrition) {
        const nutritionData = await healthIntegration.getNutritionData(startDate, endDate);
        console.log(`Synced ${nutritionData.length} nutrition records`);
      }
      
      // Sync activity data if enabled
      if (syncSettings.syncActivity) {
        const activityData = await healthIntegration.getActivityData(startDate, endDate);
        console.log(`Synced ${activityData.length} activity records`);
      }
      
      // Sync water data if enabled
      if (syncSettings.syncWater) {
        const waterData = await healthIntegration.getWaterData(startDate, endDate);
        console.log(`Synced ${waterData.length} water records`);
      }
      
      // Update last sync date
      setSyncSettings({
        ...syncSettings,
        lastSyncDate: new Date().toISOString(),
      });
      
      setLoading(false);
      Alert.alert(
        'Sync Complete',
        'Your health data has been successfully synced with the app.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error syncing health data:', error);
      setLoading(false);
      Alert.alert(
        'Sync Error',
        'There was an error syncing your health data. Please try again later.',
        [{ text: 'OK' }]
      );
    }
  };

  const toggleSetting = (setting: keyof SyncSettings) => {
    setSyncSettings({
      ...syncSettings,
      [setting]: !syncSettings[setting],
    });
  };

  const setSyncFrequency = (frequency: 'realtime' | 'daily' | 'manual') => {
    setSyncSettings({
      ...syncSettings,
      syncFrequency: frequency,
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Health Integration</Text>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.text }]}>
              Loading health integration...
            </Text>
          </View>
        ) : (
          <>
            {!isAvailable ? (
              <View style={styles.notAvailableContainer}>
                <AlertTriangle size={48} color={theme.colors.warning} style={styles.icon} />
                <Text style={[styles.notAvailableTitle, { color: theme.colors.text }]}>
                  Health Integration Not Available
                </Text>
                <Text style={[styles.notAvailableText, { color: theme.colors.textSecondary }]}>
                  Health integration is currently only available on iOS devices with Apple Health.
                </Text>
              </View>
            ) : (
              <>
                <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
                  <View style={styles.sectionHeader}>
                    <Apple size={24} color={theme.colors.primary} />
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                      Apple Health Connection
                    </Text>
                  </View>
                  
                  <View style={styles.connectionStatus}>
                    {authorized ? (
                      <View style={styles.connectedContainer}>
                        <CheckCircle2 size={24} color={theme.colors.success} />
                        <Text style={[styles.connectedText, { color: theme.colors.success }]}>
                          Connected
                        </Text>
                      </View>
                    ) : (
                      <TouchableOpacity 
                        style={[styles.connectButton, { backgroundColor: theme.colors.primary }]}
                        onPress={requestHealthAccess}
                      >
                        <Text style={styles.connectButtonText}>Connect Apple Health</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  
                  {authorized && (
                    <View style={styles.lastSyncContainer}>
                      <Text style={[styles.lastSyncText, { color: theme.colors.textSecondary }]}>
                        Last synced: {syncSettings.lastSyncDate ? new Date(syncSettings.lastSyncDate).toLocaleString() : 'Never'}
                      </Text>
                      <TouchableOpacity 
                        style={[styles.syncNowButton, { backgroundColor: theme.colors.primaryLight }]}
                        onPress={syncData}
                      >
                        <Text style={[styles.syncNowText, { color: theme.colors.primary }]}>Sync Now</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
                
                {authorized && (
                  <>
                    <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
                      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                        Data to Sync
                      </Text>
                      
                      <View style={styles.settingItem}>
                        <View style={styles.settingLeft}>
                          <Heart size={20} color={theme.colors.danger} />
                          <Text style={[styles.settingText, { color: theme.colors.text }]}>
                            Nutrition Data
                          </Text>
                        </View>
                        <Switch
                          value={syncSettings.syncNutrition}
                          onValueChange={() => toggleSetting('syncNutrition')}
                          trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                          thumbColor={theme.colors.white}
                        />
                      </View>
                      
                      <View style={styles.settingItem}>
                        <View style={styles.settingLeft}>
                          <Activity size={20} color={theme.colors.success} />
                          <Text style={[styles.settingText, { color: theme.colors.text }]}>
                            Activity Data
                          </Text>
                        </View>
                        <Switch
                          value={syncSettings.syncActivity}
                          onValueChange={() => toggleSetting('syncActivity')}
                          trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                          thumbColor={theme.colors.white}
                        />
                      </View>
                      
                      <View style={styles.settingItem}>
                        <View style={styles.settingLeft}>
                          <Droplets size={20} color={theme.colors.info} />
                          <Text style={[styles.settingText, { color: theme.colors.text }]}>
                            Water Intake
                          </Text>
                        </View>
                        <Switch
                          value={syncSettings.syncWater}
                          onValueChange={() => toggleSetting('syncWater')}
                          trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                          thumbColor={theme.colors.white}
                        />
                      </View>
                      
                      <View style={styles.settingItem}>
                        <View style={styles.settingLeft}>
                          <Activity size={20} color={theme.colors.warning} />
                          <Text style={[styles.settingText, { color: theme.colors.text }]}>
                            Weight & Measurements
                          </Text>
                        </View>
                        <Switch
                          value={syncSettings.syncWeight}
                          onValueChange={() => toggleSetting('syncWeight')}
                          trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                          thumbColor={theme.colors.white}
                        />
                      </View>
                    </View>
                    
                    <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
                      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                        Sync Settings
                      </Text>
                      
                      <View style={styles.settingItem}>
                        <View style={styles.settingLeft}>
                          <Text style={[styles.settingText, { color: theme.colors.text }]}>
                            Auto-Sync
                          </Text>
                        </View>
                        <Switch
                          value={syncSettings.autoSync}
                          onValueChange={() => toggleSetting('autoSync')}
                          trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                          thumbColor={theme.colors.white}
                        />
                      </View>
                      
                      {syncSettings.autoSync && (
                        <View style={styles.frequencySelector}>
                          <TouchableOpacity
                            style={[
                              styles.frequencyOption,
                              syncSettings.syncFrequency === 'realtime' && [styles.selectedFrequency, { backgroundColor: theme.colors.primaryLight }]
                            ]}
                            onPress={() => setSyncFrequency('realtime')}
                          >
                            <Text style={[
                              styles.frequencyText,
                              { color: syncSettings.syncFrequency === 'realtime' ? theme.colors.primary : theme.colors.textSecondary }
                            ]}>
                              Real-time
                            </Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity
                            style={[
                              styles.frequencyOption,
                              syncSettings.syncFrequency === 'daily' && [styles.selectedFrequency, { backgroundColor: theme.colors.primaryLight }]
                            ]}
                            onPress={() => setSyncFrequency('daily')}
                          >
                            <Text style={[
                              styles.frequencyText,
                              { color: syncSettings.syncFrequency === 'daily' ? theme.colors.primary : theme.colors.textSecondary }
                            ]}>
                              Daily
                            </Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity
                            style={[
                              styles.frequencyOption,
                              syncSettings.syncFrequency === 'manual' && [styles.selectedFrequency, { backgroundColor: theme.colors.primaryLight }]
                            ]}
                            onPress={() => setSyncFrequency('manual')}
                          >
                            <Text style={[
                              styles.frequencyText,
                              { color: syncSettings.syncFrequency === 'manual' ? theme.colors.primary : theme.colors.textSecondary }
                            ]}>
                              Manual
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                    
                    <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
                      <View style={styles.infoBox}>
                        <Info size={20} color={theme.colors.info} style={styles.infoIcon} />
                        <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                          Health data is only synced between the app and Apple Health when you manually sync or based on your auto-sync settings. Your privacy is important to us, and we only access the data you've explicitly granted permission for.
                        </Text>
                      </View>
                      
                      <TouchableOpacity 
                        style={[styles.privacyButton, { borderColor: theme.colors.border }]}
                      >
                        <Text style={[styles.privacyButtonText, { color: theme.colors.primary }]}>
                          Privacy Policy
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </>
            )}
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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
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
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  notAvailableContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginTop: 40,
  },
  icon: {
    marginBottom: 16,
  },
  notAvailableTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  notAvailableText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  connectionStatus: {
    marginBottom: 16,
  },
  connectedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectedText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  connectButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  connectButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  lastSyncContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastSyncText: {
    fontSize: 14,
  },
  syncNowButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  syncNowText: {
    fontWeight: '500',
    fontSize: 14,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    marginLeft: 12,
  },
  frequencySelector: {
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 8,
  },
  frequencyOption: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginRight: 8,
  },
  selectedFrequency: {
    borderRadius: 6,
  },
  frequencyText: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 125, 255, 0.08)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  infoIcon: {
    marginRight: 12,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  privacyButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  privacyButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
}); 