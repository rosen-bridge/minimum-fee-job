'use client';

import { useMutation } from '@tanstack/react-query';

import { fetchTokenMap } from '@/services/tokenMapService';

export const useTokenMap = () => {
  const mutation = useMutation({
    mutationFn: ({ network, version }: { network: string; version: string }) =>
      fetchTokenMap(network, version),
  });

  return {
    tokenMap: mutation.data,
    isFetching: mutation.isPending,
    error: mutation.error,
    fetchTokenMap: mutation.mutate,
    reset: mutation.reset,
  };
};
