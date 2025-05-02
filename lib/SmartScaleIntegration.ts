import { Platform } from 'react-native';
import { BleManager, Device } from 'react-native-ble-plx';
import { EventEmitter } from 'events';

// For mocking in development
const MOCK_ENABLED = true;

// Types
export interface ScaleData {
  weight: number;
  unit: 'kg' | 'lb';
  timestamp: Date;
  impedance?: number;
  bodyFat?: number;
  muscleMass?: number;
  waterPercentage?: number;
  boneMass?: number;
  bmi?: number;
}

export interface ScaleDevice {
  id: string;
  name: string;
  manufacturer?: string;
  modelNumber?: string;
  isConnected: boolean;
  lastConnectionTime?: Date;
  lastWeight?: number;
}

// Service and characteristic UUIDs for common smart scales
// These would need to be adjusted for specific scale models
const SCALE_SERVICE_UUID = '0000181b-0000-1000-8000-00805f9b34fb'; // Weight Scale Service
const WEIGHT_CHARACTERISTIC = '00002a9c-0000-1000-8000-00805f9b34fb'; // Weight Measurement
const BODY_COMPOSITION_SERVICE = '0000181c-0000-1000-8000-00805f9b34fb'; // Body Composition Service
const BODY_COMPOSITION_CHARACTERISTIC = '00002a9c-0000-1000-8000-00805f9b34fb'; // Body Composition Measurement

export class SmartScaleIntegration extends EventEmitter {
  private bleManager: BleManager | null = null;
  private isScanning: boolean = false;
  private devices: Map<string, ScaleDevice> = new Map();
  private connectedDevice: Device | null = null;
  private lastScaleData: ScaleData | null = null;
  private mockDevices: ScaleDevice[] = [];
  
  constructor() {
    super();
    
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      this.bleManager = new BleManager();
    }
    
