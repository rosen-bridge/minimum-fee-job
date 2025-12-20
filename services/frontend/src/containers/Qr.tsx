import { Box, CircularProgress, Typography } from '@mui/material';

import { QrDisplay } from '@/components';
import { TxOnBlockchainAlert } from '@/containers';
import { useTx } from '@/queries';

/**
 * Qr container
 */
export const Qr = () => {
  const { data, isLoading, isError } = useTx();
  return (
    <>
      <TxOnBlockchainAlert />
      {isLoading && (
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          minHeight={380}
        >
          Loading tx &nbsp;
          <CircularProgress size={12} />
        </Box>
      )}
      {!isLoading && !isError && data && <QrDisplay tx={data || ''} />}
      {!isLoading && isError && (
        <Box
          width={380}
          height={380}
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          p={2}
        >
          <Typography variant="h6" color="error" align="center">
            An error occurred while fetching tx from the store
          </Typography>
        </Box>
      )}
    </>
  );
};
