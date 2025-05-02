import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator, Switch, FlatList, Animated } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { smartScaleIntegration, ScaleDevice, ScaleData } from '@/lib/SmartScaleIntegration';
import { 
  BluetoothOff, 
  BluetoothSearching, 
  Bluetooth, 
  Weight, 
  RefreshCw, 
  PlugZap, 
  Shield, 
  AlertTriangle, 
  InfoIcon, 
  Scale,
  ArrowRight,
  Check,
  X,
  ChevronRight,
  CircleCheck,
  PercentCircle,
  Droplets,
  Dumbbell,
  Bone,
  HeartPulse
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

export default function SmartScaleScreen() {
  const { theme } = useTheme();
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<ScaleDevice[]>([]);
  const [scaleData, setScaleData] = useState<ScaleData | null>(null);
  const [activeTab, setActiveTab] = useState<'devices' | 'data'>('devices');
  const [connecting, setConnecting] = useState<string | null>(null);
  const [scaleError, setScaleError] = useState<string | null>(null);
  const [mockMode, setMockMode] = useState(true);
  const [animation] = useState(new Animated.Value(0));
  
  const startScan = async () => {
    try {
      setIsScanning(true);
      setScaleError(null);
      
      // Register for events
      smartScaleIntegration.on('deviceFound', handleDeviceFound);
      smartScaleIntegration.on('error', handleError);
      
      // Start scanning
      await smartScaleIntegration.startScan();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (err) {
      handleError(err);
    }
  };
  
  const stopScan = () => {
    if (isScanning) {
      smartScaleIntegration.stopScan();
      smartScaleIntegration.removeListener('deviceFound', handleDeviceFound);
      smartScaleIntegration.removeListener('error', handleError);
      setIsScanning(false);
    }
  };
  
  const handleDeviceFound = (device: ScaleDevice) => {
    setDevices(prev => {
      // Check if device already exists
      const exists = prev.some(d => d.id === device.id);
      if (exists) return prev;
      
      // Add new device
      return [...prev, device];
    });
  };
  
  const handleError = (error: any) => {
    console.error('Scale error:', error);
    setScaleError(error instanceof Error ? error.message : 'An unknown error occurred');
    stopScan();
    setIsScanning(false);
    setConnecting(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  };
  
  const connectToDevice = async (device: ScaleDevice) => {
    try {
      setConnecting(device.id);
      setScaleError(null);
      
      // Register for connection events
      smartScaleIntegration.on('connected', handleConnected);
      smartScaleIntegration.on('disconnected', handleDisconnected);
      smartScaleIntegration.on('weightData', handleWeightData);
      smartScaleIntegration.on('bodyCompositionData', handleBodyCompositionData);
      
      // Connect to the device
      await smartScaleIntegration.connectToDevice(device.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Switch to data tab after successful connection
      setActiveTab('data');
    } catch (err) {
      handleError(err);
    }
  };
  
  const disconnectDevice = async () => {
    try {
      await smartScaleIntegration.disconnectDevice();
      
      // Cleanup events
      smartScaleIntegration.removeListener('connected', handleConnected);
      smartScaleIntegration.removeListener('disconnected', handleDisconnected);
      smartScaleIntegration.removeListener('weightData', handleWeightData);
      smartScaleIntegration.removeListener('bodyCompositionData', handleBodyCompositionData);
      
      // Reset state
      setScaleData(null);
      setConnecting(null);
      
      // Switch back to devices tab
      setActiveTab('devices');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (err) {
      handleError(err);
    }
  };
  
  const handleConnected = (device: ScaleDevice) => {
    setConnecting(null);
    
    // Update device in list
    setDevices(prev => 
      prev.map(d => d.id === device.id ? device : d)
    );
    
    // Try to get latest data if available
    const latestData = smartScaleIntegration.getLatestData();
    if (latestData) {
      setScaleData(latestData);
    }
  };
  
  const handleDisconnected = (device: ScaleDevice) => {
    // Update device in list
    setDevices(prev => 
      prev.map(d => d.id === device.id ? device : d)
    );
  };
  
  const handleWeightData = (data: ScaleData) => {
    setScaleData(data);
    pulseAnimation();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };
  
  const handleBodyCompositionData = (data: ScaleData) => {
    setScaleData(data);
    pulseAnimation();
  };
  
  const pulseAnimation = () => {
    Animated.sequence([
      Animated.timing(animation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(animation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
  };
  
  // Animation for weight value
  const animatedStyle = {
    transform: [
      {
        scale: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.1],
        })
      }
    ],
    opacity: animation.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [1, 0.8, 1],
    })
  };
  
  // Check for connected devices on focus
  useFocusEffect(
    useCallback(() => {
      const checkConnectedDevices = () => {
        const deviceList = smartScaleIntegration.getDiscoveredDevices();
        setDevices(deviceList);
        
        // Check if any device is connected
        const connectedDevice = deviceList.find(d => d.isConnected);
        if (connectedDevice) {
          setActiveTab('data');
          
          // Set up listeners
          smartScaleIntegration.on('disconnected', handleDisconnected);
          smartScaleIntegration.on('weightData', handleWeightData);
          smartScaleIntegration.on('bodyCompositionData', handleBodyCompositionData);
          
          // Get latest data
          const latestData = smartScaleIntegration.getLatestData();
          if (latestData) {
            setScaleData(latestData);
          }
        }
      };
      
      checkConnectedDevices();
      
      return () => {
        // Cleanup listeners
        smartScaleIntegration.removeListener('disconnected', handleDisconnected);
        smartScaleIntegration.removeListener('weightData', handleWeightData);
        smartScaleIntegration.removeListener('bodyCompositionData', handleBodyCompositionData);
      };
    }, [])
  );
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopScan();
      smartScaleIntegration.removeAllListeners();
    };
  }, []);
  
  const renderDeviceItem = (device: ScaleDevice) => {
    const isConnecting = connecting === device.id;
    const isConnected = device.isConnected;
    
    return (
      <TouchableOpacity
        style={[
          styles.deviceItem,
          { backgroundColor: theme.colors.card },
          isConnected && { borderColor: theme.colors.primary, borderWidth: 2 }
        ]}
        onPress={() => isConnected ? setActiveTab('data') : connectToDevice(device)}
        disabled={isConnecting || (connecting !== null && !isConnected)}
      >
        <View style={styles.deviceInfo}>
          <View style={styles.deviceIconContainer}>
            {isConnected ? (
              <CircleCheck size={24} color={theme.colors.primary} />
            ) : (
              <Scale size={24} color={theme.colors.text} />
            )}
          </View>
          
          <View style={styles.deviceDetails}>
            <Text style={[styles.deviceName, { color: theme.colors.text }]}>
              {device.name}
            </Text>
            
            {device.manufacturer && (
              <Text style={[styles.deviceManufacturer, { color: theme.colors.textSecondary }]}>
                {device.manufacturer} {device.modelNumber && `• ${device.modelNumber}`}
              </Text>
            )}
            
            {device.lastConnectionTime && (
              <Text style={[styles.deviceLastConnection, { color: theme.colors.textSecondary }]}>
                Last connected: {formatLastConnection(device.lastConnectionTime)}
              </Text>
            )}
          </View>
        </View>
        
        <View style={styles.deviceAction}>
          {isConnecting ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : isConnected ? (
            <View style={styles.connectedBadge}>
              <Text style={[styles.connectedText, { color: theme.colors.primary }]}>Connected</Text>
              <ChevronRight size={16} color={theme.colors.primary} />
            </View>
          ) : (
            <ArrowRight size={20} color={theme.colors.textSecondary} />
          )}
        </View>
      </TouchableOpacity>
    );
  };
  
  const formatLastConnection = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        return `${diffMinutes} minutes ago`;
      }
      return `${diffHours} hours ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else {
      return `${diffDays} days ago`;
    }
  };
  
  const renderDevicesTab = () => {
    const connectedDevice = devices.find(d => d.isConnected);
    
    return (
      <View style={styles.tabContent}>
        {scaleError && (
          <View style={[styles.errorContainer, { backgroundColor: `${theme.colors.danger}20` }]}>
            <AlertTriangle size={20} color={theme.colors.danger} />
            <Text style={[styles.errorText, { color: theme.colors.danger }]}>
              {scaleError}
            </Text>
          </View>
        )}
        
        <View style={styles.scanContainer}>
          {isScanning ? (
            <TouchableOpacity
              style={[styles.scanButton, { backgroundColor: theme.colors.background }]}
              onPress={stopScan}
            >
              <BluetoothSearching size={24} color={theme.colors.primary} style={styles.spinningIcon} />
              <Text style={[styles.scanButtonText, { color: theme.colors.primary }]}>
                Scanning for scales...
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.scanButton, { backgroundColor: theme.colors.primary }]}
              onPress={startScan}
            >
              <Bluetooth size={24} color="#FFFFFF" />
              <Text style={styles.scanButtonText}>
                Scan for Devices
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        {devices.length > 0 ? (
          <FlatList
            data={devices}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => renderDeviceItem(item)}
            contentContainerStyle={styles.devicesList}
          />
        ) : !isScanning ? (
          <View style={styles.emptyStateContainer}>
            <BluetoothOff size={64} color={`${theme.colors.textSecondary}50`} />
            <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
              No scales found
            </Text>
            <Text style={[styles.emptyStateSubtext, { color: theme.colors.textSecondary }]}>
              Make sure your scale is turned on and in pairing mode
            </Text>
          </View>
        ) : (
          <View style={styles.scanningContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.scanningText, { color: theme.colors.text }]}>
              Searching for scales...
            </Text>
          </View>
        )}
        
        {connectedDevice && (
          <View style={styles.connectedDeviceBar}>
            <View style={styles.connectedDeviceInfo}>
              <CircleCheck size={18} color={theme.colors.primary} />
              <Text style={[styles.connectedDeviceText, { color: theme.colors.text }]}>
                Connected to {connectedDevice.name}
              </Text>
            </View>
            
            <TouchableOpacity 
              style={styles.viewDataButton}
              onPress={() => setActiveTab('data')}
            >
              <Text style={[styles.viewDataText, { color: theme.colors.primary }]}>
                View Data
              </Text>
              <ChevronRight size={16} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.devModeContainer}>
          <View style={styles.devModeRow}>
            <Text style={[styles.devModeText, { color: theme.colors.textSecondary }]}>
              Development Mode
            </Text>
            
            <Switch
              value={mockMode}
              onValueChange={setMockMode}
              trackColor={{ false: theme.colors.border, true: `${theme.colors.primary}80` }}
              thumbColor={mockMode ? theme.colors.primary : theme.colors.cardSecondary}
            />
          </View>
          
          <Text style={[styles.devModeExplainer, { color: theme.colors.textSecondary }]}>
            When enabled, mock data will be used instead of real device connections
          </Text>
        </View>
      </View>
    );
  };
  
  const renderDataTab = () => {
    const connectedDevice = devices.find(d => d.isConnected);
    
    if (!connectedDevice) {
      return (
        <View style={styles.noDeviceContainer}>
          <BluetoothOff size={64} color={`${theme.colors.textSecondary}50`} />
          <Text style={[styles.noDeviceText, { color: theme.colors.text }]}>
            No scale connected
          </Text>
          <TouchableOpacity
            style={[styles.connectButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => setActiveTab('devices')}
          >
            <Bluetooth size={20} color="#FFFFFF" />
            <Text style={styles.connectButtonText}>
              Connect a Scale
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return (
      <ScrollView style={styles.dataTabContent} contentContainerStyle={styles.dataTabScrollContent}>
        <View style={[styles.scaleInfoCard, { backgroundColor: theme.colors.card }]}>
          <View style={styles.scaleInfoHeader}>
            <View style={styles.deviceIconContainer}>
              <Scale size={24} color={theme.colors.primary} />
            </View>
            
            <View style={styles.scaleInfoDetails}>
              <Text style={[styles.scaleInfoName, { color: theme.colors.text }]}>
                {connectedDevice.name}
              </Text>
              
              {connectedDevice.manufacturer && (
                <Text style={[styles.scaleInfoManufacturer, { color: theme.colors.textSecondary }]}>
                  {connectedDevice.manufacturer} {connectedDevice.modelNumber && `• ${connectedDevice.modelNumber}`}
                </Text>
              )}
            </View>
          </View>
          
          <TouchableOpacity
            style={[styles.disconnectButton, { borderColor: theme.colors.border }]}
            onPress={disconnectDevice}
          >
            <X size={16} color={theme.colors.danger} />
            <Text style={[styles.disconnectText, { color: theme.colors.danger }]}>
              Disconnect
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={[styles.weightCard, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.weightTitle, { color: theme.colors.textSecondary }]}>
            Current Weight
          </Text>
          
          <Animated.View style={[styles.weightValueContainer, animatedStyle]}>
            <Text style={[styles.weightValue, { color: theme.colors.text }]}>
              {scaleData ? `${scaleData.weight.toFixed(1)}` : '0.0'}
            </Text>
            <Text style={[styles.weightUnit, { color: theme.colors.textSecondary }]}>
              {scaleData?.unit || 'kg'}
            </Text>
          </Animated.View>
          
          {scaleData && (
            <Text style={[styles.measurementTime, { color: theme.colors.textSecondary }]}>
              Last measured: {formatTime(scaleData.timestamp)}
            </Text>
          )}
        </View>
        
        {scaleData && scaleData.bodyFat !== undefined && (
          <View style={styles.bodyCompositionContainer}>
            <Text style={[styles.bodyCompositionTitle, { color: theme.colors.text }]}>
              Body Composition
            </Text>
            
            <View style={styles.bodyCompositionGrid}>
              <View style={[styles.compositionItem, { backgroundColor: theme.colors.card }]}>
                <PercentCircle size={20} color={theme.colors.primary} />
                <Text style={[styles.compositionValue, { color: theme.colors.text }]}>
                  {scaleData.bodyFat?.toFixed(1)}%
                </Text>
                <Text style={[styles.compositionLabel, { color: theme.colors.textSecondary }]}>
                  Body Fat
                </Text>
              </View>
              
              <View style={[styles.compositionItem, { backgroundColor: theme.colors.card }]}>
                <Droplets size={20} color={theme.colors.primary} />
                <Text style={[styles.compositionValue, { color: theme.colors.text }]}>
                  {scaleData.waterPercentage?.toFixed(1)}%
                </Text>
                <Text style={[styles.compositionLabel, { color: theme.colors.textSecondary }]}>
                  Water
                </Text>
              </View>
              
              <View style={[styles.compositionItem, { backgroundColor: theme.colors.card }]}>
                <Dumbbell size={20} color={theme.colors.primary} />
                <Text style={[styles.compositionValue, { color: theme.colors.text }]}>
                  {scaleData.muscleMass?.toFixed(1)}kg
                </Text>
                <Text style={[styles.compositionLabel, { color: theme.colors.textSecondary }]}>
                  Muscle
                </Text>
              </View>
              
              <View style={[styles.compositionItem, { backgroundColor: theme.colors.card }]}>
                <Bone size={20} color={theme.colors.primary} />
                <Text style={[styles.compositionValue, { color: theme.colors.text }]}>
                  {scaleData.boneMass?.toFixed(1)}kg
                </Text>
                <Text style={[styles.compositionLabel, { color: theme.colors.textSecondary }]}>
                  Bone
                </Text>
              </View>
              
              <View style={[styles.compositionItem, { backgroundColor: theme.colors.card }]}>
                <HeartPulse size={20} color={theme.colors.primary} />
                <Text style={[styles.compositionValue, { color: theme.colors.text }]}>
                  {scaleData.bmi?.toFixed(1)}
                </Text>
                <Text style={[styles.compositionLabel, { color: theme.colors.textSecondary }]}>
                  BMI
                </Text>
              </View>
            </View>
          </View>
        )}
        
        <View style={styles.tipsContainer}>
          <Text style={[styles.tipsTitle, { color: theme.colors.text }]}>
            Tips for Accurate Measurement
          </Text>
          
          <View style={[styles.tipItem, { backgroundColor: theme.colors.card }]}>
            <InfoIcon size={20} color={theme.colors.primary} />
            <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
              Always weigh yourself at the same time of day
            </Text>
          </View>
          
          <View style={[styles.tipItem, { backgroundColor: theme.colors.card }]}>
            <InfoIcon size={20} color={theme.colors.primary} />
            <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
              Place scale on a hard, flat surface
            </Text>
          </View>
          
          <View style={[styles.tipItem, { backgroundColor: theme.colors.card }]}>
            <InfoIcon size={20} color={theme.colors.primary} />
            <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
              Stand barefoot on the scale for body composition measurement
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  };
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Text style={[styles.backButtonText, { color: theme.colors.primary }]}>Back</Text>
        </TouchableOpacity>
        
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Smart Scale
        </Text>
        
        <View style={styles.rightPlaceholder} />
      </View>
      
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'devices' && [styles.activeTabButton, { borderBottomColor: theme.colors.primary }]
          ]}
          onPress={() => setActiveTab('devices')}
        >
          <Text style={[
            styles.tabButtonText, 
            { color: theme.colors.textSecondary },
            activeTab === 'devices' && { color: theme.colors.primary }
          ]}>
            Devices
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'data' && [styles.activeTabButton, { borderBottomColor: theme.colors.primary }]
          ]}
          onPress={() => setActiveTab('data')}
          disabled={!devices.some(d => d.isConnected)}
        >
          <Text style={[
            styles.tabButtonText, 
            { color: theme.colors.textSecondary },
            activeTab === 'data' && { color: theme.colors.primary },
            !devices.some(d => d.isConnected) && { color: `${theme.colors.textSecondary}50` }
          ]}>
            Data
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        {activeTab === 'devices' ? renderDevicesTab() : renderDataTab()}
      </View>
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
    paddingTop: 8,
    paddingBottom: 8,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
  },
  title: {
    fontFamily: 'Nunito-Bold',
    fontSize: 20,
  },
  rightPlaceholder: {
    width: 50,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTabButton: {
    borderBottomWidth: 2,
  },
  tabButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  scanContainer: {
    marginBottom: 24,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  scanButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 8,
  },
  spinningIcon: {
    // Spinning animation would be added using Animated in a real app
  },
  devicesList: {
    paddingBottom: 100,
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  deviceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginRight: 12,
  },
  deviceDetails: {
    flex: 1,
  },
  deviceName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    marginBottom: 4,
  },
  deviceManufacturer: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginBottom: 4,
  },
  deviceLastConnection: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
  },
  deviceAction: {
    paddingLeft: 8,
  },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectedText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    marginRight: 4,
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontFamily: 'Nunito-Bold',
    fontSize: 18,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  scanningContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  scanningText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  connectedDeviceBar: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  connectedDeviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectedDeviceText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    marginLeft: 8,
  },
  viewDataButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewDataText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    marginRight: 4,
  },
  devModeContainer: {
    marginTop: 32,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 16,
  },
  devModeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  devModeText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  devModeExplainer: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
  },
  dataTabContent: {
    flex: 1,
  },
  dataTabScrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  noDeviceContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  noDeviceText: {
    fontFamily: 'Nunito-Bold',
    fontSize: 18,
    marginTop: 16,
    marginBottom: 24,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  connectButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 8,
  },
  scaleInfoCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  scaleInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  scaleInfoDetails: {
    flex: 1,
  },
  scaleInfoName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    marginBottom: 4,
  },
  scaleInfoManufacturer: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  disconnectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  disconnectText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    marginLeft: 8,
  },
  weightCard: {
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
  },
  weightTitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    marginBottom: 16,
  },
  weightValueContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  weightValue: {
    fontFamily: 'Nunito-Bold',
    fontSize: 48,
  },
  weightUnit: {
    fontFamily: 'Inter-Regular',
    fontSize: 20,
    marginBottom: 8,
    marginLeft: 4,
  },
  measurementTime: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
  },
  bodyCompositionContainer: {
    marginBottom: 24,
  },
  bodyCompositionTitle: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 18,
    marginBottom: 16,
  },
  bodyCompositionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  compositionItem: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  compositionValue: {
    fontFamily: 'Nunito-Bold',
    fontSize: 20,
    marginVertical: 8,
  },
  compositionLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  tipsContainer: {
    marginBottom: 24,
  },
  tipsTitle: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 18,
    marginBottom: 16,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  tipText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
}); 