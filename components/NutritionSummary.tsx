import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Flame, Dumbbell, Cookie, Droplet, ChevronDown, ChevronUp, Info } from 'lucide-react-native';
import { ThemeType } from '@/utils/theme';
import { PieChart } from 'react-native-chart-kit';

type NutritionSummaryProps = {
  consumed: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    water?: number;
    vitamins?: Record<string, string>;
    minerals?: Record<string, string>;
  };
  target: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    water?: number;
  };
  theme: ThemeType;
  onInfoPress?: (nutrientType: string) => void;
};

export function NutritionSummary({ consumed, target, theme, onInfoPress }: NutritionSummaryProps) {
  const [activeTab, setActiveTab] = useState('macros');

  const calculatePercentage = (consumed: number, target: number) => {
    return Math.min(Math.round((consumed / target) * 100), 100);
  };

  // Рассчитываем процент выполнения для основных нутриентов
  const caloriesPercentage = calculatePercentage(consumed.calories, target.calories);
  const proteinPercentage = calculatePercentage(consumed.protein, target.protein);
  const carbsPercentage = calculatePercentage(consumed.carbs, target.carbs);
  const fatPercentage = calculatePercentage(consumed.fat, target.fat);
  const fiberPercentage = consumed.fiber && target.fiber ? calculatePercentage(consumed.fiber, target.fiber) : 0;
  const waterPercentage = consumed.water && target.water ? calculatePercentage(consumed.water, target.water) : 0;

  // Данные для круговой диаграммы
  const pieData = [
    {
      name: 'Белки',
      value: consumed.protein * 4, // 4 калории на грамм белка
      color: theme.colors.secondary,
      legendFontColor: theme.colors.text,
    },
    {
      name: 'Углеводы',
      value: consumed.carbs * 4, // 4 калории на грамм углеводов
      color: theme.colors.tertiary,
      legendFontColor: theme.colors.text,
    },
    {
      name: 'Жиры',
      value: consumed.fat * 9, // 9 калорий на грамм жира
      color: theme.colors.accent,
      legendFontColor: theme.colors.text,
    }
  ];

  const renderMacrosTab = () => (
    <View style={styles.macrosContainer}>
      <View style={styles.caloriesSection}>
        <View style={styles.caloriesHeader}>
          <Text style={[styles.caloriesTitle, { color: theme.colors.text }]}>Калории</Text>
          <TouchableOpacity onPress={() => onInfoPress && onInfoPress('calories')}>
            <Info size={16} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.caloriesContent}>
          <View style={styles.caloriesInfo}>
            <Text style={[styles.caloriesValue, { color: theme.colors.text }]}>
              {consumed.calories}
              <Text style={[styles.caloriesUnit, { color: theme.colors.textSecondary }]}> ккал</Text>
            </Text>
            <Text style={[styles.caloriesTarget, { color: theme.colors.textSecondary }]}>
              из {target.calories} ккал
            </Text>
          </View>

          <View style={styles.pieChartContainer}>
            <PieChart
              data={pieData}
              width={100}
              height={100}
              chartConfig={{
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="value"
              backgroundColor="transparent"
              paddingLeft="0"
              hasLegend={false}
              center={[50, 0]}
              absolute
            />
          </View>
        </View>

        <View style={[styles.progressBar, { backgroundColor: theme.colors.backgroundSecondary }]}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${caloriesPercentage}%`, 
                backgroundColor: theme.colors.primary 
              }
            ]} 
          />
        </View>
      </View>

      <View style={styles.macroNutrientsGrid}>
        <View style={styles.macroNutrient}>
          <View style={styles.macroNutrientHeader}>
            <Text style={[styles.macroNutrientTitle, { color: theme.colors.text }]}>Белки</Text>
            <TouchableOpacity onPress={() => onInfoPress && onInfoPress('protein')}>
              <Info size={14} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.macroNutrientContent}>
            <Text style={[styles.macroNutrientValue, { color: theme.colors.secondary }]}>
              {consumed.protein}
              <Text style={[styles.macroNutrientUnit, { color: theme.colors.textSecondary }]}> г</Text>
            </Text>
            <Text style={[styles.macroNutrientTarget, { color: theme.colors.textSecondary }]}>
              из {target.protein} г
            </Text>
          </View>
          
          <View style={[styles.progressBar, { backgroundColor: theme.colors.backgroundSecondary }]}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${proteinPercentage}%`, 
                  backgroundColor: theme.colors.secondary 
                }
              ]} 
            />
          </View>
        </View>
        
        <View style={styles.macroNutrient}>
          <View style={styles.macroNutrientHeader}>
            <Text style={[styles.macroNutrientTitle, { color: theme.colors.text }]}>Углеводы</Text>
            <TouchableOpacity onPress={() => onInfoPress && onInfoPress('carbs')}>
              <Info size={14} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.macroNutrientContent}>
            <Text style={[styles.macroNutrientValue, { color: theme.colors.tertiary }]}>
              {consumed.carbs}
              <Text style={[styles.macroNutrientUnit, { color: theme.colors.textSecondary }]}> г</Text>
            </Text>
            <Text style={[styles.macroNutrientTarget, { color: theme.colors.textSecondary }]}>
              из {target.carbs} г
            </Text>
          </View>
          
          <View style={[styles.progressBar, { backgroundColor: theme.colors.backgroundSecondary }]}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${carbsPercentage}%`, 
                  backgroundColor: theme.colors.tertiary 
                }
              ]} 
            />
          </View>
        </View>
        
        <View style={styles.macroNutrient}>
          <View style={styles.macroNutrientHeader}>
            <Text style={[styles.macroNutrientTitle, { color: theme.colors.text }]}>Жиры</Text>
            <TouchableOpacity onPress={() => onInfoPress && onInfoPress('fat')}>
              <Info size={14} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.macroNutrientContent}>
            <Text style={[styles.macroNutrientValue, { color: theme.colors.accent }]}>
              {consumed.fat}
              <Text style={[styles.macroNutrientUnit, { color: theme.colors.textSecondary }]}> г</Text>
            </Text>
            <Text style={[styles.macroNutrientTarget, { color: theme.colors.textSecondary }]}>
              из {target.fat} г
            </Text>
          </View>
          
          <View style={[styles.progressBar, { backgroundColor: theme.colors.backgroundSecondary }]}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${fatPercentage}%`, 
                  backgroundColor: theme.colors.accent 
                }
              ]} 
            />
          </View>
        </View>

        {consumed.fiber && target.fiber && (
          <View style={styles.macroNutrient}>
            <View style={styles.macroNutrientHeader}>
              <Text style={[styles.macroNutrientTitle, { color: theme.colors.text }]}>Клетчатка</Text>
              <TouchableOpacity onPress={() => onInfoPress && onInfoPress('fiber')}>
                <Info size={14} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.macroNutrientContent}>
              <Text style={[styles.macroNutrientValue, { color: theme.colors.success }]}>
                {consumed.fiber}
                <Text style={[styles.macroNutrientUnit, { color: theme.colors.textSecondary }]}> г</Text>
              </Text>
              <Text style={[styles.macroNutrientTarget, { color: theme.colors.textSecondary }]}>
                из {target.fiber} г
              </Text>
            </View>
            
            <View style={[styles.progressBar, { backgroundColor: theme.colors.backgroundSecondary }]}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${fiberPercentage}%`, 
                    backgroundColor: theme.colors.success 
                  }
                ]} 
              />
            </View>
          </View>
        )}

        {consumed.water && target.water && (
          <View style={styles.macroNutrient}>
            <View style={styles.macroNutrientHeader}>
              <Text style={[styles.macroNutrientTitle, { color: theme.colors.text }]}>Вода</Text>
              <TouchableOpacity onPress={() => onInfoPress && onInfoPress('water')}>
                <Info size={14} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.macroNutrientContent}>
              <Text style={[styles.macroNutrientValue, { color: theme.colors.info }]}>
                {consumed.water >= 1000 ? (consumed.water / 1000).toFixed(1) : consumed.water}
                <Text style={[styles.macroNutrientUnit, { color: theme.colors.textSecondary }]}>
                  {consumed.water >= 1000 ? ' л' : ' мл'}
                </Text>
              </Text>
              <Text style={[styles.macroNutrientTarget, { color: theme.colors.textSecondary }]}>
                из {target.water >= 1000 ? (target.water / 1000).toFixed(1) : target.water}
                {target.water >= 1000 ? ' л' : ' мл'}
              </Text>
            </View>
            
            <View style={[styles.progressBar, { backgroundColor: theme.colors.backgroundSecondary }]}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${waterPercentage}%`, 
                    backgroundColor: theme.colors.info 
                  }
                ]} 
              />
            </View>
          </View>
        )}
      </View>
    </View>
  );

  const renderVitaminsTab = () => (
    <View style={styles.micronutrientsContainer}>
      <Text style={[styles.micronutrientsTitle, { color: theme.colors.text }]}>
        Витамины
      </Text>
      
      <TouchableOpacity 
        style={styles.micronutrientsInfoButton} 
        onPress={() => onInfoPress && onInfoPress('vitamins')}
      >
        <Info size={16} color={theme.colors.textSecondary} />
        <Text style={[styles.infoButtonText, { color: theme.colors.textSecondary }]}>О витаминах</Text>
      </TouchableOpacity>
      
      {consumed.vitamins ? (
        <ScrollView showsVerticalScrollIndicator={false} style={styles.micronutrientsList}>
          {Object.entries(consumed.vitamins).map(([vitamin, percentage], index) => (
            <View key={index} style={styles.micronutrientItem}>
              <View style={styles.micronutrientInfo}>
                <Text style={[styles.micronutrientName, { color: theme.colors.text }]}>
                  Витамин {vitamin}
                </Text>
                <Text style={[styles.micronutrientPercentage, { color: theme.colors.textSecondary }]}>
                  {percentage}
                </Text>
              </View>
              
              <View style={[styles.microProgressBar, { backgroundColor: theme.colors.backgroundSecondary }]}>
                <View 
                  style={[
                    styles.microProgressFill, 
                    { 
                      width: `${parseInt(percentage)}%`, 
                      backgroundColor: getColorForPercentage(parseInt(percentage), theme) 
                    }
                  ]} 
                />
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.noDataContainer}>
          <Text style={[styles.noDataText, { color: theme.colors.textSecondary }]}>
            Нет данных о витаминах
          </Text>
        </View>
      )}
    </View>
  );

  const renderMineralsTab = () => (
    <View style={styles.micronutrientsContainer}>
      <Text style={[styles.micronutrientsTitle, { color: theme.colors.text }]}>
        Минералы
      </Text>
      
      <TouchableOpacity 
        style={styles.micronutrientsInfoButton} 
        onPress={() => onInfoPress && onInfoPress('minerals')}
      >
        <Info size={16} color={theme.colors.textSecondary} />
        <Text style={[styles.infoButtonText, { color: theme.colors.textSecondary }]}>О минералах</Text>
      </TouchableOpacity>
      
      {consumed.minerals ? (
        <ScrollView showsVerticalScrollIndicator={false} style={styles.micronutrientsList}>
          {Object.entries(consumed.minerals).map(([mineral, percentage], index) => (
            <View key={index} style={styles.micronutrientItem}>
              <View style={styles.micronutrientInfo}>
                <Text style={[styles.micronutrientName, { color: theme.colors.text }]}>
                  {getMineralFullName(mineral)}
                </Text>
                <Text style={[styles.micronutrientPercentage, { color: theme.colors.textSecondary }]}>
                  {percentage}
                </Text>
              </View>
              
              <View style={[styles.microProgressBar, { backgroundColor: theme.colors.backgroundSecondary }]}>
                <View 
                  style={[
                    styles.microProgressFill, 
                    { 
                      width: `${parseInt(percentage)}%`, 
                      backgroundColor: getColorForPercentage(parseInt(percentage), theme) 
                    }
                  ]} 
                />
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.noDataContainer}>
          <Text style={[styles.noDataText, { color: theme.colors.textSecondary }]}>
            Нет данных о минералах
          </Text>
        </View>
      )}
    </View>
  );

  // Вспомогательная функция для получения цвета в зависимости от процента
  const getColorForPercentage = (percentage: number, theme: ThemeType) => {
    if (percentage < 30) return theme.colors.danger;
    if (percentage < 70) return theme.colors.warning;
    if (percentage <= 100) return theme.colors.success;
    return theme.colors.primary; // более 100%
  };

  // Вспомогательная функция для получения полного названия минерала
  const getMineralFullName = (code: string) => {
    const minerals: Record<string, string> = {
      'Ca': 'Кальций',
      'Fe': 'Железо',
      'Mg': 'Магний',
      'P': 'Фосфор',
      'K': 'Калий',
      'Na': 'Натрий',
      'Zn': 'Цинк',
      'Cu': 'Медь',
      'Mn': 'Марганец',
      'Se': 'Селен',
      'I': 'Йод',
      'Cr': 'Хром',
      'Mo': 'Молибден',
      'F': 'Фтор'
    };
    
    return minerals[code] || code;
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[
            styles.tabButton, 
            activeTab === 'macros' && styles.activeTabButton,
            { borderBottomColor: activeTab === 'macros' ? theme.colors.primary : 'transparent' }
          ]}
          onPress={() => setActiveTab('macros')}
        >
          <Text 
            style={[
              styles.tabButtonText, 
              { color: activeTab === 'macros' ? theme.colors.primary : theme.colors.textSecondary }
            ]}
          >
            Макронутриенты
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.tabButton, 
            activeTab === 'vitamins' && styles.activeTabButton,
            { borderBottomColor: activeTab === 'vitamins' ? theme.colors.primary : 'transparent' }
          ]}
          onPress={() => setActiveTab('vitamins')}
        >
          <Text 
            style={[
              styles.tabButtonText, 
              { color: activeTab === 'vitamins' ? theme.colors.primary : theme.colors.textSecondary }
            ]}
          >
            Витамины
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.tabButton, 
            activeTab === 'minerals' && styles.activeTabButton,
            { borderBottomColor: activeTab === 'minerals' ? theme.colors.primary : 'transparent' }
          ]}
          onPress={() => setActiveTab('minerals')}
        >
          <Text 
            style={[
              styles.tabButtonText, 
              { color: activeTab === 'minerals' ? theme.colors.primary : theme.colors.textSecondary }
            ]}
          >
            Минералы
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.tabContent}>
        {activeTab === 'macros' && renderMacrosTab()}
        {activeTab === 'vitamins' && renderVitaminsTab()}
        {activeTab === 'minerals' && renderMineralsTab()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 16,
    borderBottomWidth: 2,
  },
  activeTabButton: {
    borderBottomWidth: 2,
  },
  tabButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  tabContent: {
    width: '100%',
  },
  macrosContainer: {
    width: '100%',
  },
  caloriesSection: {
    marginBottom: 20,
  },
  caloriesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  caloriesTitle: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 16,
    marginRight: 8,
  },
  caloriesContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
  },
  caloriesInfo: {
    flex: 1,
  },
  caloriesValue: {
    fontFamily: 'Nunito-Bold',
    fontSize: 24,
  },
  caloriesUnit: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
  caloriesTarget: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginTop: 4,
  },
  pieChartContainer: {
    marginLeft: 'auto',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  macroNutrientsGrid: {
    marginTop: 8,
  },
  macroNutrient: {
    marginBottom: 16,
  },
  macroNutrientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  macroNutrientTitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    marginRight: 8,
  },
  macroNutrientContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  macroNutrientValue: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 16,
  },
  macroNutrientUnit: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  macroNutrientTarget: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
  },
  micronutrientsContainer: {
    width: '100%',
  },
  micronutrientsTitle: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 16,
    marginBottom: 12,
  },
  micronutrientsInfoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoButtonText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    marginLeft: 4,
  },
  micronutrientsList: {
    maxHeight: 300,
  },
  micronutrientItem: {
    marginBottom: 12,
  },
  micronutrientInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  micronutrientName: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  micronutrientPercentage: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  microProgressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  microProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  noDataContainer: {
    padding: 16,
    alignItems: 'center',
  },
  noDataText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  }
});