import { unwrap } from '@/safeServerAction';
import { getRsnTokenIdSafe } from '@/store';

import { queryClient } from './queryClient';

export const fetchRsnTokenId = async () => {
  return await queryClient.fetchQuery({
    queryKey: ['feesByToken'],
    queryFn: async () => {
      return await unwrap(getRsnTokenIdSafe)();
    },
  });
};
