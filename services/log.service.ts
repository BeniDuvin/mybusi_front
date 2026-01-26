import { api } from './api';
import type { Log, PaginatedResponse } from '@/types';

export const logService = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    userId?: string;
    depotId?: string;
    action?: string;
    entity?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedResponse<Log>> {
    const response = await api.get<PaginatedResponse<Log>>('/logs', { params });
    return response.data;
  },
};
