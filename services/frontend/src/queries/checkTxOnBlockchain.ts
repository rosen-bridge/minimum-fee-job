import { useQuery } from '@tanstack/react-query';

import { unwrap } from '@/safeServerAction';
import { getTxSafe } from '@/store';
import { checkTxOnBlockchainSafe } from '@/utils';

export const useCheckTxOnBlockchain = () => {
  return useQuery({
    queryKey: ['checkTxOnBlockchain'],
    queryFn: async () => {
      return await unwrap(checkTxOnBlockchainSafe)(await unwrap(getTxSafe)());
    },
  });
};
