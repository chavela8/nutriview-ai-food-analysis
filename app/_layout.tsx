import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_700Bold } from '@expo-google-fonts/inter';
import { Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold } from '@expo-google-fonts/nunito';
import { SplashScreen } from 'expo-router';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';

// Импортируем сервис инициализации и кастомный сплеш-скрин
import AppInitialization from '../lib/AppInitialization';
import CustomSplash from '../components/CustomSplash';
import { View } from 'react-native';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();
  const [showCustomSplash, setShowCustomSplash] = useState(true);

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-Bold': Inter_700Bold,
    'Nunito-Regular': Nunito_400Regular,
    'Nunito-SemiBold': Nunito_600SemiBold,
    'Nunito-Bold': Nunito_700Bold,
  });

  // Hide splash screen once fonts are loaded
  useEffect(() => {
    const hideSplash = async () => {
      if (fontsLoaded || fontError) {
        // Сначала скрываем системный сплеш-скрин
        await SplashScreen.hideAsync();
        
        // После этого показываем кастомный на несколько секунд
        setTimeout(() => {
          setShowCustomSplash(false);
        }, 3000);
      }
    };
    
    hideSplash();
  }, [fontsLoaded, fontError]);

  // Инициализация API ключей и настройка фоновой синхронизации
  useEffect(() => {
    // Инициализируем приложение при запуске
    AppInitialization.initialize();
  }, []);

  // Return null to keep splash screen visible while fonts load
  if (!fontsLoaded && !fontError) {
    return null;
  }

  // Если нужно показать кастомный сплеш-скрин
  if (showCustomSplash) {
    return <CustomSplash onAnimationComplete={() => setShowCustomSplash(false)} />;
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="auth" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" options={{ presentation: 'modal' }} />
          
          {/* Дополнительные экраны, доступные из любого места */}
          <Stack.Screen 
            name="camera-food-recognition" 
            options={{ 
              presentation: 'fullScreenModal',
              animation: 'fade' 
            }} 
          />
          <Stack.Screen 
            name="barcode-scanner" 
            options={{ 
              presentation: 'fullScreenModal',
              animation: 'fade' 
            }} 
          />
          <Stack.Screen 
            name="water-tracker" 
            options={{ 
              animation: 'slide_from_right' 
            }} 
          />
          <Stack.Screen 
            name="fridge-inventory" 
            options={{ 
              animation: 'slide_from_right' 
            }} 
          />
          <Stack.Screen 
            name="dietary-preferences" 
            options={{ 
              animation: 'slide_from_right' 
            }} 
          />
          <Stack.Screen 
            name="smart-scale-settings" 
            options={{ 
              animation: 'slide_from_right' 
            }} 
          />
          <Stack.Screen 
            name="ai-nutritionist" 
            options={{ 
              animation: 'slide_from_right' 
            }} 
          />
        </Stack>
        <StatusBar style="auto" />
      </AuthProvider>
    </ThemeProvider>
  );
}