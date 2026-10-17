'use client';

import { useState } from 'react';

import type { useTokenMapSelection } from '@/hooks';

import { ConfirmationDialog, TransactionQRModal } from '../';
import { Button, Stack, SelectField } from '../ui';

type TokenMapControlsProps = Pick<
  ReturnType<typeof useTokenMapSelection>,
  | 'networks'
  | 'versions'
  | 'selectedNetwork'
  | 'selectedVersion'
  | 'selectNetwork'
  | 'selectVersion'
  | 'fetchTokenMap'
  | 'isFetching'
  | 'isLoadingReleases'
>;

export const TokenMapControls = ({
  networks,
  versions,
  selectedNetwork,
  selectedVersion,
  selectNetwork,
  selectVersion,
  fetchTokenMap,
  isFetching,
  isLoadingReleases,
}: TokenMapControlsProps) => {
  const [open, setOpen] = useState(false);

  const [isVersionConfirmationOpen, setIsVersionConfirmationOpen] =
    useState(false);

  const handleFetchClick = () => {
    if (selectedVersion !== 'latest') {
      setIsVersionConfirmationOpen(true);
      return;
    }

    void fetchTokenMap();
  };

  const handleConfirmVersion = () => {
    setIsVersionConfirmationOpen(false);
    void fetchTokenMap();
  };

  const handleLoadLatestVersion = () => {
    setIsVersionConfirmationOpen(false);
    selectVersion('latest');
    void fetchTokenMap('latest');
  };

  return (
    <>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <SelectField
          disabled={isLoadingReleases || isVersionConfirmationOpen}
          options={networks}
          value={selectedNetwork}
          label="Network"
          onChange={selectNetwork}
        />
        <SelectField
          disabled={isLoadingReleases || isVersionConfirmationOpen}
          options={versions}
          value={selectedVersion}
          label="Version"
          onChange={selectVersion}
        />
        <Button
          variant="contained"
          onClick={handleFetchClick}
          disabled={
            !selectedNetwork ||
            !selectedVersion ||
            isFetching ||
            isVersionConfirmationOpen
          }
        >
          {isFetching ? 'Fetching…' : 'Fetch'}
        </Button>
        <TransactionQRModal
          open={open}
          onClose={() => setOpen(false)}
          tx={''}
        />
        <Button variant="contained" onClick={() => setOpen(true)}>
          Generate Tx
        </Button>
      </Stack>
      <ConfirmationDialog
        open={isVersionConfirmationOpen}
        title="Load a non-latest version?"
        message={`You selected version "${selectedVersion}" instead of the latest version. Are you sure you want to load its token map?`}
        onCancel={() => setIsVersionConfirmationOpen(false)}
        onConfirm={handleConfirmVersion}
        onAlternative={handleLoadLatestVersion}
      />
    </>
  );
};
