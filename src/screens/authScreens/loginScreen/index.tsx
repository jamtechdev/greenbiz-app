import React, { useState } from 'react';
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
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import logoImage from '../../../assets/images/greenbidz-logo.png';
const { width, height } = Dimensions.get('window');

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleGoogleSignIn = () => {
    // Implement Google sign in
    console.log('Google sign in');
  };

  const handleFacebookSignIn = () => {
    // Implement Facebook sign in
    console.log('Facebook sign in');
  };

  const handleAppleSignIn = () => {
    // Implement Apple sign in
    console.log('Apple sign in');
  };

  const handleEmailSignIn = () => {
    // Implement email sign in
    console.log('Email sign in', { email, password });
  };

  const handleSignUp = () => {
    // Navigate to sign up screen
    console.log('Navigate to sign up');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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
            Your industrial equipment marketplace
          </Text>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Social Login Buttons */}
          <View style={styles.socialButtons}>
            <TouchableOpacity
              style={[styles.socialButton, styles.googleButton]}
              onPress={handleGoogleSignIn}
            >
            
              <Icon name='google' size={20} color='#EA4335'   style={[styles.socialIcon]} />
              <Text style={styles.socialButtonText}>Continue with Google</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.socialButton, styles.facebookButton]}
              onPress={handleFacebookSignIn}
            >
           
               <Icon name='facebook' size={20} color='#1877F2'   style={[styles.socialIcon]} />
              <Text style={styles.socialButtonText}>
                Continue with Facebook
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.socialButton, styles.appleButton]}
              onPress={handleAppleSignIn}
            >
              <Icon name='apple' size={20} color='#000000'   style={[styles.socialIcon]} />
              <Text style={styles.socialButtonText}>Continue with Apple</Text>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Or continue with email</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Sign In Form */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Sign In</Text>
            <View style={styles.formContent}>
              {/* Email Input */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Email address"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Password"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Icon
                    name={showPassword ? 'eye-slash' : 'eye'}
                    size={20}
                    color="#6B7280"
                  />
                </TouchableOpacity>
              </View>

              {/* Sign In Button */}
              <TouchableOpacity
                style={styles.signInButton}
                onPress={handleEmailSignIn}
              >
                <Icon
                  name="envelope-o"
                  size={20}
                  color="#FFFFFF"
                  style={styles.signInIcon}
                />
                <Text style={styles.signInButtonText}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.footerTextContainer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={handleSignUp}>
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
    // backgroundColor: '#1E3A8A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
  },
  content: {
    flex: 1,
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  socialButtons: {
    marginBottom: 32,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
    paddingHorizontal: 24,
  },
  socialIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 12,
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
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
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
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
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
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
    top: 14,
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    backgroundColor: '#1E3A8A',
    borderRadius: 8,
    marginTop: 8,
    shadowColor: '#1E3A8A',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  signInIcon: {
    marginRight: 8,
  },
  signInButtonText: {
    fontSize: 14,
    fontWeight: '500',
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
  logoImage: {
    width: 60,
    height: 60,
  },
});

export default LoginScreen;
