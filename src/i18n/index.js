// src/i18n/index.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as RNLocalize from 'react-native-localize';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translation files
import en from '../locales/en/translation.json';
// Keep your existing file; we’ll alias it to zh-Hant.
import zhHant from '../locales/zh-TW/translation.json';

const LANGUAGE_KEY = 'selected_language';

// ---- Normalize to canonical 'zh-Hant' ----
const normalizeLanguageCode = (code) => {
  if (!code) return 'en';
  const s = String(code);

  // Fast paths
  if (s === 'en' || s === 'zh-Hant') return s;

  const lower = s.toLowerCase();

  // Legacy & variants → zh-Hant
  if (
    lower === 'zh-tw' ||
    s === 'zh-TW' ||
    lower === 'zh-hant' ||
    lower.startsWith('zh-hant') ||
    lower.startsWith('zh-tw') ||
    (lower.startsWith('zh') && lower.includes('hant'))
  ) {
    return 'zh-Hant';
  }

  // Any other zh* → choose zh-Hant since that’s what we support
  if (lower.startsWith('zh')) return 'zh-Hant';

  return 'en';
};

// ---- Resources ----
// Expose both keys. Both point to the same translations.
const resources = {
  en: { translation: en },
  'zh-Hant': { translation: zhHant },
  'zh-TW': { translation: zhHant }, // legacy alias
};

// ---- Device language detection ----
const getDeviceLanguage = () => {
  const locales = RNLocalize.getLocales();
  if (locales && locales.length > 0) {
    const { languageTag } = locales[0]; // e.g., "zh-Hant-TW", "zh-TW", "en-US"
    return normalizeLanguageCode(languageTag);
  }
  return 'en';
};

// ---- Persistence helpers ----
const getSavedLanguage = async () => {
  try {
    const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
    return normalizeLanguageCode(saved || getDeviceLanguage());
  } catch (error) {
    console.log('Error getting saved language:', error);
    return normalizeLanguageCode(getDeviceLanguage());
  }
};

export const saveLanguage = async (language) => {
  try {
    const normalized = normalizeLanguageCode(language);
    await AsyncStorage.setItem(LANGUAGE_KEY, normalized);
    console.log('✅ Language saved:', normalized);
  } catch (error) {
    console.log('❌ Error saving language:', error);
  }
};

export const changeLanguage = async (language) => {
  try {
    const normalized = normalizeLanguageCode(language);
    await saveLanguage(normalized);
    await i18n.changeLanguage(normalized);
    console.log('✅ Language changed to:', normalized);
  } catch (error) {
    console.log('❌ Error changing language:', error);
  }
};

// ---- i18n init ----
i18n.use(initReactI18next).init({
  resources,
  lng: 'en', // will be overridden below
  fallbackLng: 'en',
  debug: __DEV__,

  interpolation: { escapeValue: false },
  react: { useSuspense: false },

  pluralSeparator: '_',
  keySeparator: '.',
});

// Initialize with saved/device language (normalized)
const initializeLanguage = async () => {
  try {
    const language = await getSavedLanguage();
    await i18n.changeLanguage(language);
    console.log('🌍 Language initialized:', language);
  } catch (error) {
    console.log('❌ Error initializing language:', error);
  }
};

initializeLanguage();

export default i18n;
