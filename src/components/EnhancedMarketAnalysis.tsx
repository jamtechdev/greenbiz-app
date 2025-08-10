// Enhanced Market Analysis Component with proper currency handling
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

// Currency conversion helper (you'll need to implement this with real exchange rates)
const convertCurrency = (amount, fromCurrency, toCurrency) => {
  // This is a placeholder - implement with real exchange rate API
  const exchangeRates = {
    USD: 1,
    CNY: 7.2,
    TWD: 31.5,
    THB: 36,
    VND: 24000,
    HKD: 7.8,
    EUR: 0.92,
    CAD: 1.36,
    GBP: 0.79,
    AUD: 1.53,
    PKR: 278,
    AED: 3.67,
  };
  
  const baseAmount = amount / (exchangeRates[fromCurrency] || 1);
  return baseAmount * (exchangeRates[toCurrency] || 1);
};

// Extract currency symbol from currency string
const getCurrencySymbol = (currency) => {
  const currencyMap = {
    'USD': '$',
    'CNY': '¥',
    'TWD': 'NT$',
    'THB': '฿',
    'VND': '₫',
    'HKD': 'HK$',
    'EUR': '€',
    'CAD': 'C$',
    'GBP': '£',
    'AUD': 'A$',
    'PKR': 'Rs',
    'AED': 'د.إ',
  };
  
  // If currency is in format "USD ($)", extract the code
  const currencyCode = currency.split(' ')[0];
  return currencyMap[currencyCode] || currencyCode;
};

// Simple helper function with currency handling
const calculateMarketStats = (priceData, displayCurrency = 'USD', convertPrices = false) => {
  if (!priceData || Object.keys(priceData).length === 0) {
    return null;
  }

  const prices = Object.values(priceData)
    .map(price => {
      let numPrice = parseFloat(price);
      if (convertPrices && displayCurrency !== 'USD') {
        numPrice = convertCurrency(numPrice, 'USD', displayCurrency);
      }
      return numPrice;
    })
    .filter(price => !isNaN(price) && price > 0);
  
  if (prices.length === 0) {
    return null;
  }

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
  
  const sortedPrices = [...prices].sort((a, b) => a - b);
  const medianPrice = sortedPrices.length % 2 === 0
    ? (sortedPrices[sortedPrices.length / 2 - 1] + sortedPrices[sortedPrices.length / 2]) / 2
    : sortedPrices[Math.floor(sortedPrices.length / 2)];

  return {
    min: minPrice,
    max: maxPrice,
    average: avgPrice,
    median: medianPrice,
    count: prices.length,
    isConverted: convertPrices && displayCurrency !== 'USD',
    originalCurrency: 'USD',
    displayCurrency: displayCurrency,
  };
};

