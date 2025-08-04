import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

let customAlertHandlers = null;

export const setCustomAlertHandlers = handlers => {
  customAlertHandlers = handlers;
};

const apiClient = axios.create({
  baseURL: 'https://greenbidz.com/wp-json/greenbidz-api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

apiClient.interceptors.request.use(
  async config => {
    try {
      if (config.skipAuth) {
        delete config.skipAuth;
        return config;
      }

      const token = await AsyncStorage.getItem('userToken');
      const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');

      if (token && isLoggedIn === 'true') {
        config.headers.Authorization = `Bearer ${token}`;
      }

      if (__DEV__) {
        console.log(
          `🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`,
        );
        console.log('Headers:', config.headers);
        if (config.data && !(config.data instanceof FormData)) {
          console.log('Data:', config.data);
        } else if (config.data instanceof FormData) {
          console.log('FormData request detected');
        }
      }

      return config;
    } catch (error) {
      console.error('Request interceptor error:', error);
      return Promise.reject(error);
    }
  },
  error => {
    console.error('Request setup error:', error);
    return Promise.reject(error);
  },
);

apiClient.interceptors.response.use(
  response => {
    if (__DEV__) {
      console.log(
        `✅ API Response: ${response.config.method?.toUpperCase()} ${
          response.config.url
        }`,
      );
      console.log('Status:', response.status);
      console.log('Data:', response.data);
    }
    return response;
  },
  async error => {
    const originalRequest = error.config;

    if (__DEV__) {
      console.log(
        `❌ API Error: ${error.config?.method?.toUpperCase()} ${
          error.config?.url
        }`,
      );
      console.log('Error type:', error.code);
      console.log('Error message:', error.message);
      console.log('Status:', error.response?.status);
      console.log('Data:', error.response?.data);
    }

    // Handle network errors specifically
    if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
      if (customAlertHandlers?.showError) {
        customAlertHandlers.showError({
          title: 'Connection Error',
          message:
            'Unable to connect to the server. Please check your internet connection and try again.',
        });
      }
      return Promise.reject(error);
    }

    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          if (!originalRequest._retry) {
            originalRequest._retry = true;
            try {
              await handleUnauthorized();
              return Promise.reject(error);
            } catch (refreshError) {
              return Promise.reject(refreshError);
            }
          }
          break;

        case 403:
          if (customAlertHandlers?.showError) {
            customAlertHandlers.showError({
              title: 'Access Denied',
              message: "You don't have permission to perform this action.",
            });
          }
          break;

        case 404:
          if (customAlertHandlers?.showError) {
            customAlertHandlers.showError({
              title: 'Not Found',
              message: 'The requested resource was not found.',
            });
          }
          break;

        case 422:
          const validationMessage = data?.message || 'Validation failed';
          if (customAlertHandlers?.showError) {
            customAlertHandlers.showError({
              title: 'Validation Error',
              message: validationMessage,
            });
          }
          break;

        case 500:
          if (customAlertHandlers?.showError) {
            customAlertHandlers.showError({
              title: 'Server Error',
              message:
                'Something went wrong on our end. Please try again later.',
            });
          }
          break;

        default:
          const errorMessage =
            data?.message || `Request failed with status ${status}`;
          if (customAlertHandlers?.showError) {
            customAlertHandlers.showError({
              title: 'Request Failed',
              message: errorMessage,
            });
          }
      }
    } else if (error.request) {
      // Network error
      if (customAlertHandlers?.showError) {
        customAlertHandlers.showError({
          title: 'Network Error',
          message: 'Please check your internet connection and try again.',
        });
      }
    } else {
      // Other errors
      if (customAlertHandlers?.showError) {
        customAlertHandlers.showError({
          title: 'Error',
          message: error.message || 'An unexpected error occurred',
        });
      }
    }

    return Promise.reject(error);
  },
);

const handleUnauthorized = async () => {
  try {
    await AsyncStorage.multiRemove(['userToken', 'isLoggedIn', 'userProfile']);

    if (customAlertHandlers?.showLoginRequired) {
      customAlertHandlers.showLoginRequired({
        title: 'Session Expired',
        message: 'Your session has expired. Please log in again.',
      });
    }
  } catch (error) {
    console.error('Error handling unauthorized access:', error);
  }
};

