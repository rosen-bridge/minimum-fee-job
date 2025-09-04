import { Box, Typography } from "@mui/material";

import QrDisplay from "./Qr.client";
import TxOnBlockchainAlert from "./TxOnBlockchainAlert";

import { getTx } from "../../_store";

/**
 * wrapper server component for the Qr component
 */
const Qr = async () => {
  const txResult = await getTx();

  return (
    <>
      <TxOnBlockchainAlert txResult={txResult} />
      {txResult.isOk() ? (
        <QrDisplay tx={txResult.value || ""} />
      ) : (
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

export default Qr;
