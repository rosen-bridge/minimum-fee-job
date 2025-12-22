'use server';

import * as wasm from 'ergo-lib-wasm-nodejs';
import { Buffer } from 'node:buffer';

import { TxDataExtractionError, TxFetchingFromExplorerError } from '@/error';
import { wrap } from '@/safeServerAction';

/**
 * Check if tx is already on blockchain, returning true if it does
 * @param tx
 */
export const checkTxOnBlockchain = async (tx: string) => {
  try {
    const parsed: { reducedTx: string } = JSON.parse(tx);
    const reducedTxBytes = Buffer.from(parsed.reducedTx, 'base64');
    const txId = wasm.ReducedTransaction.sigma_parse_bytes(reducedTxBytes)
      .unsigned_tx()
      .id()
      .to_str();

    try {
      const result = await fetch(
        `https://api.ergoplatform.com/api/v1/transactions/${txId}`,
      );

      return result.status !== 404;
    } catch (error) {
      throw new TxFetchingFromExplorerError(error);
    }
  } catch (error) {
    throw new TxDataExtractionError(error);
  }
};

export const checkTxOnBlockchainSafe = wrap(checkTxOnBlockchain);
