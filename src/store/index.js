
import { configureStore } from '@reduxjs/toolkit';
import analysisReducer from './slices/analysisSlice';
import authReducer from './slices/authSlice';
import languageSlice from './slices/languageSlice';

export const store = configureStore({
  reducer: {
    analysis: analysisReducer,
    auth: authReducer,
    language: languageSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;