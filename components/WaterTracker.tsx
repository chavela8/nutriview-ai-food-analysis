import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemeType } from '@/utils/theme';
import Svg, { Circle } from 'react-native-svg';
import { Droplets } from 'lucide-react-native';

type WaterTrackerProps = {
  currentIntake: number;
  targetIntake: number;
  theme: ThemeType;
};

export function WaterTracker({ currentIntake, targetIntake, theme }: WaterTrackerProps) {
  // Calculate percentage of goal met
  const percentage = Math.min((currentIntake / targetIntake) * 100, 100);
  
  // SVG dimensions and parameters
  const size = 200;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const center = size / 2;
  
  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={'rgba(0, 0, 0, 0.05)'}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        
        {/* Progress circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={theme.colors.primary}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
      
      <View style={styles.iconContainer}>
        <Droplets size={40} color={theme.colors.primary} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  iconContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
});