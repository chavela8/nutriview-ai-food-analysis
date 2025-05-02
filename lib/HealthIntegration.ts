import { Platform } from 'react-native';
import AppleHealthKit, { 
  HealthInputOptions, 
  HealthKitPermissions,
  HealthUnit,
  HealthValue,
  HealthActivitySummary,
  HealthDateOfBirth,
  AppleHealthKit as HealthKit
} from 'react-native-health';

// Define the data structure for nutrition data
export interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  cholesterol?: number;
  date: string;
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

// Structure for activity data
export interface ActivityData {
  activeEnergyBurned: number;
  steps: number;
  exerciseMinutes: number;
  standHours: number;
  date: string;
}

// Structure for water intake data
export interface WaterData {
  amount: number; // in ml
  date: string;
}

// User profile data from health sources
export interface HealthProfile {
  height?: number; // in cm
  weight?: number; // in kg
  dateOfBirth?: string;
  biologicalSex?: string;
  bloodType?: string;
}

// Available scopes for Apple Health permissions
const healthKitOptions: HealthKitPermissions = {
  permissions: {
    read: [
      HealthKit.Constants.Permissions.ActiveEnergyBurned,
      HealthKit.Constants.Permissions.StepCount,
      HealthKit.Constants.Permissions.FlightsClimbed,
      HealthKit.Constants.Permissions.DistanceWalkingRunning,
      HealthKit.Constants.Permissions.ExerciseMinutes,
      HealthKit.Constants.Permissions.Height,
      HealthKit.Constants.Permissions.BodyMass,
      HealthKit.Constants.Permissions.DateOfBirth,
      HealthKit.Constants.Permissions.BiologicalSex,
      HealthKit.Constants.Permissions.BloodType,
      HealthKit.Constants.Permissions.DietaryWater,
      HealthKit.Constants.Permissions.DietaryEnergyConsumed,
      HealthKit.Constants.Permissions.DietaryProtein,
      HealthKit.Constants.Permissions.DietaryFatTotal,
      HealthKit.Constants.Permissions.DietaryCarbohydrates,
      HealthKit.Constants.Permissions.DietaryFiber,
      HealthKit.Constants.Permissions.DietarySugar,
      HealthKit.Constants.Permissions.DietarySodium,
      HealthKit.Constants.Permissions.DietaryCholesterol,
    ],
    write: [
      HealthKit.Constants.Permissions.ActiveEnergyBurned,
      HealthKit.Constants.Permissions.StepCount,
      HealthKit.Constants.Permissions.DietaryWater,
      HealthKit.Constants.Permissions.DietaryEnergyConsumed,
      HealthKit.Constants.Permissions.DietaryProtein,
      HealthKit.Constants.Permissions.DietaryFatTotal,
      HealthKit.Constants.Permissions.DietaryCarbohydrates,
      HealthKit.Constants.Permissions.DietaryFiber,
      HealthKit.Constants.Permissions.DietarySugar,
      HealthKit.Constants.Permissions.DietarySodium,
      HealthKit.Constants.Permissions.DietaryCholesterol,
    ],
  },
};

/**
 * HealthIntegration class to manage interactions with health platforms
 */
export class HealthIntegration {
  private isAvailable: boolean = false;
  private isAuthorized: boolean = false;

  constructor() {
    // Check if HealthKit is available (iOS only)
    this.isAvailable = Platform.OS === 'ios';
  }

  /**
   * Request permissions to access health data
   * @returns Promise<boolean> indicating if authorization was successful
   */
  public async requestAuthorization(): Promise<boolean> {
    if (!this.isAvailable) {
      console.log('HealthKit is not available on this device');
      return false;
    }

    try {
      await AppleHealthKit.initHealthKit(healthKitOptions);
      this.isAuthorized = true;
      return true;
    } catch (error) {
      console.error('Error initializing HealthKit:', error);
      return false;
    }
  }

  /**
   * Check if health integration is available and authorized
   * @returns boolean indicating if health integration can be used
   */
  public isReady(): boolean {
    return this.isAvailable && this.isAuthorized;
  }

