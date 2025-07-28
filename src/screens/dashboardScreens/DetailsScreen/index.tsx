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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppContext } from '../../../_customContext/AppProvider';
import BottomNav from '../../../components/BottomNavbar';

const { width } = Dimensions.get('window');

export default function DetailsScreen({ route, navigation }) {
  const { image, images, imageCount, analysisData, timestamp } = route.params || {};
  const { setShowOverlay } = useAppContext();
  
  const selectedImages = images || (image ? [image] : []);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userToken, setUserToken] = useState(null);
  const [lastUpdateTimestamp, setLastUpdateTimestamp] = useState(null);

  // Initialize fields with API response data
  const getInitialFields = () => {
    console.log('🔄 Initializing fields with analysis data:', analysisData);
    
    if (analysisData && analysisData.success && analysisData.data) {
      const data = analysisData.data;
      const priceData = data.price || {};
      
      console.log('✅ Using fresh API data for fields');
      return {
        name: { value: data.name || 'Machine Name', editing: false },
        brand: { value: data.brand || 'Brand Name', editing: false },
        model: { value: data.model || 'Model', editing: false },
        year: { value: data.year?.toString() || '2023', editing: false },
        equipment_description: { value: data.equipment_description || 'Equipment description', editing: false },
        item_location: { value: data.item_location || 'Location', editing: false },
        auction_group: { value: data.auction_group || 'General', editing: false },
        parent_category: { value: data.parent_category || 'Category', editing: false },
        condition: { value: data.condition || 'Good', editing: false },
        operation_status: { value: data.operation_status || 'Functional', editing: false },
        currency: { value: data.currency || 'USD', editing: false },
        original_price: { value: priceData.original_price?.toString() || '0', editing: false },
        reselling_price: { value: priceData.reselling_price?.toString() || '0', editing: false },
        min_reselling_price: { value: priceData.min_reselling_price_value?.toString() || '0', editing: false },
        max_reselling_price: { value: priceData.max_reselling_price_value?.toString() || '0', editing: false },
      };
    }
    
    // Default values if no API data
    console.log('⚠️ No analysis data, using defaults');
    return {
      name: { value: 'Desktop Computer Set', editing: false },
      brand: { value: 'Generic', editing: false },
      model: { value: 'Standard Desktop', editing: false },
      year: { value: '2023', editing: false },
      equipment_description: { value: 'Includes monitor, keyboard, mouse, and CPU tower.', editing: false },
      item_location: { value: 'Warehouse A', editing: false },
      auction_group: { value: 'Electronics', editing: false },
      parent_category: { value: 'Computers', editing: false },
      condition: { value: 'New', editing: false },
      operation_status: { value: 'Functional', editing: false },
      currency: { value: 'USD', editing: false },
      original_price: { value: '600', editing: false },
      reselling_price: { value: '450', editing: false },
      min_reselling_price: { value: '450', editing: false },
      max_reselling_price: { value: '550', editing: false },
    };
  };

  const [fields, setFields] = useState(getInitialFields());

  // Update fields when new analysis data arrives
  useEffect(() => {
    console.log('🔄 DetailsScreen useEffect - checking for new data');
    console.log('Current timestamp:', timestamp);
    console.log('Last update timestamp:', lastUpdateTimestamp);
    console.log('Analysis data exists:', !!analysisData);

    // Check if we have new analysis data
    if (timestamp && timestamp !== lastUpdateTimestamp) {
      console.log('🆕 New analysis data detected, updating fields...');
      
      const newFields = getInitialFields();
      setFields(newFields);
      setLastUpdateTimestamp(timestamp);
      
      console.log('✅ Fields updated with new analysis data');
    }
  }, [analysisData, timestamp]);

  // Check auth status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');
      
      if (token && isLoggedIn === 'true') {
        setUserToken(token);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
    }
  };

  const onEditPress = (key) => {
    setFields((prev) => ({
      ...prev,
      [key]: { ...prev[key], editing: true },
    }));
  };

  const onBlur = (key) => {
    setFields((prev) => ({
      ...prev,
      [key]: { ...prev[key], editing: false },
    }));
  };

  const onChangeText = (key, text) => {
    setFields((prev) => ({
      ...prev,
      [key]: { ...prev[key], value: text },
    }));
  };
    const handleContinueToSubmit = async () => {
    const currentToken = await AsyncStorage.getItem('userToken');
    const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');
    
    if (currentToken && isLoggedIn === 'true') {
      handleSubmitListing(currentToken);
    } else {
      navigation.navigate('Login');
    }
  };

  const handleSubmitListing = async (authToken) => {
    try {
      setIsSubmitting(true);

      const userData = await AsyncStorage.getItem('userData');
      const parsedUserData = userData ? JSON.parse(userData) : null;

      // Prepare submission data with all fields
      const submissionData = {
        name: fields.name.value,
        brand: fields.brand.value,
        model: fields.model.value,
        year: parseInt(fields.year.value),
        equipment_description: fields.equipment_description.value,
        item_location: fields.item_location.value,
        auction_group: fields.auction_group.value,
        parent_category: fields.parent_category.value,
        condition: fields.condition.value,
        operation_status: fields.operation_status.value,
        currency: fields.currency.value,
        original_price: parseFloat(fields.original_price.value),
        reselling_price: parseFloat(fields.reselling_price.value),
        min_reselling_price: parseFloat(fields.min_reselling_price.value),
        max_reselling_price: parseFloat(fields.max_reselling_price.value),
        images: selectedImages,
        analysisId: analysisData?.id,
        userId: parsedUserData?.id,
        timestamp: timestamp, // Include timestamp for tracking
      };

      console.log('📤 Submitting listing with current data:', submissionData);

      const response = await fetch('https://staging.greenbidz.com/wp-json/greenbidz-api/v1/submit-listing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(submissionData),
      });

      const result = await response.json();

      if (response.ok) {
        setIsSubmitting(false);
        Alert.alert(
          'Success!',
          'Your machine listing has been submitted successfully.',
          [{ text: 'OK', onPress: () => navigation.navigate('Dashboard') }]
        );
      } else {
        throw new Error(result.message || 'Submission failed');
      }

    } catch (error) {
      console.error('Submission error:', error);
      setIsSubmitting(false);
      Alert.alert('Submission Failed', error.message);
    }
  };

  const renderImageGallery = () => {
    if (selectedImages.length === 0) {
      return (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Icon name="camera" size={32} color="#999" />
          <Text style={{ color: '#999', marginTop: 8 }}>No Images Selected</Text>
        </View>
      );
    }

    if (selectedImages.length === 1) {
      return <Image source={{ uri: selectedImages[0] }} style={styles.image} />;
    }

    return (
      <View style={styles.imageGalleryContainer}>
        <View style={styles.mainImageContainer}>
          <Image source={{ uri: selectedImages[currentImageIndex] }} style={styles.image} />
          
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
                currentImageIndex === index && styles.activeThumbnail
              ]}
              onPress={() => setCurrentImageIndex(index)}
            >
              <Image source={{ uri: imageUri }} style={styles.thumbnailImage} />
              {currentImageIndex === index && (
                <View style={styles.activeThumbnailIndicator} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderFieldInput = (key, label, props = {}) => (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputRow, props.multiline && { alignItems: 'flex-start' }]}>
        {fields[key]?.editing ? (
          <TextInput
            style={[
              styles.input,
              props.multiline && { height: 80, textAlignVertical: 'top' }
            ]}
            value={fields[key]?.value || ''}
            onChangeText={(text) => onChangeText(key, text)}
            onBlur={() => onBlur(key)}
            autoFocus
            {...props}
          />
        ) : (
          <Text style={[
            styles.valueText,
            props.multiline && { minHeight: 80 }
          ]}>
            {fields[key]?.value || `Enter ${label.toLowerCase()}`}
          </Text>
        )}
        {!fields[key]?.editing && (
          <TouchableOpacity
            onPress={() => onEditPress(key)}
            style={[styles.editBtn, props.multiline && { marginTop: 6 }]}
          >
            <Icon name="edit-2" size={16} color="#4f46e5" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.page}
        style={styles.scrollView}
        keyboardShouldPersistTaps="handled">
        
        <SafeAreaView style={styles.headerSafeArea}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.navigate('Dashboard')}>
              <Icon name="arrow-left" size={20} color="#f0f0f0" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>AI Analysis Results</Text>
              {selectedImages.length > 1 && (
                <Text style={styles.headerSubtitle}>
                  {selectedImages.length} images analyzed
                </Text>
              )}
              {analysisData && analysisData.success && (
                <View style={styles.analysisStatus}>
                  <Icon name="check-circle" size={12} color="#34d399" />
                  <Text style={styles.analysisStatusText}>
                    Fresh Analysis {timestamp ? `(${new Date(timestamp).toLocaleTimeString()})` : ''}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.headerRight}>
              {userToken ? (
                <View style={styles.authStatus}>
                  <Icon name="user-check" size={16} color="#34d399" />
                </View>
              ) : (
                <View style={styles.authStatus}>
                  <Icon name="user-x" size={16} color="#f59e0b" />
                </View>
              )}
            </View>
          </View>
        </SafeAreaView>
        {/* Image Gallery Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionTitle}>Machine Images</Text>
            {selectedImages.length > 0 && (
              <View style={styles.imageCount}>
                <Icon name="camera" size={16} color="#4f46e5" />
                <Text style={styles.imageCountText}>{selectedImages.length}</Text>
              </View>
            )}
          </View>
          {renderImageGallery()}
        </View>

        {/* Basic Details Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          {renderFieldInput('name', 'Name')}
          
          <View style={styles.row}>
            <View style={[styles.fieldGroup, styles.halfWidth]}>
              <Text style={styles.label}>Brand</Text>
              <View style={styles.inputRow}>
                {fields.brand?.editing ? (
                  <TextInput
                    style={styles.input}
                    value={fields.brand?.value || ''}
                    onChangeText={(text) => onChangeText('brand', text)}
                    onBlur={() => onBlur('brand')}
                    autoFocus
                  />
                ) : (
                  <Text style={styles.valueText}>{fields.brand?.value}</Text>
                )}
                {!fields.brand?.editing && (
                  <TouchableOpacity onPress={() => onEditPress('brand')} style={styles.editBtn}>
                    <Icon name="edit-2" size={16} color="#4f46e5" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={[styles.fieldGroup, styles.halfWidth]}>
              <Text style={styles.label}>Model</Text>
              <View style={styles.inputRow}>
                {fields.model?.editing ? (
                  <TextInput
                    style={styles.input}
                    value={fields.model?.value || ''}
                    onChangeText={(text) => onChangeText('model', text)}
                    onBlur={() => onBlur('model')}
                    autoFocus
                  />
                ) : (
                  <Text style={styles.valueText}>{fields.model?.value}</Text>
                )}
                {!fields.model?.editing && (
                  <TouchableOpacity onPress={() => onEditPress('model')} style={styles.editBtn}>
                    <Icon name="edit-2" size={16} color="#4f46e5" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {renderFieldInput('year', 'Year', { keyboardType: 'numeric' })}
          {renderFieldInput('equipment_description', 'Description', { multiline: true })}
        </View>

        {/* Location & Category Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Location & Category</Text>
          
          {renderFieldInput('item_location', 'Location')}
          
          <View style={styles.row}>
            <View style={[styles.fieldGroup, styles.halfWidth]}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.inputRow}>
                {fields.parent_category?.editing ? (
                  <TextInput
                    style={styles.input}
                    value={fields.parent_category?.value || ''}
                    onChangeText={(text) => onChangeText('parent_category', text)}
                    onBlur={() => onBlur('parent_category')}
                    autoFocus
                  />
                ) : (
                  <Text style={styles.valueText}>{fields.parent_category?.value}</Text>
                )}
                {!fields.parent_category?.editing && (
                  <TouchableOpacity onPress={() => onEditPress('parent_category')} style={styles.editBtn}>
                    <Icon name="edit-2" size={16} color="#4f46e5" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={[styles.fieldGroup, styles.halfWidth]}>
              <Text style={styles.label}>Auction Group</Text>
              <View style={styles.inputRow}>
                {fields.auction_group?.editing ? (
                  <TextInput
                    style={styles.input}
                    value={fields.auction_group?.value || ''}
                    onChangeText={(text) => onChangeText('auction_group', text)}
                    onBlur={() => onBlur('auction_group')}
                    autoFocus
                  />
                ) : (
                  <Text style={styles.valueText}>{fields.auction_group?.value}</Text>
                )}
                {!fields.auction_group?.editing && (
                  <TouchableOpacity onPress={() => onEditPress('auction_group')} style={styles.editBtn}>
                    <Icon name="edit-2" size={16} color="#4f46e5" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Condition & Status Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Condition & Status</Text>
          
          <View style={styles.row}>
            <View style={[styles.fieldGroup, styles.halfWidth]}>
              <Text style={styles.label}>Condition</Text>
              <View style={styles.inputRow}>
                {fields.condition?.editing ? (
                  <TextInput
                    style={styles.input}
                    value={fields.condition?.value || ''}
                    onChangeText={(text) => onChangeText('condition', text)}
                    onBlur={() => onBlur('condition')}
                    autoFocus
                  />
                ) : (
                  <Text style={styles.valueText}>{fields.condition?.value}</Text>
                )}
                {!fields.condition?.editing && (
                  <TouchableOpacity onPress={() => onEditPress('condition')} style={styles.editBtn}>
                    <Icon name="edit-2" size={16} color="#4f46e5" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={[styles.fieldGroup, styles.halfWidth]}>
              <Text style={styles.label}>Operation Status</Text>
              <View style={styles.inputRow}>
                {fields.operation_status?.editing ? (
                  <TextInput
                    style={styles.input}
                    value={fields.operation_status?.value || ''}
                    onChangeText={(text) => onChangeText('operation_status', text)}
                    onBlur={() => onBlur('operation_status')}
                    autoFocus
                  />
                ) : (
                  <Text style={styles.valueText}>{fields.operation_status?.value}</Text>
                )}
                {!fields.operation_status?.editing && (
                  <TouchableOpacity onPress={() => onEditPress('operation_status')} style={styles.editBtn}>
                    <Icon name="edit-2" size={16} color="#4f46e5" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Pricing Information Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionTitle}>Pricing Information</Text>
            <View style={styles.priceIcon}>
              <Icon name="dollar-sign" size={16} color="#059669" />
            </View>
          </View>
          
          <View style={styles.row}>
            <View style={[styles.fieldGroup, styles.halfWidth]}>
              <Text style={styles.label}>Currency</Text>
              <View style={styles.inputRow}>
                {fields.currency?.editing ? (
                  <TextInput
                    style={styles.input}
                    value={fields.currency?.value || ''}
                    onChangeText={(text) => onChangeText('currency', text)}
                    onBlur={() => onBlur('currency')}
                    autoFocus
                  />
                ) : (
                  <Text style={styles.valueText}>{fields.currency?.value}</Text>
                )}
                {!fields.currency?.editing && (
                  <TouchableOpacity onPress={() => onEditPress('currency')} style={styles.editBtn}>
                    <Icon name="edit-2" size={16} color="#4f46e5" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={[styles.fieldGroup, styles.halfWidth]}>
              <Text style={styles.label}>Original Price</Text>
              <View style={styles.inputRow}>
                {fields.original_price?.editing ? (
                  <TextInput
                    style={styles.input}
                    value={fields.original_price?.value || ''}
                    onChangeText={(text) => onChangeText('original_price', text)}
                    onBlur={() => onBlur('original_price')}
                    autoFocus
                    keyboardType="numeric"
                  />
                ) : (
                  <Text style={[styles.valueText, styles.priceText]}>
                    {fields.currency?.value} {fields.original_price?.value}
                  </Text>
                )}
                {!fields.original_price?.editing && (
                  <TouchableOpacity onPress={() => onEditPress('original_price')} style={styles.editBtn}>
                    <Icon name="edit-2" size={16} color="#4f46e5" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.fieldGroup, styles.halfWidth]}>
              <Text style={styles.label}>Reselling Price</Text>
              <View style={styles.inputRow}>
                {fields.reselling_price?.editing ? (
                  <TextInput
                    style={styles.input}
                    value={fields.reselling_price?.value || ''}
                    onChangeText={(text) => onChangeText('reselling_price', text)}
                    onBlur={() => onBlur('reselling_price')}
                    autoFocus
                    keyboardType="numeric"
                  />
                ) : (
                  <Text style={[styles.valueText, styles.priceText]}>
                    {fields.currency?.value} {fields.reselling_price?.value}
                  </Text>
                )}
                {!fields.reselling_price?.editing && (
                  <TouchableOpacity onPress={() => onEditPress('reselling_price')} style={styles.editBtn}>
                    <Icon name="edit-2" size={16} color="#4f46e5" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={[styles.fieldGroup, styles.halfWidth]}>
              <Text style={styles.label}>Min Price</Text>
              <View style={styles.inputRow}>
                {fields.min_reselling_price?.editing ? (
                  <TextInput
                    style={styles.input}
                    value={fields.min_reselling_price?.value || ''}
                    onChangeText={(text) => onChangeText('min_reselling_price', text)}
                    onBlur={() => onBlur('min_reselling_price')}
                    autoFocus
                    keyboardType="numeric"
                  />
                ) : (
                  <Text style={[styles.valueText, styles.priceText]}>
                    {fields.currency?.value} {fields.min_reselling_price?.value}
                  </Text>
                )}
                {!fields.min_reselling_price?.editing && (
                  <TouchableOpacity onPress={() => onEditPress('min_reselling_price')} style={styles.editBtn}>
                    <Icon name="edit-2" size={16} color="#4f46e5" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Max Reselling Price</Text>
            <View style={styles.inputRow}>
              {fields.max_reselling_price?.editing ? (
                <TextInput
                  style={styles.input}
                  value={fields.max_reselling_price?.value || ''}
                  onChangeText={(text) => onChangeText('max_reselling_price', text)}
                  onBlur={() => onBlur('max_reselling_price')}
                  autoFocus
                  keyboardType="numeric"
                />
              ) : (
                <Text style={[styles.valueText, styles.priceText]}>
                  {fields.currency?.value} {fields.max_reselling_price?.value}
                </Text>
              )}
              {!fields.max_reselling_price?.editing && (
                <TouchableOpacity onPress={() => onEditPress('max_reselling_price')} style={styles.editBtn}>
                  <Icon name="edit-2" size={16} color="#4f46e5" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Price Summary */}
          <View style={styles.priceSummary}>
            <Text style={styles.priceSummaryTitle}>Price Summary</Text>
            <View style={styles.priceSummaryRow}>
              <Text style={styles.priceSummaryLabel}>Original:</Text>
              <Text style={styles.priceSummaryValue}>
                {fields.currency?.value} {fields.original_price?.value}
              </Text>
            </View>
            <View style={styles.priceSummaryRow}>
              <Text style={styles.priceSummaryLabel}>Reselling:</Text>
              <Text style={styles.priceSummaryValue}>
                {fields.currency?.value} {fields.reselling_price?.value}
              </Text>
            </View>
            <View style={styles.priceSummaryRow}>
              <Text style={styles.priceSummaryLabel}>Range:</Text>
              <Text style={styles.priceSummaryValue}>
                {fields.currency?.value} {fields.min_reselling_price?.value} - {fields.currency?.value} {fields.max_reselling_price?.value}
              </Text>
            </View>
          </View>
        </View>

        {/* Auth Status Card */}
        {!userToken && (
          <View style={styles.authCard}>
            <View style={styles.authCardHeader}>
              <Icon name="info" size={20} color="#f59e0b" />
              <Text style={styles.authCardTitle}>Login Required</Text>
            </View>
            <Text style={styles.authCardText}>
              You need to be logged in to submit your machine listing. 
              Your current analysis data will be preserved!
            </Text>
          </View>
        )}

        {/* Continue Button */}
        <TouchableOpacity
          style={[styles.continueButton, isSubmitting && styles.continueButtonDisabled]}
          onPress={handleContinueToSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Icon name="loader" size={20} color="#e0e0e0" />
              <Text style={styles.continueButtonText}>Submitting...</Text>
            </>
          ) : (
            <>
              <Icon name={userToken ? "check" : "log-in"} size={20} color="#e0e0e0" />
              <Text style={styles.continueButtonText}>
                {userToken ? 'Submit Listing' : 'Login & Submit'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      <BottomNav setShowOverlay={setShowOverlay} navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSafeArea: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 44,
    backgroundColor: '#4338ca',
  },
  page: {
    flexGrow: 1,
    backgroundColor: '#f9fafb',
    paddingBottom: 90,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4338ca',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  headerCenter: {
    flex: 1,
  },
  headerRight: {
    width: 40,
    alignItems: 'center',
  },
  backButton: {
    padding: 6,
    borderRadius: 6,
  },
  headerTitle: {
    color: '#f9fafb',
    fontSize: 18,
    fontWeight: '600',
  },
  headerSubtitle: {
    color: 'rgba(249, 250, 251, 0.7)',
    fontSize: 12,
    marginTop: 2,
  },
  analysisStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  analysisStatusText: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: '500',
  },
  authStatus: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  // Analysis Info Card
  analysisInfoCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#059669',
  },
  analysisInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  analysisInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#065f46',
    flex: 1,
  },
  analysisTimestamp: {
    fontSize: 12,
    color: '#047857',
    fontWeight: '500',
  },
  analysisInfoText: {
    fontSize: 14,
    color: '#047857',
    lineHeight: 20,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  imageCount: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef2ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  imageCountText: {
    fontSize: 12,
    color: '#4f46e5',
    fontWeight: '500',
  },
  priceIcon: {
    backgroundColor: '#ecfdf5',
    padding: 8,
    borderRadius: 8,
  },
  
  // Auth Card
  authCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  authCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  authCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
  },
  authCardText: {
    fontSize: 14,
    color: '#78350f',
    lineHeight: 20,
  },
  
  // Image Gallery Styles
  imageGalleryContainer: {
    gap: 12,
  },
  mainImageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e5e7eb',
  },
  imageCounter: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCounterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  
  // Navigation Arrows
  navArrow: {
    position: 'absolute',
    top: '50%',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 8,
    marginTop: -20,
  },
  prevArrow: {
    left: 12,
  },
  nextArrow: {
    right: 12,
  },
  
  // Thumbnail Strip
  thumbnailStrip: {
    maxHeight: 70,
  },
  thumbnailContent: {
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  thumbnailItem: {
    width: 60,
    height: 60,
    marginHorizontal: 4,
    borderRadius: 8,
    position: 'relative',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeThumbnail: {
    borderColor: '#4f46e5',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  activeThumbnailIndicator: {
    position: 'absolute',
    bottom: -8,
    left: '50%',
    marginLeft: -3,
    width: 6,
    height: 6,
    backgroundColor: '#4f46e5',
    borderRadius: 3,
  },
  
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    color: '#111827',
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  valueText: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    fontSize: 15,
    color: '#111827',
  },
  priceText: {
    fontWeight: '600',
    color: '#059669',
  },
  input: {
    flex: 1,
    backgroundColor: '#eef2ff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    fontSize: 15,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#4338ca',
  },
  editBtn: {
    padding: 8,
    borderRadius: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  halfWidth: {
    flex: 1,
  },
  
  // Price Summary
  priceSummary: {
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#059669',
  },
  priceSummaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#065f46',
    marginBottom: 8,
  },
  priceSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  priceSummaryLabel: {
    fontSize: 14,
    color: '#047857',
  },
  priceSummaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#065f46',
  },
  
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4338ca',
    marginHorizontal: 16,
    marginVertical: 24,
    paddingVertical: 14,
    borderRadius: 8,
  },
  continueButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  continueButtonText: {
    color: '#f9fafb',
    fontWeight: '600',
    fontSize: 16,
  },
});