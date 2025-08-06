import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  StatusBar,
  Dimensions,
  Animated,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppContext } from '../../../_customContext/AppProvider';
import BottomNav from '../../../components/BottomNavbar';
import DetailModal from '../../../components/ReviewModal';
import CustomAlert from '../../../components/CustomAlert';

import { apiService } from '../../../api/axiosConfig';
import { useCustomAlert } from '../../../hook/useCustomAlert';
import calculateMarketStats from '../../../utils/calculateMarketStats';
import EnhancedMarketAnalysis from '../../../components/EnhancedMarketAnalysis';
import { scaleFont, scaleHeight, scaleWidth } from '../../../utils/resposive';

const { width, height } = Dimensions.get('window');

// Clean, modern color palette
const COLORS = {
  primary: '#2563eb', // Clean blue
  primaryLight: '#3b82f6',
  secondary: '#10b981', // Clean green
  accent: '#8b5cf6', // Purple accent
  background: '#f8fafc',
  cardBackground: '#ffffff',
  textPrimary: '#1e293b',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  border: '#e2e8f0',
  light: '#f1f5f9',
};

// Font family constants for easy management
const FONTS = {
  regular: 'Poppins-Regular',
  medium: 'Poppins-Medium',
  semiBold: 'Poppins-SemiBold',
  bold: 'Poppins-Bold',
  light: 'Poppins-Light',
};

// Dropdown options
const CONDITIONS = [
  'New/Unused',
  'Like New',
  'Used',
  'Used, Needs Minor Repair',
];

const OPERATION_STATUS = ['Running', 'Idle', 'Down'];

const CURRENCIES = [
  'USD ($)',
  'CNY (¥)',
  'TWD (NT$)',
  'THB (฿)',
  'VND (₫)',
  'HKD (HK$)',
  'EUR (€)',
  'CAD (C$)',
  'GBP (£)',
  'AUD (A$)',
  'PKR (Rs)',
  'AED (د.إ)',
];

