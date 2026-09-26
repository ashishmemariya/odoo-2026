import { useQuery } from '@tanstack/react-query';
import { axiosClient } from '../api/axiosClient';

export const useProducts = (queryStr: string = '') => {
  return useQuery({
    queryKey: ['products', queryStr],
    queryFn: async () => {
      const { data } = await axiosClient.get(`/products${queryStr ? `?${queryStr}` : ''}`);
      return data.data;
    },
  });
};

export const useProduct = (id: string) => {
  return useQuery({
    queryKey: ['products', id],
    queryFn: async () => {
      const { data } = await axiosClient.get(`/products/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await axiosClient.get('/products/categories');
      return data.data;
    },
  });
};
