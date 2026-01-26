import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { depotService } from '@/services/depot.service';
import type { CreateDepotRequest } from '@/types';

export const useDepots = (params?: {
  page?: number;
  limit?: number;
  search?: string;
}) => {
  return useQuery({
    queryKey: ['depots', params],
    queryFn: () => depotService.getAll(params),
  });
};

export const useDepot = (id: string) => {
  return useQuery({
    queryKey: ['depots', id],
    queryFn: () => depotService.getById(id),
    enabled: !!id,
  });
};

export const useCreateDepot = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDepotRequest) => depotService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['depots'] });
    },
  });
};

export const useUpdateDepot = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateDepotRequest> }) =>
      depotService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['depots'] });
      queryClient.invalidateQueries({ queryKey: ['depots', variables.id] });
    },
  });
};

export const useDeleteDepot = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => depotService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['depots'] });
    },
  });
};