// API service methods
export const apiService = {
  // Generic methods
  get: (url, config = {}) => apiClient.get(url, config),
  post: (url, data, config = {}) => apiClient.post(url, data, config),
  put: (url, data, config = {}) => apiClient.put(url, data, config),
  delete: (url, config = {}) => apiClient.delete(url, config),
  patch: (url, data, config = {}) => apiClient.patch(url, data, config),

  // Specialized method for file uploads
  uploadFiles: (url, formData, config = {}) => {
    return apiClient.post(url, formData, {
      ...config,
      headers: {
        ...config.headers,
        'Content-Type': 'multipart/form-data',
      },
      timeout: 120000, // Increased to 2 minutes for file upload
    });
  },

  // Direct FormData POST method
  saveProductDirect: async formData => {
    try {
      const token = await AsyncStorage.getItem('userToken');

      const response = await axios.post(
        'https://greenbidz.com/wp-json/greenbidz-api/v1/submit-product',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Accept: 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          timeout: 120000,
        },
      );

      return response;
    } catch (error) {
      console.error('❌ Error in saveProductDirect:', error);
      throw error;
    }
  },

  // Simplified saveProduct method for direct FormData POST
  saveProduct: async formData => {
    try {
      console.log('📤 Posting FormData directly to submit-product endpoint...');

      const token = await AsyncStorage.getItem('userToken');

      const response = await apiClient.post('/submit-product', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        timeout: 120000, // 2 minutes for file uploads
      });

      return response;
    } catch (error) {
      console.error('❌ Error in saveProduct:', error);
      throw error;
    }
  },

  // Original submitProduct method
  submitProduct: async (
    productData,
    images = [],
    documents = [],
    videos = [],
  ) => {
    try {
      console.log('📝 Preparing product submission...');
      console.log('Product data:', productData);
      console.log('Images count:', images.length);
      console.log('Documents count:', documents.length);
      console.log('Videos count:', videos.length);

      const formData = new FormData();

      // Append product data - ensure all values are strings
      Object.keys(productData).forEach(key => {
        console.log(key, productData[key], 'jiopppp');
        if (productData[key] !== null && productData[key] !== undefined) {
          // Convert objects/arrays to JSON strings
          const value =
            typeof productData[key] === 'object'
              ? JSON.stringify(productData[key])
              : String(productData[key]);
          formData.append(key, value);
        }
      });

      // Append images with proper structure
      if (images && images.length > 0) {
        images.forEach((imageUri, idx) => {
          if (typeof imageUri === 'string') {
            // Handle URI strings
            const fileExtension =
              imageUri.split('.').pop()?.toLowerCase() || 'jpg';
            const mimeType = `image/${
              fileExtension === 'jpg' ? 'jpeg' : fileExtension
            }`;

            formData.append(`images[${idx}]`, {
              uri: imageUri,
              name: `image_${idx}.${fileExtension}`,
              type: mimeType,
            });
          } else if (imageUri && imageUri.uri) {
            // Handle file objects
            formData.append(`images[${idx}]`, {
              uri: imageUri.uri,
              name: imageUri.name || `image_${idx}.jpg`,
              type: imageUri.type || 'image/jpeg',
            });
          }
        });
      }

      // Append documents
      if (documents && documents.length > 0) {
        documents.forEach((file, idx) => {
          if (file && file.uri) {
            formData.append(`documents[${idx}]`, {
              uri: file.uri,
              name: file.name || `document_${idx}.pdf`,
              type: file.type || 'application/pdf',
            });
          }
        });
      }

      // Append videos
      if (videos && videos.length > 0) {
        videos.forEach((file, idx) => {
          if (file && file.uri) {
            formData.append(`videos[${idx}]`, {
              uri: file.uri,
              name: file.name || `video_${idx}.mp4`,
              type: file.type || 'video/mp4',
            });
          }
        });
      }

      console.log('📤 Submitting product with FormData...');

      return await apiService.uploadFiles('/submit-product', productData);
    } catch (error) {
      console.error('❌ Error in submitProduct:', error);
      throw error;
    }
  },

  // Authentication methods
  login: credentials => {
    return axios.post(
      'https://greenbidz.com/wp-json/jwt-auth/v1/token',
      credentials,
      { skipAuth: true },
    );
  },

  register: userData => {
    return apiClient.post('/register', userData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // User profile methods
  updateProfile: profileData =>
    apiService.post('/user-profile/update', profileData),
  getUser: () => apiService.get('/user-profile'),

  // Product methods
  getProducts: (params = {}) => apiService.get('/products', { params }),
  getProduct: id => apiService.get(`/products/${id}`),
  getAllListing: () => apiService.get('/my-products'),

  // Image analysis
  analyzeImage: imageData =>
    apiService.post('/analize_process_images', imageData),

  // Category methods
  getCategories: () => apiService.get('/categories'),

  getSubCategories: parentId => {
    return apiService.get('/subcategories', {
      params: { parent_id: parentId },
    });
  },
  getProductById: id =>
    apiClient.get(`/product/view?product_id=${id}`),

  getCategoryIdByName: async categoryName => {
    try {
      const response = await apiService.get('/categories');
      const categories = response.data;

      const category = categories.find(
        cat => (cat.name || cat.label || cat.title || cat) === categoryName,
      );

      return category?.id || category?.term_id || null;
    } catch (error) {
      console.error('Error getting category ID:', error);
      return null;
    }
  },

  // Location methods
  getLocations: () => apiService.get('/locations'),

  // Auction methods
  getAuctionGroups: () => apiService.get('/auction-groups'),
};

export default apiClient;
