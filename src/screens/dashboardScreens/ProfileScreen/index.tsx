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
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Feather';
import BottomNav from '../../../components/BottomNavbar';
import { useAppContext } from '../../../_customContext/AppProvider';

import { apiService } from '../../../api/axiosConfig';
import { useCustomAlert } from '../../../hook/useCustomAlert';
import CustomAlert from '../../../components/CustomAlert';
import { scaleWidth, scaleHeight, scaleFont } from '../../../utils/resposive';

const { width, height } = Dimensions.get('window');

export default function ProfileScreen({ navigation }) {
  const { showOverlay, setShowOverlay } = useAppContext();
  const { alertConfig, hideAlert, showSuccess, showError, showConfirm } =
    useCustomAlert();

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

  useEffect(() => {
    fetchUserProfile();
  }, []);

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

          await AsyncStorage.multiRemove([
            'userToken',
            'isLoggedIn',
            'userData',
            'shouldShowReviewModal',
          ]);

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

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Loading your profile...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#00c0a2" />

      {/* Beautiful Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerGradient}>
          <SafeAreaView>
            <View style={styles.headerContent}>
              <View style={styles.headerTop}>
                <View style={styles.headerLeft}>
                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                  >
                    <Icon name="arrow-left" size={20} color="#fff" />
                  </TouchableOpacity>
                  <View style={styles.headerTextContainer}>
                    <Text style={styles.headerTitle}>My Profile</Text>
                    <Text style={styles.headerSubtitle}>
                      {editing ? 'Edit your details' : 'Manage your account'}
                    </Text>
                  </View>
                </View>

                {editing ? (
                  <View style={styles.editActions}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={onCancel}
                      disabled={saving}
                    >
                      <Text style={styles.cancelButtonText}>X</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.saveButton,
                        saving && styles.saveButtonDisabled,
                      ]}
                      onPress={onSave}
                      disabled={saving}
                    >
                      {saving ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Icon name="check" size={16} color="#fff" />
                      )}
                      <Text style={styles.saveButtonText}>
                        {saving ? 'Saving...' : 'Save'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => setEditing(true)}
                  >
                    <Icon name="edit-3" size={16} color="#fff" />
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </SafeAreaView>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials()}</Text>
              </View>
              {editing && (
                <TouchableOpacity style={styles.avatarEditButton}>
                  <Icon name="camera" size={12} color="#fff" />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.userInfo}>
              <Text style={styles.userName}>{getFullName()}</Text>
              <Text style={styles.userEmail}>{form.email}</Text>
              {form.business_type && (
                <View style={styles.businessTypeBadge}>
                  <Text style={styles.businessTypeText}>
                    {form.business_type}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Form Sections */}
        <View style={styles.formsContainer}>
          {/* Personal Information */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <View style={styles.formGrid}>
              {renderFormField(
                'First Name',
                'first_name',
                form.first_name,
                editing,
                onChange,
              )}
              {renderFormField(
                'Last Name',
                'last_name',
                form.last_name,
                editing,
                onChange,
              )}
              {renderFormField(
                'Username',
                'username',
                form.username,
                editing,
                onChange,
              )}
              {renderFormField(
                'Email Address',
                'email',
                form.email,
                editing,
                onChange,
                'email-address',
              )}
            </View>
          </View>

          {/* Business Information */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Business Information</Text>
            <View style={styles.formGrid}>
              {renderFormField(
                'Phone Number',
                'billing_phone',
                form.billing_phone,
                editing,
                onChange,
                'phone-pad',
              )}
              {renderFormField(
                'Country',
                'billing_country',
                form.billing_country,
                editing,
                onChange,
              )}
              {renderFormField(
                'Company',
                'company',
                form.company,
                editing,
                onChange,
              )}
              {renderFormField('Role', 'role', form.role, false, onChange)}
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.actionsSection}>
            <Text style={styles.sectionTitle}>Account Settings</Text>
            <View style={styles.actionsList}>
              {/* {renderActionItem(
                'Help Circle',
                'Help & Support',
                'Get help and contact support',
                '#f59e0b',
                '#fef3c7',
              )} */}
            </View>

            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <View style={styles.logoutIcon}>
                <Icon name="log-out" size={18} color="#ef4444" />
              </View>
              <Text style={styles.logoutText}>Sign Out</Text>
              <Icon name="chevron-right" size={16} color="#ef4444" />
            </TouchableOpacity>
          </View>
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

const renderFormField = (
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
      <View style={styles.fieldDisplay}>
        <Text style={styles.fieldValue}>{value || 'Not provided'}</Text>
      </View>
    )}
  </View>
);

