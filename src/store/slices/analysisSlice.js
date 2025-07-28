// store/slices/analysisSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import RNFS from 'react-native-fs';

// Async thunk for image analysis
export const analyzeImages = createAsyncThunk(
  'analysis/analyzeImages',
  async (imagePaths, { rejectWithValue }) => {
    try {
      console.log('Starting analysis for images:', imagePaths);
      
      // Convert all images to base64
      const base64Images = [];
      for (let i = 0; i < imagePaths.length; i++) {
        console.log(`Converting image ${i + 1}/${imagePaths.length}:`, imagePaths[i]);
        const base64 = await RNFS.readFile(imagePaths[i], 'base64');
        base64Images.push(base64);
        console.log(`Image ${i + 1} converted, length:`, base64.length);
      }

      console.log('All images converted, preparing API request...');

      // Prepare form data - Try different approaches
      const formData = new FormData();
      
      // Method 1: Append each image with array notation
      base64Images.forEach((base64Image, index) => {
        formData.append(`images[${index}]`, base64Image);
      });

      console.log('FormData prepared, making API request...');

      // Make API request
      const response = await fetch(
        'https://staging.greenbidz.com/wp-json/greenbidz-api/v1/analize_process_images',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'multipart/form-data',
            // Add any required headers
          },
          body: formData,
        }
      );

      console.log('API Response status:', response.status);
      const responseData = await response.json();
      console.log('API Response data:', responseData);

      if (response.ok) {
        return {
          ...responseData,
          images: imagePaths,
          imageCount: imagePaths.length,
        };
      } else {
        console.error('API Error:', responseData);
        throw new Error(responseData.message || 'Analysis failed');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      return rejectWithValue(error.message);
    }
  }
);

const analysisSlice = createSlice({
  name: 'analysis',
  initialState: {
    // Analysis data
    analysisData: null,
    images: [],
    imageCount: 0,
    
    // Loading states
    loading: false,
    error: null,
    
    // Analysis fields (editable)
    fields: {
      title: { value: '', editing: false },
      brand: { value: '', editing: false },
      model: { value: '', editing: false },
      year: { value: '', editing: false },
      description: { value: '', editing: false },
    },
    
    // Submission state
    isSubmitting: false,
    submitError: null,
  },
  reducers: {
    // Clear analysis data
    clearAnalysis: (state) => {
      state.analysisData = null;
      state.images = [];
      state.imageCount = 0;
      state.error = null;
      state.fields = {
        title: { value: '', editing: false },
        brand: { value: '', editing: false },
        model: { value: '', editing: false },
        year: { value: '', editing: false },
        description: { value: '', editing: false },
      };
    },
    
    // Update field values
    updateField: (state, action) => {
      const { field, value } = action.payload;
      if (state.fields[field]) {
        state.fields[field].value = value;
      }
    },
    
    // Toggle field editing
    toggleFieldEditing: (state, action) => {
      const { field, editing } = action.payload;
      if (state.fields[field]) {
        state.fields[field].editing = editing;
      }
    },
    
    // Set submission state
    setSubmissionState: (state, action) => {
      state.isSubmitting = action.payload.isSubmitting;
      state.submitError = action.payload.error || null;
    },
    
    // Initialize fields from analysis data
    initializeFields: (state, action) => {
      const data = action.payload;
      state.fields = {
        title: { value: data.title || 'Machine Title', editing: false },
        brand: { value: data.brand || 'Brand Name', editing: false },
        model: { value: data.model || 'Model', editing: false },
        year: { value: data.year || '2023', editing: false },
        description: { value: data.description || 'Machine description', editing: false },
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle analyzeImages pending
      .addCase(analyzeImages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      // Handle analyzeImages fulfilled
      .addCase(analyzeImages.fulfilled, (state, action) => {
        state.loading = false;
        state.analysisData = action.payload;
        state.images = action.payload.images;
        state.imageCount = action.payload.imageCount;
        
        // Initialize fields with analysis data
        if (action.payload.success && action.payload.data) {
          const data = action.payload.data;
          state.fields = {
            title: { value: data.title || 'Machine Title', editing: false },
            brand: { value: data.brand || 'Brand Name', editing: false },
            model: { value: data.model || 'Model', editing: false },
            year: { value: data.year || '2023', editing: false },
            description: { value: data.description || 'Machine description', editing: false },
          };
        }
      })
      // Handle analyzeImages rejected
      .addCase(analyzeImages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Analysis failed';
      });
  },
});

export const {
  clearAnalysis,
  updateField,
  toggleFieldEditing,
  setSubmissionState,
  initializeFields,
} = analysisSlice.actions;

export default analysisSlice.reducer;