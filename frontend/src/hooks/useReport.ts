import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import api from '../api/axios';
import { getUsername } from './useAuth';
import type { ApiResponse, TotalReport, CompareResponse } from '../types';

interface UseCompareReportOptions {
  enabled?: boolean;
}

export function useTotalReport() {
  const username = getUsername() || 'anonymous';

  return useQuery({
    queryKey: ['report', 'total', username],
    queryFn: async () => {
      const res = await api.get<ApiResponse<TotalReport>>('/report/total');
      return res.data.data;
    },
  });
}

export function useCompareReport(
  sessionId?: string | null,
  campaignName?: string,
  options?: UseCompareReportOptions,
) {
  const trimmedCampaignName = campaignName?.trim() ?? '';
  const username = getUsername() || 'anonymous';

  return useQuery({
    queryKey: [
      'report',
      'compare',
      username,
      sessionId ?? 'latest',
      trimmedCampaignName,
    ],
    enabled: options?.enabled ?? true,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const params: { sessionId?: string; campaignName?: string } = {};
      if (sessionId) {
        params.sessionId = sessionId;
      }
      if (trimmedCampaignName) {
        params.campaignName = trimmedCampaignName;
      }
      const res = await api.get<ApiResponse<CompareResponse>>('/report/compare', { params });
      return res.data.data;
    },
  });
}

export function useDeleteReportRecord() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (recordId: string) => {
      await api.delete(`/report/records/${recordId}`);
      return recordId;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['report'] });
      await queryClient.invalidateQueries({ queryKey: ['import', 'sessions'] });
    },
    onError: () => {
      message.error('Không thể xóa bản ghi của Sub ID.');
    },
  });

  return {
    deleteReportRecord: mutation.mutateAsync,
    isDeleting: mutation.isPending,
    deletingRecordId: mutation.isPending ? mutation.variables ?? null : null,
  };
}
