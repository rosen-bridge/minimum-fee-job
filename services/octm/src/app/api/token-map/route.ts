import {
  getCachedContractReleases,
  getCachedTokenMap,
} from '@/services/githubReleaseService';

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
    const releases = await getCachedContractReleases();
    const versions = releases.versionsByNetwork[network];

    if (!versions?.includes(version)) {
      return Response.json(
        { error: 'Network or version is not available' },
        { status: 400 },
      );
    }

    return Response.json(await getCachedTokenMap(network, version));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 502 });
  }
};
