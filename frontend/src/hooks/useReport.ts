import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import type { ApiResponse, TotalReport, CompareResponse } from '../types';

interface UseCompareReportOptions {
  enabled?: boolean;
}

export function useTotalReport() {
  return useQuery({
    queryKey: ['report', 'total'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<TotalReport>>('/report/total');
      return res.data.data;
    },
  });
}

export function useCompareReport(
  sessionId?: string | null,
  options?: UseCompareReportOptions,
) {
  return useQuery({
    queryKey: ['report', 'compare', sessionId ?? 'latest'],
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const params = sessionId ? { sessionId } : {};
      const res = await api.get<ApiResponse<CompareResponse>>('/report/compare', { params });
      return res.data.data;
    },
  });
}
