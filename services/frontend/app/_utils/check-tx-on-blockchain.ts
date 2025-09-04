import * as wasm from "ergo-lib-wasm-nodejs";
import { Err, Ok } from "ts-results-es";

import {
  TxDataExtractionError,
  TxFetchingFromExplorerError,
} from "@/app/_error/tx";

/**
 * Check if tx is already on blockchain, returning true if it does
 * @param tx
 */
const checkTxOnBlockchain = async (tx: string) => {
  try {
    const parsed: { reducedTx: string } = JSON.parse(tx);
    const reducedTxBytes = Buffer.from(parsed.reducedTx, "base64");
    const txId = wasm.ReducedTransaction.sigma_parse_bytes(reducedTxBytes)
      .unsigned_tx()
      .id()
      .to_str();

    try {
      const result = await fetch(
        `https://api.ergoplatform.com/api/v1/transactions/${txId}`
      );

      return Ok(result.status !== 404);
    } catch (error) {
      return Err(new TxFetchingFromExplorerError(error));
    }
  } catch (error) {
    return Err(new TxDataExtractionError(error));
  }
};

export default checkTxOnBlockchain;
