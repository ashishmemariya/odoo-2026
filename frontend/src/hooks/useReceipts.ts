import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosClient } from '../api/axiosClient';

export const useReceipts = (queryStr: string = '') => {
  return useQuery({
    queryKey: ['receipts', queryStr],
    queryFn: async () => {
      const { data } = await axiosClient.get(`/receipts${queryStr ? `?${queryStr}` : ''}`);
      return data.data;
    },
  });
};

export const useUpdateReceiptStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data } = await axiosClient.put(`/receipts/${id}/status`, { status });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
    }
  });
};

export const useValidateReceipt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await axiosClient.post(`/receipts/${id}/validate`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['products'] }); // Stock changes
    }
  });
};
