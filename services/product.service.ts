import { api } from './api';
import type {
  Brand,
  Category,
  CreateProductRequest,
  PaginatedResponse,
  Product,
} from '@/types';

export const productService = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    brandId?: string;
    supplierId?: string;
    depotId?: string;
    isActive?: boolean;
  }): Promise<PaginatedResponse<Product>> {
    const response = await api.get<PaginatedResponse<Product>>('/products', { params });
    return response.data;
  },

  async getLowStock(depotId?: string): Promise<Product[]> {
    const response = await api.get<Product[]>('/products/low-stock', {
      params: { depotId },
    });
    return response.data;
  },

  async getById(id: string): Promise<Product> {
    const response = await api.get<Product>(`/products/${id}`);
    return response.data;
  },

  async create(data: CreateProductRequest): Promise<Product> {
    const response = await api.post<Product>('/products', data);
    return response.data;
  },

  async update(id: string, data: Partial<CreateProductRequest>): Promise<Product> {
    const response = await api.patch<Product>(`/products/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/products/${id}`);
  },
};

export const categoryService = {
  async getAll(): Promise<Category[]> {
    const response = await api.get<Category[]>('/categories');
    return response.data;
  },

  async getById(id: string): Promise<Category> {
    const response = await api.get<Category>(`/categories/${id}`);
    return response.data;
  },

  async create(data: { name: string; description?: string }): Promise<Category> {
    const response = await api.post<Category>('/categories', data);
    return response.data;
  },

  async update(id: string, data: { name?: string; description?: string }): Promise<Category> {
    const response = await api.patch<Category>(`/categories/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/categories/${id}`);
  },
};

export const brandService = {
  async getAll(): Promise<Brand[]> {
    const response = await api.get<Brand[]>('/brands');
    return response.data;
  },

  async getById(id: string): Promise<Brand> {
    const response = await api.get<Brand>(`/brands/${id}`);
    return response.data;
  },

  async create(data: { name: string; description?: string }): Promise<Brand> {
    const response = await api.post<Brand>('/brands', data);
    return response.data;
  },

  async update(id: string, data: { name?: string; description?: string }): Promise<Brand> {
    const response = await api.patch<Brand>(`/brands/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/brands/${id}`);
  },
};
