import { useQuery } from '@tanstack/react-query';
import { axiosClient } from '../api/axiosClient';

export const useWarehouses = () => {
  return useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const { data } = await axiosClient.get('/warehouses');
      return data.data;
    },
  });
};
