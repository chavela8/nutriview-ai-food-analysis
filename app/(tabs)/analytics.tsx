import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { ArrowLeft, ArrowRight, Calendar, Filter, ChevronDown, Info } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';

// Define the types for our analytics data
interface NutrientData {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface WaterData {
  date: string;
  amount: number; // in ml
}

interface WeightData {
  date: string;
  weight: number; // in kg
}

interface MacroBreakdown {
  name: string;
  percentage: number;
  color: string;
  legendFontColor: string;
}

// Demo data generation functions
const generateDailyData = (days: number): NutrientData[] => {
  const result: NutrientData[] = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    // Generate some realistic data with slight variations
    const baseCalories = 2100;
    const variation = Math.random() * 500 - 250; // -250 to 250
    
    const calories = Math.max(1500, Math.min(2500, baseCalories + variation));
    const protein = Math.round(calories * 0.25 / 4); // 25% of calories from protein
    const fat = Math.round(calories * 0.3 / 9); // 30% of calories from fat
    const carbs = Math.round(calories * 0.45 / 4); // 45% of calories from carbs
    
    result.push({
      date: dateStr,
      calories: Math.round(calories),
      protein,
      carbs,
      fat
    });
  }
  
  return result;
};

const generateWaterData = (days: number): WaterData[] => {
  const result: WaterData[] = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    // Generate water intake between 1500ml and 3000ml
    const water = Math.round(1500 + Math.random() * 1500);
    
    result.push({
      date: dateStr,
      amount: water
    });
  }
  
  return result;
};

const generateWeightData = (days: number): WeightData[] => {
  const result: WeightData[] = [];
  const today = new Date();
  const baseWeight = 70 + Math.random() * 10; // Starting weight between 70-80kg
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    // Small daily fluctuations with a slight downward trend
    const trendFactor = i / (days * 2); // Small downward trend
    const dailyFluctuation = (Math.random() - 0.5) * 0.3; // -0.15 to 0.15 kg fluctuation
    const weight = baseWeight - trendFactor + dailyFluctuation;
    
    result.push({
      date: dateStr,
      weight: parseFloat(weight.toFixed(1))
    });
  }
  
  return result;
};

const calculateMacroBreakdown = (data: NutrientData[]): MacroBreakdown[] => {
  if (data.length === 0) return [];
  
  // Use the most recent day
  const latestData = data[data.length - 1];
  
  const totalCalories = latestData.protein * 4 + latestData.carbs * 4 + latestData.fat * 9;
  
  return [
    {
      name: 'Protein',
      percentage: Math.round((latestData.protein * 4 / totalCalories) * 100),
      color: '#FF6384',
      legendFontColor: '#7F7F7F'
    },
    {
      name: 'Carbs',
      percentage: Math.round((latestData.carbs * 4 / totalCalories) * 100),
      color: '#36A2EB',
      legendFontColor: '#7F7F7F'
    },
    {
      name: 'Fat',
      percentage: Math.round((latestData.fat * 9 / totalCalories) * 100),
      color: '#FFCE56',
      legendFontColor: '#7F7F7F'
    }
  ];
};

