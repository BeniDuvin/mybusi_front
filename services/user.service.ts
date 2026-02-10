import type { PaginatedResponse, Role, User } from '@/types';
import { api } from './api';

export const userService = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: Role;
    isActive?: boolean;
  }): Promise<PaginatedResponse<User>> {
    const response = await api.get<PaginatedResponse<User>>('/users', { params });
    return response.data;
  },

  async update(
    id: string,
    data: Partial<Pick<User, 'firstName' | 'lastName' | 'email' | 'phone' | 'role' | 'isActive'>>
  ): Promise<User> {
    const response = await api.patch<User>(`/users/${id}`, data);
    return response.data;
  },

  async create(data: {
    email: string;
    phone?: string;
    firstName: string;
    lastName: string;
    role: Role;
    password?: string;
    isActive?: boolean;
  }): Promise<User> {
    const response = await api.post<User>('/users', data);
    return response.data;
  },
};
