import React, { useState, useEffect } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  Dimensions,
  SafeAreaView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

import CustomDropdown from './CustomDropdown';
import CustomDateTimePicker from './CustomDateTimePicker';
import MediaUploadComponent from './MediaUpload';
import { apiService } from '../api/axiosConfig';

const { height: screenHeight } = Dimensions.get('window');

export default function DetailModal({
  fields,
  showReviewModal,
  setShowReviewModal,
  onChangeText,
  handleContinueToSubmit,
  mediaFiles = [], // Add media files prop
  onMediaFilesChange, // Add media files change handler prop
}) {
  const [productType, setProductType] = useState(
    fields.product_type?.value || 'Marketplace',
  );
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [auctionGroups, setAuctionGroups] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingSubCategories, setLoadingSubCategories] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [loadingAuctionGroups, setLoadingAuctionGroups] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customAuctionGroup, setCustomAuctionGroup] = useState('');
  const [showCustomAuctionGroup, setShowCustomAuctionGroup] = useState(false);
  
  // Local media files state (fallback if not provided via props)
  const [localMediaFiles, setLocalMediaFiles] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  // Use provided media files or local state
  const currentMediaFiles = mediaFiles.length >= 0 ? mediaFiles : localMediaFiles;
  const handleMediaFilesChange = onMediaFilesChange || setLocalMediaFiles;

  // Fetch data when modal opens
  useEffect(() => {
    if (showReviewModal) {
      fetchCategories();
      fetchLocations();
      fetchAuctionGroups();
    }
  }, [showReviewModal]);

  // Fetch subcategories when category changes
  useEffect(() => {
    if (selectedCategoryId) {
      fetchSubCategories(selectedCategoryId);
    } else {
      setSubCategories([]);
    }
  }, [selectedCategoryId]);

  // Validation rules
  const validateFields = () => {
    const errors = {};

    // Required fields validation
    if (!fields.name?.value?.trim()) {
      errors.name = 'Product title is required';
    }

    if (!fields.equipment_description?.value?.trim()) {
      errors.equipment_description = 'Product description is required';
    }

    if (!fields.original_price?.value || parseFloat(fields.original_price.value) <= 0) {
      errors.original_price = 'Valid price is required';
    }

    if (!fields.parent_category?.value) {
      errors.parent_category = 'Category is required';
    }

    if (!fields.item_location?.value) {
      errors.item_location = 'Location is required';
    }

    // Auction-specific validation
    if (productType === 'Auction') {
      if (!fields.auction_start_date?.value) {
        errors.auction_start_date = 'Start date is required for auctions';
      }

      if (!fields.auction_end_date?.value) {
        errors.auction_end_date = 'End date is required for auctions';
      }

      if (fields.auction_start_date?.value && fields.auction_end_date?.value) {
        const startDate = new Date(fields.auction_start_date.value);
        const endDate = new Date(fields.auction_end_date.value);
        const now = new Date();

        if (startDate < now) {
          errors.auction_start_date = 'Start date must be in the future';
        }

        if (endDate <= startDate) {
          errors.auction_end_date = 'End date must be after start date';
        }
      }

      if (!fields.auction_start_price?.value || parseFloat(fields.auction_start_price.value) <= 0) {
        errors.auction_start_price = 'Valid starting bid price is required';
      }

      if (fields.reserve_price?.value && parseFloat(fields.reserve_price.value) < parseFloat(fields.auction_start_price?.value || 0)) {
        errors.reserve_price = 'Reserve price must be higher than starting bid price';
      }

      if (!fields.auction_currency?.value) {
        errors.auction_currency = 'Currency is required for auctions';
      }
    }

    // Email validation if provided
    if (fields.email?.value && !/\S+@\S+\.\S+/.test(fields.email.value)) {
      errors.email = 'Valid email address is required';
    }

    // Phone validation if provided
    if (fields.phone?.value && !/^\+?[\d\s\-\(\)]+$/.test(fields.phone.value)) {
      errors.phone = 'Valid phone number is required';
    }

    return errors;
  };

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await apiService.getCategories();
      
      console.log('Categories API Response:', response.data);

      if (response.data) {
        const categoryList = Array.isArray(response.data) ? 
          response.data : 
          (response.data.categories || response.data.data || []);
        
        const categoryOptions = categoryList.map(category => {
          if (typeof category === 'string') {
            return { name: category, id: null };
          }
          return {
            name: category.name || category.label || category.title || String(category),
            id: category.id || category.term_id || category.ID || null
          };
        });

        setCategories(categoryOptions.length > 0 ? categoryOptions : [
          { name: 'Electronics', id: null },
          { name: 'Computers', id: null },
          { name: 'Mobiles', id: null },
          { name: 'Accessories', id: null },
          { name: 'Machinery', id: null },
          { name: 'Industrial Equipment', id: null },
          { name: 'Automotive', id: null },
          { name: 'Construction Equipment', id: null },
          { name: 'Agricultural Equipment', id: null },
          { name: 'Other', id: null }
        ]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([
        { name: 'Electronics', id: null },
        { name: 'Computers', id: null },
        { name: 'Mobiles', id: null },
        { name: 'Accessories', id: null },
        { name: 'Machinery', id: null },
        { name: 'Industrial Equipment', id: null },
        { name: 'Automotive', id: null },
        { name: 'Construction Equipment', id: null },
        { name: 'Agricultural Equipment', id: null },
        { name: 'Other', id: null }
      ]);
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchSubCategories = async (parentId) => {
    if (!parentId) {
      setSubCategories([]);
      return;
    }

    try {
      setLoadingSubCategories(true);
      const response = await apiService.getSubCategories(parentId);
      
      console.log('SubCategories API Response:', response.data);

      if (response.data) {
        const subCategoryList = Array.isArray(response.data) ? 
          response.data : 
          (response.data.subcategories || response.data.data || []);
        
        const subCategoryOptions = subCategoryList.map(subCategory => {
          if (typeof subCategory === 'string') {
            return subCategory;
          }
          return subCategory.name || subCategory.label || subCategory.title || String(subCategory);
        });

        setSubCategories(subCategoryOptions);
      }
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      // Fallback subcategories based on parent category name
      const selectedCategory = categories.find(cat => cat.id === parentId);
      const categoryName = selectedCategory?.name || '';
      
      const fallbackSubCategories = {
        'Electronics': ['Smartphones', 'Laptops', 'Tablets', 'Audio Equipment', 'Gaming Consoles'],
        'Machinery': ['Heavy Machinery', 'Manufacturing Equipment', 'Power Tools', 'Generators'],
        'Automotive': ['Cars', 'Motorcycles', 'Trucks', 'Parts & Accessories'],
        'Construction Equipment': ['Excavators', 'Bulldozers', 'Cranes', 'Concrete Mixers'],
      };
      setSubCategories(fallbackSubCategories[categoryName] || ['General', 'Other']);
    } finally {
      setLoadingSubCategories(false);
    }
  };

  const fetchLocations = async () => {
    try {
      setLoadingLocations(true);
      const response = await apiService.getLocations();
      
      console.log('Locations API Response:', response.data);

      if (response.data) {
        const locationList = Array.isArray(response.data) ? 
          response.data : 
          (response.data.locations || response.data.data || []);
        
        const locationOptions = locationList.map(location => {
          if (typeof location === 'string') {
            return location;
          }
          return location.name || location.label || location.city || location.title || String(location);
        });

        setLocations(locationOptions.length > 0 ? locationOptions : [
          'New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX',
          'Phoenix, AZ', 'Philadelphia, PA', 'San Antonio, TX', 'San Diego, CA',
          'Dallas, TX', 'San Jose, CA', 'London, UK', 'Dubai, UAE',
          'Sydney, AU', 'Tokyo, JP', 'Singapore, SG', 'Hong Kong, HK', 'Other'
        ]);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
      setLocations([
        'New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX',
        'Phoenix, AZ', 'Philadelphia, PA', 'San Antonio, TX', 'San Diego, CA',
        'Dallas, TX', 'San Jose, CA', 'London, UK', 'Dubai, UAE',
        'Sydney, AU', 'Tokyo, JP', 'Singapore, SG', 'Hong Kong, HK', 'Other'
      ]);
    } finally {
      setLoadingLocations(false);
    }
  };

  const fetchAuctionGroups = async () => {
    try {
      setLoadingAuctionGroups(true);
      const response = await apiService.getAuctionGroups();
      
      console.log('Auction Groups API Response:', response.data);

      if (response.data) {
        const auctionGroupList = Array.isArray(response.data) ? 
          response.data : 
          (response.data.auction_groups || response.data.groups || response.data.data || []);
        
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
          'Automotive Equipment',
          'Construction Tools',
          'Standard Auctions',
          'Quick Sale'
        ]);
      }
    } catch (error) {
      console.error('Error fetching auction groups:', error);
      setAuctionGroups([
        'Premium Equipment',
        'Industrial Machinery', 
        'Electronics & Tech',
        'Automotive Equipment',
        'Construction Tools',
        'Standard Auctions',
        'Quick Sale'
      ]);
    } finally {
      setLoadingAuctionGroups(false);
    }
  };

  const handleClose = () => {
    setValidationErrors({});
    setShowReviewModal(false);
  };

  const handleSaveAndSubmit = async () => {
    // Validate all fields
    const errors = validateFields();
    setValidationErrors(errors);

    // If there are validation errors, don't proceed
    if (Object.keys(errors).length > 0) {
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Separate media files by type
      const images = currentMediaFiles.filter(file => file.category === 'images');
      const documents = currentMediaFiles.filter(file => file.category === 'documents');
      const videos = currentMediaFiles.filter(file => file.category === 'videos');
      
      // Add media files to form data
      const productData = {};
      Object.keys(fields).forEach(key => {
        if (fields[key]?.value !== null && fields[key]?.value !== undefined) {
          productData[key] = fields[key].value;
        }
      });
      
      console.log('Product Data:', productData);
      console.log('Media Files:', { images, documents, videos });
      
      // Submit with media files
      // await apiService.submitProduct(productData, images, documents, videos);
      
      setShowReviewModal(false);
      await handleContinueToSubmit();
    } catch (error) {
      console.error('Error submitting:', error);
      Alert.alert('Error', 'Failed to submit listing. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFieldChange = (key, value) => {
    // Clear validation error for this field when user starts typing
    if (validationErrors[key]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
    onChangeText(key, value);
  };

  const handleCategoryChange = (categoryName) => {
    // Find the selected category object
    const selectedCategory = categories.find(cat => cat.name === categoryName);
    
    if (selectedCategory) {
      setSelectedCategoryId(selectedCategory.id);
      handleFieldChange('parent_category', categoryName);
      // Clear subcategory when category changes
      handleFieldChange('sub_category', '');
    }
  };

  const handleAuctionGroupChange = (value) => {
    if (value === 'Create Custom Group') {
      setShowCustomAuctionGroup(true);
    } else {
      setShowCustomAuctionGroup(false);
      handleFieldChange('auction_group', value);
    }
  };

  const handleCustomAuctionGroupSubmit = () => {
    if (customAuctionGroup.trim()) {
      handleFieldChange('auction_group', customAuctionGroup.trim());
      setShowCustomAuctionGroup(false);
      setCustomAuctionGroup('');
    }
  };

  const renderFieldError = (fieldName) => {
    if (validationErrors[fieldName]) {
      return (
        <Text style={styles.errorText}>
          {validationErrors[fieldName]}
        </Text>
      );
    }
    return null;
  };

  return (
    <Modal
      visible={showReviewModal}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
      statusBarTranslucent={true}
    >
      <SafeAreaView style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerContent}>
              <View style={styles.iconContainer}>
                <Icon name="edit-3" size={18} color="#6366f1" />
              </View>
              <View>
                <Text style={styles.modalTitle}>Review & Submit</Text>
                <Text style={styles.modalSubtitle}>Finalize your listing details</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon name="x" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView 
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContainer}
          >
            {/* Basic Information Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIcon}>
                  <Icon name="info" size={16} color="#6366f1" />
                </View>
                <Text style={styles.sectionTitle}>Basic Information</Text>
              </View>
              
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Product Title *</Text>
                <TextInput
                  style={[
                    styles.input,
                    validationErrors.name && styles.inputError
                  ]}
                  value={fields.name?.value || ''}
                  onChangeText={text => handleFieldChange('name', text)}
                  placeholder="Enter product title"
                  placeholderTextColor="#9ca3af"
                />
                {renderFieldError('name')}
              </View>

              <View style={styles.row}>
                <View style={[styles.fieldContainer, styles.halfWidth]}>
                  <Text style={styles.label}>Brand</Text>
                  <TextInput
                    style={styles.input}
                    value={fields.brand?.value || ''}
                    onChangeText={text => handleFieldChange('brand', text)}
                    placeholder="Enter brand"
                    placeholderTextColor="#9ca3af"
                  />
                </View>

                <View style={[styles.fieldContainer, styles.halfWidth]}>
                  <Text style={styles.label}>Model</Text>
                  <TextInput
                    style={styles.input}
                    value={fields.model?.value || ''}
                    onChangeText={text => handleFieldChange('model', text)}
                    placeholder="Enter model"
                    placeholderTextColor="#9ca3af"
                  />
                </View>
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Description *</Text>
                <TextInput
                  style={[
                    styles.input, 
                    styles.textArea,
                    validationErrors.equipment_description && styles.inputError
                  ]}
                  multiline
                  numberOfLines={3}
                  value={fields.equipment_description?.value || ''}
                  onChangeText={text => handleFieldChange('equipment_description', text)}
                  placeholder="Describe your equipment in detail..."
                  placeholderTextColor="#9ca3af"
                  textAlignVertical="top"
                />
                {renderFieldError('equipment_description')}
              </View>

              {/* Dimensions */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Dimensions (L x W x H)</Text>
                <TextInput
                  style={styles.input}
                  value={fields.dimensions?.value || ''}
                  onChangeText={text => handleFieldChange('dimensions', text)}
                  placeholder="e.g., 120 x 80 x 60 cm"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              {/* CO2 Emission */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>CO2 Emission (kg/year)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="decimal-pad"
                  value={fields.co2_emission?.value || ''}
                  onChangeText={text => handleFieldChange('co2_emission', text)}
                  placeholder="Enter estimated CO2 emission"
                  placeholderTextColor="#9ca3af"
                />
                <Text style={styles.fieldHint}>
                  Optional: Environmental impact information
                </Text>
              </View>
            </View>

            {/* Pricing Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIcon, { backgroundColor: '#ecfdf5' }]}>
                  <Icon name="dollar-sign" size={16} color="#059669" />
                </View>
                <Text style={styles.sectionTitle}>Pricing Information</Text>
              </View>
              
              <View style={styles.row}>
                <View style={[styles.fieldContainer, styles.halfWidth]}>
                  <Text style={styles.label}>Price *</Text>
                  <TextInput
                    style={[
                      styles.input,
                      validationErrors.original_price && styles.inputError
                    ]}
                    keyboardType="decimal-pad"
                    value={fields.original_price?.value || ''}
                    onChangeText={text => handleFieldChange('original_price', text)}
                    placeholder="0.00"
                    placeholderTextColor="#9ca3af"
                  />
                  {renderFieldError('original_price')}
                </View>

                <View style={[styles.fieldContainer, styles.halfWidth]}>
                  <Text style={styles.label}>Currency</Text>
                  <CustomDropdown
                    options={[
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
                    ]}
                    selectedValue={fields.currency?.value || 'USD ($)'}
                    onSelect={(val) => {
                      const stringValue = val && typeof val === 'object' ? 
                        (val.name || val.label || val.value || String(val)) : 
                        String(val || 'USD ($)');
                      handleFieldChange('currency', stringValue);
                      // Auto-set auction currency if not set
                      if (productType === 'Auction' && !fields.auction_currency?.value) {
                        handleFieldChange('auction_currency', stringValue);
                      }
                    }}
                    placeholder="Select currency"
                    label="Currency"
                  />
                </View>
              </View>
            </View>

            {/* Product Type Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIcon, { backgroundColor: '#fef3c7' }]}>
                  <Icon name="package" size={16} color="#f59e0b" />
                </View>
                <Text style={styles.sectionTitle}>Listing Type</Text>
              </View>
              
              <View style={styles.productTypeContainer}>
                <TouchableOpacity
                  style={[
                    styles.productTypeButton,
                    productType === 'Marketplace' && styles.productTypeButtonActive
                  ]}
                  onPress={() => {
                    setProductType('Marketplace');
                    handleFieldChange('product_type', 'Marketplace');
                  }}
                >
                  <View style={[
                    styles.productTypeIcon,
                    productType === 'Marketplace' && styles.productTypeIconActive
                  ]}>
                    <Icon 
                      name="shopping-bag" 
                      size={18} 
                      color={productType === 'Marketplace' ? '#6366f1' : '#6b7280'} 
                    />
                  </View>
                  <View style={styles.productTypeContent}>
                    <Text style={[
                      styles.productTypeTitle,
                      productType === 'Marketplace' && styles.productTypeTextActive
                    ]}>
                      Marketplace
                    </Text>
                    <Text style={styles.productTypeDescription}>
                      Sell at fixed price
                    </Text>
                  </View>
                  {productType === 'Marketplace' && (
                    <Icon name="check-circle" size={16} color="#6366f1" />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.productTypeButton,
                    productType === 'Auction' && styles.productTypeButtonActive
                  ]}
                  onPress={() => {
                    setProductType('Auction');
                    handleFieldChange('product_type', 'Auction');
                    // Auto-set auction currency from main currency
                    if (fields.currency?.value && !fields.auction_currency?.value) {
                      handleFieldChange('auction_currency', fields.currency.value);
                    }
                  }}
                >
                  <View style={[
                    styles.productTypeIcon,
                    productType === 'Auction' && styles.productTypeIconActive
                  ]}>
                    <Icon 
                      name="zap" 
                      size={18} 
                      color={productType === 'Auction' ? '#6366f1' : '#6b7280'} 
                    />
                  </View>
                  <View style={styles.productTypeContent}>
                    <Text style={[
                      styles.productTypeTitle,
                      productType === 'Auction' && styles.productTypeTextActive
                    ]}>
                      Auction
                    </Text>
                    <Text style={styles.productTypeDescription}>
                      Let buyers bid
                    </Text>
                  </View>
                  {productType === 'Auction' && (
                    <Icon name="check-circle" size={16} color="#6366f1" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Location & Category Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIcon, { backgroundColor: '#fee2e2' }]}>
                  <Icon name="map-pin" size={16} color="#dc2626" />
                </View>
                <Text style={styles.sectionTitle}>Location & Category</Text>
              </View>
              
              <View style={styles.row}>
                <View style={[styles.fieldContainer, styles.halfWidth]}>
                  <Text style={styles.label}>Category *</Text>
                  <CustomDropdown
                    options={categories.map(cat => cat.name)}
                    selectedValue={fields.parent_category?.value || (categories.length > 0 ? categories[0].name : 'Electronics')}
                    onSelect={handleCategoryChange}
                    placeholder="Select category"
                    label="Product Category"
                    loading={loadingCategories}
                    hasError={!!validationErrors.parent_category}
                  />
                  {renderFieldError('parent_category')}
                </View>

                <View style={[styles.fieldContainer, styles.halfWidth]}>
                  <Text style={styles.label}>Sub Category</Text>
                  <CustomDropdown
                    options={subCategories}
                    selectedValue={fields.sub_category?.value || ''}
                    onSelect={(val) => {
                      const stringValue = val && typeof val === 'object' ? 
                        (val.name || val.label || val.value || String(val)) : 
                        String(val || '');
                      handleFieldChange('sub_category', stringValue);
                    }}
                    placeholder="Select subcategory"
                    label="Sub Category"
                    loading={loadingSubCategories}
                    disabled={!selectedCategoryId}
                  />
                </View>
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Location *</Text>
                <CustomDropdown
                  options={locations}
                  selectedValue={fields.item_location?.value || (locations.length > 0 ? locations[0] : 'New York, NY')}
                  onSelect={(val) => {
                    const stringValue = val && typeof val === 'object' ? 
                      (val.name || val.label || val.value || String(val)) : 
                      String(val || (locations.length > 0 ? locations[0] : 'New York, NY'));
                    handleFieldChange('item_location', stringValue);
                  }}
                  placeholder="Select location"
                  label="Item Location"
                  loading={loadingLocations}
                  hasError={!!validationErrors.item_location}
                />
                {renderFieldError('item_location')}
              </View>
            </View>

            {/* Media Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIcon, { backgroundColor: '#f0f9ff' }]}>
                  <Icon name="file" size={16} color="#0284c7" />
                </View>
                <Text style={styles.sectionTitle}>Media & Documents</Text>
              </View>
              
              <MediaUploadComponent
                onFilesSelected={handleMediaFilesChange}
                uploadedFiles={currentMediaFiles}
                maxFiles={15}
                allowedTypes={['documents', 'videos']}
              />
            </View>

            {/* Auction-specific fields */}
            {productType === 'Auction' && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIcon, { backgroundColor: '#e0e7ff' }]}>
                    <Icon name="clock" size={16} color="#7c3aed" />
                  </View>
                  <Text style={styles.sectionTitle}>Auction Settings</Text>
                </View>
                
                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>Auction Group</Text>
                  {showCustomAuctionGroup ? (
                    <View style={styles.customGroupContainer}>
                      <TextInput
                        style={styles.input}
                        value={customAuctionGroup}
                        onChangeText={setCustomAuctionGroup}
                        placeholder="Enter custom auction group name"
                        placeholderTextColor="#9ca3af"
                      />
                      <View style={styles.customGroupButtons}>
                        <TouchableOpacity
                          style={styles.customGroupButtonCancel}
                          onPress={() => {
                            setShowCustomAuctionGroup(false);
                            setCustomAuctionGroup('');
                          }}
                        >
                          <Text style={styles.customGroupButtonCancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.customGroupButtonSave}
                          onPress={handleCustomAuctionGroupSubmit}
                        >
                          <Text style={styles.customGroupButtonSaveText}>Save</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <CustomDropdown
                      options={[...auctionGroups, 'Create Custom Group']}
                      selectedValue={fields.auction_group?.value || (auctionGroups.length > 0 ? auctionGroups[0] : 'Standard Auctions')}
                      onSelect={handleAuctionGroupChange}
                      placeholder="Select auction group"
                      label="Auction Group"
                      loading={loadingAuctionGroups}
                    />
                  )}
                  <Text style={styles.fieldHint}>
                    Group similar items together for better visibility
                  </Text>
                </View>

                {/* Currency for Auction */}
                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>Auction Currency *</Text>
                  <View style={styles.currencyInfoContainer}>
                    <CustomDropdown
                      options={[
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
                      ]}
                      selectedValue={fields.auction_currency?.value || fields.currency?.value || 'USD ($)'}
                      onSelect={(val) => {
                        const stringValue = val && typeof val === 'object' ? 
                          (val.name || val.label || val.value || String(val)) : 
                          String(val || 'USD ($)');
                        handleFieldChange('auction_currency', stringValue);
                      }}
                      placeholder="Select currency"
                      label="Auction Currency"
                      hasError={!!validationErrors.auction_currency}
                    />
                    {fields.currency?.value && (
                      <Text style={styles.currencyInfo}>
                        Based on listing currency: {fields.currency.value}
                      </Text>
                    )}
                  </View>
                  {renderFieldError('auction_currency')}
                </View>

                <View style={styles.row}>
                  <View style={[styles.fieldContainer, styles.halfWidth]}>
                    <Text style={styles.label}>Start Date *</Text>
                    <View style={[
                      styles.datePickerWrapper,
                      validationErrors.auction_start_date && styles.datePickerError
                    ]}>
                      <CustomDateTimePicker
                        value={
                          fields.auction_start_date?.value
                            ? new Date(fields.auction_start_date.value)
                            : null
                        }
                        onChange={date =>
                          handleFieldChange(
                            'auction_start_date',
                            date?.toISOString() || '',
                          )
                        }
                        textStyle={styles.datePickerText}
                      />
                    </View>
                    {renderFieldError('auction_start_date')}
                  </View>

                  <View style={[styles.fieldContainer, styles.halfWidth]}>
                    <Text style={styles.label}>End Date *</Text>
                    <View style={[
                      styles.datePickerWrapper,
                      validationErrors.auction_end_date && styles.datePickerError
                    ]}>
                      <CustomDateTimePicker
                        value={
                          fields.auction_end_date?.value
                            ? new Date(fields.auction_end_date.value)
                            : null
                        }
                        onChange={date =>
                          handleFieldChange('auction_end_date', date?.toISOString() || '')
                        }
                        textStyle={styles.datePickerText}
                      />
                    </View>
                    {renderFieldError('auction_end_date')}
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={[styles.fieldContainer, styles.halfWidth]}>
                    <Text style={styles.label}>Starting Bid Price *</Text>
                    <TextInput
                      style={[
                        styles.input,
                        validationErrors.auction_start_price && styles.inputError
                      ]}
                      keyboardType="decimal-pad"
                      value={fields.auction_start_price?.value || ''}
                      onChangeText={text => handleFieldChange('auction_start_price', text)}
                      placeholder="Enter starting bid amount"
                      placeholderTextColor="#9ca3af"
                    />
                    {renderFieldError('auction_start_price')}
                    <Text style={styles.fieldHint}>
                      Set a competitive starting price to attract bidders
                    </Text>
                  </View>

                  <View style={[styles.fieldContainer, styles.halfWidth]}>
                    <Text style={styles.label}>Reserve Price (Optional)</Text>
                    <TextInput
                      style={[
                        styles.input,
                        validationErrors.reserve_price && styles.inputError
                      ]}
                      keyboardType="decimal-pad"
                      value={fields.reserve_price?.value || ''}
                      onChangeText={text => handleFieldChange('reserve_price', text)}
                      placeholder="Enter reserve price"
                      placeholderTextColor="#9ca3af"
                    />
                    {renderFieldError('reserve_price')}
                    <Text style={styles.fieldHint}>
                      Minimum price you'll accept for the item
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Validation Summary */}
            {Object.keys(validationErrors).length > 0 && (
              <View style={styles.validationSummary}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIcon, { backgroundColor: '#fef2f2' }]}>
                    <Icon name="alert-circle" size={16} color="#dc2626" />
                  </View>
                  <Text style={[styles.sectionTitle, { color: '#dc2626' }]}>
                    Please fix the following errors:
                  </Text>
                </View>
                {Object.entries(validationErrors).map(([field, error]) => (
                  <Text key={field} style={styles.validationError}>
                    • {error}
                  </Text>
                ))}
              </View>
            )}

            {/* Summary Section */}
            <View style={styles.summarySection}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIcon, { backgroundColor: '#f0f9ff' }]}>
                  <Icon name="file-text" size={16} color="#0284c7" />
                </View>
                <Text style={styles.sectionTitle}>Listing Summary</Text>
              </View>
              
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Type:</Text>
                  <Text style={styles.summaryValue}>{productType}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Price:</Text>
                  <Text style={styles.summaryValue}>
                    {fields.currency?.value} {parseFloat(fields.original_price?.value || 0).toLocaleString()}
                  </Text>
                </View>
                {productType === 'Auction' && (
                  <>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Starting Bid:</Text>
                      <Text style={styles.summaryValue}>
                        {fields.auction_currency?.value} {parseFloat(fields.auction_start_price?.value || 0).toLocaleString()}
                      </Text>
                    </View>
                    {fields.reserve_price?.value && (
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Reserve Price:</Text>
                        <Text style={styles.summaryValue}>
                          {fields.auction_currency?.value} {parseFloat(fields.reserve_price.value).toLocaleString()}
                        </Text>
                      </View>
                    )}
                  </>
                )}
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Category:</Text>
                  <Text style={styles.summaryValue}>
                    {fields.parent_category?.value}
                    {fields.sub_category?.value && ` / ${fields.sub_category.value}`}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Location:</Text>
                  <Text style={styles.summaryValue}>{fields.item_location?.value}</Text>
                </View>
                {currentMediaFiles.length > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Media Files:</Text>
                    <Text style={styles.summaryValue}>
                      {currentMediaFiles.length} file{currentMediaFiles.length > 1 ? 's' : ''} attached
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Bottom spacing for buttons */}
            <View style={styles.bottomSpacing} />
          </ScrollView>

          {/* Fixed Bottom Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={isSubmitting}
            >
              <Icon name="x" size={16} color="#6b7280" />
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.saveButton,
                (Object.keys(validationErrors).length > 0 || isSubmitting) && styles.saveButtonDisabled
              ]}
              onPress={handleSaveAndSubmit}
              disabled={Object.keys(validationErrors).length > 0 || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Icon name="send" size={16} color="#fff" />
              )}
              <Text style={styles.saveButtonText}>
                {isSubmitting ? 'Submitting...' : 'Submit Listing'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: screenHeight,
    minHeight: screenHeight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 16,
  },
  
  // Header
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  closeButton: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
  },
  
  // Content
  scrollContent: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  
  // Fields
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#fff',
    color: '#1f2937',
  },
  inputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  fieldHint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  datePickerWrapper: {
    backgroundColor: '#fff',
    paddingHorizontal: 4,
  },
  datePickerError: {
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 8,
    backgroundColor: '#fef2f2',
  },
  datePickerText: {
    fontSize: 12,
    color: '#1f2937',
  },
  
  // Currency Info
  currencyInfoContainer: {
    gap: 4,
  },
  currencyInfo: {
    fontSize: 11,
    color: '#6366f1',
    fontStyle: 'italic',
    marginTop: 2,
  },
  
  // Custom Auction Group
  customGroupContainer: {
    gap: 8,
  },
  customGroupButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  customGroupButtonCancel: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    alignItems: 'center',
  },
  customGroupButtonCancelText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  customGroupButtonSave: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#6366f1',
    borderRadius: 6,
    alignItems: 'center',
  },
  customGroupButtonSaveText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  
  // Product Type
  productTypeContainer: {
    gap: 12,
  },
  productTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  productTypeButtonActive: {
    borderColor: '#6366f1',
    backgroundColor: '#eef2ff',
  },
  productTypeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  productTypeTextActive: {
    color: '#6366f1',
  },
  productTypeDescription: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  
  // Validation Summary
  validationSummary: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  validationError: {
    fontSize: 12,
    color: '#dc2626',
    marginBottom: 4,
    marginLeft: 8,
  },
  
  // Summary
  summarySection: {
    marginBottom: 24,
  },
  summaryCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 13,
    color: '#1e293b',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 12,
  },
  bottomSpacing: {
    height: 16,
  },
  
  // Buttons
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontWeight: '500',
    fontSize: 14,
  },
  saveButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    backgroundColor: '#6366f1',
    borderRadius: 8,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: '#9ca3af',
    shadowColor: 'transparent',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});