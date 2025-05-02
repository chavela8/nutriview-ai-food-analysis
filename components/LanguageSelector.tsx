import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { ThemeType } from '@/utils/theme';
import { ChevronLeft, Check } from 'lucide-react-native';

type LanguageSelectorProps = {
  onClose: () => void;
  theme: ThemeType;
};

type Language = {
  id: string;
  name: string;
  nativeName: string;
  selected: boolean;
};

export function LanguageSelector({ onClose, theme }: LanguageSelectorProps) {
  // Sample languages
  const languages: Language[] = [
    { id: 'en', name: 'English', nativeName: 'English', selected: true },
    { id: 'es', name: 'Spanish', nativeName: 'Español', selected: false },
    { id: 'fr', name: 'French', nativeName: 'Français', selected: false },
    { id: 'de', name: 'German', nativeName: 'Deutsch', selected: false },
    { id: 'it', name: 'Italian', nativeName: 'Italiano', selected: false },
    { id: 'pt', name: 'Portuguese', nativeName: 'Português', selected: false },
    { id: 'ru', name: 'Russian', nativeName: 'Русский', selected: false },
    { id: 'zh', name: 'Chinese', nativeName: '中文', selected: false },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <ChevronLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>Language</Text>
      </View>
      
      <FlatList
        data={languages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[
              styles.languageItem, 
              { 
                backgroundColor: theme.colors.card,
                borderColor: item.selected ? theme.colors.primary : 'transparent',
                borderWidth: item.selected ? 2 : 0,
              }
            ]}
          >
            <View style={styles.languageInfo}>
              <Text style={[styles.languageName, { color: theme.colors.text }]}>
                {item.name}
              </Text>
              <Text style={[styles.nativeName, { color: theme.colors.textSecondary }]}>
                {item.nativeName}
              </Text>
            </View>
            
            {item.selected && (
              <View style={[styles.checkmark, { backgroundColor: theme.colors.primary }]}>
                <Check size={16} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    marginBottom: 24,
  },
  backButton: {
    marginRight: 16,
    height: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Nunito-Bold',
    fontSize: 24,
  },
  list: {
    padding: 24,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
  },
  nativeName: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginTop: 2,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});