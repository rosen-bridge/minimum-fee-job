'use client';

import { useQuery } from '@tanstack/react-query';

import { fetchTokenMap } from '@/services/tokenMapService';

export const useTokenMap = (
  network: string,
  version: string,
  enabled: boolean,
) => {
  const query = useQuery({
    queryKey: ['token-map', network, version],
    queryFn: ({ signal }) => fetchTokenMap(network, version, signal),
    enabled: Boolean(network && version && enabled),
  });

  return {
    tokenMap: query.data,
    isFetching: query.isFetching,
    error: query.error,
  };
};
