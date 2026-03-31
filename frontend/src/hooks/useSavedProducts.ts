import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import api from '../api/axios';
import { isAuthenticated } from './useAuth';
import type { ApiResponse, SavedProduct } from '../types';

const savedProductsQueryKey = ['saved-products'] as const;

function normalizeSavedProducts(payload: unknown): SavedProduct[] {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .map((item) => {
      if (typeof item === 'string' && item.trim().length > 0) {
        return { subId2: item } satisfies SavedProduct;
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
      };

      const subId2 = candidate.subId2 ?? candidate.subId ?? candidate.sub_id2;
      if (typeof subId2 !== 'string' || subId2.trim().length === 0) {
        return null;
      }

      const id = typeof candidate.id === 'string' ? candidate.id : typeof candidate._id === 'string' ? candidate._id : undefined;

      return { id, subId2 } satisfies SavedProduct;
    })
    .filter((item): item is SavedProduct => Boolean(item));
}

export function useSavedProducts() {
  const queryClient = useQueryClient();

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
    mutationFn: async (subId2: string) => {
      await api.post('/saved-products', { subId2 });
      return subId2;
    },
    onMutate: async (subId2) => {
      await queryClient.cancelQueries({ queryKey: savedProductsQueryKey });

      const previous = queryClient.getQueryData<SavedProduct[]>(savedProductsQueryKey) ?? [];
      if (!previous.some((item) => item.subId2 === subId2)) {
        queryClient.setQueryData<SavedProduct[]>(savedProductsQueryKey, [...previous, { subId2 }]);
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
  const savedProductSet = new Set(savedProducts.map((item) => item.subId2));

  const saveProduct = async (subId2: string) => {
    if (!subId2 || savedProductSet.has(subId2)) {
      return;
    }

    await saveMutation.mutateAsync(subId2);
  };

  const unsaveProduct = async (subId2: string) => {
    if (!subId2 || !savedProductSet.has(subId2)) {
      return;
    }

    await unsaveMutation.mutateAsync(subId2);
  };

  const toggleSavedProduct = async (subId2: string) => {
    if (savedProductSet.has(subId2)) {
      await unsaveProduct(subId2);
      return;
    }

    await saveProduct(subId2);
  };

  return {
    savedProducts,
    savedProductSet,
    isLoading: query.isLoading,
    isUpdating: saveMutation.isPending || unsaveMutation.isPending,
    saveProduct,
    unsaveProduct,
    toggleSavedProduct,
  };
}