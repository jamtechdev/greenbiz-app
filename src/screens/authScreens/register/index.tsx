import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/Feather';
import {
  scaleWidth,
  scaleHeight,
  scaleFont,
  scale,
} from '../../../utils/resposive';
import CustomDropdown from '../../../components/CustomDropdown';
import { apiService } from '../../../api/axiosConfig';
import { useCustomAlert } from '../../../hook/useCustomAlert';
import CustomAlert from '../../../components/CustomAlert';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  country: string;
  company: string;
  role: string;
  businessType: string;
  greenbidz_user_type: 'buyer' | 'seller';
}

const SignupFlow = ({ navigation }: { navigation: any }) => {
  const [userType, setUserType] = useState<'buyer' | 'seller'>('buyer');
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    country: 'Australia',
    company: '',
    role: 'Owner',
    businessType: 'Manufacturer',
    greenbidz_user_type: 'buyer',
  });

  const countries = [
    'Australia, Bangladesh, Cambodia, Canada, Chile, China, Denmark, France, Germany, Hong Kong, India, Indonesia, Japan, Macao, Malaysia, Mexico, New Zealand, Pakistan, South Korea, Taiwan, Thailand, Vietnam',
  ];
const roles = ['Owner', 'Management', 'Purchasing', 'Sales', 'Technical', 'Others'];
 const businessTypes = [
  'Manufacturer',
  'Enterprise',
  'Broker',
  'System Integrator',
  'Recycler'
];

  const {
    alertConfig,
    hideAlert,
    showLoginRequired,
    showSuccess,
    showError,
    showConfirm,
  } = useCustomAlert();

  const updateFormData = useCallback((field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Fixed showToast to properly use custom alert
  const showToast = (title: string, message: string) => {
    showError({ title, message });
  };

  const validateStep1 = useCallback(() => {
    const { firstName, lastName, email, phone, password, confirmPassword } =
      formData;

    if (!firstName.trim()) {
      showToast('Error', 'First name is required');
      return false;
    }
    if (!lastName.trim()) {
      showToast('Error', 'Last name is required');
      return false;
    }
    if (!email.trim() || !email.includes('@')) {
      showToast('Error', 'Valid email is required');
      return false;
    }
    if (!phone.trim()) {
      showToast('Error', 'Phone number is required');
      return false;
    }
    if (!password.trim() || password.length < 6) {
      showToast('Error', 'Password must be at least 6 characters');
      return false;
    }
    if (password !== confirmPassword) {
      showToast('Error', 'Passwords do not match');
      return false;
    }
    return true;
  }, [formData, showError]);

  const validateStep2 = useCallback(() => {
    const { company } = formData;
    if (!company.trim()) {
      showToast('Error', 'Company name is required');
      return false;
    }
    return true;
  }, [formData, showError]);

  const handleNext = useCallback(() => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    }
  }, [currentStep, validateStep1, validateStep2]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const handleSubmit = useCallback(async () => {
    try {
      setIsLoading(true);

      // Create FormData object for the API
      const registrationData = new FormData();

      // Map form data to your API payload format
      registrationData.append('first_name', formData.firstName);
      registrationData.append('last_name', formData.lastName);
      registrationData.append('email', formData.email);
      registrationData.append('billing_phone', formData.phone);
      registrationData.append('password', formData.password);
      registrationData.append('confirm_password', formData.confirmPassword);
      registrationData.append('billing_country', formData.country);
      registrationData.append('greenbidz_company', formData.company);
      registrationData.append('greenbidz_role', formData.role);
      registrationData.append('greenbidz_business_type', formData.businessType);
      registrationData.append('greenbidz_user_type', userType);

      console.log('Submitting registration data:', {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        billing_phone: formData.phone,
        billing_country: formData.country,
        greenbidz_company: formData.company,
        greenbidz_role: formData.role,
        greenbidz_business_type: formData.businessType,
        greenbidz_user_type: userType,
      });

      const response = await apiService.register(registrationData);

      console.log('Registration successful:', response.data);

      showSuccess(
        'Registration Complete!',
        `Welcome ${formData.firstName}! Your ${userType} account has been created successfully.`,
      );

      // Handle successful registration (navigate to next screen)
      setTimeout(() => {
        navigation.navigate('Login');
      }, 2000);
    } catch (error) {
      console.error('Registration error:', error);

      let errorMessage = 'Registration failed. Please try again.';

      if (error.response) {
        // Server responded with error status
        console.error('Error response:', error.response.data);

        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (
          error.response.data &&
          typeof error.response.data === 'string'
        ) {
          errorMessage = error.response.data;
        } else if (error.response.status === 422) {
          errorMessage = 'Please check your information and try again.';
        } else if (error.response.status === 409) {
          errorMessage = 'An account with this email already exists.';
        }
      } else if (error.request) {
        // Network error
        console.error('Network error:', error.request);
        errorMessage = 'Network error. Please check your internet connection.';
      }

      showError('Registration Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [formData, userType, navigation, showSuccess, showError]);

  const Header = () => (
    <View style={styles.header}>
      <StatusBar barStyle="light-content" backgroundColor="#6366f1" />
      <TouchableOpacity
        style={styles.backIcon}
        onPress={() => navigation.goBack()}
      >
        <Icon name="arrow-left" size={24} color="white" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Create Account</Text>
      <View style={styles.headerRight} />
    </View>
  );

  const ProgressIndicator = () => {
    const steps = [
      { icon: 'shield', label: 'Account', step: 1 },
      { icon: 'building', label: 'Company Info', step: 2 },
      { icon: 'eye', label: 'Preview', step: 3 },
    ];

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          {steps.map((step, index) => {
            const isActive = currentStep >= step.step;
            const isCompleted = currentStep > step.step;

            return (
              <React.Fragment key={step.step}>
                <View style={styles.stepContainer}>
                  <View
                    style={[styles.progressStep, isActive && styles.activeStep]}
                  >
                    <Icon
                      name={isCompleted ? 'check-circle' : step.icon}
                      size={20}
                      color={isActive ? 'white' : '#9ca3af'}
                    />
                  </View>
                  <Text
                    style={[styles.stepLabel, isActive && styles.activeLabel]}
                  >
                    {step.label}
                  </Text>
                </View>
                {index < steps.length - 1 && (
                  <View
                    style={[
                      styles.progressLine,
                      currentStep > step.step && styles.activeLine,
                    ]}
                  />
                )}
              </React.Fragment>
            );
          })}
        </View>
      </View>
    );
  };

  const UserTypeSelector = () => (
    <View style={styles.userTypeContainer}>
      <TouchableOpacity
        style={[
          styles.userTypeButton,
          userType === 'buyer' && styles.activeUserType,
        ]}
        onPress={() => {
          setUserType('buyer');
          updateFormData('greenbidz_user_type', 'buyer');
        }}
      >
        <Icon
          name="users"
          size={20}
          color={userType === 'buyer' ? 'white' : '#6b7280'}
          style={styles.userTypeIcon}
        />
        <Text
          style={[
            styles.userTypeText,
            userType === 'buyer' && styles.activeUserTypeText,
          ]}
        >
          I'm a Buyer
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.userTypeButton,
          userType === 'seller' && styles.activeUserType,
        ]}
        onPress={() => {
          setUserType('seller');
          updateFormData('greenbidz_user_type', 'seller');
        }}
      >
        <Icon
          name="briefcase"
          size={20}
          color={userType === 'seller' ? 'white' : '#6b7280'}
          style={styles.userTypeIcon}
        />
        <Text
          style={[
            styles.userTypeText,
            userType === 'seller' && styles.activeUserTypeText,
          ]}
        >
          I'm a Seller
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Icon name="user" size={20} color="#6366f1" />
              <Text style={styles.cardTitle}>Account Information</Text>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>First Name *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.firstName}
                  onChangeText={text => updateFormData('firstName', text)}
                  placeholder="Enter first name"
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="words"
                  textContentType="givenName"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Last Name *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.lastName}
                  onChangeText={text => updateFormData('lastName', text)}
                  placeholder="Enter last name"
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="words"
                  textContentType="familyName"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.email}
                  onChangeText={text => updateFormData('email', text)}
                  placeholder="Enter email address"
                  placeholderTextColor="#9ca3af"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  textContentType="emailAddress"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.phone}
                  onChangeText={text => updateFormData('phone', text)}
                  placeholder="Enter phone number"
                  placeholderTextColor="#9ca3af"
                  keyboardType="phone-pad"
                  textContentType="telephoneNumber"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.password}
                  onChangeText={text => updateFormData('password', text)}
                  placeholder="Enter password"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry
                  textContentType="newPassword"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm Password *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.confirmPassword}
                  onChangeText={text => updateFormData('confirmPassword', text)}
                  placeholder="Confirm password"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry
                  textContentType="newPassword"
                  autoCapitalize="none"
                />
              </View>

              <TouchableOpacity
                style={styles.responsiveButton}
                onPress={handleNext}
                activeOpacity={0.8}
              >
                <Text style={styles.responsiveButtonText}>Next</Text>
                <Icon
                  name="arrow-right"
                  size={scale(18)}
                  color="white"
                  style={styles.buttonIcon}
                />
              </TouchableOpacity>
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Icon name="briefcase" size={20} color="#6366f1" />
              <Text style={styles.cardTitle}>Company Information</Text>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Country *</Text>
                <CustomDropdown
                  options={countries}
                  selectedValue={formData.country}
                  onSelect={value => updateFormData('country', value)}
                  placeholder="Select a country"
                  style={styles.picker}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Company *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.company}
                  onChangeText={text => updateFormData('company', text)}
                  placeholder="Enter company name"
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="words"
                  textContentType="organizationName"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>What is your role? *</Text>
                <CustomDropdown
                  options={roles}
                  selectedValue={formData.role}
                  onSelect={value => updateFormData('role', value)}
                  placeholder="Select a role"
                  style={styles.picker}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Type of Business *</Text>
                <CustomDropdown
                  options={businessTypes}
                  selectedValue={formData.businessType}
                  onSelect={value => updateFormData('businessType', value)}
                  placeholder="Select a Business Type"
                  style={styles.picker}
                />
              </View>

              <View style={styles.responsiveButtonRow}>
                <TouchableOpacity
                  style={styles.responsiveSecondaryButton}
                  onPress={handleBack}
                  activeOpacity={0.8}
                >
                  <Icon
                    name="arrow-left"
                    size={scale(18)}
                    color="#6b7280"
                    style={styles.buttonIcon}
                  />
                  <Text style={styles.responsiveSecondaryButtonText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.responsiveButton, styles.previewButton]}
                  onPress={handleNext}
                  activeOpacity={0.8}
                >
                  <Text style={styles.responsiveButtonText}>Preview</Text>
                  <Icon
                    name="arrow-right"
                    size={scale(18)}
                    color="white"
                    style={styles.buttonIcon}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Icon name="eye" size={20} color="#6366f1" />
              <Text style={styles.cardTitle}>Preview Your Registration</Text>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.previewContainer}>
                {[
                  { label: 'First Name', value: formData.firstName },
                  { label: 'Last Name', value: formData.lastName },
                  { label: 'Email Address', value: formData.email },
                  { label: 'Phone', value: formData.phone },
                  { label: 'Country', value: formData.country },
                  { label: 'Company', value: formData.company },
                  { label: 'Role', value: formData.role },
                  { label: 'Business Type', value: formData.businessType },
                ].map((item, index) => (
                  <View key={item.label} style={styles.previewItem}>
                    <Text style={styles.previewLabel}>{item.label}:</Text>
                    <Text style={styles.previewValue}>{item.value}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.responsiveButtonRow}>
                <TouchableOpacity
                  style={styles.responsiveSecondaryButton}
                  onPress={handleBack}
                  activeOpacity={0.8}
                >
                  <Icon
                    name="arrow-left"
                    size={scale(18)}
                    color="#6b7280"
                    style={styles.buttonIcon}
                  />
                  <Text style={styles.responsiveSecondaryButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.responsiveGradientButton,
                    isLoading && styles.disabledButton,
                  ]}
                  onPress={handleSubmit}
                  activeOpacity={0.8}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Icon
                        name="loader"
                        size={scale(18)}
                        color="white"
                        style={[styles.buttonIcon, styles.spinningIcon]}
                      />
                      <Text style={styles.responsiveButtonText}>
                        {/* Submitting... */}
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.responsiveButtonText}>Submit</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.mainContainer}>
      <Header />
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          bounces={true}
          scrollEventThrottle={16}
        >
          {/* Header Text */}
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerText}>Create Account</Text>
            <Text style={styles.subtitleText}>
              {userType === 'buyer'
                ? 'Are you searching for machinery to purchase? Register below to start hunting for great deals on new and used equipment'
                : 'Ready to sell your machinery? Register below to connect with buyers and expand your business'}
            </Text>
          </View>

          <UserTypeSelector />
          <ProgressIndicator />

          <View style={styles.formContainer}>{renderStep()}</View>

          <TouchableOpacity
            style={styles.loginPrompt}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginText}>Already have an account? Login</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

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
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: scale(16),
    paddingBottom: scale(40),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#6366f1',
    paddingTop: scale(40),
    paddingBottom: scale(15),
    paddingHorizontal: scale(20),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  backIcon: {
    width: scale(40),
    height: scale(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: scaleFont(18),
    fontWeight: '600',
    textAlign: 'center',
  },
  headerRight: {
    width: scale(40),
    height: scale(40),
  },
  headerTextContainer: {
    alignItems: 'center',
    marginBottom: scale(32),
    marginTop: scale(20),
  },
  headerText: {
    fontSize: scaleFont(24),
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: scale(8),
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: scaleFont(14),
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: scaleHeight(20),
    paddingHorizontal: scale(16),
  },
  userTypeContainer: {
    flexDirection: 'row',
    gap: scale(16),
    marginBottom: scale(32),
  },
  userTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: scale(16),
    backgroundColor: '#f3f4f6',
    borderRadius: scale(12),
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeUserType: {
    backgroundColor: '#6366f1',
    borderColor: '#4f46e5',
  },
  userTypeIcon: {
    marginRight: scale(8),
  },
  userTypeText: {
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: '#6b7280',
  },
  activeUserTypeText: {
    color: 'white',
  },
  progressContainer: {
    marginBottom: scale(32),
  },
  progressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formContainer: {
    alignItems: 'center',
    marginBottom: scale(20),
  },
  stepContainer: {
    alignItems: 'center',
  },
  progressStep: {
    width: scale(48),
    height: scale(48),
    borderRadius: scale(24),
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scale(8),
  },
  activeStep: {
    backgroundColor: '#6366f1',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  stepLabel: {
    fontSize: scaleFont(12),
    fontWeight: '500',
    color: '#9ca3af',
    textAlign: 'center',
  },
  activeLabel: {
    color: '#6366f1',
    fontWeight: '600',
  },
  progressLine: {
    flex: 1,
    height: scale(2),
    backgroundColor: '#e5e7eb',
    marginHorizontal: scale(16),
    marginBottom: scale(24),
  },
  activeLine: {
    backgroundColor: '#6366f1',
  },
  card: {
    width: '100%',
    maxWidth: scaleWidth(350),
    backgroundColor: 'white',
    borderRadius: scale(16),
    padding: scale(24),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(24),
  },
  cardTitle: {
    fontSize: scaleFont(20),
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: scale(8),
  },
  cardContent: {
    gap: scale(16),
  },
  inputGroup: {
    marginBottom: scale(20),
  },
  label: {
    fontSize: scaleFont(15),
    fontWeight: '600',
    color: '#374151',
    marginBottom: scale(8),
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: scale(12),
    paddingHorizontal: scale(16),
    paddingVertical: scale(14),
    fontSize: scaleFont(16),
    backgroundColor: 'white',
    color: '#1f2937',
    minHeight: scaleHeight(52),
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  picker: {
    height: scaleHeight(50),
  },
  buttonIcon: {
    marginHorizontal: scale(4),
  },
  previewContainer: {
    gap: scale(12),
  },
  previewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: scale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  previewLabel: {
    fontSize: scaleFont(14),
    fontWeight: '500',
    color: '#6b7280',
    flex: 1,
  },
  previewValue: {
    fontSize: scaleFont(14),
    color: '#1f2937',
    textAlign: 'right',
    flex: 1,
  },
  loginPrompt: {
    alignItems: 'center',
    marginVertical: scale(24),
  },
  loginText: {
    color: '#6366f1',
    fontSize: scaleFont(14),
    textDecorationLine: 'underline',
  },
  // Enhanced Responsive Button Styles
  responsiveButton: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scale(16),
    paddingHorizontal: scale(24),
    borderRadius: scale(14),
    minHeight: scaleHeight(56),
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    marginTop: scale(8),
  },
  responsiveButtonRow: {
    flexDirection: 'row',
    gap: scale(16),
    marginTop: scale(16),
    width: '100%',
  },
  responsiveSecondaryButton: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scale(12),
    paddingHorizontal: scale(24),
    borderRadius: scale(14),
    minHeight: scaleHeight(56),
    flex: 1,
    marginTop: scale(8),
  },
  responsiveGradientButton: {
    backgroundColor: '#10b981',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scale(12),
    paddingHorizontal: scale(24),
    borderRadius: scale(14),
    minHeight: scaleHeight(56),
    flex: 1,
    marginTop: scale(8),
  },
  previewButton: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scale(12),
    paddingHorizontal: scale(24),
    borderRadius: scale(14),
    minHeight: scaleHeight(56),
    flex: 1,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    marginTop: scale(8),
  },
  responsiveButtonText: {
    color: 'white',
    fontSize: scaleFont(17),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  responsiveSecondaryButtonText: {
    color: '#64748b',
    fontSize: scaleFont(17),
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  disabledButton: {
    opacity: 0.6,
  },
  spinningIcon: {
    marginRight: scale(8),
  },
});

export default SignupFlow;