export default function DetailsScreen({ route, navigation }) {
  const { image, images, imageCount, analysisData, timestamp } =
    route.params || {};
  const { setShowOverlay } = useAppContext();

  const {
    alertConfig,
    hideAlert,
    showLoginRequired,
    showSuccess,
    showError,
    showConfirm,
  } = useCustomAlert();

  const selectedImages = images || (image ? [image] : []);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userToken, setUserToken] = useState(null);
  const [lastUpdateTimestamp, setLastUpdateTimestamp] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [mediaFiles, setMediaFiles] = useState([]); // Add media files state

  // Dropdown states
  const [dropdownVisible, setDropdownVisible] = useState({
    condition: false,
    operation_status: false,
    currency: false,
  });

  // Initialize fields with API response data
  const getInitialFields = () => {
    if (analysisData && analysisData.success && analysisData.data) {
      const data = analysisData.data;
      console.log(data, 'datatatatatata');
      const priceData = data.price || {};

      return {
        name: { value: data.name || 'Machine Name', editing: false },
        brand: { value: data.brand || 'Brand Name', editing: false },
        model: { value: data.model || 'Model', editing: false },
        year: { value: data.year?.toString() || '2023', editing: false },
        equipment_description: {
          value: data.equipment_description || 'Equipment description',
          editing: false,
        },
        parent_category: {
          value: data.parent_category || 'Category',
          editing: false,
        },
        condition: { value: data.condition || 'New/Unused', editing: false },
        operation_status: {
          value: data.operation_status || 'Running',
          editing: false,
        },
        currency: { value: data.currency || 'USD', editing: false },
        original_price: {
          value: priceData.original_price?.toString() || '0',
          editing: false,
        },
        reselling_price: {
          value: priceData.reselling_price?.toString() || '0',
          editing: false,
          readOnly: true,
        },
        min_reselling_price: {
          value: priceData.min_reselling_price_value?.toString() || '0',
          editing: false,
          readOnly: true,
        },
        max_reselling_price: {
          value: priceData.max_reselling_price_value?.toString() || '0',
          editing: false,
          readOnly: true,
        },
        reselling_price_value: {
          value: priceData.reselling_price_value || {},
          editing: false,
        },
        product_type: { value: 'Marketplace', editing: false },
        auction_start_date: { value: '', editing: false },
        auction_end_date: { value: '', editing: false },
        auction_start_price: { value: '0', editing: false },
        auction_group: { value: '', editing: false },
        auction_currency: { value: 'USD ($)', editing: false },
        reserve_price: { value: '', editing: false },
        item_location: { value: '', editing: false },
        sub_category: { value: '', editing: false },
        dimensions: { value: '', editing: false },
        co2_emission: { value: '', editing: false },
        product_cat: { value: '', editing: false },
        subcategory: { value: '', editing: false },
        form_type: { value: '', editing: false },
      };
    }

    return {
      name: { value: 'Desktop Computer Set', editing: false },
      brand: { value: 'Generic', editing: false },
      model: { value: 'Standard Desktop', editing: false },
      year: { value: '2023', editing: false },
      equipment_description: {
        value: 'Includes monitor, keyboard, mouse, and CPU tower.',
        editing: false,
      },
      condition: { value: 'New/Unused', editing: false },
      operation_status: { value: 'Running', editing: false },
      currency: { value: 'USD', editing: false },
      original_price: { value: '600', editing: false },
      reselling_price: { value: '450', editing: false, readOnly: true },
      min_reselling_price: { value: '450', editing: false, readOnly: true },
      max_reselling_price: { value: '550', editing: false, readOnly: true },
      reselling_price_value: { value: {}, editing: false },
      product_type: { value: 'Marketplace', editing: false },
      auction_start_date: { value: '', editing: false },
      auction_end_date: { value: '', editing: false },
      auction_start_price: { value: '0', editing: false },
      auction_group: { value: '', editing: false },
      auction_currency: { value: 'USD ($)', editing: false },
      reserve_price: { value: '', editing: false },
      item_location: { value: '', editing: false },
      sub_category: { value: '', editing: false },
      dimensions: { value: '', editing: false },
      co2_emission: { value: '', editing: false },
    };
  };

  const [fields, setFields] = useState(getInitialFields());

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (timestamp && timestamp !== lastUpdateTimestamp) {
      const newFields = getInitialFields();
      setFields(newFields);
      setLastUpdateTimestamp(timestamp);
    }
  }, [analysisData, timestamp]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      checkAuthStatus();
    });
    checkAuthStatus();
    return unsubscribe;
  }, [navigation]);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');

      if (token && isLoggedIn === 'true') {
        setUserToken(token);

        const shouldShowModal = await AsyncStorage.getItem(
          'shouldShowReviewModal',
        );
        if (shouldShowModal === 'true') {
          await AsyncStorage.removeItem('shouldShowReviewModal');
          setTimeout(() => {
            setShowReviewModal(true);
          }, 500);
        }
      } else {
        setUserToken(null);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
    }
  };

  const onEditPress = key => {
    if (fields[key]?.readOnly) {
      return;
    }

    setFields(prev => ({
      ...prev,
      [key]: { ...prev[key], editing: true },
    }));
  };

  const onBlur = key => {
    setFields(prev => ({
      ...prev,
      [key]: { ...prev[key], editing: false },
    }));
  };

  const onChangeText = (key, text) => {
    setFields(prev => ({
      ...prev,
      [key]: { ...prev[key], value: text },
    }));
  };

  // Media files handler
  const handleMediaFilesChange = files => {
    setMediaFiles(files);
  };

  // Dropdown handlers
  const toggleDropdown = fieldKey => {
    setDropdownVisible(prev => ({
      ...prev,
      [fieldKey]: !prev[fieldKey],
    }));
  };

  const selectDropdownOption = (fieldKey, value) => {
    onChangeText(fieldKey, value);
    setDropdownVisible(prev => ({
      ...prev,
      [fieldKey]: false,
    }));
  };

  const closeAllDropdowns = () => {
    setDropdownVisible({
      condition: false,
      operation_status: false,
      currency: false,
    });
  };

  const handleContinueToSubmit = async () => {
    const currentToken = await AsyncStorage.getItem('userToken');
    const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');

    if (currentToken && isLoggedIn === 'true') {
      setShowReviewModal(true);
    } else {
      await AsyncStorage.setItem('shouldShowReviewModal', 'true');

      const navigationData = {
        fromScreen: 'Details',
        screenParams: {
          image,
          images,
          imageCount,
          analysisData,
          timestamp,
        },
      };

      showLoginRequired({
        title: 'Login Required',
        message:
          "Please sign in to submit your equipment listing. You'll return to this screen after login.",
        onSignIn: () => {
          navigation.navigate('Login', navigationData);
        },
      });
    }
  };
 const handleSubmitListing = async (formType) => {
    try {
      // Ensure product_title is provided
      if (!fields.name.value) {
        Alert.alert('Validation Error', 'Product title is required');
        setIsSubmitting(false);
        return;
      }

      console.log('🚀 Starting product submission...');
      setIsSubmitting(true);

      // Process media files first
      const documents = mediaFiles.filter(
        file =>
          file.category === 'documents' && file.type === 'application/pdf',
      );

      console.log(selectedImages, 'selectedImagesselectedImagesselectedImages');

      // Create FormData object
      const formData = new FormData();

      // Add text fields to FormData
      formData.append('product_title', fields.name.value || '');
      formData.append('description', fields.equipment_description?.value || '');
      formData.append('brand', fields.brand?.value || '');
      formData.append('model', fields.model?.value || '');
      formData.append(
        'item_condition',
        fields.condition?.value || 'New/Unused',
      );
      formData.append(
        'operation_status',
        fields.operation_status?.value || 'Running',
      );
      formData.append(
        'manufacturing_year',
        fields.year?.value || new Date().getFullYear().toString(),
      );
      formData.append('price', fields.original_price?.value || '0');
      formData.append(
        'product_type',
        (fields.product_type?.value || 'Marketplace').toLowerCase(),
      );
      formData.append('form_type', formType);
      // formData.append('form_type',fields?.form_type?.value ||"save_later")
      formData.append('currency', fields.currency?.value || 'USD');

      // Handle images - Use consistent field naming
      if (selectedImages && selectedImages.length > 0) {
        for (let index = 0; index < selectedImages.length; index++) {
          const imageUri = selectedImages[index];

          if (typeof imageUri === 'string') {
            const fileExtension =
              imageUri.split('.').pop()?.toLowerCase() || 'jpg';
            const fileName = `image_${index}.${fileExtension}`;
            const mimeType = `image/${
              fileExtension === 'jpg' ? 'jpeg' : fileExtension
            }`;

            formData.append('images[]', {
              uri: imageUri,
              type: mimeType,
              name: fileName,
            });
          } else if (imageUri && imageUri.uri) {
            formData.append('images[]', {
              uri: imageUri.uri,
              type: imageUri.type || 'image/jpeg',
              name: imageUri.name || `image_${index}.jpg`,
            });
          }
        }
      }

      // Handle documents
      documents.forEach((doc, index) => {
        formData.append('documents[]', {
          uri: doc.uri,
          type: doc.type || 'application/pdf',
          name: doc.name || `document_${index}.pdf`,
        });
      });

      // Add auction-specific fields if product type is auction
      const productType = (
        fields.product_type?.value || 'Marketplace'
      ).toLowerCase();
      if (productType === 'auction') {
        formData.append(
          '_yith_auction_for',
          fields.auction_start_date?.value || '',
        );
        formData.append(
          '_yith_auction_to',
          fields.auction_end_date?.value || '',
        );
        formData.append(
          '_yith_auction_start_price',
          fields.auction_start_price?.value || '0',
        );
        formData.append('auction_group', fields.auction_group?.value || '');
        formData.append(
          '_yith_auction_reserve_price',
          fields.reserve_price?.value || '',
        );
        formData.append(
          'auction_currency',
          fields.auction_currency?.value || 'USD ($)',
        );
      }

      // Add optional fields
      if (fields.item_location?.value) {
        formData.append('item_location', fields.item_location.value);
      }
      if (fields.sub_category?.value) {
        formData.append('subcategory', fields.sub_category.value);
      }
      if (fields.parent_category?.value) {
        formData.append('category', fields.parent_category.value);
      }
      if (fields.dimensions?.value) {
        formData.append('dimensions', fields.dimensions.value);
      }
      if (fields.co2_emission?.value) {
        formData.append('co2_emission', fields.co2_emission.value);
      }

      // Add pricing analysis data if available
      if (
        fields.reselling_price_value?.value &&
        Object.keys(fields.reselling_price_value.value).length > 0
      ) {
        formData.append(
          'market_analysis',
          JSON.stringify(fields.reselling_price_value.value),
        );
        formData.append(
          'suggested_reselling_price',
          fields.reselling_price?.value || '0',
        );
        formData.append(
          'min_reselling_price',
          fields.min_reselling_price?.value || '0',
        );
        formData.append(
          'max_reselling_price',
          fields.max_reselling_price?.value || '0',
        );
      }

      // Debug: Log FormData contents (React Native specific)
      console.log('📝 FormData contents:');
      if (formData._parts) {
        formData._parts.forEach(([key, value]) => {
          console.log(
            `${key}:`,
            typeof value === 'object' && value.uri
              ? `File: ${value.name}`
              : value,
          );
        });
      }
      // console.log(formData, 'formDataformDataformDataformData');

      // Submit using the corrected saveProduct method
      const response = await apiService.submitProduct(formData);

      // console.log('✅ Submission successful:', response.data);
      setIsSubmitting(false); 

      if (response.data) {
        showSuccess({
          title: 'Success!',
          message: 'Your equipment listing has been submitted successfully.',
          buttonText: 'Continue',
          onPress: () => navigation.navigate('Dashboard'),
        });
      }
    } catch (error) {
      console.error('❌ Submission error:', error);
      setIsSubmitting(false);

      let errorMessage =
        'An error occurred while submitting your listing. Please try again.';

      // Handle specific error types
      if (error.message === 'Network Error' || error.code === 'NETWORK_ERROR') {
        errorMessage =
          'Network connection failed. Please check your internet connection and try again.';
      } else if (error.response?.status === 422) {
        const validationErrors = error.response.data?.errors;
        if (validationErrors) {
          const errorMessages = Object.values(validationErrors).flat();
          errorMessage =
            errorMessages.length > 0
              ? errorMessages.join('\n')
              : 'Please check your input data and try again.';
        }
      } else if (error.response?.status === 413) {
        errorMessage =
          'Files are too large. Please reduce file sizes and try again.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      showError({
        title: 'Submission Failed',
        message: errorMessage,
      });
    }
  };

  const renderImageGallery = () => {
    if (selectedImages.length === 0) {
      return (
        <View style={styles.imagePlaceholder}>
          <Icon name="camera" size={24} color={COLORS.textMuted} />
          <Text style={styles.placeholderText}>No Images Selected</Text>
        </View>
      );
    }

    if (selectedImages.length === 1) {
      return (
        <View style={styles.singleImageContainer}>
          <Image
            source={{ uri: selectedImages[0] }}
            style={styles.singleImage}
          />
        </View>
      );
    }

    return (
      <View style={styles.imageGalleryContainer}>
        <View style={styles.mainImageContainer}>
          <Image
            source={{ uri: selectedImages[currentImageIndex] }}
            style={styles.mainImage}
          />

          <View style={styles.imageCounter}>
            <Text style={styles.imageCounterText}>
              {currentImageIndex + 1} / {selectedImages.length}
            </Text>
          </View>

          {currentImageIndex > 0 && (
            <TouchableOpacity
              style={[styles.navArrow, styles.prevArrow]}
              onPress={() => setCurrentImageIndex(prev => prev - 1)}
            >
              <Icon name="chevron-left" size={20} color="#fff" />
            </TouchableOpacity>
          )}

          {currentImageIndex < selectedImages.length - 1 && (
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
          {selectedImages.map((imageUri, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.thumbnailItem,
                currentImageIndex === index && styles.activeThumbnail,
              ]}
              onPress={() => setCurrentImageIndex(index)}
            >
              <Image source={{ uri: imageUri }} style={styles.thumbnailImage} />
              {currentImageIndex === index && (
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

  const renderFieldInput = (key, label, icon, props = {}) => (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldHeader}>
        <Icon name={icon} size={16} color={COLORS.primary} />
        <Text style={styles.fieldLabel}>{label}</Text>
      </View>

      <View style={styles.fieldInputContainer}>
        {fields[key]?.editing ? (
          <TextInput
            style={[
              styles.fieldInput,
              styles.fieldInputEditing,
              props.multiline && styles.fieldInputMultiline,
            ]}
            value={fields[key]?.value || ''}
            onChangeText={text => onChangeText(key, text)}
            onBlur={() => onBlur(key)}
            autoFocus
            placeholder={`Enter ${label.toLowerCase()}`}
            placeholderTextColor={COLORS.textMuted}
            {...props}
          />
        ) : (
          <TouchableOpacity
            style={styles.fieldDisplay}
            onPress={() => onEditPress(key)}
          >
            <Text
              style={[
                styles.fieldText,
                props.multiline && styles.fieldTextMultiline,
              ]}
            >
              {fields[key]?.value || `Enter ${label.toLowerCase()}`}
            </Text>
            <Icon name="edit-2" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderDropdownField = (key, label, icon, options) => (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldHeader}>
        <Icon name={icon} size={16} color={COLORS.primary} />
        <Text style={styles.fieldLabel}>{label}</Text>
      </View>

      <View style={styles.fieldInputContainer}>
        <TouchableOpacity
          style={styles.fieldDisplay}
          onPress={() => toggleDropdown(key)}
        >
          <Text style={styles.fieldText}>
            {fields[key]?.value || `Select ${label.toLowerCase()}`}
          </Text>
          <Icon
            name={dropdownVisible[key] ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={COLORS.textMuted}
          />
        </TouchableOpacity>

        <Modal
          visible={dropdownVisible[key]}
          transparent={true}
          animationType="fade"
          onRequestClose={() => closeAllDropdowns()}
        >
          <TouchableOpacity
            style={styles.dropdownOverlay}
            activeOpacity={1}
            onPress={() => closeAllDropdowns()}
          >
            <View style={styles.dropdownModal}>
              <View style={styles.dropdownHeader}>
                <Text style={styles.dropdownTitle}>Select {label}</Text>
                <TouchableOpacity
                  onPress={() => closeAllDropdowns()}
                  style={styles.dropdownCloseButton}
                >
                  <Icon name="x" size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.dropdownContent}>
                {options.map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dropdownOption,
                      fields[key]?.value === option &&
                        styles.dropdownOptionSelected,
                    ]}
                    onPress={() => selectDropdownOption(key, option)}
                  >
                    <Text
                      style={[
                        styles.dropdownOptionText,
                        fields[key]?.value === option &&
                          styles.dropdownOptionTextSelected,
                      ]}
                    >
                      {option}
                    </Text>
                    {fields[key]?.value === option && (
                      <Icon name="check" size={16} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </View>
  );

  const renderPriceField = (key, label, icon, readOnly = false) => (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldHeader}>
        <Icon
          name={icon}
          size={16}
          color={readOnly ? COLORS.textMuted : COLORS.success}
        />
        <Text
          style={[
            styles.fieldLabel,
            { color: readOnly ? COLORS.textMuted : COLORS.textPrimary },
          ]}
        >
          {label}
        </Text>
        {readOnly && (
          <View style={styles.readOnlyBadge}>
            <Text style={styles.readOnlyText}>Read Only</Text>
          </View>
        )}
      </View>

      <View style={styles.priceFieldContainer}>
        {fields[key]?.editing && !readOnly ? (
          <View style={styles.priceInputWrapper}>
            <Text style={styles.currencyPrefix}>{fields.currency?.value}</Text>
            <TextInput
              style={styles.priceInput}
              value={fields[key]?.value || ''}
              onChangeText={text => {
                const numericText = text.replace(/[^0-9.]/g, '');
                onChangeText(key, numericText);
              }}
              keyboardType="decimal-pad"
              onBlur={() => onBlur(key)}
              placeholder="0.00"
              placeholderTextColor={COLORS.textMuted}
              autoFocus
            />
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.priceDisplay,
              readOnly && styles.priceDisplayReadOnly,
            ]}
            onPress={() => !readOnly && onEditPress(key)}
          >
            <Text
              style={[
                styles.priceText,
                { color: readOnly ? COLORS.textMuted : COLORS.success },
              ]}
            >
              {fields.currency?.value}{' '}
              {parseFloat(fields[key]?.value || 0).toLocaleString()}
            </Text>
            {!readOnly && (
              <Icon name="edit-2" size={16} color={COLORS.textMuted} />
            )}
            {readOnly && (
              <Icon name="lock" size={16} color={COLORS.textMuted} />
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={'#c0faf5'} />

      {/* Clean Header */}
      <View style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.navigate('Dashboard')}
            >
              <Icon name="arrow-left" size={24} color="#0d9488" />
            </TouchableOpacity>

            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Product Details</Text>
              {selectedImages.length > 1 && (
                <Text style={styles.headerSubtitle}>
                  {selectedImages.length} images analyzed
                </Text>
              )}
            </View>

            <View style={styles.authStatus}>
              <View
                style={[
                  styles.authIndicator,
                  userToken
                    ? styles.authIndicatorLoggedIn
                    : styles.authIndicatorLoggedOut,
                ]}
              >
                <Icon
                  name={userToken ? 'user-check' : 'user-x'}
                  size={16}
                  color="#fff"
                />
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Images Section */}
        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <Text style={styles.sectionTitle}>Product Images</Text>
          {renderImageGallery()}
        </Animated.View>

        {/* Basic Information */}
        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <View style={styles.card}>
            {renderFieldInput('name', 'Equipment Name', 'tag')}

            <View style={styles.fieldRow}>
              <View style={styles.fieldHalf}>
                {renderFieldInput('model', 'Model', 'cpu')}
              </View>
            </View>

            {renderFieldInput('year', 'Year', 'calendar', {
              keyboardType: 'numeric',
            })}

            {renderFieldInput(
              'equipment_description',
              'Description',
              'file-text',
              {
                multiline: true,
                numberOfLines: 3,
              },
            )}
          </View>
        </Animated.View>

        {/* Condition & Status */}
        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <Text style={styles.sectionTitle}>Condition & Status</Text>
          <View style={styles.card}>
            <View style={styles.fieldRow}>
              <View style={styles.fieldHalf}>
                {renderDropdownField(
                  'condition',
                  'Condition',
                  'shield-check',
                  CONDITIONS,
                )}
              </View>
              <View style={styles.fieldHalf}>
                {renderDropdownField(
                  'operation_status',
                  'Operation Status',
                  'activity',
                  OPERATION_STATUS,
                )}
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Pricing Information */}
        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <Text style={styles.sectionTitle}>Pricing Information</Text>
          <View style={styles.card}>
            <View style={styles.fieldRow}>
              <View style={styles.fieldHalf}>
                {renderDropdownField(
                  'currency',
                  'Currency',
                  'dollar-sign',
                  CURRENCIES,
                )}
              </View>
              <View style={styles.fieldHalf}>
                {renderPriceField('original_price', 'Price', 'tag', false)}
              </View>
            </View>
            {/* Market Analysis */}
            {fields.reselling_price_value?.value &&
              Object.keys(fields.reselling_price_value.value).length > 0 && (
                <EnhancedMarketAnalysis
                  priceData={fields.reselling_price_value.value}
                  currency={fields.currency?.value || 'USD'}
                />
              )}
          </View>
        </Animated.View>

        {/* Auth Status */}
        {!userToken && (
          <Animated.View style={[styles.authCard, { opacity: fadeAnim }]}>
            <View style={styles.authCardContent}>
              <Icon name="lock" size={20} color={COLORS.warning} />
              <View style={styles.authCardText}>
                <Text style={styles.authCardTitle}>Sign In Required</Text>
                <Text style={styles.authCardDescription}>
                  Please sign in to submit your equipment listing
                </Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Submit Button */}
        <Animated.View style={[styles.submitContainer, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              isSubmitting && styles.submitButtonDisabled,
            ]}
            onPress={handleContinueToSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Icon name="loader" size={20} color="#fff" />
                <Text style={styles.submitText}>Submitting...</Text>
              </>
            ) : (
              <>
                <Icon
                  name={userToken ? 'send' : 'log-in'}
                  size={20}
                  color="#fff"
                />
                <Text style={styles.submitText}>
                  {userToken ? 'Submit Listing' : 'Sign In & Submit'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      <BottomNav setShowOverlay={setShowOverlay} navigation={navigation} />

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

      <DetailModal
        fields={fields}
        showReviewModal={showReviewModal}
        setShowReviewModal={setShowReviewModal}
        onChangeText={onChangeText}
        handleContinueToSubmit={formType => {
          if (userToken) {
            handleSubmitListing(formType);
          }
        }}
        mediaFiles={mediaFiles}
        onMediaFilesChange={handleMediaFilesChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Header
  header: {
    backgroundColor: '#c0faf5',
    // paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(20),
    marginVertical: scaleHeight(4),
    paddingVertical: scaleHeight(3),
    gap: scaleWidth(16),
  },
  backButton: {
    padding: scaleWidth(8),
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: scaleFont(20),
    fontFamily: FONTS.semiBold,
    color: '#0d9488',
  },
  headerSubtitle: {
    fontSize: scaleFont(14),
    fontFamily: FONTS.regular,
    color: '#0d9488',
    marginTop: scaleHeight(2),
  },
  authStatus: {
    alignItems: 'center',
  },
  authIndicator: {
    width: scaleWidth(32),
    height: scaleWidth(32),
    borderRadius: scaleWidth(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  authIndicatorLoggedIn: {
    backgroundColor: COLORS.success,
  },
  authIndicatorLoggedOut: {
    backgroundColor: COLORS.warning,
  },

  // Scroll View
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: scaleHeight(100),
  },

  // Sections
  section: {
    marginTop: scaleHeight(24),
    paddingHorizontal: scaleWidth(20),
  },
  sectionTitle: {
    fontSize: scaleFont(18),
    fontFamily: FONTS.semiBold,
    color: COLORS.textPrimary,
    marginBottom: scaleHeight(16),
  },

  // Cards
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: scaleWidth(12),
    padding: scaleWidth(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scaleHeight(2) },
    shadowOpacity: 0.1,
    shadowRadius: scaleHeight(8),
    elevation: scaleHeight(3),
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  // Image Gallery
  imagePlaceholder: {
    height: scaleHeight(200),
    backgroundColor: COLORS.light,
    borderRadius: scaleWidth(12),
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleHeight(8),
    borderWidth: scaleWidth(2),
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: scaleFont(14),
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginTop: scaleHeight(8),
  },
  singleImageContainer: {
    height: scaleHeight(200),
    borderRadius: scaleWidth(12),
    overflow: 'hidden',
  },
  singleImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  imageGalleryContainer: {
    gap: scaleHeight(12),
  },
  mainImageContainer: {
    position: 'relative',
    height: scaleHeight(200),
    borderRadius: scaleWidth(12),
    overflow: 'hidden',
  },
  mainImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageCounter: {
    position: 'absolute',
    top: scaleHeight(12),
    right: scaleWidth(12),
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: scaleWidth(8),
    paddingVertical: scaleHeight(4),
    borderRadius: scaleWidth(8),
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prevArrow: {
    left: scaleWidth(12),
  },
  nextArrow: {
    right: scaleWidth(12),
  },
  thumbnailStrip: {
    maxHeight: scaleHeight(70),
  },
  thumbnailContent: {
    paddingHorizontal: scaleWidth(4),
    gap: scaleWidth(8),
  },
  thumbnailItem: {
    width: scaleWidth(60),
    height: scaleWidth(60),
    borderRadius: scaleWidth(8),
    overflow: 'hidden',
    position: 'relative',
    borderWidth: scaleWidth(2),
    borderColor: 'transparent',
  },
  activeThumbnail: {
    borderColor: COLORS.primary,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  activeThumbnailOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(37, 99, 235, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Fields
  fieldContainer: {
    marginBottom: scaleHeight(20),
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(8),
    marginBottom: scaleHeight(8),
  },
  fieldLabel: {
    fontSize: scaleFont(14),
    fontFamily: FONTS.medium,
    color: COLORS.textPrimary,
  },
  readOnlyBadge: {
    backgroundColor: COLORS.light,
    paddingHorizontal: scaleWidth(6),
    paddingVertical: scaleHeight(2),
    borderRadius: scaleWidth(4),
    marginLeft: scaleWidth(8),
  },
  readOnlyText: {
    fontSize: scaleFont(10),
    fontFamily: FONTS.medium,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  fieldInputContainer: {
    position: 'relative',
  },
  fieldDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.light,
    paddingVertical: scaleHeight(12),
    paddingHorizontal: scaleWidth(16),
    borderRadius: scaleWidth(8),
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: scaleHeight(48),
  },
  fieldText: {
    flex: 1,
    fontSize: scaleFont(14),
    fontFamily: FONTS.regular,
    color: COLORS.textPrimary,
  },
  fieldTextMultiline: {
    minHeight: scaleHeight(60),
    textAlignVertical: 'top',
  },
  fieldInput: {
    backgroundColor: COLORS.cardBackground,
    paddingVertical: scaleHeight(12),
    paddingHorizontal: scaleWidth(16),
    borderRadius: scaleWidth(8),
    fontSize: scaleFont(14),
    fontFamily: FONTS.regular,
    color: COLORS.textPrimary,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  fieldInputEditing: {
    borderColor: COLORS.primary,
  },
  fieldInputMultiline: {
    height: scaleHeight(80),
    textAlignVertical: 'top',
  },
  fieldRow: {
    flexDirection: 'column',
    gap: scaleWidth(12),
  },
  fieldHalf: {
    flex: 1,
  },

  // Dropdown
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(20),
  },
  dropdownModal: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: scaleWidth(12),
    width: '100%',
    maxWidth: scaleWidth(300),
    maxHeight: scaleHeight(400),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scaleHeight(10) },
    shadowOpacity: 0.25,
    shadowRadius: scaleHeight(20),
    elevation: scaleHeight(10),
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: scaleHeight(16),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dropdownTitle: {
    fontSize: scaleFont(16),
    fontFamily: FONTS.semiBold,
    color: COLORS.textPrimary,
  },
  dropdownCloseButton: {
    padding: scaleHeight(4),
  },
  dropdownContent: {
    maxHeight: scaleHeight(300),
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: scaleHeight(12),
    paddingHorizontal: scaleWidth(16),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light,
  },
  dropdownOptionSelected: {
    backgroundColor: COLORS.light,
  },
  dropdownOptionText: {
    fontSize: scaleFont(14),
    fontFamily: FONTS.regular,
    color: COLORS.textPrimary,
  },
  dropdownOptionTextSelected: {
    color: COLORS.primary,
    fontFamily: FONTS.medium,
  },

  // Price Fields
  priceFieldContainer: {
    position: 'relative',
  },
  priceInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: scaleWidth(8),
    borderWidth: 2,
    borderColor: COLORS.primary,
    overflow: 'hidden',
  },
  currencyPrefix: {
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(12),
    backgroundColor: COLORS.light,
    fontSize: scaleFont(14),
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
  },
  priceInput: {
    flex: 1,
    paddingVertical: scaleHeight(12),
    paddingHorizontal: scaleWidth(12),
    fontSize: scaleFont(14),
    fontFamily: FONTS.medium,
    color: COLORS.textPrimary,
  },
  priceDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.light,
    paddingVertical: scaleHeight(12),
    paddingHorizontal: scaleWidth(16),
    borderRadius: scaleWidth(8),
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  priceDisplayReadOnly: {
    backgroundColor: COLORS.light,
    borderColor: COLORS.border,
  },
  priceText: {
    flex: 1,
    fontSize: scaleFont(15),
    fontFamily: FONTS.semiBold,
  },

  // Market Analysis
  marketAnalysis: {
    marginTop: scaleHeight(16),
    backgroundColor: COLORS.light,
    borderRadius: scaleWidth(8),
    padding: scaleWidth(16),
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  marketTitle: {
    fontSize: scaleFont(15),
    fontFamily: FONTS.semiBold,
    color: COLORS.success,
  },
  marketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: scaleHeight(8),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  marketPlatformText: {
    fontSize: scaleFont(14),
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    textTransform: 'capitalize',
  },
  marketPrice: {
    fontSize: scaleFont(14),
    fontFamily: FONTS.semiBold,
    color: COLORS.success,
  },

  // Auth Card
  authCard: {
    backgroundColor: COLORS.cardBackground,
    marginHorizontal: scaleWidth(20),
    marginTop: scaleHeight(24),
    borderRadius: scaleWidth(12),
    padding: scaleWidth(20),
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scaleHeight(2) },
    shadowOpacity: 0.1,
    shadowRadius: scaleHeight(8),
    elevation: scaleHeight(3),
  },
  authCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(16),
  },
  authCardText: {
    flex: 1,
  },
  authCardTitle: {
    fontSize: scaleFont(16),
    fontFamily: FONTS.semiBold,
    color: COLORS.textPrimary,
    marginBottom: scaleHeight(4),
  },
  authCardDescription: {
    fontSize: scaleFont(14),
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },

  // Submit Button
  submitContainer: {
    marginHorizontal: scaleWidth(20),
    marginTop: scaleHeight(32),
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: scaleHeight(16),
    borderRadius: scaleWidth(12),
    gap: scaleWidth(8),
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: scaleHeight(4) },
    shadowOpacity: 0.2,
    shadowRadius: scaleHeight(8),
    elevation: scaleHeight(6),
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.textMuted,
    shadowOpacity: 0,
    elevation: 0,
  },
  submitText: {
    fontSize: scaleFont(16),
    fontFamily: FONTS.semiBold,
    color: '#fff',
  },
  bottomSpacing: {
    height: scaleHeight(32),
  },

  marketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(8),
    marginBottom: scaleHeight(16),
  },

  marketStatsContainer: {
    gap: scaleHeight(12),
  },
  marketStatRow: {
    flexDirection: 'row',
    gap: scaleWidth(12),
  },
  marketStatItem: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
    borderRadius: scaleWidth(8),
    padding: scaleHeight(12),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  marketStatLabel: {
    fontSize: scaleFont(12),
    fontFamily: FONTS.medium,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    marginBottom: scaleHeight(4),
  },
  marketStatValue: {
    fontSize: scaleFont(14),
    fontFamily: FONTS.bold,
    textAlign: 'center',
  },
  marketInfoRow: {
    alignItems: 'center',
    marginTop: scaleHeight(8),
    paddingTop: scaleHeight(12),
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  marketInfoText: {
    fontSize: scaleFont(12),
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  noDataText: {
    fontSize: scaleFont(14),
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
