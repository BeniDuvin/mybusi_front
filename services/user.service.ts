import type { PaginatedResponse, Role, User } from '@/types';
import { api } from './api';

/**
 * POST /users — Admin uniquement
 * Body: email, phone?, password, firstName, lastName, role, isActive
 * Règles: password min 6, firstName+lastName obligatoires, email OU phone obligatoire
 */
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
    email?: string;
    phone?: string;
    firstName: string;
    lastName: string;
    role: Role;
    password: string;
    isActive?: boolean;
  }): Promise<User> {
    const email = data.email?.trim();
    const phone = data.phone?.trim();
    if (!email && !phone) {
      throw new Error('Email ou téléphone obligatoire');
    }

    const payload: Record<string, unknown> = {
      password: data.password,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      role: data.role || 'CLIENT',
      isActive: data.isActive ?? true,
    };

    if (email) payload.email = email;
    if (phone) payload.phone = phone;

    const response = await api.post<User>('/users', payload);
    return response.data;
  },
};
