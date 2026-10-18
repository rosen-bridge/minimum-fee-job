import type { ReactNode } from 'react';

import type { useTokenMapSelection } from '@/hooks';

import { Box, Chip, Paper, Stack, Typography } from '../ui';

type TokenMapPanelProps = Pick<
  ReturnType<typeof useTokenMapSelection>,
  'selectedNetwork' | 'selectedVersion'
> & {
  isLoaded: boolean;
  children: ReactNode;
};

export const TokenMapPanel = ({
  selectedNetwork,
  selectedVersion,
  isLoaded,
  children,
}: TokenMapPanelProps) => (
  <Paper
    elevation={0}
    sx={{
      flex: 1,
      minHeight: 0,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      border: 1,
      borderColor: 'divider',
      borderRadius: 3,
    }}
  >
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      sx={{
        px: { xs: 2, md: 3 },
        py: 2,
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 650 }}>
          Configuration
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {selectedNetwork || 'Choose a network'}
          {selectedVersion ? ` · ${selectedVersion}` : ''}
        </Typography>
      </Box>
      {isLoaded && (
        <Chip
          size="small"
          label="Loaded"
          sx={(theme) => ({
            bgcolor: theme.palette.mode === 'dark' ? '#064e3b' : '#ecfdf3',
            color: theme.palette.mode === 'dark' ? '#a6f4c5' : '#027a48',
            fontWeight: 600,
          })}
        />
      )}
    </Stack>

    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        overflow: 'auto',
        p: { xs: 2, md: 3 },
      }}
    >
      {children}
    </Box>
  </Paper>
);
