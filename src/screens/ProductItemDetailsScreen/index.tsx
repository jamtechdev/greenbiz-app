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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { scale, scaleFont, scaleHeight, scaleWidth } from '../../utils/resposive';
import BottomNav from '../../components/BottomNavbar';
import CustomAlert from '../../components/CustomAlert';
import { apiService } from '../../api/axiosConfig';

const COLORS = {
  primary: '#2563eb',
  background: '#f8fafc',
  cardBackground: '#ffffff',
  textPrimary: '#1e293b',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
  border: '#e2e8f0',
  light: '#f1f5f9',
};

const FONTS = {
  regular: 'Poppins-Regular',
  medium: 'Poppins-Medium',
  semiBold: 'Poppins-SemiBold',
};

export default function ProductDetailScreen({ route, navigation }) {
  const { productId } = route.params;
  const [isLoading, setIsLoading] = useState(true);
  const [productData, setProductData] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [alertConfig, setAlertConfig] = useState({ visible: false });

  const showError = ({ title, message }) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      buttons: [{ text: 'OK', onPress: () => setAlertConfig({ visible: false }) }],
    });
  };

  const fetchProductData = async (id) => {
    try {
      setIsLoading(true);
      // If you want to mock with your JSON, comment out the next 3 lines and uncomment the setTimeout below
      const response = await apiService.getProductById(id);
      if (response.data?.success && response.data.data) {
        setProductData(response.data.data);
      } else {
        throw new Error('Invalid response format');
      }

      // // MOCK DATA TESTING:
      // setTimeout(() => {
      //   setProductData({
      //     ID: 24712,
      //     title: 'PlayStation 4 Slim',
      //     description: 'Gaming console with one controller',
      //     status: 'pending',
      //     brand: 'Sony',
      //     model: 'CUH-2115B',
      //     item_condition: 'Used',
      //     operation_status: 'Fully functional',
      //     manufacturing_year: '2016',
      //     currency: 'USD',
      //     pdf_documents: [],
      //     product_type: 'marketplace',
      //     price: '500',
      //     regular_price: '500',
      //     category: 'Heavy Equipment',
      //     subcategory: '',
      //     location: 'South Korea',
      //     images: ['https://greenbidz.com/wp-content/uploads/2025/08/image_0-23.jpg']
      //   });
      // }, 300);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      showError({ title: 'Error', message: 'Failed to load product data.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      fetchProductData(productId);
    } else {
      showError({ title: 'Error', message: 'No product ID provided' });
    }
  }, [productId]);

  if (isLoading || !productData) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading product data...</Text>
      </View>
    );
  }

  const images = Array.isArray(productData.images) && productData.images.length > 0
    ? productData.images
    : [];

  // =========== IMAGE GALLERY ===========
  const renderImageGallery = () => {
    if (!images.length) {
      return (
        <View style={styles.imagePlaceholder}>
          <Icon name="camera" size={32} color={COLORS.textMuted} />
          <Text style={styles.placeholderText}>No Images Available</Text>
        </View>
      );
    }

    // single image
    if (images.length === 1) {
      return (
        <View style={styles.singleImageContainer}>
          <Image source={{ uri: images[0] }} style={styles.singleImage} resizeMode="contain" />
        </View>
      );
    }

    // carousel/gallery
    return (
      <View style={styles.imageGalleryContainer}>
        <View style={styles.mainImageContainer}>
          <Image source={{ uri: images[currentImageIndex] }} style={styles.mainImage} resizeMode="cover" />
          <View style={styles.imageCounter}>
            <Text style={styles.imageCounterText}>{currentImageIndex + 1} / {images.length}</Text>
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
  const DisplayField = ({ label, value, icon, multiline }) => (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldHeader}>
        <Icon name={icon} size={16} color={COLORS.primary} />
        <Text style={styles.fieldLabel}>{label}</Text>
      </View>
      <View style={styles.fieldDisplay}>
        <Text style={[
          styles.fieldText,
          multiline && styles.fieldTextMultiline,
          !value && { color: COLORS.textMuted },
        ]}>{value || '-'}</Text>
      </View>
    </View>
  );

  // =========== PRICE FIELD ===========
  const DisplayPrice = ({ label, value, currency, icon }) => (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldHeader}>
        <Icon name={icon} size={16} color={COLORS.primary} />
        <Text style={styles.fieldLabel}>{label}</Text>
      </View>
      <View style={styles.priceDisplay}>
        <Text style={styles.priceText}>
          {currency} {parseFloat(value || 0).toLocaleString()}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={'#c0faf5'} />
      <View style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Icon name="arrow-left" size={24} color="#0d9488" />
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Product Detail</Text>
              <Text style={styles.headerSubtitle}>View listing details</Text>
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
          <Text style={styles.sectionTitle}>Product Images</Text>
          {renderImageGallery()}
        </Animated.View>

        {/* BASIC INFO */}
        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <View style={styles.card}>
            <DisplayField label="Product Title" value={productData.title} icon="tag" />
            <View style={styles.fieldRow}>
              <View style={styles.fieldHalf}>
                <DisplayField label="Brand" value={productData.brand} icon="award" />
              </View>
              <View style={styles.fieldHalf}>
                <DisplayField label="Model" value={productData.model} icon="cpu" />
              </View>
            </View>
            <DisplayField label="Manufacturing Year" value={productData.manufacturing_year} icon="calendar" />
            <DisplayField label="Description" value={productData.description} icon="file-text" multiline />
          </View>
        </Animated.View>

        {/* CONDITION/STATUS */}
        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <Text style={styles.sectionTitle}>Condition & Status</Text>
          <View style={styles.card}>
            <View style={styles.fieldRow}>
              <View style={styles.fieldHalf}>
                <DisplayField label="Condition" value={productData.item_condition} icon="shield-check" />
              </View>
              <View style={styles.fieldHalf}>
                <DisplayField label="Operation Status" value={productData.operation_status} icon="activity" />
              </View>
            </View>
          </View>
        </Animated.View>

        {/* PRICING */}
        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <Text style={styles.sectionTitle}>Pricing Information</Text>
          <View style={styles.card}>
            <View style={styles.fieldRow}>
              <View style={styles.fieldHalf}>
                <DisplayField label="Currency" value={productData.currency} icon="dollar-sign" />
              </View>
              <View style={styles.fieldHalf}>
                <DisplayPrice label="Price" value={productData.price} currency={productData.currency} icon="tag" />
              </View>
            </View>
          </View>
        </Animated.View>

        {/* PRODUCT TYPE (Marketplace/Auction visual) */}
        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <Text style={styles.sectionTitle}>Product Type</Text>
          <View style={styles.card}>
            <View style={styles.productTypeContainer}>
              <View style={[
                styles.productTypeButton,
                productData.product_type === 'marketplace' && styles.productTypeButtonActive,
                { marginRight: scaleWidth(12) },
              ]}>
                <Icon
                  name="shopping-bag"
                  size={18}
                  color={productData.product_type === 'marketplace' ? COLORS.primary : COLORS.textSecondary}
                  style={styles.productTypeIcon}
                />
                <View style={styles.productTypeContent}>
                  <Text style={[
                    styles.productTypeTitle,
                    productData.product_type === 'marketplace' && styles.productTypeTextActive,
                  ]}>Marketplace</Text>
                  <Text style={styles.productTypeDescription}>Sell at fixed price</Text>
                </View>
                {productData.product_type === 'marketplace' && (
                  <Icon name="check-circle" size={16} color={COLORS.primary} style={{ marginLeft: 4 }} />
                )}
              </View>
              <View style={[
                styles.productTypeButton,
                productData.product_type === 'auction' && styles.productTypeButtonActive,
              ]}>
                <Icon
                  name="zap"
                  size={18}
                  color={productData.product_type === 'auction' ? COLORS.primary : COLORS.textSecondary}
                  style={styles.productTypeIcon}
                />
                <View style={styles.productTypeContent}>
                  <Text style={[
                    styles.productTypeTitle,
                    productData.product_type === 'auction' && styles.productTypeTextActive,
                  ]}>Auction</Text>
                  <Text style={styles.productTypeDescription}>Let buyers bid</Text>
                </View>
                {productData.product_type === 'auction' && (
                  <Icon name="check-circle" size={16} color={COLORS.primary} style={{ marginLeft: 4 }} />
                )}
              </View>
            </View>
          </View>
        </Animated.View>

        {/* LOCATION & CATEGORY */}
        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <Text style={styles.sectionTitle}>Location & Category</Text>
          <View style={styles.card}>
            <DisplayField label="Category" value={productData.category} icon="list" />
            <DisplayField label="Location" value={productData.location} icon="map-pin" />
            {productData.subcategory ? (
              <DisplayField label="Sub Category" value={productData.subcategory} icon="tag" />
            ) : null}
          </View>
        </Animated.View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      <BottomNav navigation={navigation} />
      <CustomAlert {...alertConfig} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: scaleHeight(16), fontSize: scaleFont(16), color: COLORS.textSecondary, fontFamily: FONTS.medium },

  header: {
    backgroundColor: '#c0faf5',
    // paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  headerContent: { flexDirection: 'row', alignItems: 'center', padding: scaleWidth(20) },
  backButton: { padding: scaleWidth(8), marginRight: scaleWidth(10) },
  headerText: { flex: 1 },
  headerTitle: { fontSize: scaleFont(20), fontFamily: FONTS.semiBold, color: '#0d9488' },
  headerSubtitle: { fontSize: scaleFont(14), fontFamily: FONTS.regular, color: '#0d9488', marginTop: scaleHeight(2) },

  scrollContent: { paddingBottom: scaleHeight(100) },

  section: { marginTop: scaleHeight(24), paddingHorizontal: scaleWidth(20) },
  sectionTitle: { fontSize: scaleFont(18), fontFamily: FONTS.semiBold, color: COLORS.textPrimary, marginBottom: scaleHeight(16) },

  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: scaleWidth(12),
    padding: scaleWidth(20),
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: scaleHeight(16),
  },

  // Image styles
  imagePlaceholder: {
    height: scaleHeight(200),
    backgroundColor: COLORS.light,
    borderRadius: scaleWidth(12),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    marginBottom: scaleHeight(16),
  },
  placeholderText: { marginTop: scaleHeight(8), fontSize: scaleFont(14), color: COLORS.textMuted, fontFamily: FONTS.regular },
  singleImageContainer: {
    height: scaleHeight(200),
    borderRadius: scaleWidth(12),
    overflow: 'hidden',
    marginBottom: scaleHeight(16),
    backgroundColor: COLORS.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  singleImage: { width: '100%', height: '100%' },

  // (multi-image carousel)
  imageGalleryContainer: { marginBottom: scaleHeight(16) },
  mainImageContainer: {
    position: 'relative',
    height: scaleHeight(200),
    borderRadius: scaleWidth(12),
    overflow: 'hidden',
    backgroundColor: COLORS.light,
    marginBottom: scaleHeight(10),
  },
  mainImage: { width: '100%', height: '100%' },
  imageCounter: {
    position: 'absolute', top: scaleHeight(12), right: scaleWidth(12),
    backgroundColor: 'rgba(0, 0, 0, 0.7)', paddingHorizontal: scaleWidth(8), paddingVertical: scaleHeight(4), borderRadius: scaleWidth(8),
  },
  imageCounterText: { color: '#fff', fontSize: scaleFont(12), fontFamily: FONTS.medium },
  navArrow: {
    position: 'absolute', top: '50%', marginTop: -scaleHeight(20),
    width: scaleWidth(40), height: scaleWidth(40), borderRadius: scaleWidth(20),
    backgroundColor: 'rgba(0, 0, 0, 0.5)', alignItems: 'center', justifyContent: 'center',
  },
  prevArrow: { left: scaleWidth(12) },
  nextArrow: { right: scaleWidth(12) },
  thumbnailStrip: { maxHeight: scaleHeight(70) },
  thumbnailContent: { paddingHorizontal: scaleWidth(4), flexDirection: 'row' },
  thumbnailItem: {
    width: scaleWidth(60), height: scaleWidth(60), borderRadius: scaleWidth(8),
    overflow: 'hidden', marginRight: scaleWidth(8), borderWidth: 2, borderColor: 'transparent',
  },
  activeThumbnail: { borderColor: COLORS.primary },
  thumbnailImage: { width: '100%', height: '100%' },
  activeThumbnailOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(37, 99, 235, 0.5)', alignItems: 'center', justifyContent: 'center',
  },

  // Fields
  fieldContainer: { marginBottom: scaleHeight(16) },
  fieldHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: scaleHeight(8) },
  fieldLabel: { fontSize: scaleFont(14), fontFamily: FONTS.medium, color: COLORS.textPrimary, marginLeft: scaleWidth(6) },
  fieldDisplay: {
    backgroundColor: COLORS.light, paddingVertical: scaleHeight(8), paddingHorizontal: scaleWidth(12),
    borderRadius: scaleWidth(8), borderWidth: 1, borderColor: COLORS.border,
  },
  fieldText: { fontSize: scaleFont(14), fontFamily: FONTS.regular, color: COLORS.textSecondary },
  fieldTextMultiline: { minHeight: scaleHeight(60), textAlignVertical: 'top' },

  fieldRow: { flexDirection: 'row', justifyContent: 'space-between' },
  fieldHalf: { flex: 1, marginRight: scaleWidth(8) },

  priceDisplay: { backgroundColor: COLORS.light, paddingVertical: scaleHeight(8), paddingHorizontal: scaleWidth(12), borderRadius: scaleWidth(8), borderWidth: 1, borderColor: COLORS.border },
  priceText: { fontSize: scaleFont(15), fontFamily: FONTS.semiBold, color: COLORS.primary },

  productTypeContainer: { flexDirection: 'row', marginBottom: scaleHeight(8) },
  productTypeButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#e5e7eb',
    borderRadius: scaleWidth(12), backgroundColor: '#fff',
    paddingVertical: scaleHeight(12), paddingHorizontal: scaleWidth(8),
  },
  productTypeButtonActive: { borderColor: COLORS.primary, backgroundColor: '#eef2ff' },
  productTypeIcon: { marginRight: scaleWidth(10) },
  productTypeContent: { flex: 1 },
  productTypeTitle: { fontSize: scaleFont(14), color: '#6b7280', fontFamily: FONTS.medium },
  productTypeTextActive: { color: COLORS.primary },
  productTypeDescription: { fontSize: scaleFont(12), color: '#9ca3af', fontFamily: FONTS.regular },

  bottomSpacing: { height: scaleHeight(40) },
});
