import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { paymentService, saleService } from '@/services/sale.service';
import type { CreatePaymentRequest, CreateSaleRequest } from '@/types';

export const useSales = (params?: {
  page?: number;
  limit?: number;
  depotId?: string;
  clientId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}) => {
  return useQuery({
    queryKey: ['sales', params],
    queryFn: () => saleService.getAll(params),
  });
};

export const useSale = (id: string) => {
  return useQuery({
    queryKey: ['sales', id],
    queryFn: () => saleService.getById(id),
    enabled: !!id,
  });
};

export const useSalesReport = (params?: {
  depotId?: string;
  startDate?: string;
  endDate?: string;
}) => {
  return useQuery({
    queryKey: ['sales', 'report', params],
    queryFn: () => saleService.getReport(params),
  });
};

export const useCreateSale = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSaleRequest) => saleService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      queryClient.invalidateQueries({ queryKey: ['finance'] });
    },
  });
};

export const useCancelSale = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => saleService.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
    },
  });
};

// Payments
export const usePayments = (params?: {
  page?: number;
  limit?: number;
  saleId?: string;
  clientId?: string;
  method?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}) => {
  return useQuery({
    queryKey: ['payments', params],
    queryFn: () => paymentService.getAll(params),
  });
};

export const useCreatePayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePaymentRequest) => paymentService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['finance'] });
    },
  });
};

export const useVerifyPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => paymentService.verify(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });
};
