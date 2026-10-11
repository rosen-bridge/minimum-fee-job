import { Typography } from '@mui/material';

import type { useTokenMapSelection } from '@/hooks/useTokenMapSelection';

import { TokenMapCompareView } from './TokenMapCompareView';

type TokenMapContentProps = Pick<
  ReturnType<typeof useTokenMapSelection>,
  | 'isLoadingReleases'
  | 'isFetching'
  | 'releasesError'
  | 'tokenMapError'
  | 'tokenMap'
>;

export const TokenMapContent = ({
  isLoadingReleases,
  isFetching,
  releasesError,
  tokenMapError,
  tokenMap,
}: TokenMapContentProps) => {
  if (isLoadingReleases) {
    return <Typography color="text.secondary">Loading networks…</Typography>;
  }

  if (isFetching) {
    return <Typography color="text.secondary">Fetching token map…</Typography>;
  }

  if (releasesError) {
    return <Typography color="error">{releasesError.message}</Typography>;
  }

  if (tokenMapError) {
    return <Typography color="error">{tokenMapError.message}</Typography>;
  }

  if (tokenMap === undefined) {
    return (
      <Typography color="text.secondary">
        Select a network and version, then click Fetch to load its token map.
      </Typography>
    );
  }

  return (
    <TokenMapCompareView
      left={{
        title: 'Base version',
        version: 'Current',
        content: tokenMap,
      }}
      right={{
        title: 'Compare version',
        version: 'Target',
        content: tokenMap,
      }}
    />
  );
};
