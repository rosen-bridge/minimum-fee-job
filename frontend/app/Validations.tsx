import { Info } from "@mui/icons-material";
import {
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
} from "@mui/material";
import { keyBy } from "lodash-es";
import { Suspense } from "react";
import { Result } from "ts-results-es";

import Validation from "./_components/validation/Validation";

import { getPrices, getTokensConfig } from "./_store";
import getFeesByToken from "./_utils/get-fees-by-token";
import validations from "./_validations";

/**
 * Render validations table
 */
const Validations = async () => {
  const feesByTokenResult = await getFeesByToken();
  const tokensConfigResult = await getTokensConfig();
  const pricesResult = await getPrices();

  const requirementsResults = Result.all(
    feesByTokenResult,
    tokensConfigResult,
    pricesResult
  );

  if (requirementsResults.isErr()) {
    return (
      <Grid
        container
        alignItems="center"
        justifyContent="center"
        sx={{ height: "40vh" }}
      >
        <Grid item sx={{ p: 2 }}>
          <Typography color="error" align="center" variant="h5">
            An error occurred before validation requirements are fulfilled:
            <br />
            {requirementsResults.error.message || "Unknown"}
          </Typography>
        </Grid>
      </Grid>
    );
  }

  const [feesByToken, tokensConfig, prices] = requirementsResults.value;

  const tokens = Object.keys(feesByToken);
  const tokensData = keyBy(tokensConfig, "ergoSideTokenId");

  const renderTableHead = () => (
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
  );

  const renderTableBody = () => (
    <TableBody>
      {tokens.map((token) => (
        <TableRow
          key={token}
          sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
        >
          <TableCell align="left">{tokensData[token].name}</TableCell>
          <TableCell align="left">
            {+(+prices[tokensData[token].tokenId]).toFixed(6) ||
              +(+prices[tokensData[token].tokenId]).toExponential(3)}
          </TableCell>
          {validations.map((validation) => (
            <TableCell align="center" key={validation.id}>
              <Suspense fallback={<CircularProgress size={10} />}>
                <Validation tokenId={token} validator={validation.validate} />
              </Suspense>
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  );

  return (
    <>
      <TableContainer>
        <Table>
          {renderTableHead()}
          {renderTableBody()}
        </Table>
      </TableContainer>
    </>
  );
};

export default Validations;
