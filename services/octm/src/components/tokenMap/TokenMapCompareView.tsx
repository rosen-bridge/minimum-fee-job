'use client';

import {
  Box,
  Chip,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

import { JsonSyntaxHighlighter } from './JsonSyntaxHighlighter';

type CompareSide = {
  title: string;
  version: string;
  content: unknown;
};

type TokenMapCompareViewProps = {
  left: CompareSide;
  right: CompareSide;
};

const CodePanel = ({ title, version, content }: CompareSide) => {
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
      {/* Panel header */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1}
        sx={{
          px: 2,
          py: 1.5,
          bgcolor: '#161b22',
          borderBottom: '1px solid #30363d',
        }}
      >
        <Stack spacing={0.5} minWidth={0}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              color: '#e6edf3',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {title}
          </Typography>

          <Typography variant="caption" sx={{ color: '#8b949e' }}>
            token-map.json
          </Typography>
        </Stack>

        <Chip
          size="small"
          label={version}
          sx={{
            'flexShrink': 0,
            'maxWidth': '45%',
            'color': '#c9d1d9',
            'bgcolor': '#21262d',
            'border': '1px solid #30363d',
            'borderRadius': 1,
            '& .MuiChip-label': {
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            },
          }}
        />
      </Stack>

      {/* Code area */}
      <Box
        sx={{
          overflow: 'auto',
          maxHeight: '65vh',
          minHeight: 280,
          px: 2,
          py: 1.5,
        }}
      >
        <JsonSyntaxHighlighter content={content} />
      </Box>

      {/* Panel footer */}
      <Divider sx={{ borderColor: '#30363d' }} />

      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{
          px: 2,
          py: 1,
          bgcolor: '#161b22',
        }}
      >
        <Box
          sx={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            bgcolor: '#3fb950',
          }}
        />

        <Typography variant="caption" sx={{ color: '#8b949e' }}>
          JSON
        </Typography>
      </Stack>
    </Paper>
  );
};

export const TokenMapCompareView = ({
  left,
  right,
}: TokenMapCompareViewProps) => {
  return (
    <Stack spacing={2} sx={{ width: '100%', minWidth: 0 }}>
      {/* Compare heading */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        spacing={1}
      >
        <Box>
          <Typography variant="h6" fontWeight={700}>
            Compare Token Maps
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Review configurations side by side
          </Typography>
        </Box>

        <Chip size="small" variant="outlined" label="Side-by-side view" />
      </Stack>

      {/* Compare panels */}
      <Grid container spacing={2} alignItems="stretch">
        <Grid size={{ xs: 12, md: 6 }} sx={{ minWidth: 0 }}>
          <CodePanel {...left} />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }} sx={{ minWidth: 0 }}>
          <CodePanel {...right} />
        </Grid>
      </Grid>
    </Stack>
  );
};
