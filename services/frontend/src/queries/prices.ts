import { useQuery } from '@tanstack/react-query';

import { unwrap } from '@/safeServerAction';
import { getPricesSafe } from '@/store';

import { queryClient } from './queryClient';

export const fetchPrices = async () => {
  return await queryClient.fetchQuery({
    queryKey: ['prices'],
    queryFn: async () => {
      return await unwrap(getPricesSafe)();
    },
  });
};

export const usePrices = () => {
  return useQuery({
    queryKey: ['prices'],
    queryFn: async () => {
      return await unwrap(getPricesSafe)();
    },
  });
};
