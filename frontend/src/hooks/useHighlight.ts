import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import api from '../api/axios';
import { getUsername, isAuthenticated } from './useAuth';
import type { ApiResponse, UserPreferences } from '../types';

const getHighlightQueryKey = (username: string) =>
  ['user', 'preferences', username] as const;

function normalizeHighlightedSubId2s(payload: unknown): string[] {
  if (!payload || typeof payload !== 'object') {
    return [];
  }

  const candidate = payload as {
    highlightedSubId2s?: unknown;
    highlightSubId2s?: unknown;
    highlightedSubIds?: unknown;
    subId2s?: unknown;
  };

  const values =
    candidate.highlightedSubId2s ??
    candidate.highlightSubId2s ??
    candidate.highlightedSubIds ??
    candidate.subId2s;

  if (!Array.isArray(values)) {
    return [];
  }

  return values.filter((value): value is string => typeof value === 'string' && value.trim().length > 0);
}

async function fetchPreferences() {
  const res = await api.get<ApiResponse<unknown>>('/user/preferences');
  return {
    highlightedSubId2s: normalizeHighlightedSubId2s(res.data.data),
  } satisfies UserPreferences;
}

export function useHighlight() {
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);
  const username = getUsername() || 'anonymous';
  const highlightQueryKey = getHighlightQueryKey(username);

  const query = useQuery({
    queryKey: highlightQueryKey,
    enabled: isAuthenticated(),
    queryFn: fetchPreferences,
    staleTime: 60_000,
  });

  const syncHighlightsMutation = useMutation({
    mutationFn: async (highlightedSubId2s: string[]) => {
      const res = await api.post<ApiResponse<unknown>>('/user/preferences/highlight', {
        highlightedSubIds: highlightedSubId2s,
      });

      return {
        highlightedSubId2s: normalizeHighlightedSubId2s(res.data.data),
      } satisfies UserPreferences;
    },
    onMutate: async (highlightedSubId2s) => {
      await queryClient.cancelQueries({ queryKey: highlightQueryKey });

      const previous = queryClient.getQueryData<UserPreferences>(highlightQueryKey) ?? {
        highlightedSubId2s: [],
      };

      queryClient.setQueryData<UserPreferences>(highlightQueryKey, {
        highlightedSubId2s,
      });

      return { previous };
    },
    onError: (_error, _highlightedSubId2s, context) => {
      if (context?.previous) {
        queryClient.setQueryData(highlightQueryKey, context.previous);
      }
      message.error('Khong the cap nhat highlight.');
    },
    onSuccess: (data) => {
      queryClient.setQueryData<UserPreferences>(highlightQueryKey, data);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: highlightQueryKey });
    },
  });

  const highlightedSubId2s = query.data?.highlightedSubId2s ?? [];
  const highlightedSet = useMemo(() => new Set(highlightedSubId2s), [highlightedSubId2s]);

  const getCurrentPreferences = async () => {
    const cached = queryClient.getQueryData<UserPreferences>(highlightQueryKey);

    if (cached) {
      return cached;
    }

    return queryClient.fetchQuery({
      queryKey: highlightQueryKey,
      queryFn: fetchPreferences,
      staleTime: 60_000,
    });
  };

  const syncHighlights = async (nextHighlightedSubId2s: string[]) => {
    setIsSyncing(true);

    try {
      await syncHighlightsMutation.mutateAsync(nextHighlightedSubId2s);
    } finally {
      setIsSyncing(false);
    }
  };

  const addHighlight = async (subId2: string) => {
    const current = await getCurrentPreferences();

    if (!subId2 || current.highlightedSubId2s.includes(subId2)) {
      return;
    }

    await syncHighlights([...current.highlightedSubId2s, subId2]);
  };

  const removeHighlight = async (subId2: string) => {
    const current = await getCurrentPreferences();

    if (!subId2 || !current.highlightedSubId2s.includes(subId2)) {
      return;
    }

    await syncHighlights(
      current.highlightedSubId2s.filter((value) => value !== subId2),
    );
  };

  const toggleHighlight = async (subId2: string) => {
    const current = await getCurrentPreferences();

    if (current.highlightedSubId2s.includes(subId2)) {
      await removeHighlight(subId2);
      return;
    }

    await addHighlight(subId2);
  };

  const clearHighlights = async () => {
    const current = await getCurrentPreferences();

    if (current.highlightedSubId2s.length === 0) {
      return;
    }

    await syncHighlights([]);
  };

  return {
    highlightedSubId2s,
    highlightedSet,
    isLoading: query.isLoading,
    isUpdating: syncHighlightsMutation.isPending || isSyncing,
    addHighlight,
    removeHighlight,
    toggleHighlight,
    clearHighlights,
  };
}