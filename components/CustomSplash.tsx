import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface CustomSplashProps {
  onAnimationComplete?: () => void;
}

const CustomSplash: React.FC<CustomSplashProps> = ({ onAnimationComplete }) => {
  // Анимированные значения
  const opacity = new Animated.Value(0);
  const scale = new Animated.Value(0.9);
  const devInfoOpacity = new Animated.Value(0);
  
  useEffect(() => {
    // Запускаем анимацию появления
    Animated.sequence([
      // Сначала появляется логотип
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      
      // Затем появляется информация о разработчике
      Animated.timing(devInfoOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
        delay: 200,
      }),
      
      // Держим экран некоторое время, затем вызываем callback
      Animated.delay(1000),
    ]).start(() => {
      if (onAnimationComplete) {
        onAnimationComplete();
      }
    });
  }, []);
  
  const { width, height } = Dimensions.get('window');
  
  return (
    <LinearGradient
      colors={['#E8F5E9', '#E3F2FD']}
      style={styles.container}
    >
      {/* Логотип приложения */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity,
            transform: [{ scale }]
          }
        ]}
      >
        <Image
          source={require('../assets/images/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.appName}>NutriView AI</Text>
        <Text style={styles.slogan}>Умный анализ вашего питания</Text>
      </Animated.View>
      
      {/* Информация о разработчике */}
      <Animated.View
        style={[
          styles.developerInfo,
          { opacity: devInfoOpacity }
        ]}
      >
        <Text style={styles.developerText}>Developed by Roman Markan</Text>
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  slogan: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  developerInfo: {
    position: 'absolute',
    bottom: 40,
  },
  developerText: {
    fontSize: 14,
    color: '#555',
    fontStyle: 'italic',
  },
});

export default CustomSplash; 