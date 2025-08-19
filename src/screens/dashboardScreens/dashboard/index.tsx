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
  Platform,
  PermissionsAndroid
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Feather';
import BottomNav from '../../../components/BottomNavbar';
import ImagePicker from 'react-native-image-crop-picker';
import CameraOverlay from '../../../components/CameraOverlay';
import { useAppContext } from '../../../_customContext/AppProvider';
import { clearAnalysis } from '../../../store/slices/analysisSlice';
import {
  selectCurrentLanguage,
  selectIsLanguageInitialized,
} from '../../../store/slices/languageSlice';
import { apiService } from '../../../api/axiosConfig';
import {
  scale,
  scaleFont,
  scaleHeight,
  scaleWidth,
} from '../../../utils/resposive';
import LanguageSelector from '../../../components/LanguageSelector';
import CameraRoll, { useCameraRoll } from '@react-native-camera-roll/camera-roll';

const { width } = Dimensions.get('window');

export default function DashboardScreen({ navigation }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { showOverlay, setShowOverlay } = useAppContext();

  // State
  const [selectedImages, setSelectedImages] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState('');
  const [listings, setListings] = useState([]);
  const [isLoadingListings, setIsLoadingListings] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasAutoOpenedOverlay, setHasAutoOpenedOverlay] = useState(false);
  const [authenticationStatus, setAuthenticationStatus] = useState('checking'); // 'checking' | 'authenticated' | 'unauthenticated'
