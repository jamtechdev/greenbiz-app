import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  RefreshControl,
  Image,
  Dimensions,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import BottomNav from '../../../components/BottomNavbar';
import ImagePicker from 'react-native-image-crop-picker';
import CameraOverlay from '../../../components/CameraOverlay';
import { useAppContext } from '../../../_customContext/AppProvider';
import { clearAnalysis } from '../../../store/slices/analysisSlice';
import { apiService } from '../../../api/axiosConfig';
import {
  scale,
  scaleFont,
  scaleHeight,
  scaleWidth,
} from '../../../utils/resposive';

const { width } = Dimensions.get('window');

export default function DashboardScreen({ navigation }) {
  const dispatch = useDispatch();
  const { showOverlay, setShowOverlay } = useAppContext();
  const [selectedImages, setSelectedImages] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState('');
  const [listings, setListings] = useState([]);
  const [isLoadingListings, setIsLoadingListings] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  // Carousel specific state
  const carouselRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Redux selectors
  const {
    loading,
    error: analysisError,
    analysisData,
  } = useSelector(state => state.analysis);
  const { user, isAuthenticated, token } = useSelector(
    state => state.auth || {},
  );

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        console.log('🔐 User is authenticated, loading listings...');
        loadListings();
      } else {
        console.log('❌ User not authenticated, skipping listings load');
        setListings([]);
        setIsUnauthorized(true);
      }

      // Open overlay immediately when app opens (first time)
      if (!showOverlay) {
        setShowOverlay(true);
      }
    }, [isAuthenticated, token]),
  );

  const loadListings = async () => {
    try {
      setIsLoadingListings(true);
      setError(null);
      setIsUnauthorized(false);

      const response = await apiService.getAllListing();
      console.log('📋 Listings loaded:', response.data);

      // Handle the actual API response structure
      if (
        response.data &&
        response.data.success &&
        Array.isArray(response.data.data)
      ) {
        setListings(response.data.data);
        console.log('✅ Listings set:', response.data.data);
      } else if (response.data && Array.isArray(response.data)) {
        setListings(response.data);
      } else {
        console.log('⚠️ Unexpected listings format:', response.data);
        setListings([]);
      }
    } catch (error) {
      console.error('❌ Failed to load listings:', error);

      // Handle different error types
      if (error.response?.status === 401) {
        setIsUnauthorized(true);
        setError('Authentication expired. Please login again.');
      } else if (error.response?.status === 403) {
        setError('Access denied. Please check your permissions.');
      } else if (error.response?.status === 404) {
        setError('Service not found. Please try again later.');
      } else if (error.response?.status >= 500) {
        setError('Server error. Please try again later.');
      } else if (error.code === 'NETWORK_ERROR' || !error.response) {
        setError('Network error. Please check your connection.');
      } else {
        setError(
          error.response?.data?.message ||
            'Failed to load data. Please try again.',
        );
      }

      setListings([]);
    } finally {
      setIsLoadingListings(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (isAuthenticated) {
      await loadListings();
    }
    setRefreshing(false);
  };

  // Auto-scroll effect for carousel
  useEffect(() => {
    if (listings.length > 1) {
      const interval = setInterval(() => {
        if (carouselRef.current) {
          const nextIndex = (currentIndex + 1) % listings.length;
          carouselRef.current.scrollToIndex({
            index: nextIndex,
            animated: true,
          });
          setCurrentIndex(nextIndex);
        }
      }, 4000); // Auto-scroll every 4 seconds

      return () => clearInterval(interval);
    }
  }, [currentIndex, listings.length]);

  // Handle manual scroll end
  const handleScrollEnd = (event) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const cardWidth = scaleWidth(280) + scaleWidth(16); // Card width + margin
    const pageNum = Math.floor(contentOffset / cardWidth);
    
    if (pageNum >= 0 && pageNum < listings.length) {
      setCurrentIndex(pageNum);
    }
  };

  // Carousel item renderer
  const renderCarouselItem = ({ item, index }) => (
    <TouchableOpacity
      style={styles.carouselCard}
      onPress={() =>
        navigation.navigate('ProductDetailsById', { productId: item.ID })
      }
      activeOpacity={0.95}
    >
      <View style={styles.cardImageContainer}>
        {item.thumbnail || item.featured_image ? (
          <Image
            source={{ uri: item.thumbnail || item.featured_image }}
            style={styles.cardImage}
            resizeMode="contain"
            onError={error => {
              console.log('Image load error:', error);
            }}
          />
        ) : (
          <View style={styles.cardImagePlaceholder}>
            <Icon name="camera" size={32} color="#94a3b8" />
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}

        {/* Enhanced Status Badge */}
        <View style={[styles.statusBadge, getStatusBadgeStyle(item.status)]}>
          <Text style={styles.statusBadgeText}>
            {getStatusText(item.status)}
          </Text>
        </View>

        {/* Favorite Button */}
        <TouchableOpacity style={styles.favoriteButton}>
          <Icon name="heart" size={18} color="#e11d48" />
        </TouchableOpacity>
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title || item.name || 'Untitled Machine'}
        </Text>

        <View style={styles.cardMeta}>
          <Icon name="tag" size={14} color="#6366f1" />
          <Text style={styles.cardMetaText} numberOfLines={1}>
            {item.type
              ? Array.isArray(item.type)
                ? item.type.join(', ')
                : item.type
              : 'Equipment'}
          </Text>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.priceContainer}>
            <Text style={styles.cardPrice}>
              ${formatPrice(item.price) || '0'}
            </Text>
            <Text style={styles.cardPriceLabel}>USD</Text>
          </View>

          <View style={styles.cardActions}>
            <TouchableOpacity style={styles.actionIcon}>
              <Icon name="eye" size={16} color="#6366f1" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionIcon}>
              <Icon name="bookmark" size={16} color="#6366f1" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.cardBottom}>
          <Text style={styles.cardId}>ID: {item.ID}</Text>
          <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Pagination dots component
  const CarouselPagination = ({ data, currentIndex }) => {
    if (!data || data.length <= 1) return null;
    
    return (
      <View style={styles.paginationContainer}>
        {data.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              index === currentIndex && styles.paginationDotActive,
            ]}
          />
        ))}
      </View>
    );
  };

  const handleGalleryPick = () => {
    return new Promise((resolve, reject) => {
      ImagePicker.openPicker({
        width: 800,
        height: 600,
        cropping: false,
        mediaType: 'photo',
        compressImageQuality: 0.8,
      })
        .then(image => {
          console.log('Gallery image:', image);
          resolve({ uri: image.path });
        })
        .catch(error => {
          console.log('Gallery picker error:', error);
          if (error.code !== 'E_PICKER_CANCELLED') {
            Alert.alert('Error', 'Failed to pick image from gallery');
          }
          reject(error);
        });
    });
  };

  const handleCameraPick = () => {
    return new Promise((resolve, reject) => {
      ImagePicker.openCamera({
        width: 800,
        height: 600,
        cropping: false,
        mediaType: 'photo',
        compressImageQuality: 0.8,
      })
        .then(image => {
          console.log('Camera image:', image);
          resolve({ uri: image.path });
        })
        .catch(error => {
          console.log('Camera picker error:', error);
          if (error.code !== 'E_PICKER_CANCELLED') {
            Alert.alert('Error', 'Failed to take photo');
          }
          reject(error);
        });
    });
  };

  // Clear previous analysis when overlay opens
  const handleScanMachinePress = () => {
    console.log('🗑️ Clearing previous analysis data...');
    dispatch(clearAnalysis());
    setSelectedImages([]);
    setIsAnalyzing(false);
    setAnalysisProgress('');
    setShowOverlay(true);
  };

  const analyzeImagesManually = async imagePaths => {
    try {
      setIsAnalyzing(true);
      setAnalysisProgress('Starting new analysis...');

      console.log('🗑️ Clearing previous analysis before new analysis...');
      dispatch(clearAnalysis());

      console.log('🚀 Starting fresh analysis for:', imagePaths);

      setAnalysisProgress('Sending images to AI analysis...');

      console.log('🔄 Using FormData with files method...');

      const formData = new FormData();
      imagePaths.forEach((imagePath, index) => {
        formData.append('images[]', {
          uri: imagePath,
          type: 'image/jpeg',
          name: `image_${index}.jpg`,
        });
      });

      const response = await fetch(
        'https://greenbidz.com/wp-json/greenbidz-api/v1/analize_process_images',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          body: formData,
        },
      );

      const data = await response.json();
      console.log('📋 API Response:', response.status, data);

      if (response.ok) {
        console.log('✅ Analysis successful! New data:', data);
        setIsAnalyzing(false);
        setShowOverlay(false);

        navigation.navigate('Details', {
          images: imagePaths,
          imageCount: imagePaths.length,
          analysisData: data,
          timestamp: Date.now(),
        });
        if (isAuthenticated) {
          loadListings();
        }
      } else {
        throw new Error(data.message || 'Analysis failed');
      }
    } catch (error) {
      console.error('🚨 Analysis failed:', error);
      setIsAnalyzing(false);
      Alert.alert(
        'Analysis Failed',
        error.message || 'Failed to analyze images. Please try again.',
        [
          {
            text: 'Retry',
            onPress: () => analyzeImagesManually(imagePaths),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ],
      );
    }
  };

  const handleImagesComplete = async images => {
    console.log('📸 New images selected:', images);
    setSelectedImages(images);
    await analyzeImagesManually(images);
  };

  const handleCloseOverlay = () => {
    if (isAnalyzing) {
      Alert.alert(
        'Analysis in Progress',
        'Images are being analyzed. Are you sure you want to cancel?',
        [
          { text: 'Continue Analysis', style: 'cancel' },
          {
            text: 'Cancel',
            style: 'destructive',
            onPress: () => {
              setIsAnalyzing(false);
              setShowOverlay(false);
              setSelectedImages([]);
              dispatch(clearAnalysis());
            },
          },
        ],
      );
    } else {
      setShowOverlay(false);
      setSelectedImages([]);
      dispatch(clearAnalysis());
    }
  };

  // Reset when overlay closes
  useEffect(() => {
    if (!showOverlay) {
      setSelectedImages([]);
      setIsAnalyzing(false);
      setAnalysisProgress('');
    }
  }, [showOverlay]);

  // Clear analysis data when component mounts
  useEffect(() => {
    console.log('🔄 Dashboard mounted, clearing any existing analysis data');
    dispatch(clearAnalysis());
  }, [dispatch]);

  // Helper functions
  const getStatusBadgeStyle = status => {
    switch (status?.toLowerCase()) {
      case 'published':
      case 'publish':
        return { backgroundColor: '#10b981' };
      case 'pending':
        return { backgroundColor: '#f59e0b' };
      case 'sold':
        return { backgroundColor: '#8b5cf6' };
      case 'draft':
        return { backgroundColor: '#6b7280' };
      default:
        return { backgroundColor: '#6b7280' };
    }
  };

  const getStatusText = status => {
    switch (status?.toLowerCase()) {
      case 'published':
      case 'publish':
        return 'Live';
      case 'pending':
        return 'Pending';
      case 'sold':
        return 'Sold';
      case 'draft':
        return 'Draft';
      default:
        return 'Draft';
    }
  };

  const formatPrice = price => {
    if (!price) return '0';
    return parseInt(price).toLocaleString();
  };

  const formatDate = dateString => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const renderEmptyListings = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Icon name="inbox" size={32} color="#6366f1" />
      </View>
      <Text style={styles.emptyTitle}>
        {isUnauthorized
          ? 'Authentication Required'
          : error
          ? 'No Data Available'
          : 'No Machines Scanned Yet'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {isUnauthorized
          ? 'Please login to view your machines'
          : error
          ? 'Unable to load data. Please try again.'
          : 'Start by scanning your first machine to see it here'}
      </Text>
      {!error && (
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={
            isUnauthorized
              ? () => navigation.navigate('Login')
              : handleScanMachinePress
          }
        >
          <Icon
            name={isUnauthorized ? 'log-in' : 'plus'}
            size={16}
            color="#fff"
          />
          <Text style={styles.emptyButtonText}>
            {isUnauthorized ? 'Login' : 'Scan Now'}
          </Text>
        </TouchableOpacity>
      )}
      {error && (
        <TouchableOpacity
          style={[styles.emptyButton, { backgroundColor: '#ef4444' }]}
          onPress={onRefresh}
        >
          <Icon name="refresh-cw" size={16} color="#fff" />
          <Text style={styles.emptyButtonText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderAnalysisModal = () => (
    <Modal visible={isAnalyzing} transparent={true} animationType="fade">
      <View style={styles.analysisOverlay}>
        <View style={styles.analysisModal}>
          <View style={styles.analysisIconContainer}>
            <Icon name="cpu" size={28} color="#6366f1" />
          </View>

          <Text style={styles.analysisTitle}>AI Analysis</Text>

          <ActivityIndicator
            size="large"
            color="#6366f1"
            style={styles.analysisLoader}
          />

          <Text style={styles.analysisProgress}>
            {analysisProgress || 'Processing images...'}
          </Text>

          <Text style={styles.analysisSubText}>
            Please wait while we analyze your machine
          </Text>
        </View>
      </View>
    </Modal>
  );

  const getStatsFromListings = () => {
    const listed = listings.length;
    const published = listings.filter(
      item => item.status === 'publish' || item.status === 'published',
    ).length;
    const pending = listings.filter(item => item.status === 'pending').length;
    const sold = listings.filter(item => item.status === 'sold').length;

    return { listed, published, pending, sold };
  };

  const stats = getStatsFromListings();

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#c0faf5" />

      {/* Show Dashboard only when overlay is closed */}
      {!showOverlay && (
        <View style={styles.container}>
          {/* Beautiful Header */}
          <View style={styles.header}>
            <View style={styles.headerGradient}>
              <View style={styles.headerContent}>
                <View style={styles.headerTop}>
                  <View style={styles.headerLeft}>
                    <View style={styles.logoContainer}>
                      <Icon name="zap" size={20} color="#fff" />
                    </View>
                    <View>
                      <Text style={styles.appName}>GreenBidz</Text>
                      <Text style={styles.tagline}>AI Machine Scanner</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.notificationButton}
                    onPress={onRefresh}
                    disabled={refreshing}
                  >
                    <Icon
                      name={refreshing ? 'loader' : 'refresh-cw'}
                      size={18}
                      color="#fff"
                    />
                    <View style={styles.notificationDot} />
                  </TouchableOpacity>
                </View>

                <View style={styles.headerBottom}>
                  <Text style={styles.welcomeText}>
                    Welcome back! Ready to scan your machines?
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <ScrollView
            style={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#6366f1']}
                tintColor="#6366f1"
              />
            }
          >
            {/* Main Actions */}
            <View style={styles.mainActions}>
              <TouchableOpacity
                style={styles.scanButton}
                activeOpacity={0.9}
                onPress={handleScanMachinePress}
                disabled={isAnalyzing}
              >
                <View style={styles.scanButtonIcon}>
                  <Icon name="camera" size={24} color="#fff" />
                </View>
                <Text style={styles.scanButtonTitle}>Scan Machine</Text>
                <Text style={styles.scanButtonDesc}>
                  Take photos for AI analysis
                </Text>
              </TouchableOpacity>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.actionButton}
                  activeOpacity={0.9}
                  onPress={() => navigation.navigate('MyList')}
                >
                  <Icon name="list" size={20} color="#6366f1" />
                  <Text style={styles.actionButtonText}>My Listings</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  activeOpacity={0.9}
                  onPress={() => navigation.navigate('MyProfile')}
                >
                  <Icon name="settings" size={20} color="#6366f1" />
                  <Text style={styles.actionButtonText}>Settings</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Stats */}
            <View style={styles.statsSection}>
              <Text style={styles.sectionTitle}>Your Machines</Text>
              <View style={styles.statsRow}>
                <View style={styles.simpleStatCard}>
                  <Text style={styles.statNumber}>{stats.listed}</Text>
                  <Text style={styles.statLabel}>Total</Text>
                </View>
                <View style={styles.simpleStatCard}>
                  <Text style={styles.statNumber}>{stats.published}</Text>
                  <Text style={styles.statLabel}>Live</Text>
                </View>
                <View style={styles.simpleStatCard}>
                  <Text style={styles.statNumber}>{stats.pending}</Text>
                  <Text style={styles.statLabel}>Pending</Text>
                </View>
                <View style={styles.simpleStatCard}>
                  <Text style={styles.statNumber}>{stats.sold}</Text>
                  <Text style={styles.statLabel}>Sold</Text>
                </View>
              </View>
            </View>

            {/* Enhanced Machine Carousel */}
            <View style={styles.listingsSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Machines</Text>
                <TouchableOpacity onPress={() => navigation.navigate('MyList')}>
                  <Text style={styles.seeAllText}>View All</Text>
                </TouchableOpacity>
              </View>

              {isLoadingListings ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#6366f1" />
                  <Text style={styles.loadingText}>Loading machines...</Text>
                </View>
              ) : listings.length > 0 ? (
                <View style={styles.carouselWrapper}>
                  <FlatList
                    ref={carouselRef}
                    data={listings.slice(0, 10)}
                    renderItem={renderCarouselItem}
                    keyExtractor={item =>
                      item.ID?.toString() || Math.random().toString()
                    }
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    pagingEnabled={false}
                    decelerationRate="fast"
                    snapToInterval={scaleWidth(280) + scaleWidth(16)}
                    snapToAlignment="start"
                    contentContainerStyle={styles.carouselContent}
                    onMomentumScrollEnd={handleScrollEnd}
                    onScrollToIndexFailed={() => {
                      console.log('Carousel scroll to index failed');
                    }}
                    getItemLayout={(data, index) => ({
                      length: scaleWidth(280) + scaleWidth(16),
                      offset: (scaleWidth(280) + scaleWidth(16)) * index,
                      index,
                    })}
                  />
                  
                  {/* Pagination Dots */}
                  <CarouselPagination 
                    data={listings.slice(0, 10)} 
                    currentIndex={currentIndex} 
                  />
                  
                  {/* Manual Navigation Arrows */}
                  {listings.length > 1 && (
                    <View style={styles.navigationArrows}>
                      <TouchableOpacity
                        style={[styles.navArrow, styles.navArrowLeft]}
                        onPress={() => {
                          const prevIndex = currentIndex === 0 ? listings.length - 1 : currentIndex - 1;
                          carouselRef.current?.scrollToIndex({
                            index: prevIndex,
                            animated: true,
                          });
                          setCurrentIndex(prevIndex);
                        }}
                      >
                        <Icon name="chevron-left" size={20} color="#6366f1" />
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[styles.navArrow, styles.navArrowRight]}
                        onPress={() => {
                          const nextIndex = (currentIndex + 1) % listings.length;
                          carouselRef.current?.scrollToIndex({
                            index: nextIndex,
                            animated: true,
                          });
                          setCurrentIndex(nextIndex);
                        }}
                      >
                        <Icon name="chevron-right" size={20} color="#6366f1" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ) : (
                renderEmptyListings()
              )}
            </View>

            <View style={{ height: 120 }} />
          </ScrollView>
        </View>
      )}

      {/* Show BottomNav only when overlay is closed */}
      {!showOverlay && (
        <BottomNav setShowOverlay={setShowOverlay} navigation={navigation} />
      )}

      {/* Multi-Image Camera Overlay */}
      {showOverlay && (
        <CameraOverlay
          visible={showOverlay}
          images={selectedImages}
          onClose={handleCloseOverlay}
          onCameraPick={handleCameraPick}
          onGalleryPick={handleGalleryPick}
          onImagesComplete={handleImagesComplete}
        />
      )}

      {/* Analysis Progress Modal */}
      {renderAnalysisModal()}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },

  header: {
    position: 'relative',
    overflow: 'hidden',
    borderBottomLeftRadius: scale(30),
    borderBottomRightRadius: scale(30),
  },
  headerGradient: {
    background: '#c0faf5',
    backgroundColor: '#c0faf5',
    paddingTop: scaleHeight(5),
    paddingBottom: scaleHeight(5),
  },
  headerContent: {
    paddingHorizontal: scaleWidth(20),
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: scaleHeight(30),
    marginBottom: scaleHeight(20),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    width: scaleWidth(40),
    height: scaleWidth(40),
    borderRadius: scale(12),
    backgroundColor: '#33decf',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scaleWidth(12),
  },
  appName: {
    fontSize: scaleFont(20),
    fontWeight: '700',
    color: '#0d9488',
    fontFamily: 'Poppins-Bold',
  },
  tagline: {
    fontSize: scaleFont(12),
    color: '#0d9488',
    fontFamily: 'Poppins-Regular',
    marginTop: scaleHeight(-2),
  },
  notificationButton: {
    width: scaleWidth(40),
    height: scaleWidth(40),
    borderRadius: scale(20),
    backgroundColor: '#33decf',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: scaleHeight(8),
    right: scaleWidth(8),
    width: scaleWidth(8),
    height: scaleWidth(8),
    borderRadius: scale(4),
    backgroundColor: '#10b981',
    borderWidth: scale(2),
    borderColor: '#fff',
  },
  headerBottom: {
    paddingBottom: scaleHeight(10),
  },
  welcomeText: {
    fontSize: scaleFont(16),
    color: '#0d9488',
    fontFamily: 'Poppins-Regular',
    lineHeight: scaleHeight(18),
  },

  scrollContainer: {
    flex: 1,
  },

  mainActions: {
    paddingHorizontal: scaleWidth(20),
    marginTop: scaleHeight(-20),
    marginBottom: scaleHeight(24),
  },
  scanButton: {
    backgroundColor: '#10b981',
    borderRadius: scale(16),
    padding: scale(10),
    alignItems: 'center',
    marginTop: scaleHeight(25),
    marginBottom: scaleHeight(16),
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: scaleHeight(4) },
    shadowOpacity: 0.3,
    shadowRadius: scale(8),
    elevation: 6,
  },
  scanButtonIcon: {
    width: scaleWidth(60),
    height: scaleWidth(60),
    borderRadius: scale(30),
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scaleHeight(16),
  },
  scanButtonTitle: {
    fontSize: scaleFont(20),
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'Poppins-Bold',
    marginBottom: scaleHeight(4),
  },
  scanButtonDesc: {
    fontSize: scaleFont(14),
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'Poppins-Regular',
  },

  actionRow: {
    flexDirection: 'row',
    gap: scaleWidth(12),
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: scale(12),
    padding: scale(20),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scaleHeight(2) },
    shadowOpacity: 0.1,
    shadowRadius: scale(4),
    elevation: 2,
  },
  actionButtonText: {
    fontSize: scaleFont(14),
    fontWeight: '600',
    color: '#374151',
    fontFamily: 'Poppins-SemiBold',
    marginTop: scaleHeight(8),
  },

  statsSection: {
    paddingHorizontal: scaleWidth(20),
    marginBottom: scaleHeight(24),
  },
  sectionTitle: {
    fontSize: scaleFont(18),
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Poppins-Bold',
    marginBottom: scaleHeight(16),
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: scale(12),
    padding: scale(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scaleHeight(2) },
    shadowOpacity: 0.1,
    shadowRadius: scale(4),
    elevation: 2,
  },
  simpleStatCard: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: scaleFont(24),
    fontWeight: '800',
    color: '#111827',
    fontFamily: 'Poppins-ExtraBold',
    marginBottom: scaleHeight(4),
  },
  statLabel: {
    fontSize: scaleFont(12),
    color: '#6b7280',
    fontFamily: 'Poppins-Medium',
  },

  // Carousel specific styles
  listingsSection: {
    paddingHorizontal: scaleWidth(16),
    marginBottom: scaleHeight(32),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaleHeight(20),
    paddingHorizontal: scaleWidth(4),
  },
  seeAllText: {
    fontSize: scaleFont(14),
    color: '#6366f1',
    fontWeight: '700',
    fontFamily: 'Poppins-Bold',
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(8),
    backgroundColor: '#f0f0ff',
    borderRadius: scale(20),
  },

  // Carousel wrapper and content
  carouselWrapper: {
    position: 'relative',
  },
  carouselContent: {
    paddingHorizontal: scaleWidth(16),
    paddingBottom: scaleHeight(20),
  },
  carouselCard: {
    backgroundColor: '#fff',
    borderRadius: scale(20),
    width: scaleWidth(280),
    marginRight: scaleWidth(16),
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: scaleHeight(8) },
    shadowOpacity: 0.15,
    shadowRadius: scale(16),
    elevation: 8,
    overflow: 'hidden',
    borderWidth: scale(1),
    borderColor: 'rgba(99, 102, 241, 0.08)',
  },

  // Card components
  cardImageContainer: {
    position: 'relative',
    height: scaleHeight(180),
    backgroundColor: '#f8fafc',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
  },
  cardImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
  },
  placeholderText: {
    fontSize: scaleFont(12),
    color: '#94a3b8',
    marginTop: scaleHeight(8),
    fontFamily: 'Poppins-Medium',
  },

  statusBadge: {
    position: 'absolute',
    top: scaleHeight(12),
    left: scaleWidth(12),
    paddingHorizontal: scaleWidth(10),
    paddingVertical: scaleHeight(6),
    borderRadius: scale(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scaleHeight(4) },
    shadowOpacity: 0.2,
    shadowRadius: scale(6),
    elevation: 4,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: scaleFont(11),
    fontWeight: '700',
    fontFamily: 'Poppins-Bold',
    letterSpacing: 0.5,
  },

  favoriteButton: {
    position: 'absolute',
    top: scaleHeight(12),
    right: scaleWidth(12),
    width: scaleWidth(36),
    height: scaleWidth(36),
    borderRadius: scale(18),
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scaleHeight(4) },
    shadowOpacity: 0.15,
    shadowRadius: scale(6),
    elevation: 4,
  },

  cardContent: {
    padding: scale(16),
  },
  cardTitle: {
    fontSize: scaleFont(16),
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Poppins-Bold',
    marginBottom: scaleHeight(8),
    lineHeight: scaleHeight(22),
  },

  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scaleHeight(12),
    backgroundColor: '#f8fafc',
    paddingHorizontal: scaleWidth(10),
    paddingVertical: scaleHeight(6),
    borderRadius: scale(12),
  },
  cardMetaText: {
    fontSize: scaleFont(13),
    color: '#64748b',
    fontFamily: 'Poppins-SemiBold',
    marginLeft: scaleWidth(6),
    flex: 1,
  },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaleHeight(12),
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: scaleWidth(10),
    paddingVertical: scaleHeight(6),
    borderRadius: scale(8),
  },
  cardPrice: {
    fontSize: scaleFont(18),
    fontWeight: '800',
    color: '#059669',
    fontFamily: 'Poppins-ExtraBold',
  },
  cardPriceLabel: {
    fontSize: scaleFont(11),
    color: '#047857',
    fontFamily: 'Poppins-Bold',
    marginLeft: scaleWidth(4),
  },

  cardActions: {
    flexDirection: 'row',
    gap: scaleWidth(8),
  },
  actionIcon: {
    width: scaleWidth(32),
    height: scaleWidth(32),
    borderRadius: scale(16),
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: scale(1),
    borderColor: '#e2e8f0',
  },

  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: scaleHeight(12),
    borderTopWidth: scale(1),
    borderTopColor: '#f1f5f9',
  },
  cardId: {
    fontSize: scaleFont(11),
    color: '#94a3b8',
    fontFamily: 'Poppins-SemiBold',
    backgroundColor: '#f8fafc',
    paddingHorizontal: scaleWidth(8),
    paddingVertical: scaleHeight(4),
    borderRadius: scale(6),
  },
  cardDate: {
    fontSize: scaleFont(11),
    color: '#6366f1',
    fontFamily: 'Poppins-SemiBold',
  },

  // Pagination dots
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: scaleHeight(16),
    gap: scaleWidth(8),
  },
  paginationDot: {
    width: scaleWidth(8),
    height: scaleWidth(8),
    borderRadius: scale(4),
    backgroundColor: '#e2e8f0',
    transition: 'all 0.3s ease',
  },
  paginationDotActive: {
    backgroundColor: '#6366f1',
    width: scaleWidth(20),
    borderRadius: scale(4),
  },

  // Navigation arrows
  navigationArrows: {
    position: 'absolute',
    top: '35%',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: scaleWidth(8),
    pointerEvents: 'box-none',
  },
  navArrow: {
    width: scaleWidth(40),
    height: scaleWidth(40),
    borderRadius: scale(20),
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scaleHeight(4) },
    shadowOpacity: 0.15,
    shadowRadius: scale(8),
    elevation: 4,
    borderWidth: scale(1),
    borderColor: '#e2e8f0',
  },
  navArrowLeft: {
    marginLeft: scaleWidth(8),
  },
  navArrowRight: {
    marginRight: scaleWidth(8),
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: scaleHeight(56),
    paddingHorizontal: scaleWidth(24),
    backgroundColor: '#fff',
    borderRadius: scale(24),
    marginHorizontal: scaleWidth(4),
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: scaleHeight(8) },
    shadowOpacity: 0.1,
    shadowRadius: scale(16),
    elevation: 8,
  },
  emptyIconContainer: {
    width: scaleWidth(80),
    height: scaleWidth(80),
    borderRadius: scale(40),
    backgroundColor: '#f0f0ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scaleHeight(20),
  },
  emptyTitle: {
    fontSize: scaleFont(20),
    fontWeight: '800',
    color: '#374151',
    fontFamily: 'Poppins-ExtraBold',
    marginBottom: scaleHeight(12),
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: scaleFont(15),
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: scaleHeight(22),
    fontFamily: 'Poppins-Medium',
    marginBottom: scaleHeight(28),
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    paddingHorizontal: scaleWidth(24),
    paddingVertical: scaleHeight(16),
    borderRadius: scale(12),
    gap: scaleWidth(10),
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: scaleHeight(6) },
    shadowOpacity: 0.3,
    shadowRadius: scale(12),
    elevation: 6,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: scaleFont(16),
    fontWeight: '700',
    fontFamily: 'Poppins-Bold',
  },

  // Loading state
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: scaleHeight(48),
    backgroundColor: '#fff',
    borderRadius: scale(24),
    marginHorizontal: scaleWidth(4),
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: scaleHeight(8) },
    shadowOpacity: 0.1,
    shadowRadius: scale(16),
    elevation: 8,
  },
  loadingText: {
    fontSize: scaleFont(16),
    color: '#6366f1',
    marginTop: scaleHeight(16),
    fontFamily: 'Poppins-SemiBold',
  },

  // Analysis modal
  analysisOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  analysisModal: {
    backgroundColor: '#fff',
    borderRadius: scale(20),
    padding: scale(32),
    marginHorizontal: scaleWidth(32),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scaleHeight(10) },
    shadowOpacity: 0.25,
    shadowRadius: scale(20),
    elevation: 10,
  },
  analysisIconContainer: {
    width: scaleWidth(64),
    height: scaleWidth(64),
    borderRadius: scale(32),
    backgroundColor: '#f0f0ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scaleHeight(16),
  },
  analysisTitle: {
    fontSize: scaleFont(20),
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Poppins-Bold',
    marginBottom: scaleHeight(8),
  },
  analysisLoader: {
    marginVertical: scaleHeight(16),
  },
  analysisProgress: {
    fontSize: scaleFont(14),
    color: '#6366f1',
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'Poppins-SemiBold',
    marginBottom: scaleHeight(8),
  },
  analysisSubText: {
    fontSize: scaleFont(12),
    color: '#6b7280',
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
  },
});