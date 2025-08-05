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
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppContext } from '../../_customContext/AppProvider';
import { useCustomAlert } from '../../hook/useCustomAlert';
import { apiService } from '../../api/axiosConfig';
import { scale, scaleFont, scaleHeight, scaleWidth } from '../../utils/resposive';
import CustomDropdown from '../../components/CustomDropdown';
import DocumentsUploadComponent from '../../components/MediaUpload';
import BottomNav from '../../components/BottomNavbar';
import CustomAlert from '../../components/CustomAlert';
import CustomDateTimePicker from '../../components/CustomDateTimePicker';

const { width, height } = Dimensions.get('window');

// Clean, modern color palette
const COLORS = {
  primary: '#2563eb',
  primaryLight: '#3b82f6',
  secondary: '#10b981',
  accent: '#8b5cf6',
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

// Font family constants
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

const OPERATION_STATUS = ['Running', 'Idle', 'Down', 'Fully functional'];

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

export default function EditProductScreen({ route, navigation }) {
  const { listingId, listing } = route.params || {};
  const { setShowOverlay } = useAppContext();

  const {
    alertConfig,
    hideAlert,
    showLoginRequired,
    showSuccess,
    showError,
    showConfirm,
  } = useCustomAlert();

  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [productData, setProductData] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [mediaFiles, setMediaFiles] = useState([]);

  // Form fields state
  const [fields, setFields] = useState({});
  
  // Dropdown states
  const [dropdownVisible, setDropdownVisible] = useState({
    condition: false,
    operation_status: false,
    currency: false,
  });

  // API data states
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [auctionGroups, setAuctionGroups] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingSubCategories, setLoadingSubCategories] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [loadingAuctionGroups, setLoadingAuctionGroups] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  // Validation state
  const [validationErrors, setValidationErrors] = useState({});

  // Initialize fields with product data - FIXED mapping
  const initializeFields = (data) => {
    if (!data) return {};

    return {
      name: { value: data.title || '', editing: false },
      brand: { value: data.brand || '', editing: false },
      model: { value: data.model || '', editing: false },
      year: { value: data.manufacturing_year || '', editing: false },
      equipment_description: {
        value: data.description || '',
        editing: false,
      },
      parent_category: {
        value: data.category || '',
        editing: false,
      },
      condition: { value: data.item_condition || 'Used', editing: false },
      operation_status: {
        value: data.operation_status || 'Running',
        editing: false,
      },
      currency: { value: data.currency ? `${data.currency} ($)` : 'USD ($)', editing: false },
      original_price: {
        value: data.price || data.regular_price || '0',
        editing: false,
      },
      product_type: { value: data.product_type || 'marketplace', editing: false },
      item_location: { value: data.location || '', editing: false },
      sub_category: { value: data.subcategory || '', editing: false },
      dimensions: { value: data.dimensions || '', editing: false },
      co2_emission: { value: data.co2_emission || '', editing: false },
      // Auction fields
      auction_start_date: { value: data.auction_start_date || '', editing: false },
      auction_end_date: { value: data.auction_end_date || '', editing: false },
      auction_start_price: { value: data.auction_start_price || '0', editing: false },
      auction_group: { value: data.auction_group || '', editing: false },
      auction_currency: { value: data.currency ? `${data.currency} ($)` : 'USD ($)', editing: false },
      reserve_price: { value: data.reserve_price || '', editing: false },
    };
  };

  // Fetch product data - FIXED function
  const fetchProductData = async (id) => {
    try {
      setIsLoading(true);
      console.log('🔄 Fetching product with ID:', id);
      
      const response = await apiService.getProductById(id);
      console.log('📥 API Response:', response);
     
      if (response.data && response.data.success && response.data.data) {
        const data = response.data.data;
        console.log('✅ Product data received:', data);
        
        const initialFields = initializeFields(data);
        setFields(initialFields);
        setProductData(data);
        
        // Start animations
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start();
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('❌ Error fetching product:', error);
      showError({
        title: 'Error',
        message: 'Failed to load product data. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch additional data when component mounts
  useEffect(() => {
    fetchCategories();
    fetchLocations();
    fetchAuctionGroups();
  }, []);

  // Fetch product data on mount
  useEffect(() => {
    if (listingId) {
      fetchProductData(listingId);
    } else {
      console.error('❌ No listingId provided');
      showError({
        title: 'Error',
        message: 'No product ID provided',
      });
    }
  }, [listingId]);

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await apiService.getCategories();
      
      if (response.data) {
        const categoryList = Array.isArray(response.data)
          ? response.data
          : response.data.categories || response.data.data || [];

        const categoryOptions = categoryList.map(category => {
          if (typeof category === 'string') {
            return { name: category, id: null };
          }
          return {
            name: category.name || category.label || category.title || String(category),
            id: category.id || category.term_id || category.ID || null,
          };
        });

        setCategories(categoryOptions.length > 0 ? categoryOptions : [
          { name: 'Heavy Equipment', id: null },
          { name: 'Electronics', id: null },
          { name: 'Machinery', id: null },
          { name: 'Automotive', id: null },
          { name: 'Other', id: null },
        ]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Set default categories
      setCategories([
        { name: 'Heavy Equipment', id: null },
        { name: 'Electronics', id: null },
        { name: 'Machinery', id: null },
        { name: 'Automotive', id: null },
        { name: 'Other', id: null },
      ]);
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchLocations = async () => {
    try {
      setLoadingLocations(true);
      const response = await apiService.getLocations();
      
      if (response.data) {
        const locationList = Array.isArray(response.data)
          ? response.data
          : response.data.locations || response.data.data || [];

        const locationOptions = locationList.map(location => {
          if (typeof location === 'string') {
            return location;
          }
          return location.name || location.label || location.city || location.title || String(location);
        });

        setLocations(locationOptions.length > 0 ? locationOptions : [
          'South Korea',
          'New York, NY',
          'Los Angeles, CA',
          'Chicago, IL',
          'Other',
        ]);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
      setLocations(['South Korea', 'New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Other']);
    } finally {
      setLoadingLocations(false);
    }
  };

  const fetchAuctionGroups = async () => {
    try {
      setLoadingAuctionGroups(true);
      const response = await apiService.getAuctionGroups();
      
      if (response.data) {
        const auctionGroupList = Array.isArray(response.data)
          ? response.data
          : response.data.auction_groups || response.data.groups || response.data.data || [];

        const auctionGroupOptions = auctionGroupList.map(group => {
          if (typeof group === 'string') {
            return group;
          }
          return group.name || group.label || group.title || group.group_name || String(group);
        });

        setAuctionGroups(auctionGroupOptions.length > 0 ? auctionGroupOptions : [
          'Premium Equipment',
          'Industrial Machinery',
          'Electronics & Tech',
          'Standard Auctions',
        ]);
      }
    } catch (error) {
      console.error('Error fetching auction groups:', error);
      setAuctionGroups([
        'Premium Equipment',
        'Industrial Machinery',
        'Electronics & Tech',
        'Standard Auctions',
      ]);
    } finally {
      setLoadingAuctionGroups(false);
    }
  };

  // Field manipulation functions
  const onEditPress = key => {
    if (fields[key]?.readOnly) return;
    
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
    // Clear validation error when user starts typing
    if (validationErrors[key]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }

    setFields(prev => ({
      ...prev,
      [key]: { ...prev[key], value: text },
    }));
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

  // Validation
  const validateFields = () => {
    const errors = {};

    if (!fields.name?.value?.trim()) {
      errors.name = 'Product title is required';
    }

    if (!fields.equipment_description?.value?.trim()) {
      errors.equipment_description = 'Product description is required';
    }

    if (!fields.original_price?.value || parseFloat(fields.original_price.value) <= 0) {
      errors.original_price = 'Valid price is required';
    }

    // Auction-specific validation
    if (fields.product_type?.value === 'auction') {
      if (!fields.auction_start_date?.value) {
        errors.auction_start_date = 'Start date is required for auctions';
      }

      if (!fields.auction_end_date?.value) {
        errors.auction_end_date = 'End date is required for auctions';
      }

      if (fields.auction_start_date?.value && fields.auction_end_date?.value) {
        const startDate = new Date(fields.auction_start_date.value);
        const endDate = new Date(fields.auction_end_date.value);

        if (endDate <= startDate) {
          errors.auction_end_date = 'End date must be after start date';
        }
      }

      if (!fields.auction_start_price?.value || parseFloat(fields.auction_start_price.value) <= 0) {
        errors.auction_start_price = 'Valid starting bid price is required';
      }
    }

    return errors;
  };

  // FIXED Update product function
  const handleUpdateProduct = async () => {
    try {
      // Validate fields
      const errors = validateFields();
      setValidationErrors(errors);

      if (Object.keys(errors).length > 0) {
        showError({
          title: 'Validation Error',
          message: 'Please fix the validation errors before updating.',
        });
        return;
      }

      setIsUpdating(true);

      // Get auth token
      const userToken = await AsyncStorage.getItem('userToken');
      
      // Prepare update data - matching your API response structure
      const updateData = new FormData();
      
      // Add product ID
      updateData.append('product_id', listingId || productData?.ID);
      
      // Map form fields to API fields based on your response structure
      updateData.append('title', fields.name?.value || '');
      updateData.append('description', fields.equipment_description?.value || '');
      updateData.append('brand', fields.brand?.value || '');
      updateData.append('model', fields.model?.value || '');
      updateData.append('operation_status', fields.operation_status?.value || '');
      updateData.append('manufacturing_year', fields.year?.value || '');
      updateData.append('item_condition', fields.condition?.value || '');
      updateData.append('category', fields.parent_category?.value || '');
      updateData.append('item_location', fields.item_location?.value || '');
      updateData.append('product_type', fields.product_type?.value || 'marketplace');
      
      // Extract currency code from currency string (e.g., "USD ($)" -> "USD")
      const currencyCode = fields.currency?.value?.split(' ')[0] || 'USD';
      updateData.append('currency', currencyCode);
      updateData.append('price', fields.original_price?.value || '0');
      updateData.append('regular_price', fields.original_price?.value || '0');

      // Add subcategory if exists
      if (fields.sub_category?.value) {
        updateData.append('subcategory', fields.sub_category.value);
      }

      // Add auction-specific fields if product type is auction
      if (fields.product_type?.value === 'auction') {
        updateData.append('auction_start_date', fields.auction_start_date?.value || '');
        updateData.append('auction_end_date', fields.auction_end_date?.value || '');
        updateData.append('auction_start_price', fields.auction_start_price?.value || '0');
        updateData.append('auction_group', fields.auction_group?.value || '');
        if (fields.reserve_price?.value) {
          updateData.append('reserve_price', fields.reserve_price.value);
        }
      }

      // Add optional fields
      if (fields.dimensions?.value) {
        updateData.append('dimensions', fields.dimensions.value);
      }
      if (fields.co2_emission?.value) {
        updateData.append('co2_emission', fields.co2_emission.value);
      }

      // Handle media files if any
      if (mediaFiles && mediaFiles.length > 0) {
        mediaFiles.forEach((file, index) => {
          if (file.category === 'images') {
            updateData.append('images[]', {
              uri: file.uri,
              type: file.type || 'image/jpeg',
              name: file.name || `image_${index}.jpg`,
            });
          } else if (file.category === 'documents') {
            updateData.append('documents[]', {
              uri: file.uri,
              type: file.type || 'application/pdf',
              name: file.name || `document_${index}.pdf`,
            });
          }
        });
      }

      console.log('🔄 Updating product with ID:', listingId || productData?.ID);
      console.log('updateDataupdateData' ,updateData);

      // Call update API
      const response = await fetch('https://greenbidz.com/wp-json/greenbidz-api/v1/product/update', {
        method: 'POST',
        body: updateData,
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(userToken && {
            'Authorization': `Bearer ${userToken}`
          }),
        },
      });

      const result = await response.json();
      console.log('📥 Update response:', result);

      if (result.success || response.ok) {
        showSuccess({
          title: 'Success!',
          message: 'Product updated successfully.',
          onPress: () => {
            navigation.goBack();
          },
        });
      } else {
        throw new Error(result.message || 'Update failed');
      }

    } catch (error) {
      console.error('❌ Update error:', error);
      
      let errorMessage = 'Failed to update product. Please try again.';
      
      if (error.message === 'Network Error') {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      showError({
        title: 'Update Failed',
        message: errorMessage,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Media files handler
  const handleMediaFilesChange = (files) => {
    setMediaFiles(files);
  };

  // Render functions
  const renderImageGallery = () => {
    const images = productData?.images || [];
    
    if (images.length === 0) {
      return (
        <View style={styles.imagePlaceholder}>
          <Icon name="camera" size={24} color={COLORS.textMuted} />
          <Text style={styles.placeholderText}>No Images Available</Text>
        </View>
      );
    }

    if (images.length === 1) {
      return (
        <View style={styles.singleImageContainer}>
          <Image source={{ uri: images[0] }} style={styles.singleImage} />
        </View>
      );
    }

    return (
      <View style={styles.imageGalleryContainer}>
        <View style={styles.mainImageContainer}>
          <Image
            source={{ uri: images[currentImageIndex] }}
            style={styles.mainImage}
          />
          <View style={styles.imageCounter}>
            <Text style={styles.imageCounterText}>
              {currentImageIndex + 1} / {images.length}
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
          {images.map((imageUri, index) => (
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
        {validationErrors[key] && (
          <Text style={styles.fieldError}>*</Text>
        )}
      </View>

      <View style={styles.fieldInputContainer}>
        {fields[key]?.editing ? (
          <TextInput
            style={[
              styles.fieldInput,
              styles.fieldInputEditing,
              props.multiline && styles.fieldInputMultiline,
              validationErrors[key] && styles.fieldInputError,
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
            style={[
              styles.fieldDisplay,
              validationErrors[key] && styles.fieldDisplayError,
            ]}
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
      
      {validationErrors[key] && (
        <Text style={styles.errorText}>{validationErrors[key]}</Text>
      )}
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
                      fields[key]?.value === option && styles.dropdownOptionSelected,
                    ]}
                    onPress={() => selectDropdownOption(key, option)}
                  >
                    <Text
                      style={[
                        styles.dropdownOptionText,
                        fields[key]?.value === option && styles.dropdownOptionTextSelected,
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

  const renderPriceField = (key, label, icon) => (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldHeader}>
        <Icon name={icon} size={16} color={COLORS.success} />
        <Text style={styles.fieldLabel}>{label}</Text>
        {validationErrors[key] && (
          <Text style={styles.fieldError}>*</Text>
        )}
      </View>

      <View style={styles.priceFieldContainer}>
        {fields[key]?.editing ? (
          <View style={styles.priceInputWrapper}>
            <Text style={styles.currencyPrefix}>{fields.currency?.value}</Text>
            <TextInput
              style={[
                styles.priceInput,
                validationErrors[key] && styles.fieldInputError,
              ]}
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
              validationErrors[key] && styles.fieldDisplayError,
            ]}
            onPress={() => onEditPress(key)}
          >
            <Text style={styles.priceText}>
              {fields.currency?.value} {parseFloat(fields[key]?.value || 0).toLocaleString()}
            </Text>
            <Icon name="edit-2" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>
      
      {validationErrors[key] && (
        <Text style={styles.errorText}>{validationErrors[key]}</Text>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading product data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={'#c0faf5'} />

      {/* Header */}
      <View style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-left" size={24} color="#0d9488" />
            </TouchableOpacity>

            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Edit Product</Text>
              <Text style={styles.headerSubtitle}>
                Update your listing details
              </Text>
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleUpdateProduct}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Icon name="save" size={20} color="#fff" />
              )}
            </TouchableOpacity>
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
            {renderFieldInput('name', 'Product Title', 'tag')}

            <View style={styles.fieldRow}>
              <View style={styles.fieldHalf}>
                {renderFieldInput('brand', 'Brand', 'award')}
              </View>
              <View style={styles.fieldHalf}>
                {renderFieldInput('model', 'Model', 'cpu')}
              </View>
            </View>

            {renderFieldInput('year', 'Manufacturing Year', 'calendar', {
              keyboardType: 'numeric',
            })}

            {renderFieldInput('equipment_description', 'Description', 'file-text', {
              multiline: true,
              numberOfLines: 4,
            })}

            {renderFieldInput('dimensions', 'Dimensions (L x W x H)', 'maximize', {
              placeholder: 'e.g., 120 x 80 x 60 cm',
            })}

            {renderFieldInput('co2_emission', 'CO2 Emission (kg/year)', 'wind', {
              keyboardType: 'decimal-pad',
              placeholder: 'Enter estimated CO2 emission',
            })}
          </View>
        </Animated.View>

        {/* Condition & Status */}
        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <Text style={styles.sectionTitle}>Condition & Status</Text>
          <View style={styles.card}>
            <View style={styles.fieldRow}>
              <View style={styles.fieldHalf}>
                {renderDropdownField('condition', 'Condition', 'shield-check', CONDITIONS)}
              </View>
              <View style={styles.fieldHalf}>
                {renderDropdownField('operation_status', 'Operation Status', 'activity', OPERATION_STATUS)}
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
                {renderDropdownField('currency', 'Currency', 'dollar-sign', CURRENCIES)}
              </View>
              <View style={styles.fieldHalf}>
                {renderPriceField('original_price', 'Price', 'tag')}
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Product Type */}
        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <Text style={styles.sectionTitle}>Product Type</Text>
          <View style={styles.card}>
            <View style={styles.productTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.productTypeButton,
                  fields.product_type?.value === 'marketplace' && styles.productTypeButtonActive,
                ]}
                onPress={() => onChangeText('product_type', 'marketplace')}
              >
                <View style={[
                  styles.productTypeIcon,
                  fields.product_type?.value === 'marketplace' && styles.productTypeIconActive,
                ]}>
                  <Icon 
                    name="shopping-bag" 
                    size={18} 
                    color={fields.product_type?.value === 'marketplace' ? '#6366f1' : '#6b7280'} 
                  />
                </View>
                <View style={styles.productTypeContent}>
                  <Text style={[
                    styles.productTypeTitle,
                    fields.product_type?.value === 'marketplace' && styles.productTypeTextActive,
                  ]}>
                    Marketplace
                  </Text>
                  <Text style={styles.productTypeDescription}>Sell at fixed price</Text>
                </View>
                {fields.product_type?.value === 'marketplace' && (
                  <Icon name="check-circle" size={16} color="#6366f1" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.productTypeButton,
                  fields.product_type?.value === 'auction' && styles.productTypeButtonActive,
                ]}
                onPress={() => onChangeText('product_type', 'auction')}
              >
                <View style={[
                  styles.productTypeIcon,
                  fields.product_type?.value === 'auction' && styles.productTypeIconActive,
                ]}>
                  <Icon 
                    name="zap" 
                    size={18} 
                    color={fields.product_type?.value === 'auction' ? '#6366f1' : '#6b7280'} 
                  />
                </View>
                <View style={styles.productTypeContent}>
                  <Text style={[
                    styles.productTypeTitle,
                    fields.product_type?.value === 'auction' && styles.productTypeTextActive,
                  ]}>
                    Auction
                  </Text>
                  <Text style={styles.productTypeDescription}>Let buyers bid</Text>
                </View>
                {fields.product_type?.value === 'auction' && (
                  <Icon name="check-circle" size={16} color="#6366f1" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* Location & Category */}
        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <Text style={styles.sectionTitle}>Location & Category</Text>
          <View style={styles.card}>
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Category</Text>
              <CustomDropdown
                options={categories.map(cat => cat.name)}
                selectedValue={fields.parent_category?.value || ''}
                onSelect={(value) => {
                  onChangeText('parent_category', value);
                }}
                placeholder="Select category"
                label="Product Category"
                loading={loadingCategories}
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Location</Text>
              <CustomDropdown
                options={locations}
                selectedValue={fields.item_location?.value || ''}
                onSelect={(value) => onChangeText('item_location', value)}
                placeholder="Select location"
                label="Item Location"
                loading={loadingLocations}
              />
            </View>

            {fields.sub_category?.value && (
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Sub Category</Text>
                <View style={styles.readOnlyField}>
                  <Text style={styles.readOnlyText}>{fields.sub_category.value}</Text>
                </View>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Auction Settings - Only show if product type is Auction */}
        {fields.product_type?.value === 'auction' && (
          <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
            <Text style={styles.sectionTitle}>Auction Settings</Text>
            <View style={styles.card}>
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Auction Group</Text>
                <CustomDropdown
                  options={auctionGroups}
                  selectedValue={fields.auction_group?.value || ''}
                  onSelect={(value) => onChangeText('auction_group', value)}
                  placeholder="Select auction group"
                  label="Auction Group"
                  loading={loadingAuctionGroups}
                />
              </View>

              <View style={styles.fieldRow}>
                <View style={styles.fieldHalf}>
                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>Start Date</Text>
                    <CustomDateTimePicker
                      value={fields.auction_start_date?.value ? new Date(fields.auction_start_date.value) : null}
                      onChange={(iso) => onChangeText('auction_start_date', iso || '')}
                      textStyle={styles.datePickerText}
                    />
                    {validationErrors.auction_start_date && (
                      <Text style={styles.errorText}>{validationErrors.auction_start_date}</Text>
                    )}
                  </View>
                </View>

                <View style={styles.fieldHalf}>
                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>End Date</Text>
                    <CustomDateTimePicker
                      value={fields.auction_end_date?.value ? new Date(fields.auction_end_date.value) : null}
                      onChange={(iso) => onChangeText('auction_end_date', iso || '')}
                      textStyle={styles.datePickerText}
                    />
                    {validationErrors.auction_end_date && (
                      <Text style={styles.errorText}>{validationErrors.auction_end_date}</Text>
                    )}
                  </View>
                </View>
              </View>

              <View style={styles.fieldRow}>
                <View style={styles.fieldHalf}>
                  {renderPriceField('auction_start_price', 'Starting Bid Price', 'trending-up')}
                </View>
                <View style={styles.fieldHalf}>
                  {renderPriceField('reserve_price', 'Reserve Price (Optional)', 'shield')}
                </View>
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Auction Currency</Text>
                {renderDropdownField('auction_currency', 'Auction Currency', 'dollar-sign', CURRENCIES)}
              </View>
            </View>
          </Animated.View>
        )}

        {/* Media Upload */}
        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <Text style={styles.sectionTitle}>Additional Media & Documents</Text>
          <View style={styles.card}>
            <DocumentsUploadComponent
              onFilesSelected={handleMediaFilesChange}
              uploadedFiles={mediaFiles}
              maxFiles={10}
              allowedTypes={['documents', 'videos']}
            />
            <Text style={styles.mediaHint}>
              Upload additional documents, videos, or other supporting files for your listing.
            </Text>
          </View>
        </Animated.View>

        {/* Update Button */}
        <Animated.View style={[styles.submitContainer, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              isUpdating && styles.submitButtonDisabled,
            ]}
            onPress={handleUpdateProduct}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.submitText}>Updating...</Text>
              </>
            ) : (
              <>
                <Icon name="save" size={20} color="#fff" />
                <Text style={styles.submitText}>Update Product</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: scaleHeight(16),
    fontSize: scaleFont(16),
    color: COLORS.textSecondary,
    fontFamily: FONTS.medium,
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
    paddingVertical: scaleHeight(12),
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
  saveButton: {
    backgroundColor: '#0d9488',
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(8),
    borderRadius: scaleWidth(20),
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(8),
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
  fieldError: {
    fontSize: scaleFont(14),
    color: COLORS.error,
    fontWeight: 'bold',
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
  fieldDisplayError: {
    borderColor: COLORS.error,
    backgroundColor: '#fef2f2',
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
    borderColor: COLORS.border,
  },
  fieldInputEditing: {
    borderColor: COLORS.primary,
  },
  fieldInputError: {
    borderColor: COLORS.error,
    backgroundColor: '#fef2f2',
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
  errorText: {
    fontSize: scaleFont(12),
    color: COLORS.error,
    marginTop: scaleHeight(4),
    fontFamily: FONTS.medium,
  },

  // Read-only field
  readOnlyField: {
    backgroundColor: COLORS.light,
    paddingVertical: scaleHeight(12),
    paddingHorizontal: scaleWidth(16),
    borderRadius: scaleWidth(8),
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  readOnlyText: {
    fontSize: scaleFont(14),
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
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
  priceText: {
    flex: 1,
    fontSize: scaleFont(15),
    fontFamily: FONTS.semiBold,
    color: COLORS.success,
  },

  // Product Type Selection
  productTypeContainer: {
    gap: scaleWidth(12),
  },
  productTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(12),
    paddingVertical: scaleHeight(12),
    paddingHorizontal: scaleWidth(16),
    borderWidth: scale(1),
    borderColor: '#e5e7eb',
    borderRadius: scale(12),
    backgroundColor: '#fff',
  },
  productTypeButtonActive: {
    borderColor: '#6366f1',
    backgroundColor: '#eef2ff',
  },
  productTypeIcon: {
    width: scaleWidth(36),
    height: scaleWidth(36),
    borderRadius: scale(18),
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productTypeIconActive: {
    backgroundColor: '#ddd6fe',
  },
  productTypeContent: {
    flex: 1,
  },
  productTypeTitle: {
    fontSize: scaleFont(14),
    fontWeight: '600',
    color: '#6b7280',
    fontFamily: FONTS.medium,
  },
  productTypeTextActive: {
    color: '#6366f1',
  },
  productTypeDescription: {
    fontSize: scaleFont(12),
    color: '#9ca3af',
    marginTop: scaleHeight(2),
    fontFamily: FONTS.regular,
  },

  // Date Picker
  datePickerText: {
    fontSize: scaleFont(14),
    color: COLORS.textPrimary,
    fontFamily: FONTS.regular,
  },

  // Media Upload
  mediaHint: {
    fontSize: scaleFont(12),
    color: COLORS.textMuted,
    fontStyle: 'italic',
    marginTop: scaleHeight(8),
    textAlign: 'center',
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
});