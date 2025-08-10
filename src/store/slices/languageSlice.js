
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as RNLocalize from 'react-native-localize';
import i18n from '../../i18n';

const LANGUAGE_KEY = 'selected_language';

// Get device language
const getDeviceLanguage = () => {
  const locales = RNLocalize.getLocales();
  if (locales.length > 0) {
    const deviceLanguage = locales[0].languageTag;
    if (deviceLanguage.includes('zh') && 
        (deviceLanguage.includes('TW') || deviceLanguage.includes('Hant'))) {
      return 'zh-TW';
    }
    return deviceLanguage.startsWith('zh') ? 'zh-TW' : 'en';
  }
  return 'en';
};

// Available languages configuration
export const availableLanguages = [
  { 
    code: 'en', 
    name: 'English', 
    nativeName: 'English',
    shortName: 'EN'
  },
  { 
    code: 'zh-TW', 
    name: 'Traditional Chinese', 
    nativeName: '繁體中文',
    shortName: '中'
  },
];

// Async thunks
export const initializeLanguage = createAsyncThunk(
  'language/initialize',
  async (_, { rejectWithValue }) => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
      const language = savedLanguage || getDeviceLanguage();
      
      // Change i18n language
      await i18n.changeLanguage(language);
      
      console.log('🌍 Language initialized:', language);
      return language;
    } catch (error) {
      console.log('❌ Error initializing language:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const changeLanguage = createAsyncThunk(
  'language/change',
  async (languageCode, { rejectWithValue }) => {
    try {
      // Save to AsyncStorage
      await AsyncStorage.setItem(LANGUAGE_KEY, languageCode);
      
      // Change i18n language
      await i18n.changeLanguage(languageCode);
      
      console.log('✅ Language changed to:', languageCode);
      return languageCode;
    } catch (error) {
      console.log('❌ Error changing language:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const loadSavedLanguage = createAsyncThunk(
  'language/loadSaved',
  async (_, { rejectWithValue }) => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (savedLanguage) {
        await i18n.changeLanguage(savedLanguage);
        return savedLanguage;
      }
      return null;
    } catch (error) {
      console.log('❌ Error loading saved language:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Initial state
const initialState = {
  currentLanguage: 'en',
  isLoading: false,
  isInitialized: false,
  error: null,
  availableLanguages,
};

// Language slice
const languageSlice = createSlice({
  name: 'language',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetLanguageState: (state) => {
      return { ...initialState };
    },
  },
  extraReducers: (builder) => {
    builder
      // Initialize language
      .addCase(initializeLanguage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(initializeLanguage.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentLanguage = action.payload;
        state.isInitialized = true;
        state.error = null;
      })
      .addCase(initializeLanguage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.isInitialized = true;
        // Fallback to default language
        state.currentLanguage = getDeviceLanguage();
      })
      
      // Change language
      .addCase(changeLanguage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(changeLanguage.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentLanguage = action.payload;
        state.error = null;
      })
      .addCase(changeLanguage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Load saved language
      .addCase(loadSavedLanguage.fulfilled, (state, action) => {
        if (action.payload) {
          state.currentLanguage = action.payload;
        }
      });
  },
});

// Action creators
export const { clearError, resetLanguageState } = languageSlice.actions;

// Selectors
export const selectCurrentLanguage = (state) => state.language.currentLanguage;
export const selectLanguageLoading = (state) => state.language.isLoading;
export const selectLanguageError = (state) => state.language.error;
export const selectIsLanguageInitialized = (state) => state.language.isInitialized;
export const selectAvailableLanguages = (state) => state.language.availableLanguages;

// Helper selectors
export const selectLanguageDisplayName = (state) => {
  const currentLang = state.language.currentLanguage;
  const language = state.language.availableLanguages.find(lang => lang.code === currentLang);
  return language?.name || 'English';
};

export const selectLanguageNativeName = (state) => {
  const currentLang = state.language.currentLanguage;
  const language = state.language.availableLanguages.find(lang => lang.code === currentLang);
  return language?.nativeName || 'English';
};

export const selectLanguageShortName = (state) => {
  const currentLang = state.language.currentLanguage;
  const language = state.language.availableLanguages.find(lang => lang.code === currentLang);
  return language?.shortName || 'EN';
};

export default languageSlice.reducer;