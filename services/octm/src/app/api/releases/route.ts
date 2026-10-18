import { getCachedContractReleases } from '@/services/githubReleaseService';

export const GET = async () => {
  try {
    return Response.json(await getCachedContractReleases());
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 502 });
  }
};
