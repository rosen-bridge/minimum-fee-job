import { useMemo } from 'react';

import { Info } from '@mui/icons-material';
import {
  Box,
  CircularProgress,
  Grid,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';

import { useFeesByToken, usePrices, useTokenMap } from '@/queries';
import { getTokenInfo } from '@/utils';
import { validations } from '@/validations';

import { Validation } from './Validation';

/**
 * Render validations table
 */
export const Validations = () => {
  const feesByToken = useFeesByToken();
  const prices = usePrices();
  const tokenMap = useTokenMap();

  const error = feesByToken.error || prices.error || tokenMap.error;

  const loading =
    feesByToken.isLoading || prices.isLoading || tokenMap.isLoading;

  const tokens = useMemo(() => {
    if (!feesByToken.data || !prices.data || !tokenMap.data) return [];

    return Object.keys(feesByToken.data).map((tokenId) => {
      const token = getTokenInfo(tokenMap.data, tokenId);

      const price =
        +(+prices.data[token.tokenId]).toFixed(6) ||
        +(+prices.data[token.tokenId]).toExponential(3);

      return {
        price,
        ...token,
      };
    });
  }, [feesByToken.data, prices.data, tokenMap.data]);

  if (loading) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        minHeight={380}
      >
        Loading validations &nbsp;
        <CircularProgress size={12} />
      </Box>
    );
  }

  if (error) {
    return (
      <Grid
        container
        alignItems="center"
        justifyContent="center"
        sx={{ height: '40vh' }}
      >
        <Grid item sx={{ p: 2 }}>
          <Typography color="error" align="center" variant="h5">
            An error occurred before validation requirements are fulfilled:
            <br />
            {error.message || 'Unknown'}
          </Typography>
        </Grid>
      </Grid>
    );
  }

  return (
    <>
      <TableContainer className="max-h-[80vh] [clip-path:inset(0_round_1rem)]">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Token</TableCell>
              <TableCell className="border-l border-solid border-slate-300">
                Price ($USD)
              </TableCell>
              {validations.map((validation) => (
                <TableCell
                  align="center"
                  className="border-l border-solid border-slate-300"
                  key={validation.id}
                >
                  <Grid
                    container
                    flexWrap="nowrap"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Grid item>{validation.title}</Grid>
                    <Grid item>
                      <Tooltip title={validation.hint} placement="top">
                        <IconButton size="small">
                          <Info fontSize="inherit" />
                        </IconButton>
                      </Tooltip>
                    </Grid>
                  </Grid>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {tokens.map((token) => (
              <TableRow
                key={token.tokenId}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell align="left">{token.name}</TableCell>
                <TableCell align="left">{token.price}</TableCell>
                {validations.map((validation) => (
                  <TableCell align="center" key={validation.id}>
                    <Validation
                      tokenId={token.tokenId}
                      validator={validation.validate}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};