    // Setup mock devices for development
    if (MOCK_ENABLED) {
      this.setupMockDevices();
    }
  }
  
  private setupMockDevices() {
    this.mockDevices = [
      {
        id: 'mock-scale-01',
        name: 'SmartFit Scale Pro',
        manufacturer: 'NutriTech',
        modelNumber: 'FS-500',
        isConnected: false,
        lastConnectionTime: new Date(Date.now() - 86400000 * 3), // 3 days ago
        lastWeight: 76.4
      },
      {
        id: 'mock-scale-02',
        name: 'HealthTrack Scale',
        manufacturer: 'FitSmart',
        modelNumber: 'HS-200',
        isConnected: false
      },
      {
        id: 'mock-scale-03',
        name: 'EcoWeigh Smart',
        manufacturer: 'GreenHealth',
        modelNumber: 'EW-100',
        isConnected: false,
        lastConnectionTime: new Date(Date.now() - 86400000 * 10), // 10 days ago
        lastWeight: 77.1
      }
    ];
  }
  
  /**
   * Start scanning for Bluetooth devices
   */
  public async startScan(timeoutMs: number = 10000): Promise<void> {
    if (this.isScanning) {
      throw new Error('Already scanning for devices');
    }
    
    if (MOCK_ENABLED) {
      this.isScanning = true;
      this.emit('scanStart');
      
      // Simulate finding devices
      setTimeout(() => {
        this.mockDevices.forEach(device => {
          this.devices.set(device.id, device);
          this.emit('deviceFound', device);
        });
      }, 1500);
      
      // Simulate scan timeout
      setTimeout(() => {
        this.isScanning = false;
        this.emit('scanEnd');
      }, Math.min(timeoutMs, 5000));
      
      return;
    }
    
    if (!this.bleManager) {
      throw new Error('Bluetooth not supported on this platform');
    }
    
    try {
      this.isScanning = true;
      this.emit('scanStart');
      
      // Check if Bluetooth is powered on
      const state = await this.bleManager.state();
      if (state !== 'PoweredOn') {
        throw new Error('Bluetooth is not powered on');
      }
      
      // Start scanning with specific services for scales
      this.bleManager.startDeviceScan(
        [SCALE_SERVICE_UUID, BODY_COMPOSITION_SERVICE], 
        { allowDuplicates: false },
        (error, device) => {
          if (error) {
            this.emit('error', error);
            this.stopScan();
            return;
          }
          
          if (device && device.name) {
            const scaleDevice: ScaleDevice = {
              id: device.id,
              name: device.name || 'Unknown Scale',
              isConnected: false
            };
            
            this.devices.set(device.id, scaleDevice);
            this.emit('deviceFound', scaleDevice);
          }
        }
      );
      
      // Stop scanning after timeout
      setTimeout(() => {
        this.stopScan();
      }, timeoutMs);
      
    } catch (error) {
      this.isScanning = false;
      throw error;
    }
  }
  
  /**
   * Stop scanning for devices
   */
  public stopScan(): void {
    if (!this.isScanning) {
      return;
    }
    
    if (MOCK_ENABLED) {
      this.isScanning = false;
      this.emit('scanEnd');
      return;
    }
    
    if (this.bleManager) {
      this.bleManager.stopDeviceScan();
      this.isScanning = false;
      this.emit('scanEnd');
    }
  }
  
  /**
   * Connect to a specific scale device
   */
  public async connectToDevice(deviceId: string): Promise<void> {
    if (MOCK_ENABLED) {
      const mockDevice = this.mockDevices.find(d => d.id === deviceId);
      if (!mockDevice) {
        throw new Error('Device not found');
      }
      
      this.emit('connecting', mockDevice);
      
      // Simulate connection time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      mockDevice.isConnected = true;
      mockDevice.lastConnectionTime = new Date();
      this.devices.set(deviceId, mockDevice);
      
      this.emit('connected', mockDevice);
      return;
    }
    
    if (!this.bleManager) {
      throw new Error('Bluetooth not supported on this platform');
    }
    
    try {
      const device = await this.bleManager.connectToDevice(deviceId);
      this.emit('connecting', this.devices.get(deviceId));
      
      await device.discoverAllServicesAndCharacteristics();
      this.connectedDevice = device;
      
      const scaleDevice = this.devices.get(deviceId);
      if (scaleDevice) {
        scaleDevice.isConnected = true;
        scaleDevice.lastConnectionTime = new Date();
        this.devices.set(deviceId, scaleDevice);
      }
      
      this.emit('connected', scaleDevice);
      
      // Setup notification for weight changes
      device.monitorCharacteristicForService(
        SCALE_SERVICE_UUID,
        WEIGHT_CHARACTERISTIC,
        (error, characteristic) => {
          if (error) {
            this.emit('error', error);
            return;
          }
          
          if (characteristic?.value) {
            const data = this.parseWeightData(characteristic.value);
            if (data) {
              this.lastScaleData = data;
              this.emit('weightData', data);
              
              // Update last weight in device info
              const device = this.devices.get(deviceId);
              if (device) {
                device.lastWeight = data.weight;
                this.devices.set(deviceId, device);
              }
            }
          }
        }
      );
      
      // Setup notification for body composition if available
      device.monitorCharacteristicForService(
        BODY_COMPOSITION_SERVICE,
        BODY_COMPOSITION_CHARACTERISTIC,
        (error, characteristic) => {
          if (error) {
            return; // Just ignore if not supported
          }
          
          if (characteristic?.value) {
            const data = this.parseBodyCompositionData(characteristic.value);
            if (data && this.lastScaleData) {
              this.lastScaleData = { ...this.lastScaleData, ...data };
              this.emit('bodyCompositionData', this.lastScaleData);
            }
          }
        }
      );
      
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }
  
  /**
   * Disconnect from the current device
   */
  public async disconnectDevice(): Promise<void> {
    if (MOCK_ENABLED) {
      const connectedMockDevice = this.mockDevices.find(d => d.isConnected);
      if (connectedMockDevice) {
        connectedMockDevice.isConnected = false;
        this.devices.set(connectedMockDevice.id, connectedMockDevice);
        this.emit('disconnected', connectedMockDevice);
      }
      return;
    }
    
    if (!this.connectedDevice) {
      return;
    }
    
    try {
      await this.connectedDevice.cancelConnection();
      
      const deviceId = this.connectedDevice.id;
      const device = this.devices.get(deviceId);
      if (device) {
        device.isConnected = false;
        this.devices.set(deviceId, device);
        this.emit('disconnected', device);
      }
      
      this.connectedDevice = null;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }
  
  /**
   * Get list of discovered devices
   */
  public getDiscoveredDevices(): ScaleDevice[] {
    return Array.from(this.devices.values());
  }
  
  /**
   * Get device by ID
   */
  public getDeviceById(id: string): ScaleDevice | undefined {
    return this.devices.get(id);
  }
  
  /**
   * Get the latest scale data
   */
  public getLatestData(): ScaleData | null {
    if (MOCK_ENABLED && !this.lastScaleData) {
      // Create mock data if needed
      const connectedDevice = this.mockDevices.find(d => d.isConnected);
      if (connectedDevice && connectedDevice.lastWeight) {
        this.lastScaleData = {
          weight: connectedDevice.lastWeight,
          unit: 'kg',
          timestamp: new Date(),
          bodyFat: 18.5,
          waterPercentage: 55.3,
          muscleMass: 40.2,
          boneMass: 3.1,
          bmi: 24.3
        };
        
        setTimeout(() => {
          this.emit('weightData', this.lastScaleData);
          this.emit('bodyCompositionData', this.lastScaleData);
        }, 500);
      }
    }
    
    return this.lastScaleData;
  }
  
  /**
   * Check if the device supports body composition
   */
  public async supportsBodyComposition(deviceId: string): Promise<boolean> {
    if (MOCK_ENABLED) {
      return true; // All mock devices support body composition
    }
    
    if (!this.bleManager || !this.connectedDevice) {
      return false;
    }
    
    try {
      const services = await this.connectedDevice.services();
      return services.some(service => service.uuid === BODY_COMPOSITION_SERVICE);
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Parse raw weight data from the device
   */
  private parseWeightData(value: string): ScaleData | null {
    // In a real application, you would parse the actual byte data from the characteristic
    // This is highly dependent on the specific scale model
    
    if (MOCK_ENABLED) {
      // Generate random weight for mock device
      const connectedDevice = this.mockDevices.find(d => d.isConnected);
      const baseWeight = connectedDevice?.lastWeight || 75.0;
      const weight = baseWeight + (Math.random() * 0.6 - 0.3); // Fluctuate by ±0.3 kg
      
      return {
        weight: parseFloat(weight.toFixed(1)),
        unit: 'kg',
        timestamp: new Date()
      };
    }
    
    try {
      // Actual parsing would depend on the scale's protocol
      // This is a placeholder for real implementation
      const buffer = Buffer.from(value, 'base64');
      
      // Example parsing for a generic scale format
      // Real implementation would follow the specific scale's protocol
      // const flags = buffer.readUInt8(0);
      // const isImperial = (flags & 0x01) !== 0;
      // const hasTimestamp = (flags & 0x02) !== 0;
      // const weightValue = buffer.readUInt16LE(1) / 100; // assuming weight in 0.01 kg/lb units
      
      // For demonstration purposes:
      const weightValue = 75.5; // placeholder
      
      return {
        weight: weightValue,
        unit: 'kg',
        timestamp: new Date()
      };
    } catch (error) {
      this.emit('error', error);
      return null;
    }
  }
  
  /**
   * Parse body composition data from the device
   */
  private parseBodyCompositionData(value: string): Partial<ScaleData> | null {
    // In a real application, this would parse the actual body composition data
    // Format is highly specific to each scale model
    
    if (MOCK_ENABLED) {
      return {
        bodyFat: 18.5 + (Math.random() * 1.0 - 0.5),
        waterPercentage: 55.3 + (Math.random() * 1.0 - 0.5),
        muscleMass: 40.2 + (Math.random() * 0.6 - 0.3),
        boneMass: 3.1 + (Math.random() * 0.2 - 0.1),
        bmi: 24.3 + (Math.random() * 0.4 - 0.2)
      };
    }
    
    try {
      // Placeholder for real implementation
      return {
        bodyFat: 18.5,
        waterPercentage: 55.3,
        muscleMass: 40.2,
        boneMass: 3.1,
        bmi: 24.3
      };
    } catch (error) {
      this.emit('error', error);
      return null;
    }
  }
  
  /**
   * Clean up resources
   */
  public destroy(): void {
    this.stopScan();
    
    if (this.connectedDevice) {
      this.connectedDevice.cancelConnection();
      this.connectedDevice = null;
    }
    
    if (this.bleManager) {
      this.bleManager.destroy();
      this.bleManager = null;
    }
  }
}

// Create a singleton instance
export const smartScaleIntegration = new SmartScaleIntegration(); 