import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import api from '../api/axios';
import { getUsername, isAuthenticated } from './useAuth';
import type { ApiResponse, ProductFolder } from '../types';

const getFoldersQueryKey = (username: string) => ['product-folders', username] as const;

export function useProductFolders() {
  const queryClient = useQueryClient();
  const username = getUsername() || 'anonymous';
  const foldersQueryKey = getFoldersQueryKey(username);

  const query = useQuery({
    queryKey: foldersQueryKey,
    enabled: isAuthenticated(),
    queryFn: async () => {
      const res = await api.get<ApiResponse<ProductFolder[]>>('/product-folders');
      return res.data.data ?? [];
    },
    staleTime: 60_000,
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await api.post<ApiResponse<ProductFolder>>('/product-folders', { name });
      return res.data.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: foldersQueryKey });
    },
    onError: () => {
      message.error('Không thể tạo folder.');
    },
  });

  const renameMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const res = await api.patch<ApiResponse<ProductFolder>>(`/product-folders/${id}`, { name });
      return res.data.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: foldersQueryKey });
    },
    onError: () => {
      message.error('Không thể đổi tên folder.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/product-folders/${id}`);
      return id;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: foldersQueryKey });
      await queryClient.invalidateQueries({ queryKey: ['saved-products', username] });
    },
    onError: () => {
      message.error('Không thể xóa folder.');
    },
  });

  return {
    folders: query.data ?? [],
    isLoading: query.isLoading,
    isUpdating: createMutation.isPending || renameMutation.isPending || deleteMutation.isPending,
    createFolder: (name: string) => createMutation.mutateAsync(name),
    renameFolder: (id: string, name: string) => renameMutation.mutateAsync({ id, name }),
    deleteFolder: (id: string) => deleteMutation.mutateAsync(id),
  };
}
