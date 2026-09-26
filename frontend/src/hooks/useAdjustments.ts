import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosClient } from '../api/axiosClient';

export const useAdjustments = (queryStr: string = '') => {
  return useQuery({
    queryKey: ['adjustments', queryStr],
    queryFn: async () => {
      const { data } = await axiosClient.get(`/adjustments${queryStr ? `?${queryStr}` : ''}`);
      return data.data;
    },
  });
};

export const useValidateAdjustment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await axiosClient.post(`/adjustments/${id}/validate`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adjustments'] });
      queryClient.invalidateQueries({ queryKey: ['products'] }); 
    }
  });
};
