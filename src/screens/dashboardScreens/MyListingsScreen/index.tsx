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
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import BottomNav from '../../../components/BottomNavbar';
import { useAppContext } from '../../../_customContext/AppProvider';

import { apiService } from '../../../api/axiosConfig';
import { useCustomAlert } from '../../../hook/useCustomAlert';
import CustomAlert from '../../../components/CustomAlert';

// Redux language imports
import { 
  changeLanguage,
  selectCurrentLanguage,
  selectIsLanguageInitialized,
  selectLanguageLoading,
  selectAvailableLanguages 
} from '../../../store/slices/languageSlice';

const { width, height } = Dimensions.get('window');

export default function MyListingsScreen({ navigation }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { showOverlay, setShowOverlay } = useAppContext();
  const { alertConfig, showConfirm, showError, showSuccess, hideAlert } = useCustomAlert();

  // Redux language selectors
  const currentLanguage = useSelector(selectCurrentLanguage);
  const isLanguageInitialized = useSelector(selectIsLanguageInitialized);
  const isLanguageLoading = useSelector(selectLanguageLoading);
  const availableLanguages = useSelector(selectAvailableLanguages);

  // Local state
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
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

  // Language handling functions
  const handleLanguageChange = async (languageCode) => {
    try {
      await dispatch(changeLanguage(languageCode)).unwrap();
      setShowLanguageModal(false);
      console.log('✅ Language changed to:', languageCode);
    } catch (error) {
      console.error('❌ Error changing language:', error);
      showError({
        title: 'Language Change Failed',
        message: 'Unable to change language. Please try again.',
      });
    }
  };

  const getLanguageShortName = (langCode) => {
    const language = availableLanguages.find(lang => lang.code === langCode);
    return language?.shortName || 'EN';
  };

  // Show loading if language is not initialized yet
  if (!isLanguageInitialized || isLanguageLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Initializing...</Text>
        </View>
      </View>
    );
  }

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
      if (error.response?.status !== 401) {
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

    const totalViews = 0;

    setStats({ published, pending, totalViews });
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchListings();
  }, []);

  const handleViewDetails = listing => {
    setActiveMenuId(null);
    navigation.navigate('ProductDetailsById', { productId: listing.ID });
  };

  const handleEditListing = listing => {
    setActiveMenuId(null);
    navigation.navigate('editProductscreen', {
      listingId: listing.ID,
      listing: listing,
    });
  };

  const handlePublishListing = listing => {
    setActiveMenuId(null);
    
    console.log('📤 Attempting to publish listing:', listing.ID, listing.title);
    
    showConfirm({
      title: t('submitForReview'),
      message: `${t('submitForReview')} "${listing.title}" ${t('sendToAdmin')}`,
      confirmText: t('submitForReview'),
      onConfirm: async () => {
        try {
          setPublishing(true);
          console.log('📤 Publishing listing with ID:', listing.ID);
          
          const response = await apiService.updateListingStatus(listing.ID, 'pending');
          
          console.log('✅ Publish response:', response);
          
          if (response.data && response.data.success) {
            showSuccess({
              title: t('submitForReview'),
              message: t('sendToAdmin'),
              onPress: () => {
                fetchListings();
              },
            });
            
            fetchListings();
          } else {
            throw new Error(response.data?.message || 'Publish failed');
          }
          
        } catch (error) {
          console.error('❌ Error publishing listing:', error);
          
          let errorMessage = 'Unable to submit the listing for review. Please try again.';
          
          if (error.response) {
            errorMessage = error.response.data?.message || errorMessage;
            console.error('Server error:', error.response.status, error.response.data);
          } else if (error.request) {
            errorMessage = 'Network error. Please check your connection and try again.';
            console.error('Network error:', error.request);
          } else {
            console.error('Error:', error.message);
          }
          
          showError({
            title: 'Submission Failed',
            message: errorMessage,
          });
        } finally {
          setPublishing(false);
        }
      },
    });
  };

  const handleDeleteListing = listing => {
    setActiveMenuId(null);
    
    console.log('🗑️ Attempting to delete listing:', listing.ID, listing.title);
    
    showConfirm({
      title: t('deleteListing'),
      message: `${t('deleteListing')} "${listing.title}"? ${t('permanentlyRemove')}`,
      confirmText: t('deleteListing'),
      destructive: true,
      onConfirm: async () => {
        try {
          setDeleting(true);
          console.log('🔥 Deleting listing with ID:', listing.ID);
          
          const response = await apiService.deleteListing(listing.ID);
          
          console.log('✅ Delete response:', response);
          
          if (response.data && response.data.success) {
            showSuccess({
              title: t('deleteListing'),
              message: t('permanentlyRemove'),
              onPress: () => {
                fetchListings();
              },
            });
            
            fetchListings();
          } else {
            throw new Error(response.data?.message || 'Delete failed');
          }
          
        } catch (error) {
          console.error('❌ Error deleting listing:', error);
          
          let errorMessage = 'Unable to delete the listing. Please try again.';
          
          if (error.response) {
            errorMessage = error.response.data?.message || errorMessage;
            console.error('Server error:', error.response.status, error.response.data);
          } else if (error.request) {
            errorMessage = 'Network error. Please check your connection and try again.';
            console.error('Network error:', error.request);
          } else {
            console.error('Error:', error.message);
          }
          
          showError({
            title: 'Delete Failed',
            message: errorMessage,
          });
        } finally {
          setDeleting(false);
        }
      },
    });
  };

  const formatDate = dateString => {
    if (!dateString) return 'Unknown';
    try {
      const date = new Date(dateString);
      if (currentLanguage === 'zh-TW') {
        return date.toLocaleDateString('zh-TW', {
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
        });
      }
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
        return { bg: '#f59e0b20', text: '#f59e0b' };
      case 'draft':
        return { bg: '#6b728020', text: '#6b7280' };
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
          <Text style={styles.loadingText}>{t('loadingListings')}</Text>
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
        {/* Header with Language Toggle */}
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
                <Text style={styles.headerTitle}>{t('myListings')}</Text>
                <View style={styles.headerBadge}>
                  <Icon name="package" size={14} color="#6b7280" />
                  <Text style={styles.headerSubtitle}>
                    {t('machinesListed', { count: listings.length })}
                  </Text>
                </View>
              </View>

              <View style={styles.headerRight}>
                {/* Language Toggle Button */}
                <TouchableOpacity
                  style={styles.languageButton}
                  onPress={() => setShowLanguageModal(true)}
                  activeOpacity={0.8}
                  disabled={isLanguageLoading}
                >
                  <Icon name="globe" size={16} color="#0d9488" />
                  {isLanguageLoading ? (
                    <ActivityIndicator size={14} color="#0d9488" />
                  ) : (
                    <Text style={styles.languageButtonText}>
                      {getLanguageShortName(currentLanguage)}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Stats Container */}
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
                    {t('published')}
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
                    {t('pending')}
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
                    {t('totalViews')}
                  </Text>
                </View>
              </View>
            </Animated.View>
          </Animated.View>
        </View>

        {/* Listings Section */}
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
              <Text style={styles.emptyTitle}>{t('noListingsYet')}</Text>
              <Text style={styles.emptyDescription}>
                {t('noListingsDescription')}
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => setShowOverlay(true)}
                activeOpacity={0.8}
              >
                <Icon name="plus" size={18} color="#ffffff" />
                <Text style={styles.emptyButtonText}>
                  {t('addFirstListing')}
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
                      <View style={styles.imageContainer}>
                        <Image
                          source={{
                            uri:
                              item.thumbnail ||
                              'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400',
                          }}
                          style={styles.cardImage}
                          resizeMode='contain'
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
                                  {item.status === 'published' ? t('published') : 
                                   item.status === 'pending' ? t('pending') : 
                                   item.status || 'draft'}
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
                              {t('listedOn', { date: formatDate(item.created_at) })}
                            </Text>
                          </View>
                          <View style={styles.tagRow}>
                            {item.price && (
                              <View style={styles.tag}>
                                <Text style={styles.tagText}>
                                  {item.currency || 'USD'} {""}
                                  {item.price
                                    ? `${item.price}`
                                    : t('priceOnRequest')}
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
        
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        showCancel={alertConfig.showCancel}
        cancelText={alertConfig.cancelText}
        vibrate={alertConfig.vibrate}
        onDismiss={hideAlert}
      />

      <BottomNav setShowOverlay={setShowOverlay} navigation={navigation} />

      {/* Language Selection Modal */}
      <Modal
        isVisible={showLanguageModal}
        onBackdropPress={() => setShowLanguageModal(false)}
        backdropOpacity={0.3}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        style={styles.modalStyle}
      >
        <View style={styles.languageModal}>
          <View style={styles.menuHandle} />
          <Text style={styles.languageModalTitle}>{t('language')}</Text>
          
          {availableLanguages.map((language) => (
            <TouchableOpacity
              key={language.code}
              style={[
                styles.languageOption,
                currentLanguage === language.code && styles.languageOptionActive
              ]}
              onPress={() => handleLanguageChange(language.code)}
              activeOpacity={0.7}
              disabled={isLanguageLoading}
            >
              <View style={styles.languageOptionContent}>
                <Text style={[
                  styles.languageOptionText,
                  currentLanguage === language.code && styles.languageOptionTextActive
                ]}>
                  {language.name}
                </Text>
                <Text style={styles.languageOptionSubtext}>
                  {language.nativeName}
                </Text>
              </View>
              {isLanguageLoading && currentLanguage === language.code ? (
                <ActivityIndicator size={20} color="#0d9488" />
              ) : currentLanguage === language.code ? (
                <Icon name="check" size={20} color="#0d9488" />
              ) : null}
            </TouchableOpacity>
          ))}
        </View>
      </Modal>

      {/* Action Menu Modal */}
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
              <Text style={styles.menuText}>{t('viewDetails')}</Text>
              <Text style={styles.menuSubtext}>
                {t('seeFullInfo')}
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
              <Text style={styles.menuText}>{t('editListing')}</Text>
              <Text style={styles.menuSubtext}>
                {t('modifyDetails')}
              </Text>
            </View>
            <Icon name="chevron-right" size={16} color="#94a3b8" />
          </TouchableOpacity>

          {/* Publish Button - Only show for draft items */}
          {currentListing && currentListing.status === 'draft' && (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handlePublishListing(currentListing)}
              activeOpacity={0.7}
              disabled={publishing}
            >
              <View
                style={[styles.menuIconContainer, { backgroundColor: '#dcfce7' }]}
              >
                {publishing ? (
                  <ActivityIndicator size={18} color="#16a34a" />
                ) : (
                  <Icon name="send" size={18} color="#16a34a" />
                )}
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={[styles.menuText, { color: '#16a34a' }]}>
                  {publishing ? t('submitting') : t('submitForReview')}
                </Text>
                <Text style={styles.menuSubtext}>
                  {t('sendToAdmin')}
                </Text>
              </View>
              <Icon name="chevron-right" size={16} color="#16a34a" />
            </TouchableOpacity>
          )}

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={[styles.menuItem, styles.dangerMenuItem]}
            onPress={() =>
              currentListing && handleDeleteListing(currentListing)
            }
            activeOpacity={0.7}
            disabled={deleting}
          >
            <View
              style={[styles.menuIconContainer, { backgroundColor: '#fee2e2' }]}
            >
              {deleting ? (
                <ActivityIndicator size={18} color="#dc2626" />
              ) : (
                <Icon name="trash-2" size={18} color="#dc2626" />
              )}
            </View>
            
            <View style={styles.menuTextContainer}>
              <Text style={[styles.menuText, { color: '#dc2626' }]}>
                {deleting ? t('deleting') : t('deleteListing')}
              </Text>
              <Text style={styles.menuSubtext}>
                {t('permanentlyRemove')}
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

  // Loading Styles
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

  // Header Styles
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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

  // Language Toggle Button
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 6,
    borderWidth: 2,
    borderColor: '#0d9488',
    shadowColor: '#0d9488',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  languageButtonText: {
    color: '#0d9488',
    fontWeight: '700',
    fontSize: 14,
  },

  // Add Button
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d9488',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    gap: 6,
    shadowColor: '#0d9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },

  // Stats Container
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

  // Empty State
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

  // Card Styles
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
    // resizeMode: 'contain',
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

  // Menu Button
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

  // Modal Styles
  modalStyle: {
    justifyContent: 'flex-end',
    margin: 0,
  },

  // Language Modal
  languageModal: {
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
  languageModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 24,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  languageOptionActive: {
    backgroundColor: '#ecfdf5',
    borderColor: '#0d9488',
  },
  languageOptionContent: {
    flex: 1,
  },
  languageOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  languageOptionTextActive: {
    color: '#0d9488',
  },
  languageOptionSubtext: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },

  // Action Menu Modal
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