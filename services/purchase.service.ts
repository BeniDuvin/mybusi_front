import type {
    CreatePurchaseRequest,
    CreateSupplierRequest,
    PaginatedResponse,
    Purchase,
    Supplier,
} from '@/types';
import { api } from './api';

export const purchaseService = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    depotId?: string;
    supplierId?: string;
    status?: string;
    search?: string;
  }): Promise<PaginatedResponse<Purchase>> {
    const response = await api.get<PaginatedResponse<Purchase>>('/purchases', { params });
    return response.data;
  },

  async getById(id: string): Promise<Purchase> {
    const response = await api.get<Purchase>(`/purchases/${id}`);
    return response.data;
  },

  async create(data: CreatePurchaseRequest): Promise<Purchase> {
    const response = await api.post<Purchase>('/purchases', data);
    return response.data;
  },

  async update(id: string, data: Partial<CreatePurchaseRequest>): Promise<Purchase> {
    const response = await api.patch<Purchase>(`/purchases/${id}`, data);
    return response.data;
  },

  async pay(id: string, amount: number): Promise<Purchase> {
    const response = await api.post<Purchase>(`/purchases/${id}/pay`, { amount });
    return response.data;
  },
};

export const supplierService = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginatedResponse<Supplier>> {
    const response = await api.get<PaginatedResponse<Supplier>>('/suppliers', { params });
    return response.data;
  },

  async getById(id: string): Promise<Supplier> {
    const response = await api.get<Supplier>(`/suppliers/${id}`);
    return response.data;
  },

  async create(data: CreateSupplierRequest): Promise<Supplier> {
    const response = await api.post<Supplier>('/suppliers', data);
    return response.data;
  },

  async update(id: string, data: Partial<CreateSupplierRequest>): Promise<Supplier> {
    const response = await api.patch<Supplier>(`/suppliers/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/suppliers/${id}`);
  },
};
