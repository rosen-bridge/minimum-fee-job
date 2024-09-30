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
import { Suspense } from "react";

import Validation from "./_components/validation/Validation";

import getFeesByToken from "./_utils/get-fees-by-token";

import { Info } from "@mui/icons-material";
import validations from "./_validations";

/**
 * Render validations table
 */
const Validations = async () => {
  const feesByTokenResult = await getFeesByToken();

  if (feesByTokenResult.isErr()) {
    return (
      <Grid
        container
        alignItems="center"
        justifyContent="center"
        sx={{ height: "40vh" }}
      >
        <Grid item sx={{ p: 2 }}>
          <Typography color="error" align="center" variant="h5">
            An error occurred during extraction of tokens from the tx:
            <br />
            {feesByTokenResult.error.message || "Unknown"}
          </Typography>
        </Grid>
      </Grid>
    );
  }

  const tokens = Object.keys(feesByTokenResult.value);

  const renderTableHead = () => (
    <TableHead>
      <TableRow>
        <TableCell>Token</TableCell>
        {validations.map((validation) => (
          <TableCell align="center" key={validation.id}>
            <Grid container flexWrap="nowrap" alignItems="center">
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
          <TableCell align="left">{token}</TableCell>
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
