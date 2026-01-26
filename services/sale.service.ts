import { api } from './api';
import type {
  CreatePaymentRequest,
  CreateSaleRequest,
  PaginatedResponse,
  Payment,
  Sale,
} from '@/types';

export const saleService = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    depotId?: string;
    clientId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedResponse<Sale>> {
    const response = await api.get<PaginatedResponse<Sale>>('/sales', { params });
    return response.data;
  },

  async getReport(params?: {
    depotId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{
    totalSales: number;
    totalRevenue: number;
    averageOrderValue: number;
    salesByDay: Array<{ date: string; total: number; count: number }>;
  }> {
    const response = await api.get('/sales/report', { params });
    return response.data;
  },

  async getById(id: string): Promise<Sale> {
    const response = await api.get<Sale>(`/sales/${id}`);
    return response.data;
  },

  async create(data: CreateSaleRequest): Promise<Sale> {
    const response = await api.post<Sale>('/sales', data);
    return response.data;
  },

  async update(id: string, data: Partial<CreateSaleRequest>): Promise<Sale> {
    const response = await api.patch<Sale>(`/sales/${id}`, data);
    return response.data;
  },

  async cancel(id: string): Promise<Sale> {
    const response = await api.post<Sale>(`/sales/${id}/cancel`);
    return response.data;
  },
};

export const paymentService = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    saleId?: string;
    clientId?: string;
    method?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedResponse<Payment>> {
    const response = await api.get<PaginatedResponse<Payment>>('/payments', { params });
    return response.data;
  },

  async getById(id: string): Promise<Payment> {
    const response = await api.get<Payment>(`/payments/${id}`);
    return response.data;
  },

  async create(data: CreatePaymentRequest): Promise<Payment> {
    const response = await api.post<Payment>('/payments', data);
    return response.data;
  },

  async verify(id: string): Promise<Payment> {
    const response = await api.post<Payment>(`/payments/${id}/verify`);
    return response.data;
  },
};
