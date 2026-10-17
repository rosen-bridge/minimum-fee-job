export type ContractReleases = {
  networks: string[];
  versionsByNetwork: Record<string, string[]>;
};

export const fetchContractReleases = async (
  signal?: AbortSignal,
): Promise<ContractReleases> => {
  const response = await fetch('/api/releases', { signal });

  if (!response.ok) {
    const result: { error?: string } = await response.json().catch(() => ({}));
    throw new Error(result.error ?? 'Failed to fetch contract releases');
  }

  return (await response.json()) as ContractReleases;
};
