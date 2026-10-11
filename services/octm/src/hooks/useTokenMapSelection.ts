'use client';

import { useState } from 'react';

import { useContractReleases } from '@/hooks/useContractReleases';
import { useTokenMap } from '@/hooks/useTokenMap';

export const useTokenMapSelection = () => {
  const [networkSelection, setNetworkSelection] = useState('');

  const [versionSelection, setVersionSelection] = useState('');

  const { networks, versionsByNetwork, isLoadingReleases, releasesError } =
    useContractReleases();

  const {
    tokenMap,
    isFetching,
    error: tokenMapError,
    fetchTokenMap: loadTokenMap,
    reset,
  } = useTokenMap();

  const selectedNetwork = networks.includes(networkSelection)
    ? networkSelection
    : (networks[0] ?? '');

  const versions = versionsByNetwork[selectedNetwork] ?? [];

  const selectedVersion = versions.includes(versionSelection)
    ? versionSelection
    : (versions[0] ?? '');

  const selectNetwork = (network: string) => {
    if (selectedNetwork !== network) reset();
    setNetworkSelection(network);
  };

  const selectVersion = (version: string) => {
    if (selectedVersion !== version) reset();
    setVersionSelection(version);
  };

  const fetchTokenMap = (version = selectedVersion) => {
    if (!selectedNetwork || !version) return;
    loadTokenMap({ network: selectedNetwork, version });
  };

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