// Enhanced Market Analysis Component
const EnhancedMarketAnalysis = ({ 
  priceData, 
  currency,
  userCurrency, 
  convertPrices = false, // Option to convert or keep in USD
  showCurrencyToggle = false // Option to show currency toggle
}) => {
  const [displayInUserCurrency, setDisplayInUserCurrency] = React.useState(false);
  const displayCurrency = (convertPrices && displayInUserCurrency) ? userCurrency : 'USD';
  const marketStats = calculateMarketStats(priceData, displayCurrency, convertPrices && displayInUserCurrency);

  if (!marketStats) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Icon name="search" size={18} color="#f59e0b" />
          <Text style={styles.title}>Market Analysis</Text>
        </View>
        <View style={styles.noData}>
          <Icon name="alert-circle" size={24} color="#f59e0b" />
          <Text style={styles.noDataTitle}>No Market Data Found</Text>
          <Text style={styles.noDataText}>
            We couldn't find any sources currently selling your machine. This could mean:
          </Text>
          <View style={styles.reasonsList}>
            <Text style={styles.reasonItem}>• Your machine is rare or unique</Text>
            <Text style={styles.reasonItem}>• It's not commonly sold online</Text>
            <Text style={styles.reasonItem}>• Try adjusting the machine details</Text>
          </View>
        </View>
      </View>
    );
  }

  const formatPrice = (price) => {
    const currencySymbol = getCurrencySymbol(displayCurrency);
    return `${currencySymbol} ${Math.round(price).toLocaleString()}`;
  };

  return (
    <View style={styles.container}>
      {/* Header with Currency Info */}
      <View style={styles.header}>
        <Icon name="trending-up" size={18} color="#10b981" />
        <Text style={styles.title}>Market Analysis</Text>
        <Text style={styles.sourceCount}>
          {marketStats.count} source{marketStats.count !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Currency Disclaimer */}
      <View style={styles.currencyDisclaimer}>
        <Icon name="info" size={14} color="#6b7280" />
        <Text style={styles.disclaimerText}>
          Market data sourced in USD
          {displayInUserCurrency && userCurrency !== 'USD' 
            ? ` • Converted to ${userCurrency} (rates may vary)`
            : ''
          }
        </Text>
      </View>

      {/* Currency Toggle (Optional) */}
      {showCurrencyToggle && userCurrency !== 'USD' && (
        <TouchableOpacity 
          style={styles.currencyToggle}
          onPress={() => setDisplayInUserCurrency(!displayInUserCurrency)}
        >
          <Icon 
            name="refresh-cw" 
            size={14} 
            color="#6366f1" 
          />
          <Text style={styles.currencyToggleText}>
            Show in {displayInUserCurrency ? 'USD' : userCurrency}
          </Text>
        </TouchableOpacity>
      )}

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {/* Minimum */}
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Icon name="arrow-down" size={14} color="#ef4444" />
            <Text style={styles.statLabel}>Minimum</Text>
          </View>
          <Text style={[styles.statValue, { color: '#ef4444' }]}>
            {formatPrice(marketStats.min)}
          </Text>
        </View>

        {/* Maximum */}
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Icon name="arrow-up" size={14} color="#10b981" />
            <Text style={styles.statLabel}>Maximum</Text>
          </View>
          <Text style={[styles.statValue, { color: '#10b981' }]}>
            {formatPrice(marketStats.max)}
          </Text>
        </View>

        {/* Average */}
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Icon name="bar-chart" size={14} color="#3b82f6" />
            <Text style={styles.statLabel}>Average</Text>
          </View>
          <Text style={[styles.statValue, { color: '#3b82f6' }]}>
            {formatPrice(marketStats.average)}
          </Text>
        </View>

        {/* Median */}
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Icon name="target" size={14} color="#8b5cf6" />
            <Text style={styles.statLabel}>Median</Text>
          </View>
          <Text style={[styles.statValue, { color: '#8b5cf6' }]}>
            {formatPrice(marketStats.median)}
          </Text>
        </View>
      </View>

      {/* Conversion Warning */}
      {displayInUserCurrency && userCurrency !== 'USD' && (
        <View style={styles.conversionWarning}>
          <Icon name="alert-triangle" size={14} color="#f59e0b" />
          <Text style={styles.warningText}>
            Exchange rates are approximate and may not reflect actual market conditions
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },

  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    fontFamily: 'Poppins-SemiBold',
    flex: 1,
  },

  sourceCount: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Poppins-Regular',
  },

  // Currency Disclaimer
  currencyDisclaimer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  disclaimerText: {
    fontSize: 11,
    color: '#6b7280',
    fontFamily: 'Poppins-Regular',
    flex: 1,
  },

  // Currency Toggle
  currencyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0f9ff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#6366f1',
    alignSelf: 'flex-start',
  },

  currencyToggleText: {
    fontSize: 12,
    color: '#6366f1',
    fontFamily: 'Poppins-Medium',
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },

  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },

  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    fontFamily: 'Poppins-Medium',
  },

  statValue: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Poppins-Bold',
  },

  // Conversion Warning
  conversionWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fef3c7',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },

  warningText: {
    fontSize: 11,
    color: '#92400e',
    fontFamily: 'Poppins-Regular',
    flex: 1,
  },

  // No Data State
  noData: {
    paddingVertical: 20,
    alignItems: 'center',
    gap: 8,
  },

  noDataTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    fontFamily: 'Poppins-SemiBold',
    marginTop: 8,
  },

  noDataText: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 20,
  },

  reasonsList: {
    alignItems: 'flex-start',
    gap: 4,
  },

  reasonItem: {
    fontSize: 13,
    color: '#9ca3af',
    fontFamily: 'Poppins-Regular',
    lineHeight: 18,
  },
});

export default EnhancedMarketAnalysis;