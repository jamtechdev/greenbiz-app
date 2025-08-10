// src/i18n/index.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as RNLocalize from 'react-native-localize';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translation files
import en from '../locales/en/translation.json';
import zhTW from '../locales/zh-TW/translation.json';

const LANGUAGE_KEY = 'selected_language';

const resources = {
  en: {
    translation: en,
  },
  'zh-TW': {
    translation: zhTW,
  },
};

// Get device language
const getDeviceLanguage = () => {
  const locales = RNLocalize.getLocales();
  if (locales.length > 0) {
    const deviceLanguage = locales[0].languageTag;
    // Map common Chinese variants to zh-TW
    if (deviceLanguage.includes('zh') && 
        (deviceLanguage.includes('TW') || deviceLanguage.includes('Hant'))) {
      return 'zh-TW';
    }
    return deviceLanguage.startsWith('zh') ? 'zh-TW' : 'en';
  }
  return 'en';
};

// Function to get saved language
const getSavedLanguage = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
    return savedLanguage || getDeviceLanguage();
  } catch (error) {
    console.log('Error getting saved language:', error);
    return getDeviceLanguage();
  }
};

// Function to save language
export const saveLanguage = async (language) => {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, language);
    console.log('✅ Language saved:', language);
  } catch (error) {
    console.log('❌ Error saving language:', error);
  }
};

// Function to change language and save it
export const changeLanguage = async (language) => {
  try {
    await saveLanguage(language);
    await i18n.changeLanguage(language);
    console.log('✅ Language changed to:', language);
  } catch (error) {
    console.log('❌ Error changing language:', error);
  }
};

// Initialize i18n
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // Will be overridden by initializeLanguage
    fallbackLng: 'en',
    debug: __DEV__,
    
    interpolation: {
      escapeValue: false,
    },
    
    react: {
      useSuspense: false,
    },
    
    // Add pluralization support
    pluralSeparator: '_',
    keySeparator: '.',
  });

// Initialize with saved language
const initializeLanguage = async () => {
  try {
    const language = await getSavedLanguage();
    await i18n.changeLanguage(language);
    console.log('🌍 Language initialized:', language);
  } catch (error) {
    console.log('❌ Error initializing language:', error);
  }
};

// Call this after i18n.init()
initializeLanguage();

export default i18n;