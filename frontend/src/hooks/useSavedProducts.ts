import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import api from '../api/axios';
import { getUsername, isAuthenticated } from './useAuth';
import type { ApiResponse, SavedProduct } from '../types';

const getSavedProductsQueryKey = (username: string) => ['saved-products', username] as const;

function normalizeSavedProducts(payload: unknown): SavedProduct[] {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .map((item): SavedProduct | null => {
      if (typeof item === 'string' && item.trim().length > 0) {
        return { subId2: item };
      }

      if (!item || typeof item !== 'object') {
        return null;
      }

      const candidate = item as {
        id?: unknown;
        _id?: unknown;
        subId2?: unknown;
        subId?: unknown;
        sub_id2?: unknown;
        folderId?: unknown;
      };

      const subId2 = candidate.subId2 ?? candidate.subId ?? candidate.sub_id2;
      if (typeof subId2 !== 'string' || subId2.trim().length === 0) {
        return null;
      }

      const id = typeof candidate.id === 'string' ? candidate.id : typeof candidate._id === 'string' ? candidate._id : undefined;
      const folderId = typeof candidate.folderId === 'string' ? candidate.folderId : null;

      return { id, subId2, folderId };
    })
    .filter((item): item is SavedProduct => Boolean(item));
}

export function useSavedProducts() {
  const queryClient = useQueryClient();
  const username = getUsername() || 'anonymous';
  const savedProductsQueryKey = getSavedProductsQueryKey(username);

  const query = useQuery({
    queryKey: savedProductsQueryKey,
    enabled: isAuthenticated(),
    queryFn: async () => {
      const res = await api.get<ApiResponse<unknown>>('/saved-products');
      return normalizeSavedProducts(res.data.data);
    },
    staleTime: 60_000,
  });

  const saveMutation = useMutation({
    mutationFn: async ({ subId2, folderId }: { subId2: string; folderId?: string | null }) => {
      await api.post('/saved-products', { subId2, folderId: folderId ?? undefined });
      return { subId2, folderId: folderId ?? null };
    },
    onMutate: async ({ subId2, folderId }) => {
      await queryClient.cancelQueries({ queryKey: savedProductsQueryKey });

      const previous = queryClient.getQueryData<SavedProduct[]>(savedProductsQueryKey) ?? [];
      if (!previous.some((item) => item.subId2 === subId2)) {
        queryClient.setQueryData<SavedProduct[]>(savedProductsQueryKey, [...previous, { subId2, folderId: folderId ?? null }]);
      }

      return { previous };
    },
    onError: (_error, _subId2, context) => {
      if (context?.previous) {
        queryClient.setQueryData(savedProductsQueryKey, context.previous);
      }
      message.error('Khong the luu ma hang hoa.');
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: savedProductsQueryKey });
    },
  });

  const unsaveMutation = useMutation({
    mutationFn: async (subId2: string) => {
      await api.delete(`/saved-products/${encodeURIComponent(subId2)}`);
      return subId2;
    },
    onMutate: async (subId2) => {
      await queryClient.cancelQueries({ queryKey: savedProductsQueryKey });

      const previous = queryClient.getQueryData<SavedProduct[]>(savedProductsQueryKey) ?? [];
      queryClient.setQueryData<SavedProduct[]>(
        savedProductsQueryKey,
        previous.filter((item) => item.subId2 !== subId2),
      );

      return { previous };
    },
    onError: (_error, _subId2, context) => {
      if (context?.previous) {
        queryClient.setQueryData(savedProductsQueryKey, context.previous);
      }
      message.error('Khong the bo luu ma hang hoa.');
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: savedProductsQueryKey });
    },
  });

  const savedProducts = query.data ?? [];
  const savedProductSet = useMemo(
    () => new Set(savedProducts.map((item) => item.subId2)),
    [savedProducts],
  );

  const moveProductMutation = useMutation({
    mutationFn: async ({ subId2, folderId }: { subId2: string; folderId: string | null }) => {
      await api.patch(`/saved-products/${encodeURIComponent(subId2)}/move`, { folderId });
      return { subId2, folderId };
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: savedProductsQueryKey });
    },
    onError: () => {
      message.error('Không thể di chuyển mã hàng hóa.');
    },
  });

  const saveProduct = async (subId2: string, folderId?: string | null) => {
    if (!subId2 || savedProductSet.has(subId2)) {
      return;
    }

    await saveMutation.mutateAsync({ subId2, folderId });
  };

  const unsaveProduct = async (subId2: string) => {
    if (!subId2 || !savedProductSet.has(subId2)) {
      return;
    }

    await unsaveMutation.mutateAsync(subId2);
  };

  const toggleSavedProduct = async (subId2: string, folderId?: string | null) => {
    if (savedProductSet.has(subId2)) {
      await unsaveProduct(subId2);
      return;
    }

    await saveProduct(subId2, folderId);
  };

  const moveProduct = async (subId2: string, folderId: string | null) => {
    await moveProductMutation.mutateAsync({ subId2, folderId });
  };

  return {
    savedProducts,
    savedProductSet,
    isLoading: query.isLoading,
    isUpdating: saveMutation.isPending || unsaveMutation.isPending || moveProductMutation.isPending,
    saveProduct,
    unsaveProduct,
    toggleSavedProduct,
    moveProduct,
  };
}