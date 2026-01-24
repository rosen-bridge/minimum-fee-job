import { useQuery } from '@tanstack/react-query';

import { unwrap } from '@/safeServerAction';
import { getFeesByTokenSafe } from '@/utils';

import { queryClient } from './queryClient';

export const fetchFeesByToken = async () => {
  return await queryClient.fetchQuery({
    queryKey: ['feesByToken'],
    queryFn: async () => {
      return await unwrap(getFeesByTokenSafe)();
    },
  });
};

export const useFeesByToken = () => {
  return useQuery({
    queryKey: ['feesByToken'],
    queryFn: async () => {
      return await unwrap(getFeesByTokenSafe)();
    },
  });
};
