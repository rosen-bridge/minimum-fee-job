'use client';

import { Suspense } from 'react';

import {
  Box,
  Stack,
  TokenMapContent,
  TokenMapControls,
  TokenMapHeader,
  TokenMapPanel,
} from '@/components';
import { useTokenMapSelection } from '@/hooks';

const HomeContent = () => {
  const selection = useTokenMapSelection();

  return (
    <Box
      component="main"
      sx={{
        height: '100dvh',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        bgcolor: 'background.default',
        color: 'text.primary',
        p: { xs: 2, md: 4 },
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ pb: 3 }}
      >
        <TokenMapHeader />
        <TokenMapControls {...selection} />
      </Stack>

      <TokenMapPanel
        selectedNetwork={selection.selectedNetwork}
        selectedVersion={selection.selectedVersion}
        isLoaded={selection.tokenMap !== undefined}
      >
        <TokenMapContent {...selection} />
      </TokenMapPanel>
    </Box>
  );
};

const Home = () => (
  <Suspense
    fallback={
      <Box component="main" sx={{ height: '100dvh', p: { xs: 2, md: 4 } }} />
    }
  >
    <HomeContent />
  </Suspense>
);

export default Home;
