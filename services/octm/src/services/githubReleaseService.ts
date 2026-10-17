import { unstable_cache } from 'next/cache';

import { ConsoleLogger } from '@rosen-bridge/abstract-logger';

import { GithubReleaseClient } from '@/backend/githubReleaseClient';
import { CONTRACT_RELEASES_CONFIG } from '@/config/contractReleases';

const createGithubReleaseClient = () =>
  new GithubReleaseClient({
    githubApiUrl: CONTRACT_RELEASES_CONFIG.githubApiUrl,
    githubRepo: CONTRACT_RELEASES_CONFIG.githubRepo,
    logger: new ConsoleLogger(CONTRACT_RELEASES_CONFIG.loggerLevel),
  });

export const getCachedContractReleases = unstable_cache(
  async () => {
    const client = createGithubReleaseClient();
    await client.fetchReleases();
    const networks = client.getNetworks();

    return {
      networks,
      versionsByNetwork: Object.fromEntries(
        networks.map((network) => [network, client.getVersions(network)]),
      ),
    };
  },
  ['contract-releases'],
  { revalidate: 180 },
);

export const getCachedTokenMap = unstable_cache(
  async (network: string, version: string) => {
    const client = createGithubReleaseClient();
    await client.fetchReleases();
    return client.getTokenMap(network, version);
  },
  ['token-map'],
  { revalidate: 180 },
);
