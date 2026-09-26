import { useQuery } from '@tanstack/react-query';
import { axiosClient } from '../api/axiosClient';

export const useDashboard = () => {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const { data } = await axiosClient.get('/dashboard');
      return data.data;
    },
  });
};
