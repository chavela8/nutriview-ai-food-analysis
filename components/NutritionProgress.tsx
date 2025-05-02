import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { calculatePercentage } from '@/utils/helpers';

type NutritionProgressProps = {
  value: number;
  total: number;
  title: string;
  color: string;
  unit?: string;
};

export function NutritionProgress({ value, total, title, color, unit = '' }: NutritionProgressProps) {
  const percentage = calculatePercentage(value, total);
  
  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.value}>
          {value}{unit} / {total}{unit}
        </Text>
      </View>
      
      <View style={styles.progressBarContainer}>
        <View 
          style={[
            styles.progressBar, 
            { 
              width: `${Math.min(percentage, 100)}%`,
              backgroundColor: color 
            }
          ]} 
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  title: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#718096',
  },
  value: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#718096',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  }
});