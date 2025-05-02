/**
 * Returns a greeting based on the time of day
 */
export function getGreeting(): string {
  const hours = new Date().getHours();
  
  if (hours < 12) {
    return 'Good morning,';
  } else if (hours < 18) {
    return 'Good afternoon,';
  } else {
    return 'Good evening,';
  }
}

/**
 * Format a number with commas for thousands
 */
export function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Calculate percentage of a value against a total
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

/**
 * Format a date to a readable string
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Calculate BMI
 */
export function calculateBMI(weight: number, height: number): number {
  // Weight in kg, height in cm
  const heightInMeters = height / 100;
  return parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(1));
}

/**
 * Get BMI category
 */
export function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}

/**
 * Calculate daily calorie needs (using Mifflin-St Jeor Equation)
 */
export function calculateCalorieNeeds(
  weight: number, // kg
  height: number, // cm
  age: number, 
  gender: 'male' | 'female', 
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
): number {
  let bmr = 0;
  
  if (gender === 'male') {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }
  
  const activityMultipliers = {
    sedentary: 1.2,      // Little or no exercise
    light: 1.375,        // Light exercise 1-3 days/week
    moderate: 1.55,      // Moderate exercise 3-5 days/week
    active: 1.725,       // Heavy exercise 6-7 days/week
    very_active: 1.9     // Very heavy exercise, physical job or training twice a day
  };
  
  return Math.round(bmr * activityMultipliers[activityLevel]);
}