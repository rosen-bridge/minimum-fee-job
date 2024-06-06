import { BridgeMinimumFee } from '@rosen-bridge/minimum-fee-v0';
import {
  bridgeFeeTriggerPercent,
  cardanoNetworkFeeTriggerPercent,
  ergoNetworkFeeTriggerPercent,
  explorerBaseUrl,
  feeGuaranteeDurationOnCardano,
  feeGuaranteeDurationOnErgo,
  minimumFeeConfigs,
} from '../configs';
import { FeeConfig } from '../types';
import { getCardanoHeight, getErgoHeight } from '../network/clients';
import { concatFeeConfigs, getConfigDifferencePercent } from '../utils/utils';
import WinstonLogger from '@rosen-bridge/winston-logger';

const logger = WinstonLogger.getInstance().getLogger(import.meta.url);

const bridgeMinimumFee = new BridgeMinimumFee(
  explorerBaseUrl,
  minimumFeeConfigs.minimumFeeNFT
);

export const updateAndGenerateFeeConfig = async (
  newConfigs: Map<string, FeeConfig>
) => {
  const updatedFeeConfigs: Map<string, FeeConfig> = new Map();
  const bridgeFeeDifferences: Map<string, bigint | undefined> = new Map();
  for (const token of minimumFeeConfigs.supportedTokens) {
    logger.debug(`Combining old and new config of token [${token.name}]`);
    const newConfig = newConfigs.get(token.tokenId)!;

    const result = await updateFeeConfig(token.ergoSideTokenId, newConfig);
    const feeConfig = result.config;
    bridgeFeeDifferences.set(
      token.tokenId,
      result.differencePercent?.bridgeFee
    );
    if (feeConfig) updatedFeeConfigs.set(token.tokenId, feeConfig);
    else logger.debug(`No need to update token [${token.name}] config`);
  }
  return {
    config: updatedFeeConfigs,
    bridgeFeeDifferences: bridgeFeeDifferences,
  };
};

export const updateFeeConfig = async (
  tokenId: string,
  newFeeConfig: FeeConfig
) => {
  let oldConfig: FeeConfig | undefined;
  try {
    oldConfig = await bridgeMinimumFee.search(tokenId);
    logger.debug(`Found a config for token [${tokenId}].`);
  } catch (e) {
    logger.debug(
      `No config found for token [${tokenId}]. Generating config with only the new one...`
    );
  }

  if (oldConfig) {
    // delete old ergo configs
    const currentErgoHeight = await getErgoHeight();
    const feeErgoHeights = Object.keys(oldConfig['ergo'])
      .map(Number)
      .sort((x: number, y: number) => y - x);
    let heightsToRemove: string[] = [];
    let lastPassedHeightIndex = feeErgoHeights.length - 1;
    for (let i = 0; i < feeErgoHeights.length; i++) {
      if (feeErgoHeights[i] > currentErgoHeight)
        heightsToRemove.push(feeErgoHeights[i].toString());
      else {
        lastPassedHeightIndex = i;
        break;
      }
    }
    for (let i = lastPassedHeightIndex + 1; i < feeErgoHeights.length; i++) {
      if (feeErgoHeights[i] < currentErgoHeight - feeGuaranteeDurationOnErgo)
        heightsToRemove.push(feeErgoHeights[i].toString());
    }
    for (const height of heightsToRemove) delete oldConfig['ergo'][height];

    // delete old cardano configs
    const currentCardanoHeight = await getCardanoHeight();
    const feeCardanoHeights = Object.keys(oldConfig['cardano'])
      .map(Number)
      .sort((x: number, y: number) => y - x);
    heightsToRemove = [];
    lastPassedHeightIndex = feeCardanoHeights.length - 1;
    for (let i = 0; i < feeCardanoHeights.length; i++) {
      if (feeCardanoHeights[i] > currentCardanoHeight)
        heightsToRemove.push(feeCardanoHeights[i].toString());
      else {
        lastPassedHeightIndex = i;
        break;
      }
    }
    for (let i = lastPassedHeightIndex + 1; i < feeCardanoHeights.length; i++) {
      if (
        feeCardanoHeights[i] <
        currentCardanoHeight - feeGuaranteeDurationOnCardano
      )
        heightsToRemove.push(feeCardanoHeights[i].toString());
    }
    for (const height of heightsToRemove) delete oldConfig['cardano'][height];
  }

  const updatedConfig = oldConfig
    ? concatFeeConfigs(newFeeConfig, oldConfig)
    : newFeeConfig;
  let differencePercent;
  if (oldConfig) {
    differencePercent = getConfigDifferencePercent(oldConfig, updatedConfig);

    if (
      differencePercent.bridgeFee <= bridgeFeeTriggerPercent &&
      differencePercent.ergoNetworkFee <= ergoNetworkFeeTriggerPercent &&
      differencePercent.cardanoNetworkFee <= cardanoNetworkFeeTriggerPercent
    )
      return {
        config: undefined,
        differencePercent: differencePercent,
      };
  }

  return {
    config: updatedConfig,
    differencePercent: differencePercent,
  };
};
