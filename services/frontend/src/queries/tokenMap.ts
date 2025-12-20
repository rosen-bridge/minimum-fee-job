import { useQuery } from '@tanstack/react-query';

import { TokenMap } from '@rosen-bridge/tokens';

import { unwrap } from '@/safeServerAction';
import { getRosenTokensSafe } from '@/store';

import { queryClient } from './queryClient';

export const fetchTokenMap = async () => {
  return await queryClient.fetchQuery({
    queryKey: ['tokenMap'],
    queryFn: async () => {
      const data = await unwrap(getRosenTokensSafe)();

      const tokenMap = new TokenMap();

      await tokenMap.updateConfigByJson(data);

      return tokenMap;
    },
  });
};

export const useTokenMap = () => {
  return useQuery({
    queryKey: ['tokenMap'],
    queryFn: async () => {
      const data = await unwrap(getRosenTokensSafe)();

      const tokenMap = new TokenMap();

      await tokenMap.updateConfigByJson(data);

      return tokenMap;
    },
  });
};
