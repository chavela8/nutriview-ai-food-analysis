import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { X, Calendar } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

const categories = [
  'Молочные продукты',
  'Мясо и рыба',
  'Овощи и фрукты',
  'Напитки',
  'Готовые блюда',
  'Другое'
];

const units = [
  'шт',
  'кг',
  'г',
  'л',
  'мл',
  'упаковка'
];

export default function AddItemScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('шт');
  const [category, setCategory] = useState('Другое');
  const [expiryDate, setExpiryDate] = useState('');
  const [loading, setLoading] = useState(false);

  async function addItem() {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Не авторизован');

      const { error } = await supabase
        .from('inventory_items')
        .insert([{
          user_id: user.id,
          name,
          quantity: parseFloat(quantity),
          unit,
          category,
          expiry_date: expiryDate || null,
        }]);

      if (error) throw error;

      router.back();
    } catch (error) {
      console.error('Error adding item:', error);
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
        <Text style={[styles.title, { color: theme.colors.text }]}>Добавить продукт</Text>
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
          onPress={addItem}
          disabled={loading || !name || !quantity}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Сохранение...' : 'Добавить'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Название</Text>
          <TextInput
            style={[styles.input, { color: theme.colors.text }]}
            placeholder="Название продукта"
            placeholderTextColor={theme.colors.textTertiary}
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Количество</Text>
          <View style={styles.quantityContainer}>
            <TextInput
              style={[styles.quantityInput, { color: theme.colors.text }]}
              placeholder="Количество"
              placeholderTextColor={theme.colors.textTertiary}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
            />
            <View style={[styles.unitSelector, { backgroundColor: theme.colors.background }]}>
              {units.map((u) => (
                <TouchableOpacity
                  key={u}
                  style={[
                    styles.unitOption,
                    { backgroundColor: unit === u ? theme.colors.primaryLight : 'transparent' }
                  ]}
                  onPress={() => setUnit(u)}
                >
                  <Text style={[
                    styles.unitText,
                    { color: unit === u ? theme.colors.primary : theme.colors.textSecondary }
                  ]}>
                    {u}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Категория</Text>
          <View style={styles.categoryGrid}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryOption,
                  { 
                    backgroundColor: category === cat ? theme.colors.primaryLight : theme.colors.background,
                    borderColor: category === cat ? theme.colors.primary : theme.colors.border
                  }
                ]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[
                  styles.categoryText,
                  { color: category === cat ? theme.colors.primary : theme.colors.textSecondary }
                ]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Срок годности</Text>
            <Calendar size={20} color={theme.colors.primary} />
          </View>
          <TextInput
            style={[styles.input, { color: theme.colors.text }]}
            placeholder="ГГГГ-ММ-ДД"
            placeholderTextColor={theme.colors.textTertiary}
            value={expiryDate}
            onChangeText={setExpiryDate}
          />
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
  section: {
    borderRadius: 16,
    padding: 16,
  },
  sectionTitle: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 16,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  input: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  quantityContainer: {
    gap: 12,
  },
  quantityInput: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  unitSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 8,
    borderRadius: 12,
  },
  unitOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  unitText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  categoryText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
});