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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Feather';
import BottomNav from '../../../components/BottomNavbar';
import { useAppContext } from '../../../_customContext/AppProvider';
import PhoneInput, { getCompletePhoneNumber } from '../../../components/PhoneInput';
import { apiService } from '../../../api/axiosConfig';
import { useCustomAlert } from '../../../hook/useCustomAlert';
import CustomAlert from '../../../components/CustomAlert';
import { scaleWidth, scaleHeight, scaleFont } from '../../../utils/resposive';

const { width, height } = Dimensions.get('window');

interface FormData {
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  billing_phone: string;
  billing_country: string;
  company: string;
  role: string;
  business_type: string;
  user_type: string;
  phoneCountryCode: string;
  phoneNumber: string;
}

interface ProfileScreenProps {
  navigation: any;
}

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  const { showOverlay, setShowOverlay } = useAppContext();
  const { alertConfig, hideAlert, showSuccess, showError, showConfirm } =
    useCustomAlert();

  const scrollViewRef = useRef<ScrollView>(null);
  const mountedRef = useRef(true);

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const initialForm: FormData = {
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
  };
  const [form, setForm] = useState<FormData>(initialForm);
  const [originalForm, setOriginalForm] = useState<FormData>(initialForm);

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
    [form, originalForm]
  );

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
      backAction
    );
    return () => backHandler.remove();
  }, [editing, hasChanges, onCancel]);

  // Fetch profile from API
  const fetchUserProfile = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const { data } = await apiService.getUser();
        if (data.success) {
          const u = data.data;
          const full = u.billing_phone || '';
          // parse: country code + rest
          const m = full.match(/^(\+\d{1,4})\s*(.*)$/);
          const phoneCountryCode = m ? m[1] : '+61';
          const phoneNumber = m ? m[2].trim() : '';

          const newForm: FormData = {
            first_name: u.first_name || '',
            last_name: u.last_name || '',
            username: u.username || '',
            email: u.email || '',
            billing_phone: full,
            billing_country: u.billing_country || '',
            company: u.company || '',
            role: u.role || '',
            business_type: u.business_type || '',
            user_type: u.user_type || '',
            phoneCountryCode,
            phoneNumber,
          };
          if (mountedRef.current) {
            setForm(newForm);
            setOriginalForm(newForm);
          }
        } else {
          throw new Error('Failed to fetch profile');
        }
      } catch (err: any) {
        console.error('Fetch error:', err);
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
          title: 'Error',
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
    [navigation, showError]
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

  const onChange = useCallback(
    (key: keyof FormData, value: string) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const onCancel = useCallback(() => {
    if (hasChanges) {
      Alert.alert(
        'Discard Changes',
        'Are you sure you want to discard your changes?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              setForm(originalForm);
              setEditing(false);
            },
          },
        ]
      );
    } else {
      setEditing(false);
    }
  }, [hasChanges, originalForm]);

  // simple validation
  const validateForm = useCallback(() => {
    const errs: string[] = [];
    if (!form.first_name.trim()) errs.push('First name is required');
    if (!form.last_name.trim()) errs.push('Last name is required');
    if (!form.username.trim()) errs.push('Username is required');
    if (!form.email.trim()) errs.push('Email is required');
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (form.email && !emailRx.test(form.email.trim()))
      errs.push('Please enter a valid email');
    if (
      form.phoneNumber &&
      form.phoneNumber.length > 0 &&
      form.phoneNumber.length < 6
    )
      errs.push('Phone must be at least 6 digits');
    return { isValid: errs.length === 0, errors: errs };
  }, [form]);

  const onSave = useCallback(async () => {
    const { isValid, errors } = validateForm();
    if (!isValid) {
      showError({ title: 'Validation', message: errors.join('\n') });
      return;
    }
    try {
      setSaving(true);
      const payload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        username: form.username.trim(),
        email: form.email.trim().toLowerCase(),
        billing_phone: form.phoneNumber
          ? getCompletePhoneNumber(
              form.phoneCountryCode,
              form.phoneNumber
            )
          : '',
        billing_country: form.billing_country.trim(),
        company: form.company.trim(),
        business_type: form.business_type.trim(),
        user_type: form.user_type.trim(),
      };
      const res = await apiService.updateProfile(payload);
      if (!res.data.success)
        throw new Error(res.data.message || 'Update failed');

      const saved: FormData = {
        ...form,
        billing_phone: payload.billing_phone,
      };
      setOriginalForm(saved);
      setForm(saved);
      setEditing(false);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      showSuccess({
        title: 'Saved',
        message: 'Your profile has been updated.',
      });
    } catch (err: any) {
      console.error('Save error:', err);
      let msg = 'Could not update profile.';
      if (err.response?.status === 409)
        msg = 'Username or email already in use.';
      else if (err.response?.data?.message) msg = err.response.data.message;
      showError({ title: 'Error', message: msg });
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  }, [form, validateForm, showError, showSuccess]);

  const handleLogout = useCallback(() => {
    showConfirm({
      title: 'Sign Out',
      message: 'Are you sure?',
      confirmText: 'Sign Out',
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
  }, [showConfirm, navigation]);

  const onRefresh = useCallback(() => {
    if (!editing) fetchUserProfile(true);
  }, [editing, fetchUserProfile]);

  const renderFormField = useCallback(
    (
      label: string,
      key: keyof FormData,
      value: string,
      editable: boolean,
      keyboardType: 'default' | 'email-address' | 'numeric' = 'default',
      multiline = false,
      maxLength?: number
    ) => (
      <View style={styles.fieldContainer} key={key}>
        <Text style={styles.fieldLabel}>
          {label}
          {['first_name', 'last_name', 'username', 'email'].includes(
            key
          ) && <Text style={styles.requiredIndicator}> *</Text>}
        </Text>
        {editable ? (
          <TextInput
            style={[
              styles.fieldInput,
              multiline && styles.multilineInput,
              saving && styles.disabledInput,
            ]}
            value={value}
            onChangeText={(txt) => onChange(key, txt)}
            keyboardType={keyboardType}
            placeholder={`Enter ${label.toLowerCase()}`}
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
        ) : (
          <View style={styles.fieldDisplay}>
            <Text
              style={[styles.fieldValue, !value && styles.emptyValue]}
            >
              {value || 'Not provided'}
            </Text>
          </View>
        )}
      </View>
    ),
    [onChange, saving]
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#00c0a2" />
        <Text style={styles.loadingText}>
          Loading your profile...
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor="#00c0a2"
      />

      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerGradient}>
          <SafeAreaView>
            <View style={styles.headerTop}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backButton}
                activeOpacity={0.7}
              >
                <Icon
                  name="arrow-left"
                  size={scaleFont(20)}
                  color="#fff"
                />
              </TouchableOpacity>
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerTitle}>
                  My Profile
                </Text>
                <Text style={styles.headerSubtitle}>
                  {editing
                    ? 'Edit your details'
                    : 'Manage your account'}
                </Text>
              </View>
              {editing ? (
                <View style={styles.editActions}>
                  <TouchableOpacity
                    onPress={onCancel}
                    disabled={saving}
                    style={styles.actionButton}
                    activeOpacity={0.7}
                  >
                    <Icon
                      name="x"
                      size={scaleFont(20)}
                      color="#fff"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={onSave}
                    disabled={saving || !hasChanges}
                    style={[
                      styles.actionButton,
                      (!hasChanges || saving) &&
                        styles.disabledButton,
                    ]}
                    activeOpacity={0.7}
                  >
                    {saving ? (
                      <ActivityIndicator
                        size="small"
                        color="#fff"
                      />
                    ) : (
                      <Icon
                        name="check"
                        size={scaleFont(20)}
                        color="#fff"
                      />
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => setEditing(true)}
                  style={styles.actionButton}
                  activeOpacity={0.7}
                >
                  <Icon
                    name="edit-3"
                    size={scaleFont(20)}
                    color="#fff"
                  />
                </TouchableOpacity>
              )}
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
          />
        }
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {initials}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{fullName}</Text>
              <Text style={styles.userEmail}>
                {form.email}
              </Text>
              {form.role && (
                <Text style={styles.userRole}>
                  {form.role}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Personal Information */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>
            Personal Information
          </Text>
          <View style={styles.formGrid}>
            {renderFormField(
              'First Name',
              'first_name',
              form.first_name,
              editing,
              'default',
              false,
              50
            )}
            {renderFormField(
              'Last Name',
              'last_name',
              form.last_name,
              editing,
              'default',
              false,
              50
            )}
            {renderFormField(
              'Username',
              'username',
              form.username,
              editing,
              'default',
              false,
              30
            )}
            {renderFormField(
              'Email Address',
              'email',
              form.email,
              editing,
              'email-address',
              false,
              100
            )}
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>
            Contact Information
          </Text>
          <View style={styles.formGrid}>
            {/* Phone Number */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>
                Phone Number
              </Text>
              {editing ? (
                <PhoneInput
                  countryCode={form.phoneCountryCode}
                  phoneNumber={form.phoneNumber}
                  onCountryCodeChange={(code) =>
                    onChange('phoneCountryCode', code)
                  }
                  onPhoneNumberChange={(num) =>
                    onChange('phoneNumber', num)
                  }
                  placeholder="Enter phone number"
                  disabled={saving}
                />
              ) : (
                <View style={styles.fieldDisplay}>
                  <Text
                    style={[
                      styles.fieldValue,
                      !form.billing_phone &&
                        styles.emptyValue,
                    ]}
                  >
                    {form.billing_phone ||
                      'Not provided'}
                  </Text>
                </View>
              )}
            </View>
            {renderFormField(
              'Country',
              'billing_country',
              form.billing_country,
              editing,
              'default',
              false,
              50
            )}
          </View>
        </View>

        {/* Business Information */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>
            Business Information
          </Text>
          <View style={styles.formGrid}>
            {renderFormField(
              'Company',
              'company',
              form.company,
              editing,
              'default',
              false,
              100
            )}
            {renderFormField(
              'Role',
              'role',
              form.role,
              editing,
              'default',
              false,
              50
            )}
            {renderFormField(
              'Business Type',
              'business_type',
              form.business_type,
              editing,
              'default',
              false,
              50
            )}
          </View>
        </View>

        {/* Account Settings */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>
            Account Settings
          </Text>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <View style={styles.logoutIconContainer}>
              <Icon
                name="log-out"
                size={scaleFont(18)}
                color="#ef4444"
              />
            </View>
            <Text style={styles.logoutText}>
              Sign Out
            </Text>
            <Icon
              name="chevron-right"
              size={scaleFont(16)}
              color="#ef4444"
            />
          </TouchableOpacity>
        </View>

        {editing && hasChanges && (
          <View style={styles.savePrompt}>
            <Text style={styles.savePromptText}>
              You have unsaved changes
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

      <BottomNav
        setShowOverlay={setShowOverlay}
        navigation={navigation}
      />
    </KeyboardAvoidingView>
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
    marginTop: scaleHeight(16),
    fontSize: scaleFont(16),
    color: '#6b7280',
    fontWeight: '500',
  },

  headerContainer: {
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scaleHeight(2) },
    shadowOpacity: 0.1,
    shadowRadius: scaleHeight(4),
    elevation: scaleHeight(4),
  },
  headerGradient: {
    backgroundColor: '#00c0a2',
    paddingTop:
      Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
    paddingBottom: scaleHeight(20),
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(20),
    paddingVertical: scaleHeight(12),
    minHeight: scaleHeight(56),
  },
  backButton: {
    padding: scaleWidth(8),
    marginRight: scaleWidth(8),
    borderRadius: scaleWidth(20),
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: scaleWidth(8),
  },
  headerTitle: {
    fontSize: scaleFont(24),
    color: '#fff',
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: scaleFont(14),
    color: 'rgba(255,255,255,0.8)',
    marginTop: scaleHeight(2),
  },
  editActions: {
    flexDirection: 'row',
    gap: scaleWidth(12),
  },
  actionButton: {
    padding: scaleWidth(8),
    borderRadius: scaleWidth(20),
    minWidth: scaleWidth(36),
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: scaleWidth(20),
    paddingTop: scaleHeight(20),
    paddingBottom: scaleHeight(140),
  },

  profileCard: {
    backgroundColor: '#fff',
    borderRadius: scaleWidth(16),
    padding: scaleWidth(24),
    marginBottom: scaleHeight(24),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scaleHeight(4) },
    shadowOpacity: 0.08,
    shadowRadius: scaleHeight(12),
    elevation: scaleHeight(6),
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: scaleWidth(80),
    height: scaleWidth(80),
    borderRadius: scaleWidth(40),
    backgroundColor: '#00c0a2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scaleWidth(20),
    shadowColor: '#00c0a2',
    shadowOffset: { width: 0, height: scaleHeight(4) },
    shadowOpacity: 0.3,
    shadowRadius: scaleHeight(8),
    elevation: scaleHeight(4),
  },
  avatarText: {
    fontSize: scaleFont(28),
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 1,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: scaleFont(22),
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: scaleHeight(4),
    letterSpacing: -0.5,
  },
  userEmail: {
    fontSize: scaleFont(15),
    color: '#6b7280',
    marginBottom: scaleHeight(2),
  },
  userRole: {
    fontSize: scaleFont(13),
    color: '#00c0a2',
    fontWeight: '600',
    textTransform: 'capitalize',
  },

  formSection: {
    backgroundColor: '#fff',
    borderRadius: scaleWidth(16),
    padding: scaleWidth(20),
    marginBottom: scaleHeight(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scaleHeight(2) },
    shadowOpacity: 0.05,
    shadowRadius: scaleHeight(8),
    elevation: scaleHeight(3),
  },
  sectionTitle: {
    fontSize: scaleFont(18),
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: scaleHeight(16),
    letterSpacing: -0.3,
  },
  formGrid: {
    gap: scaleHeight(16),
  },

  fieldContainer: {
    marginBottom: scaleHeight(4),
  },
  fieldLabel: {
    fontSize: scaleFont(14),
    fontWeight: '600',
    color: '#374151',
    marginBottom: scaleHeight(8),
    letterSpacing: -0.1,
  },
  requiredIndicator: {
    color: '#ef4444',
  },
  inputContainer: {
    position: 'relative',
  },
  fieldInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: scaleWidth(12),
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(14),
    fontSize: scaleFont(16),
    color: '#1f2937',
    minHeight: scaleHeight(48),
  },
  multilineInput: {
    minHeight: scaleHeight(80),
    textAlignVertical: 'top',
  },
  disabledInput: {
    backgroundColor: '#f3f4f6',
    opacity: 0.6,
  },
  characterCount: {
    position: 'absolute',
    right: scaleWidth(12),
    bottom: scaleHeight(6),
    fontSize: scaleFont(12),
    color: '#9ca3af',
  },
  fieldDisplay: {
    backgroundColor: '#f9fafb',
    borderRadius: scaleWidth(12),
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(14),
    justifyContent: 'center',
    minHeight: scaleHeight(48),
  },
  fieldValue: {
    fontSize: scaleFont(16),
    color: '#1f2937',
  },
  emptyValue: {
    color: '#9ca3af',
    fontStyle: 'italic',
  },

  actionsSection: {
    backgroundColor: '#fff',
    borderRadius: scaleWidth(16),
    padding: scaleWidth(20),
    marginBottom: scaleHeight(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scaleHeight(2) },
    shadowOpacity: 0.05,
    shadowRadius: scaleHeight(8),
    elevation: scaleHeight(3),
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scaleHeight(12),
    paddingHorizontal: scaleWidth(4),
  },
  logoutIconContainer: {
    width: scaleWidth(44),
    height: scaleWidth(44),
    borderRadius: scaleWidth(22),
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scaleWidth(16),
  },
  logoutText: {
    flex: 1,
    fontSize: scaleFont(16),
    color: '#ef4444',
    fontWeight: '600',
    letterSpacing: -0.2,
  },

  savePrompt: {
    backgroundColor: '#fef3c7',
    borderRadius: scaleWidth(12),
    padding: scaleWidth(16),
    marginBottom: scaleHeight(20),
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  savePromptText: {
    fontSize: scaleFont(14),
    color: '#92400e',
    fontWeight: '500',
    textAlign: 'center',
  },
});
