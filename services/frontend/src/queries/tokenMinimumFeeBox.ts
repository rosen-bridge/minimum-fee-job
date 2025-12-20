import { unwrap } from '@/safeServerAction';
import { getTokenMinimumFeeBoxSafe } from '@/utils';

import { queryClient } from './queryClient';

export const fetchTokenMinimumFeeBox = async (tokenId: string) => {
  return await queryClient.fetchQuery({
    queryKey: ['tokenMinimumFeeBox', tokenId],
    queryFn: async () => {
      return await unwrap(getTokenMinimumFeeBoxSafe)(tokenId);
    },
  });
};