  /**
   * Get user's health profile information
   * @returns Promise<HealthProfile> with user's health profile data
   */
  public async getHealthProfile(): Promise<HealthProfile> {
    if (!this.isReady()) {
      console.warn('Health integration is not ready');
      return {};
    }

    try {
      const profile: HealthProfile = {};
      
      // Get height
      const heightOptions = { unit: HealthUnit.Centimeter };
      const heightResponse = await AppleHealthKit.getLatestHeight(heightOptions);
      profile.height = heightResponse.value;
      
      // Get weight
      const weightOptions = { unit: HealthUnit.Kilogram };
      const weightResponse = await AppleHealthKit.getLatestWeight(weightOptions);
      profile.weight = weightResponse.value;
      
      // Get date of birth
      const dateOfBirthResponse: HealthDateOfBirth = await AppleHealthKit.getDateOfBirth({});
      if (dateOfBirthResponse) {
        const { day, month, year } = dateOfBirthResponse;
        profile.dateOfBirth = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      }
      
      // Get biological sex
      const biologicalSexResponse = await AppleHealthKit.getBiologicalSex();
      if (biologicalSexResponse && biologicalSexResponse.value) {
        const sexMap = {
          0: 'Unknown',
          1: 'Female',
          2: 'Male',
          3: 'Other'
        };
        profile.biologicalSex = sexMap[biologicalSexResponse.value];
      }
      
      // Get blood type
      const bloodTypeResponse = await AppleHealthKit.getBloodType();
      if (bloodTypeResponse && bloodTypeResponse.value) {
        const bloodTypeMap = {
          0: 'Unknown',
          1: 'A+',
          2: 'A-',
          3: 'B+',
          4: 'B-',
          5: 'AB+',
          6: 'AB-',
          7: 'O+',
          8: 'O-'
        };
        profile.bloodType = bloodTypeMap[bloodTypeResponse.value];
      }
      
      return profile;
    } catch (error) {
      console.error('Error getting health profile:', error);
      return {};
    }
  }

  /**
   * Get activity data for a specific date range
   * @param startDate Start date as ISO string
   * @param endDate End date as ISO string
   * @returns Promise<ActivityData[]> with activity data for the date range
   */
  public async getActivityData(startDate: string, endDate: string): Promise<ActivityData[]> {
    if (!this.isReady()) {
      console.warn('Health integration is not ready');
      return [];
    }

    try {
      const options = {
        startDate,
        endDate,
      };
      
      // Get active energy burned
      const energyBurnedResponse = await AppleHealthKit.getDailyEnergyBurned(options);
      
      // Get step count
      const stepCountResponse = await AppleHealthKit.getDailyStepCount(options);
      
      // Get exercise minutes
      const exerciseTimeOptions = {
        ...options,
        type: 'Walking', // can be any exercise type
      };
      const exerciseMinutesResponse = await AppleHealthKit.getExerciseTime(exerciseTimeOptions);
      
      // Get activity summary (stand hours, etc.)
      const activitySummaryResponse = await AppleHealthKit.getActivitySummary(options);
      
      // Combine all data into a structured format by date
      const activityDataMap = new Map<string, ActivityData>();
      
      // Process energy burned data
      energyBurnedResponse.forEach(item => {
        const date = new Date(item.startDate).toISOString().split('T')[0];
        
        if (!activityDataMap.has(date)) {
          activityDataMap.set(date, {
            activeEnergyBurned: 0,
            steps: 0,
            exerciseMinutes: 0,
            standHours: 0,
            date,
          });
        }
        
        const existingData = activityDataMap.get(date);
        existingData.activeEnergyBurned += item.value;
      });
      
      // Process step count data
      stepCountResponse.forEach(item => {
        const date = new Date(item.startDate).toISOString().split('T')[0];
        
        if (!activityDataMap.has(date)) {
          activityDataMap.set(date, {
            activeEnergyBurned: 0,
            steps: 0,
            exerciseMinutes: 0,
            standHours: 0,
            date,
          });
        }
        
        const existingData = activityDataMap.get(date);
        existingData.steps += item.value;
      });
      
      // Process exercise minutes data
      exerciseMinutesResponse.forEach(item => {
        const date = new Date(item.startDate).toISOString().split('T')[0];
        
        if (!activityDataMap.has(date)) {
          activityDataMap.set(date, {
            activeEnergyBurned: 0,
            steps: 0,
            exerciseMinutes: 0,
            standHours: 0,
            date,
          });
        }
        
        const existingData = activityDataMap.get(date);
        existingData.exerciseMinutes += item.value;
      });
      
      // Process activity summary data (stand hours)
      activitySummaryResponse.forEach(item => {
        const date = new Date(item.startDate).toISOString().split('T')[0];
        
        if (!activityDataMap.has(date)) {
          activityDataMap.set(date, {
            activeEnergyBurned: 0,
            steps: 0,
            exerciseMinutes: 0,
            standHours: 0,
            date,
          });
        }
        
        const existingData = activityDataMap.get(date);
        existingData.standHours += item.standhours || 0;
      });
      
      // Convert map to array and return
      return Array.from(activityDataMap.values());
    } catch (error) {
      console.error('Error getting activity data:', error);
      return [];
    }
  }

