// store/slices/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Async thunk for login
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await fetch('https://staging.greenbidz.com/wp-json/your-auth-endpoint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok) {
        // Store token in AsyncStorage
        await AsyncStorage.setItem('userToken', data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(data.user));
        
        return data;
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for checking existing auth
export const checkAuthStatus = createAsyncThunk(
  'auth/checkAuthStatus',
  async (_, { rejectWithValue }) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userData = await AsyncStorage.getItem('userData');
      
      if (token && userData) {
        return {
          token,
          user: JSON.parse(userData),
        };
      } else {
        throw new Error('No auth data found');
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for logout
export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      return true;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    // User data
    user: null,
    token: null,
    isAuthenticated: false,
    
    // Loading states
    loading: false,
    error: null,
    
    // Navigation state
    pendingNavigation: null, // Store where to navigate after login
  },
  reducers: {
    // Clear auth error
    clearAuthError: (state) => {
      state.error = null;
    },
    
    // Set pending navigation
    setPendingNavigation: (state, action) => {
      state.pendingNavigation = action.payload;
    },
    
    // Clear pending navigation
    clearPendingNavigation: (state) => {
      state.pendingNavigation = null;
    },
    
    // Manual logout (for UI)
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.pendingNavigation = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle loginUser
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })
      
      // Handle checkAuthStatus
      .addCase(checkAuthStatus.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(checkAuthStatus.rejected, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
      })
      
      // Handle logoutUser
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.pendingNavigation = null;
      });
  },
});

export const {
  clearAuthError,
  setPendingNavigation,
  clearPendingNavigation,
  logout,
} = authSlice.actions;

export default authSlice.reducer;