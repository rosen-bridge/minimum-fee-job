import { BridgeMinimumFee } from '@rosen-bridge/minimum-fee-v0';
import {
  ChainMinimumFee,
  ErgoNetworkType,
  Fee,
  MinimumFeeBox,
} from '@rosen-bridge/minimum-fee-v1';
import WinstonLogger from '@rosen-bridge/winston-logger';
import JsonBigInt from '@rosen-bridge/json-bigint';
import { explorerBaseUrl, minimumFeeConfigs } from '../configs';
import { FeeConfig, Fee as V0Fee } from '../types';
import { ErgoBox } from 'ergo-lib-wasm-nodejs';

const logger = WinstonLogger.getInstance().getLogger(import.meta.url);

const bridgeMinimumFee = new BridgeMinimumFee(
  explorerBaseUrl,
  minimumFeeConfigs.minimumFeeNFT
);

const FETCH_BOX_RETRY = 3;

export const replicateV1 = async () => {
  const updatedFeeConfigs: Map<string, FeeConfig> = new Map();
  for (const token of minimumFeeConfigs.supportedTokens) {
    logger.debug(`Replicating config of token [${token.name}]`);

    const feeConfig = await updateFeeConfig(token.ergoSideTokenId);
    if (feeConfig) updatedFeeConfigs.set(token.tokenId, feeConfig);
    else logger.debug(`No need to update token [${token.name}] config`);
  }
  return updatedFeeConfigs;
};

export const updateFeeConfig = async (tokenId: string) => {
  // fetch V0 config
  let v0Config: FeeConfig | undefined;
  try {
    v0Config = await bridgeMinimumFee.search(tokenId);
    logger.debug(`Found a config for token [${tokenId}].`);
  } catch (e) {
    logger.debug(
      `No config found for token [${tokenId}]. Generating config with only the new one...`
    );
  }

  // fetch V1 config
  const tokenMinimumFeeBox = new MinimumFeeBox(
    tokenId,
    minimumFeeConfigs.minimumFeeV1NFT,
    ErgoNetworkType.explorer,
    explorerBaseUrl,
    logger
  );
  for (let i = 0; i < FETCH_BOX_RETRY; i++) {
    const res = await tokenMinimumFeeBox.fetchBox();
    if (res) break;
  }
  const box = tokenMinimumFeeBox.getBox();

  if (v0Config && box) {
    const v0ErgoHeights = Object.keys(v0Config['ergo'])
      .map(Number)
      .sort((x: number, y: number) => y - x);

    const v1Config = extractFeeFromBox(box);
    const v1ErgoHeights = v1Config
      .map((fee) => fee.heights['ergo'])
      .sort((x: number, y: number) => y - x);

    if (v0ErgoHeights === v1ErgoHeights) return undefined;
    return convertV1ToV0(v1Config);
  } else {
    throw Error(
      `Both V0 and V1 config is necessary for replication. [V0: ${
        v0Config !== undefined
      }], [V1: ${box !== undefined}]`
    );
  }
};

const extractFeeFromBox = (box: ErgoBox): Array<Fee> => {
  const R4 = box.register_value(4);
  const R5 = box.register_value(5);
  const R6 = box.register_value(6);
  const R7 = box.register_value(7);
  const R8 = box.register_value(8);
  const R9 = box.register_value(9);

  if (!R4 || !R5 || !R6 || !R7 || !R8 || !R9)
    throw Error(
      `Incomplete register data for minimum-fee config box [${box
        .box_id()
        .to_str()}]`
    );

  const fees: Array<Fee> = [];
  const chains = R4.to_coll_coll_byte().map((element) =>
    Buffer.from(element).toString()
  );
  const heights = R5.to_js() as Array<Array<number>>;
  const bridgeFees = R6.to_js() as Array<Array<string>>;
  const networkFees = R7.to_js() as Array<Array<string>>;
  const rsnRatios = R8.to_js() as Array<Array<Array<string>>>;
  const feeRatios = R9.to_js() as Array<Array<string>>;

  for (let feeIdx = 0; feeIdx < heights.length; feeIdx++) {
    const fee: Fee = {
      heights: {},
      configs: {},
    };
    for (let chainIdx = 0; chainIdx < chains.length; chainIdx++) {
      const chain = chains[chainIdx];

      if (heights[feeIdx][chainIdx] === -1) continue;
      fee.heights[chain] = heights[feeIdx][chainIdx];

      if (bridgeFees[feeIdx][chainIdx] === '-1') continue;
      fee.configs[chain] = {
        bridgeFee: BigInt(bridgeFees[feeIdx][chainIdx]),
        networkFee: BigInt(networkFees[feeIdx][chainIdx]),
        rsnRatio: BigInt(rsnRatios[feeIdx][chainIdx][0]),
        rsnRatioDivisor: BigInt(rsnRatios[feeIdx][chainIdx][1]),
        feeRatio: BigInt(feeRatios[feeIdx][chainIdx]),
      };
    }
    fees.push(fee);
  }

  logger.debug(
    `Extracted fee config from box [${box
      .box_id()
      .to_str()}]: ${JsonBigInt.stringify(fees)}`
  );

  return fees;
};

const convertV1ToV0 = (v1: Array<Fee>): FeeConfig => {
  const v0: FeeConfig = {
    ergo: {},
    cardano: {},
  };

  v1.forEach((fee) => {
    const ergoConfigs = new ChainMinimumFee(fee.configs['ergo']);
    const cardanoConfigs = new ChainMinimumFee(fee.configs['cardano']);

    const rsnRatioDivisor = ergoConfigs.rsnRatioDivisor;
    const rsnRatio =
      (ergoConfigs.rsnRatio * bridgeMinimumFee.ratioDivisor) / rsnRatioDivisor;

    // add Ergo config
    const ergoFee: V0Fee = {
      bridgeFee: ergoConfigs.bridgeFee,
      networkFee: cardanoConfigs.networkFee,
      rsnRatio: rsnRatio,
      feeRatio: ergoConfigs.feeRatio,
    };

    // add Cardano config
    const cardanoFee: V0Fee = {
      bridgeFee: cardanoConfigs.bridgeFee,
      networkFee: ergoConfigs.networkFee,
      rsnRatio: rsnRatio,
      feeRatio: cardanoConfigs.feeRatio,
    };

    v0.ergo[fee.heights['ergo']] = ergoFee;
    v0.ergo[fee.heights['cardano']] = cardanoFee;
  });

  return v0;
};
