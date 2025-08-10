import React, { useEffect } from 'react';
import { NewAppScreen } from '@react-native/new-app-screen';
import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import { useDispatch } from 'react-redux';
import LoginScreen from './src/screens/authScreens/loginScreen';
import AppNavigator from './src/navigation/AppNavigator';
import { AppProvider } from './src/_customContext/AppProvider';
import { Provider } from 'react-redux';
import { store } from './src/store';
import './src/i18n';
import GlobalAlertProvider from './src/providers/GlobalAlertProvider';
import { initializeLanguage } from './src/store/slices/languageSlice';

// App content that initializes language in background
const AppContent = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Initialize language when app starts (non-blocking)
    dispatch(initializeLanguage());
  }, [dispatch]);

  // Render the main app immediately, language will update when ready
  return (
    <AppProvider>
      <GlobalAlertProvider>
        <AppNavigator />
      </GlobalAlertProvider>
    </AppProvider>
  );
};

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <Provider store={store}>
      <View style={styles.container}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor="transparent"
          translucent
        />
        <AppContent />
      </View>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;