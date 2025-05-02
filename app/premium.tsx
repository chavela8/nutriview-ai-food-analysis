import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { CheckCircle2, XCircle, Zap, ArrowLeft, Crown, Lock, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

export default function PremiumScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');
  const [isLoading, setIsLoading] = useState(false);

  const handleBackPress = () => {
    router.back();
  };

  const handlePlanSelect = (plan: 'monthly' | 'annual') => {
    setSelectedPlan(plan);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSubscribe = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    
    // Имитация запроса на сервер
    setTimeout(() => {
      setIsLoading(false);
      
      // Имитация успешной подписки
      Alert.alert(
        'Успешно!',
        `Вы подписались на ${selectedPlan === 'monthly' ? 'месячный' : 'годовой'} план Premium.`,
        [{ text: 'Отлично', onPress: handleBackPress }]
      );
    }, 1500);
  };

  const premiumFeatures = [
    {
      title: 'Без рекламы',
      description: 'Полное отсутствие рекламных баннеров и вставок',
      included: true
    },
    {
      title: 'Расширенная аналитика',
      description: 'Детальные графики и анализ динамики питания',
      included: true
    },
    {
      title: 'Витамины и минералы',
      description: 'Анализ микроэлементов в вашем рационе',
      included: true
    },
    {
      title: 'Экспорт данных',
      description: 'Выгрузка статистики в PDF и Excel',
      included: true
    },
    {
      title: 'AI-рекомендации',
      description: 'Персональные советы по питанию на основе ваших данных',
      included: true
    },
    {
      title: 'Консультации диетолога',
      description: 'Личные консультации с сертифицированными специалистами',
      included: false
    }
  ];

  const freePlanFeatures = [
    'Базовый дневник питания',
    'Сканирование продуктов (до 10 в день)',
    'Базовые графики и статистика',
    'Отслеживание калорий и БЖУ'
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.heroSection}>
          <View style={styles.crownContainer}>
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              style={styles.crownGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Crown size={32} color="#FFFFFF" />
            </LinearGradient>
          </View>
          
          <Text style={[styles.heroTitle, { color: theme.colors.text }]}>
            NutriView Premium
          </Text>
          
          <Text style={[styles.heroSubtitle, { color: theme.colors.textSecondary }]}>
            Откройте полный потенциал приложения с Premium-подпиской
          </Text>
        </View>
        
        <View style={styles.plansContainer}>
          <TouchableOpacity
            style={[
              styles.planCard,
              selectedPlan === 'monthly' && styles.selectedPlan,
              {
                backgroundColor: theme.colors.card,
                borderColor: selectedPlan === 'monthly' ? theme.colors.primary : 'transparent'
              }
            ]}
            onPress={() => handlePlanSelect('monthly')}
          >
            <View style={styles.planTop}>
              <Text style={[styles.planName, { color: theme.colors.text }]}>
                Месячная
              </Text>
              <Text style={[styles.planPrice, { color: theme.colors.text }]}>
                299 ₽
              </Text>
              <Text style={[styles.planPeriod, { color: theme.colors.textSecondary }]}>
                в месяц
              </Text>
            </View>
            
            {selectedPlan === 'monthly' && (
              <View style={[styles.selectedIndicator, { backgroundColor: theme.colors.primary }]}>
                <CheckCircle2 size={16} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.planCard,
              selectedPlan === 'annual' && styles.selectedPlan,
              {
                backgroundColor: theme.colors.card,
                borderColor: selectedPlan === 'annual' ? theme.colors.primary : 'transparent'
              }
            ]}
            onPress={() => handlePlanSelect('annual')}
          >
            <View style={[styles.saveBadge, { backgroundColor: theme.colors.success }]}>
              <Text style={styles.saveText}>Скидка 30%</Text>
            </View>
            
            <View style={styles.planTop}>
              <Text style={[styles.planName, { color: theme.colors.text }]}>
                Годовая
              </Text>
              <Text style={[styles.planPrice, { color: theme.colors.text }]}>
                2499 ₽
              </Text>
              <Text style={[styles.planPeriod, { color: theme.colors.textSecondary }]}>
                в год (≈208 ₽/мес)
              </Text>
            </View>
            
            {selectedPlan === 'annual' && (
              <View style={[styles.selectedIndicator, { backgroundColor: theme.colors.primary }]}>
                <CheckCircle2 size={16} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>
        </View>
        
        <View style={styles.comparisonSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Сравнение планов
          </Text>
          
          <View style={[styles.comparisonHeader, { backgroundColor: theme.colors.backgroundSecondary }]}>
            <Text style={[styles.comparisonLabel, { color: theme.colors.textSecondary }]}>
              Функция
            </Text>
            <View style={styles.comparisonPlans}>
              <View style={styles.comparisonPlan}>
                <Text style={[styles.comparisonPlanName, { color: theme.colors.textSecondary }]}>
                  Бесплатно
                </Text>
              </View>
              <View style={styles.comparisonPlan}>
                <Text style={[styles.comparisonPlanName, { color: theme.colors.primary }]}>
                  Premium
                </Text>
              </View>
            </View>
          </View>
          
          {premiumFeatures.map((feature, index) => (
            <View 
              key={index} 
              style={[
                styles.featureRow, 
                index % 2 === 0 && { backgroundColor: theme.colors.backgroundSecondary }
              ]}
            >
              <View style={styles.featureInfo}>
                <Text style={[styles.featureTitle, { color: theme.colors.text }]}>
                  {feature.title}
                </Text>
                <Text style={[styles.featureDescription, { color: theme.colors.textSecondary }]}>
                  {feature.description}
                </Text>
              </View>
              
              <View style={styles.comparisonIndicators}>
                <View style={styles.indicatorContainer}>
                  <XCircle size={20} color={theme.colors.danger} />
                </View>
                <View style={styles.indicatorContainer}>
                  {feature.included ? (
                    <CheckCircle2 size={20} color={theme.colors.success} />
                  ) : (
                    <Lock size={20} color={theme.colors.textTertiary} />
                  )}
                </View>
              </View>
            </View>
          ))}
        </View>
        
        <View style={styles.freePlanSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Бесплатный план включает
          </Text>
          
          <View style={[styles.freePlanCard, { backgroundColor: theme.colors.card }]}>
            {freePlanFeatures.map((feature, index) => (
              <View key={index} style={styles.freePlanFeature}>
                <CheckCircle2 size={16} color={theme.colors.textSecondary} style={styles.freePlanIcon} />
                <Text style={[styles.freePlanText, { color: theme.colors.text }]}>
                  {feature}
                </Text>
              </View>
            ))}
          </View>
        </View>
        
        <View style={styles.guaranteeSection}>
          <Sparkles size={24} color={theme.colors.primary} style={{ marginBottom: 12 }} />
          <Text style={[styles.guaranteeTitle, { color: theme.colors.text }]}>
            Гарантия возврата средств
          </Text>
          <Text style={[styles.guaranteeText, { color: theme.colors.textSecondary }]}>
            Если вы не удовлетворены Premium-функциями, мы вернем ваши деньги в течение 7 дней после подписки.
          </Text>
        </View>
      </ScrollView>
      
      <View style={[styles.bottomBar, { backgroundColor: theme.colors.background }]}>
        <TouchableOpacity 
          style={[
            styles.subscribeButton, 
            { backgroundColor: theme.colors.primary },
            isLoading && styles.loadingButton
          ]}
          onPress={handleSubscribe}
          disabled={isLoading}
        >
          {isLoading ? (
            <Text style={styles.subscribeButtonText}>Обработка...</Text>
          ) : (
            <>
              <Zap size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.subscribeButtonText}>
                Оформить подписку
              </Text>
            </>
          )}
        </TouchableOpacity>
        
        <Text style={[styles.termsText, { color: theme.colors.textTertiary }]}>
          Оплата будет произведена через Apple App Store. Подписка автоматически продлевается, если автоматическое продление не отключено как минимум за 24 часа до окончания текущего периода.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 160,
  },
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  crownContainer: {
    marginBottom: 16,
  },
  crownGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontFamily: 'Nunito-Bold',
    fontSize: 28,
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  plansContainer: {
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  planCard: {
    width: '48%',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  selectedPlan: {
    borderWidth: 2,
  },
  planTop: {
    alignItems: 'center',
  },
  planName: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 18,
    marginBottom: 8,
  },
  planPrice: {
    fontFamily: 'Nunito-Bold',
    fontSize: 24,
    marginBottom: 4,
  },
  planPeriod: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomRightRadius: 8,
  },
  saveText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#FFFFFF',
  },
  comparisonSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontFamily: 'Nunito-Bold',
    fontSize: 20,
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  comparisonHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  comparisonLabel: {
    flex: 2,
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  comparisonPlans: {
    flex: 1,
    flexDirection: 'row',
  },
  comparisonPlan: {
    flex: 1,
    alignItems: 'center',
  },
  comparisonPlanName: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  featureRow: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  featureInfo: {
    flex: 2,
    paddingRight: 16,
  },
  featureTitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    marginBottom: 4,
  },
  featureDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
  },
  comparisonIndicators: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  indicatorContainer: {
    flex: 1,
    alignItems: 'center',
  },
  freePlanSection: {
    marginBottom: 32,
  },
  freePlanCard: {
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 16,
  },
  freePlanFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  freePlanIcon: {
    marginRight: 12,
  },
  freePlanText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  guaranteeSection: {
    alignItems: 'center',
    paddingHorizontal: 48,
    marginBottom: 24,
  },
  guaranteeTitle: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 18,
    marginBottom: 8,
    textAlign: 'center',
  },
  guaranteeText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    textAlign: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  subscribeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  loadingButton: {
    opacity: 0.7,
  },
  subscribeButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  termsText: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    textAlign: 'center',
  },
}); 