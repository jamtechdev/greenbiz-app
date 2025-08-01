import React, { useState, useEffect, useCallback } from 'react';
import Modal from 'react-native-modal';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import BottomNav from '../../../components/BottomNavbar';
import { useAppContext } from '../../../_customContext/AppProvider';

import { apiService } from '../../../api/axiosConfig';
import { useCustomAlert } from '../../../hook/useCustomAlert';
import { useSelector } from 'react-redux';

const { width, height } = Dimensions.get('window');

export default function MyListingsScreen({ navigation }) {
  const { showOverlay, setShowOverlay } = useAppContext();
  const { showConfirm, showError, showSuccess } = useCustomAlert();

  const [activeMenuId, setActiveMenuId] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    published: 0,
    pending: 0,
    totalViews: 0,
  });

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];
  const scaleAnim = useState(new Animated.Value(0.9))[0];
  const { user, isAuthenticated, token } = useSelector(
    state => state.auth || {},
  );

  // Fetch listings on component mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchListings();
    }

    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Focus listener to refetch data when returning to screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchListings();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching user listings...');

      const response = await apiService.getAllListing();

      if (response.data && response.data.success) {
        const listingsData = response.data.data || [];
        setListings(listingsData);
        calculateStats(listingsData);
        console.log('✅ Listings fetched successfully:', listingsData.length);
      } else {
        console.log('⚠️ No listings data received');
        setListings([]);
        setStats({ published: 0, pending: 0, totalViews: 0 });
      }
    } catch (error) {
      console.error('❌ Error fetching listings:', error);
      // Error is handled by axios interceptor, but we can show a specific message
      if (error.response?.status !== 401) {
        // Don't show error for auth issues
        showError({
          title: 'Failed to Load Listings',
          message: 'Unable to fetch your listings. Please try again.',
        });
      }
      setListings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateStats = listingsData => {
    const published = listingsData.filter(
      item => item.status === 'published' || item.status === 'publish',
    ).length;

    const pending = listingsData.filter(
      item => item.status === 'pending' || item.status === 'draft',
    ).length;

    // Since your API doesn't return views, we'll set totalViews to 0 or use a placeholder
    const totalViews = 0; // You can update this when view data is available

    setStats({ published, pending, totalViews });
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchListings();
  }, []);

  const handleViewDetails = listing => {
    setActiveMenuId(null);
    // Navigate to listing details screen
    navigation.navigate('ListingDetails', {
      listingId: listing.ID,
      listing: listing,
    });
  };

  const handleEditListing = listing => {
    setActiveMenuId(null);
    // Navigate to edit screen
    navigation.navigate('EditListing', {
      listingId: listing.ID,
      listing: listing,
    });
  };

  const handleDeleteListing = listing => {
    setActiveMenuId(null);

    showConfirm({
      title: 'Delete Listing',
      message: `Are you sure you want to delete "${listing.title}"? This action cannot be undone.`,
      confirmText: 'Delete',
      destructive: true,
      onConfirm: async () => {
        try {
          console.log('🗑️ Deleting listing:', listing.ID);

          await apiService.deleteListing(listing.ID);

          showSuccess({
            title: 'Listing Deleted',
            message: 'Your listing has been successfully deleted.',
            onPress: () => {
              // Refresh the listings after successful deletion
              fetchListings();
            },
          });
        } catch (error) {
          console.error('❌ Error deleting listing:', error);
          showError({
            title: 'Delete Failed',
            message: 'Unable to delete the listing. Please try again.',
          });
        }
      },
    });
  };

  const formatDate = dateString => {
    if (!dateString) return 'Unknown';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Unknown';
    }
  };

  const getStatusColor = status => {
    switch (status?.toLowerCase()) {
      case 'published':
      case 'publish':
        return { bg: '#10b98120', text: '#10b981' };
      case 'pending':
      case 'draft':
        return { bg: '#f59e0b20', text: '#f59e0b' };
      default:
        return { bg: '#6b728020', text: '#6b7280' };
    }
  };

  const getConditionColor = condition => {
    switch (condition?.toLowerCase()) {
      case 'new':
        return { bg: '#10b98120', text: '#10b981' };
      case 'used':
      case 'good':
        return { bg: '#f59e0b20', text: '#f59e0b' };
      case 'poor':
        return { bg: '#ef444420', text: '#ef4444' };
      default:
        return { bg: '#6b728020', text: '#6b7280' };
    }
  };

  const currentListing = listings.find(item => item.ID === activeMenuId);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading your listings...</Text>
        </View>
      </View>
    );
  }

  return (
    <>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#c0faf5"
        translucent
      />
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3b82f6']}
            tintColor="#3b82f6"
            progressBackgroundColor="#c0faf5"
          />
        }
      >
        {/* Simplified Clean Header */}
        <View style={styles.header}>
          <Animated.View
            style={[
              styles.headerContent,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.headerTop}>
              <View style={styles.headerLeft}>
                <Text style={styles.headerTitle}>My Listings</Text>
                <View style={styles.headerBadge}>
                  <Icon name="package" size={14} color="#6b7280" />
                  <Text style={styles.headerSubtitle}>
                    {listings.length} machine{listings.length !== 1 ? 's' : ''}{' '}
                    listed
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowOverlay(true)}
                activeOpacity={0.8}
              >
                <Icon name="plus" size={18} color="#ffffff" />
                <Text style={styles.addButtonText}>Add New</Text>
              </TouchableOpacity>
            </View>

            {/* Clean Stats Cards */}
            <Animated.View
              style={[
                styles.statsContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <View
                    style={[
                      styles.statIconContainer,
                      { backgroundColor: '#e0f4f3' },
                    ]}
                  >
                    <Icon name="check-circle" size={22} color="#0d9488" />
                  </View>
                  <Text style={styles.statValue}>{stats.published}</Text>
                  <Text style={[styles.statLabel, { color: '#0d9488' }]}>
                    Published
                  </Text>
                </View>

                <View style={styles.statCard}>
                  <View
                    style={[
                      styles.statIconContainer,
                      { backgroundColor: '#f0f4ff' },
                    ]}
                  >
                    <Icon name="clock" size={22} color="#4f46e5" />
                  </View>
                  <Text style={styles.statValue}>{stats.pending}</Text>
                  <Text style={[styles.statLabel, { color: '#4f46e5' }]}>
                    Pending
                  </Text>
                </View>

                <View style={styles.statCard}>
                  <View
                    style={[
                      styles.statIconContainer,
                      { backgroundColor: '#ecfdf5' },
                    ]}
                  >
                    <Icon name="eye" size={22} color="#059669" />
                  </View>
                  <Text style={styles.statValue}>{stats.totalViews}</Text>
                  <Text style={[styles.statLabel, { color: '#059669' }]}>
                    Total Views
                  </Text>
                </View>
              </View>
            </Animated.View>
          </Animated.View>
        </View>

        {/* Enhanced Listings Section */}
        <View style={styles.listingContainer}>
          {listings.length === 0 ? (
            <Animated.View
              style={[
                styles.emptyState,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <View style={styles.emptyIconContainer}>
                <Icon name="package" size={32} color="#6b7280" />
              </View>
              <Text style={styles.emptyTitle}>No Listings Yet</Text>
              <Text style={styles.emptyDescription}>
                Start by adding your first equipment listing and watch your
                business grow
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => setShowOverlay(true)}
                activeOpacity={0.8}
              >
                <Icon name="plus" size={18} color="#ffffff" />
                <Text style={styles.emptyButtonText}>
                  Add Your First Listing
                </Text>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            listings.map((item, index) => {
              const statusColor = getStatusColor(item.status);
              const conditionColor = getConditionColor(
                item.condition || item.item_condition,
              );
              const productType = Array.isArray(item.type)
                ? item.type[0]
                : item.type;

              return (
                <Animated.View
                  key={item.ID}
                  style={[
                    styles.cardWrapper,
                    {
                      opacity: fadeAnim,
                      transform: [
                        { translateY: slideAnim },
                        { scale: scaleAnim },
                      ],
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.card}
                    onPress={() => handleViewDetails(item)}
                    activeOpacity={0.95}
                  >
                    <View style={styles.cardContent}>
                      {/* Enhanced Image Container */}
                      <View style={styles.imageContainer}>
                        <Image
                          source={{
                            uri:
                              item.thumbnail ||
                              'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400',
                          }}
                          style={styles.cardImage}
                        />
                        <View style={styles.imageOverlay}>
                          <View style={styles.viewsBadge}>
                            <Icon name="eye" size={12} color="#fff" />
                            <Text style={styles.viewsText}>0</Text>
                          </View>
                        </View>
                      </View>

                      <View style={styles.cardBody}>
                        <View style={styles.cardHeader}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.cardTitle} numberOfLines={2}>
                              {item.title || 'Untitled Listing'}
                            </Text>
                            <View style={styles.badgeRow}>
                              <View
                                style={[
                                  styles.badge,
                                  { backgroundColor: statusColor.bg },
                                ]}
                              >
                                <View
                                  style={[
                                    styles.badgeDot,
                                    { backgroundColor: statusColor.text },
                                  ]}
                                />
                                <Text
                                  style={[
                                    styles.badgeText,
                                    { color: statusColor.text },
                                  ]}
                                >
                                  {item.status || 'draft'}
                                </Text>
                              </View>
                              {productType && (
                                <View
                                  style={[
                                    styles.badge,
                                    { backgroundColor: '#e0f2fe' },
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.badgeText,
                                      { color: '#0277bd' },
                                    ]}
                                  >
                                    {productType}
                                  </Text>
                                </View>
                              )}
                            </View>
                          </View>
                          <TouchableOpacity
                            style={styles.menuBtn}
                            onPress={() => setActiveMenuId(item.ID)}
                            activeOpacity={0.7}
                          >
                            <Icon
                              name="more-vertical"
                              size={18}
                              color="#64748b"
                            />
                          </TouchableOpacity>
                        </View>
                        <View style={styles.cardFooter}>
                          <View style={styles.metaRow}>
                            <Icon name="calendar" size={12} color="#94a3b8" />
                            <Text style={styles.metaText}>
                              Listed {formatDate(item.created_at)}
                            </Text>
                          </View>
                          <View style={styles.tagRow}>
                            {item.price && (
                              <View style={styles.tag}>
                                <Text style={styles.tagText}>
                                  {item.price
                                    ? `${item.price}`
                                    : 'Price on request'}
                                </Text>
                              </View>
                            )}
                            {productType && (
                              <View style={styles.tag}>
                                <Text style={styles.tagText}>
                                  {productType}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              );
            })
          )}
        </View>
      </ScrollView>

      <BottomNav setShowOverlay={setShowOverlay} navigation={navigation} />

      {/* Enhanced Action Menu Modal */}
      <Modal
        isVisible={activeMenuId !== null}
        onBackdropPress={() => setActiveMenuId(null)}
        backdropOpacity={0.3}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        style={styles.modalStyle}
      >
        <View style={styles.popoverMenu}>
          <View style={styles.menuHandle} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => currentListing && handleViewDetails(currentListing)}
            activeOpacity={0.7}
          >
            <View
              style={[styles.menuIconContainer, { backgroundColor: '#dbeafe' }]}
            >
              <Icon name="eye" size={18} color="#3b82f6" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuText}>View Details</Text>
              <Text style={styles.menuSubtext}>
                See full listing information
              </Text>
            </View>
            <Icon name="chevron-right" size={16} color="#94a3b8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => currentListing && handleEditListing(currentListing)}
            activeOpacity={0.7}
          >
            <View
              style={[styles.menuIconContainer, { backgroundColor: '#fef3c7' }]}
            >
              <Icon name="edit" size={18} color="#f59e0b" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuText}>Edit Listing</Text>
              <Text style={styles.menuSubtext}>
                Modify your listing details
              </Text>
            </View>
            <Icon name="chevron-right" size={16} color="#94a3b8" />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={[styles.menuItem, styles.dangerMenuItem]}
            onPress={() =>
              currentListing && handleDeleteListing(currentListing)
            }
            activeOpacity={0.7}
          >
            <View
              style={[styles.menuIconContainer, { backgroundColor: '#fee2e2' }]}
            >
              <Icon name="trash-2" size={18} color="#dc2626" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={[styles.menuText, { color: '#dc2626' }]}>
                Delete Listing
              </Text>
              <Text style={styles.menuSubtext}>
                Permanently remove this listing
              </Text>
            </View>
            <Icon name="chevron-right" size={16} color="#dc2626" />
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Clean Loading Styles
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    color: '#374151',
    fontWeight: '600',
    textAlign: 'center',
  },

  // Enhanced Header Styles with Organic Colors
  header: {
    backgroundColor: '#c0faf5',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 28,
    paddingHorizontal: 20,
    borderBottomWidth: 3,
    borderBottomColor: '#e0f4f3',
    position: 'relative',
  },
  headerContent: {
    flex: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 28,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0d9488',
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 25,
    alignSelf: 'flex-start',
    gap: 8,
    borderWidth: 2,
    borderColor: '#e0f4f3',
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#4f46e5',
    fontWeight: '700',
  },

  // Enhanced Add Button with Extracted Colors
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d9488',
    marginVertical: 20,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
    gap: 8,
    shadowColor: '#0d9488',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },

  // Enhanced Stats Container with Extracted Colors
  statsContainer: {
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#f0f9ff',
  },
  statIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  statLabel: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '600',
    textAlign: 'center',
  },

  // Listing Container
  listingContainer: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 120,
  },

  // Clean Empty State
  emptyState: {
    backgroundColor: '#ffffff',
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
    marginTop: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 16,
    gap: 10,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  emptyButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },

  // Clean Card Styles
  cardWrapper: {
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardContent: {
    flexDirection: 'row',
    padding: 16,
  },

  // Image Container
  imageContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardImage: {
    width: 90,
    height: 90,
    backgroundColor: '#f3f4f6',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 30,
    justifyContent: 'flex-end',
    paddingHorizontal: 8,
    paddingBottom: 6,
  },
  viewsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
    gap: 4,
  },
  viewsText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },

  cardBody: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 24,
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },

  // Clean Menu Button
  menuBtn: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
  },

  cardFooter: {
    gap: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tagText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },

  // Clean Modal Styles
  modalStyle: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  popoverMenu: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingBottom: 32,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 15,
  },
  menuHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#d1d5db',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#f8fafc',
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
    marginBottom: 2,
  },
  menuSubtext: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 8,
    marginHorizontal: 16,
  },
  dangerMenuItem: {
    backgroundColor: '#fef2f2',
  },
});
