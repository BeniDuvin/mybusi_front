import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  expenseService,
  financeService,
  salaryService,
} from '@/services/finance.service';
import type { CreateExpenseRequest, CreateSalaryRequest } from '@/types';

export const useFinanceSummary = (params?: {
  depotId?: string;
  startDate?: string;
  endDate?: string;
}) => {
  return useQuery({
    queryKey: ['finance', 'summary', params],
    queryFn: () => financeService.getSummary(params),
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

export const useFinanceDashboard = (depotId?: string) => {
  return useQuery({
    queryKey: ['finance', 'dashboard', depotId],
    queryFn: () => financeService.getDashboard(depotId),
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
