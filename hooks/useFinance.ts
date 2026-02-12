import {
    expenseService,
    financeService,
    salaryService,
} from '@/services/finance.service';
import type { CreateExpenseRequest, CreateSalaryRequest } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const useFinanceSummary = (
  params?: {
    depotId?: string;
    startDate?: string;
    endDate?: string;
  },
  options?: {
    enabled?: boolean;
  }
) => {
  return useQuery({
    queryKey: ['finance', 'summary', params],
    queryFn: () => financeService.getSummary(params),
    enabled: options?.enabled !== false,
  });
};

export const useCashFlow = (params?: {
  depotId?: string;
  startDate?: string;
  endDate?: string;
}) => {
  return useQuery({
    queryKey: ['finance', 'cashflow', params],
    queryFn: () => financeService.getCashFlow(params),
  });
};

export const useFinanceDashboard = (params?: { depotId?: string; enabled?: boolean }) => {
  return useQuery({
    queryKey: ['finance', 'dashboard', params?.depotId],
    queryFn: () => financeService.getDashboard(params?.depotId),
    enabled: params?.enabled !== false,
  });
};

// Expenses
export const useExpenses = (params?: {
  page?: number;
  limit?: number;
  depotId?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
}) => {
  return useQuery({
    queryKey: ['expenses', params],
    queryFn: () => expenseService.getAll(params),
  });
};

export const useCreateExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateExpenseRequest) => expenseService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['finance'] });
    },
  });
};

export const useUpdateExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateExpenseRequest> }) =>
      expenseService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expenses', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['finance'] });
    },
  });
};

export const useDeleteExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => expenseService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['finance'] });
    },
  });
};

// Salaries
export const useSalaries = (params?: {
  page?: number;
  limit?: number;
  userId?: string;
  period?: string;
  startDate?: string;
  endDate?: string;
}) => {
  return useQuery({
    queryKey: ['salaries', params],
    queryFn: () => salaryService.getAll(params),
  });
};

export const useCreateSalary = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSalaryRequest) => salaryService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salaries'] });
      queryClient.invalidateQueries({ queryKey: ['finance'] });
    },
  });
};

export const useUpdateSalary = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<CreateSalaryRequest, 'userId'>> }) =>
      salaryService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['salaries'] });
      queryClient.invalidateQueries({ queryKey: ['salaries', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['finance'] });
    },
  });
};

export const useDeleteSalary = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => salaryService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salaries'] });
      queryClient.invalidateQueries({ queryKey: ['finance'] });
    },
  });
};
