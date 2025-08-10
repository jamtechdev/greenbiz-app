import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  StatusBar,
  Platform,
  ActivityIndicator,
  Dimensions,
  Alert,
  KeyboardAvoidingView,
  BackHandler,
  RefreshControl,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Feather';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import BottomNav from '../../../components/BottomNavbar';
import LanguageSelector from '../../../components/LanguageSelector';
import { useAppContext } from '../../../_customContext/AppProvider';
import PhoneInput, {
  getCompletePhoneNumber,
} from '../../../components/PhoneInput';
import { apiService } from '../../../api/axiosConfig';
import { useCustomAlert } from '../../../hook/useCustomAlert';
import CustomAlert from '../../../components/CustomAlert';
import {
  launchImageLibrary,
  ImageLibraryOptions,
  Asset,
} from 'react-native-image-picker';
import {
  selectCurrentLanguage,
  selectIsLanguageInitialized 
} from '../../../store/slices/languageSlice';

// Enhanced responsive utilities
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Device type detection
const isTablet = screenWidth >= 768;
const isSmallDevice = screenWidth < 375;
const isLargeDevice = screenWidth > 414;

// Enhanced scaling function
const scale = (size) => {
  const baseWidth = 375; // iPhone X/11/12 base width
  const scaleFactor = screenWidth / baseWidth;
  const newSize = size * scaleFactor;

  // Apply boundaries
  if (isSmallDevice) return Math.max(newSize * 0.9, size * 0.85);
  if (isTablet) return Math.min(newSize, size * 1.3);
  return newSize;
};

const scaleFont = (size) => {
  const scaledSize = scale(size);
  // Font boundaries for readability
  return Math.max(Math.min(scaledSize, size * 1.2), size * 0.8);
};

const scaleHeight = (size) => {
  const baseHeight = 812; // iPhone X/11/12 base height
  const scaleFactor = screenHeight / baseHeight;
  return size * scaleFactor;
};

const scaleWidth = (size) => scale(size);

// Responsive spacing
const spacing = {
  xs: scale(4),
  sm: scale(8),
  md: scale(16),
  lg: scale(24),
  xl: scale(32),
  xxl: scale(40),
};

