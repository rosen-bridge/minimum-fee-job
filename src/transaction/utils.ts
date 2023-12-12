import * as wasm from "ergo-lib-wasm-nodejs";
import { AssetBalance, SinglePayment, TokenInfo } from "./types";
import { feeConfigToRegisterValues } from "../utils/utils";
import { BoxInfo, ErgoBoxProxy } from "@rosen-bridge/ergo-box-selection";

/**
 * extracts box id and assets of a box
 * @param box the box
 * @returns an object containing the box id and assets
 */
export const getBoxInfo = (box: ErgoBoxProxy): BoxInfo => {
  return {
    id: box.boxId,
    assets: {
      nativeToken: BigInt(box.value),
      tokens: box.assets.map((token) => ({
        id: token.tokenId,
        value: BigInt(token.amount),
      })),
    },
  };
};

/**
 * gets Ergo box assets
 * @param box the Ergo box
 */
export const getBoxAssets = (box: wasm.ErgoBoxCandidate): AssetBalance => {
  const tokens: Array<TokenInfo> = [];
  for (let i = 0; i < box.tokens().len(); i++) {
    const token = box.tokens().get(i);
    tokens.push({
      id: token.id().to_str(),
      value: BigInt(token.amount().as_i64().to_str()),
    });
  }

  // get box id and return box info
  return {
    nativeToken: BigInt(box.value().as_i64().to_str()),
    tokens: tokens,
  };
};

/**
 * creates minimum-fee config box
 * @param currentHeight 
 * @param order 
 * @returns 
 */
export const createBox = (
  currentHeight: number,
  order: SinglePayment,
): wasm.ErgoBoxCandidate => {
  const boxBuilder = new wasm.ErgoBoxCandidateBuilder(
    wasm.BoxValue.from_i64(
      wasm.I64.from_str(order.assets.nativeToken.toString())
    ),
    wasm.Contract.new(
      wasm.Address.from_base58(order.address).to_ergo_tree()
    ),
    currentHeight
  );
  // add box tokens
  order.assets.tokens.forEach((token) =>
    boxBuilder.add_token(
      wasm.TokenId.from_str(token.id),
      wasm.TokenAmount.from_i64(wasm.I64.from_str(token.value.toString()))
    )
  );
  // add box registers
  const registers = feeConfigToRegisterValues(order.feeConfig)
  // R4
  boxBuilder.set_register_value(
    4,
    wasm.Constant.from_coll_coll_byte(registers.R4.map(chain => Buffer.from(chain)))
  );
  // R5 -> R9
  boxBuilder.set_register_value(5, wasm.Constant.from_js(registers.R5));
  boxBuilder.set_register_value(6, wasm.Constant.from_js(registers.R6));
  boxBuilder.set_register_value(7, wasm.Constant.from_js(registers.R7));
  boxBuilder.set_register_value(8, wasm.Constant.from_js(registers.R8));
  boxBuilder.set_register_value(9, wasm.Constant.from_js(registers.R9));

  // build and add box
  return boxBuilder.build();
}

/**
 * sums two AssetBalance
 * @param a first AssetBalance object
 * @param b second AssetBalance object
 * @returns aggregated AssetBalance
 */
export const sumAssetBalance = (a: AssetBalance, b: AssetBalance): AssetBalance => {
  // sum native token
  const nativeToken = a.nativeToken + b.nativeToken;
  const tokens: Array<TokenInfo> = [];

  // add all tokens to result
  [...a.tokens, ...b.tokens].forEach((token) => {
    const targetToken = tokens.find((item) => item.id === token.id);
    if (targetToken) targetToken.value += token.value;
    else tokens.push(structuredClone(token));
  });

  return {
    nativeToken,
    tokens,
  };
};

/**
 * subtracts two AssetBalance
 * @param a first AssetBalance object
 * @param b second AssetBalance object
 * @param minimumNativeToken minimum allowed native token
 * @param allowNegativeNativeToken if true, sets nativeToken as 0 instead of throwing error
 * @returns reduced AssetBalance
 */
export const subtractAssetBalance = (
  a: AssetBalance,
  b: AssetBalance,
  minimumNativeToken = 0n,
  allowNegativeNativeToken = false
): AssetBalance => {
  // sum native token
  let nativeToken = 0n;
  if (a.nativeToken > b.nativeToken + minimumNativeToken)
    nativeToken = a.nativeToken - b.nativeToken;
  else if (allowNegativeNativeToken) nativeToken = 0n;
  else
    throw new Error(
      `Cannot reduce native token: [${a.nativeToken.toString()}] is less than [${b.nativeToken.toString()} + ${minimumNativeToken.toString()}]`
    );

  // reduce all `b` tokens
  const tokens = structuredClone(a.tokens);
  b.tokens.forEach((token) => {
    const index = tokens.findIndex((item) => item.id === token.id);
    if (index !== -1) {
      if (tokens[index].value > token.value)
        tokens[index].value -= token.value;
      else if (tokens[index].value === token.value) tokens.splice(index, 1);
      else
        throw new Error(
          `Cannot reduce token [${token.id}]: [${tokens[
            index
          ].value.toString()}] is less than [${token.value.toString()}]`
        );
    } else
      throw new Error(
        `Cannot reduce token [${token.id}]: Token not found`
      );
  });

  return {
    nativeToken,
    tokens,
  };
};
