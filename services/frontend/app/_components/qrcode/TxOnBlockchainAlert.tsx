import { Alert } from "@mui/material";
import { Err } from "ts-results-es";

import { getTx } from "@/app/_store";
import checkTxOnBlockchain from "@/app/_utils/check-tx-on-blockchain";

const TxOnBlockchainAlert = async ({
  txResult,
}: {
  txResult: Awaited<ReturnType<typeof getTx>>;
}) => {
  const isTxOnBlockchainResult = txResult.isOk()
    ? await checkTxOnBlockchain(txResult.value)
    : Err(txResult.error);

  return (
    <Alert
      severity={
        isTxOnBlockchainResult.isErr() || isTxOnBlockchainResult.value
          ? "error"
          : "success"
      }
      className="!rounded-t-2xl"
    >
      {isTxOnBlockchainResult.isErr()
        ? `An error occurred: ${isTxOnBlockchainResult.error.message}`
        : isTxOnBlockchainResult.value
        ? "Tx already exists on blockchain"
        : "Tx is new and does not exist on blockchain"}
    </Alert>
  );
};

export default TxOnBlockchainAlert;
