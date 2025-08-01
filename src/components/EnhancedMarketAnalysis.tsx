import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

// Simple helper function
const calculateMarketStats = (priceData) => {
  if (!priceData || Object.keys(priceData).length === 0) {
    return null;
  }

  const prices = Object.values(priceData)
    .map(price => parseFloat(price))
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
  };
};

// Simple Market Analysis Component
const SimpleMarketAnalysis = ({ priceData, currency }) => {
  const marketStats = calculateMarketStats(priceData);

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
    return `${currency} ${Math.round(price).toLocaleString()}`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Icon name="trending-up" size={18} color="#10b981" />
        <Text style={styles.title}>Market Analysis</Text>
        <Text style={styles.sourceCount}>
          {marketStats.count} source{marketStats.count !== 1 ? 's' : ''}
        </Text>
      </View>

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
    </View>
  );
};

// Simple Clean Styles
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
    marginBottom: 16,
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

export default SimpleMarketAnalysis;