  /**
   * Get nutrition data for a specific date range
   * @param startDate Start date as ISO string
   * @param endDate End date as ISO string
   * @returns Promise<NutritionData[]> with nutrition data for the date range
   */
  public async getNutritionData(startDate: string, endDate: string): Promise<NutritionData[]> {
    if (!this.isReady()) {
      console.warn('Health integration is not ready');
      return [];
    }

    try {
      const options = {
        startDate,
        endDate,
      };
      
      // Get calories
      const caloriesResponse = await AppleHealthKit.getDailyCaloriesConsumed(options);
      
      // Get protein
      const proteinOptions = {
        ...options,
        unit: HealthUnit.Gram,
      };
      const proteinResponse = await AppleHealthKit.getDailyProtein(proteinOptions);
      
      // Get carbs
      const carbsOptions = {
        ...options,
        unit: HealthUnit.Gram,
      };
      const carbsResponse = await AppleHealthKit.getDailyCarbohydrates(carbsOptions);
      
      // Get fat
      const fatOptions = {
        ...options,
        unit: HealthUnit.Gram,
      };
      const fatResponse = await AppleHealthKit.getDailyFatTotal(fatOptions);
      
      // Get fiber
      const fiberOptions = {
        ...options,
        unit: HealthUnit.Gram,
      };
      const fiberResponse = await AppleHealthKit.getDailyDietaryFiber(fiberOptions);
      
      // Get sugar
      const sugarOptions = {
        ...options,
        unit: HealthUnit.Gram,
      };
      const sugarResponse = await AppleHealthKit.getDailyDietarySugar(sugarOptions);
      
      // Get sodium
      const sodiumOptions = {
        ...options,
        unit: HealthUnit.Milligram,
      };
      const sodiumResponse = await AppleHealthKit.getDailyDietarySodium(sodiumOptions);
      
      // Get cholesterol
      const cholesterolOptions = {
        ...options,
        unit: HealthUnit.Milligram,
      };
      const cholesterolResponse = await AppleHealthKit.getDailyDietaryCholesterol(cholesterolOptions);
      
      // Combine all data into a structured format by date
      const nutritionDataMap = new Map<string, NutritionData>();
      
      // Process calories data
      caloriesResponse.forEach(item => {
        const date = new Date(item.startDate).toISOString().split('T')[0];
        
        if (!nutritionDataMap.has(date)) {
          nutritionDataMap.set(date, {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            fiber: 0,
            sugar: 0,
            sodium: 0,
            cholesterol: 0,
            date,
          });
        }
        
        const existingData = nutritionDataMap.get(date);
        existingData.calories += item.value;
      });
      
      // Process protein data
      proteinResponse.forEach(item => {
        const date = new Date(item.startDate).toISOString().split('T')[0];
        
        if (!nutritionDataMap.has(date)) {
          nutritionDataMap.set(date, {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            fiber: 0,
            sugar: 0,
            sodium: 0,
            cholesterol: 0,
            date,
          });
        }
        
        const existingData = nutritionDataMap.get(date);
        existingData.protein += item.value;
      });
      
      // Process carbs data
      carbsResponse.forEach(item => {
        const date = new Date(item.startDate).toISOString().split('T')[0];
        
        if (!nutritionDataMap.has(date)) {
          nutritionDataMap.set(date, {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            fiber: 0,
            sugar: 0,
            sodium: 0,
            cholesterol: 0,
            date,
          });
        }
        
        const existingData = nutritionDataMap.get(date);
        existingData.carbs += item.value;
      });
      
      // Process fat data
      fatResponse.forEach(item => {
        const date = new Date(item.startDate).toISOString().split('T')[0];
        
        if (!nutritionDataMap.has(date)) {
          nutritionDataMap.set(date, {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            fiber: 0,
            sugar: 0,
            sodium: 0,
            cholesterol: 0,
            date,
          });
        }
        
        const existingData = nutritionDataMap.get(date);
        existingData.fat += item.value;
      });
      
      // Process fiber data
      fiberResponse.forEach(item => {
        const date = new Date(item.startDate).toISOString().split('T')[0];
        
        if (!nutritionDataMap.has(date)) {
          nutritionDataMap.set(date, {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            fiber: 0,
            sugar: 0,
            sodium: 0,
            cholesterol: 0,
            date,
          });
        }
        
        const existingData = nutritionDataMap.get(date);
        existingData.fiber += item.value;
      });
      
      // Process sugar data
      sugarResponse.forEach(item => {
        const date = new Date(item.startDate).toISOString().split('T')[0];
        
        if (!nutritionDataMap.has(date)) {
          nutritionDataMap.set(date, {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            fiber: 0,
            sugar: 0,
            sodium: 0,
            cholesterol: 0,
            date,
          });
        }
        
        const existingData = nutritionDataMap.get(date);
        existingData.sugar += item.value;
      });
      
      // Process sodium data
      sodiumResponse.forEach(item => {
        const date = new Date(item.startDate).toISOString().split('T')[0];
        
        if (!nutritionDataMap.has(date)) {
          nutritionDataMap.set(date, {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            fiber: 0,
            sugar: 0,
            sodium: 0,
            cholesterol: 0,
            date,
          });
        }
        
        const existingData = nutritionDataMap.get(date);
        existingData.sodium += item.value;
      });
      
      // Process cholesterol data
      cholesterolResponse.forEach(item => {
        const date = new Date(item.startDate).toISOString().split('T')[0];
        
        if (!nutritionDataMap.has(date)) {
          nutritionDataMap.set(date, {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            fiber: 0,
            sugar: 0,
            sodium: 0,
            cholesterol: 0,
            date,
          });
        }
        
        const existingData = nutritionDataMap.get(date);
        existingData.cholesterol += item.value;
      });
      
      // Convert map to array and return
      return Array.from(nutritionDataMap.values());
    } catch (error) {
      console.error('Error getting nutrition data:', error);
      return [];
    }
  }

