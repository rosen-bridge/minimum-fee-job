import { every, map, mapValues, omitBy, uniq } from "lodash-es";

import getFeesByToken from "../_utils/get-fees-by-token";

import { Validate } from "./types";

/**
 * Validate that bridgeFee, feeRatio, rsnRatio, and rsnRatioDivisor is the same
 * in the new config for all chains
 * @param tokenId
 */
const validateConfigSameness: Validate = async (tokenId) => {
  const feesByTokenResult = await getFeesByToken();

  if (feesByTokenResult.error) {
    return feesByTokenResult;
  }

  const feesByToken = feesByTokenResult.value;

  const fees = feesByToken[tokenId];
  const newFeeConfigs = fees.at(-1)!.configs;

  const configs = {
    bridgeFees: map(newFeeConfigs, "bridgeFee"),
    feeRatios: map(newFeeConfigs, "feeRatio"),
    rsnRatios: map(newFeeConfigs, "rsnRatio"),
    rsnRatioDivisors: map(newFeeConfigs, "rsnRatioDivisor"),
  };

  const uniqConfigs = mapValues(configs, uniq);

  const isValid = every(uniqConfigs, ["length", 1]);

  return {
    error: null,
    value: {
      isValid,
      reason: !isValid
        ? `Inter-chain differences: ${JSON.stringify(
            mapValues(omitBy(uniqConfigs, ["length", 1]), (config) =>
              config.map(String)
            )
          )}`
        : null,
    },
  };
};

export default validateConfigSameness;
