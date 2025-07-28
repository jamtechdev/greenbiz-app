// store/index.js
import { configureStore } from '@reduxjs/toolkit';
import analysisReducer from './slices/analysisSlice';
import authReducer from './slices/authSlice';

export const store = configureStore({
  reducer: {
    analysis: analysisReducer,
    auth: authReducer,
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