const renderActionItem = (iconName, title, subtitle, iconColor, bgColor) => (
  <TouchableOpacity style={styles.actionItem} key={title}>
    <View style={[styles.actionIcon, { backgroundColor: bgColor }]}>
      <Icon
        name={iconName.toLowerCase().replace(' ', '-')}
        size={20}
        color={iconColor}
      />
    </View>
    <View style={styles.actionContent}>
      <Text style={styles.actionTitle}>{title}</Text>
      <Text style={styles.actionSubtitle}>{subtitle}</Text>
    </View>
    <Icon name="chevron-right" size={16} color="#9ca3af" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },

  // Loading
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: scaleFont(16),
    color: '#6b7280',
    fontFamily: 'Poppins-Medium',
  },

  // Beautiful Header
  headerContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  headerGradient: {
    backgroundColor: '#00c0a2',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    paddingBottom: scaleHeight(20),
  },
  headerContent: {
    paddingHorizontal: scaleWidth(20),
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: scaleHeight(10),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: scaleWidth(40),
    height: scaleWidth(40),
    borderRadius: scaleWidth(20),
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scaleWidth(16),
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: scaleFont(24),
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'Poppins-Bold',
  },
  headerSubtitle: {
    fontSize: scaleFont(14),
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'Poppins-Regular',
    marginTop: scaleHeight(2),
  },

  // Header Actions
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: scaleHeight(10),
    paddingHorizontal: scaleWidth(16),
    borderRadius: scaleWidth(25),
    gap: scaleWidth(6),
  },
  editButtonText: {
    color: '#fff',
    fontSize: scaleFont(14),
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  editActions: {
    flexDirection: 'row',
    gap: scaleWidth(8),
  },
  cancelButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: scaleHeight(10),
    paddingHorizontal: scaleWidth(16),
    borderRadius: scaleWidth(25),
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: scaleFont(14),
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingVertical: scaleHeight(10),
    paddingHorizontal: scaleWidth(16),
    borderRadius: scaleWidth(25),
    gap: scaleWidth(6),
  },
  saveButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: scaleFont(14),
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },

  // Scroll View
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: scaleHeight(120),
  },

  // Profile Card
  profileCard: {
    backgroundColor: '#fff',
    marginHorizontal: scaleWidth(20),
    marginTop: scaleHeight(10),
    borderRadius: scaleWidth(20),
    padding: scaleWidth(24),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scaleHeight(4) },
    shadowOpacity: 0.1,
    shadowRadius: scaleHeight(12),
    elevation: scaleHeight(8),
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: scaleWidth(20),
  },
  avatar: {
    width: scaleWidth(80),
    height: scaleWidth(80),
    borderRadius: scaleWidth(40),
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: scaleHeight(4) },
    shadowOpacity: 0.3,
    shadowRadius: scaleHeight(8),
    elevation: scaleHeight(6),
  },
  avatarText: {
    fontSize: scaleFont(28),
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'Poppins-Bold',
  },
  avatarEditButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: scaleWidth(24),
    height: scaleWidth(24),
    borderRadius: scaleWidth(12),
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: scaleWidth(2),
    borderColor: '#fff',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: scaleFont(20),
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Poppins-Bold',
    marginBottom: scaleHeight(4),
  },
  userEmail: {
    fontSize: scaleFont(14),
    color: '#6b7280',
    fontFamily: 'Poppins-Regular',
    marginBottom: scaleHeight(8),
  },
  businessTypeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f0ff',
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(6),
    borderRadius: scaleWidth(12),
  },
  businessTypeText: {
    fontSize: scaleFont(12),
    fontWeight: '600',
    color: '#667eea',
    fontFamily: 'Poppins-SemiBold',
    textTransform: 'capitalize',
  },

  // Forms Container
  formsContainer: {
    paddingHorizontal: scaleWidth(20),
    paddingTop: scaleHeight(20),
  },
  formSection: {
    backgroundColor: '#fff',
    borderRadius: scaleWidth(16),
    padding: scaleWidth(20),
    marginBottom: scaleHeight(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scaleHeight(2) },
    shadowOpacity: 0.05,
    shadowRadius: scaleHeight(8),
    elevation: scaleHeight(3),
  },
  sectionTitle: {
    fontSize: scaleFont(18),
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Poppins-Bold',
    marginBottom: scaleHeight(20),
  },
  formGrid: {
    gap: scaleHeight(16),
  },

  // Form Fields
  fieldContainer: {
    marginBottom: scaleHeight(4),
  },
  fieldLabel: {
    fontSize: scaleFont(13),
    fontWeight: '600',
    color: '#374151',
    fontFamily: 'Poppins-SemiBold',
    marginBottom: scaleHeight(8),
  },
  fieldInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: scaleWidth(12),
    paddingVertical: scaleHeight(14),
    paddingHorizontal: scaleWidth(16),
    fontSize: scaleFont(16),
    color: '#111827',
    fontFamily: 'Poppins-Regular',
    minHeight: scaleHeight(50),
  },
  fieldDisplay: {
    backgroundColor: '#f9fafb',
    borderRadius: scaleWidth(12),
    paddingVertical: scaleHeight(14),
    paddingHorizontal: scaleWidth(16),
    minHeight: scaleHeight(50),
    justifyContent: 'center',
  },
  fieldValue: {
    fontSize: scaleFont(16),
    color: '#111827',
    fontFamily: 'Poppins-Regular',
  },

  // Actions Section
  actionsSection: {
    backgroundColor: '#fff',
    borderRadius: scaleWidth(16),
    padding: scaleWidth(20),
    marginBottom: scaleHeight(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scaleHeight(2) },
    shadowOpacity: 0.05,
    shadowRadius: scaleHeight(8),
    elevation: scaleHeight(3),
  },
  actionsList: {
    gap: scaleHeight(4),
    marginBottom: scaleHeight(16),
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scaleHeight(16),
    paddingHorizontal: scaleWidth(4),
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  actionIcon: {
    width: scaleWidth(44),
    height: scaleWidth(44),
    borderRadius: scaleWidth(22),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scaleWidth(16),
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Poppins-SemiBold',
    marginBottom: scaleHeight(2),
  },
  actionSubtitle: {
    fontSize: scaleFont(13),
    color: '#6b7280',
    fontFamily: 'Poppins-Regular',
  },

  // Logout Button
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scaleHeight(16),
    paddingHorizontal: scaleWidth(4),
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    marginTop: scaleHeight(8),
  },
  logoutIcon: {
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
    fontWeight: '600',
    color: '#ef4444',
    fontFamily: 'Poppins-SemiBold',
  },
});
