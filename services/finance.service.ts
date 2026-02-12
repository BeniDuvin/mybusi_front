import { api } from './api';
import type {
  CashFlowItem,
  CreateExpenseRequest,
  CreateSalaryRequest,
  Expense,
  FinanceSummary,
  PaginatedResponse,
  SalaryPayment,
} from '@/types';

export const financeService = {
  async getSummary(params?: {
    depotId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<FinanceSummary> {
    const response = await api.get<FinanceSummary | { data?: FinanceSummary }>('/finance/summary', {
      params,
    });
    const raw = response.data;
    const data = (raw as { data?: FinanceSummary })?.data ?? (raw as FinanceSummary);
    const toNum = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);
    return {
      totalSales: toNum(data?.totalSales ?? (data as any)?.totalRevenue),
      totalPurchases: toNum(data?.totalPurchases ?? (data as any)?.totalPurchase),
      totalExpenses: toNum(data?.totalExpenses ?? (data as any)?.totalExpense),
      totalSalaries: toNum(data?.totalSalaries ?? (data as any)?.totalSalary),
      netProfit: toNum(data?.netProfit ?? (data as any)?.profit),
      cashBalance: toNum(data?.cashBalance),
    };
  },

  async getCashFlow(params?: {
    depotId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<CashFlowItem[]> {
    const response = await api.get<CashFlowItem[]>('/finance/cashflow', { params });
    return response.data;
  },

  async getDashboard(depotId?: string): Promise<{
    todaySales: number;
    todayRevenue: number;
    monthSales: number;
    monthRevenue: number;
    lowStockCount: number;
    pendingOrdersCount: number;
  }> {
    const response = await api.get('/finance/dashboard', {
      params: { depotId },
    });
    return response.data;
  },
};

export const expenseService = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    depotId?: string;
    category?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedResponse<Expense>> {
    const response = await api.get<PaginatedResponse<Expense>>('/expenses', { params });
    return response.data;
  },

  async getById(id: string): Promise<Expense> {
    const response = await api.get<Expense>(`/expenses/${id}`);
    return response.data;
  },

  async create(data: CreateExpenseRequest): Promise<Expense> {
    const response = await api.post<Expense>('/expenses', data);
    return response.data;
  },

  async update(id: string, data: Partial<CreateExpenseRequest>): Promise<Expense> {
    const response = await api.patch<Expense>(`/expenses/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/expenses/${id}`);
  },
};

export const salaryService = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    userId?: string;
    period?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedResponse<SalaryPayment>> {
    const response = await api.get<PaginatedResponse<SalaryPayment>>('/salaries', { params });
    return response.data;
  },

  async getById(id: string): Promise<SalaryPayment> {
    const response = await api.get<SalaryPayment>(`/salaries/${id}`);
    return response.data;
  },

  async create(data: CreateSalaryRequest): Promise<SalaryPayment> {
    const response = await api.post<SalaryPayment>('/salaries', data);
    return response.data;
  },

  async update(id: string, data: Partial<Omit<CreateSalaryRequest, 'userId'>>): Promise<SalaryPayment> {
    const response = await api.patch<SalaryPayment>(`/salaries/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/salaries/${id}`);
  },
};
