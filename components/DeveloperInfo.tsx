import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Constants from 'expo-constants';

interface DeveloperInfoProps {
  light?: boolean;
}

/**
 * Компонент для отображения информации о разработчике на сплеш-скрине
 * и других ключевых экранах приложения
 */
export default function DeveloperInfo({ light = false }: DeveloperInfoProps) {
  // Получаем информацию о разработчике из констант приложения
  const developerName = Constants.manifest?.extra?.developer || 'Roman Markan';
  
  return (
    <View style={styles.container}>
      <Text style={[
        styles.developerText, 
        light ? styles.lightText : styles.darkText
      ]}>
        Developed by {developerName}
      </Text>
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 40,
    width: width,
    alignItems: 'center',
    justifyContent: 'center',
  },
  developerText: {
    fontSize: 14,
    fontFamily: 'System',
    letterSpacing: 0.5,
    opacity: 0.8,
  },
  lightText: {
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  darkText: {
    color: '#333333',
  },
}); 