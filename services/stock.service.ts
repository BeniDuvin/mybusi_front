import { api } from './api';
import type {
  AddStockRequest,
  PaginatedResponse,
  Stock,
  StockMovement,
} from '@/types';

export const stockService = {
  async getByProduct(productId: string, depotId: string): Promise<Stock> {
    const response = await api.get<Stock>(`/stock/${productId}/${depotId}`);
    return response.data;
  },

  async getByDepot(depotId: string, params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Stock>> {
    const response = await api.get<PaginatedResponse<Stock>>(`/stock/depot/${depotId}`, {
      params,
    });
    return response.data;
  },

  async add(data: AddStockRequest): Promise<Stock> {
    const response = await api.post<Stock>('/stock/add', data);
    return response.data;
  },

  async remove(data: {
    productId: string;
    depotId: string;
    quantity: number;
    reason?: string;
  }): Promise<Stock> {
    const response = await api.post<Stock>('/stock/remove', data);
    return response.data;
  },

  async adjust(data: {
    productId: string;
    depotId: string;
    newQuantity: number;
    reason?: string;
  }): Promise<Stock> {
    const response = await api.post<Stock>('/stock/adjust', data);
    return response.data;
  },

  async getMovements(stockId: string, params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<StockMovement>> {
    const response = await api.get<PaginatedResponse<StockMovement>>(
      `/stock/movements/${stockId}`,
      { params }
    );
    return response.data;
  },

  async getLowStockAlerts(depotId?: string): Promise<Stock[]> {
    const response = await api.get<Stock[]>('/stock/alerts/low-stock', {
      params: { depotId },
    });
    return response.data;
  },
};
