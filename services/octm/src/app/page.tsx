'use client';

import { Box, Stack } from '@mui/material';

import { TokenMapContent } from '@/components/tokenMap/TokenMapContent';
import { TokenMapControls } from '@/components/tokenMap/TokenMapControls';
import { TokenMapHeader } from '@/components/tokenMap/TokenMapHeader';
import { TokenMapPanel } from '@/components/tokenMap/TokenMapPanel';
import { useTokenMapSelection } from '@/hooks/useTokenMapSelection';

const Home = () => {
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

export default Home;
