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
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  scaleWidth,
  scaleHeight,
  scaleFont,
  scale,
} from '../../../utils/resposive';

import PhoneInput, { 
  validatePhoneNumber, 
  getCompletePhoneNumber 
} from '../../../components/PhoneInput'; // Import the reusable component
import { apiService } from '../../../api/axiosConfig';
import { useCustomAlert } from '../../../hook/useCustomAlert';
import CustomAlert from '../../../components/CustomAlert';
import CustomDropdown from '../../../components/CustomDropdown';
import {
  setPendingNavigation,
  clearPendingNavigation,
  clearAuthError,
} from '../../../store/slices/authSlice';

// Font family constants
const FONTS = {
  regular: 'Poppins-Regular',
  medium: 'Poppins-Medium',
  semiBold: 'Poppins-SemiBold',
  bold: 'Poppins-Bold',
  light: 'Poppins-Light',
};

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  countryCode: string;
  password: string;
  confirmPassword: string;
  country: string;
  company: string;
  role: string;
  businessType: string;
  greenbidz_user_type: 'buyer' | 'seller';
}

const SignupFlow = ({ navigation, route }: { navigation: any; route: any }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  
  // Get navigation context passed from login screen
  const { fromScreen, screenParams, originalPendingNavigation } = route.params || {};
  
  const [userType, setUserType] = useState<'buyer' | 'seller'>('buyer');
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [phoneError, setPhoneError] = useState<string>('');
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    countryCode: '+61', // Default to Australia
    password: '',
    confirmPassword: '',
    country: t('signup.countries.australia'),
    company: '',
    role: t('signup.roles.owner'),
    businessType: t('signup.businessTypes.manufacturer'),
    greenbidz_user_type: 'buyer',
  });

  // Get localized dropdown options
  const getCountries = () => [
    t('signup.countries.australia'),
    t('signup.countries.bangladesh'),
    t('signup.countries.cambodia'),
    t('signup.countries.canada'),
    t('signup.countries.chile'),
    t('signup.countries.china'),
    t('signup.countries.denmark'),
    t('signup.countries.france'),
    t('signup.countries.germany'),
    t('signup.countries.hongKong'),
    t('signup.countries.india'),
    t('signup.countries.indonesia'),
    t('signup.countries.japan'),
    t('signup.countries.macao'),
    t('signup.countries.malaysia'),
    t('signup.countries.mexico'),
    t('signup.countries.newZealand'),
    t('signup.countries.pakistan'),
    t('signup.countries.southKorea'),
    t('signup.countries.taiwan'),
    t('signup.countries.thailand'),
    t('signup.countries.vietnam')
  ];

  const getRoles = () => [
    t('signup.roles.owner'),
    t('signup.roles.management'),
    t('signup.roles.purchasing'),
    t('signup.roles.sales'),
    t('signup.roles.technical'),
    t('signup.roles.others'),
  ];

  const getBusinessTypes = () => [
    t('signup.businessTypes.manufacturer'),
    t('signup.businessTypes.enterprise'),
    t('signup.businessTypes.broker'),
    t('signup.businessTypes.systemIntegrator'),
    t('signup.businessTypes.recycler'),
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
    
    // Clear phone error when user starts typing
    if (field === 'phone' || field === 'countryCode') {
      setPhoneError('');
    }
  }, []);

  // Fixed showToast to properly use custom alert
  const showToast = (title: string, message: string) => {
    showError({ title, message });
  };

  const validateStep1 = useCallback(() => {
    const { firstName, lastName, email, phone, countryCode, password, confirmPassword } =
      formData;

    if (!firstName.trim()) {
      showToast(t('signup.messages.error'), t('signup.validation.firstNameRequired'));
      return false;
    }
    if (!lastName.trim()) {
      showToast(t('signup.messages.error'), t('signup.validation.lastNameRequired'));
      return false;
    }
    if (!email.trim() || !email.includes('@')) {
      showToast(t('signup.messages.error'), t('signup.validation.emailRequired'));
      return false;
    }
    
    // Validate phone number using the helper function
    const phoneValidation = validatePhoneNumber(countryCode, phone);
    if (!phoneValidation.isValid) {
      setPhoneError(phoneValidation.error || t('signup.validation.invalidPhone'));
      showToast(t('signup.messages.error'), phoneValidation.error || t('signup.validation.invalidPhone'));
      return false;
    }
    
    if (!password.trim() || password.length < 6) {
      showToast(t('signup.messages.error'), t('signup.validation.passwordRequired'));
      return false;
    }
    if (password !== confirmPassword) {
      showToast(t('signup.messages.error'), t('signup.validation.passwordMismatch'));
      return false;
    }
    return true;
  }, [formData, showError, t]);

  const validateStep2 = useCallback(() => {
    const { company } = formData;
    if (!company.trim()) {
      showToast(t('signup.messages.error'), t('signup.validation.companyRequired'));
      return false;
    }
    return true;
  }, [formData, showError, t]);

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

  // FIXED: Handle successful signup navigation
  const handleSuccessfulSignup = useCallback(async () => {
    // Priority 1: Navigate back to the screen that brought us here (fromScreen param)
    if (fromScreen) {
      console.log('✅ Navigating back to fromScreen after signup:', fromScreen);

      try {
        if (screenParams) {
          navigation.navigate(fromScreen, screenParams);
        } else {
          navigation.navigate(fromScreen);
        }
        return;
      } catch (error) {
        console.error('❌ Error navigating to fromScreen after signup:', error);
        // Fall through to other options
      }
    }

    // Priority 2: Check for pending navigation from Redux or params
    if (originalPendingNavigation) {
      console.log('✅ Navigating to pending screen after signup:', originalPendingNavigation);
      try {
        dispatch(clearPendingNavigation());
        navigation.navigate(originalPendingNavigation);
        return;
      } catch (error) {
        console.error('❌ Error navigating to pending screen after signup:', error);
        // Fall through to default
      }
    }

    // Priority 3: Default navigation (Dashboard, etc.)
    console.log('✅ Navigating to Dashboard after signup (default)');
    // navigation.navigate('Dashboard');
  }, [fromScreen, screenParams, originalPendingNavigation, navigation, dispatch]);

  const handleSubmit = useCallback(async () => {
    try {
      setIsLoading(true);

      // Create FormData object for the API
      const registrationData = new FormData();

      // Use the helper function to get complete phone number
      const fullPhoneNumber = getCompletePhoneNumber(formData.countryCode, formData.phone);

      // Map form data to your API payload format
      registrationData.append('first_name', formData.firstName);
      registrationData.append('last_name', formData.lastName);
      registrationData.append('email', formData.email);
      registrationData.append('billing_phone', fullPhoneNumber);
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
        billing_phone: fullPhoneNumber,
        billing_country: formData.country,
        greenbidz_company: formData.company,
        greenbidz_role: formData.role,
        greenbidz_business_type: formData.businessType,
        greenbidz_user_type: userType,
      });

      const response = await apiService.register(registrationData);

      console.log('Registration successful:', response.data);

      // FIXED: Store login credentials for automatic login
      if (response.data && response.data.token) {
        // Auto-login after successful registration
        await AsyncStorage.setItem('userToken', response.data.token);
        await AsyncStorage.setItem('isLoggedIn', 'true');

        // Store user data if provided
        if (response.data.user_email || response.data.user_display_name) {
          const userData = {
            id: response.data.user_id || null,
            email: response.data.user_email || formData.email,
            displayName: response.data.user_display_name || `${formData.firstName} ${formData.lastName}`,
            nicename: response.data.user_nicename || '',
          };
          await AsyncStorage.setItem('userData', JSON.stringify(userData));
        }

        showSuccess({
          title: t('signup.messages.registrationComplete'),
          message: t('signup.messages.welcomeMessage', { 
            name: formData.firstName, 
            userType: userType 
          }),
          buttonText: t('login.continue'),
          onPress: () => {
            handleSuccessfulSignup();
          },
        });
      } else {
        // If no auto-login, show success and navigate to login
        showSuccess({
          title: t('signup.messages.registrationComplete'),
          message: t('signup.messages.welcomeMessage', { 
            name: formData.firstName, 
            userType: userType 
          }),
        });

        // Navigate to login with context after a delay
        setTimeout(() => {
          handleNavigateToLogin();
        }, 2000);
      }
    } catch (error) {
      console.error('Registration error:', error);

      let errorMessage = t('signup.messages.registrationError');

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
          errorMessage = t('signup.messages.checkInformation');
        } else if (error.response.status === 409) {
          errorMessage = t('signup.messages.emailExists');
        }
      } else if (error.request) {
        // Network error
        console.error('Network error:', error.request);
        errorMessage = t('signup.messages.networkError');
      }

      showError({
        title: t('signup.messages.registrationFailed'),
        message: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }, [formData, userType, handleSuccessfulSignup, showSuccess, showError, t]);

  // FIXED: Navigate to login with navigation context
  const handleNavigateToLogin = useCallback(() => {
    // Pass the navigation context to login screen
    const loginParams = {};
    
    if (fromScreen || originalPendingNavigation) {
      loginParams.fromScreen = fromScreen;
      loginParams.screenParams = screenParams;
      
      // Also set pending navigation in Redux if needed
      if (originalPendingNavigation) {
        dispatch(setPendingNavigation(originalPendingNavigation));
      }
    }
    
    navigation.navigate('Login', loginParams);
  }, [fromScreen, screenParams, originalPendingNavigation, navigation, dispatch]);

  // Phone input handlers
  const handleCountryCodeChange = useCallback((code: string) => {
    updateFormData('countryCode', code);
  }, [updateFormData]);

  const handlePhoneNumberChange = useCallback((number: string) => {
    updateFormData('phone', number);
  }, [updateFormData]);

  const Header = () => (
    <View style={styles.header}>
      <StatusBar barStyle="light-content" backgroundColor="#6366f1" />
      <TouchableOpacity
        style={styles.backIcon}
        onPress={() => navigation.goBack()}
      >
        <Icon name="arrow-left" size={24} color="white" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{t('signup.title')}</Text>
      <View style={styles.headerRight} />
    </View>
  );

  const ProgressIndicator = () => {
    const steps = [
      { icon: 'shield', label: t('signup.steps.account'), step: 1 },
      { icon: 'briefcase', label: t('signup.steps.companyInfo'), step: 2 },
      { icon: 'eye', label: t('signup.steps.preview'), step: 3 },
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
          {t('signup.userType.buyerTitle')}
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
          {t('signup.userType.sellerTitle')}
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
              <Text style={styles.cardTitle}>{t('signup.accountInfo.title')}</Text>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('signup.accountInfo.firstName')} *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.firstName}
                  onChangeText={text => updateFormData('firstName', text)}
                  placeholder={t('signup.accountInfo.firstNamePlaceholder')}
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="words"
                  textContentType="givenName"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('signup.accountInfo.lastName')} *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.lastName}
                  onChangeText={text => updateFormData('lastName', text)}
                  placeholder={t('signup.accountInfo.lastNamePlaceholder')}
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="words"
                  textContentType="familyName"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('signup.accountInfo.email')} *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.email}
                  onChangeText={text => updateFormData('email', text)}
                  placeholder={t('signup.accountInfo.emailPlaceholder')}
                  placeholderTextColor="#9ca3af"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  textContentType="emailAddress"
                />
              </View>

              {/* Using the reusable PhoneInput component */}
              <PhoneInput
                countryCode={formData.countryCode}
                phoneNumber={formData.phone}
                onCountryCodeChange={handleCountryCodeChange}
                onPhoneNumberChange={handlePhoneNumberChange}
                label={t('signup.accountInfo.phone')}
                placeholder={t('signup.accountInfo.phonePlaceholder')}
                required={true}
                error={phoneError}
                testID="signup-phone-input"
              />

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('signup.accountInfo.password')} *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.password}
                  onChangeText={text => updateFormData('password', text)}
                  placeholder={t('signup.accountInfo.passwordPlaceholder')}
                  placeholderTextColor="#9ca3af"
                  secureTextEntry
                  textContentType="newPassword"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('signup.accountInfo.confirmPassword')} *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.confirmPassword}
                  onChangeText={text => updateFormData('confirmPassword', text)}
                  placeholder={t('signup.accountInfo.confirmPasswordPlaceholder')}
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
                <Text style={styles.responsiveButtonText}>{t('signup.nextButton')}</Text>
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
              <Text style={styles.cardTitle}>{t('signup.companyInfo.title')}</Text>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('signup.companyInfo.country')} *</Text>
                <CustomDropdown
                  options={getCountries()}
                  selectedValue={formData.country}
                  onSelect={value => updateFormData('country', value)}
                  placeholder={t('signup.companyInfo.countryPlaceholder')}
                  style={styles.picker}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('signup.companyInfo.company')} *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.company}
                  onChangeText={text => updateFormData('company', text)}
                  placeholder={t('signup.companyInfo.companyPlaceholder')}
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="words"
                  textContentType="organizationName"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('signup.companyInfo.role')} *</Text>
                <CustomDropdown
                  options={getRoles()}
                  selectedValue={formData.role}
                  onSelect={value => updateFormData('role', value)}
                  placeholder={t('signup.companyInfo.rolePlaceholder')}
                  style={styles.picker}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('signup.companyInfo.businessType')} *</Text>
                <CustomDropdown
                  options={getBusinessTypes()}
                  selectedValue={formData.businessType}
                  onSelect={value => updateFormData('businessType', value)}
                  placeholder={t('signup.companyInfo.businessTypePlaceholder')}
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
                  <Text style={styles.responsiveSecondaryButtonText}>{t('signup.backButton')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.responsiveButton, styles.previewButton]}
                  onPress={handleNext}
                  activeOpacity={0.8}
                >
                  <Text style={styles.responsiveButtonText}>{t('signup.previewButton')}</Text>
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
              <Text style={styles.cardTitle}>{t('signup.preview.title')}</Text>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.previewContainer}>
                {[
                  { label: t('signup.preview.firstName'), value: formData.firstName },
                  { label: t('signup.preview.lastName'), value: formData.lastName },
                  { label: t('signup.preview.email'), value: formData.email },
                  { label: t('signup.preview.phone'), value: getCompletePhoneNumber(formData.countryCode, formData.phone) },
                  { label: t('signup.preview.country'), value: formData.country },
                  { label: t('signup.preview.company'), value: formData.company },
                  { label: t('signup.preview.role'), value: formData.role },
                  { label: t('signup.preview.businessType'), value: formData.businessType },
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
                  <Text style={styles.responsiveSecondaryButtonText}>{t('signup.editButton')}</Text>
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
                        {t('signup.submitting')}
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.responsiveButtonText}>{t('signup.submitButton')}</Text>
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
            <Text style={styles.headerText}>{t('signup.title')}</Text>
            <Text style={styles.subtitleText}>
              {userType === 'buyer'
                ? t('signup.userType.buyerDescription')
                : t('signup.userType.sellerDescription')}
            </Text>
          </View>

          {/* Navigation Info - Show if user came from listing submission */}
          {(fromScreen || originalPendingNavigation) && (
            <View style={styles.pendingInfo}>
              <Icon name="info" size={16} color="#3b82f6" />
              <Text style={styles.pendingText}>
                {t('signup.returnAfterSignup', { defaultValue: 'You will return to your listing after signing up' })}
              </Text>
            </View>
          )}

          <UserTypeSelector />
          <ProgressIndicator />

          <View style={styles.formContainer}>{renderStep()}</View>

          <TouchableOpacity
            style={styles.loginPrompt}
            onPress={handleNavigateToLogin}
          >
            <Text style={styles.loginText}>{t('signup.loginPrompt')}</Text>
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
    fontFamily: FONTS.semiBold,
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
    fontFamily: FONTS.bold,
    color: '#1f2937',
    marginBottom: scale(8),
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: scaleFont(14),
    fontFamily: FONTS.regular,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: scaleHeight(20),
    paddingHorizontal: scale(16),
  },
  // Navigation Info
  pendingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    padding: scale(12),
    borderRadius: scale(8),
    marginBottom: scale(16),
    gap: scale(8),
  },
  pendingText: {
    flex: 1,
    fontSize: scaleFont(14),
    color: '#1e40af',
    fontFamily: FONTS.regular,
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
    fontFamily: FONTS.semiBold,
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
    fontFamily: FONTS.medium,
    color: '#9ca3af',
    textAlign: 'center',
  },
  activeLabel: {
    color: '#6366f1',
    fontFamily: FONTS.semiBold,
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
    fontFamily: FONTS.semiBold,
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
    fontFamily: FONTS.semiBold,
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
    fontFamily: FONTS.regular,
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
    fontFamily: FONTS.medium,
    color: '#6b7280',
    flex: 1,
  },
  previewValue: {
    fontSize: scaleFont(14),
    fontFamily: FONTS.regular,
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
    fontFamily: FONTS.medium,
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
    fontFamily: FONTS.bold,
    letterSpacing: 0.5,
  },
  responsiveSecondaryButtonText: {
    color: '#64748b',
    fontSize: scaleFont(17),
    fontFamily: FONTS.semiBold,
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