import { useQuery } from '@tanstack/react-query';

import { unwrap } from '@/safeServerAction';
import { getTxSafe } from '@/store';

export const useTx = () => {
  return useQuery({
    queryKey: ['tx'],
    queryFn: async () => {
      return await unwrap(getTxSafe)();
    },
  });
};
