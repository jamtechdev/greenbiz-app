import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  Platform,
  StatusBar,
  Animated,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Alert,
  PermissionsAndroid,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/Feather';
import RNFetchBlob from 'rn-fetch-blob';
import {
  scale,
  scaleFont,
  scaleHeight,
  scaleWidth,
} from '../../utils/resposive';
import BottomNav from '../../components/BottomNavbar';
import CustomAlert from '../../components/CustomAlert';
import { apiService } from '../../api/axiosConfig';

const COLORS = {
  primary: '#2563eb',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  background: '#f8fafc',
  cardBackground: '#ffffff',
  textPrimary: '#1e293b',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
  border: '#e2e8f0',
  light: '#f1f5f9',
  accent: '#6366f1',
  teal: '#0d9488',
};

const FONTS = {
  regular: 'Poppins-Regular',
  medium: 'Poppins-Medium',
  semiBold: 'Poppins-SemiBold',
  bold: 'Poppins-Bold',
};

export default function ProductDetailScreen({ route, navigation }) {
  const { t } = useTranslation();
  const { productId } = route.params;
  const [isLoading, setIsLoading] = useState(true);
  const [productData, setProductData] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [alertConfig, setAlertConfig] = useState({ visible: false });
  const [downloadingDocs, setDownloadingDocs] = useState({});

  const showError = ({ title, message }) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      buttons: [
        { text: t('ok'), onPress: () => setAlertConfig({ visible: false }) },
      ],
    });
  };

  const showSuccess = ({ title, message }) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      buttons: [
        { text: t('ok'), onPress: () => setAlertConfig({ visible: false }) },
      ],
    });
  };

  // Request storage permission for Android
  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: t('productDetail.permissions.storageTitle'),
            message: t('productDetail.permissions.storageMessage'),
            buttonNeutral: t('productDetail.permissions.askLater'),
            buttonNegative: t('cancel'),
            buttonPositive: t('ok'),
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  // Download document function
  const downloadDocument = async (doc, index) => {
    try {
      // Request permission first
      const hasPermission = await requestStoragePermission();
      if (!hasPermission) {
        showError({
          title: t('productDetail.permissions.required'),
          message: t('productDetail.permissions.storageRequired'),
        });
        return;
      }

      // Set downloading state
      setDownloadingDocs(prev => ({ ...prev, [index]: true }));

      // Get document URL and name
      const documentUrl = typeof doc === 'string' ? doc : doc.url || doc.path || doc.link;
      const documentName = typeof doc === 'string' 
        ? t('productDetail.documents.defaultName', { productId, index: index + 1 })
        : doc.name || doc.filename || t('productDetail.documents.defaultName', { productId, index: index + 1 });

      console.log('Document URL:', documentUrl);
      console.log('Document Name:', documentName);

      if (!documentUrl) {
        throw new Error(t('productDetail.documents.urlNotFound'));
      }

      // Configure download path
      const { config, fs } = RNFetchBlob;
      const downloadsPath = Platform.OS === 'ios' 
        ? fs.dirs.DocumentDir 
        : fs.dirs.DownloadDir;
      
      const filePath = `${downloadsPath}/${documentName}`;

      // Show download started alert
      Alert.alert(
        t('productDetail.documents.downloadStarted'),
        t('productDetail.documents.downloadingFile', { fileName: documentName }),
        [{ text: t('ok') }]
      );

      // Start download
      const response = await config({
        fileCache: true,
        addAndroidDownloads: Platform.OS === 'android' ? {
          useDownloadManager: true,
          notification: true,
          path: filePath,
          description: t('productDetail.documents.downloading'),
          mime: 'application/pdf',
        } : undefined,
        path: filePath,
      }).fetch('GET', documentUrl);

      // Success feedback
      if (Platform.OS === 'ios') {
        showSuccess({
          title: t('productDetail.documents.downloadComplete'),
          message: t('productDetail.documents.downloadSuccess', { fileName: documentName }),
        });
      } else {
        Alert.alert(
          t('productDetail.documents.downloadComplete'),
          t('productDetail.documents.downloadedToFolder', { fileName: documentName }),
          [
            { text: t('ok') },
            {
              text: t('productDetail.documents.openFile'),
              onPress: () => {
                // Try to open the file
                RNFetchBlob.android.actionViewIntent(filePath, 'application/pdf')
                  .catch(err => {
                    console.error('Cannot open file:', err);
                    showError({
                      title: t('productDetail.documents.cannotOpen'),
                      message: t('productDetail.documents.usePdfViewer'),
                    });
                  });
              }
            }
          ]
        );
      }

    } catch (error) {
      console.error('Download error:', error);
      showError({
        title: t('productDetail.documents.downloadFailed'),
        message: error.message || t('productDetail.documents.downloadError'),
      });
    } finally {
      // Remove downloading state
      setDownloadingDocs(prev => {
        const newState = { ...prev };
        delete newState[index];
        return newState;
      });
    }
  };

  // Alternative: Open document in browser
  const openDocumentInBrowser = async (doc, index) => {
    try {
      const documentUrl = typeof doc === 'string' ? doc : doc.url || doc.path || doc.link;
      
      if (!documentUrl) {
        throw new Error(t('productDetail.documents.urlNotFound'));
      }

      const supported = await Linking.canOpenURL(documentUrl);
      
      if (supported) {
        await Linking.openURL(documentUrl);
      } else {
        showError({
          title: t('productDetail.documents.cannotOpen'),
          message: t('productDetail.documents.unableToOpen'),
        });
      }
    } catch (error) {
      console.error('Open document error:', error);
      showError({
        title: t('error'),
        message: t('productDetail.documents.failedToOpen'),
      });
    }
  };

  // Handle document press with options
  const handleDocumentPress = (doc, index) => {
    const documentName = typeof doc === 'string' 
      ? t('productDetail.documents.document', { index: index + 1 })
      : doc.name || doc.filename || t('productDetail.documents.document', { index: index + 1 });

    Alert.alert(
      t('productDetail.documents.options'),
      t('productDetail.documents.whatToDo', { fileName: documentName }),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('productDetail.documents.download'),
          onPress: () => downloadDocument(doc, index),
        },
        {
          text: t('productDetail.documents.openInBrowser'),
          onPress: () => openDocumentInBrowser(doc, index),
        },
      ]
    );
  };

  const fetchProductData = async id => {
    try {
      setIsLoading(true);
      const response = await apiService.getProductById(id);
      if (response.data?.success && response.data.data) {
        setProductData(response.data.data);
      } else {
        throw new Error(t('productDetail.errors.invalidResponse'));
      }

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      showError({ 
        title: t('error'), 
        message: t('productDetail.errors.failedToLoad') 
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      fetchProductData(productId);
    } else {
      showError({ 
        title: t('error'), 
        message: t('productDetail.errors.noProductId') 
      });
    }
  }, [productId]);

  if (isLoading || !productData) {
    return (
      <View style={[styles.container, styles.centered]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>{t('productDetail.loading')}</Text>
        </View>
      </View>
    );
  }

  const images =
    Array.isArray(productData.images) && productData.images.length > 0
      ? productData.images
      : [];

  // =========== STATUS BADGE ===========
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: COLORS.warning, text: t('productDetail.status.pending'), icon: 'clock' },
      published: { color: COLORS.success, text: t('productDetail.status.published'), icon: 'check-circle' },
      publish: { color: COLORS.success, text: t('productDetail.status.live'), icon: 'check-circle' },
      draft: { color: COLORS.textMuted, text: t('productDetail.status.draft'), icon: 'edit-3' },
      sold: { color: COLORS.accent, text: t('productDetail.status.sold'), icon: 'shopping-bag' },
    };

    const config = statusConfig[status?.toLowerCase()] || statusConfig.draft;
    
    return (
      <View style={[styles.statusBadge, { backgroundColor: config.color }]}>
        <Icon name={config.icon} size={12} color="#fff" style={{ marginRight: 6 }} />
        <Text style={styles.statusBadgeText}>{config.text}</Text>
      </View>
    );
  };

  // =========== IMAGE GALLERY ===========
  const renderImageGallery = () => {
    if (!images.length) {
      return (
        <View style={styles.imagePlaceholder}>
          <Icon name="image" size={48} color={COLORS.textMuted} />
          <Text style={styles.placeholderText}>{t('productDetail.images.noImages')}</Text>
          <Text style={styles.placeholderSubtext}>{t('productDetail.images.imagesWillAppear')}</Text>
        </View>
      );
    }

    // single image
    if (images.length === 1) {
      return (
        <View style={styles.singleImageContainer}>
          <Image
            source={{ uri: images[0] }}
            style={styles.singleImage}
            resizeMode="contain"
          />
          <View style={styles.imageOverlay}>
            {getStatusBadge(productData.status)}
            <TouchableOpacity style={styles.fullscreenButton}>
              <Icon name="maximize" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // carousel/gallery
    return (
      <View style={styles.imageGalleryContainer}>
        <View style={styles.mainImageContainer}>
          <Image
            source={{ uri: images[currentImageIndex] }}
            style={styles.mainImage}
            resizeMode="cover"
          />
          <View style={styles.imageOverlay}>
            {getStatusBadge(productData.status)}
            <View style={styles.imageActions}>
              <View style={styles.imageCounter}>
                <Text style={styles.imageCounterText}>
                  {currentImageIndex + 1} / {images.length}
                </Text>
              </View>
              <TouchableOpacity style={styles.fullscreenButton}>
                <Icon name="maximize" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
          {currentImageIndex > 0 && (
            <TouchableOpacity
              style={[styles.navArrow, styles.prevArrow]}
              onPress={() => setCurrentImageIndex(prev => prev - 1)}
            >
              <Icon name="chevron-left" size={20} color="#fff" />
            </TouchableOpacity>
          )}
          {currentImageIndex < images.length - 1 && (
            <TouchableOpacity
              style={[styles.navArrow, styles.nextArrow]}
              onPress={() => setCurrentImageIndex(prev => prev + 1)}
            >
              <Icon name="chevron-right" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
        <ScrollView
          horizontal
          style={styles.thumbnailStrip}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.thumbnailContent}
        >
          {images.map((uri, idx) => (
            <TouchableOpacity
              key={idx}
              style={[
                styles.thumbnailItem,
                idx === currentImageIndex && styles.activeThumbnail,
              ]}
              onPress={() => setCurrentImageIndex(idx)}
            >
              <Image source={{ uri }} style={styles.thumbnailImage} />
              {idx === currentImageIndex && (
                <View style={styles.activeThumbnailOverlay}>
                  <Icon name="check" size={12} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  // =========== DISPLAY FIELD ===========
  const DisplayField = ({ label, value, icon, multiline, type = 'text' }) => (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldHeader}>
        <Icon name={icon} size={16} color={COLORS.primary} />
        <Text style={styles.fieldLabel}>{label}</Text>
      </View>
      <View style={styles.fieldDisplay}>
        <Text
          style={[
            styles.fieldText,
            multiline && styles.fieldTextMultiline,
            type === 'highlight' && styles.fieldTextHighlight,
            !value && { color: COLORS.textMuted },
          ]}
        >
          {value || t('productDetail.notSpecified')}
        </Text>
      </View>
    </View>
  );

  // =========== PRICE FIELD ===========
  const DisplayPrice = ({ label, value, currency, icon, isReserve = false }) => (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldHeader}>
        <Icon name={icon} size={16} color={isReserve ? COLORS.warning : COLORS.success} />
        <Text style={styles.fieldLabel}>{label}</Text>
      </View>
      <View style={[styles.priceDisplay, isReserve && styles.reservePriceDisplay]}>
        <Text style={[styles.priceText, isReserve && styles.reservePriceText]}>
          {currency} {parseFloat(value || 0).toLocaleString()}
        </Text>
      </View>
    </View>
  );

  // =========== AUCTION INFO ===========
  const renderAuctionInfo = () => {
    if (productData.product_type !== 'auction') return null;

    return (
      <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
        <View style={styles.sectionHeaderWithIcon}>
          <Icon name="zap" size={20} color={COLORS.accent} />
          <Text style={styles.sectionTitle}>{t('productDetail.sections.auctionDetails')}</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.fieldRow}>
            <View style={styles.fieldHalf}>
              <DisplayPrice
                label={t('productDetail.auction.startingPrice')}
                value={productData.auction_start_price}
                currency={productData.currency}
                icon="play-circle"
              />
            </View>
            <View style={styles.fieldHalf}>
              <DisplayPrice
                label={t('productDetail.auction.reservePrice')}
                value={productData.auction_reserve}
                currency={productData.currency}
                icon="shield"
                isReserve={true}
              />
            </View>
          </View>
          
          {/* <DisplayField
            label={t('productDetail.auction.bidIncrement')}
            value={productData.auction_increment ? `${productData.currency} ${productData.auction_increment}` : t('productDetail.notSpecified')}
            icon="trending-up"
          /> */}
          
          <View style={styles.fieldRow}>
            <View style={styles.fieldHalf}>
              <DisplayField
                label={t('productDetail.auction.startTime')}
                value={productData.auction_start_time || t('productDetail.auction.notScheduled')}
                icon="calendar"
              />
            </View>
            <View style={styles.fieldHalf}>
              <DisplayField
                label={t('productDetail.auction.endTime')}
                value={productData.auction_end_time || t('productDetail.auction.notScheduled')}
                icon="calendar"
              />
            </View>
          </View>
          
          {productData.auction_group && (
            <DisplayField
              label={t('productDetail.auction.auctionGroup')}
              value={productData.auction_group}
              icon="users"
            />
          )}
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.teal} />
      <View style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-left" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>{t('productDetail.title')}</Text>
              <Text style={styles.headerSubtitle}>
                {t('productDetail.id', { id: productData.ID })}
              </Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.shareButton}>
                <Icon name="share-2" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* IMAGES */}
        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <View style={styles.sectionHeaderWithIcon}>
            <Icon name="image" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>{t('productDetail.sections.images')}</Text>
          </View>
          {renderImageGallery()}
        </Animated.View>

        {/* BASIC INFO */}
        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <View style={styles.sectionHeaderWithIcon}>
            <Icon name="info" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>{t('productDetail.sections.basicInfo')}</Text>
          </View>
          <View style={styles.card}>
            <DisplayField
              label={t('productDetail.fields.productTitle')}
              value={productData.title}
              icon="tag"
              type="highlight"
            />
            <View style={styles.fieldRow}>
              <View style={styles.fieldHalf}>
                <DisplayField
                  label={t('productDetail.fields.brand')}
                  value={productData.brand}
                  icon="award"
                />
              </View>
              <View style={styles.fieldHalf}>
                <DisplayField
                  label={t('productDetail.fields.model')}
                  value={productData.model}
                  icon="cpu"
                />
              </View>
            </View>
            <DisplayField
              label={t('productDetail.fields.manufacturingYear')}
              value={productData.manufacturing_year}
              icon="calendar"
            />
            <DisplayField
              label={t('productDetail.fields.description')}
              value={productData.description}
              icon="file-text"
              multiline
            />
          </View>
        </Animated.View>

        {/* CONDITION/STATUS */}
        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <View style={styles.sectionHeaderWithIcon}>
            <Icon name="shield-check" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>{t('productDetail.sections.conditionStatus')}</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.fieldRow}>
              <View style={styles.fieldHalf}>
                <DisplayField
                  label={t('productDetail.fields.itemCondition')}
                  value={productData.item_condition}
                  icon="shield-check"
                />
              </View>
              <View style={styles.fieldHalf}>
                <DisplayField
                  label={t('productDetail.fields.operationStatus')}
                  value={productData.operation_status}
                  icon="activity"
                />
              </View>
            </View>
            <DisplayField
              label={t('productDetail.fields.listingStatus')}
              value={productData.status}
              icon="info"
            />
          </View>
        </Animated.View>

        {/* PRICING */}
        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <View style={styles.sectionHeaderWithIcon}>
            <Icon name="dollar-sign" size={20} color={COLORS.success} />
            <Text style={styles.sectionTitle}>{t('productDetail.sections.pricing')}</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.fieldRow}>
              <View style={styles.fieldHalf}>
                <DisplayField
                  label={t('productDetail.fields.currency')}
                  value={productData.currency}
                  icon="dollar-sign"
                />
              </View>
              <View style={styles.fieldHalf}>
                <DisplayPrice
                  label={t('productDetail.fields.price')}
                  value={productData.price}
                  currency={productData.currency}
                  icon="tag"
                />
              </View>
            </View>
          </View>
        </Animated.View>

        {/* AUCTION DETAILS (only if auction type) */}
        {renderAuctionInfo()}

        {/* PRODUCT TYPE */}
        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <View style={styles.sectionHeaderWithIcon}>
            <Icon name="package" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>{t('productDetail.sections.productType')}</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.productTypeContainer}>
              <View
                style={[
                  styles.productTypeButton,
                  productData.product_type === 'marketplace' &&
                    styles.productTypeButtonActive,
                  { marginRight: scaleWidth(12) },
                ]}
              >
                <Icon
                  name="shopping-bag"
                  size={18}
                  color={
                    productData.product_type === 'marketplace'
                      ? COLORS.primary
                      : COLORS.textSecondary
                  }
                  style={styles.productTypeIcon}
                />
                <View style={styles.productTypeContent}>
                  <Text
                    style={[
                      styles.productTypeTitle,
                      productData.product_type === 'marketplace' &&
                        styles.productTypeTextActive,
                    ]}
                  >
                    {t('productDetail.productType.marketplace')}
                  </Text>
                  <Text style={styles.productTypeDescription}>
                    {t('productDetail.productType.marketplaceDesc')}
                  </Text>
                </View>
                {productData.product_type === 'marketplace' && (
                  <Icon
                    name="check-circle"
                    size={16}
                    color={COLORS.primary}
                    style={{ marginLeft: 4 }}
                  />
                )}
              </View>
              <View
                style={[
                  styles.productTypeButton,
                  productData.product_type === 'auction' &&
                    styles.productTypeButtonActive,
                ]}
              >
                <Icon
                  name="zap"
                  size={18}
                  color={
                    productData.product_type === 'auction'
                      ? COLORS.accent
                      : COLORS.textSecondary
                  }
                  style={styles.productTypeIcon}
                />
                <View style={styles.productTypeContent}>
                  <Text
                    style={[
                      styles.productTypeTitle,
                      productData.product_type === 'auction' &&
                        styles.productTypeTextActive,
                    ]}
                  >
                    {t('productDetail.productType.auction')}
                  </Text>
                  <Text style={styles.productTypeDescription}>
                    {t('productDetail.productType.auctionDesc')}
                  </Text>
                </View>
                {productData.product_type === 'auction' && (
                  <Icon
                    name="check-circle"
                    size={16}
                    color={COLORS.accent}
                    style={{ marginLeft: 4 }}
                  />
                )}
              </View>
            </View>
          </View>
        </Animated.View>

        {/* LOCATION & CATEGORY */}
        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <View style={styles.sectionHeaderWithIcon}>
            <Icon name="map-pin" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>{t('productDetail.sections.locationCategory')}</Text>
          </View>
          <View style={styles.card}>
            <DisplayField
              label={t('productDetail.fields.category')}
              value={productData.category}
              icon="list"
            />
            {productData.subcategory && (
              <DisplayField
                label={t('productDetail.fields.subCategory')}
                value={productData.subcategory}
                icon="tag"
              />
            )}
            <DisplayField
              label={t('productDetail.fields.location')}
              value={productData.location}
              icon="map-pin"
            />
          </View>
        </Animated.View>

        {/* PDF DOCUMENTS - FIXED SECTION */}
        {productData.pdf_documents && productData.pdf_documents.length > 0 && (
          <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
            <View style={styles.sectionHeaderWithIcon}>
              <Icon name="file-text" size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>{t('productDetail.sections.documents')}</Text>
            </View>
            <View style={styles.card}>
              {productData.pdf_documents.map((doc, index) => {
                const isDownloading = downloadingDocs[index];
                const documentName = typeof doc === 'string' 
                  ? t('productDetail.documents.document', { index: index + 1 })
                  : doc.name || doc.filename || t('productDetail.documents.document', { index: index + 1 });
                
                return (
                  <TouchableOpacity 
                    key={index} 
                    style={[
                      styles.documentItem,
                      isDownloading && styles.documentItemDownloading
                    ]}
                    onPress={() => handleDocumentPress(doc, index)}
                    disabled={isDownloading}
                    activeOpacity={0.7}
                  >
                    <View style={styles.documentIcon}>
                      <Icon 
                        name="file-text" 
                        size={20} 
                        color={isDownloading ? COLORS.textMuted : COLORS.primary} 
                      />
                    </View>
                    
                    <View style={styles.documentInfo}>
                      <Text style={[
                        styles.documentText,
                        isDownloading && styles.documentTextDisabled
                      ]}>
                        {documentName}
                      </Text>
                      <Text style={styles.documentSubtext}>
                        {isDownloading 
                          ? t('productDetail.documents.downloading') 
                          : t('productDetail.documents.tapToDownload')
                        }
                      </Text>
                    </View>
                    
                    <View style={styles.documentAction}>
                      {isDownloading ? (
                        <ActivityIndicator size="small" color={COLORS.primary} />
                      ) : (
                        <View style={styles.downloadButton}>
                          <Icon name="download" size={16} color={COLORS.primary} />
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
              
              {/* Download info */}
              <View style={styles.documentInfoContainer}>
                <Icon name="info" size={14} color={COLORS.textMuted} />
                <Text style={styles.documentInfoText}>
                  {t('productDetail.documents.downloadInfo')}
                </Text>
              </View>
            </View>
          </Animated.View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      <BottomNav navigation={navigation} />
      <CustomAlert {...alertConfig} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },
  centered: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: scaleWidth(32),
  },
  loadingText: {
    marginTop: scaleHeight(16),
    fontSize: scaleFont(16),
    color: COLORS.textSecondary,
    fontFamily: FONTS.medium,
  },

  header: {
    backgroundColor: COLORS.teal,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scaleWidth(20),
  },
  backButton: { 
    padding: scaleWidth(8), 
    marginRight: scaleWidth(10),
    borderRadius: scaleWidth(20),
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  headerText: { flex: 1 },
  headerTitle: {
    fontSize: scaleFont(22),
    fontFamily: FONTS.bold,
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: scaleFont(14),
    fontFamily: FONTS.regular,
    color: 'rgba(255,255,255,0.8)',
    marginTop: scaleHeight(2),
  },
  headerRight: {
    marginLeft: scaleWidth(10),
  },
  shareButton: {
    padding: scaleWidth(8),
    borderRadius: scaleWidth(20),
    backgroundColor: 'rgba(255,255,255,0.1)',
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: { 
    paddingBottom: scaleHeight(100) 
  },

  section: { 
    marginTop: scaleHeight(24), 
    paddingHorizontal: scaleWidth(20) 
  },
  sectionHeaderWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scaleHeight(16),
  },
  sectionTitle: {
    fontSize: scaleFont(18),
    fontFamily: FONTS.semiBold,
    color: COLORS.textPrimary,
    marginLeft: scaleWidth(8),
  },

  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: scaleWidth(16),
    padding: scaleWidth(20),
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: scaleHeight(8),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },

  // Status Badge
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(6),
    borderRadius: scaleWidth(20),
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: scaleFont(12),
    fontFamily: FONTS.medium,
    fontWeight: '600',
  },

  // Image styles
  imagePlaceholder: {
    height: scaleHeight(280),
    backgroundColor: COLORS.light,
    borderRadius: scaleWidth(16),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    marginBottom: scaleHeight(16),
  },
  placeholderText: {
    marginTop: scaleHeight(12),
    fontSize: scaleFont(16),
    color: COLORS.textSecondary,
    fontFamily: FONTS.medium,
  },
  placeholderSubtext: {
    marginTop: scaleHeight(4),
    fontSize: scaleFont(14),
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
  },
  singleImageContainer: {
    height: scaleHeight(280),
    borderRadius: scaleWidth(16),
    overflow: 'hidden',
    marginBottom: scaleHeight(16),
    backgroundColor: COLORS.light,
    position: 'relative',
  },
  singleImage: { 
    width: '100%', 
    height: '100%' 
  },
  imageOverlay: {
    position: 'absolute',
    top: scaleHeight(16),
    left: scaleWidth(16),
    right: scaleWidth(16),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  imageActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(8),
  },
  fullscreenButton: {
    width: scaleWidth(36),
    height: scaleWidth(36),
    borderRadius: scaleWidth(18),
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Multi-image carousel
  imageGalleryContainer: { 
    marginBottom: scaleHeight(16) 
  },
  mainImageContainer: {
    position: 'relative',
    height: scaleHeight(280),
    borderRadius: scaleWidth(16),
    overflow: 'hidden',
    backgroundColor: COLORS.light,
    marginBottom: scaleHeight(12),
  },
  mainImage: { 
    width: '100%', 
    height: '100%' 
  },
  imageCounter: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: scaleWidth(10),
    paddingVertical: scaleHeight(6),
    borderRadius: scaleWidth(12),
  },
  imageCounterText: {
    color: '#fff',
    fontSize: scaleFont(12),
    fontFamily: FONTS.medium,
  },
  navArrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -scaleHeight(20),
    width: scaleWidth(40),
    height: scaleWidth(40),
    borderRadius: scaleWidth(20),
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prevArrow: { left: scaleWidth(16) },
  nextArrow: { right: scaleWidth(16) },
  thumbnailStrip: { 
    maxHeight: scaleHeight(80) 
  },
  thumbnailContent: { 
    paddingHorizontal: scaleWidth(4), 
    flexDirection: 'row' 
  },
  thumbnailItem: {
    width: scaleWidth(70),
    height: scaleWidth(70),
    borderRadius: scaleWidth(12),
    overflow: 'hidden',
    marginRight: scaleWidth(12),
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeThumbnail: { 
    borderColor: COLORS.primary,
    borderWidth: 3,
  },
  thumbnailImage: { 
    width: '100%', 
    height: '100%' 
  },
  activeThumbnailOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(37, 99, 235, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Fields
  fieldContainer: { 
    marginBottom: scaleHeight(20) 
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scaleHeight(8),
  },
  fieldLabel: {
    fontSize: scaleFont(14),
    fontFamily: FONTS.medium,
    color: COLORS.textPrimary,
    marginLeft: scaleWidth(8),
  },
  fieldDisplay: {
    backgroundColor: COLORS.light,
    paddingVertical: scaleHeight(12),
    paddingHorizontal: scaleWidth(16),
    borderRadius: scaleWidth(12),
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  fieldText: {
    fontSize: scaleFont(15),
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    lineHeight: scaleHeight(22),
  },
  fieldTextMultiline: { 
    minHeight: scaleHeight(80), 
    textAlignVertical: 'top' 
  },
  fieldTextHighlight: {
    fontSize: scaleFont(17),
    fontFamily: FONTS.semiBold,
    color: COLORS.textPrimary,
  },

  fieldRow: { 
    flexDirection: 'column', 
    justifyContent: 'space-between' 
  },
  fieldHalf: { 
    flex: 1, 
    marginRight: scaleWidth(12) 
  },

  priceDisplay: {
    backgroundColor: '#f0fdf4',
    paddingVertical: scaleHeight(12),
    paddingHorizontal: scaleWidth(16),
    borderRadius: scaleWidth(12),
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  priceText: {
    fontSize: scaleFont(18),
    fontFamily: FONTS.bold,
    color: COLORS.success,
  },
  reservePriceDisplay: {
    backgroundColor: '#fef3c7',
    borderColor: '#fcd34d',
  },
  reservePriceText: {
    color: COLORS.warning,
  },

  productTypeContainer: { 
    flexDirection: 'column', 
  },
  productTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: scaleWidth(16),
    backgroundColor: '#fff',
    paddingVertical: scaleHeight(16),
    paddingHorizontal: scaleWidth(16),
    marginBottom: scaleHeight(12),
  },
  productTypeButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#eef2ff',
  },
  productTypeIcon: { 
    marginRight: scaleWidth(12) 
  },
  productTypeContent: { 
    flex: 1 
  },
  productTypeTitle: {
    fontSize: scaleFont(15),
    color: COLORS.textSecondary,
    fontFamily: FONTS.medium,
  },
  productTypeTextActive: { 
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
  },
  productTypeDescription: {
    fontSize: scaleFont(13),
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
    marginTop: scaleHeight(4),
  },

  // Documents - Enhanced styles
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scaleHeight(16),
    paddingHorizontal: scaleWidth(16),
    backgroundColor: '#fff',
    borderRadius: scaleWidth(12),
    marginBottom: scaleHeight(12),
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  documentItemDownloading: {
    backgroundColor: '#f8f9fa',
    opacity: 0.7,
  },
  documentIcon: {
    width: scaleWidth(48),
    height: scaleWidth(48),
    borderRadius: scaleWidth(24),
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scaleWidth(16),
    borderWidth: 1,
    borderColor: '#b3e5fc',
  },
  documentInfo: {
    flex: 1,
  },
  documentText: {
    fontSize: scaleFont(16),
    color: COLORS.textPrimary,
    fontFamily: FONTS.medium,
    marginBottom: scaleHeight(4),
  },
  documentTextDisabled: {
    color: COLORS.textMuted,
  },
  documentSubtext: {
    fontSize: scaleFont(13),
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
  },
  documentAction: {
    marginLeft: scaleWidth(16),
  },
  downloadButton: {
    width: scaleWidth(40),
    height: scaleWidth(40),
    borderRadius: scaleWidth(20),
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#b3e5fc',
  },
  documentInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: scaleHeight(16),
    marginTop: scaleHeight(8),
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  documentInfoText: {
    fontSize: scaleFont(13),
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
    marginLeft: scaleWidth(6),
    textAlign: 'center',
  },

  bottomSpacing: { 
    height: scaleHeight(40) 
  },
});