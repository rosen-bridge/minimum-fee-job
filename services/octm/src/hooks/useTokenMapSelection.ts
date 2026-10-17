'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { useContractReleases } from './useContractReleases';
import { useTokenMap } from './useTokenMap';

const getRequestKey = (network: string, version: string) =>
  `${network}\u0000${version}`;

export const useTokenMapSelection = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const [requestedKey, setRequestedKey] = useState('');

  const { networks, versionsByNetwork, isLoadingReleases, releasesError } =
    useContractReleases();

  const requestedNetwork = searchParams.get('network') ?? '';
  const requestedVersion = searchParams.get('version') ?? '';

  const selectedNetwork = networks.includes(requestedNetwork)
    ? requestedNetwork
    : (networks[0] ?? '');

  const versions = versionsByNetwork[selectedNetwork] ?? [];

  const selectedVersion = versions.includes(requestedVersion)
    ? requestedVersion
    : (versions[0] ?? '');

  const updateUrl = useCallback(
    (network: string, version: string) => {
      const params = new URLSearchParams(search);
      if (network) params.set('network', network);
      else params.delete('network');
      if (version) params.set('version', version);
      else params.delete('version');

      const query = params.toString();
      router.replace(`${pathname}${query ? `?${query}` : ''}`, {
        scroll: false,
      });
    },
    [pathname, router, search],
  );

  useEffect(() => {
    if (isLoadingReleases || releasesError) return;
    if (
      requestedNetwork === selectedNetwork &&
      requestedVersion === selectedVersion
    ) {
      return;
    }
    updateUrl(selectedNetwork, selectedVersion);
  }, [
    isLoadingReleases,
    releasesError,
    requestedNetwork,
    requestedVersion,
    selectedNetwork,
    selectedVersion,
    updateUrl,
  ]);

  const selectNetwork = (network: string) => {
    if (!networks.includes(network)) return;
    const nextVersion = versionsByNetwork[network]?.[0] ?? '';
    setRequestedKey('');
    updateUrl(network, nextVersion);
  };

  const selectVersion = (version: string) => {
    if (!versions.includes(version)) return;
    setRequestedKey('');
    updateUrl(selectedNetwork, version);
  };

  const fetchTokenMap = (version = selectedVersion) => {
    if (!selectedNetwork || !versions.includes(version)) return;
    setRequestedKey(getRequestKey(selectedNetwork, version));
  };

  const {
    tokenMap,
    isFetching,
    error: tokenMapError,
  } = useTokenMap(
    selectedNetwork,
    selectedVersion,
    requestedKey === getRequestKey(selectedNetwork, selectedVersion),
  );

  return {
    networks,
    versions,
    selectedNetwork,
    selectedVersion,
    selectNetwork,
    selectVersion,
    fetchTokenMap,
    isFetching,
    isLoadingReleases,
    releasesError,
    tokenMap,
    tokenMapError,
  };
};
