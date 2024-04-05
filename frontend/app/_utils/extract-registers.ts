import * as wasm from "ergo-lib-wasm-nodejs";

/**
 * extract registers of outputs of a reduced tx that are required for min fee
 * validations
 * @param tx
 */
const extractRegisters = (tx: string) => {
  const reducedTxBase64 = JSON.parse(tx).reducedTx;
  const reducedTx = wasm.ReducedTransaction.sigma_parse_bytes(
    Buffer.from(reducedTxBase64, "base64")
  );
  const unsignedTx = reducedTx.unsigned_tx();

  const configErgoTree = wasm.Address.from_base58(process.env.CONFIG_ADDRESS!)
    .to_ergo_tree()
    .to_base16_bytes();

  const registers = Array.from({
    length: unsignedTx.output_candidates().len(),
  }).map((_, index) => {
    const output = unsignedTx.output_candidates().get(index);
    const outputErgoTree = output.ergo_tree().to_base16_bytes();

    if (outputErgoTree === configErgoTree) {
      const token =
        output.tokens().len() === 1
          ? "ERG"
          : output.tokens().get(1).id().to_str();

      const r4 = output
        .register_value(4)
        ?.to_js()
        .map((chainByte: any[]) => Buffer.from(chainByte).toString());

      const r5To9 = Array.from({ length: 5 }).map((_, rIndex) => {
        return output.register_value(rIndex + 5)?.to_js();
      });

      return {
        token,
        r4,
        r5: r5To9[0],
        r6: r5To9[1],
        r7: r5To9[2],
        r8: r5To9[3],
        r9: r5To9[4],
      };
    }
  });

  return registers;
};

export default extractRegisters;
