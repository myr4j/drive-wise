import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { config } from '@/config';
import { ApiErrorClass } from '@/types/api';

// Storage keys
const STORAGE_KEYS = {
  AUTH_TOKEN: '@drivewise:auth_token',
  DRIVER_DATA: '@drivewise:driver_data',
};

// In-memory storage for development (Expo SDK 54 compatibility)
const memoryStore: Record<string, string> = {};

const storage = {
  getItem: async (key: string): Promise<string | null> => {
    return memoryStore[key] || null;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    memoryStore[key] = value;
  },
  removeItem: async (key: string): Promise<void> => {
    delete memoryStore[key];
  },
};

// Create axios instance with base configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: config.apiUrl,
  timeout: config.apiTimeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token if available
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await storage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorClass>) => {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      const detail = data?.detail || 'An unexpected error occurred';

      // Handle specific error codes
      switch (status) {
        case 401:
          console.error('Unauthorized - invalid credentials');
          break;
        case 403:
          console.error('Forbidden - insufficient permissions');
          break;
        case 404:
          console.error('Resource not found');
          break;
        case 409:
          console.error('Conflict - resource already exists');
          break;
        case 422:
          console.error('Validation error:', data);
          break;
        case 500:
          console.error('Server error - please try again later');
          break;
        default:
          console.error(`API Error: ${status}`);
      }

      // Return structured ApiError with all information
      return Promise.reject(new ApiErrorClass(detail, status, data?.code, data));
    }

    // Network error or timeout
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new ApiErrorClass('Request timeout - please check your connection'));
    }

    return Promise.reject(new ApiErrorClass('Network error - please check your connection'));
  }
);

export default apiClient;