// Responsive dimensions
const dimensions = {
  borderRadius: {
    sm: scale(8),
    md: scale(12),
    lg: scale(16),
    xl: scale(20),
  },
  avatar: {
    size: isTablet ? scale(100) : scale(80),
    borderRadius: isTablet ? scale(50) : scale(40),
  },
  input: {
    height: isTablet ? scaleHeight(56) : scaleHeight(48),
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  header: {
    height: isTablet ? scaleHeight(120) : scaleHeight(100),
    paddingHorizontal: spacing.lg,
  },
};

export default function ProfileScreen({ navigation }) {
  const { t } = useTranslation();
  const { showOverlay, setShowOverlay } = useAppContext();
  const { alertConfig, hideAlert, showSuccess, showError, showConfirm } =
    useCustomAlert();

  // Redux selectors
  const currentLanguage = useSelector(selectCurrentLanguage);
  const isLanguageInitialized = useSelector(selectIsLanguageInitialized);

  const scrollViewRef = useRef(null);
  const mountedRef = useRef(true);

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const initialForm = {
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    billing_phone: '',
    billing_country: '',
    company: '',
    role: '',
    business_type: '',
    user_type: '',
    phoneCountryCode: '+61',
    phoneNumber: '',
    profile_picture_uri: '',
    profile_picture_url: '',
    profile_img: '',
    profile_picture_file: undefined,
  };
  const [form, setForm] = useState(initialForm);
  const [originalForm, setOriginalForm] = useState(initialForm);

  // Show loading if language is not initialized
  if (!isLanguageInitialized) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#00c0a2" />
        <Text style={styles.loadingText}>Initializing...</Text>
      </View>
    );
  }

  // Memoized display values
  const initials = useMemo(() => {
    const f = form.first_name.charAt(0) || '';
    const l = form.last_name.charAt(0) || '';
    return (f + l).toUpperCase() || 'U';
  }, [form.first_name, form.last_name]);

  const fullName = useMemo(() => {
    return `${form.first_name} ${form.last_name}`.trim() || 'User';
  }, [form.first_name, form.last_name]);

  const hasChanges = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(originalForm),
    [form, originalForm],
  );

  // Profile image rendering with priority order
  const renderProfileImage = useCallback(() => {
    let imageSource = null;

    if (form.profile_picture_uri && form.profile_picture_uri.trim()) {
      // Newly selected image takes highest priority
      imageSource = { uri: form.profile_picture_uri.trim() };
    } else if (form.profile_img && form.profile_img.trim()) {
      // API response field (most common)
      imageSource = { uri: form.profile_img.trim() };
    } else if (form.profile_picture_url && form.profile_picture_url.trim()) {
      // Alternative field name
      imageSource = { uri: form.profile_picture_url.trim() };
    }

    if (imageSource && imageSource.uri) {
      return (
        <Image source={imageSource} style={styles.avatar} resizeMode="cover" />
      );
    }

    // Fallback to initials
    return (
      <View style={[styles.avatar, styles.avatarPlaceholder]}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
    );
  }, [
    form.profile_picture_uri,
    form.profile_img,
    form.profile_picture_url,
    initials,
  ]);

  const pickImage = useCallback(async () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 800,
      maxHeight: 800,
    };
    const result = await launchImageLibrary(options);
    if (result.didCancel || !result.assets?.length) return;
    const asset = result.assets[0];

    setForm(prev => ({
      ...prev,
      profile_picture_uri: asset.uri || '',
      profile_picture_file: asset,
    }));
  }, []);

  // Prevent state updates after unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Handle Android back → discard edits if needed
  useEffect(() => {
    const backAction = () => {
      if (editing && hasChanges) {
        onCancel();
        return true;
      }
      return false;
    };
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );
    return () => backHandler.remove();
  }, [editing, hasChanges]);

  const COUNTRY_CODES = [
    { code: '+93', country: 'Afghanistan', flag: '🇦🇫' },
    { code: '+61', country: 'Australia', flag: '🇦🇺' },
    { code: '+880', country: 'Bangladesh', flag: '🇧🇩' },
    { code: '+855', country: 'Cambodia', flag: '🇰🇭' },
    { code: '+1', country: 'Canada', flag: '🇨🇦' },
    { code: '+56', country: 'Chile', flag: '🇨🇱' },
    { code: '+86', country: 'China', flag: '🇨🇳' },
    { code: '+45', country: 'Denmark', flag: '🇩🇰' },
    { code: '+33', country: 'France', flag: '🇫🇷' },
    { code: '+49', country: 'Germany', flag: '🇩🇪' },
    { code: '+852', country: 'Hong Kong', flag: '🇭🇰' },
    { code: '+91', country: 'India', flag: '🇮🇳' },
    { code: '+62', country: 'Indonesia', flag: '🇮🇩' },
    { code: '+81', country: 'Japan', flag: '🇯🇵' },
    { code: '+853', country: 'Macao', flag: '🇲🇴' },
    { code: '+60', country: 'Malaysia', flag: '🇲🇾' },
    { code: '+52', country: 'Mexico', flag: '🇲🇽' },
    { code: '+64', country: 'New Zealand', flag: '🇳🇿' },
    { code: '+92', country: 'Pakistan', flag: '🇵🇰' },
    { code: '+82', country: 'South Korea', flag: '🇰🇷' },
    { code: '+886', country: 'Taiwan', flag: '🇹🇼' },
    { code: '+66', country: 'Thailand', flag: '🇹🇭' },
    { code: '+84', country: 'Vietnam', flag: '🇻🇳' },
    { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
    { code: '+1', country: 'United States', flag: '🇺🇸' },
  ];

  // Fetch profile from API
  const fetchUserProfile = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const { data } = await apiService.getUser();
        if (data.success) {
          const u = data.data;
          const fullPhone = u.billing_phone || '';

          // Enhanced phone parsing logic
          let phoneCountryCode = '+61'; // default
          let phoneNumber = '';

          if (fullPhone) {
            const cleanPhone = fullPhone.replace(/[\s\-\(\)]/g, '');
            const matchingCountries = COUNTRY_CODES.filter(country =>
              cleanPhone.startsWith(country.code),
            ).sort((a, b) => b.code.length - a.code.length);

            if (matchingCountries.length > 0) {
              const bestMatch = matchingCountries[0];
              phoneCountryCode = bestMatch.code;
              phoneNumber = cleanPhone.substring(bestMatch.code.length);
            } else {
              const match = cleanPhone.match(/^(\+\d{1,4})(.*)$/);
              if (match) {
                phoneCountryCode = match[1];
                phoneNumber = match[2];
              }
            }
          }

          const newForm = {
            first_name: u.first_name || '',
            last_name: u.last_name || '',
            username: u.username || '',
            email: u.email || u.user_email || '',
            billing_phone: fullPhone,
            billing_country: u.billing_country || '',
            company: u.company || u.greenbidz_company || '',
            role: u.role || u.greenbidz_role || '',
            business_type: u.business_type || u.greenbidz_business_type || '',
            user_type: u.user_type || u.greenbidz_user_type || '',
            phoneCountryCode,
            phoneNumber,
            profile_picture_uri: '',
            profile_img: u.profile_img || '',
            profile_picture_url:
              u.profile_picture || u.profile_picture_url || u.avatar_url || '',
            profile_picture_file: undefined,
          };

          if (mountedRef.current) {
            setForm(newForm);
            setOriginalForm(newForm);
          }
        } else {
          throw new Error('Failed to fetch profile');
        }
      } catch (err) {
        if (err.response?.status === 401) {
          await AsyncStorage.multiRemove([
            'userToken',
            'isLoggedIn',
            'userData',
          ]);
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          return;
        }
        showError({
          title: t('profile.updateFailed'),
          message:
            err.response?.data?.message ||
            'Could not load your profile. Please try again.',
        });
      } finally {
        if (mountedRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [navigation, showError, t],
  );

  // run on mount
  useEffect(() => {
    fetchUserProfile();
  }, []);

  // re-fetch on focus
  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      if (!editing) fetchUserProfile();
    });
    return unsub;
  }, [navigation, editing, fetchUserProfile]);

  const onChange = useCallback((key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  }, []);

  const onCancel = useCallback(() => {
    if (hasChanges) {
      Alert.alert(
        t('profile.discardChanges'),
        t('profile.discardChangesMessage'),
        [
          { text: t('profile.keepEditing'), style: 'cancel' },
          {
            text: t('profile.discard'),
            style: 'destructive',
            onPress: () => {
              setForm(originalForm);
              setEditing(false);
            },
          },
        ],
      );
    } else {
      setEditing(false);
    }
  }, [hasChanges, originalForm, t]);

  // simple validation
  const validateForm = useCallback(() => {
    const errs = [];
    if (!form.first_name.trim()) errs.push(t('profile.firstNameRequired'));
    if (!form.last_name.trim()) errs.push(t('profile.lastNameRequired'));
    if (!form.username.trim()) errs.push(t('profile.usernameRequired'));
    if (!form.email.trim()) errs.push(t('profile.emailRequired'));
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (form.email && !emailRx.test(form.email.trim()))
      errs.push(t('profile.validEmailRequired'));
    if (
      form.phoneNumber &&
      form.phoneNumber.length > 0 &&
      form.phoneNumber.length < 6
    )
      errs.push(t('profile.phoneMinLength'));
    return { isValid: errs.length === 0, errors: errs };
  }, [form, t]);

  const onSave = useCallback(async () => {
    const { isValid, errors } = validateForm();
    if (!isValid) {
      showError({ title: t('profile.validation'), message: errors.join('\n') });
      return;
    }

    try {
      setSaving(true);

      // Create FormData with the EXACT field names from your curl command
      const formData = new FormData();

      // Add fields with the exact names your API expects
      formData.append('first_name', form.first_name.trim());
      formData.append('last_name', form.last_name.trim());
      formData.append('user_email', form.email.trim().toLowerCase());
      formData.append(
        'billing_phone',
        form.phoneNumber
          ? getCompletePhoneNumber(form.phoneCountryCode, form.phoneNumber)
          : '',
      );
      formData.append('billing_country', form.billing_country.trim());
      formData.append('greenbidz_company', form.company.trim());
      formData.append('greenbidz_role', form.role.trim());
      formData.append('greenbidz_business_type', form.business_type.trim());
      formData.append('greenbidz_user_type', form.user_type.trim());

      // Add profile picture if a new one was selected
      if (form.profile_picture_file && form.profile_picture_file.uri) {
        const { uri, fileName, type, fileSize } = form.profile_picture_file;

        // Validate file size (max 5MB)
        if (fileSize && fileSize > 5 * 1024 * 1024) {
          showError({
            title: t('profile.fileTooLarge'),
            message: t('profile.imageSizeLimit'),
          });
          return;
        }

        // Create file object for FormData
        const fileExtension =
          fileName?.split('.').pop()?.toLowerCase() ||
          uri.split('.').pop()?.toLowerCase() ||
          'jpg';
        const mimeType =
          type || `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`;

        const fileObject = {
          uri: uri,
          name: fileName || `profile_${Date.now()}.${fileExtension}`,
          type: mimeType,
        };

        formData.append('profile_picture', fileObject);
      }

      // Use the updateProfile method
      const res = await apiService.updateProfile(formData);

      if (!res.data.success) {
        throw new Error(res.data.message || 'Update failed');
      }

      // Update form state with saved data from server response
      const savedData = res.data.data || {};
      const updatedForm = {
        ...form,
        billing_phone: form.phoneNumber
          ? getCompletePhoneNumber(form.phoneCountryCode, form.phoneNumber)
          : '',
        // Update image sources from server response
        profile_img:
          savedData.profile_img ||
          savedData.profile_picture ||
          form.profile_img,
        profile_picture_url:
          savedData.profile_picture_url ||
          savedData.avatar_url ||
          form.profile_picture_url,
        profile_picture_uri: '', // Clear local URI after successful upload
        profile_picture_file: undefined, // Clear file after successful upload
      };

      // Update both current and original form to reflect saved state
      setOriginalForm(updatedForm);
      setForm(updatedForm);
      setEditing(false);

      // Scroll to top to show updated profile
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });

      showSuccess({
        title: t('profile.profileUpdated'),
        message: t('profile.profileUpdatedMessage'),
      });

      // Force a fresh fetch from server to ensure we have the latest data
      setTimeout(() => {
        fetchUserProfile(true);
      }, 500);
    } catch (err) {
      let msg = 'Could not update profile.';

      if (err.response?.status === 409) {
        msg = t('profile.usernameEmailInUse');
      } else if (err.response?.status === 413) {
        msg = t('profile.imageTooLarge');
      } else if (err.response?.status === 415) {
        msg = t('profile.unsupportedImageFormat');
      } else if (err.response?.status === 422) {
        msg =
          err.response?.data?.message ||
          t('profile.validationError');
      } else if (err.response?.data?.message) {
        msg = err.response.data.message;
      } else if (err.message?.includes('No changes detected')) {
        msg = t('profile.noChangesDetected');
      }

      showError({ title: t('profile.updateFailed'), message: msg });
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  }, [
    form,
    validateForm,
    showError,
    showSuccess,
    getCompletePhoneNumber,
    fetchUserProfile,
    t,
  ]);

  const handleLogout = useCallback(() => {
    showConfirm({
      title: t('profile.signOut'),
      message: t('profile.signOutConfirm'),
      confirmText: t('profile.signOut'),
      destructive: true,
      onConfirm: async () => {
        await AsyncStorage.multiRemove([
          'userToken',
          'isLoggedIn',
          'userData',
          'userPreferences',
        ]);
        mountedRef.current &&
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      },
    });
  }, [showConfirm, navigation, t]);

  const onRefresh = useCallback(() => {
    if (!editing) fetchUserProfile(true);
  }, [editing, fetchUserProfile]);

  const renderFormField = useCallback(
    (
      label,
      key,
      value,
      editable,
      keyboardType = 'default',
      multiline = false,
      maxLength,
    ) => (
      <View style={styles.fieldContainer} key={key}>
        <Text style={styles.fieldLabel}>
          {label}
          {['first_name', 'last_name', 'username', 'email'].includes(key) && (
            <Text style={styles.requiredIndicator}> {t('profile.required')}</Text>
          )}
        </Text>
        {editable ? (
          <View style={styles.inputWrapper}>
            <TextInput
              style={[
                styles.fieldInput,
                multiline && styles.multilineInput,
                saving && styles.disabledInput,
              ]}
              value={value}
              onChangeText={txt => onChange(key, txt)}
              keyboardType={keyboardType}
              placeholder={`${t(`profile.enter${key.charAt(0).toUpperCase() + key.slice(1).replace('_', '')}`)}`}
              placeholderTextColor="#9ca3af"
              multiline={multiline}
              numberOfLines={multiline ? 3 : 1}
              editable={!saving}
              autoCapitalize={
                keyboardType === 'email-address' ? 'none' : 'words'
              }
              autoCorrect={false}
              maxLength={maxLength}
            />
            {maxLength && (
              <Text style={styles.characterCount}>
                {value.length}/{maxLength}
              </Text>
            )}
          </View>
        ) : (
          <View style={styles.fieldDisplay}>
            <Text style={[styles.fieldValue, !value && styles.emptyValue]}>
              {value || t('profile.notProvided')}
            </Text>
          </View>
        )}
      </View>
    ),
    [onChange, saving, t],
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#00c0a2" />
        <Text style={styles.loadingText}>{t('profile.loadingProfile')}</Text>
      </View>
    );
  }

  return (
    <>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <StatusBar barStyle="light-content" backgroundColor="#00c0a2" />

        {/* Enhanced Header */}
        <View style={styles.headerContainer}>
          <View style={styles.headerGradient}>
            <SafeAreaView>
              <View style={styles.headerTop}>
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  style={styles.backButton}
                  activeOpacity={0.7}
                >
                  <Icon name="arrow-left" size={scaleFont(20)} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerTextContainer}>
                  <Text style={styles.headerTitle}>{t('profile.myProfile')}</Text>
                  <Text style={styles.headerSubtitle}>
                    {editing ? t('profile.editDetails') : t('profile.manageAccount')}
                  </Text>
                </View>

                <View style={styles.headerActions}>
                  {/* Language Selector */}
                  <LanguageSelector 
                    size="small"
                    buttonStyle={styles.profileLanguageButton}
                  />

                  {editing ? (
                    <View style={styles.editActions}>
                      <TouchableOpacity
                        onPress={onCancel}
                        disabled={saving}
                        style={[styles.actionButton, styles.cancelButton]}
                        activeOpacity={0.7}
                      >
                        <Icon name="x" size={scaleFont(18)} color="#fff" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={onSave}
                        disabled={saving || !hasChanges}
                        style={[
                          styles.actionButton,
                          styles.saveButton,
                          (!hasChanges || saving) && styles.disabledButton,
                        ]}
                        activeOpacity={0.7}
                      >
                        {saving ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Icon name="check" size={scaleFont(18)} color="#fff" />
                        )}
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => setEditing(true)}
                      style={[styles.actionButton, styles.editButton]}
                      activeOpacity={0.7}
                    >
                      <Icon name="edit-3" size={scaleFont(18)} color="#fff" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </SafeAreaView>
          </View>
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#00c0a2"
              colors={['#00c0a2']}
            />
          }
        >
          {/* Enhanced Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.avatarSection}>
              <View style={styles.avatarContainer}>
                <TouchableOpacity
                  onPress={editing ? pickImage : undefined}
                  disabled={!editing || saving}
                  activeOpacity={editing ? 0.7 : 1}
                >
                  {renderProfileImage()}
                  {editing && (
                    <View style={styles.avatarEditButton}>
                      <Icon
                        name="camera"
                        size={scaleFont(14)}
                        color="#00c0a2"
                      />
                    </View>
                  )}
                </TouchableOpacity>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{fullName}</Text>
                <Text style={styles.userEmail}>{form.email}</Text>
                {form.role && <Text style={styles.userRole}>{form.role}</Text>}
                <View style={styles.statusBadge}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>{t('profile.active')}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Enhanced Form Sections */}
          <View style={styles.formSection}>
            <View style={styles.sectionHeader}>
              <Icon name="user" size={scaleFont(18)} color="#00c0a2" />
              <Text style={styles.sectionTitle}>{t('profile.personalInformation')}</Text>
            </View>
            <View style={styles.formGrid}>
              {isTablet ? (
                // Tablet: Two columns
                <View style={styles.tabletRow}>
                  {renderFormField(
                    t('profile.firstName'),
                    'first_name',
                    form.first_name,
                    editing,
                    'default',
                    false,
                    50,
                  )}
                  {renderFormField(
                    t('profile.lastName'),
                    'last_name',
                    form.last_name,
                    editing,
                    'default',
                    false,
                    50,
                  )}
                </View>
              ) : (
                // Mobile: Single column
                <>
                  {renderFormField(
                    t('profile.firstName'),
                    'first_name',
                    form.first_name,
                    editing,
                    'default',
                    false,
                    50,
                  )}
                  {renderFormField(
                    t('profile.lastName'),
                    'last_name',
                    form.last_name,
                    editing,
                    'default',
                    false,
                    50,
                  )}
                </>
              )}
              {renderFormField(
                t('profile.username'),
                'username',
                form.username,
                editing,
                'default',
                false,
                30,
              )}
              {renderFormField(
                t('profile.emailAddress'),
                'email',
                form.email,
                editing,
                'email-address',
                false,
                100,
              )}
            </View>
          </View>

          {/* Enhanced Contact Information */}
          <View style={styles.formSection}>
            <View style={styles.sectionHeader}>
              <Icon name="phone" size={scaleFont(18)} color="#00c0a2" />
              <Text style={styles.sectionTitle}>{t('profile.contactInformation')}</Text>
            </View>
            <View style={styles.formGrid}>
              <PhoneInput
                countryCode={form.phoneCountryCode}
                phoneNumber={form.phoneNumber}
                onCountryCodeChange={code => onChange('phoneCountryCode', code)}
                onPhoneNumberChange={num => onChange('phoneNumber', num)}
                label={t('profile.phoneNumber')}
                placeholder={t('profile.enterPhoneNumber')}
                disabled={!editing || saving}
                showCountryName={false}
                maxLength={15}
                showLabel={true}
              />
              {renderFormField(
                t('profile.country'),
                'billing_country',
                form.billing_country,
                editing,
                'default',
                false,
                50,
              )}
            </View>
          </View>

          {/* Enhanced Business Information */}
          <View style={styles.formSection}>
            <View style={styles.sectionHeader}>
              <Icon name="briefcase" size={scaleFont(18)} color="#00c0a2" />
              <Text style={styles.sectionTitle}>{t('profile.businessInformation')}</Text>
            </View>
            <View style={styles.formGrid}>
              {renderFormField(
                t('profile.company'),
                'company',
                form.company,
                editing,
                'default',
                false,
                100,
              )}
              {isTablet ? (
                <View style={styles.tabletRow}>
                  {renderFormField(
                    t('profile.role'),
                    'role',
                    form.role,
                    editing,
                    'default',
                    false,
                    50,
                  )}
                  {renderFormField(
                    t('profile.businessType'),
                    'business_type',
                    form.business_type,
                    editing,
                    'default',
                    false,
                    50,
                  )}
                </View>
              ) : (
                <>
                  {renderFormField(
                    t('profile.role'),
                    'role',
                    form.role,
                    editing,
                    'default',
                    false,
                    50,
                  )}
                  {renderFormField(
                    t('profile.businessType'),
                    'business_type',
                    form.business_type,
                    editing,
                    'default',
                    false,
                    50,
                  )}
                </>
              )}
            </View>
          </View>

          {/* Enhanced Account Settings */}
          <View style={styles.actionsSection}>
            <View style={styles.sectionHeader}>
              <Icon name="settings" size={scaleFont(18)} color="#ef4444" />
              <Text style={[styles.sectionTitle, { color: '#ef4444' }]}>
                {t('profile.accountSettings')}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <View style={styles.logoutIconContainer}>
                <Icon name="log-out" size={scaleFont(18)} color="#ef4444" />
              </View>
              <Text style={styles.logoutText}>{t('profile.signOut')}</Text>
              <Icon name="chevron-right" size={scaleFont(16)} color="#ef4444" />
            </TouchableOpacity>
          </View>

          {editing && hasChanges && (
            <View style={styles.savePrompt}>
              <Icon name="info" size={scaleFont(16)} color="#f59e0b" />
              <Text style={styles.savePromptText}>
                {t('profile.unsavedChanges')}
              </Text>
            </View>
          )}
        </ScrollView>

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
      </KeyboardAvoidingView>
      <BottomNav setShowOverlay={setShowOverlay} navigation={navigation} />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: scaleFont(16),
    color: '#6b7280',
    fontWeight: '500',
  },

  // Enhanced Header Styles
  headerContainer: {
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scaleHeight(4) },
    shadowOpacity: 0.15,
    shadowRadius: scaleHeight(8),
    elevation: 8,
  },
  headerGradient: {
    backgroundColor: '#00c0a2',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
    paddingBottom: spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: scaleHeight(64),
  },
  backButton: {
    padding: spacing.sm,
    marginRight: spacing.sm,
    borderRadius: dimensions.borderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  headerTitle: {
    fontSize: scaleFont(isTablet ? 28 : 24),
    color: '#fff',
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: scaleFont(14),
    color: 'rgba(255,255,255,0.85)',
    marginTop: spacing.xs,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  profileLanguageButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderColor: 'rgba(255,255,255,0.3)',
  },
  editActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    padding: spacing.sm,
    borderRadius: dimensions.borderRadius.lg,
    minWidth: scale(40),
    minHeight: scale(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  cancelButton: {
    backgroundColor: 'rgba(239,68,68,0.2)',
  },
  saveButton: {
    backgroundColor: 'rgba(34,197,94,0.2)',
  },
  disabledButton: {
    opacity: 0.5,
  },

  // Enhanced ScrollView Styles
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: scaleHeight(160), // Account for bottom nav
  },

  // Enhanced Profile Card Styles
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: dimensions.borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scaleHeight(6) },
    shadowOpacity: 0.1,
    shadowRadius: scaleHeight(15),
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,192,162,0.1)',
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: spacing.lg,
  },
  avatar: {
    width: dimensions.avatar.size,
    height: dimensions.avatar.size,
    borderRadius: dimensions.avatar.borderRadius,
    backgroundColor: '#00c0a2',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00c0a2',
    shadowOffset: { width: 0, height: scaleHeight(4) },
    shadowOpacity: 0.3,
    shadowRadius: scaleHeight(8),
    elevation: 6,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarPlaceholder: {
    backgroundColor: '#00c0a2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: scaleFont(isTablet ? 32 : 28),
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 1,
  },
  avatarEditButton: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#fff',
    borderRadius: scale(16),
    width: scale(32),
    height: scale(32),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#f3f4f6',
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: scaleFont(isTablet ? 26 : 22),
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: spacing.xs,
    letterSpacing: -0.5,
  },
  userEmail: {
    fontSize: scaleFont(15),
    color: '#6b7280',
    marginBottom: spacing.xs,
    fontWeight: '500',
  },
  userRole: {
    fontSize: scaleFont(13),
    color: '#00c0a2',
    fontWeight: '600',
    textTransform: 'capitalize',
    marginBottom: spacing.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34,197,94,0.1)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: scale(12),
    alignSelf: 'flex-start',
  },
  statusDot: {
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
    backgroundColor: '#22c55e',
    marginRight: spacing.xs,
  },
  statusText: {
    fontSize: scaleFont(12),
    color: '#22c55e',
    fontWeight: '600',
  },

  // Enhanced Form Section Styles
  formSection: {
    backgroundColor: '#fff',
    borderRadius: dimensions.borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scaleHeight(3) },
    shadowOpacity: 0.08,
    shadowRadius: scaleHeight(12),
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  sectionTitle: {
    fontSize: scaleFont(18),
    fontWeight: '700',
    color: '#1f2937',
    marginLeft: spacing.sm,
    letterSpacing: -0.3,
  },
  formGrid: {
    gap: spacing.lg,
  },
  tabletRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },

  // Enhanced Field Styles
  fieldContainer: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: scaleFont(14),
    fontWeight: '600',
    color: '#374151',
    marginBottom: spacing.sm,
    letterSpacing: -0.1,
  },
  requiredIndicator: {
    color: '#ef4444',
    fontWeight: '700',
  },
  inputWrapper: {
    position: 'relative',
  },
  fieldInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: dimensions.borderRadius.md,
    paddingHorizontal: dimensions.input.paddingHorizontal,
    paddingVertical: dimensions.input.paddingVertical,
    fontSize: scaleFont(16),
    color: '#1f2937',
    minHeight: dimensions.input.height,
    fontWeight: '500',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  multilineInput: {
    minHeight: scaleHeight(90),
    textAlignVertical: 'top',
    paddingTop: spacing.md,
  },
  disabledInput: {
    backgroundColor: '#f3f4f6',
    opacity: 0.7,
    borderColor: '#d1d5db',
  },
  characterCount: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.xs,
    fontSize: scaleFont(11),
    color: '#9ca3af',
    fontWeight: '500',
  },
  fieldDisplay: {
    backgroundColor: '#f9fafb',
    borderRadius: dimensions.borderRadius.md,
    paddingHorizontal: dimensions.input.paddingHorizontal,
    paddingVertical: dimensions.input.paddingVertical,
    justifyContent: 'center',
    minHeight: dimensions.input.height,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  fieldValue: {
    fontSize: scaleFont(16),
    color: '#1f2937',
    fontWeight: '500',
  },
  emptyValue: {
    color: '#9ca3af',
    fontStyle: 'italic',
    fontWeight: '400',
  },

  // Enhanced Actions Section
  actionsSection: {
    backgroundColor: '#fff',
    borderRadius: dimensions.borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scaleHeight(3) },
    shadowOpacity: 0.08,
    shadowRadius: scaleHeight(12),
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.1)',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderRadius: dimensions.borderRadius.md,
    backgroundColor: 'rgba(239,68,68,0.05)',
  },
  logoutIconContainer: {
    width: scale(48),
    height: scale(48),
    borderRadius: scale(24),
    backgroundColor: 'rgba(239,68,68,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  logoutText: {
    flex: 1,
    fontSize: scaleFont(16),
    color: '#ef4444',
    fontWeight: '600',
    letterSpacing: -0.2,
  },

  // Enhanced Save Prompt
  savePrompt: {
    backgroundColor: '#fefce8',
    borderRadius: dimensions.borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1.5,
    borderColor: '#f59e0b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  savePromptText: {
    fontSize: scaleFont(14),
    color: '#92400e',
    fontWeight: '600',
    textAlign: 'center',
    marginLeft: spacing.sm,
  },
});