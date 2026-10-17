'use client';

import { Box, Grid, Paper, Stack, Typography } from '../ui';

type TokenMapCompareViewProps = {
  data: unknown;
};

const JsonPanel = ({ title, data }: { title: string; data: unknown }) => {
  const json = JSON.stringify(data, null, 2) ?? '';
  return (
    <Paper
      elevation={0}
      sx={{
        height: '100%',
        minWidth: 0,
        overflow: 'hidden',
        bgcolor: '#0d1117',
        color: '#e6edf3',
        border: '1px solid #30363d',
        borderRadius: 2,
      }}
    >
      <Typography
        variant="subtitle2"
        sx={{
          px: 2,
          py: 1.5,
          bgcolor: '#161b22',
          borderBottom: '1px solid #30363d',
          color: '#e6edf3',
        }}
      >
        {title}
      </Typography>
      <Box sx={{ overflow: 'auto', maxHeight: '65vh', minHeight: 280, p: 2 }}>
        <pre>{json}</pre>
      </Box>
    </Paper>
  );
};

export const TokenMapCompareView = ({ data }: TokenMapCompareViewProps) => (
  <Stack spacing={2} sx={{ width: '100%', minWidth: 0 }}>
    <Box>
      <Typography variant="h6" fontWeight={700}>
        Compare Token Maps
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Review configurations side by side
      </Typography>
    </Box>
    <Grid container spacing={2} alignItems="stretch">
      <Grid size={{ xs: 12, md: 6 }} sx={{ minWidth: 0 }}>
        <JsonPanel title="Selected" data={data} />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }} sx={{ minWidth: 0 }}>
        <JsonPanel title="Compare" data={data} />
      </Grid>
    </Grid>
  </Stack>
);
