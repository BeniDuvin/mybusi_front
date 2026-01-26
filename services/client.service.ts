import { api } from './api';
import type { Client, CreateClientRequest, PaginatedResponse } from '@/types';

export const clientService = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginatedResponse<Client>> {
    const response = await api.get<PaginatedResponse<Client>>('/clients', { params });
    return response.data;
  },

  async getById(id: string): Promise<Client> {
    const response = await api.get<Client>(`/clients/${id}`);
    return response.data;
  },

  async getStats(id: string): Promise<{
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    lastOrderDate?: string;
  }> {
    const response = await api.get(`/clients/${id}/stats`);
    return response.data;
  },

  async create(data: CreateClientRequest): Promise<Client> {
    const response = await api.post<Client>('/clients', data);
    return response.data;
  },

  async update(id: string, data: Partial<CreateClientRequest>): Promise<Client> {
    const response = await api.patch<Client>(`/clients/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/clients/${id}`);
  },
};
