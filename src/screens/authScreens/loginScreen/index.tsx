import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/FontAwesome';
import logoImage from '../../../assets/images/greenbidzlogo.png';

import { apiService } from '../../../api/axiosConfig';
import {
  setPendingNavigation,
  clearPendingNavigation,
  clearAuthError,
} from '../../../store/slices/authSlice';
import { useCustomAlert } from '../../../hook/useCustomAlert';
import CustomAlert from '../../../components/CustomAlert';

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const {
    alertConfig,
    hideAlert,
    showLoginRequired,
    showSuccess,
    showError,
    showConfirm,
  } = useCustomAlert();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Get navigation params and Redux state
  const { fromScreen, screenParams } = route.params || {};
  const { pendingNavigation } = useSelector(state => state.auth);

  // Debug route params
  useEffect(() => {
    console.log('🔍 LoginScreen received route params:', route.params);
    console.log('🔍 fromScreen:', fromScreen);
    console.log('🔍 screenParams:', screenParams);
    console.log('🔍 pendingNavigation from Redux:', pendingNavigation);
  }, [route.params, fromScreen, screenParams, pendingNavigation]);

  // Clear any existing errors when component mounts
  useEffect(() => {
    dispatch(clearAuthError());
    setLoginError('');
  }, [dispatch]);

  // Clear error when user starts typing
  const handleEmailChange = text => {
    setEmail(text);
    if (loginError) {
      setLoginError('');
      dispatch(clearAuthError());
    }
  };

  const handlePasswordChange = text => {
    setPassword(text);
    if (loginError) {
      setLoginError('');
      dispatch(clearAuthError());
    }
  };

  const handleEmailSignIn = async () => {
    // Validation
    if (!email.trim()) {
      setLoginError('Please enter your email');
      return;
    }

    if (!password.trim()) {
      setLoginError('Please enter your password');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setLoginError('Please enter a valid email address');
      return;
    }

    try {
      setIsLogging(true);
      setLoginError('');

      console.log('🔐 Attempting login with:', { email });

      // Use apiService for login
      const loginData = {
        username: email, // WordPress typically uses username field
        password: password,
      };

      const response = await apiService.login(loginData);
      console.log('🔐 Login API Response:', response.status, response.data);

      if (response.data && response.data.token) {
        // Success - store in AsyncStorage
        await AsyncStorage.setItem('userToken', response.data.token);
        await AsyncStorage.setItem('isLoggedIn', 'true');

        // Store user data if provided
        if (response.data.user_email || response.data.user_display_name) {
          const userData = {
            id: response.data.user_id || null,
            email: response.data.user_email || email,
            displayName: response.data.user_display_name || '',
            nicename: response.data.user_nicename || '',
          };
          await AsyncStorage.setItem('userData', JSON.stringify(userData));
        }

        console.log('✅ Login successful, token stored');

        // Clear form
        setEmail('');
        setPassword('');
        setIsLogging(false);

        // Show success message and navigate
        showSuccess({
          title: 'Welcome!',
          message: 'You have been logged in successfully.',
          buttonText: 'Continue',
          onPress: () => {
            handleSuccessfulLogin();
          },
        });
      } else {
        throw new Error(response.data?.message || 'Login failed');
      }
    } catch (error) {
      console.error('🚨 Login error:', error);
      setIsLogging(false);

      let errorMessage =
        'Network error. Please check your connection and try again.';

      if (error.response) {
        const { status, data } = error.response;

        if (status === 401 || status === 403) {
          errorMessage = data?.message || 'Invalid email or password.';
        } else if (status === 422) {
          errorMessage =
            data?.message || 'Please check your input and try again.';
        } else if (status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        } else {
          errorMessage = data?.message || 'Login failed. Please try again.';
        }
      }

      setLoginError(errorMessage);

      showError({
        title: 'Login Failed',
        message: errorMessage,
      });
    }
  };

  const handleSuccessfulLogin = () => {
    console.log('🎯 Handling successful login...');
    console.log('📍 fromScreen:', fromScreen);
    console.log('📍 screenParams:', screenParams);
    console.log('📍 pendingNavigation:', pendingNavigation);

    // Priority 1: Navigate back to the screen that brought us here (fromScreen param)
    if (fromScreen) {
      console.log('✅ Navigating back to fromScreen:', fromScreen);

      try {
        if (screenParams) {
          console.log('📦 With params:', screenParams);
          navigation.navigate(fromScreen, screenParams);
        } else {
          console.log('📦 Without params');
          navigation.navigate(fromScreen);
        }
        return;
      } catch (error) {
        console.error('❌ Error navigating to fromScreen:', error);
        // Fall through to other options
      }
    }

    // Priority 2: Check for pending navigation from Redux
    if (pendingNavigation) {
      console.log('✅ Navigating to pending screen:', pendingNavigation);
      try {
        dispatch(clearPendingNavigation());
        navigation.navigate(pendingNavigation);
        return;
      } catch (error) {
        console.error('❌ Error navigating to pending screen:', error);
        // Fall through to default
      }
    }

    // Priority 3: Default to Dashboard
    console.log('✅ Navigating to Dashboard (default)');
    navigation.navigate('Dashboard');
  };

  const handleGoogleSignIn = () => {
    showError({
      title: 'Coming Soon',
      message: 'Google Sign In will be available soon!',
    });
  };

  const handleFacebookSignIn = () => {
    showError({
      title: 'Coming Soon',
      message: 'Facebook Sign In will be available soon!',
    });
  };

  const handleAppleSignIn = () => {
    showError({
      title: 'Coming Soon',
      message: 'Apple Sign In will be available soon!',
    });
  };

  const handleSignUp = () => {
    showError({
      title: 'Coming Soon',
      message: 'Sign Up will be available soon!',
    });
  };

  const handleForgotPassword = () => {
    showError({
      title: 'Coming Soon',
      message: 'Password reset functionality will be available soon!',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              source={logoImage}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>Welcome to GreenBidz</Text>
          <Text style={styles.subtitle}>
            {fromScreen || pendingNavigation
              ? 'Please sign in to continue with your listing'
              : 'Your industrial equipment marketplace'}
          </Text>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Sign In Form */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Sign In</Text>

            {/* Navigation Info */}
            {(fromScreen || pendingNavigation) && (
              <View style={styles.pendingInfo}>
                <Icon name="info-circle" size={16} color="#3b82f6" />
                <Text style={styles.pendingText}>
                  You'll return to your analysis after signing in
                </Text>
              </View>
            )}

            <View style={styles.formContent}>
              {/* Error Display */}
              {loginError ? (
                <View style={styles.errorContainer}>
                  <Icon name="exclamation-circle" size={16} color="#ef4444" />
                  <Text style={styles.errorText}>{loginError}</Text>
                </View>
              ) : null}

              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Icon
                  name="envelope-o"
                  size={16}
                  color="#6B7280"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Email address"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={handleEmailChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLogging}
                />
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Icon
                  name="lock"
                  size={16}
                  color="#6B7280"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Password"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={handlePasswordChange}
                  secureTextEntry={!showPassword}
                  editable={!isLogging}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={isLogging}
                >
                  <Icon
                    name={showPassword ? 'eye-slash' : 'eye'}
                    size={20}
                    color="#6B7280"
                  />
                </TouchableOpacity>
              </View>

              {/* Forgot Password */}
              <TouchableOpacity
                style={styles.forgotPassword}
                onPress={handleForgotPassword}
                disabled={isLogging}
              >
                <Text style={styles.forgotPasswordText}>
                  Forgot your password?
                </Text>
              </TouchableOpacity>

              {/* Sign In Button */}
              <TouchableOpacity
                style={[
                  styles.signInButton,
                  isLogging && styles.signInButtonDisabled,
                ]}
                onPress={handleEmailSignIn}
                disabled={isLogging}
              >
                {isLogging ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Icon
                    name="sign-in"
                    size={20}
                    color="#FFFFFF"
                    style={styles.signInIcon}
                  />
                )}
                <Text style={styles.signInButtonText}>
                  {isLogging ? 'Signing In...' : 'Sign In'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
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

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.footerTextContainer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={handleSignUp} disabled={isLogging}>
                <Text style={styles.signUpText}>Sign up</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.termsText}>
              By continuing, you agree to our Terms & Privacy Policy
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  logoImage: {
    width: 60,
    height: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  content: {
    flex: 1,
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },

  // Pending Navigation Info
  pendingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  pendingText: {
    flex: 1,
    fontSize: 14,
    color: '#1e40af',
  },

  // Error Display
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#991b1b',
  },

  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 32,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    color: '#111827',
    marginBottom: 24,
  },
  formContent: {
    gap: 16,
  },
  inputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  input: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingLeft: 44,
    paddingRight: 16,
    fontSize: 14,
    backgroundColor: '#FFFFFF',
    color: '#111827',
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },
  forgotPassword: {
    alignItems: 'flex-end',
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#1E3A8A',
    fontWeight: '500',
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    backgroundColor: '#1E3A8A',
    borderRadius: 12,
    marginTop: 8,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  signInButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  signInIcon: {
    marginRight: 8,
  },
  signInButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  footer: {
    alignItems: 'center',
  },
  footerTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  signUpText: {
    fontSize: 14,
    color: '#1E3A8A',
    fontWeight: '500',
  },
  termsText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default LoginScreen;
