import { Fee } from "@rosen-bridge/minimum-fee";

import { getTx } from "@/app/_store";
import extractTxData from "@/app/_utils/extract-tx-data";

import { Result } from "../_types/result";

/**
 * Get a Result object containing either fees config indexed by token id, or an
 * error
 */
const getFeesByToken = async (): Promise<
  Result<Record<string, Fee[]>, Error>
> => {
  let tx: string;
  try {
    const possibleTx = await getTx();
    if (!possibleTx) {
      throw new Error("Tx was fetched from the store, but it was null");
    }
    tx = possibleTx;
  } catch (error) {
    if (error instanceof Error) {
      return {
        error,
        value: null,
      };
    }
    return {
      error: new Error(
        "An unknown error occurred while fetching tx data from the store"
      ),
      value: null,
    };
  }

  try {
    const feesByToken = extractTxData(tx);
    return {
      error: null,
      value: feesByToken,
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        error,
        value: null,
      };
    }
    return {
      error: new Error("An unknown error occurred while extracting tx data"),
      value: null,
    };
  }
};

export default getFeesByToken;
