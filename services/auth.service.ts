import * as SecureStore from 'expo-secure-store';
import { api } from './api';
import type {
  AuthResponse,
  LoginRequest,
  OTPRequest,
  OTPVerifyRequest,
  RegisterRequest,
  User,
} from '@/types';

export const authService = {
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', data);
    await this.saveTokens(response.data);
    return response.data;
  },

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', data);
    await this.saveTokens(response.data);
    return response.data;
  },

  async sendOTP(data: OTPRequest): Promise<{ message: string }> {
    const response = await api.post('/auth/otp/send', data);
    return response.data;
  },

  async verifyOTP(data: OTPVerifyRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/otp/verify', data);
    await this.saveTokens(response.data);
    return response.data;
  },

  async getMe(): Promise<User> {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      await this.clearTokens();
    }
  },

  async refreshToken(): Promise<void> {
    const refreshToken = await SecureStore.getItemAsync('refreshToken');
    const userId = await SecureStore.getItemAsync('userId');
    
    if (!refreshToken || !userId) {
      throw new Error('No refresh token available');
    }

    const response = await api.post<AuthResponse>('/auth/refresh', {
      refreshToken,
      userId,
    });
    
    await this.saveTokens(response.data);
  },

  async saveTokens(data: AuthResponse): Promise<void> {
    await SecureStore.setItemAsync('accessToken', data.accessToken);
    await SecureStore.setItemAsync('refreshToken', data.refreshToken);
    await SecureStore.setItemAsync('userId', data.user.id);
    api.defaults.headers.common.Authorization = `Bearer ${data.accessToken}`;
  },

  async clearTokens(): Promise<void> {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    await SecureStore.deleteItemAsync('userId');
    delete api.defaults.headers.common.Authorization;
  },

  async getStoredToken(): Promise<string | null> {
    return await SecureStore.getItemAsync('accessToken');
  },
};