  /**
   * Get water intake data for a specific date range
   * @param startDate Start date as ISO string
   * @param endDate End date as ISO string
   * @returns Promise<WaterData[]> with water intake data for the date range
   */
  public async getWaterData(startDate: string, endDate: string): Promise<WaterData[]> {
    if (!this.isReady()) {
      console.warn('Health integration is not ready');
      return [];
    }

    try {
      const options = {
        startDate,
        endDate,
        unit: HealthUnit.Milliliter,
      };
      
      // Get water intake data
      const waterResponse = await AppleHealthKit.getDailyWater(options);
      
      // Map data to desired format
      return waterResponse.map(item => ({
        amount: item.value,
        date: new Date(item.startDate).toISOString().split('T')[0],
      }));
    } catch (error) {
      console.error('Error getting water data:', error);
      return [];
    }
  }

  /**
   * Save nutrition data to HealthKit
   * @param data NutritionData object to save
   * @returns Promise<boolean> indicating if save was successful
   */
  public async saveNutritionData(data: NutritionData): Promise<boolean> {
    if (!this.isReady()) {
      console.warn('Health integration is not ready');
      return false;
    }

    try {
      const isoDate = new Date(data.date).toISOString();
      
      // Save calories
      if (data.calories > 0) {
        await AppleHealthKit.saveCalories({
          value: data.calories,
          startDate: isoDate,
          endDate: isoDate,
        });
      }
      
      // Save protein
      if (data.protein > 0) {
        await AppleHealthKit.saveProtein({
          value: data.protein,
          startDate: isoDate,
          endDate: isoDate,
          unit: HealthUnit.Gram,
        });
      }
      
      // Save carbs
      if (data.carbs > 0) {
        await AppleHealthKit.saveCarbohydrates({
          value: data.carbs,
          startDate: isoDate,
          endDate: isoDate,
          unit: HealthUnit.Gram,
        });
      }
      
      // Save fat
      if (data.fat > 0) {
        await AppleHealthKit.saveFatTotal({
          value: data.fat,
          startDate: isoDate,
          endDate: isoDate,
          unit: HealthUnit.Gram,
        });
      }
      
      // Save fiber if provided
      if (data.fiber && data.fiber > 0) {
        await AppleHealthKit.saveDietaryFiber({
          value: data.fiber,
          startDate: isoDate,
          endDate: isoDate,
          unit: HealthUnit.Gram,
        });
      }
      
      // Save sugar if provided
      if (data.sugar && data.sugar > 0) {
        await AppleHealthKit.saveDietarySugar({
          value: data.sugar,
          startDate: isoDate,
          endDate: isoDate,
          unit: HealthUnit.Gram,
        });
      }
      
      // Save sodium if provided
      if (data.sodium && data.sodium > 0) {
        await AppleHealthKit.saveDietarySodium({
          value: data.sodium,
          startDate: isoDate,
          endDate: isoDate,
          unit: HealthUnit.Milligram,
        });
      }
      
      // Save cholesterol if provided
      if (data.cholesterol && data.cholesterol > 0) {
        await AppleHealthKit.saveDietaryCholesterol({
          value: data.cholesterol,
          startDate: isoDate,
          endDate: isoDate,
          unit: HealthUnit.Milligram,
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error saving nutrition data:', error);
      return false;
    }
  }

  /**
   * Save water intake data to HealthKit
   * @param data WaterData object to save
   * @returns Promise<boolean> indicating if save was successful
   */
  public async saveWaterData(data: WaterData): Promise<boolean> {
    if (!this.isReady()) {
      console.warn('Health integration is not ready');
      return false;
    }

    try {
      const isoDate = new Date(data.date).toISOString();
      
      // Save water intake
      await AppleHealthKit.saveWater({
        value: data.amount,
        startDate: isoDate,
        endDate: isoDate,
        unit: HealthUnit.Milliliter,
      });
      
      return true;
    } catch (error) {
      console.error('Error saving water data:', error);
      return false;
    }
  }

  /**
   * Save activity data to HealthKit
   * @param steps Number of steps to save
   * @param activeEnergyBurned Active energy burned in calories
   * @param date Date string in ISO format
   * @returns Promise<boolean> indicating if save was successful
   */
  public async saveActivityData(steps: number, activeEnergyBurned: number, date: string): Promise<boolean> {
    if (!this.isReady()) {
      console.warn('Health integration is not ready');
      return false;
    }

    try {
      const isoDate = new Date(date).toISOString();
      
      // Save steps
      if (steps > 0) {
        await AppleHealthKit.saveSteps({
          value: steps,
          startDate: isoDate,
          endDate: isoDate,
        });
      }
      
      // Save active energy burned
      if (activeEnergyBurned > 0) {
        await AppleHealthKit.saveActiveEnergyBurned({
          value: activeEnergyBurned,
          startDate: isoDate,
          endDate: isoDate,
          unit: HealthUnit.Kilocalorie,
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error saving activity data:', error);
      return false;
    }
  }
}

// Create a singleton instance of the health integration
const healthIntegration = new HealthIntegration();

export default healthIntegration;