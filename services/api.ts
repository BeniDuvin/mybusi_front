import { API_BASE_URL } from '@/utils/constants';
import axios, { AxiosError } from 'axios';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const fallbackBaseUrl =
  Platform.OS === 'android' && !Constants.isDevice
    ? 'http://10.0.2.2:3000/api/v1'
    : Platform.OS === 'ios' && !Constants.isDevice
      ? 'http://localhost:3000/api/v1'
      : API_BASE_URL;

const configuredBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  Constants.expoConfig?.extra?.apiBaseUrl ||
  fallbackBaseUrl;

const isLocalhost = configuredBaseUrl.includes('localhost') || configuredBaseUrl.includes('127.0.0.1');
const runtimeApiBaseUrl =
  Platform.OS === 'android' && !Constants.isDevice && isLocalhost
    ? 'http://10.0.2.2:3000/api/v1'
    : configuredBaseUrl;

if (Platform.OS === 'android' && Constants.isDevice && isLocalhost) {
  console.warn(
    'API baseURL is set to localhost on a device. Use your PC local IP instead.'
  );
}

console.log('API baseURL:', runtimeApiBaseUrl);

export const api = axios.create({
  baseURL: runtimeApiBaseUrl,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // Handle 401 errors (token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        const userId = await SecureStore.getItemAsync('userId');

        if (refreshToken && userId) {
          const response = await axios.post(
            `${api.defaults.baseURL}/auth/refresh`,
            { refreshToken, userId }
          );

          const { accessToken } = response.data;
          await SecureStore.setItemAsync('accessToken', accessToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
        await SecureStore.deleteItemAsync('userId');
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
