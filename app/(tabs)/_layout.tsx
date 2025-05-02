import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, Platform, StyleSheet } from 'react-native';
import { 
  Chrome as Home, 
  Camera, 
  BookOpen, 
  Droplets, 
  User, 
  ChefHat, 
  Calendar, 
  PackageOpen, 
  Barcode,
  Weight,
  UtensilsCrossed 
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

export default function TabLayout() {
  const { theme } = useTheme();
  
  const handleTabPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 30 : 20,
          left: 20,
          right: 20,
          elevation: 0,
          borderRadius: 24,
          height: 72,
          paddingBottom: 0,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
        },
        tabBarBackground: () => (
          <BlurView 
            tint={theme.dark ? 'dark' : 'light'} 
            intensity={80} 
            style={{ 
              borderRadius: 24,
              overflow: 'hidden',
              ...StyleSheet.absoluteFillObject,
              backgroundColor: theme.dark ? 'rgba(20, 20, 20, 0.7)' : 'rgba(255, 255, 255, 0.7)',
            }}
          />
        ),
        tabBarLabelStyle: {
          fontFamily: 'Inter-Medium',
          fontSize: 12,
          marginBottom: 8,
        },
        tabBarItemStyle: {
          paddingVertical: 6,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Главная',
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
          tabBarLabel: 'Главная',
        }}
        listeners={{
          tabPress: handleTabPress,
        }}
      />
      
      <Tabs.Screen
        name="food-diary"
        options={{
          title: 'Дневник',
          tabBarIcon: ({ color }) => <BookOpen size={24} color={color} />,
          tabBarLabel: 'Дневник',
        }}
        listeners={{
          tabPress: handleTabPress,
        }}
      />
      
      <Tabs.Screen
        name="recipes"
        options={{
          title: 'Рецепты',
          tabBarIcon: ({ color }) => <ChefHat size={24} color={color} />,
          tabBarLabel: 'Рецепты',
        }}
        listeners={{
          tabPress: handleTabPress,
        }}
      />
      
      <Tabs.Screen
        name="planner"
        options={{
          title: 'Планировщик',
          tabBarIcon: ({ color }) => <Calendar size={24} color={color} />,
          tabBarLabel: 'План',
        }}
        listeners={{
          tabPress: handleTabPress,
        }}
      />
      
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Профиль',
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
          tabBarLabel: 'Профиль',
        }}
        listeners={{
          tabPress: handleTabPress,
        }}
      />
      
      {/* Скрытые вкладки, доступные через роутер */}
      <Tabs.Screen
        name="smart-scale"
        options={{
          href: null,
        }}
      />
      
      <Tabs.Screen
        name="premium"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: Platform.OS === 'ios' ? 88 : 68,
    paddingBottom: Platform.OS === 'ios' ? 28 : 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 5,
  },
  tabBarLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    marginTop: 2,
  },
});