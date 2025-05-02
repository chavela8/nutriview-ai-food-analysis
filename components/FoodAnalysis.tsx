import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, ScrollView } from 'react-native';
import { ClipboardType, FileX, AlertCircle } from 'lucide-react-native';

export const FoodAnalysis = ({ 
  loading, 
  result, 
  error, 
  theme, 
  portionEstimate 
}) => {
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.card }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          Анализируем ваше блюдо...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.card }]}>
        <View style={styles.errorIconContainer}>
          <AlertCircle size={32} color={theme.colors.danger} />
        </View>
        <Text style={[styles.errorTitle, { color: theme.colors.danger }]}>
          Не удалось распознать
        </Text>
        <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>
          {error}
        </Text>
      </View>
    );
  }

  if (result) {
    // Проверяем, есть ли дополнительная информация о микроэлементах
    const hasMicronutrients = result.nutrition && (
      result.nutrition.vitamins || 
      result.nutrition.minerals || 
      result.nutrition.fiber || 
      result.nutrition.sugar
    );

    // Проверяем, есть ли информация о гликемическом индексе и аллергенах
    const hasAdditionalInfo = 
      result.glycemicIndex !== undefined || 
      (result.allergens && result.allergens.length > 0);

    return (
      <View style={[styles.container, { backgroundColor: theme.colors.card }]}>
        <View style={styles.headerContainer}>
          <View style={styles.iconContainer}>
            <ClipboardType size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.headerContent}>
            <Text style={[styles.foodName, { color: theme.colors.text }]}>
              {result.name}
            </Text>
            {result.description && (
              <Text style={[styles.foodDescription, { color: theme.colors.textSecondary }]}>
                {result.description}
              </Text>
            )}
          </View>
        </View>

        {portionEstimate && (
          <View style={[styles.portionContainer, { backgroundColor: theme.colors.primaryLight }]}>
            <Text style={[styles.portionText, { color: theme.colors.primary }]}>
              Расчетный размер порции: {portionEstimate.weight} {portionEstimate.unit}
            </Text>
            <Text style={[styles.portionSubtext, { color: theme.colors.primary }]}>
              Данные о питательности рассчитаны на эту порцию
            </Text>
          </View>
        )}

        <View style={styles.nutritionContainer}>
          <View style={styles.nutritionHeader}>
            <Text style={[styles.nutritionTitle, { color: theme.colors.text }]}>
              Питательная ценность
            </Text>
            {portionEstimate && (
              <Text style={[styles.nutritionPortion, { color: theme.colors.textSecondary }]}>
                на {portionEstimate.weight} {portionEstimate.unit}
              </Text>
            )}
          </View>

          <View style={styles.nutritionGrid}>
            <View style={[styles.nutritionItem, { borderColor: theme.colors.border }]}>
              <Text style={[styles.nutritionValue, { color: theme.colors.text }]}>
                {result.nutrition.calories}
              </Text>
              <Text style={[styles.nutritionLabel, { color: theme.colors.textSecondary }]}>
                Калории
              </Text>
            </View>
            
            <View style={[styles.nutritionItem, { borderColor: theme.colors.border }]}>
              <Text style={[styles.nutritionValue, { color: theme.colors.text }]}>
                {result.nutrition.protein}г
              </Text>
              <Text style={[styles.nutritionLabel, { color: theme.colors.textSecondary }]}>
                Белки
              </Text>
            </View>
            
            <View style={[styles.nutritionItem, { borderColor: theme.colors.border }]}>
              <Text style={[styles.nutritionValue, { color: theme.colors.text }]}>
                {result.nutrition.carbs}г
              </Text>
              <Text style={[styles.nutritionLabel, { color: theme.colors.textSecondary }]}>
                Углеводы
              </Text>
            </View>
            
            <View style={[styles.nutritionItem, { borderColor: theme.colors.border }]}>
              <Text style={[styles.nutritionValue, { color: theme.colors.text }]}>
                {result.nutrition.fat}г
              </Text>
              <Text style={[styles.nutritionLabel, { color: theme.colors.textSecondary }]}>
                Жиры
              </Text>
            </View>
          </View>
        </View>
        
        {result.nutrition && result.nutrition.sugar !== undefined && (
          <View style={styles.detailsRow}>
            <Text style={[styles.detailsLabel, { color: theme.colors.textSecondary }]}>
              Сахар:
            </Text>
            <Text style={[styles.detailsValue, { color: theme.colors.text }]}>
              {result.nutrition.sugar}г
            </Text>
          </View>
        )}
        
        {result.nutrition && result.nutrition.fiber !== undefined && (
          <View style={styles.detailsRow}>
            <Text style={[styles.detailsLabel, { color: theme.colors.textSecondary }]}>
              Клетчатка:
            </Text>
            <Text style={[styles.detailsValue, { color: theme.colors.text }]}>
              {result.nutrition.fiber}г
            </Text>
          </View>
        )}
        
        {/* Гликемический индекс */}
        {result.glycemicIndex !== undefined && (
          <View style={styles.detailsRow}>
            <Text style={[styles.detailsLabel, { color: theme.colors.textSecondary }]}>
              Гликемический индекс:
            </Text>
            <Text style={[styles.detailsValue, { color: theme.colors.text }]}>
              {result.glycemicIndex} 
              {result.glycemicIndex < 55 ? ' (низкий)' : 
               result.glycemicIndex < 70 ? ' (средний)' : ' (высокий)'}
            </Text>
          </View>
        )}
        
        {/* Витамины и минералы */}
        {result.nutrition && result.nutrition.vitamins && (
          <>
            <Text style={[styles.micronutrientsTitle, { color: theme.colors.text }]}>
              Витамины
            </Text>
            {Object.entries(result.nutrition.vitamins).map(([key, value]) => (
              <View key={key} style={styles.detailsRow}>
                <Text style={[styles.detailsLabel, { color: theme.colors.textSecondary }]}>
                  {key}:
                </Text>
                <Text style={[styles.detailsValue, { color: theme.colors.text }]}>
                  {value}
                </Text>
              </View>
            ))}
          </>
        )}
        
        {result.nutrition && result.nutrition.minerals && (
          <>
            <Text style={[styles.micronutrientsTitle, { color: theme.colors.text }]}>
              Минералы
            </Text>
            {Object.entries(result.nutrition.minerals).map(([key, value]) => (
              <View key={key} style={styles.detailsRow}>
                <Text style={[styles.detailsLabel, { color: theme.colors.textSecondary }]}>
                  {key}:
                </Text>
                <Text style={[styles.detailsValue, { color: theme.colors.text }]}>
                  {value}
                </Text>
              </View>
            ))}
          </>
        )}
        
        {/* Аллергены */}
        {result.allergens && result.allergens.length > 0 && (
          <>
            <Text style={[styles.micronutrientsTitle, { color: theme.colors.text }]}>
              Аллергены
            </Text>
            <View style={styles.allergensContainer}>
              {result.allergens.map((allergen, index) => (
                <View 
                  key={index} 
                  style={[styles.allergenTag, { backgroundColor: theme.colors.dangerLight }]}
                >
                  <Text style={[styles.allergenText, { color: theme.colors.danger }]}>
                    {allergen}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    width: '100%',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(102, 212, 176, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  foodName: {
    fontFamily: 'Nunito-Bold',
    fontSize: 18,
  },
  foodDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginTop: 4,
  },
  portionContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  portionText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  portionSubtext: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    marginTop: 2,
    opacity: 0.8,
  },
  nutritionContainer: {
    marginBottom: 16,
  },
  nutritionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  nutritionTitle: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 16,
  },
  nutritionPortion: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    width: '48%',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  nutritionValue: {
    fontFamily: 'Nunito-Bold',
    fontSize: 18,
  },
  nutritionLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginTop: 4,
  },
  loadingText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  errorIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(235, 87, 87, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    alignSelf: 'center',
  },
  errorTitle: {
    fontFamily: 'Nunito-Bold',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 8,
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  detailsLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  detailsValue: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  micronutrientsTitle: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  allergensContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    gap: 8,
  },
  allergenTag: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  allergenText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
  },
});