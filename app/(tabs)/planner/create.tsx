import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { X, Calendar } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

export default function CreatePlanScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState(false);

  async function createPlan() {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Не авторизован');

      const { data, error } = await supabase
        .from('meal_plans')
        .insert([{
          user_id: user.id,
          name,
          start_date: startDate,
          end_date: endDate,
        }])
        .select()
        .single();

      if (error) throw error;

      router.push(`/planner/${data.id}`);
    } catch (error) {
      console.error('Error creating meal plan:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <X size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>Новый план питания</Text>
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
          onPress={createPlan}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>Создать</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={[styles.formSection, { backgroundColor: theme.colors.card }]}>
          <TextInput
            style={[styles.nameInput, { color: theme.colors.text }]}
            placeholder="Название плана"
            placeholderTextColor={theme.colors.textTertiary}
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={[styles.formSection, { backgroundColor: theme.colors.card }]}>
          <View style={styles.dateRow}>
            <View style={styles.dateIcon}>
              <Calendar size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.dateInputs}>
              <TextInput
                style={[styles.dateInput, { color: theme.colors.text }]}
                placeholder="Дата начала"
                placeholderTextColor={theme.colors.textTertiary}
                value={startDate}
                onChangeText={setStartDate}
              />
              <Text style={[styles.dateSeparator, { color: theme.colors.textSecondary }]}>—</Text>
              <TextInput
                style={[styles.dateInput, { color: theme.colors.text }]}
                placeholder="Дата окончания"
                placeholderTextColor={theme.colors.textTertiary}
                value={endDate}
                onChangeText={setEndDate}
              />
            </View>
          </View>
        </View>

        <View style={[styles.infoCard, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.infoTitle, { color: theme.colors.text }]}>
            Что дальше?
          </Text>
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
            После создания плана вы сможете добавить в него приемы пищи из вашего дневника или рецептов.
            Это поможет вам заранее спланировать свое питание и следить за калорийностью и балансом БЖУ.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  title: {
    fontFamily: 'Nunito-Bold',
    fontSize: 20,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#FFF',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    gap: 24,
  },
  formSection: {
    borderRadius: 16,
    padding: 16,
  },
  nameInput: {
    fontFamily: 'Inter-Medium',
    fontSize: 18,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  dateInputs: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateInput: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
  dateSeparator: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    marginHorizontal: 12,
  },
  infoCard: {
    borderRadius: 16,
    padding: 16,
  },
  infoTitle: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 16,
    marginBottom: 8,
  },
  infoText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 20,
  },
});