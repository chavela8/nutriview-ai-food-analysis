export interface UserProfile {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  weight: number; // в кг
  height: number; // в см
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'high' | 'extreme';
  goals: string[]; // например, 'weight_loss', 'muscle_gain', 'endurance'
  healthConditions: string[]; // например, 'hypertension', 'diabetes'
  dietaryPreferences: string[]; // например, 'vegetarian', 'low_carb'
  allergies?: string[]; // аллергены
  stressLevel?: number; // от 1 до 10
  sleepTarget?: number; // целевые часы сна
  dailyStepsTarget?: number; // целевое количество шагов
  waterIntakeTarget?: number; // целевое потребление воды (мл)
  created: string; // ISO дата создания
  updated: string; // ISO дата обновления
}
