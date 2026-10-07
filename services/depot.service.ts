import { api } from './api';
import type { CreateDepotRequest, Depot, PaginatedResponse, StoreMember, StoreMemberRole, Subscription } from '@/types';

export const depotService = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginatedResponse<Depot>> {
    const response = await api.get<PaginatedResponse<Depot>>('/stores', { params });
    return response.data;
  },

  async getById(id: string): Promise<Depot> {
    const response = await api.get<Depot>(`/stores/${id}`);
    return response.data;
  },

  async create(data: CreateDepotRequest): Promise<Depot> {
    const response = await api.post<Depot>('/stores', data);
    return response.data;
  },

  async update(id: string, data: Partial<CreateDepotRequest>): Promise<Depot> {
    const response = await api.patch<Depot>(`/stores/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/stores/${id}`);
  },

  async assignUser(userId: string, depotId: string, role: StoreMemberRole = 'VENDEUR'): Promise<void> {
    await api.post(`/stores/${depotId}/members`, { userId, role });
  },

  async inviteMember(data: {
    depotId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: StoreMemberRole;
  }): Promise<{ message: string; existingAccount: boolean }> {
    const { depotId, ...payload } = data;
    const response = await api.post<{ message: string; existingAccount: boolean }>(
      `/stores/${depotId}/members/invite`,
      payload,
    );
    return response.data;
  },

  async removeUser(depotId: string, userId: string): Promise<void> {
    await api.delete(`/stores/${depotId}/members/${userId}`);
  },

  async getMembers(depotId: string): Promise<StoreMember[]> {
    const response = await api.get<StoreMember[]>(`/stores/${depotId}/members`);
    return response.data;
  },

  async updateMemberRole(depotId: string, userId: string, role: StoreMemberRole): Promise<void> {
    await api.patch(`/stores/${depotId}/members/${userId}`, { role });
  },

  async getSubscription(depotId: string): Promise<Subscription | null> {
    const response = await api.get<Subscription | null>(`/stores/${depotId}/subscription`);
    return response.data;
  },
};
