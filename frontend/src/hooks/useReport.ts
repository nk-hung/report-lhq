import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import type { ApiResponse, TotalReport, CompareResponse } from '../types';

export function useTotalReport() {
  return useQuery({
    queryKey: ['report', 'total'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<TotalReport>>('/report/total');
      return res.data.data;
    },
  });
}

export function useCompareReport(sessionId?: string | null) {
  return useQuery({
    queryKey: ['report', 'compare', sessionId ?? 'latest'],
    queryFn: async () => {
      const params = sessionId ? { sessionId } : {};
      const res = await api.get<ApiResponse<CompareResponse>>('/report/compare', { params });
      return res.data.data;
    },
  });
}
