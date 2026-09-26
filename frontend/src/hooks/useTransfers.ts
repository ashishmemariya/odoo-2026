import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosClient } from '../api/axiosClient';

export const useTransfers = (queryStr: string = '') => {
  return useQuery({
    queryKey: ['transfers', queryStr],
    queryFn: async () => {
      const { data } = await axiosClient.get(`/transfers${queryStr ? `?${queryStr}` : ''}`);
      return data.data;
    },
  });
};

export const useValidateTransfer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await axiosClient.post(`/transfers/${id}/validate`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      queryClient.invalidateQueries({ queryKey: ['products'] }); 
    }
  });
};
