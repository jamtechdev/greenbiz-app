import React, { useState, useEffect } from 'react';
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
  Animated,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Feather';
import BottomNav from '../../../components/BottomNavbar';
import { useAppContext } from '../../../_customContext/AppProvider';

import { apiService } from '../../../api/axiosConfig';
import { useCustomAlert } from '../../../hook/useCustomAlert';
import CustomAlert from '../../../components/CustomAlert';

const { width, height } = Dimensions.get('window');

export default function ProfileScreen({ navigation }) {
  const { showOverlay, setShowOverlay } = useAppContext();
  const {
    alertConfig,
    hideAlert,
    showSuccess,
    showError,
    showConfirm,
  } = useCustomAlert();

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
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
  });
  const [originalForm, setOriginalForm] = useState({});

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];

  useEffect(() => {
    fetchUserProfile();

    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Refresh data when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (!editing) {
        fetchUserProfile();
      }
    });
    return unsubscribe;
  }, [navigation, editing]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching user profile...');

      const response = await apiService.getUser();

      if (response.data && response.data.success) {
        const userData = response.data.data;
        const formData = {
          first_name: userData.first_name || '',
          last_name: userData.last_name || '',
          username: userData.username || '',
          email: userData.email || '',
          billing_phone: userData.billing_phone || '',
          billing_country: userData.billing_country || '',
          company: userData.company || '',
          role: userData.role || '',
          business_type: userData.business_type || '',
          user_type: userData.user_type || '',
        };

        setForm(formData);
        setOriginalForm(formData);
        console.log('✅ Profile fetched successfully');
      } else {
         navigation.navigate('Login');
        showError({
          title: 'Failed to Load Profile',
          message: 'Unable to fetch your profile data.',
        });
       
      }
    } catch (error) {
      console.error('❌ Error fetching profile:', error);
      showError({
        title: 'Profile Load Error',
        message: 'Failed to load your profile. Please try again.',
      });
      navigation
    } finally {
      setLoading(false);
    }
  };

  const onChange = (key, value) => setForm({ ...form, [key]: value });

  const onCancel = () => {
    setForm(originalForm);
    setEditing(false);
  };

  const onSave = async () => {
    try {
      setSaving(true);
      console.log('💾 Saving profile changes...');

      // Create update payload
      const updateData = {
        first_name: form.first_name,
        last_name: form.last_name,
        username: form.username,
        email: form.email,
        billing_phone: form.billing_phone,
        billing_country: form.billing_country,
        company: form.company,
        business_type: form.business_type,
        user_type: form.user_type,
      };

      // Call update profile API
      const response = await apiService.updateProfile(updateData);

      if (response.data && response.data.success) {
        setOriginalForm(form);
        setEditing(false);
        setSaving(false);

        showSuccess({
          title: 'Profile Updated',
          message: 'Your profile has been successfully updated.',
        });

        console.log('✅ Profile updated successfully');
      } else {
        throw new Error(response.data?.message || 'Update failed');
      }
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      setSaving(false);
      showError({
        title: 'Update Failed',
        message:
          error.response?.data?.message ||
          'Failed to update your profile. Please try again.',
      });
    }
  };

  const handleLogout = () => {
    showConfirm({
      title: 'Logout',
      message: 'Are you sure you want to logout?',
      confirmText: 'Logout',
      destructive: true,
      onConfirm: async () => {
        try {
          console.log('🚪 Logging out...');

          // Clear AsyncStorage
          await AsyncStorage.multiRemove([
            'userToken',
            'isLoggedIn',
            'userData',
            'shouldShowReviewModal',
          ]);

          // Navigate to login screen
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });

          console.log('✅ Logout successful');
        } catch (error) {
          console.error('❌ Error during logout:', error);
          showError({
            title: 'Logout Error',
            message: 'Failed to logout properly. Please try again.',
          });
        }
      },
    });
  };

  const getInitials = () => {
    const firstName = form.first_name || '';
    const lastName = form.last_name || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U';
  };

  const getFullName = () => {
    const firstName = form.first_name || '';
    const lastName = form.last_name || '';
    return `${firstName} ${lastName}`.trim() || 'User';
  };

  const getBadgeColor = () => {
    switch (form.business_type?.toLowerCase()) {
      case 'manufacturer':
        return { bg: '#dbeafe', text: '#3b82f6' };
      case 'dealer':
        return { bg: '#dcfce7', text: '#16a34a' };
      case 'contractor':
        return { bg: '#fef3c7', text: '#d97706' };
      default:
        return { bg: '#f1f5f9', text: '#64748b' };
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading your profile...</Text>
      </View>
    );
  }

  const badgeColor = getBadgeColor();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6366f1" />

      {/* Clean Fixed Header */}
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <SafeAreaView>
            <Animated.View
              style={[
                styles.headerContent,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <View style={styles.headerLeft}>
                <Text style={styles.headerTitle}>Profile</Text>
                <Text style={styles.headerSubtitle}>
                  {editing ? 'Edit your information' : 'Manage your account'}
                </Text>
              </View>

              {editing ? (
                <View style={styles.editButtons}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={onCancel}
                    disabled={saving}
                  >
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                    onPress={onSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Icon name="check" size={16} color="#fff" />
                    )}
                    <Text style={styles.saveText}>
                      {saving ? 'Saving...' : 'Save'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => setEditing(true)}
                >
                  <Icon name="edit-2" size={16} color="#fff" />
                  <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>
              )}
            </Animated.View>
          </SafeAreaView>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Clean Avatar Section */}
        <Animated.View
          style={[
            styles.avatarSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.avatarContainer}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>{getInitials()}</Text>
            </View>
            {editing && (
              <TouchableOpacity style={styles.avatarEditBtn}>
                <Icon name="camera" size={14} color="#fff" />
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.profileName}>{getFullName()}</Text>
          <Text style={styles.profileUsername}>@{form.username}</Text>

          {form.business_type && (
            <View
              style={[styles.businessBadge, { backgroundColor: badgeColor.bg }]}
            >
              <Text
                style={[styles.businessBadgeText, { color: badgeColor.text }]}
              >
                {form.business_type}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Simple Form Cards */}
        <View style={styles.formContainer}>
          {/* Personal Info */}
          <Animated.View
            style={[
              styles.card,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.sectionTitle}>Personal Information</Text>
            {renderField(
              'First Name',
              'first_name',
              form.first_name,
              editing,
              onChange,
            )}
            {renderField(
              'Last Name',
              'last_name',
              form.last_name,
              editing,
              onChange,
            )}
            {renderField(
              'Username',
              'username',
              form.username,
              editing,
              onChange,
            )}
            {renderField(
              'Email',
              'email',
              form.email,
              editing,
              onChange,
              'email-address',
            )}
          </Animated.View>

          {/* Business Info */}
          <Animated.View
            style={[
              styles.card,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.sectionTitle}>Business Information</Text>
            {renderField(
              'Phone Number',
              'billing_phone',
              form.billing_phone,
              editing,
              onChange,
              'phone-pad',
            )}
            {renderField(
              'Country',
              'billing_country',
              form.billing_country,
              editing,
              onChange,
            )}
            {renderField('Company', 'company', form.company, editing, onChange)}
            {renderField('Role', 'role', form.role, false, onChange)}{' '}
            {/* Read-only */}
          </Animated.View>

          {/* Account Actions */}
          <Animated.View
            style={[
              styles.card,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.sectionTitle}>Account Settings</Text>

            <TouchableOpacity style={styles.actionItem}>
              <View style={styles.actionLeft}>
                <View
                  style={[styles.actionIcon, { backgroundColor: '#e0e7ff' }]}
                >
                  <Icon name="key" size={18} color="#6366f1" />
                </View>
                <Text style={styles.actionText}>Change Password</Text>
              </View>
              <Icon name="chevron-right" size={18} color="#94a3b8" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem}>
              <View style={styles.actionLeft}>
                <View
                  style={[styles.actionIcon, { backgroundColor: '#dcfce7' }]}
                >
                  <Icon name="shield" size={18} color="#16a34a" />
                </View>
                <Text style={styles.actionText}>Privacy Settings</Text>
              </View>
              <Icon name="chevron-right" size={18} color="#94a3b8" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem}>
              <View style={styles.actionLeft}>
                <View
                  style={[styles.actionIcon, { backgroundColor: '#fef3c7' }]}
                >
                  <Icon name="bell" size={18} color="#d97706" />
                </View>
                <Text style={styles.actionText}>Notifications</Text>
              </View>
              <Icon name="chevron-right" size={18} color="#94a3b8" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem}>
              <View style={styles.actionLeft}>
                <View
                  style={[styles.actionIcon, { backgroundColor: '#f3e8ff' }]}
                >
                  <Icon name="help-circle" size={18} color="#8b5cf6" />
                </View>
                <Text style={styles.actionText}>Help & Support</Text>
              </View>
              <Icon name="chevron-right" size={18} color="#94a3b8" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={[styles.actionItem, styles.logoutAction]}
              onPress={handleLogout}
            >
              <View style={styles.actionLeft}>
                <View
                  style={[styles.actionIcon, { backgroundColor: '#fee2e2' }]}
                >
                  <Icon name="log-out" size={18} color="#dc2626" />
                </View>
                <Text style={[styles.actionText, styles.logoutText]}>
                  Logout
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </View>
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

      <BottomNav setShowOverlay={setShowOverlay} navigation={navigation} />
    </View>
  );
}

const renderField = (
  label,
  key,
  value,
  editing,
  onChange,
  keyboardType = 'default',
) => (
  <View style={styles.fieldContainer}>
    <Text style={styles.fieldLabel}>{label}</Text>
    {editing ? (
      <TextInput
        style={styles.fieldInput}
        value={value}
        onChangeText={text => onChange(key, text)}
        keyboardType={keyboardType}
        placeholder={`Enter ${label.toLowerCase()}`}
        placeholderTextColor="#9ca3af"
      />
    ) : (
      <View style={styles.fieldValue}>
        <Text style={styles.fieldText}>{value || 'Not provided'}</Text>
      </View>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },

  // Clean Header
  headerContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  header: {
    backgroundColor: '#6366f1',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 0,
    paddingBottom: 20,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 10 : 0,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    color: '#fff',
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },

  // Header Buttons
  editBtn: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
    gap: 6,
  },
  editBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  editButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  saveBtn: {
    flexDirection: 'row',
    backgroundColor: '#10b981',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
    gap: 6,
  },
  saveBtnDisabled: {
    backgroundColor: '#9ca3af',
  },
  cancelText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  saveText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },

  // Scroll View
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },

  // Clean Avatar Section
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarInitials: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
  },
  avatarEditBtn: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#10b981',
    padding: 8,
    borderRadius: 16,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
    textAlign: 'center',
  },
  profileUsername: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 12,
    textAlign: 'center',
  },
  businessBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
  },
  businessBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },

  // Form Container
  formContainer: {
    paddingHorizontal: 16,
  },

  // Clean Cards
  card: {
    backgroundColor: '#fff',
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
  },

  // Clean Fields
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    marginBottom: 6,
    color: '#6b7280',
    fontWeight: '600',
  },
  fieldValue: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  fieldText: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    color: '#1f2937',
    fontSize: 14,
    fontWeight: '500',
  },
  fieldInput: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#fff',
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },

  // Clean Action Items
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionText: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 8,
  },
  logoutAction: {
    borderBottomWidth: 0,
    marginTop: 4,
  },
  logoutText: {
    color: '#dc2626',
    fontWeight: '600',
  },
});
