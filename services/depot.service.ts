import { api } from './api';
import type { CreateDepotRequest, Depot, PaginatedResponse } from '@/types';

export const depotService = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginatedResponse<Depot>> {
    const response = await api.get<PaginatedResponse<Depot>>('/depots', { params });
    return response.data;
  },

  async getById(id: string): Promise<Depot> {
    const response = await api.get<Depot>(`/depots/${id}`);
    return response.data;
  },

  async create(data: CreateDepotRequest): Promise<Depot> {
    const response = await api.post<Depot>('/depots', data);
    return response.data;
  },

  async update(id: string, data: Partial<CreateDepotRequest>): Promise<Depot> {
    const response = await api.patch<Depot>(`/depots/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/depots/${id}`);
  },

  async assignUser(userId: string, depotId: string): Promise<void> {
    await api.post('/depots/assign-user', { userId, depotId });
  },

  async removeUser(depotId: string, userId: string): Promise<void> {
    await api.delete(`/depots/${depotId}/users/${userId}`);
  },
};
