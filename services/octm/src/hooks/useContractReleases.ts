'use client';

import { useQuery } from '@tanstack/react-query';

import { fetchContractReleases } from '@/services/contractReleasesService';

export const useContractReleases = () => {
  const query = useQuery({
    queryKey: ['contract-releases'],
    queryFn: ({ signal }) => fetchContractReleases(signal),
  });

  return {
    networks: query.data?.networks ?? [],
    versionsByNetwork: query.data?.versionsByNetwork ?? {},
    isLoadingReleases: query.isLoading,
    releasesError: query.error,
  };
};
