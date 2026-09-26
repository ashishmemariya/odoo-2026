import { useQuery } from '@tanstack/react-query';
import { axiosClient } from '../api/axiosClient';

export const useHistory = (queryStr: string = '') => {
  return useQuery({
    queryKey: ['history', queryStr],
    queryFn: async () => {
      const { data } = await axiosClient.get(`/history${queryStr ? `?${queryStr}` : ''}`);
      return data; // returning full pagination object { data, total, page, pages }
    },
  });
};