export default function AnalyticsScreen() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [dateRange, setDateRange] = useState<string>('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<'nutrition' | 'water' | 'weight' | 'macros'>('nutrition');
  
  // State for our different data types
  const [nutritionData, setNutritionData] = useState<NutrientData[]>([]);
  const [waterData, setWaterData] = useState<WaterData[]>([]);
  const [weightData, setWeightData] = useState<WeightData[]>([]);
  const [macroBreakdown, setMacroBreakdown] = useState<MacroBreakdown[]>([]);
  
  const screenWidth = Dimensions.get('window').width - 32; // Account for padding
  
  useEffect(() => {
    // Simulate loading data
    setLoading(true);
    
    // Set appropriate date range label
    let startDate = new Date();
    let endDate = new Date();
    let days = 7;
    
    if (activeTab === 'daily') {
      days = 7;
      startDate.setDate(endDate.getDate() - 6);
    } else if (activeTab === 'weekly') {
      days = 28;
      startDate.setDate(endDate.getDate() - 27);
    } else {
      days = 90;
      startDate.setDate(endDate.getDate() - 89);
    }
    
    const formattedStartDate = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const formattedEndDate = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    setDateRange(`${formattedStartDate} - ${formattedEndDate}`);
    
    // Generate demo data based on the selected time range
    const nutrientData = generateDailyData(days);
    const water = generateWaterData(days);
    const weight = generateWeightData(days);
    
    setNutritionData(nutrientData);
    setWaterData(water);
    setWeightData(weight);
    setMacroBreakdown(calculateMacroBreakdown(nutrientData));
    
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, [activeTab]);
  
  const navigateDateRange = (direction: 'prev' | 'next') => {
    // This would implement date navigation, for demo we'll just show a message
    console.log(`Navigate ${direction} in ${activeTab} view`);
    // In a real implementation, you would adjust the date range and refresh data
  };
  
  const formatChartData = () => {
    // Format data differently based on the active tab and selected metric
    if (selectedMetric === 'nutrition') {
      const labels = nutritionData.map(d => {
        const date = new Date(d.date);
        return activeTab === 'daily' 
          ? date.toLocaleDateString('en-US', { weekday: 'short' }) 
          : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      });
      
      // For weekly/monthly views, we might want to aggregate data
      if (activeTab !== 'daily') {
        // For demo, we'll just use a subset of points to make the chart readable
        const stride = activeTab === 'weekly' ? 4 : 7; // Take every 4th or 7th point
        return {
          labels: labels.filter((_, i) => i % stride === 0),
          datasets: [
            {
              data: nutritionData.filter((_, i) => i % stride === 0).map(d => d.calories),
              color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`,
              strokeWidth: 2
            }
          ],
          legend: ['Calories']
        };
      }
      
      return {
        labels,
        datasets: [
          {
            data: nutritionData.map(d => d.calories),
            color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`,
            strokeWidth: 2
          }
        ],
        legend: ['Calories']
      };
    } else if (selectedMetric === 'water') {
      const labels = waterData.map(d => {
        const date = new Date(d.date);
        return activeTab === 'daily' 
          ? date.toLocaleDateString('en-US', { weekday: 'short' }) 
          : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      });
      
      // For weekly/monthly views, we might want to aggregate data
      if (activeTab !== 'daily') {
        const stride = activeTab === 'weekly' ? 4 : 7;
        return {
          labels: labels.filter((_, i) => i % stride === 0),
          datasets: [
            {
              data: waterData.filter((_, i) => i % stride === 0).map(d => d.amount),
              color: (opacity = 1) => `rgba(54, 162, 235, ${opacity})`,
              strokeWidth: 2
            }
          ],
          legend: ['Water (ml)']
        };
      }
      
      return {
        labels,
        datasets: [
          {
            data: waterData.map(d => d.amount),
            color: (opacity = 1) => `rgba(54, 162, 235, ${opacity})`,
            strokeWidth: 2
          }
        ],
        legend: ['Water (ml)']
      };
    } else if (selectedMetric === 'weight') {
      const labels = weightData.map(d => {
        const date = new Date(d.date);
        return activeTab === 'daily' 
          ? date.toLocaleDateString('en-US', { weekday: 'short' }) 
          : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      });
      
      // For weekly/monthly views, use a subset of points
      if (activeTab !== 'daily') {
        const stride = activeTab === 'weekly' ? 4 : 7;
        return {
          labels: labels.filter((_, i) => i % stride === 0),
          datasets: [
            {
              data: weightData.filter((_, i) => i % stride === 0).map(d => d.weight),
              color: (opacity = 1) => `rgba(75, 192, 192, ${opacity})`,
              strokeWidth: 2
            }
          ],
          legend: ['Weight (kg)']
        };
      }
      
      return {
        labels,
        datasets: [
          {
            data: weightData.map(d => d.weight),
            color: (opacity = 1) => `rgba(75, 192, 192, ${opacity})`,
            strokeWidth: 2
          }
        ],
        legend: ['Weight (kg)']
      };
    } else {
      // For macros, we return data formatted for the pie chart
      return macroBreakdown;
    }
  };
  
  const chartData = formatChartData();
  
  const chartConfigs = {
    backgroundGradientFrom: theme.colors.card,
    backgroundGradientTo: theme.colors.card,
    decimalPlaces: selectedMetric === 'weight' ? 1 : 0,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => theme.colors.text,
    style: {
      borderRadius: 16
    },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: "#ffa726"
    }
  };
  
  const renderChart = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Loading analytics data...
          </Text>
        </View>
      );
    }
    
    if (selectedMetric === 'macros') {
      return (
        <View style={styles.chartContainer}>
          <PieChart
            data={chartData as MacroBreakdown[]}
            width={screenWidth}
            height={220}
            chartConfig={chartConfigs}
            accessor="percentage"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
          
          <View style={styles.macroLegend}>
            {macroBreakdown.map((item, index) => (
              <View key={index} style={styles.macroLegendItem}>
                <View style={[styles.macroLegendColor, { backgroundColor: item.color }]} />
                <Text style={[styles.macroLegendText, { color: theme.colors.text }]}>
                  {item.name}: {item.percentage}%
                </Text>
              </View>
            ))}
          </View>
        </View>
      );
    }
    
    // For nutrition data (calories), use a bar chart
    if (selectedMetric === 'nutrition') {
      return (
        <View style={styles.chartContainer}>
          <BarChart
            data={chartData as any}
            width={screenWidth}
            height={220}
            yAxisLabel=""
            yAxisSuffix=" cal"
            chartConfig={chartConfigs}
            style={{
              marginVertical: 8,
              borderRadius: 16
            }}
          />
          
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {nutritionData.length > 0 ? nutritionData[nutritionData.length - 1].calories : 0}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Today's Calories
              </Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {nutritionData.length > 0 
                  ? Math.round(nutritionData.reduce((acc, curr) => acc + curr.calories, 0) / nutritionData.length) 
                  : 0}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Avg. Calories
              </Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {nutritionData.length > 0 
                  ? Math.max(...nutritionData.map(d => d.calories)) 
                  : 0}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Max Calories
              </Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {nutritionData.length > 0 
                  ? Math.min(...nutritionData.map(d => d.calories)) 
                  : 0}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Min Calories
              </Text>
            </View>
          </View>
        </View>
      );
    }
    
    // For water and weight, use line charts
    return (
      <View style={styles.chartContainer}>
        <LineChart
          data={chartData as any}
          width={screenWidth}
          height={220}
          yAxisLabel=""
          yAxisSuffix={selectedMetric === 'water' ? " ml" : " kg"}
          chartConfig={chartConfigs}
          bezier
          style={{
            marginVertical: 8,
            borderRadius: 16
          }}
        />
        
        <View style={styles.statsGrid}>
          {selectedMetric === 'water' ? (
            <>
              <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
                <Text style={[styles.statValue, { color: theme.colors.text }]}>
                  {waterData.length > 0 ? waterData[waterData.length - 1].amount : 0} ml
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                  Today's Water
                </Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
                <Text style={[styles.statValue, { color: theme.colors.text }]}>
                  {waterData.length > 0 
                    ? Math.round(waterData.reduce((acc, curr) => acc + curr.amount, 0) / waterData.length) 
                    : 0} ml
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                  Avg. Daily Water
                </Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
                <Text style={[styles.statValue, { color: theme.colors.success }]}>
                  {waterData.length > 0 
                    ? `${Math.round((waterData[waterData.length - 1].amount / 2500) * 100)}%` 
                    : '0%'}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                  Daily Goal
                </Text>
              </View>
            </>
          ) : (
            <>
              <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
                <Text style={[styles.statValue, { color: theme.colors.text }]}>
                  {weightData.length > 0 ? weightData[weightData.length - 1].weight : 0} kg
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                  Current Weight
                </Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
                <Text style={[styles.statValue, { color: weightData.length > 1 
                  ? (weightData[weightData.length - 1].weight < weightData[0].weight ? theme.colors.success : theme.colors.danger) 
                  : theme.colors.text }]}>
                  {weightData.length > 1 
                    ? (weightData[weightData.length - 1].weight - weightData[0].weight).toFixed(1) 
                    : 0} kg
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                  {activeTab === 'daily' ? '7-Day' : activeTab === 'weekly' ? '4-Week' : '3-Month'} Change
                </Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
                <Text style={[styles.statValue, { color: theme.colors.text }]}>
                  {weightData.length > 0 
                    ? (weightData.reduce((acc, curr) => acc + curr.weight, 0) / weightData.length).toFixed(1)
                    : 0} kg
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                  Avg. Weight
                </Text>
              </View>
            </>
          )}
        </View>
      </View>
    );
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Analytics</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color={theme.colors.text} />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.timeRangeSelector}>
          <TouchableOpacity 
            style={styles.arrowButton} 
            onPress={() => navigateDateRange('prev')}
          >
            <ArrowLeft size={20} color={theme.colors.text} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.dateRangeButton}
            onPress={() => setShowDropdown(!showDropdown)}
          >
            <Calendar size={16} color={theme.colors.primary} style={styles.calendarIcon} />
            <Text style={[styles.dateRangeText, { color: theme.colors.text }]}>{dateRange}</Text>
            <ChevronDown size={16} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.arrowButton} 
            onPress={() => navigateDateRange('next')}
          >
            <ArrowRight size={20} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
        
        {showDropdown && (
          <View style={[styles.dropdown, { backgroundColor: theme.colors.card }]}>
            <TouchableOpacity 
              style={styles.dropdownItem}
              onPress={() => {
                setShowDropdown(false);
                // Here you would implement custom date range selection
              }}
            >
              <Text style={[styles.dropdownText, { color: theme.colors.text }]}>
                Custom Date Range
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.dropdownItem}
              onPress={() => {
                setShowDropdown(false);
                // Reset to today
              }}
            >
              <Text style={[styles.dropdownText, { color: theme.colors.text }]}>
                Reset to Today
              </Text>
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[
              styles.tab, 
              activeTab === 'daily' && [styles.activeTab, { borderBottomColor: theme.colors.primary }]
            ]}
            onPress={() => setActiveTab('daily')}
          >
            <Text style={[
              styles.tabText, 
              { color: activeTab === 'daily' ? theme.colors.primary : theme.colors.textSecondary }
            ]}>
              Daily
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.tab, 
              activeTab === 'weekly' && [styles.activeTab, { borderBottomColor: theme.colors.primary }]
            ]}
            onPress={() => setActiveTab('weekly')}
          >
            <Text style={[
              styles.tabText, 
              { color: activeTab === 'weekly' ? theme.colors.primary : theme.colors.textSecondary }
            ]}>
              Weekly
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.tab, 
              activeTab === 'monthly' && [styles.activeTab, { borderBottomColor: theme.colors.primary }]
            ]}
            onPress={() => setActiveTab('monthly')}
          >
            <Text style={[
              styles.tabText, 
              { color: activeTab === 'monthly' ? theme.colors.primary : theme.colors.textSecondary }
            ]}>
              Monthly
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.metricSelector}>
          <TouchableOpacity 
            style={[
              styles.metricButton, 
              selectedMetric === 'nutrition' && [styles.selectedMetric, { backgroundColor: theme.colors.primaryLight }]
            ]}
            onPress={() => setSelectedMetric('nutrition')}
          >
            <Text style={[
              styles.metricText, 
              { color: selectedMetric === 'nutrition' ? theme.colors.primary : theme.colors.textSecondary }
            ]}>
              Calories
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.metricButton, 
              selectedMetric === 'water' && [styles.selectedMetric, { backgroundColor: theme.colors.primaryLight }]
            ]}
            onPress={() => setSelectedMetric('water')}
          >
            <Text style={[
              styles.metricText, 
              { color: selectedMetric === 'water' ? theme.colors.primary : theme.colors.textSecondary }
            ]}>
              Water
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.metricButton, 
              selectedMetric === 'weight' && [styles.selectedMetric, { backgroundColor: theme.colors.primaryLight }]
            ]}
            onPress={() => setSelectedMetric('weight')}
          >
            <Text style={[
              styles.metricText, 
              { color: selectedMetric === 'weight' ? theme.colors.primary : theme.colors.textSecondary }
            ]}>
              Weight
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.metricButton, 
              selectedMetric === 'macros' && [styles.selectedMetric, { backgroundColor: theme.colors.primaryLight }]
            ]}
            onPress={() => setSelectedMetric('macros')}
          >
            <Text style={[
              styles.metricText, 
              { color: selectedMetric === 'macros' ? theme.colors.primary : theme.colors.textSecondary }
            ]}>
              Macros
            </Text>
          </TouchableOpacity>
        </View>
        
        {renderChart()}
        
        <View style={[styles.insightsContainer, { backgroundColor: theme.colors.card }]}>
          <View style={styles.insightsHeader}>
            <Text style={[styles.insightsTitle, { color: theme.colors.text }]}>
              Insights
            </Text>
            <Info size={16} color={theme.colors.info} />
          </View>
          
          <View style={styles.insightCard}>
            <Text style={[styles.insightText, { color: theme.colors.text }]}>
              Your calorie intake was 12% lower than last week, great job on maintaining your deficit!
            </Text>
          </View>
          
          <View style={styles.insightCard}>
            <Text style={[styles.insightText, { color: theme.colors.text }]}>
              You've averaged 2,300ml of water daily this week, exceeding your goal of 2,000ml.
            </Text>
          </View>
          
          <View style={styles.insightCard}>
            <Text style={[styles.insightText, { color: theme.colors.text }]}>
              Your protein intake has been consistent, staying between 20-25% of your total calories.
            </Text>
          </View>
        </View>
        
        <View style={styles.exportSection}>
          <TouchableOpacity 
            style={[styles.exportButton, { backgroundColor: theme.colors.card }]}
          >
            <Text style={[styles.exportText, { color: theme.colors.primary }]}>
              Export Data
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.exportButton, { backgroundColor: theme.colors.card }]}
          >
            <Text style={[styles.exportText, { color: theme.colors.primary }]}>
              Generate Report
            </Text>
          </TouchableOpacity>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  filterButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  timeRangeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  arrowButton: {
    padding: 8,
  },
  dateRangeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  calendarIcon: {
    marginRight: 6,
  },
  dateRangeText: {
    fontSize: 16,
    marginRight: 6,
  },
  dropdown: {
    position: 'absolute',
    top: 50,
    left: 50,
    right: 50,
    zIndex: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  dropdownText: {
    fontSize: 15,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
  },
  metricSelector: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  metricButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 2,
  },
  selectedMetric: {
    borderRadius: 8,
  },
  metricText: {
    fontSize: 14,
    fontWeight: '500',
  },
  chartContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  loadingContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
    width: '100%',
  },
  statCard: {
    width: '48%',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
  },
  macroLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  macroLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  macroLegendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  macroLegendText: {
    fontSize: 14,
  },
  insightsContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  insightCard: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  insightText: {
    fontSize: 14,
    lineHeight: 20,
  },
  exportSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  exportButton: {
    width: '48%',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  exportText: {
    fontSize: 16,
    fontWeight: '500',
  },
}); 