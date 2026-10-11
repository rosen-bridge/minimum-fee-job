'use client';

import { useQuery } from '@tanstack/react-query';

import { ConsoleLogger } from '@rosen-bridge/abstract-logger';

import { GithubReleaseClient } from '@/backend/githubReleaseClient';
import { CONTRACT_RELEASES_CONFIG } from '@/config/contractReleases';

export const useContractReleases = () => {
  const query = useQuery({
    queryKey: ['contract-releases'],
    queryFn: async () => {
      const client = new GithubReleaseClient({
        githubApiUrl: CONTRACT_RELEASES_CONFIG.githubApiUrl,
        githubRepo: CONTRACT_RELEASES_CONFIG.githubRepo,
        logger: new ConsoleLogger(CONTRACT_RELEASES_CONFIG.loggerLevel),
      });
      await client.fetchReleases();
      const networks = client.getNetworks();

      return {
        networks,
        versionsByNetwork: Object.fromEntries(
          networks.map((network) => [network, client.getVersions(network)]),
        ),
      };
    },
  });

  return {
    networks: query.data?.networks ?? [],
    versionsByNetwork: query.data?.versionsByNetwork ?? {},
    isLoadingReleases: query.isLoading,
    releasesError: query.error,
  };
};
