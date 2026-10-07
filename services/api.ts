import { API_BASE_URL } from '@/utils/constants';
import axios, { AxiosError } from 'axios';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { useAppStore } from '@/stores/app.store';

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
let runtimeApiBaseUrl =
  Platform.OS === 'android' && !Constants.isDevice && isLocalhost
    ? 'http://10.0.2.2:3000/api/v1'
    : configuredBaseUrl;
// S'assurer que baseURL se termine par / pour éviter v1auth au lieu de v1/auth
if (runtimeApiBaseUrl && !runtimeApiBaseUrl.endsWith('/')) {
  runtimeApiBaseUrl += '/';
}

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

async function clearStoredAuthentication() {
  await Promise.all([
    SecureStore.deleteItemAsync('accessToken'),
    SecureStore.deleteItemAsync('refreshToken'),
    SecureStore.deleteItemAsync('userId'),
    SecureStore.deleteItemAsync('user'),
  ]);
  delete api.defaults.headers.common.Authorization;
  await useAppStore.getState().setSelectedDepotId(null);
}

// Request interceptor attaches authentication and the active tenant context.
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('accessToken');
    const depotId = useAppStore.getState().selectedDepotId ?? await SecureStore.getItemAsync('selectedDepotId');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    const scoped = /^\/(products|stock|sales|payments|purchases|clients|suppliers|finance|expenses|other-incomes|salaries|invoices|logs)(\/|$)/.test(config.url || '');
    if (depotId && scoped && config.method?.toLowerCase() === 'get') {
      config.params = { ...config.params, depotId: config.params?.depotId || depotId };
    }
    if (depotId && ['/clients', '/suppliers', '/salaries'].includes(config.url || '') && config.data && typeof config.data === 'object') {
      config.data = { ...config.data, depotId: config.data.depotId || depotId };
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // Handle 401 errors (token expired)
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      let refreshedTokens: { accessToken: string; refreshToken?: string };

      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        const userId = await SecureStore.getItemAsync('userId');

        if (!refreshToken || !userId) {
          throw new Error('Missing refresh credentials');
        }

        const response = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          { refreshToken, userId }
        );
        refreshedTokens = response.data;
      } catch {
        await clearStoredAuthentication();
        // Keep the original 401 so callers can handle an expired session consistently.
        return Promise.reject(error);
      }

      await SecureStore.setItemAsync('accessToken', refreshedTokens.accessToken);
      // The backend rotates refresh tokens, so persist the replacement with every refresh.
      if (refreshedTokens.refreshToken) {
        await SecureStore.setItemAsync('refreshToken', refreshedTokens.refreshToken);
      }

      originalRequest.headers.Authorization = `Bearer ${refreshedTokens.accessToken}`;
      return api(originalRequest);
    }

    return Promise.reject(error);
  }
);
