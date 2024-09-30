import { Fee } from "@rosen-bridge/minimum-fee";
import { extractFeeFromBox } from "@rosen-bridge/minimum-fee/dist/lib/utils";
import * as wasm from "ergo-lib-wasm-nodejs";

/**
 * extract data from the reduced tx that is going to be used for fee update
 * @param tx Transaction created by the backend job
 */
const extractTxData = (tx: string) => {
  const reducedTxBase64 = JSON.parse(tx).reducedTx;
  const reducedTx = wasm.ReducedTransaction.sigma_parse_bytes(
    Buffer.from(reducedTxBase64, "base64")
  );
  const unsignedTx = reducedTx.unsigned_tx();

  const minimumFeeConfigErgoTree = wasm.Address.from_base58(
    process.env.MINIMUM_FEE_CONFIG_ADDRESS!
  )
    .to_ergo_tree()
    .to_base16_bytes();

  /**
   * get tx output at index
   * @param index
   */
  const getTxOutputByIndex = (index: number) =>
    unsignedTx.output_candidates().get(index);

  /**
   * predicate used to filter tx outputs that belong to minimum fee config
   * address
   */
  const isMinimumFeeConfigBox = (_: unknown, index: number) => {
    const output = getTxOutputByIndex(index);
    const outputErgoTree = output.ergo_tree().to_base16_bytes();
    return outputErgoTree === minimumFeeConfigErgoTree;
  };

  /**
   * get the token name associated with a minimum fee config box
   * @param output
   */
  const getTokenAssociatedWithOutput = (output: wasm.ErgoBoxCandidate) =>
    output.tokens().len() === 1
      ? output.tokens().get(0).id().to_str()
      : output.tokens().get(1).id().to_str();

  const feesByToken = Array.from({
    length: unsignedTx.output_candidates().len(),
  })
    .filter(isMinimumFeeConfigBox)
    .reduce<Record<string, Fee[]>>((partialFeesByToken, _, index) => {
      const output = getTxOutputByIndex(index);
      return {
        ...partialFeesByToken,
        [getTokenAssociatedWithOutput(output)]: extractFeeFromBox(
          output as any
        ),
      };
    }, {});

  return feesByToken;
};
export default extractTxData;
