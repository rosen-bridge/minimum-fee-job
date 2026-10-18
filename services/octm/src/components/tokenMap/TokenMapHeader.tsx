import { Box, Stack, Typography, ThemeToggle } from '../ui';

export const TokenMapHeader = () => (
  <Box>
    <Typography
      variant="overline"
      sx={{
        color: 'text.secondary',
        letterSpacing: '0.14em',
        fontWeight: 700,
      }}
    >
      ROSEN BRIDGE
    </Typography>
    <Stack>
      <Typography
        variant="h4"
        sx={{ fontWeight: 700, letterSpacing: '-0.04em' }}
      >
        Token Map
      </Typography>
      <ThemeToggle />
    </Stack>
  </Box>
);
