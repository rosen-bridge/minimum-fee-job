import * as wasm from 'ergo-lib-wasm-nodejs';

import { DefaultLogger } from '@rosen-bridge/abstract-logger';
import { ErgoBoxSelection } from '@rosen-bridge/ergo-box-selection';
import JsonBigInt from '@rosen-bridge/json-bigint';

import { minimumFeeConfigs } from '../configs';
import {
  getAddressBoxes,
  getErgoHeight,
  getStateContext,
} from '../network/clients';
import { AssetBalance, ConfigOrder, TransactionEIP19 } from './types';
import { getBoxAssets, subtractAssetBalance, sumAssetBalance } from './utils';

const logger = DefaultLogger.getInstance().child(import.meta.url);
const boxSelection = new ErgoBoxSelection(
  DefaultLogger.getInstance().child(`ergo-box-selection`),
);

/**
 * generates unsigned transaction for config order
 * @param order the order order (list of single payments)
 * @param inputs the inputs for transaction
 * @returns the generated transaction
 */
export const generateTransaction = async (
  order: ConfigOrder,
  inputs: Array<wasm.ErgoBox>,
): Promise<TransactionEIP19> => {
  logger.debug(
    `Generating Ergo transaction for Order: ${JsonBigInt.stringify(order)}`,
  );
  // calculate required assets
  const orderRequiredAssets = order
    .map((order) => order.assets)
    .reduce(sumAssetBalance, { nativeToken: 0n, tokens: [] });
  logger.debug(
    `Order required assets: ${JsonBigInt.stringify(orderRequiredAssets)}`,
  );
  const inputAssets = inputs
    .map((box) => boxSelection.getBoxInfo(box).assets)
    .reduce(sumAssetBalance, { nativeToken: 0n, tokens: [] });
  logger.debug(
    `Pre-selected boxes assets: ${JsonBigInt.stringify(inputAssets)}`,
  );
  const requiredAssets = subtractAssetBalance(
    orderRequiredAssets,
    inputAssets,
    0n,
    true,
  );
  logger.debug(`Required assets: ${JsonBigInt.stringify(requiredAssets)}`); // it does not consider required Erg for change box and tx fee, which is calculated by the selection package

  // call getCovering to get enough boxes
  const coveredBoxes = await boxSelection.getCoveringBoxes(
    requiredAssets,
    [],
    new Map(),
    (await getAddressBoxes(minimumFeeConfigs.feeAddress)).values(),
    minimumFeeConfigs.minBoxErg,
    undefined,
    () => minimumFeeConfigs.txFee,
  );

  // check if boxes covered requirements
  if (!coveredBoxes.covered) {
    const neededErgs = requiredAssets.nativeToken.toString();
    const neededTokens = JsonBigInt.stringify(requiredAssets.tokens);
    throw new Error(
      `Available boxes didn't cover required assets. Erg: ${neededErgs}, Tokens: ${neededTokens}`,
    );
  }

  // add boxes to input list
  inputs.push(...coveredBoxes.boxes);

  // generate input boxes objects
  let remainingAssets: AssetBalance = {
    nativeToken: 0n,
    tokens: [],
  };
  const inErgoBoxes = wasm.ErgoBoxes.empty();
  inputs.forEach((box) => {
    inErgoBoxes.add(box);

    // add box assets to `remainingAssets`
    remainingAssets = sumAssetBalance(remainingAssets, getBoxAssets(box));
  });
  logger.debug(`Input assets: ${JsonBigInt.stringify(remainingAssets)}`);

  // generate output boxes objects
  const outBoxCandidates = wasm.ErgoBoxCandidates.empty();
  const currentHeight = await getErgoHeight();
  order.forEach((order) => {
    // build and add box
    const box = order.box;
    outBoxCandidates.add(box);

    // reduce box assets from `remainingAssets`
    remainingAssets = subtractAssetBalance(
      remainingAssets,
      getBoxAssets(box),
      minimumFeeConfigs.minBoxErg,
    );
  });
  logger.debug(`Remaining assets: ${JsonBigInt.stringify(remainingAssets)}`);

  // create change box
  const boxBuilder = new wasm.ErgoBoxCandidateBuilder(
    wasm.BoxValue.from_i64(
      wasm.I64.from_str(
        (remainingAssets.nativeToken - minimumFeeConfigs.txFee).toString(),
      ),
    ),
    wasm.Contract.new(
      wasm.Address.from_base58(minimumFeeConfigs.feeAddress).to_ergo_tree(),
    ),
    currentHeight,
  );
  // add change box tokens
  remainingAssets.tokens.forEach((token) =>
    boxBuilder.add_token(
      wasm.TokenId.from_str(token.id),
      wasm.TokenAmount.from_i64(wasm.I64.from_str(token.value.toString())),
    ),
  );
  // build and add change box
  const changeBox = boxBuilder.build();
  outBoxCandidates.add(changeBox);

  // create the box selector in tx builder
  const inBoxSelection = new wasm.BoxSelection(
    inErgoBoxes,
    new wasm.ErgoBoxAssetsDataList(),
  );

  // create the transaction
  const txCandidate = wasm.TxBuilder.new(
    inBoxSelection,
    outBoxCandidates,
    currentHeight,
    wasm.BoxValue.from_i64(
      wasm.I64.from_str(minimumFeeConfigs.txFee.toString()),
    ),
    wasm.Address.from_base58(minimumFeeConfigs.feeAddress),
  );
  const tx = txCandidate.build();

  // create ReducedTransaction object
  const ctx = await getStateContext();
  const reducedTx = wasm.ReducedTransaction.from_unsigned_tx(
    tx,
    inErgoBoxes,
    wasm.ErgoBoxes.empty(),
    ctx,
  );

  // create PaymentTransaction object
  const serializedTx = Buffer.from(reducedTx.sigma_serialize_bytes()).toString(
    'base64',
  );
  const ergoTx: TransactionEIP19 = {
    reducedTx: serializedTx,
    sender: minimumFeeConfigs.feeAddress,
    inputs: inputs.map((input) =>
      Buffer.from(input.sigma_serialize_bytes()).toString('base64'),
    ),
  };

  return ergoTx;
};
