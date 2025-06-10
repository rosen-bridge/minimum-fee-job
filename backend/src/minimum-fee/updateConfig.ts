import {
  ErgoNetworkType,
  MinimumFeeBox,
  MinimumFeeBoxBuilder,
  MinimumFeeConfig,
} from '@rosen-bridge/minimum-fee';
import {
  bridgeFeeTriggerPercent,
  feeGuaranteeDuration,
  minimumFeeConfigs,
  networkFeeTriggerPercent,
  rsnRatioTriggerPercent,
  urls,
} from '../configs';
import { getConfigDifferencePercent } from '../utils/utils';
import { DefaultLoggerFactory } from '@rosen-bridge/abstract-logger';
import { SUPPORTED_CHAINS } from '../utils/consts';
import { Chains, FeeDifferencePercents, UpdatedFeeConfig } from '../types';
import JsonBigInt from '@rosen-bridge/json-bigint';

const logger = DefaultLoggerFactory.getInstance().getLogger(import.meta.url);

export const updateAndGenerateFeeConfig = async (
  newConfigs: Map<string, MinimumFeeConfig>,
  chainHeights: Map<Chains, number>
) => {
  const updatedFeeConfigs: Map<string, UpdatedFeeConfig> = new Map();
  const feeDifferences: Map<string, FeeDifferencePercents | undefined> =
    new Map();
  for (const token of minimumFeeConfigs.supportedTokens) {
    logger.debug(`Combining old and new config of token [${token.name}]`);
    const newConfig = newConfigs.get(token.tokenId)!;

    const result = await updateFeeConfig(
      token.ergoSideTokenId,
      newConfig,
      chainHeights
    );
    const feeConfig = result.config;
    feeDifferences.set(token.tokenId, result.differencePercent);
    if (feeConfig.new)
      updatedFeeConfigs.set(token.tokenId, {
        current: feeConfig.current,
        new: feeConfig.new,
      });
  }
  return {
    config: updatedFeeConfigs,
    feeDifferences: feeDifferences,
  };
};

const updateFeeConfig = async (
  tokenId: string,
  newFeeConfig: MinimumFeeConfig,
  chainHeights: Map<Chains, number>
): Promise<{
  config: {
    current: MinimumFeeBox;
    new: MinimumFeeBoxBuilder | undefined;
  };
  differencePercent: FeeDifferencePercents | undefined;
}> => {
  const tokenMinimumFeeBox = new MinimumFeeBox(
    tokenId,
    minimumFeeConfigs.minimumFeeNFT,
    ErgoNetworkType.explorer,
    urls.ergoExplorer,
    logger
  );
  for (let i = 0; i < minimumFeeConfigs.fetchBoxRetry; i++) {
    const res = await tokenMinimumFeeBox.fetchBox();
    if (res) break;
  }
  const box = tokenMinimumFeeBox.getBox();
  if (box) {
    logger.debug(`Found a config for token [${tokenId}]`);
    const builder = await cleanOldConfig(tokenMinimumFeeBox, chainHeights);

    // calculate config differences
    const differencePercent = getConfigDifferencePercent(
      builder.getConfigs().at(-1)!,
      newFeeConfig.getConfig()
    );

    // check any chain is added or removed
    const isChainAddedOrRemoved = false; // TODO: implement (local:ergo/rosen-bridge/minimum-fee-job#12)
    // check if fee difference is sufficient for update
    const isFeeDifferenceSufficient =
      differencePercent.bridgeFee.value <= bridgeFeeTriggerPercent ||
      differencePercent.rsnRatio.value <= rsnRatioTriggerPercent ||
      SUPPORTED_CHAINS.some(
        (chain) =>
          differencePercent.networkFee[chain] !== undefined &&
          differencePercent.networkFee[chain]!.value <=
            networkFeeTriggerPercent[chain]!
      );

    if (!isChainAddedOrRemoved && !isFeeDifferenceSufficient) {
      logger.debug(
        `token [${tokenId}] config difference is not sufficient for update`
      );
      return {
        config: {
          current: tokenMinimumFeeBox,
          new: undefined,
        },
        differencePercent: differencePercent,
      };
    } else {
      logger.debug(
        `trigger condition for token [${tokenId}]: ${JsonBigInt.stringify([
          [differencePercent.bridgeFee, bridgeFeeTriggerPercent],
          [differencePercent.rsnRatio, rsnRatioTriggerPercent],
          ...SUPPORTED_CHAINS.map((chain) => [
            differencePercent.networkFee[chain],
            networkFeeTriggerPercent[chain],
          ]),
        ])}`
      );
      // add new config
      builder.addConfig(newFeeConfig).prune();
      return {
        config: {
          current: tokenMinimumFeeBox,
          new: builder,
        },
        differencePercent: differencePercent,
      };
    }
  } else {
    logger.debug(
      `No config found for token [${tokenId}]. Generating config with only the new one...`
    );
    const currentErgoHeight = chainHeights.get(Chains.ERGO)!;

    const builder = new MinimumFeeBoxBuilder(
      minimumFeeConfigs.minimumFeeNFT,
      minimumFeeConfigs.minimumFeeAddress
    );
    builder
      .setHeight(currentErgoHeight)
      .setToken(tokenId)
      .setValue(minimumFeeConfigs.minBoxErg)
      .addConfig(newFeeConfig)
      .prune();

    return {
      config: {
        current: tokenMinimumFeeBox,
        new: builder,
      },
      differencePercent: undefined,
    };
  }
};

const cleanOldConfig = async (
  tokenMinimumFeeBox: MinimumFeeBox,
  chainHeights: Map<Chains, number>
) => {
  const getCurrentHeight = (chain: Chains) => {
    const currentHeight = chainHeights.get(chain);
    if (!currentHeight)
      throw Error(
        `Impossible behavior: chain [${chain}] is supported but its height is not fetched`
      );
    return currentHeight;
  };

  // convert to builder
  const builder = tokenMinimumFeeBox.toBuilder();
  builder.setHeight(getCurrentHeight(Chains.ERGO));
  const fees = builder.getConfigs();

  // remove unused configs
  let i = 0;
  let configIsPassed = false;
  for (i = fees.length - 1; i >= 0; i--) {
    for (const chain of SUPPORTED_CHAINS) {
      const currentHeight = getCurrentHeight(chain);
      if (
        Object.hasOwn(fees[i].heights, chain) &&
        fees[i].heights[chain] <= currentHeight
      ) {
        configIsPassed = true;
        break;
      }
    }
    if (configIsPassed) break;
    builder.removeConfig(i);
  }

  // remove old configs
  let allHeightsAreSafeToRemove = false;
  for (; i >= 0; i--) {
    if (allHeightsAreSafeToRemove) builder.removeConfig(i);

    const heightsAreNotSafe = SUPPORTED_CHAINS.some((chain) => {
      const currentHeight = getCurrentHeight(chain);
      const feeGuaranteeGap = feeGuaranteeDuration.get(chain);
      if (!feeGuaranteeGap)
        throw Error(
          `Impossible behavior: chain [${chain}] is supported but its fee guarantee gap is not set`
        );

      if (Object.hasOwn(fees[i].heights, chain))
        return fees[i].heights[chain] >= currentHeight - feeGuaranteeGap;
      else return false;
    });
    if (!heightsAreNotSafe) allHeightsAreSafeToRemove = true;
  }

  return builder;
};
