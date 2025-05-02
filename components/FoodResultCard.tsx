import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { ThemeType } from '@/utils/theme';
import { Flame, Dumbbell, Cookie, Droplet } from 'lucide-react-native';

type FoodResultProps = {
  food: {
    name: string;
    confidence: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    image: string;
  };
  theme: ThemeType;
};

export function FoodResultCard({ food, theme }: FoodResultProps) {
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.card }]}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: food.image }} style={styles.foodImage} />
        <View style={[styles.confidenceTag, { backgroundColor: theme.colors.primary }]}>
          <Text style={styles.confidenceText}>
            {food.confidence}% match
          </Text>
        </View>
      </View>
      
      <View style={styles.contentContainer}>
        <Text style={[styles.foodName, { color: theme.colors.text }]}>{food.name}</Text>
        
        <View style={styles.nutritionContainer}>
          <View style={styles.nutritionItem}>
            <View style={[styles.nutritionIcon, { backgroundColor: theme.colors.primaryLight }]}>
              <Flame size={16} color={theme.colors.primary} />
            </View>
            <View>
              <Text style={[styles.nutritionValue, { color: theme.colors.text }]}>
                {food.calories}
              </Text>
              <Text style={[styles.nutritionLabel, { color: theme.colors.textSecondary }]}>
                calories
              </Text>
            </View>
          </View>
          
          <View style={styles.nutritionItem}>
            <View style={[styles.nutritionIcon, { backgroundColor: theme.colors.secondaryLight }]}>
              <Dumbbell size={16} color={theme.colors.secondary} />
            </View>
            <View>
              <Text style={[styles.nutritionValue, { color: theme.colors.text }]}>
                {food.protein}g
              </Text>
              <Text style={[styles.nutritionLabel, { color: theme.colors.textSecondary }]}>
                protein
              </Text>
            </View>
          </View>
          
          <View style={styles.nutritionItem}>
            <View style={[styles.nutritionIcon, { backgroundColor: theme.colors.tertiaryLight }]}>
              <Cookie size={16} color={theme.colors.tertiary} />
            </View>
            <View>
              <Text style={[styles.nutritionValue, { color: theme.colors.text }]}>
                {food.carbs}g
              </Text>
              <Text style={[styles.nutritionLabel, { color: theme.colors.textSecondary }]}>
                carbs
              </Text>
            </View>
          </View>
          
          <View style={styles.nutritionItem}>
            <View style={[styles.nutritionIcon, { backgroundColor: theme.colors.accentLight }]}>
              <Droplet size={16} color={theme.colors.accent} />
            </View>
            <View>
              <Text style={[styles.nutritionValue, { color: theme.colors.text }]}>
                {food.fat}g
              </Text>
              <Text style={[styles.nutritionLabel, { color: theme.colors.textSecondary }]}>
                fat
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
  },
  foodImage: {
    width: '100%',
    height: 200,
  },
  confidenceTag: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  confidenceText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#FFFFFF',
  },
  contentContainer: {
    padding: 16,
  },
  foodName: {
    fontFamily: 'Nunito-Bold',
    fontSize: 20,
    marginBottom: 16,
  },
  nutritionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  nutritionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: 16,
  },
  nutritionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  nutritionValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
  },
  nutritionLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginTop: 2,
  },
});