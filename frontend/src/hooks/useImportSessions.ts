import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import type { ApiResponse, ImportSession } from '../types';

export function useImportSessions() {
  const queryClient = useQueryClient();

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['import', 'sessions'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<ImportSession[]>>('/import/sessions');
      return res.data.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      await api.delete(`/import/sessions/${sessionId}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['import', 'sessions'] });
      void queryClient.invalidateQueries({ queryKey: ['report'] });
    },
  });

  return {
    sessions,
    isLoading,
    deleteSession: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}
