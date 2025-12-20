import { unwrap } from '@/safeServerAction';
import { getTokensConfigSafe } from '@/store';

import { queryClient } from './queryClient';

export const fetchTokensConfig = async () => {
  return await queryClient.fetchQuery({
    queryKey: ['tokensConfig'],
    queryFn: async () => {
      return await unwrap(getTokensConfigSafe)();
    },
  });
};
