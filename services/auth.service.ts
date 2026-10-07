import * as SecureStore from 'expo-secure-store';
import { api } from './api';
import type {
  AuthResponse,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  LoginRequest,
  OTPRequest,
  OTPVerifyRequest,
  RegisterRequest,
  ResetPasswordRequest,
  User,
} from '@/types';

export const authService = {
  async register(data: RegisterRequest): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/auth/register', data);
    return response.data;
  },

  async verifyEmail(data: { email: string; otpCode: string }): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/email/verify', data);
    await this.saveTokens(response.data);
    return response.data;
  },

  async resendEmailOtp(email: string): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/auth/email/resend', { email });
    return response.data;
  },

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', data);
    await this.saveTokens(response.data);
    return response.data;
  },

  async exchangeGoogleCode(code: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/google/exchange', { code });
    await this.saveTokens(response.data);
    return response.data;
  },

  async requestPasswordReset(data: ForgotPasswordRequest): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/auth/password/forgot', data);
    return response.data;
  },

  async resetPassword(data: ResetPasswordRequest): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/auth/password/reset', data);
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
    try {
      const response = await api.get<User>('/auth/me');
      return response.data;
    } catch (error: any) {
      const status = error?.response?.status;
      if (status !== 404) {
        throw error;
      }
      const fallback = await api.get<User>('/users/me');
      return fallback.data;
    }
  },

  async changePassword(data: ChangePasswordRequest): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/auth/change-password', data);
    return response.data;
  },

  async updateProfile(
    userId: string,
    data: Partial<Pick<User, 'firstName' | 'lastName' | 'email' | 'phone'>>
  ): Promise<User> {
    const { userService } = await import('./user.service');
    return userService.update(userId, data);
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
