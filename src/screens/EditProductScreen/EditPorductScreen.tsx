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
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
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

export default function EditProductScreen({ route, navigation }) {
  const { listingId, listing } = route.params || {};
  const { setShowOverlay } = useAppContext();
  const { t } = useTranslation();

  const {
    alertConfig,
    hideAlert,
    showLoginRequired,
    showSuccess,
    showError,
    showConfirm,
  } = useCustomAlert();

  // Get dropdown options based on current language
  const getConditionOptions = () => [
    t('editProduct.conditions.newUnused'),
    t('editProduct.conditions.likeNew'),
    t('editProduct.conditions.used'),
    t('editProduct.conditions.usedNeedsRepair'),
  ];

  const getOperationStatusOptions = () => [
    t('editProduct.operationStatus.running'),
    t('editProduct.operationStatus.idle'),
    t('editProduct.operationStatus.down'),
    t('editProduct.operationStatus.fullyFunctional'),
  ];

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

  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [productData, setProductData] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [mediaFiles, setMediaFiles] = useState([]);
  const [existingDocuments, setExistingDocuments] = useState([]);
  const [documentsToDelete, setDocumentsToDelete] = useState([]);

  // Form fields state
  const [fields, setFields] = useState({});
  
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

  // Helper function to format currency for display
  const formatCurrencyForDisplay = (currencyCode) => {
    if (!currencyCode) return 'USD ($)';
    
    const currencyMap = {
      'USD': 'USD ($)',
      'CNY': 'CNY (¥)',
      'TWD': 'TWD (NT$)',
      'THB': 'THB (฿)',
      'VND': 'VND (₫)',
      'HKD': 'HKD (HK$)',
      'EUR': 'EUR (€)',
      'CAD': 'CAD (C$)',
      'GBP': 'GBP (£)',
      'AUD': 'AUD (A$)',
      'PKR': 'PKR (Rs)',
      'AED': 'AED (د.إ)',
    };
    
    return currencyMap[currencyCode] || `${currencyCode} ($)`;
  };

  // Initialize fields with proper currency mapping
  const initializeFields = (data) => {
    if (!data) return {};

    // Extract existing documents from various possible sources
    let documents = [];
    
    // Handle pdf_documents array
    if (data.pdf_documents && Array.isArray(data.pdf_documents)) {
      documents = data.pdf_documents.map((url, index) => {
        // Extract filename from URL
        const urlParts = url.split('/');
        const filename = urlParts[urlParts.length - 1] || `Document_${index + 1}.pdf`;
        
        return {
          id: `pdf_${index}`,
          name: filename.replace(/\.[^/.]+$/, ""), // Remove extension for display
          filename: filename,
          url: url,
          type: 'pdf',
          size: null, // Size not provided in API
          category: 'documents'
        };
      });
    }
    
    // Also check other possible document sources
    const otherDocs = data.documents || data.attachments || data.files || [];
    if (otherDocs.length > 0) {
      const formattedOtherDocs = otherDocs.map((doc, index) => ({
        id: doc.id || `doc_${index}`,
        name: doc.name || doc.filename || `Document ${index + 1}`,
        filename: doc.filename || doc.name,
        url: doc.url || doc.src,
        type: doc.type || 'unknown',
        size: doc.size || null,
        category: 'documents'
      }));
      documents = [...documents, ...formattedOtherDocs];
    }

    console.log('📎 Extracted documents:', documents);
    setExistingDocuments(documents);

    return {
      name: { value: data.title || '', editing: false },
      brand: { value: data.brand || '', editing: false },
      model: { value: data.model || '', editing: false },
      year: { value: data.manufacturing_year?.toString() || '', editing: false },
      equipment_description: {
        value: data.description || '',
        editing: false,
      },
      parent_category: {
        value: data.category || '',
        editing: false,
      },
      condition: { value: data.item_condition || t('editProduct.conditions.used'), editing: false },
      operation_status: {
        value: data.operation_status || t('editProduct.operationStatus.running'),
        editing: false,
      },
      currency: { 
        value: formatCurrencyForDisplay(data.currency), 
        editing: false 
      },
      original_price: {
        value: (data.price || data.regular_price || '0').toString(),
        editing: false,
      },
      product_type: { value: data.product_type || 'marketplace', editing: false },
      item_location: { value: data.location || data.item_location || '', editing: false },
      sub_category: { value: data.subcategory || data.sub_category || '', editing: false },
      dimensions: { value: data.dimensions || '', editing: false },
      co2_emission: { value: data.co2_emission || '', editing: false },
      // Auction fields
      auction_start_time: { value: data.auction_start_time || '', editing: false },
      auction_end_time: { value: data.auction_end_time || '', editing: false },
      auction_start_price: { 
        value: (data.auction_start_price || '0').toString(), 
        editing: false 
      },
      auction_group: { value: data.auction_group || '', editing: false },
      auction_increment: { 
        value: (data.auction_increment || '').toString(), 
        editing: false 
      },
      auction_reserve: { 
        value: (data.auction_reserve || '').toString(), 
        editing: false 
      },
      auction_currency: { 
        value: data.product_type === 'auction' ? formatCurrencyForDisplay(data.currency) : 'USD ($)', 
        editing: false 
      },
      reserve_price: { 
        value: data.reserve_price ? data.reserve_price.toString() : '', 
        editing: false 
      },
      // Documents field for display
      documents: { 
        value: documents.length > 0 ? t('editProduct.documents.currentDocuments', { count: documents.length }) : t('editProduct.documents.noExistingDocuments'), 
        editing: false,
        readOnly: true 
      },
    };
  };

  // Fetch product data with better error handling and field mapping
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

        // Fetch subcategories if category exists
        if (data.category) {
          fetchSubCategories(data.category);
        }

        // Set selected category ID for subcategory fetching
        const categoryId = categories.find(cat => cat.name === data.category)?.id;
        setSelectedCategoryId(categoryId);
        
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
        title: t('editProduct.messages.loadError'),
        message: t('editProduct.messages.loadErrorMessage'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add subcategory fetching function
  const fetchSubCategories = async (categoryName) => {
    try {
      setLoadingSubCategories(true);
      
      // Find category ID from name
      const category = categories.find(cat => cat.name === categoryName);
      if (!category || !category.id) {
        setSubCategories([]);
        return;
      }

      const response = await apiService.getSubCategories(category.id);
      
      if (response.data) {
        const subCategoryList = Array.isArray(response.data)
          ? response.data
          : response.data.subcategories || response.data.data || [];

        const subCategoryOptions = subCategoryList.map(subCat => {
          if (typeof subCat === 'string') {
            return subCat;
          }
          return subCat.name || subCat.label || subCat.title || String(subCat);
        });

        setSubCategories(subCategoryOptions);
      }
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      setSubCategories([]);
    } finally {
      setLoadingSubCategories(false);
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
        title: t('editProduct.messages.loadError'),
        message: t('editProduct.messages.noProductId'),
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

    // Handle category change to fetch subcategories
    if (key === 'parent_category') {
      const selectedCategory = categories.find(cat => cat.name === text);
      setSelectedCategoryId(selectedCategory?.id || null);
      
      // Clear subcategory when category changes
      setFields(prevFields => ({
        ...prevFields,
        sub_category: { ...prevFields.sub_category, value: '' },
      }));
      
      // Fetch subcategories for new category
      if (selectedCategory && selectedCategory.id) {
        fetchSubCategories(text);
      } else {
        setSubCategories([]);
      }
    }
  };

  // Validation
  const validateFields = () => {
    const errors = {};

    if (!fields.name?.value?.trim()) {
      errors.name = t('editProduct.validation.productTitleRequired');
    }

    if (!fields.equipment_description?.value?.trim()) {
      errors.equipment_description = t('editProduct.validation.descriptionRequired');
    }

    // Auction-specific validation
    if (fields.product_type?.value === 'auction') {
      if (!fields.auction_start_time?.value) {
        errors.auction_start_time = t('editProduct.validation.startDateRequired');
      }

      if (!fields.auction_end_time?.value) {
        errors.auction_end_time = t('editProduct.validation.endDateRequired');
      }

      if (fields.auction_start_time?.value && fields.auction_end_time?.value) {
        const startDate = new Date(fields.auction_start_time.value);
        const endDate = new Date(fields.auction_end_time.value);
        if (endDate <= startDate) {
          errors.auction_end_time = t('editProduct.validation.endDateAfterStart');
        }
      }

      if (!fields.auction_start_price?.value || parseFloat(fields.auction_start_price.value) <= 0) {
        errors.auction_start_price = t('editProduct.validation.validStartingPriceRequired');
      }
    }

    return errors;
  };

  // Enhanced handleUpdateProduct function with better document handling
  const handleUpdateProduct = async () => {
    try {
      // Validate fields
      const errors = validateFields();
      setValidationErrors(errors);

      if (Object.keys(errors).length > 0) {
        showError({
          title: t('editProduct.validation.validationError'),
          message: t('editProduct.validation.fixValidationErrors'),
        });
        return;
      }

      setIsUpdating(true);

      // Get auth token
      const userToken = await AsyncStorage.getItem('userToken');
      
      // Prepare update data
      const updateData = new FormData();
      
      // Add product ID
      updateData.append('product_id', listingId || productData?.ID);
      
      // Helper function to extract currency code
      const extractCurrencyCode = (currencyString) => {
        if (!currencyString) return 'USD';
        return currencyString.split(' ')[0] || 'USD';
      };

      // Map form fields to API fields
      updateData.append('title', fields.name?.value?.trim() || '');
      updateData.append('description', fields.equipment_description?.value?.trim() || '');
      updateData.append('brand', fields.brand?.value?.trim() || '');
      updateData.append('model', fields.model?.value?.trim() || '');
      updateData.append('operation_status', fields.operation_status?.value || '');
      updateData.append('manufacturing_year', fields.year?.value || '');
      updateData.append('item_condition', fields.condition?.value || '');
      updateData.append('category', fields.parent_category?.value || '');
      updateData.append('item_location', fields.item_location?.value || '');
      updateData.append('product_type', fields.product_type?.value || 'marketplace');
      
      // Currency and price
      const currencyCode = extractCurrencyCode(fields.currency?.value);
      updateData.append('currency', currencyCode);
      updateData.append('price', fields.original_price?.value || '0');
      updateData.append('regular_price', fields.original_price?.value || '0');

      // Add subcategory properly
      if (fields.sub_category?.value) {
        updateData.append('subcategory', fields.sub_category.value);
      }

      // Add auction-specific fields if product type is auction
      if (fields.product_type?.value === 'auction') {
        updateData.append('_yith_auction_for', fields.auction_start_time?.value || '');
        updateData.append('_yith_auction_to', fields.auction_end_time?.value || '');
        updateData.append('_yith_auction_start_price', fields.auction_start_price?.value || '0');
        updateData.append('auction_group', fields.auction_group?.value || '');
        
        // Add auction increment if provided
        if (fields.auction_increment?.value) {
          updateData.append('_yith_auction_minimum_increment_amount', fields.auction_increment.value);
        }
        
        // Add auction reserve if provided
        if (fields.auction_reserve?.value) {
          updateData.append('_yith_auction_reserve_price', fields.auction_reserve.value);
        }
        
        // Use auction_currency for auction items
        const auctionCurrencyCode = extractCurrencyCode(fields.auction_currency?.value);
        updateData.append('auction_currency', auctionCurrencyCode);
        
        // Legacy support for reserve_price field
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

      // Enhanced document handling
      console.log('📎 Processing documents:', {
        existing: existingDocuments,
        new: mediaFiles,
        toDelete: documentsToDelete
      });

      // Add documents to delete (if any)
      if (documentsToDelete.length > 0) {
        updateData.append('documents', "null");
      }

      // Handle new document uploads
      if (mediaFiles && mediaFiles.length > 0) {
        let documentIndex = 0;
        let videoIndex = 0;
        
        mediaFiles.forEach((file, index) => {
          console.log(`📎 Processing file ${index + 1}:`, {
            name: file.name,
            type: file.type,
            category: file.category,
            size: file.size
          });

          if (file.category === 'images') {
            updateData.append('images[]', {
              uri: file.uri,
              type: file.type || 'image/jpeg',
              name: file.name || `image_${index}.jpg`,
            });
          } else if (file.category === 'documents') {
            updateData.append(`pdf_documents[${documentIndex}]`, {
              uri: file.uri,
              type: file.type || 'application/pdf',
              name: file.name || `document_${documentIndex}.pdf`,
            });
            // Also add to generic documents for backward compatibility
            updateData.append(`documents[${documentIndex}]`, {
              uri: file.uri,
              type: file.type || 'application/pdf',
              name: file.name || `document_${documentIndex}.pdf`,
            });
            documentIndex++;
          } else if (file.category === 'videos') {
            updateData.append(`videos[${videoIndex}]`, {
              uri: file.uri,
              type: file.type || 'video/mp4',
              name: file.name || `video_${videoIndex}.mp4`,
            });
            videoIndex++;
          }
        });

        // Add file counts for server processing
        updateData.append('document_count', documentIndex.toString());
        updateData.append('video_count', videoIndex.toString());
      }

      console.log('🔄 Updating product with documents...' , updateData);

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
          title: t('editProduct.messages.updateSuccess'),
          message: t('editProduct.messages.updateSuccessMessage'),
          onPress: () => {
            navigation.goBack();
          },
        });
      } else {
        throw new Error(result.message || 'Update failed');
      }

    } catch (error) {
      console.error('❌ Update error:', error);
      
      let errorMessage = t('editProduct.messages.updateFailedMessage');
      
      if (error.message === 'Network Error') {
        errorMessage = t('editProduct.messages.networkError');
      } else if (error.message.includes('file')) {
        errorMessage = t('editProduct.messages.fileUploadError');
      } else if (error.message) {
        errorMessage = error.message;
      }

      showError({
        title: t('editProduct.messages.updateFailed'),
        message: errorMessage,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Enhanced media files handler with validation
  const handleMediaFilesChange = (files) => {
    console.log('📎 Media files changed:', files);
    
    // Validate file types and sizes
    const validFiles = files.filter(file => {
      const maxSize = file.category === 'videos' ? 100 * 1024 * 1024 : 10 * 1024 * 1024; // 100MB for videos, 10MB for documents
      
      if (file.size > maxSize) {
        const maxSizeText = file.category === 'videos' ? '100MB' : '10MB';
        showError({
          title: t('editProduct.messages.fileTooLarge'),
          message: t('editProduct.messages.fileTooLargeMessage', { fileName: file.name, maxSize: maxSizeText }),
        });
        return false;
      }
      
      return true;
    });
    
    setMediaFiles(validFiles);
  };

  // Function to handle existing document deletion
  const handleDeleteExistingDocument = (documentId, documentName) => {
    showConfirm({
      title: t('editProduct.documents.deleteDocument'),
      message: t('editProduct.documents.deleteConfirmMessage', { name: documentName }),
      onConfirm: () => {
        setDocumentsToDelete(prev => [...prev, documentId]);
        setExistingDocuments(prev => prev.filter(doc => doc.id !== documentId));
        
        showSuccess({
          title: t('editProduct.documents.documentMarkedForDeletion'),
          message: t('editProduct.documents.documentWillBeRemoved'),
        });
      },
    });
  };

  // Enhanced existing documents display component
  const renderExistingDocuments = () => {
    if (existingDocuments.length === 0) {
      return (
        <View style={styles.noDocumentsContainer}>
          <Icon name="file" size={24} color={COLORS.textMuted} />
          <Text style={styles.noDocumentsText}>{t('editProduct.documents.noExistingDocuments')}</Text>
        </View>
      );
    }

    return (
      <View style={styles.existingDocumentsContainer}>
        <Text style={styles.existingDocumentsTitle}>
          {t('editProduct.documents.currentDocuments', { count: existingDocuments.length })}
        </Text>
        {existingDocuments.map((doc, index) => {
          const isMarkedForDeletion = documentsToDelete.includes(doc.id);
          
          return (
            <View 
              key={doc.id || index} 
              style={[
                styles.existingDocumentItem,
                isMarkedForDeletion && styles.documentMarkedForDeletion
              ]}
            >
              <View style={styles.documentInfo}>
                <Icon 
                  name={doc.type === 'pdf' ? 'file-text' : 'file'} 
                  size={16} 
                  color={isMarkedForDeletion ? COLORS.textMuted : COLORS.primary} 
                />
                <View style={styles.documentDetails}>
                  <Text 
                    style={[
                      styles.documentName,
                      isMarkedForDeletion && styles.documentNameDeleted
                    ]} 
                    numberOfLines={1}
                  >
                    {doc.name || doc.filename || `Document ${index + 1}`}
                  </Text>
                  <Text style={styles.documentSize}>
                    {doc.type?.toUpperCase() || 'PDF'} • {doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : 'Unknown size'}
                  </Text>
                  {isMarkedForDeletion && (
                    <Text style={styles.deletionStatus}>{t('editProduct.documents.markedForDeletion')}</Text>
                  )}
                </View>
              </View>
              <View style={styles.documentActions}>
                <TouchableOpacity
                  style={[
                    styles.documentActionButton,
                    isMarkedForDeletion && styles.documentActionDisabled
                  ]}
                  onPress={() => {
                    // Open document in browser or download
                    if (doc.url && !isMarkedForDeletion) {
                      Linking.openURL(doc.url);
                    }
                  }}
                  disabled={isMarkedForDeletion}
                >
                  <Icon 
                    name="external-link" 
                    size={14} 
                    color={isMarkedForDeletion ? COLORS.textMuted : COLORS.primary} 
                  />
                </TouchableOpacity>
                {isMarkedForDeletion ? (
                  <TouchableOpacity
                    style={[styles.documentActionButton, styles.undoButton]}
                    onPress={() => {
                      // Undo deletion
                      setDocumentsToDelete(prev => prev.filter(id => id !== doc.id));
                    }}
                  >
                    <Icon name="rotate-ccw" size={14} color={COLORS.warning} />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.documentActionButton, styles.deleteButton]}
                    onPress={() => handleDeleteExistingDocument(doc.id, doc.name || doc.filename)}
                  >
                    <Icon name="trash-2" size={14} color={COLORS.error} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  // Render functions
  const renderImageGallery = () => {
    const images = productData?.images || [];
    
    if (images.length === 0) {
      return (
        <View style={styles.imagePlaceholder}>
          <Icon name="camera" size={24} color={COLORS.textMuted} />
          <Text style={styles.placeholderText}>{t('editProduct.images.noImagesAvailable')}</Text>
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
            placeholder={props.placeholder || `${t('editProduct.placeholders.enterProductTitle').replace('product title', label.toLowerCase())}`}
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
              {fields[key]?.value || `${t('editProduct.placeholders.enterProductTitle').replace('product title', label.toLowerCase())}`}
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

  const renderPriceField = (key, label, icon) => {
    // Determine which currency to use based on field type and product type
    const getCurrencyForField = (fieldKey) => {
      if (fields.product_type?.value === 'auction') {
        // For auction items, use auction_currency for auction-related fields
        if (fieldKey.includes('auction') || fieldKey === 'reserve_price') {
          return fields.auction_currency?.value || fields.currency?.value || 'USD ($)';
        }
      }
      // For marketplace items or non-auction fields, use regular currency
      return fields.currency?.value || 'USD ($)';
    };

    const currentCurrency = getCurrencyForField(key);

    return (
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
              <Text style={styles.currencyPrefix}>
                {currentCurrency}
              </Text>
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
                placeholder={t('editProduct.placeholders.enterPrice')}
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
                {currentCurrency} {parseFloat(fields[key]?.value || 0).toLocaleString()}
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
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>{t('editProduct.loadingProduct')}</Text>
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
              <Text style={styles.headerTitle}>{t('editProduct.title')}</Text>
              <Text style={styles.headerSubtitle}>
                {t('editProduct.subtitle')}
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
          <Text style={styles.sectionTitle}>{t('editProduct.sections.productImages')}</Text>
          {renderImageGallery()}
        </Animated.View>

        {/* Basic Information */}
        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <Text style={styles.sectionTitle}>{t('editProduct.sections.basicInformation')}</Text>
          <View style={styles.card}>
            {renderFieldInput('name', t('editProduct.fields.productTitle'), 'tag', {
              placeholder: t('editProduct.placeholders.enterProductTitle')
            })}

            <View style={styles.fieldRow}>
              <View style={styles.fieldHalf}>
                {renderFieldInput('brand', t('editProduct.fields.brand'), 'award', {
                  placeholder: t('editProduct.placeholders.enterBrand')
                })}
              </View>
              <View style={styles.fieldHalf}>
                {renderFieldInput('model', t('editProduct.fields.model'), 'cpu', {
                  placeholder: t('editProduct.placeholders.enterModel')
                })}
              </View>
            </View>

            {renderFieldInput('year', t('editProduct.fields.manufacturingYear'), 'calendar', {
              keyboardType: 'numeric',
              placeholder: t('editProduct.placeholders.enterYear')
            })}

            {renderFieldInput('equipment_description', t('editProduct.fields.description'), 'file-text', {
              multiline: true,
              numberOfLines: 4,
              placeholder: t('editProduct.placeholders.enterDescription')
            })}

            {renderFieldInput('dimensions', t('editProduct.fields.dimensions'), 'maximize', {
              placeholder: t('editProduct.placeholders.enterDimensions'),
            })}

            {renderFieldInput('co2_emission', t('editProduct.fields.co2Emission'), 'wind', {
              keyboardType: 'decimal-pad',
              placeholder: t('editProduct.placeholders.enterCO2Emission'),
            })}
          </View>
        </Animated.View>

        {/* Condition & Status */}
        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <Text style={styles.sectionTitle}>{t('editProduct.sections.conditionStatus')}</Text>
          <View style={styles.card}>
            <View style={styles.fieldRow}>
              <View style={styles.fieldHalf}>
                <View style={styles.fieldContainer}>
                  <View style={styles.fieldHeader}>
                    <Icon name="shield-check" size={16} color={COLORS.primary} />
                    <Text style={styles.fieldLabel}>{t('editProduct.fields.condition')}</Text>
                  </View>
                  <CustomDropdown
                    options={getConditionOptions()}
                    selectedValue={fields.condition?.value || ''}
                    onSelect={(value) => onChangeText('condition', value)}
                    placeholder={t('editProduct.placeholders.selectCondition')}
                    label={t('editProduct.fields.condition')}
                  />
                </View>
              </View>
              <View style={styles.fieldHalf}>
                <View style={styles.fieldContainer}>
                  <View style={styles.fieldHeader}>
                    <Icon name="activity" size={16} color={COLORS.primary} />
                    <Text style={styles.fieldLabel}>{t('editProduct.fields.operationStatus')}</Text>
                  </View>
                  <CustomDropdown
                    options={getOperationStatusOptions()}
                    selectedValue={fields.operation_status?.value || ''}
                    onSelect={(value) => onChangeText('operation_status', value)}
                    placeholder={t('editProduct.placeholders.selectOperationStatus')}
                    label={t('editProduct.fields.operationStatus')}
                  />
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Pricing Information - Only show for marketplace products */}
        {fields.product_type?.value !== 'auction' && (
          <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
            <Text style={styles.sectionTitle}>{t('editProduct.sections.pricingInformation')}</Text>
            <View style={styles.card}>
              <View style={styles.fieldRow}>
                <View style={styles.fieldHalf}>
                  <View style={styles.fieldContainer}>
                    <View style={styles.fieldHeader}>
                      <Icon name="dollar-sign" size={16} color={COLORS.primary} />
                      <Text style={styles.fieldLabel}>{t('editProduct.fields.currency')}</Text>
                    </View>
                    <CustomDropdown
                      options={CURRENCIES}
                      selectedValue={fields.currency?.value || ''}
                      onSelect={(value) => onChangeText('currency', value)}
                      placeholder={t('editProduct.placeholders.selectCurrency')}
                      label={t('editProduct.fields.currency')}
                    />
                  </View>
                </View>
                <View style={styles.fieldHalf}>
                  {renderPriceField('original_price', t('editProduct.fields.price'), 'tag')}
                </View>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Product Type */}
        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <Text style={styles.sectionTitle}>{t('editProduct.sections.productType')}</Text>
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
                    {t('editProduct.productTypes.marketplace')}
                  </Text>
                  <Text style={styles.productTypeDescription}>{t('editProduct.productTypes.marketplaceDesc')}</Text>
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
                    {t('editProduct.productTypes.auction')}
                  </Text>
                  <Text style={styles.productTypeDescription}>{t('editProduct.productTypes.auctionDesc')}</Text>
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
          <Text style={styles.sectionTitle}>{t('editProduct.sections.locationCategory')}</Text>
          <View style={styles.card}>
            <View style={styles.fieldContainer}>
              <View style={styles.fieldHeader}>
                <Icon name="list" size={16} color={COLORS.primary} />
                <Text style={styles.fieldLabel}>{t('editProduct.fields.category')}</Text>
              </View>
              <CustomDropdown
                options={categories.map(cat => cat.name)}
                selectedValue={fields.parent_category?.value || ''}
                onSelect={(value) => {
                  onChangeText('parent_category', value);
                }}
                placeholder={t('editProduct.placeholders.selectCategory')}
                label={t('editProduct.fields.category')}
                loading={loadingCategories}
              />
            </View>

            {/* Subcategory dropdown with proper conditional rendering */}
            <View style={styles.fieldContainer}>
              <View style={styles.fieldHeader}>
                <Icon name="tag" size={16} color={COLORS.primary} />
                <Text style={styles.fieldLabel}>{t('editProduct.fields.subCategory')}</Text>
              </View>
              <CustomDropdown
                options={subCategories}
                selectedValue={fields.sub_category?.value || ''}
                onSelect={(value) => onChangeText('sub_category', value)}
                placeholder={t('editProduct.placeholders.selectSubcategory')}
                label={t('editProduct.fields.subCategory')}
                loading={loadingSubCategories}
              />
            </View>

            <View style={styles.fieldContainer}>
              <View style={styles.fieldHeader}>
                <Icon name="map-pin" size={16} color={COLORS.primary} />
                <Text style={styles.fieldLabel}>{t('editProduct.fields.location')}</Text>
              </View>
              <CustomDropdown
                options={locations}
                selectedValue={fields.item_location?.value || ''}
                onSelect={(value) => onChangeText('item_location', value)}
                placeholder={t('editProduct.placeholders.selectLocation')}
                label={t('editProduct.fields.location')}
                loading={loadingLocations}
              />
            </View>
          </View>
        </Animated.View>

        {/* Auction Settings - Only show if product type is Auction */}
        {fields.product_type?.value === 'auction' && (
          <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
            <Text style={styles.sectionTitle}>{t('editProduct.sections.auctionSettings')}</Text>
            <View style={styles.card}>
              <View style={styles.fieldContainer}>
                <View style={styles.fieldHeader}>
                  <Icon name="users" size={16} color={COLORS.primary} />
                  <Text style={styles.fieldLabel}>{t('editProduct.fields.auctionGroup')}</Text>
                </View>
                <CustomDropdown
                  options={auctionGroups}
                  selectedValue={fields.auction_group?.value || ''}
                  onSelect={(value) => onChangeText('auction_group', value)}
                  placeholder={t('editProduct.placeholders.selectAuctionGroup')}
                  label={t('editProduct.fields.auctionGroup')}
                  loading={loadingAuctionGroups}
                />
              </View>

              <View style={styles.fieldRow}>
                <View style={styles.fieldHalf}>
                  <View style={styles.fieldContainer}>
                    <View style={styles.fieldHeader}>
                      <Icon name="calendar" size={16} color={COLORS.primary} />
                      <Text style={styles.fieldLabel}>{t('editProduct.fields.endDate')}</Text>
                    </View>
                    <CustomDateTimePicker
                      value={fields.auction_end_time?.value ? new Date(fields.auction_end_time.value) : null}
                      onChange={(iso) => onChangeText('auction_end_time', iso || '')}
                      textStyle={styles.datePickerText}
                    />
                    {validationErrors.auction_end_time && (
                      <Text style={styles.errorText}>{validationErrors.auction_end_time}</Text>
                    )}
                  </View>
                </View>
              </View>

              {/* Auction Currency dropdown */}
              <View style={styles.fieldContainer}>
                <View style={styles.fieldHeader}>
                  <Icon name="dollar-sign" size={16} color={COLORS.warning} />
                  <Text style={styles.fieldLabel}>{t('editProduct.fields.auctionCurrency')}</Text>
                </View>
                <CustomDropdown
                  options={CURRENCIES}
                  selectedValue={
                    fields.auction_currency?.value ||
                    fields.currency?.value ||
                    'USD ($)'
                  }
                  onSelect={(value) => onChangeText('auction_currency', value)}
                  placeholder={t('editProduct.placeholders.selectCurrency')}
                  label={t('editProduct.fields.auctionCurrency')}
                  hasError={!!validationErrors.auction_currency}
                />
                {fields.currency?.value && (
                  <Text style={styles.currencyInfo}>
                    {t('editProduct.messages.currencyBasedOn', { currency: fields.currency.value })}
                  </Text>
                )}
                {validationErrors.auction_currency && (
                  <Text style={styles.errorText}>{validationErrors.auction_currency}</Text>
                )}
              </View>

              <View style={styles.fieldRow}>
                <View style={styles.fieldHalf}>
                  {renderPriceField('auction_start_price', t('editProduct.fields.startingBidPrice'), 'play-circle')}
                </View>
                <View style={styles.fieldHalf}>
                  {renderPriceField('auction_reserve', t('editProduct.fields.reservePrice'), 'shield')}
                </View>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Documents & Media Upload */}
        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <Text style={styles.sectionTitle}>{t('editProduct.sections.documentsMedia')}</Text>
          <View style={styles.card}>
            {/* Show existing documents */}
            {renderExistingDocuments()}
            
            {/* Document upload component */}
            <DocumentsUploadComponent
              onFilesSelected={handleMediaFilesChange}
              uploadedFiles={mediaFiles}
              maxFiles={10}
              allowedTypes={['documents', 'videos']}
              acceptedFormats={{
                documents: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt'],
                videos: ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm']
              }}
              is_editing={true}
            />
            
            <Text style={styles.mediaHint}>
              {t('editProduct.documents.uploadHint')}
            </Text>
            
            {/* Show upload progress or status */}
            {mediaFiles.length > 0 && (
              <View style={styles.uploadSummary}>
                <Text style={styles.uploadSummaryText}>
                  {t('editProduct.documents.newFilesReady', { count: mediaFiles.length })}
                </Text>
              </View>
            )}
            
            {documentsToDelete.length > 0 && (
              <View style={styles.deleteSummary}>
                <Text style={styles.deleteSummaryText}>
                  {t('editProduct.documents.documentsMarkedForDeletion', { count: documentsToDelete.length })}
                </Text>
              </View>
            )}
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
                <Text style={styles.submitText}>{t('editProduct.updating')}</Text>
              </>
            ) : (
              <>
                <Icon name="save" size={20} color="#fff" />
                <Text style={styles.submitText}>{t('editProduct.updateProduct')}</Text>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    borderRadius: scaleWidth(20),
    backgroundColor: 'rgba(255,255,255,0.2)',
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
    shadowColor: '#0d9488',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
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
    borderRadius: scaleWidth(16),
    padding: scaleWidth(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scaleHeight(4) },
    shadowOpacity: 0.08,
    shadowRadius: scaleHeight(8),
    elevation: scaleHeight(4),
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
    borderRadius: scaleWidth(12),
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
    borderRadius: scaleWidth(12),
    fontSize: scaleFont(14),
    fontFamily: FONTS.regular,
    color: COLORS.textPrimary,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  fieldInputEditing: {
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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

  // Price Fields
  priceFieldContainer: {
    position: 'relative',
  },
  priceInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: scaleWidth(12),
    borderWidth: 2,
    borderColor: COLORS.primary,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
    backgroundColor: '#f0fdf4',
    paddingVertical: scaleHeight(12),
    paddingHorizontal: scaleWidth(16),
    borderRadius: scaleWidth(12),
    borderWidth: 1,
    borderColor: '#bbf7d0',
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
    paddingVertical: scaleHeight(16),
    paddingHorizontal: scaleWidth(16),
    borderWidth: scale(2),
    borderColor: '#e5e7eb',
    borderRadius: scale(16),
    backgroundColor: '#fff',
  },
  productTypeButtonActive: {
    borderColor: '#6366f1',
    backgroundColor: '#eef2ff',
  },
  productTypeIcon: {
    width: scaleWidth(40),
    height: scaleWidth(40),
    borderRadius: scale(20),
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
    fontSize: scaleFont(15),
    fontWeight: '600',
    color: '#6b7280',
    fontFamily: FONTS.medium,
  },
  productTypeTextActive: {
    color: '#6366f1',
    fontFamily: FONTS.semiBold,
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

  // Currency Info
  currencyInfo: {
    fontSize: scaleFont(12),
    color: COLORS.textMuted,
    fontStyle: 'italic',
    marginTop: scaleHeight(4),
    fontFamily: FONTS.regular,
  },

  // Document Management Styles
  noDocumentsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scaleHeight(32),
    backgroundColor: COLORS.light,
    borderRadius: scaleWidth(12),
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    marginBottom: scaleHeight(16),
  },
  noDocumentsText: {
    fontSize: scaleFont(14),
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
    marginTop: scaleHeight(8),
  },
  existingDocumentsContainer: {
    marginBottom: scaleHeight(16),
  },
  existingDocumentsTitle: {
    fontSize: scaleFont(14),
    fontFamily: FONTS.medium,
    color: COLORS.textPrimary,
    marginBottom: scaleHeight(12),
  },
  existingDocumentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: scaleHeight(12),
    paddingHorizontal: scaleWidth(16),
    backgroundColor: COLORS.light,
    borderRadius: scaleWidth(8),
    marginBottom: scaleHeight(8),
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  documentMarkedForDeletion: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
    opacity: 0.7,
  },
  documentInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(12),
  },
  documentDetails: {
    flex: 1,
  },
  documentName: {
    fontSize: scaleFont(13),
    fontFamily: FONTS.medium,
    color: COLORS.textPrimary,
  },
  documentNameDeleted: {
    textDecorationLine: 'line-through',
    color: COLORS.textMuted,
  },
  documentSize: {
    fontSize: scaleFont(11),
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginTop: scaleHeight(2),
  },
  deletionStatus: {
    fontSize: scaleFont(10),
    fontFamily: FONTS.medium,
    color: COLORS.error,
    marginTop: scaleHeight(2),
  },
  documentActions: {
    flexDirection: 'row',
    gap: scaleWidth(8),
  },
  documentActionButton: {
    padding: scaleWidth(8),
    borderRadius: scaleWidth(6),
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  documentActionDisabled: {
    opacity: 0.5,
  },
  deleteButton: {
    borderColor: COLORS.error,
    backgroundColor: '#fef2f2',
  },
  undoButton: {
    borderColor: COLORS.warning,
    backgroundColor: '#fefbf2',
  },

  // Upload Status
  uploadSummary: {
    marginTop: scaleHeight(12),
    padding: scaleWidth(12),
    backgroundColor: '#f0f9ff',
    borderRadius: scaleWidth(8),
    borderWidth: 1,
    borderColor: '#0ea5e9',
  },
  uploadSummaryText: {
    fontSize: scaleFont(12),
    color: '#0369a1',
    fontFamily: FONTS.medium,
    textAlign: 'center',
  },
  deleteSummary: {
    marginTop: scaleHeight(8),
    padding: scaleWidth(12),
    backgroundColor: '#fef2f2',
    borderRadius: scaleWidth(8),
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  deleteSummaryText: {
    fontSize: scaleFont(12),
    color: '#dc2626',
    fontFamily: FONTS.medium,
    textAlign: 'center',
  },

  // Media Upload
  mediaHint: {
    fontSize: scaleFont(12),
    color: COLORS.textMuted,
    fontStyle: 'italic',
    marginTop: scaleHeight(8),
    textAlign: 'center',
    fontFamily: FONTS.regular,
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
    borderRadius: scaleWidth(16),
    gap: scaleWidth(8),
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: scaleHeight(6) },
    shadowOpacity: 0.25,
    shadowRadius: scaleHeight(12),
    elevation: scaleHeight(8),
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