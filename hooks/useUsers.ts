import { userService } from '@/services/user.service';
import type { Role, User } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const useUsers = (
  params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: Role;
    isActive?: boolean;
  },
  options?: {
    enabled?: boolean;
  }
) => {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => userService.getAll(params),
    enabled: options?.enabled !== false,
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) =>
      userService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', variables.id] });
    },
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      email?: string;
      phone?: string;
      firstName: string;
      lastName: string;
      role: Role;
      password: string;
      isActive?: boolean;
    }) => userService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};
