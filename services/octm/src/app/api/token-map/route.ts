import { unstable_cache } from 'next/cache';

import { ConsoleLogger } from '@rosen-bridge/abstract-logger';

import { GithubReleaseClient } from '@/backend/githubReleaseClient';

const getCachedTokenMap = unstable_cache(
  async (network: string, version: string) => {
    const client = new GithubReleaseClient({
      githubApiUrl: 'https://api.github.com',
      githubRepo: 'rosen-bridge/contract',
      logger: new ConsoleLogger('debug'),
    });

    await client.fetchReleases();
    return client.getTokenMap(network, version);
  },
  ['token-map'],
  { revalidate: 180 },
);

export const GET = async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const network = searchParams.get('network');
  const version = searchParams.get('version');

  if (!network || !version) {
    return Response.json(
      { error: 'Both network and version are required' },
      { status: 400 },
    );
  }

  try {
    return Response.json(await getCachedTokenMap(network, version));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 502 });
  }
};