console.log(listings)
  // Refs
  const carouselRef = useRef(null);
  // Selectors
  const { loading, error: analysisError, analysisData } = useSelector(
    state => state.analysis,
  );
  const { user, isAuthenticated, token } = useSelector(
    state => state.auth || {},
  );
  const currentLanguage = useSelector(selectCurrentLanguage);
  const isLanguageInitialized = useSelector(selectIsLanguageInitialized);
  const [photos, getPhotos, save] = useCameraRoll();
  // ---- Helpers: normalize, permissions, save ----
  const toFileUri = item => {
    const raw = typeof item === 'string' ? item : item?.uri || item?.path || '';
    if (!raw) return '';
    if (raw.startsWith('content://')) return raw;
    if (raw.startsWith('file://')) return raw;
    if (raw.startsWith('/')) return `file://${raw}`;
    return raw;
  };

  const normalizeImageList = images =>
    (images || []).map(toFileUri).filter(Boolean);

  const ensureSavePermission = async () => {
    if (Platform.OS === 'android' && Platform.Version < 29) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: 'Storage permission',
          message: 'We need access to save photos to your Gallery.',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  const saveImagesToGallery = async (uris, album = 'GreenBidz') => {
    const ok = await ensureSavePermission();
    if (!ok) throw new Error('Permission denied');

    const saved = [];
    for (const uri of uris) {
      const result = await save(uri, { type: 'photo', album });
      saved.push(result);
      // console.log('Saved to gallery:', result);
    }
    return saved;
  };

  // ---- Auth check ----
  const checkAuthenticationStatus = useCallback(async () => {
    try {
      const storedToken = await AsyncStorage.getItem('userToken');
      const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');

      const userIsAuthenticated = !!(
        storedToken ||
        isLoggedIn === 'true' ||
        isAuthenticated ||
        token
      );

      if (userIsAuthenticated) {
        setAuthenticationStatus('authenticated');
        setIsUnauthorized(false);
        return true;
      } else {
        setAuthenticationStatus('unauthenticated');
        setIsUnauthorized(true);
        return false;
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
      setAuthenticationStatus('unauthenticated');
      setIsUnauthorized(true);
      return false;
    }
  }, [isAuthenticated, token]);

  // ---- Data load ----
  const loadListings = useCallback(async () => {
    try {
      setIsLoadingListings(true);
      setError(null);

      const response = await apiService.getAllListing(currentLanguage);
      console.log(response,'mylistmylistmylistmylist')
      if (
        response?.data &&
        response.data.success &&
        Array.isArray(response.data.data)
      ) {
        setListings(response.data.data);
      } else if (response?.data && Array.isArray(response.data)) {
        setListings(response.data);
      } else {
        setListings([]);
      }
    } catch (error) {
      console.error('Failed to load listings:', error);

      if (error.response?.status === 401) {
        setIsUnauthorized(true);
        setAuthenticationStatus('unauthenticated');
        setError('Authentication expired. Please login again.');
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('isLoggedIn');
        await AsyncStorage.removeItem('userData');
      } else if (error.response?.status === 403) {
        setError('Access denied. Please check your permissions.');
      } else if (error.response?.status === 404) {
        setError('Service not found. Please try again later.');
      } else if (error.response?.status >= 500) {
        setError('Server error. Please try again later.');
      } else if (error.code === 'NETWORK_ERROR' || !error.response) {
        setError('Network error. Please check your connection.');
      } else {
        setError(error.response?.data?.message || 'Failed to load data.');
      }

      setListings([]);
    } finally {
      setIsLoadingListings(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const isAuth = await checkAuthenticationStatus();
    if (isAuth) {
      await loadListings();
    }
    setRefreshing(false);
  }, [checkAuthenticationStatus, loadListings,currentLanguage]);

  // ---- Pickers ----
  const handleGalleryPick = useCallback(() => {
    return new Promise((resolve, reject) => {
      ImagePicker.openPicker({
        width: 800,
        height: 600,
        cropping: false,
        mediaType: 'photo',
        compressImageQuality: 0.8,
      })
        .then(image => {
          resolve({ uri: image.path });
        })
        .catch(error => {
          if (error.code !== 'E_PICKER_CANCELLED') {
            Alert.alert('Error', 'Failed to pick image from gallery');
          }
          reject(error);
        });
    });
  }, []);

  const handleCameraPick = useCallback(() => {
    return new Promise((resolve, reject) => {
      ImagePicker.openCamera({
        width: 800,
        height: 600,
        cropping: false,
        mediaType: 'photo',
        compressImageQuality: 0.8,
      })
        .then(image => {
          resolve({ uri: image.path });
        })
        .catch(error => {
          if (error.code !== 'E_PICKER_CANCELLED') {
            Alert.alert('Error', 'Failed to take photo');
          }
          reject(error);
        });
    });
  }, []);

  // --- add this helper anywhere above analyzeImagesManually ---
const readJsonSafe = async (res) => {
  const contentType = (res.headers && res.headers.get && res.headers.get('content-type')) || '';
  const text = await res.text();        // always read as text first
  let data = null;
  try {
    data = JSON.parse(text);            // try to parse JSON
  } catch (_) {
    // Throw a readable error with diagnostics when it isn't JSON
    const snippet = text.slice(0, 300).replace(/\s+/g, ' ').trim();
    const statusLine = `${res.status} ${res.statusText || ''}`.trim();
    throw new Error(
      `Unexpected server response (${statusLine}). ` +
      `Content-Type: ${contentType || 'unknown'}. ` +
      `Body starts with: "${snippet}"`
    );
  }
  return data;
};

  // ---- Analyze (no manual Content-Type) ----
// --- replace your analyzeImagesManually with this ---
const analyzeImagesManually = useCallback(
  async (imagePaths) => {
    try {
      setIsAnalyzing(true);
      setAnalysisProgress(t('dashboard.processingImages'));
      dispatch(clearAnalysis());

      const formData = new FormData();
      imagePaths.forEach((uri, index) => {
        formData.append('images[]', {
          uri,
          type: 'image/jpeg',
          name: `image_${index}.jpg`,
        });
      });

      const res = await fetch(
        'https://greenbidz.com/wp-json/greenbidz-api/v1/analize_process_images',
        {
          method: 'POST',
          // do NOT set Content-Type; RN will add the correct multipart boundary
          headers: { Accept: 'application/json' },
          body: formData,
        }
      );

      // read as text first and parse safely
      const data = await readJsonSafe(res);

      // handle non-200 JSON responses as well
      if (!res.ok || data?.success === false) {
        const msg =
          data?.message ||
          (res.status === 413
            ? 'Files are too large for the server.'
            : `Request failed with status ${res.status}`);
        throw new Error(msg);
      }

      // success
      setIsAnalyzing(false);
      setShowOverlay(false);

      navigation.navigate('Details', {
        images: imagePaths,
        imageCount: imagePaths.length,
        analysisData: data,
        timestamp: Date.now(),
      });

      if (authenticationStatus === 'authenticated') {
        loadListings();
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      setIsAnalyzing(false);

      // Show a helpful message (includes server diagnostics if it wasn’t JSON)
      Alert.alert(
        t('dashboard.analysisFailed'),
        error?.message || t('dashboard.analysisFailedMessage'),
        [
          { text: t('dashboard.retry'), onPress: () => analyzeImagesManually(imagePaths) },
          { text: t('cancel'), style: 'cancel' },
        ]
      );
    }
  },
  [t, dispatch, setShowOverlay, navigation, authenticationStatus, loadListings]
);

  // ---- When user accepts images ----
  const handleImagesComplete = useCallback(
    async images => {
      // Keep raw for UI if you need it elsewhere
      setSelectedImages(images);

      const imagePaths = normalizeImageList(images);
      console.log('Normalized paths:', imagePaths);

      try {
        await saveImagesToGallery(imagePaths);
      } catch (e) {
        console.warn('Failed to save images:', e);
        // optional: Alert the user, but do not block analysis
      }

      await analyzeImagesManually(imagePaths);
    },
    [analyzeImagesManually],
  );

  const handleScanMachinePress = useCallback(() => {
    dispatch(clearAnalysis());
    setSelectedImages([]);
    setIsAnalyzing(false);
    setAnalysisProgress('');
    setShowOverlay(true);
  }, [dispatch, setShowOverlay]);

  const handleCloseOverlay = useCallback(() => {
    if (isAnalyzing) {
      Alert.alert(t('dashboard.analysisInProgress'), t('dashboard.cancelAnalysis'), [
        { text: t('dashboard.continueAnalysis'), style: 'cancel' },
        {
          text: t('cancel'),
          style: 'destructive',
          onPress: () => {
            setIsAnalyzing(false);
            setShowOverlay(false);
            setSelectedImages([]);
            dispatch(clearAnalysis());
          },
        },
      ]);
    } else {
      setShowOverlay(false);
      setSelectedImages([]);
      dispatch(clearAnalysis());
    }
  }, [isAnalyzing, t, setShowOverlay, dispatch]);

  const handleScrollEnd = useCallback(
    event => {
      const contentOffset = event.nativeEvent.contentOffset.x;
      const cardWidth = scaleWidth(280) + scaleWidth(16);
      const pageNum = Math.floor(contentOffset / cardWidth);
      if (pageNum >= 0 && pageNum < listings.length) {
        setCurrentIndex(pageNum);
      }
    },
    [listings.length],
  );

  // ---- Focus effect ----
  useFocusEffect(
    useCallback(() => {
      checkAuthenticationStatus().then(isAuth => {
        if (isAuth) {
          loadListings();
        } else {
          setListings([]);
        }
      });

      if (!hasAutoOpenedOverlay) {
        setShowOverlay(true);
        setHasAutoOpenedOverlay(true);
      }
    }, [checkAuthenticationStatus, loadListings, hasAutoOpenedOverlay]),
  );

  // ---- Effects ----
  useEffect(() => {
    if (listings.length > 1) {
      const interval = setInterval(() => {
        if (carouselRef.current) {
          const nextIndex = (currentIndex + 1) % listings.length;
          carouselRef.current.scrollToIndex({ index: nextIndex, animated: true });
          setCurrentIndex(nextIndex);
        }
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [currentIndex, listings.length]);

  useEffect(() => {
    if (!showOverlay) {
      setSelectedImages([]);
      setIsAnalyzing(false);
      setAnalysisProgress('');
    }
  }, [showOverlay]);

  useEffect(() => {
    dispatch(clearAnalysis());
  }, [dispatch]);

  // ---- UI helpers ----
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
      default:
        return { backgroundColor: '#6b7280' };
    }
  };

  const getStatusText = status => {
    switch (status?.toLowerCase()) {
      case 'published':
      case 'publish':
        return t('dashboard.live');
      case 'pending':
        return t('pending');
      case 'sold':
        return t('dashboard.sold');
      case 'draft':
      default:
        return t('dashboard.draft');
    }
  };

  const formatPrice = price => {
    if (!price) return '0';
    return parseInt(price).toLocaleString();
    // consider using Intl.NumberFormat for currency if needed
  };

  const formatDate = dateString => {
    if (!dateString) return t('dashboard.recently');
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return t('dashboard.yesterday');
    if (diffDays < 7) return t('dashboard.daysAgo', { days: diffDays });
    if (diffDays < 30) return t('dashboard.weeksAgo', { weeks: Math.ceil(diffDays / 7) });

    if (currentLanguage === 'zh-hant') {
      return date.toLocaleDateString('zh-hant', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
      });
    }
    return date.toLocaleDateString('en-US');
  };

  const getStatsFromListings = () => {
    const listed = listings.length;
    const published = listings.filter(
      item => item.status === 'publish' || item.status === 'published',
    ).length;
    const pending = listings.filter(item => item.status === 'pending').length;
    const sold = listings.filter(item => item.status === 'sold').length;
    return { listed, published, pending, sold };
  };

  const renderCarouselItem = ({ item }) => (
    <TouchableOpacity
      style={styles.carouselCard}
      onPress={() => navigation.navigate('ProductDetailsById', { productId: item.ID })}
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
            <Text style={styles.placeholderText}>{t('dashboard.noImage')}</Text>
          </View>
        )}

        <View style={[styles.statusBadge, getStatusBadgeStyle(item.status)]}>
          <Text style={styles.statusBadgeText}>{getStatusText(item.status)}</Text>
        </View>

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
            {item.type ? (Array.isArray(item.type) ? item.type.join(', ') : item.type) : 'Equipment'}
          </Text>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.priceContainer}>
            <Text style={styles.cardPrice}>${formatPrice(item.price) || '0'}</Text>
            <Text style={styles.cardPriceLabel}>{t('dashboard.usd')}</Text>
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

  const renderEmptyListings = () => {
    const isUserUnauthorized = authenticationStatus === 'unauthenticated' || isUnauthorized;
    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIconContainer}>
          <Icon name={isUserUnauthorized ? 'lock' : 'inbox'} size={32} color="#6366f1" />
        </View>
        <Text style={styles.emptyTitle}>
          {isUserUnauthorized
            ? t('dashboard.authRequired')
            : error
              ? t('dashboard.noDataAvailable')
              : t('dashboard.noMachinesScanned')}
        </Text>
        <Text style={styles.emptySubtitle}>
          {isUserUnauthorized
            ? t('dashboard.loginToView')
            : error
              ? t('dashboard.unableToLoad')
              : t('dashboard.startScanning')}
        </Text>
        {!error && (
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={isUserUnauthorized ? () => navigation.navigate('Login') : handleScanMachinePress}
          >
            <Icon name={isUserUnauthorized ? 'log-in' : 'plus'} size={16} color="#fff" />
            <Text style={styles.emptyButtonText}>
              {isUserUnauthorized ? t('logins') : t('dashboard.scanNow')}
            </Text>
          </TouchableOpacity>
        )}
        {error && (
          <TouchableOpacity
            style={[styles.emptyButton, { backgroundColor: '#ef4444' }]}
            onPress={onRefresh}
          >
            <Icon name="refresh-cw" size={16} color="#fff" />
            <Text style={styles.emptyButtonText}>{t('dashboard.tryAgain')}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderAnalysisModal = () => (
    <Modal visible={isAnalyzing} transparent animationType="fade">
      <View style={styles.analysisOverlay}>
        <View style={styles.analysisModal}>
          <View style={styles.analysisIconContainer}>
            <Icon name="cpu" size={28} color="#6366f1" />
          </View>
          <Text style={styles.analysisTitle}>{t('dashboard.aiAnalysis')}</Text>
          <ActivityIndicator size="large" color="#6366f1" style={styles.analysisLoader} />
          <Text style={styles.analysisProgress}>
            {analysisProgress || t('dashboard.processingImages')}
          </Text>
          <Text style={styles.analysisSubText}>{t('dashboard.pleaseWait')}</Text>
        </View>
      </View>
    </Modal>
  );

  const stats = getStatsFromListings();

  if (!isLanguageInitialized) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Initializing...</Text>
      </View>
    );
  }

  if (authenticationStatus === 'checking') {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Checking authentication...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#c0faf5" />

      {!showOverlay && (
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerGradient}>
              <View style={styles.headerContent}>
                <View style={styles.headerTop}>
                  <View style={styles.headerLeft}>
                    <View style={styles.logoContainer}>
                      {/* <Icon name="zap" size={20} color="#fff" /> */}
                      <Image source={require('../../../assets/images/logo.png')} style={styles.logoImage} resizeMode="contain" />
                    </View>
                    <View>
                      <Text style={styles.appName}>{t('dashboard.appName')}</Text>
                      <Text style={styles.tagline}>{t('dashboard.tagline')}</Text>
                    </View>
                  </View>
                  <View style={styles.headerRight}>
                    <LanguageSelector size="small" buttonStyle={styles.dashboardLanguageButton} />
                    <TouchableOpacity
                      style={styles.notificationButton}
                      onPress={onRefresh}
                      disabled={refreshing}
                    >
                      <Icon name={refreshing ? 'loader' : 'refresh-cw'} size={18} color="#fff" />
                      <View style={styles.notificationDot} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.headerBottom}>
                  <Text style={styles.welcomeText}>
                    {authenticationStatus === 'authenticated'
                      ? t('dashboard.welcomeBack')
                      : t('dashboard.welcome')}
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
                <Text style={styles.scanButtonTitle}>{t('dashboard.scanMachine')}</Text>
                <Text style={styles.scanButtonDesc}>{t('dashboard.scanDescription')}</Text>
              </TouchableOpacity>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.actionButton}
                  activeOpacity={0.9}
                  onPress={() => navigation.navigate('MyList')}
                >
                  <Icon name="list" size={20} color="#6366f1" />
                  <Text style={styles.actionButtonText}>{t('myListings')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  activeOpacity={0.9}
                  onPress={() => navigation.navigate('Draft')}
                >
                  <Icon name="edit" size={20} color="#6366f1" />
                  <Text style={styles.actionButtonText}>{t('dashboard.draft')}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {authenticationStatus === 'authenticated' && (
              <View style={styles.statsSection}>
                <Text style={styles.sectionTitle}>{t('dashboard.yourMachines')}</Text>
                <View style={styles.statsRow}>
                  <View style={styles.simpleStatCard}>
                    <Text style={styles.statNumber}>{stats.listed}</Text>
                    <Text style={styles.statLabel}>{t('dashboard.total')}</Text>
                  </View>
                  <View style={styles.simpleStatCard}>
                    <Text style={styles.statNumber}>{stats.published}</Text>
                    <Text style={styles.statLabel}>{t('dashboard.live')}</Text>
                  </View>
                  <View style={styles.simpleStatCard}>
                    <Text style={styles.statNumber}>{stats.pending}</Text>
                    <Text style={styles.statLabel}>{t('pending')}</Text>
                  </View>
                  <View style={styles.simpleStatCard}>
                    <Text style={styles.statNumber}>{stats.sold}</Text>
                    <Text style={styles.statLabel}>{t('dashboard.sold')}</Text>
                  </View>
                </View>
              </View>
            )}

            <View style={styles.listingsSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {authenticationStatus === 'authenticated'
                    ? t('dashboard.recentMachines')
                    : t('dashboard.sampleMachines')}
                </Text>
                {authenticationStatus === 'authenticated' && (
                  <TouchableOpacity onPress={() => navigation.navigate('MyList')}>
                    <Text style={styles.seeAllText}>{t('dashboard.viewAll')}</Text>
                  </TouchableOpacity>
                )}
              </View>

              {isLoadingListings ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#6366f1" />
                  <Text style={styles.loadingText}>{t('dashboard.loadingMachines')}</Text>
                </View>
              ) : listings.length > 0 && authenticationStatus === 'authenticated' ? (
                <View style={styles.carouselWrapper}>
                  <FlatList
                    ref={carouselRef}
                    data={listings.slice(0, 10)}
                    renderItem={renderCarouselItem}
                    keyExtractor={item => item.ID?.toString() || Math.random().toString()}
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

                  <CarouselPagination
                    data={listings.slice(0, 10)}
                    currentIndex={currentIndex}
                  />

                  {listings.length > 1 && (
                    <View style={styles.navigationArrows}>
                      <TouchableOpacity
                        style={[styles.navArrow, styles.navArrowLeft]}
                        onPress={() => {
                          const prevIndex =
                            currentIndex === 0 ? listings.length - 1 : currentIndex - 1;
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

      {!showOverlay && <BottomNav setShowOverlay={setShowOverlay} navigation={navigation} />}

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

      {renderAnalysisModal()}
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: scaleWidth(12) },
  dashboardLanguageButton: {
    backgroundColor: '#ffffff',
    borderColor: '#0d9488',
    shadowColor: '#0d9488',
    shadowOffset: { width: 0, height: scaleHeight(2) },
    shadowOpacity: 0.1,
    shadowRadius: scale(4),
    elevation: 3,
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
  headerContent: { paddingHorizontal: scaleWidth(20) },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: scaleHeight(50),
    marginBottom: scaleHeight(20),
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  // logoContainer: {
  //   width: scaleWidth(40),
  //   height: scaleWidth(40),
  //   borderRadius: scale(12),
  //   backgroundColor: '#33decf',
  //   alignItems: 'center',
  //   justifyContent: 'center',
  //   marginRight: scaleWidth(12),
  // },
  appName: { fontSize: scaleFont(20), fontWeight: '700', color: '#0d9488', fontFamily: 'Poppins-Bold' },
  tagline: { fontSize: scaleFont(12), color: '#0d9488', fontFamily: 'Poppins-Regular', marginTop: scaleHeight(-2) },
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
  headerBottom: { paddingBottom: scaleHeight(10) },
  welcomeText: { fontSize: scaleFont(16), color: '#0d9488', fontFamily: 'Poppins-Regular', lineHeight: scaleHeight(18) },
  scrollContainer: { flex: 1 },
  mainActions: { paddingHorizontal: scaleWidth(20), marginTop: scaleHeight(-20), marginBottom: scaleHeight(24) },
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
  scanButtonTitle: { fontSize: scaleFont(20), fontWeight: '700', color: '#fff', fontFamily: 'Poppins-Bold', marginBottom: scaleHeight(4) },
  scanButtonDesc: { fontSize: scaleFont(14), color: 'rgba(255,255,255,0.8)', fontFamily: 'Poppins-Regular' },
  actionRow: { flexDirection: 'row', gap: scaleWidth(12) },
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
  actionButtonText: { fontSize: scaleFont(14), fontWeight: '600', color: '#374151', fontFamily: 'Poppins-SemiBold', marginTop: scaleHeight(8) },
  statsSection: { paddingHorizontal: scaleWidth(20), marginBottom: scaleHeight(24) },
  sectionTitle: { fontSize: scaleFont(18), fontWeight: '700', color: '#111827', fontFamily: 'Poppins-Bold', marginBottom: scaleHeight(16) },
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
  simpleStatCard: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: scaleFont(24), fontWeight: '800', color: '#111827', fontFamily: 'Poppins-ExtraBold', marginBottom: scaleHeight(4) },
  statLabel: { fontSize: scaleFont(12), color: '#6b7280', fontFamily: 'Poppins-Medium' },
  listingsSection: { paddingHorizontal: scaleWidth(16), marginBottom: scaleHeight(32) },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: scaleHeight(20), paddingHorizontal: scaleWidth(4) },
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
  carouselWrapper: { position: 'relative' },
  carouselContent: { paddingHorizontal: scaleWidth(16), paddingBottom: scaleHeight(20) },
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
  cardImageContainer: { position: 'relative', height: scaleHeight(180), backgroundColor: '#f8fafc' },
  cardImage: { width: '100%', height: '100%', borderTopLeftRadius: scale(20), borderTopRightRadius: scale(20) },
  cardImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
  },
  placeholderText: { fontSize: scaleFont(12), color: '#94a3b8', marginTop: scaleHeight(8), fontFamily: 'Poppins-Medium' },
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
  statusBadgeText: { color: '#fff', fontSize: scaleFont(11), fontWeight: '700', fontFamily: 'Poppins-Bold', letterSpacing: 0.5 },
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
  cardContent: { padding: scale(16) },
  cardTitle: { fontSize: scaleFont(16), fontWeight: '700', color: '#111827', fontFamily: 'Poppins-Bold', marginBottom: scaleHeight(8), lineHeight: scaleHeight(22) },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scaleHeight(12),
    backgroundColor: '#f8fafc',
    paddingHorizontal: scaleWidth(10),
    paddingVertical: scaleHeight(6),
    borderRadius: scale(12),
  },
  cardMetaText: { fontSize: scaleFont(13), color: '#64748b', fontFamily: 'Poppins-SemiBold', marginLeft: scaleWidth(6), flex: 1 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: scaleHeight(12) },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: scaleWidth(10),
    paddingVertical: scaleHeight(6),
    borderRadius: scale(8),
  },
  cardPrice: { fontSize: scaleFont(18), fontWeight: '800', color: '#059669', fontFamily: 'Poppins-ExtraBold' },
  cardPriceLabel: { fontSize: scaleFont(11), color: '#047857', fontFamily: 'Poppins-Bold', marginLeft: scaleWidth(4) },
  cardActions: { flexDirection: 'row', gap: scaleWidth(8) },
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
  cardDate: { fontSize: scaleFont(11), color: '#6366f1', fontFamily: 'Poppins-SemiBold' },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: scaleHeight(16),
    gap: scaleWidth(8),
  },
  paginationDot: { width: scaleWidth(8), height: scaleWidth(8), borderRadius: scale(4), backgroundColor: '#e2e8f0', transition: 'all 0.3s ease' },
  paginationDotActive: { backgroundColor: '#6366f1', width: scaleWidth(20), borderRadius: scale(4) },
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
  navArrowLeft: { marginLeft: scaleWidth(8) },
  navArrowRight: { marginRight: scaleWidth(8) },
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
  emptyButtonText: { color: '#fff', fontSize: scaleFont(16), fontWeight: '700', fontFamily: 'Poppins-Bold' },
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
  loadingText: { fontSize: scaleFont(16), color: '#6366f1', marginTop: scaleHeight(16), fontFamily: 'Poppins-SemiBold' },
  analysisOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center' },
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
  analysisTitle: { fontSize: scaleFont(20), fontWeight: '700', color: '#111827', fontFamily: 'Poppins-Bold', marginBottom: scaleHeight(8) },
  analysisLoader: { marginVertical: scaleHeight(16) },
  analysisProgress: {
    fontSize: scaleFont(14),
    color: '#6366f1',
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'Poppins-SemiBold',
    marginBottom: scaleHeight(8),
  },
  analysisSubText: { fontSize: scaleFont(12), color: '#6b7280', textAlign: 'center', fontFamily: 'Poppins-Regular' },
  logoContainer: {
    width: scaleWidth(35),
    height: scaleWidth(35),
    borderRadius: scale(12),
    // backgroundColor: '#33decf', // optional; remove if you don't want a colored box
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scaleWidth(12),
    overflow: 'hidden', // ensures the image respects rounded corners
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
});
