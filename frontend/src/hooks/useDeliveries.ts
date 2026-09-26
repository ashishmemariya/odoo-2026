import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosClient } from '../api/axiosClient';

export const useDeliveries = (queryStr: string = '') => {
  return useQuery({
    queryKey: ['deliveries', queryStr],
    queryFn: async () => {
      const { data } = await axiosClient.get(`/deliveries${queryStr ? `?${queryStr}` : ''}`);
      return data.data;
    },
  });
};

export const useUpdateDeliveryStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data } = await axiosClient.put(`/deliveries/${id}/status`, { status });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
    }
  });
};

export const useValidateDelivery = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await axiosClient.post(`/deliveries/${id}/validate`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['products'] }); 
    }
  });
};
