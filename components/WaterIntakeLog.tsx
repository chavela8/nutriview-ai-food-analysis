import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemeType } from '@/utils/theme';
import { Droplets, Trash2 } from 'lucide-react-native';

type WaterIntakeLogProps = {
  time: string;
  amount: number;
  theme: ThemeType;
};

export function WaterIntakeLog({ time, amount, theme }: WaterIntakeLogProps) {
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.card }]}>
      <View style={styles.leftSection}>
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.primaryLight }]}>
          <Droplets size={16} color={theme.colors.primary} />
        </View>
        <Text style={[styles.time, { color: theme.colors.text }]}>{time}</Text>
      </View>
      
      <View style={styles.rightSection}>
        <Text style={[styles.amount, { color: theme.colors.text }]}>
          {amount} {amount === 1 ? 'glass' : 'glasses'}
        </Text>
        
        <TouchableOpacity style={styles.deleteButton}>
          <Trash2 size={16} color={theme.colors.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  time: {
    fontFamily: 'Inter-Medium',
    fontSize: 15,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amount: {
    fontFamily: 'Inter-Medium',
    fontSize: 15,
    marginRight: 16,
  },
  deleteButton: {
    padding: 4,
  },
});