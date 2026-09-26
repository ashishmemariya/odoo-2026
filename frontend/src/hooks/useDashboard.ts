import { useQuery } from '@tanstack/react-query';
import { axiosClient } from '../api/axiosClient';

export const useDashboard = (queryStr: string = '') => {
  return useQuery({
    queryKey: ['dashboard', queryStr],
    queryFn: async () => {
      const { data } = await axiosClient.get(`/dashboard${queryStr ? `?${queryStr}` : ''}`);
      return data.data;
    },
  });
};
