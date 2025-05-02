import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { calculatePercentage } from '@/utils/helpers';
import { ThemeType } from '@/utils/theme';

type DailyGoalProps = {
  icon: React.ReactNode;
  title: string;
  current: number;
  target: number;
  unit: string;
  color: string;
  theme: ThemeType;
};

export function DailyGoal({ icon, title, current, target, unit, color, theme }: DailyGoalProps) {
  const percentage = calculatePercentage(current, target);
  
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.card }]}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
          {icon}
        </View>
        <View>
          <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
          <Text style={[styles.progress, { color: theme.colors.textSecondary }]}>
            {current} of {target} {unit}
          </Text>
        </View>
      </View>
      
      <View style={[styles.progressBarContainer, { backgroundColor: theme.colors.border }]}>
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
    borderRadius: 16,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  title: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
  },
  progress: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginTop: 2,
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  }
});