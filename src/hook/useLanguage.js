import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import {
  changeLanguage,
  initializeLanguage,
  loadSavedLanguage,
  clearError,
  selectCurrentLanguage,
  selectLanguageLoading,
  selectLanguageError,
  selectIsLanguageInitialized,
  selectAvailableLanguages,
  selectLanguageDisplayName,
  selectLanguageNativeName,
  selectLanguageShortName,
} from '../store/slices/languageSlice';

// Flag emoji mapping for English and Traditional Chinese only
const FLAG_MAPPING = {
  'en': '🇺🇸', // English - US Flag
  'zh-TW': '🇹🇼', // Traditional Chinese - Taiwan Flag
};

// Alternative flag representations with additional metadata
const FLAG_UNICODE_MAPPING = {
  'en': { 
    unicode: '🇺🇸', 
    code: 'US', 
    name: 'United States',
    countryName: 'United States',
    languageName: 'English'
  },
  'zh-TW': { 
    unicode: '🇹🇼', 
    code: 'TW', 
    name: 'Taiwan',
    countryName: 'Taiwan',
    languageName: 'Traditional Chinese'
  },
};

export const useLanguage = () => {
  const dispatch = useDispatch();
  
  // Selectors
  const currentLanguage = useSelector(selectCurrentLanguage);
  const isLoading = useSelector(selectLanguageLoading);
  const error = useSelector(selectLanguageError);
  const isInitialized = useSelector(selectIsLanguageInitialized);
  const availableLanguages = useSelector(selectAvailableLanguages);
  const languageDisplayName = useSelector(selectLanguageDisplayName);
  const languageNativeName = useSelector(selectLanguageNativeName);
  const languageShortName = useSelector(selectLanguageShortName);

  // Action creators
  const switchLanguage = useCallback(
    (languageCode) => {
      return dispatch(changeLanguage(languageCode));
    },
    [dispatch]
  );

  const initLanguage = useCallback(() => {
    return dispatch(initializeLanguage());
  }, [dispatch]);

  const loadLanguage = useCallback(() => {
    return dispatch(loadSavedLanguage());
  }, [dispatch]);

  const clearLanguageError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  const toggleLanguage = useCallback(() => {
    const newLanguage = currentLanguage === 'en' ? 'zh-TW' : 'en';
    return dispatch(changeLanguage(newLanguage));
  }, [currentLanguage, dispatch]);

  // Flag-related helper functions
  const getLanguageFlag = useCallback(
    (langCode) => {
      return FLAG_MAPPING[langCode] || FLAG_MAPPING['en']; // Default to English flag
    },
    []
  );

  const getLanguageFlagDetails = useCallback(
    (langCode) => {
      return FLAG_UNICODE_MAPPING[langCode] || FLAG_UNICODE_MAPPING['en'];
    },
    []
  );

  const getCurrentLanguageFlag = useCallback(() => {
    return getLanguageFlag(currentLanguage);
  }, [currentLanguage, getLanguageFlag]);

  const getCurrentLanguageFlagDetails = useCallback(() => {
    return getLanguageFlagDetails(currentLanguage);
  }, [currentLanguage, getLanguageFlagDetails]);

  // Helper functions
  const getLanguageDisplayName = useCallback(
    (langCode) => {
      const language = availableLanguages.find(lang => lang.code === langCode);
      return language?.name || 'English';
    },
    [availableLanguages]
  );

  const getLanguageNativeName = useCallback(
    (langCode) => {
      const language = availableLanguages.find(lang => lang.code === langCode);
      return language?.nativeName || 'English';
    },
    [availableLanguages]
  );

  const getLanguageShortName = useCallback(
    (langCode) => {
      const language = availableLanguages.find(lang => lang.code === langCode);
      return language?.shortName || 'EN';
    },
    [availableLanguages]
  );

  // Enhanced helper function that returns complete language info with flag
  const getLanguageInfo = useCallback(
    (langCode) => {
      const language = availableLanguages.find(lang => lang.code === langCode);
      const flagDetails = getLanguageFlagDetails(langCode);
      
      return {
        code: langCode,
        name: language?.name || 'English',
        nativeName: language?.nativeName || 'English', 
        shortName: language?.shortName || 'EN',
        flag: getLanguageFlag(langCode),
        flagDetails: flagDetails,
        countryCode: flagDetails.code,
        countryName: flagDetails.countryName,
      };
    },
    [availableLanguages, getLanguageFlag, getLanguageFlagDetails]
  );

  const getCurrentLanguageInfo = useCallback(() => {
    return getLanguageInfo(currentLanguage);
  }, [currentLanguage, getLanguageInfo]);

  // Get all supported languages with flags
  const getSupportedLanguagesWithFlags = useCallback(() => {
    return Object.keys(FLAG_MAPPING).map(langCode => getLanguageInfo(langCode));
  }, [getLanguageInfo]);

  return {
    // State
    currentLanguage,
    isLoading,
    error,
    isInitialized,
    availableLanguages,
    languageDisplayName,
    languageNativeName,
    languageShortName,
    
    // Actions
    switchLanguage,
    toggleLanguage,
    initLanguage,
    loadLanguage,
    clearLanguageError,
    
    // Helper functions
    getLanguageDisplayName,
    getLanguageNativeName,
    getLanguageShortName,
    
    // Flag-related functions
    getLanguageFlag,
    getLanguageFlagDetails,
    getCurrentLanguageFlag,
    getCurrentLanguageFlagDetails,
    getLanguageInfo,
    getCurrentLanguageInfo,
    getSupportedLanguagesWithFlags,
    
    // Constants for external use
    supportedLanguages: ['en', 'zh-TW'],
    flagMapping: FLAG_MAPPING,
    flagUnicodeMapping: FLAG_UNICODE_MAPPING,
  };
};