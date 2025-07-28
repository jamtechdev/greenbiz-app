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
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/FontAwesome';
import logoImage from '../../../assets/images/greenbidzlogo.jpg';
import { 
  setPendingNavigation, 
  clearPendingNavigation,
  clearAuthError 
} from '../../../store/slices/authSlice';

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Redux selectors for pending navigation
  const { pendingNavigation } = useSelector((state) => state.auth);

  // Clear any existing errors when component mounts
  useEffect(() => {
    dispatch(clearAuthError());
    setLoginError('');
  }, [dispatch]);

  // Clear error when user starts typing
  const handleEmailChange = (text) => {
    setEmail(text);
    if (loginError) {
      setLoginError('');
      dispatch(clearAuthError());
    }
  };

  const handlePasswordChange = (text) => {
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

      // Make API call to JWT endpoint
      const response = await fetch('https://greenbidz.com/wp-json/jwt-auth/v1/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: email, // WordPress typically uses username field
          password: password,
        }),
      });

      const responseData = await response.json();
      console.log('🔐 Login API Response:', response.status, responseData);

      if (response.ok && responseData.token) {
        // Success - store in AsyncStorage (your existing system)
        await AsyncStorage.setItem('userToken', responseData.token);
        await AsyncStorage.setItem('isLoggedIn', 'true');
        
        // Store user data if provided
        if (responseData.user_email || responseData.user_display_name) {
          const userData = {
            id: responseData.user_id || null,
            email: responseData.user_email || email,
            displayName: responseData.user_display_name || '',
            nicename: responseData.user_nicename || '',
          };
          await AsyncStorage.setItem('userData', JSON.stringify(userData));
        }

        console.log('✅ Login successful, token stored');

        // Clear form
        setEmail('');
        setPassword('');
        setIsLogging(false);

        // Show success message
        Alert.alert(
          'Welcome!',
          'You have been logged in successfully.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate based on pending navigation or default to Dashboard
                if (pendingNavigation) {
                  console.log('📍 Navigating to pending screen:', pendingNavigation);
                  dispatch(clearPendingNavigation());
                  navigation.navigate(pendingNavigation);
                } else {
                  console.log('📍 Navigating to Dashboard');
                  navigation.navigate('Dashboard');
                }
              },
            },
          ]
        );

      } else {
        // Handle API errors
        const errorMessage = responseData.message || 
                           responseData.error || 
                           'Login failed. Please check your credentials.';
        
        console.log('❌ Login failed:', errorMessage);
        setLoginError(errorMessage);
        setIsLogging(false);
      }

    } catch (error) {
      console.error('🚨 Login error:', error);
      setLoginError('Network error. Please check your connection and try again.');
      setIsLogging(false);
    }
  };

  const handleGoogleSignIn = () => {
    // Implement Google sign in
    console.log('Google sign in - Coming soon');
    Alert.alert('Coming Soon', 'Google Sign In will be available soon!');
  };

  const handleFacebookSignIn = () => {
    // Implement Facebook sign in
    console.log('Facebook sign in - Coming soon');
    Alert.alert('Coming Soon', 'Facebook Sign In will be available soon!');
  };

  const handleAppleSignIn = () => {
    // Implement Apple sign in
    console.log('Apple sign in - Coming soon');
    Alert.alert('Coming Soon', 'Apple Sign In will be available soon!');
  };

  const handleSignUp = () => {
    // Navigate to sign up screen
    console.log('Navigate to sign up - Coming soon');
    Alert.alert('Coming Soon', 'Sign Up will be available soon!');
  };

  const handleForgotPassword = () => {
    Alert.alert('Forgot Password', 'Password reset functionality will be available soon!');
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
            {pendingNavigation 
              ? 'Please sign in to continue with your listing'
              : 'Your industrial equipment marketplace'
            }
          </Text>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Sign In Form */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Sign In</Text>
            
            {/* Pending Navigation Info */}
            {pendingNavigation && (
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
                <Icon name="envelope-o" size={16} color="#6B7280" style={styles.inputIcon} />
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
                <Icon name="lock" size={16} color="#6B7280" style={styles.inputIcon} />
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
                style={[styles.signInButton, isLogging && styles.signInButtonDisabled]}
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

          {/* Social Login Section (Optional) */}
        
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

  // Social Login
  socialSection: {
    marginBottom: 32,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    fontSize: 14,
    color: '#6B7280',
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
  },
  socialButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
  },
  socialIcon: {
    marginRight: 8,
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
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