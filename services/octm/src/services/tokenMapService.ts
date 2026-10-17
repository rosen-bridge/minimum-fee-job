import type { RosenTokens } from '@rosen-bridge/extended-tokens';

export const fetchTokenMap = async (
  network: string,
  version: string,
  signal?: AbortSignal,
): Promise<RosenTokens> => {
  const params = new URLSearchParams({ network, version });

  const response = await fetch(`/api/token-map?${params}`, {
    signal,
    cache: 'no-store',
  });

  if (!response.ok) {
    const result: { error?: string } = await response.json().catch(() => ({}));
    throw new Error(result.error ?? 'Failed to fetch token map');
  }

  return (await response.json()) as RosenTokens;
};
